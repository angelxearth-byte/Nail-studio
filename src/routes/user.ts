import { Hono } from 'hono'
import type { Bindings, User, UserAddress, CustomDesign, ApiResponse } from '../types'
import { authMiddleware } from './auth'

export const userRoutes = new Hono<{ Bindings: Bindings }>()

// All user routes require authentication
userRoutes.use('*', authMiddleware)

// Get user profile
userRoutes.get('/profile', async (c) => {
  try {
    const userId = c.get('userId')

    const user = await c.env.DB.prepare(`
      SELECT 
        id, email, first_name, last_name, phone, birth_date,
        subscription_status, subscription_start_date, subscription_end_date,
        referral_code, total_referrals, free_nails_balance, created_at
      FROM users 
      WHERE id = ?
    `).bind(userId).first<User>()

    if (!user) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: 'User not found' 
      }, 404)
    }

    return c.json<ApiResponse<User>>({
      success: true,
      data: user
    })

  } catch (error) {
    console.error('Get profile error:', error)
    return c.json<ApiResponse>({ 
      success: false, 
      error: 'Failed to fetch profile' 
    }, 500)
  }
})

// Update user profile
userRoutes.put('/profile', async (c) => {
  try {
    const userId = c.get('userId')
    const { first_name, last_name, phone, birth_date } = await c.req.json()

    // Validate required fields
    if (!first_name || !last_name) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: 'First name and last name are required' 
      }, 400)
    }

    // Update user
    await c.env.DB.prepare(`
      UPDATE users 
      SET first_name = ?, last_name = ?, phone = ?, birth_date = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(first_name, last_name, phone || null, birth_date || null, userId).run()

    return c.json<ApiResponse>({
      success: true,
      message: 'Profile updated successfully'
    })

  } catch (error) {
    console.error('Update profile error:', error)
    return c.json<ApiResponse>({ 
      success: false, 
      error: 'Failed to update profile' 
    }, 500)
  }
})

// Get user addresses
userRoutes.get('/addresses', async (c) => {
  try {
    const userId = c.get('userId')

    const addresses = await c.env.DB.prepare(`
      SELECT * FROM user_addresses 
      WHERE user_id = ? 
      ORDER BY is_default DESC, created_at DESC
    `).bind(userId).all<UserAddress>()

    return c.json<ApiResponse<UserAddress[]>>({
      success: true,
      data: addresses.results
    })

  } catch (error) {
    console.error('Get addresses error:', error)
    return c.json<ApiResponse>({ 
      success: false, 
      error: 'Failed to fetch addresses' 
    }, 500)
  }
})

// Add new address
userRoutes.post('/addresses', async (c) => {
  try {
    const userId = c.get('userId')
    const { 
      recipient_name, street_address, apartment, city, state, zip_code, 
      country = 'USA', is_default = false 
    } = await c.req.json()

    // Validate required fields
    if (!recipient_name || !street_address || !city || !state || !zip_code) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: 'Missing required address fields' 
      }, 400)
    }

    // If this is set as default, unset other default addresses
    if (is_default) {
      await c.env.DB.prepare(`
        UPDATE user_addresses SET is_default = FALSE WHERE user_id = ?
      `).bind(userId).run()
    }

    // Insert new address
    const result = await c.env.DB.prepare(`
      INSERT INTO user_addresses (
        user_id, recipient_name, street_address, apartment, city, 
        state, zip_code, country, is_default
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      userId, recipient_name, street_address, apartment || null, 
      city, state, zip_code, country, is_default
    ).run()

    if (!result.success) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: 'Failed to add address' 
      }, 500)
    }

    return c.json<ApiResponse>({
      success: true,
      message: 'Address added successfully'
    })

  } catch (error) {
    console.error('Add address error:', error)
    return c.json<ApiResponse>({ 
      success: false, 
      error: 'Failed to add address' 
    }, 500)
  }
})

