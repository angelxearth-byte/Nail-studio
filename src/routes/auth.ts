import { Hono } from 'hono'
import { jwt, sign, verify } from 'hono/jwt'
import { getCookie, setCookie } from 'hono/cookie'
import type { Bindings, User, LoginRequest, RegisterRequest, AuthResponse } from '../types'

// For now, using simple password hashing (in production, use proper bcrypt)
const hashPassword = (password: string): string => {
  // This is a placeholder - in production use bcrypt
  return btoa(password + 'salt')
}

const verifyPassword = (password: string, hash: string): boolean => {
  return hashPassword(password) === hash
}

export const authRoutes = new Hono<{ Bindings: Bindings }>()

// JWT middleware for protected routes
const JWT_SECRET = 'your-jwt-secret-key' // In production, use environment variable

// Register new user
authRoutes.post('/register', async (c) => {
  try {
    const { email, password, first_name, last_name, referral_code }: RegisterRequest = await c.req.json()

    // Validate required fields
    if (!email || !password || !first_name || !last_name) {
      return c.json<AuthResponse>({ 
        success: false, 
        error: 'Missing required fields' 
      }, 400)
    }

    // Check if user already exists
    const existingUser = await c.env.DB.prepare(
      'SELECT id FROM users WHERE email = ?'
    ).bind(email).first()

    if (existingUser) {
      return c.json<AuthResponse>({ 
        success: false, 
        error: 'User already exists' 
      }, 400)
    }

    // Generate unique referral code
    const userReferralCode = `${first_name.toUpperCase()}${Date.now().toString(36).toUpperCase()}`

    // Check for referrer if referral_code provided
    let referrerId = null
    if (referral_code) {
      const referrer = await c.env.DB.prepare(
        'SELECT id FROM users WHERE referral_code = ?'
      ).bind(referral_code).first<{ id: number }>()
      
      if (referrer) {
        referrerId = referrer.id
      }
    }

    // Hash password
    const passwordHash = hashPassword(password)

    // Insert new user
    const result = await c.env.DB.prepare(`
      INSERT INTO users (email, password_hash, first_name, last_name, referral_code, referred_by, free_nails_balance)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(email, passwordHash, first_name, last_name, userReferralCode, referrerId, referrerId ? 1 : 0).run()

    if (!result.success) {
      return c.json<AuthResponse>({ 
        success: false, 
        error: 'Failed to create user' 
      }, 500)
    }

    // If referred, update referrer's stats and create referral record
    if (referrerId && result.meta?.last_row_id) {
      await c.env.DB.prepare(`
        UPDATE users SET total_referrals = total_referrals + 1, free_nails_balance = free_nails_balance + 1
        WHERE id = ?
      `).bind(referrerId).run()

      await c.env.DB.prepare(`
        INSERT INTO referrals (referrer_id, referee_id, referral_code, reward_type, reward_value, status)
        VALUES (?, ?, ?, 'free_nails', 1, 'completed')
      `).bind(referrerId, result.meta.last_row_id, referral_code).run()
    }

    // Get the created user
    const newUser = await c.env.DB.prepare(`
      SELECT id, email, first_name, last_name, subscription_status, referral_code, 
             total_referrals, free_nails_balance, created_at, updated_at
      FROM users WHERE id = ?
    `).bind(result.meta?.last_row_id).first<User>()

    if (!newUser) {
      return c.json<AuthResponse>({ 
        success: false, 
        error: 'User created but not found' 
      }, 500)
    }

    // Generate JWT token
    const payload = { 
      userId: newUser.id, 
      email: newUser.email,
      exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
    }
    const token = await sign(payload, JWT_SECRET)

    // Set cookie
    setCookie(c, 'auth_token', token, {
      maxAge: 7 * 24 * 60 * 60, // 7 days
      httpOnly: true,
      secure: true,
      sameSite: 'strict'
    })

    return c.json<AuthResponse>({ 
      success: true, 
      user: newUser, 
      token 
    }, 201)

  } catch (error) {
    console.error('Registration error:', error)
    return c.json<AuthResponse>({ 
      success: false, 
      error: 'Internal server error' 
    }, 500)
  }
})

// Login user
authRoutes.post('/login', async (c) => {
  try {
    const { email, password }: LoginRequest = await c.req.json()

    if (!email || !password) {
      return c.json<AuthResponse>({ 
        success: false, 
        error: 'Email and password required' 
      }, 400)
    }

    // Find user by email
    const user = await c.env.DB.prepare(`
      SELECT id, email, password_hash, first_name, last_name, subscription_status, 
             referral_code, total_referrals, free_nails_balance, created_at, updated_at
      FROM users WHERE email = ?
    `).bind(email).first<User & { password_hash: string }>()

    if (!user) {
      return c.json<AuthResponse>({ 
        success: false, 
        error: 'Invalid credentials' 
      }, 401)
    }

    // Verify password
    if (!verifyPassword(password, user.password_hash)) {
      return c.json<AuthResponse>({ 
        success: false, 
        error: 'Invalid credentials' 
      }, 401)
    }

    // Generate JWT token
    const payload = { 
      userId: user.id, 
      email: user.email,
      exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
    }
    const token = await sign(payload, JWT_SECRET)

    // Set cookie
    setCookie(c, 'auth_token', token, {
      maxAge: 7 * 24 * 60 * 60, // 7 days
      httpOnly: true,
      secure: true,
      sameSite: 'strict'
    })

    // Remove password_hash from response
    const { password_hash, ...userResponse } = user
    
    return c.json<AuthResponse>({ 
      success: true, 
      user: userResponse as User, 
      token 
    })

  } catch (error) {
    console.error('Login error:', error)
    return c.json<AuthResponse>({ 
      success: false, 
      error: 'Internal server error' 
    }, 500)
  }
})

// Get current user profile
authRoutes.get('/me', async (c) => {
  try {
    // Get token from cookie or Authorization header
    let token = getCookie(c, 'auth_token')
    if (!token) {
      const authHeader = c.req.header('Authorization')
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.substring(7)
      }
    }

    if (!token) {
      return c.json<AuthResponse>({ 
        success: false, 
        error: 'No authentication token' 
      }, 401)
    }

    // Verify JWT token
    const payload = await verify(token, JWT_SECRET) as { userId: number; email: string }
    
    if (!payload.userId) {
      return c.json<AuthResponse>({ 
        success: false, 
        error: 'Invalid token' 
      }, 401)
    }

    // Get user from database
    const user = await c.env.DB.prepare(`
      SELECT id, email, first_name, last_name, subscription_status, referral_code,
             total_referrals, free_nails_balance, created_at, updated_at
      FROM users WHERE id = ?
    `).bind(payload.userId).first<User>()

    if (!user) {
      return c.json<AuthResponse>({ 
        success: false, 
        error: 'User not found' 
      }, 404)
    }

    return c.json<AuthResponse>({ 
      success: true, 
      user 
    })

  } catch (error) {
    console.error('Auth verification error:', error)
    return c.json<AuthResponse>({ 
      success: false, 
      error: 'Invalid or expired token' 
    }, 401)
  }
})

// Logout user
authRoutes.post('/logout', async (c) => {
  // Clear the auth cookie
  setCookie(c, 'auth_token', '', {
    maxAge: 0,
    httpOnly: true,
    secure: true,
    sameSite: 'strict'
  })

  return c.json<AuthResponse>({ 
    success: true, 
    message: 'Logged out successfully' 
  })
})

// Middleware to verify JWT token (can be used by other routes)
export const authMiddleware = async (c: any, next: () => Promise<void>) => {
  try {
    let token = getCookie(c, 'auth_token')
    if (!token) {
      const authHeader = c.req.header('Authorization')
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.substring(7)
      }
    }

    if (!token) {
      return c.json({ success: false, error: 'Authentication required' }, 401)
    }

    const payload = await verify(token, JWT_SECRET) as { userId: number; email: string }
    
    if (!payload.userId) {
      return c.json({ success: false, error: 'Invalid token' }, 401)
    }

    // Add user info to context
    c.set('userId', payload.userId)
    c.set('userEmail', payload.email)
    
    await next()
  } catch (error) {
    return c.json({ success: false, error: 'Invalid or expired token' }, 401)
  }
}