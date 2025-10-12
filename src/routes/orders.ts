import { Hono } from 'hono'
import type { Bindings, Order, OrderItem, ApiResponse, PaginatedResponse } from '../types'
import { authMiddleware } from './auth'

export const orderRoutes = new Hono<{ Bindings: Bindings }>()

// All order routes require authentication
orderRoutes.use('*', authMiddleware)

// Generate unique order number
const generateOrderNumber = (): string => {
  return `NC${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`
}

// Create order from cart
orderRoutes.post('/', async (c) => {
  try {
    const userId = c.get('userId')
    const { 
      shipping_address, 
      payment_method,
      coupon_code,
      use_free_nails 
    } = await c.req.json()

    // Validate shipping address
    if (!shipping_address || !shipping_address.recipient_name || !shipping_address.street_address || 
        !shipping_address.city || !shipping_address.state || !shipping_address.zip_code) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: 'Complete shipping address required' 
      }, 400)
    }

    // Get user's cart items
    const cartItems = await c.env.DB.prepare(`
      SELECT 
        ci.id, ci.design_id, ci.custom_design_id, ci.quantity, ci.nail_size, 
        ci.special_instructions, ci.price,
        d.name as design_name,
        cd.name as custom_design_name
      FROM cart_items ci
      LEFT JOIN designs d ON ci.design_id = d.id
      LEFT JOIN custom_designs cd ON ci.custom_design_id = cd.id
      WHERE ci.user_id = ?
    `).bind(userId).all()

    if (cartItems.results.length === 0) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: 'Cart is empty' 
      }, 400)
    }

    // Calculate totals
    const subtotal = cartItems.results.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0)
    const taxRate = 0.08 // 8% tax
    const taxAmount = subtotal * taxRate
    let shippingCost = subtotal >= 50 ? 0 : 9.99 // Free shipping over $50
    let discountAmount = 0
    let freeNailsUsed = 0

    // Get user info for free nails balance
    const user = await c.env.DB.prepare(`
      SELECT free_nails_balance, subscription_status FROM users WHERE id = ?
    `).bind(userId).first<{ free_nails_balance: number; subscription_status: string }>()

    // Apply free nails if requested
    if (use_free_nails && user && user.free_nails_balance > 0) {
      // Each free nail is worth $15
      const freeNailValue = 15
      const maxFreeNails = Math.min(user.free_nails_balance, Math.floor(subtotal / freeNailValue))
      
      if (maxFreeNails > 0) {
        freeNailsUsed = maxFreeNails
        discountAmount += maxFreeNails * freeNailValue
      }
    }

    // Apply coupon discount if provided
    if (coupon_code) {
      const validCoupons: { [key: string]: { discount: number; type: 'percentage' | 'fixed' } } = {
        'WELCOME10': { discount: 10, type: 'percentage' },
        'FIRST20': { discount: 20, type: 'percentage' },
        'SAVE5': { discount: 5, type: 'fixed' }
      }

      const coupon = validCoupons[coupon_code.toUpperCase()]
      if (coupon) {
        if (coupon.type === 'percentage') {
          discountAmount += (subtotal - discountAmount) * (coupon.discount / 100)
        } else {
          discountAmount += coupon.discount
        }
      }
    }

    // Subscription members get free shipping
    if (user?.subscription_status !== 'none') {
      shippingCost = 0
    }

    const totalAmount = Math.max(0, subtotal + taxAmount + shippingCost - discountAmount)

    // Generate order number
    const orderNumber = generateOrderNumber()

    // Create order
    const orderResult = await c.env.DB.prepare(`
      INSERT INTO orders (
        user_id, order_number, subtotal, tax_amount, shipping_cost, discount_amount, total_amount,
        payment_status, order_status, payment_method,
        shipping_name, shipping_street, shipping_apartment, shipping_city, 
        shipping_state, shipping_zip, shipping_country,
        free_nails_used
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      userId, orderNumber, subtotal, taxAmount, shippingCost, discountAmount, totalAmount,
      'pending', 'processing', payment_method,
      shipping_address.recipient_name, shipping_address.street_address, 
      shipping_address.apartment || null, shipping_address.city,
      shipping_address.state, shipping_address.zip_code, shipping_address.country || 'USA',
      freeNailsUsed
    ).run()

    if (!orderResult.success || !orderResult.meta?.last_row_id) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: 'Failed to create order' 
      }, 500)
    }

    const orderId = orderResult.meta.last_row_id

    // Create order items
    for (const item of cartItems.results) {
      const designName = item.design_name || item.custom_design_name || 'Custom Design'
      const totalPrice = item.price * item.quantity

      await c.env.DB.prepare(`
        INSERT INTO order_items (
          order_id, design_id, custom_design_id, design_name, quantity, 
          nail_size, unit_price, total_price, special_instructions
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        orderId, item.design_id || null, item.custom_design_id || null,
        designName, item.quantity, item.nail_size, item.price, totalPrice,
        item.special_instructions || null
      ).run()
    }

    // Update user's free nails balance if used
    if (freeNailsUsed > 0) {
      await c.env.DB.prepare(`
        UPDATE users SET free_nails_balance = free_nails_balance - ? WHERE id = ?
      `).bind(freeNailsUsed, userId).run()
    }

    // Clear cart after successful order
    await c.env.DB.prepare(`
      DELETE FROM cart_items WHERE user_id = ?
    `).bind(userId).run()

    // In a real implementation, you would:
    // 1. Process payment with payment provider (Stripe, PayPal, etc.)
    // 2. Send confirmation email
    // 3. Notify fulfillment system
    // 4. Update inventory

    // For now, we'll simulate successful payment
    await c.env.DB.prepare(`
      UPDATE orders SET payment_status = 'paid' WHERE id = ?
    `).bind(orderId).run()

    return c.json<ApiResponse>({
      success: true,
      data: {
        order_id: orderId,
        order_number: orderNumber,
        total_amount: totalAmount,
        estimated_delivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 7 days from now
      },
      message: 'Order created successfully'
    })

  } catch (error) {
    console.error('Create order error:', error)
    return c.json<ApiResponse>({ 
      success: false, 
      error: 'Failed to create order' 
    }, 500)
  }
})