// Update address
userRoutes.put('/addresses/:addressId', async (c) => {
  try {
    const userId = c.get('userId')
    const addressId = c.req.param('addressId')
    const { 
      recipient_name, street_address, apartment, city, state, zip_code, 
      country, is_default 
    } = await c.req.json()

    // Verify address belongs to user
    const existingAddress = await c.env.DB.prepare(`
      SELECT id FROM user_addresses WHERE id = ? AND user_id = ?
    `).bind(addressId, userId).first()

    if (!existingAddress) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: 'Address not found' 
      }, 404)
    }

    // If setting as default, unset other defaults
    if (is_default) {
      await c.env.DB.prepare(`
        UPDATE user_addresses SET is_default = FALSE WHERE user_id = ? AND id != ?
      `).bind(userId, addressId).run()
    }

    // Update address
    await c.env.DB.prepare(`
      UPDATE user_addresses 
      SET recipient_name = ?, street_address = ?, apartment = ?, city = ?, 
          state = ?, zip_code = ?, country = ?, is_default = ?
      WHERE id = ? AND user_id = ?
    `).bind(
      recipient_name, street_address, apartment || null, city, 
      state, zip_code, country || 'USA', is_default || false,
      addressId, userId
    ).run()

    return c.json<ApiResponse>({
      success: true,
      message: 'Address updated successfully'
    })

  } catch (error) {
    console.error('Update address error:', error)
    return c.json<ApiResponse>({ 
      success: false, 
      error: 'Failed to update address' 
    }, 500)
  }
})

// Delete address
userRoutes.delete('/addresses/:addressId', async (c) => {
  try {
    const userId = c.get('userId')
    const addressId = c.req.param('addressId')

    const result = await c.env.DB.prepare(`
      DELETE FROM user_addresses WHERE id = ? AND user_id = ?
    `).bind(addressId, userId).run()

    if (!result.success || result.meta?.changes === 0) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: 'Address not found' 
      }, 404)
    }

    return c.json<ApiResponse>({
      success: true,
      message: 'Address deleted successfully'
    })

  } catch (error) {
    console.error('Delete address error:', error)
    return c.json<ApiResponse>({ 
      success: false, 
      error: 'Failed to delete address' 
    }, 500)
  }
})

// Submit custom design request
userRoutes.post('/custom-designs', async (c) => {
  try {
    const userId = c.get('userId')
    const { 
      name, description, reference_images, special_instructions, 
      colors_requested, inspiration_design_id 
    } = await c.req.json()

    // Validate required fields
    if (!name || !colors_requested || colors_requested.length === 0) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: 'Design name and at least one color are required' 
      }, 400)
    }

    // Insert custom design request
    const result = await c.env.DB.prepare(`
      INSERT INTO custom_designs (
        user_id, name, description, reference_images, special_instructions,
        colors_requested, inspiration_design_id, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
    `).bind(
      userId, name, description || null, JSON.stringify(reference_images || []),
      special_instructions || null, JSON.stringify(colors_requested),
      inspiration_design_id || null
    ).run()

    if (!result.success) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: 'Failed to submit custom design request' 
      }, 500)
    }

    return c.json<ApiResponse>({
      success: true,
      data: { id: result.meta?.last_row_id },
      message: 'Custom design request submitted successfully'
    })

  } catch (error) {
    console.error('Submit custom design error:', error)
    return c.json<ApiResponse>({ 
      success: false, 
      error: 'Failed to submit custom design request' 
    }, 500)
  }
})

// Get user's custom designs
userRoutes.get('/custom-designs', async (c) => {
  try {
    const userId = c.get('userId')

    const customDesigns = await c.env.DB.prepare(`
      SELECT 
        cd.*, 
        d.name as inspiration_name, d.image_url as inspiration_image
      FROM custom_designs cd
      LEFT JOIN designs d ON cd.inspiration_design_id = d.id
      WHERE cd.user_id = ? 
      ORDER BY cd.created_at DESC
    `).bind(userId).all<CustomDesign & { inspiration_name?: string; inspiration_image?: string }>()

    // Parse JSON fields
    const processedDesigns = customDesigns.results.map(design => ({
      ...design,
      reference_images: design.reference_images ? JSON.parse(design.reference_images) : [],
      colors_requested: design.colors_requested ? JSON.parse(design.colors_requested) : []
    }))

    return c.json<ApiResponse<CustomDesign[]>>({
      success: true,
      data: processedDesigns
    })

  } catch (error) {
    console.error('Get custom designs error:', error)
    return c.json<ApiResponse>({ 
      success: false, 
      error: 'Failed to fetch custom designs' 
    }, 500)
  }
})

