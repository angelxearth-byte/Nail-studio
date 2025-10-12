import { Hono } from 'hono'
import type { Bindings, CartItem, AddToCartRequest, ApiResponse } from '../types'
import { authMiddleware } from './auth'

export const cartRoutes = new Hono<{ Bindings: Bindings }>()

// All cart routes require authentication
cartRoutes.use('*', authMiddleware)

// Get user's cart items
cartRoutes.get('/', async (c) => {
  try {
    const userId = c.get('userId')

    const cartItems = await c.env.DB.prepare(`
      SELECT 
        ci.id, ci.quantity, ci.nail_size, ci.special_instructions, ci.price, ci.created_at,
        d.id as design_id, d.name as design_name, d.image_url, d.thumbnail_url, 
        d.base_price, d.subscription_price, d.is_premium,
        cd.id as custom_design_id, cd.name as custom_design_name, cd.estimated_price
      FROM cart_items ci
      LEFT JOIN designs d ON ci.design_id = d.id
      LEFT JOIN custom_designs cd ON ci.custom_design_id = cd.id
      WHERE ci.user_id = ?
      ORDER BY ci.created_at DESC
    `).bind(userId).all()

    const processedItems = cartItems.results.map((item: any) => ({
      id: item.id,
      quantity: item.quantity,
      nail_size: item.nail_size,
      special_instructions: item.special_instructions,
      price: item.price,
      created_at: item.created_at,
      design: item.design_id ? {
        id: item.design_id,
        name: item.design_name,
        image_url: item.image_url,
        thumbnail_url: item.thumbnail_url,
        base_price: item.base_price,
        subscription_price: item.subscription_price,
        is_premium: item.is_premium
      } : undefined,
      custom_design: item.custom_design_id ? {
        id: item.custom_design_id,
        name: item.custom_design_name,
        estimated_price: item.estimated_price
      } : undefined
    }))

    // Calculate totals
    const subtotal = processedItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
    const itemCount = processedItems.reduce((sum, item) => sum + item.quantity, 0)

    return c.json<ApiResponse>({
      success: true,
      data: {
        items: processedItems,
        summary: {
          item_count: itemCount,
          subtotal: subtotal,
          estimated_tax: subtotal * 0.08, // 8% tax estimate
          estimated_shipping: subtotal > 50 ? 0 : 9.99, // Free shipping over $50
          estimated_total: subtotal + (subtotal * 0.08) + (subtotal > 50 ? 0 : 9.99)
        }
      }
    })

  } catch (error) {
    console.error('Get cart error:', error)
    return c.json<ApiResponse>({ 
      success: false, 
      error: 'Failed to fetch cart' 
    }, 500)
  }
})