// Get user's orders
orderRoutes.get('/', async (c) => {
  try {
    const userId = c.get('userId')
    const page = parseInt(c.req.query('page') || '1')
    const limit = parseInt(c.req.query('limit') || '10')
    const offset = (page - 1) * limit

    // Get total count
    const countResult = await c.env.DB.prepare(`
      SELECT COUNT(*) as total FROM orders WHERE user_id = ?
    `).bind(userId).first<{ total: number }>()
    
    const total = countResult?.total || 0

    // Get orders
    const orders = await c.env.DB.prepare(`
      SELECT 
        id, order_number, subtotal, tax_amount, shipping_cost, discount_amount, total_amount,
        payment_status, order_status, tracking_number, estimated_delivery_date,
        created_at, updated_at
      FROM orders 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `).bind(userId, limit, offset).all<Order>()

    return c.json<PaginatedResponse<Order>>({
      success: true,
      data: orders.results,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Get orders error:', error)
    return c.json<ApiResponse>({ 
      success: false, 
      error: 'Failed to fetch orders' 
    }, 500)
  }
})

// Get single order details
orderRoutes.get('/:orderId', async (c) => {
  try {
    const userId = c.get('userId')
    const orderId = c.req.param('orderId')

    // Get order
    const order = await c.env.DB.prepare(`
      SELECT * FROM orders WHERE id = ? AND user_id = ?
    `).bind(orderId, userId).first<Order>()

    if (!order) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: 'Order not found' 
      }, 404)
    }

    // Get order items
    const orderItems = await c.env.DB.prepare(`
      SELECT 
        oi.*, 
        d.image_url, d.thumbnail_url,
        cd.reference_images
      FROM order_items oi
      LEFT JOIN designs d ON oi.design_id = d.id
      LEFT JOIN custom_designs cd ON oi.custom_design_id = cd.id
      WHERE oi.order_id = ?
      ORDER BY oi.id
    `).bind(orderId).all<OrderItem & { image_url?: string; thumbnail_url?: string; reference_images?: string }>()

    // Process order items
    const processedItems = orderItems.results.map(item => ({
      ...item,
      reference_images: item.reference_images ? JSON.parse(item.reference_images) : []
    }))

    return c.json<ApiResponse>({
      success: true,
      data: {
        order,
        items: processedItems
      }
    })

  } catch (error) {
    console.error('Get order details error:', error)
    return c.json<ApiResponse>({ 
      success: false, 
      error: 'Failed to fetch order details' 
    }, 500)
  }
})