// Get referral stats and generate referral link
userRoutes.get('/referrals', async (c) => {
  try {
    const userId = c.get('userId')

    const user = await c.env.DB.prepare(`
      SELECT referral_code, total_referrals, free_nails_balance
      FROM users WHERE id = ?
    `).bind(userId).first<{ referral_code: string; total_referrals: number; free_nails_balance: number }>()

    if (!user) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: 'User not found' 
      }, 404)
    }

    // Get recent referrals
    const recentReferrals = await c.env.DB.prepare(`
      SELECT 
        r.created_at, r.completed_at, r.status, r.reward_value,
        u.first_name, u.last_name
      FROM referrals r
      JOIN users u ON r.referee_id = u.id
      WHERE r.referrer_id = ?
      ORDER BY r.created_at DESC
      LIMIT 10
    `).bind(userId).all()

    const referralLink = `https://nailcraft.com/?ref=${user.referral_code}`

    return c.json<ApiResponse>({
      success: true,
      data: {
        referral_code: user.referral_code,
        referral_link: referralLink,
        total_referrals: user.total_referrals,
        free_nails_balance: user.free_nails_balance,
        recent_referrals: recentReferrals.results,
        rewards_info: {
          per_referral: '1 free nail design ($15 value)',
          referral_gets: '1 free nail design for signing up'
        }
      }
    })

  } catch (error) {
    console.error('Get referrals error:', error)
    return c.json<ApiResponse>({ 
      success: false, 
      error: 'Failed to fetch referral information' 
    }, 500)
  }
})

// Get dashboard stats
userRoutes.get('/dashboard', async (c) => {
  try {
    const userId = c.get('userId')

    // Get user basic info
    const user = await c.env.DB.prepare(`
      SELECT 
        first_name, subscription_status, total_referrals, free_nails_balance, created_at
      FROM users WHERE id = ?
    `).bind(userId).first<User>()

    if (!user) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: 'User not found' 
      }, 404)
    }

    // Get order stats
    const orderStats = await c.env.DB.prepare(`
      SELECT 
        COUNT(*) as total_orders,
        SUM(CASE WHEN order_status = 'delivered' THEN 1 ELSE 0 END) as completed_orders,
        SUM(total_amount) as total_spent
      FROM orders WHERE user_id = ?
    `).bind(userId).first<{ total_orders: number; completed_orders: number; total_spent: number }>()

    // Get recent orders
    const recentOrders = await c.env.DB.prepare(`
      SELECT 
        id, order_number, total_amount, order_status, created_at
      FROM orders 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT 5
    `).bind(userId).all()

    // Get custom design stats
    const customDesignStats = await c.env.DB.prepare(`
      SELECT 
        COUNT(*) as total_designs,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_designs,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_designs
      FROM custom_designs WHERE user_id = ?
    `).bind(userId).first<{ total_designs: number; completed_designs: number; pending_designs: number }>()

    return c.json<ApiResponse>({
      success: true,
      data: {
        user: {
          name: user.first_name,
          subscription_status: user.subscription_status,
          member_since: user.created_at
        },
        stats: {
          total_orders: orderStats?.total_orders || 0,
          completed_orders: orderStats?.completed_orders || 0,
          total_spent: orderStats?.total_spent || 0,
          total_referrals: user.total_referrals,
          free_nails_balance: user.free_nails_balance,
          custom_designs: customDesignStats?.total_designs || 0,
          pending_custom: customDesignStats?.pending_designs || 0
        },
        recent_orders: recentOrders.results
      }
    })

  } catch (error) {
    console.error('Get dashboard error:', error)
    return c.json<ApiResponse>({ 
      success: false, 
      error: 'Failed to fetch dashboard data' 
    }, 500)
  }
})