// Add item to cart
cartRoutes.post('/add', async (c) => {
  try {
    const userId = c.get('userId')
    const { design_id, custom_design_id, quantity, nail_size, special_instructions }: AddToCartRequest = await c.req.json()

    // Validate required fields
    if (!quantity || !nail_size || (!design_id && !custom_design_id)) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: 'Missing required fields' 
      }, 400)
    }

    if (quantity < 1 || quantity > 10) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: 'Quantity must be between 1 and 10' 
      }, 400)
    }

    const validSizes = ['XS', 'S', 'M', 'L', 'XL']
    if (!validSizes.includes(nail_size)) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: 'Invalid nail size' 
      }, 400)
    }

    let price = 0
    let itemName = ''

    // Get price based on item type
    if (design_id) {
      const design = await c.env.DB.prepare(`
        SELECT id, name, base_price, subscription_price, is_active 
        FROM designs 
        WHERE id = ? AND is_active = TRUE
      `).bind(design_id).first<{ id: number; name: string; base_price: number; subscription_price: number; is_active: boolean }>()

      if (!design) {
        return c.json<ApiResponse>({ 
          success: false, 
          error: 'Design not found' 
        }, 404)
      }

      // Check if user has active subscription for discounted pricing
      const user = await c.env.DB.prepare(`
        SELECT subscription_status FROM users WHERE id = ?
      `).bind(userId).first<{ subscription_status: string }>()

      // Use subscription price if available and user has subscription
      if (user?.subscription_status !== 'none' && design.subscription_price) {
        price = design.subscription_price
      } else {
        price = design.base_price
      }

      itemName = design.name
    } else if (custom_design_id) {
      const customDesign = await c.env.DB.prepare(`
        SELECT id, name, estimated_price, user_id, status 
        FROM custom_designs 
        WHERE id = ? AND user_id = ? AND status IN ('approved', 'completed')
      `).bind(custom_design_id, userId).first<{ id: number; name: string; estimated_price: number; user_id: number; status: string }>()

      if (!customDesign) {
        return c.json<ApiResponse>({ 
          success: false, 
          error: 'Custom design not found or not approved' 
        }, 404)
      }

      price = customDesign.estimated_price || 25.99 // Default custom price
      itemName = customDesign.name
    }

    // Check if item already exists in cart
    const existingItem = await c.env.DB.prepare(`
      SELECT id, quantity FROM cart_items 
      WHERE user_id = ? AND design_id = ? AND custom_design_id = ? AND nail_size = ?
    `).bind(userId, design_id || null, custom_design_id || null, nail_size).first<{ id: number; quantity: number }>()

    if (existingItem) {
      // Update quantity of existing item
      const newQuantity = Math.min(existingItem.quantity + quantity, 10) // Max 10 per item
      
      await c.env.DB.prepare(`
        UPDATE cart_items 
        SET quantity = ?, price = ?, special_instructions = ?
        WHERE id = ?
      `).bind(newQuantity, price, special_instructions || null, existingItem.id).run()

      return c.json<ApiResponse>({
        success: true,
        message: `Updated ${itemName} quantity in cart`
      })
    } else {
      // Add new item to cart
      const result = await c.env.DB.prepare(`
        INSERT INTO cart_items (user_id, design_id, custom_design_id, quantity, nail_size, special_instructions, price)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(userId, design_id || null, custom_design_id || null, quantity, nail_size, special_instructions || null, price).run()

      if (!result.success) {
        return c.json<ApiResponse>({ 
          success: false, 
          error: 'Failed to add item to cart' 
        }, 500)
      }

      return c.json<ApiResponse>({
        success: true,
        message: `Added ${itemName} to cart`
      })
    }

  } catch (error) {
    console.error('Add to cart error:', error)
    return c.json<ApiResponse>({ 
      success: false, 
      error: 'Failed to add item to cart' 
    }, 500)
  }
})

// Update cart item quantity
cartRoutes.put('/:itemId', async (c) => {
  try {
    const userId = c.get('userId')
    const itemId = c.req.param('itemId')
    const { quantity, special_instructions } = await c.req.json()

    if (!quantity || quantity < 1 || quantity > 10) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: 'Quantity must be between 1 and 10' 
      }, 400)
    }

    // Verify item belongs to user
    const cartItem = await c.env.DB.prepare(`
      SELECT id FROM cart_items WHERE id = ? AND user_id = ?
    `).bind(itemId, userId).first()

    if (!cartItem) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: 'Cart item not found' 
      }, 404)
    }

    // Update item
    await c.env.DB.prepare(`
      UPDATE cart_items 
      SET quantity = ?, special_instructions = ?
      WHERE id = ? AND user_id = ?
    `).bind(quantity, special_instructions || null, itemId, userId).run()

    return c.json<ApiResponse>({
      success: true,
      message: 'Cart item updated'
    })

  } catch (error) {
    console.error('Update cart item error:', error)
    return c.json<ApiResponse>({ 
      success: false, 
      error: 'Failed to update cart item' 
    }, 500)
  }
})

// Remove item from cart
cartRoutes.delete('/:itemId', async (c) => {
  try {
    const userId = c.get('userId')
    const itemId = c.req.param('itemId')

    // Verify item belongs to user and delete
    const result = await c.env.DB.prepare(`
      DELETE FROM cart_items WHERE id = ? AND user_id = ?
    `).bind(itemId, userId).run()

    if (!result.success || result.meta?.changes === 0) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: 'Cart item not found' 
      }, 404)
    }

    return c.json<ApiResponse>({
      success: true,
      message: 'Item removed from cart'
    })

  } catch (error) {
    console.error('Remove cart item error:', error)
    return c.json<ApiResponse>({ 
      success: false, 
      error: 'Failed to remove item from cart' 
    }, 500)
  }
})

// Clear entire cart
cartRoutes.delete('/', async (c) => {
  try {
    const userId = c.get('userId')

    await c.env.DB.prepare(`
      DELETE FROM cart_items WHERE user_id = ?
    `).bind(userId).run()

    return c.json<ApiResponse>({
      success: true,
      message: 'Cart cleared'
    })

  } catch (error) {
    console.error('Clear cart error:', error)
    return c.json<ApiResponse>({ 
      success: false, 
      error: 'Failed to clear cart' 
    }, 500)
  }
})

// Apply coupon/promo code
cartRoutes.post('/coupon', async (c) => {
  try {
    const userId = c.get('userId')
    const { code } = await c.req.json()

    if (!code) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: 'Coupon code required' 
      }, 400)
    }

    // For now, implement basic coupon logic
    // In production, you'd have a coupons table
    const validCoupons: { [key: string]: { discount: number; type: 'percentage' | 'fixed'; min_amount?: number } } = {
      'WELCOME10': { discount: 10, type: 'percentage' },
      'FIRST20': { discount: 20, type: 'percentage', min_amount: 30 },
      'SAVE5': { discount: 5, type: 'fixed' }
    }

    const coupon = validCoupons[code.toUpperCase()]
    
    if (!coupon) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: 'Invalid coupon code' 
      }, 400)
    }

    // Get cart total to validate minimum amount
    const cartSummary = await c.env.DB.prepare(`
      SELECT SUM(price * quantity) as subtotal 
      FROM cart_items 
      WHERE user_id = ?
    `).bind(userId).first<{ subtotal: number }>()

    const subtotal = cartSummary?.subtotal || 0

    if (coupon.min_amount && subtotal < coupon.min_amount) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: `Minimum order amount of $${coupon.min_amount} required for this coupon` 
      }, 400)
    }

    let discountAmount = 0
    if (coupon.type === 'percentage') {
      discountAmount = subtotal * (coupon.discount / 100)
    } else {
      discountAmount = coupon.discount
    }

    return c.json<ApiResponse>({
      success: true,
      data: {
        code: code.toUpperCase(),
        discount_amount: discountAmount,
        discount_type: coupon.type,
        discount_value: coupon.discount
      },
      message: 'Coupon applied successfully'
    })

  } catch (error) {
    console.error('Apply coupon error:', error)
    return c.json<ApiResponse>({ 
      success: false, 
      error: 'Failed to apply coupon' 
    }, 500)
  }
})