// Cancel order (if still processing)
orderRoutes.post('/:orderId/cancel', async (c) => {
  try {
    const userId = c.get('userId')
    const orderId = c.req.param('orderId')

    // Check if order can be cancelled
    const order = await c.env.DB.prepare(`
      SELECT id, order_status, payment_status, free_nails_used 
      FROM orders 
      WHERE id = ? AND user_id = ?
    `).bind(orderId, userId).first<{ id: number; order_status: string; payment_status: string; free_nails_used: number }>()

    if (!order) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: 'Order not found' 
      }, 404)
    }

    if (!['processing', 'confirmed'].includes(order.order_status)) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: 'Order cannot be cancelled at this stage' 
      }, 400)
    }

    // Update order status
    await c.env.DB.prepare(`
      UPDATE orders 
      SET order_status = 'cancelled', payment_status = 'refunded', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(orderId).run()

    // Restore free nails if they were used
    if (order.free_nails_used > 0) {
      await c.env.DB.prepare(`
        UPDATE users SET free_nails_balance = free_nails_balance + ? WHERE id = ?
      `).bind(order.free_nails_used, userId).run()
    }

    return c.json<ApiResponse>({
      success: true,
      message: 'Order cancelled successfully'
    })

  } catch (error) {
    console.error('Cancel order error:', error)
    return c.json<ApiResponse>({ 
      success: false, 
      error: 'Failed to cancel order' 
    }, 500)
  }
})

// Track order
orderRoutes.get('/:orderId/tracking', async (c) => {
  try {
    const userId = c.get('userId')
    const orderId = c.req.param('orderId')

    const order = await c.env.DB.prepare(`
      SELECT 
        id, order_number, order_status, tracking_number, estimated_delivery_date,
        shipped_at, delivered_at, created_at
      FROM orders 
      WHERE id = ? AND user_id = ?
    `).bind(orderId, userId).first<Order>()

    if (!order) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: 'Order not found' 
      }, 404)
    }

    // Create tracking timeline
    const timeline = [
      {
        status: 'processing',
        title: 'Order Received',
        description: 'Your order has been received and is being prepared',
        completed: true,
        date: order.created_at
      },
      {
        status: 'confirmed',
        title: 'Order Confirmed',
        description: 'Your order has been confirmed and is in production',
        completed: ['confirmed', 'manufacturing', 'shipped', 'delivered'].includes(order.order_status),
        date: order.created_at // In real app, would have separate confirmed_at timestamp
      },
      {
        status: 'manufacturing',
        title: 'In Production',
        description: 'Your custom nails are being crafted',
        completed: ['manufacturing', 'shipped', 'delivered'].includes(order.order_status),
        date: null
      },
      {
        status: 'shipped',
        title: 'Shipped',
        description: 'Your order has been shipped',
        completed: ['shipped', 'delivered'].includes(order.order_status),
        date: order.shipped_at
      },
      {
        status: 'delivered',
        title: 'Delivered',
        description: 'Your order has been delivered',
        completed: order.order_status === 'delivered',
        date: order.delivered_at
      }
    ]

    return c.json<ApiResponse>({
      success: true,
      data: {
        order_number: order.order_number,
        current_status: order.order_status,
        tracking_number: order.tracking_number,
        estimated_delivery: order.estimated_delivery_date,
        timeline
      }
    })

  } catch (error) {
    console.error('Track order error:', error)
    return c.json<ApiResponse>({ 
      success: false, 
      error: 'Failed to get tracking information' 
    }, 500)
  }
})