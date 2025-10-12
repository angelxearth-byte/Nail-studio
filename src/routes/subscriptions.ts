import { Hono } from 'hono'
import type { Bindings, SubscriptionPlan, ApiResponse } from '../types'
import { authMiddleware } from './auth'

export const subscriptionRoutes = new Hono<{ Bindings: Bindings }>()

// Get all available subscription plans (public)
subscriptionRoutes.get('/plans', async (c) => {
  try {
    const plans = await c.env.DB.prepare(`
      SELECT * FROM subscription_plans 
      WHERE is_active = TRUE 
      ORDER BY price_monthly ASC
    `).bind().all<SubscriptionPlan>()

    // Parse benefits JSON
    const processedPlans = plans.results.map(plan => ({
      ...plan,
      benefits: plan.benefits ? JSON.parse(plan.benefits) : []
    }))

    return c.json<ApiResponse<SubscriptionPlan[]>>({
      success: true,
      data: processedPlans
    })

  } catch (error) {
    console.error('Get subscription plans error:', error)
    return c.json<ApiResponse>({ 
      success: false, 
      error: 'Failed to fetch subscription plans' 
    }, 500)
  }
})

// Get current user's subscription status (requires auth)
subscriptionRoutes.get('/status', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')

    const user = await c.env.DB.prepare(`
      SELECT 
        subscription_status, subscription_start_date, subscription_end_date
      FROM users 
      WHERE id = ?
    `).bind(userId).first<{ 
      subscription_status: string; 
      subscription_start_date: string; 
      subscription_end_date: string; 
    }>()

    if (!user) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: 'User not found' 
      }, 404)
    }

    // Get current subscription plan details if active
    let currentPlan = null
    if (user.subscription_status !== 'none') {
      const latestSubscription = await c.env.DB.prepare(`
        SELECT 
          sp.id, sp.name, sp.description, sp.price_monthly, sp.price_annual, 
          sp.benefits, sp.max_designs_per_month, sp.discount_percentage,
          sh.start_date, sh.end_date, sh.status
        FROM subscription_history sh
        JOIN subscription_plans sp ON sh.plan_id = sp.id
        WHERE sh.user_id = ? AND sh.status = 'active'
        ORDER BY sh.start_date DESC
        LIMIT 1
      `).bind(userId).first()

      if (latestSubscription) {
        currentPlan = {
          ...latestSubscription,
          benefits: latestSubscription.benefits ? JSON.parse(latestSubscription.benefits) : []
        }
      }
    }

    // Calculate usage for current month (simplified)
    const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM format
    const monthlyUsage = await c.env.DB.prepare(`
      SELECT COUNT(*) as designs_this_month
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE o.user_id = ? AND o.created_at LIKE ? AND o.payment_status = 'paid'
    `).bind(userId, `${currentMonth}%`).first<{ designs_this_month: number }>()

    return c.json<ApiResponse>({
      success: true,
      data: {
        subscription_status: user.subscription_status,
        subscription_start: user.subscription_start_date,
        subscription_end: user.subscription_end_date,
        current_plan: currentPlan,
        usage: {
          designs_this_month: monthlyUsage?.designs_this_month || 0,
          max_designs: currentPlan?.max_designs_per_month || 0
        },
        is_active: user.subscription_status !== 'none' && 
                  new Date(user.subscription_end_date) > new Date()
      }
    })

  } catch (error) {
    console.error('Get subscription status error:', error)
    return c.json<ApiResponse>({ 
      success: false, 
      error: 'Failed to fetch subscription status' 
    }, 500)
  }
})

// Subscribe to a plan (requires auth)
subscriptionRoutes.post('/subscribe', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const { plan_id, billing_cycle, payment_method } = await c.req.json()

    // Validate input
    if (!plan_id || !billing_cycle || !payment_method) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: 'Missing required fields' 
      }, 400)
    }

    if (!['monthly', 'annual'].includes(billing_cycle)) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: 'Invalid billing cycle' 
      }, 400)
    }

    // Get plan details
    const plan = await c.env.DB.prepare(`
      SELECT * FROM subscription_plans WHERE id = ? AND is_active = TRUE
    `).bind(plan_id).first<SubscriptionPlan>()

    if (!plan) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: 'Subscription plan not found' 
      }, 404)
    }

    // Check if user already has active subscription
    const user = await c.env.DB.prepare(`
      SELECT subscription_status, subscription_end_date
      FROM users WHERE id = ?
    `).bind(userId).first<{ subscription_status: string; subscription_end_date: string }>()

    if (user?.subscription_status !== 'none' && 
        user?.subscription_end_date && 
        new Date(user.subscription_end_date) > new Date()) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: 'User already has an active subscription' 
      }, 400)
    }

    // Calculate dates and pricing
    const startDate = new Date()
    const endDate = new Date()
    let subscriptionPrice = plan.price_monthly

    if (billing_cycle === 'annual') {
      endDate.setFullYear(endDate.getFullYear() + 1)
      subscriptionPrice = plan.price_annual || (plan.price_monthly * 12 * 0.9) // 10% annual discount if no annual price set
    } else {
      endDate.setMonth(endDate.getMonth() + 1)
    }

    // In a real implementation, you would:
    // 1. Process payment with payment provider (Stripe, PayPal, etc.)
    // 2. Handle payment failures
    // 3. Set up recurring billing

    // For demo purposes, we'll simulate successful payment
    const paymentTransactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`

    // Update user subscription status
    await c.env.DB.prepare(`
      UPDATE users 
      SET subscription_status = ?, subscription_start_date = ?, subscription_end_date = ?
      WHERE id = ?
    `).bind(billing_cycle, startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0], userId).run()

    // Create subscription history record
    await c.env.DB.prepare(`
      INSERT INTO subscription_history (user_id, plan_id, start_date, end_date, status, payment_transaction_id)
      VALUES (?, ?, ?, ?, 'active', ?)
    `).bind(
      userId, plan_id, 
      startDate.toISOString().split('T')[0], 
      endDate.toISOString().split('T')[0], 
      paymentTransactionId
    ).run()

    return c.json<ApiResponse>({
      success: true,
      data: {
        subscription_status: billing_cycle,
        plan_name: plan.name,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        amount_charged: subscriptionPrice,
        billing_cycle
      },
      message: `Successfully subscribed to ${plan.name} (${billing_cycle})`
    })

  } catch (error) {
    console.error('Subscribe error:', error)
    return c.json<ApiResponse>({ 
      success: false, 
      error: 'Failed to process subscription' 
    }, 500)
  }
})

// Cancel subscription (requires auth)
subscriptionRoutes.post('/cancel', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const { reason, feedback } = await c.req.json()

    // Check if user has active subscription
    const user = await c.env.DB.prepare(`
      SELECT subscription_status, subscription_end_date
      FROM users WHERE id = ?
    `).bind(userId).first<{ subscription_status: string; subscription_end_date: string }>()

    if (!user || user.subscription_status === 'none') {
      return c.json<ApiResponse>({ 
        success: false, 
        error: 'No active subscription found' 
      }, 400)
    }

    // Update current subscription to cancelled (but let it run until end date)
    await c.env.DB.prepare(`
      UPDATE subscription_history 
      SET status = 'cancelled' 
      WHERE user_id = ? AND status = 'active'
    `).bind(userId).run()

    // Note: In a real implementation, you would:
    // 1. Cancel the recurring billing with payment provider
    // 2. Potentially offer retention deals
    // 3. Send cancellation confirmation email
    // 4. Store cancellation reason for analytics

    // Keep subscription active until end date but mark as cancelled
    const endDate = new Date(user.subscription_end_date)
    const now = new Date()
    
    if (endDate > now) {
      return c.json<ApiResponse>({
        success: true,
        message: 'Subscription cancelled. You will retain access until ' + endDate.toDateString(),
        data: {
          access_until: user.subscription_end_date,
          immediate_cancellation: false
        }
      })
    } else {
      // Immediate cancellation if already expired
      await c.env.DB.prepare(`
        UPDATE users 
        SET subscription_status = 'none', subscription_end_date = NULL
        WHERE id = ?
      `).bind(userId).run()

      return c.json<ApiResponse>({
        success: true,
        message: 'Subscription cancelled immediately',
        data: {
          immediate_cancellation: true
        }
      })
    }

  } catch (error) {
    console.error('Cancel subscription error:', error)
    return c.json<ApiResponse>({ 
      success: false, 
      error: 'Failed to cancel subscription' 
    }, 500)
  }
})

// Update subscription plan (requires auth)
subscriptionRoutes.put('/change-plan', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const { new_plan_id, billing_cycle } = await c.req.json()

    // Get current subscription
    const currentSubscription = await c.env.DB.prepare(`
      SELECT sh.*, sp.name as current_plan_name, sp.price_monthly as current_price
      FROM subscription_history sh
      JOIN subscription_plans sp ON sh.plan_id = sp.id
      WHERE sh.user_id = ? AND sh.status = 'active'
      ORDER BY sh.start_date DESC
      LIMIT 1
    `).bind(userId).first()

    if (!currentSubscription) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: 'No active subscription found' 
      }, 400)
    }

    // Get new plan details
    const newPlan = await c.env.DB.prepare(`
      SELECT * FROM subscription_plans WHERE id = ? AND is_active = TRUE
    `).bind(new_plan_id).first<SubscriptionPlan>()

    if (!newPlan) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: 'New subscription plan not found' 
      }, 404)
    }

    // Calculate prorated pricing (simplified)
    const now = new Date()
    const currentEndDate = new Date(currentSubscription.end_date)
    const remainingDays = Math.max(0, Math.ceil((currentEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    
    // In a real implementation, you would:
    // 1. Calculate prorated refund for current plan
    // 2. Calculate prorated charge for new plan
    // 3. Process the difference with payment provider

    // For demo purposes, apply change immediately
    const newEndDate = new Date()
    if (billing_cycle === 'annual') {
      newEndDate.setFullYear(newEndDate.getFullYear() + 1)
    } else {
      newEndDate.setMonth(newEndDate.getMonth() + 1)
    }

    // End current subscription
    await c.env.DB.prepare(`
      UPDATE subscription_history 
      SET status = 'cancelled', end_date = ?
      WHERE user_id = ? AND status = 'active'
    `).bind(now.toISOString().split('T')[0], userId).run()

    // Create new subscription
    await c.env.DB.prepare(`
      INSERT INTO subscription_history (user_id, plan_id, start_date, end_date, status, payment_transaction_id)
      VALUES (?, ?, ?, ?, 'active', ?)
    `).bind(
      userId, new_plan_id,
      now.toISOString().split('T')[0],
      newEndDate.toISOString().split('T')[0],
      `change_${Date.now()}`
    ).run()

    // Update user subscription status
    await c.env.DB.prepare(`
      UPDATE users 
      SET subscription_status = ?, subscription_start_date = ?, subscription_end_date = ?
      WHERE id = ?
    `).bind(billing_cycle, now.toISOString().split('T')[0], newEndDate.toISOString().split('T')[0], userId).run()

    return c.json<ApiResponse>({
      success: true,
      data: {
        old_plan: currentSubscription.current_plan_name,
        new_plan: newPlan.name,
        new_billing_cycle: billing_cycle,
        effective_date: now.toISOString().split('T')[0],
        next_billing_date: newEndDate.toISOString().split('T')[0]
      },
      message: `Successfully changed to ${newPlan.name} (${billing_cycle})`
    })

  } catch (error) {
    console.error('Change plan error:', error)
    return c.json<ApiResponse>({ 
      success: false, 
      error: 'Failed to change subscription plan' 
    }, 500)
  }
})

// Get subscription history (requires auth)
subscriptionRoutes.get('/history', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')

    const history = await c.env.DB.prepare(`
      SELECT 
        sh.start_date, sh.end_date, sh.status, sh.payment_transaction_id, sh.created_at,
        sp.name as plan_name, sp.price_monthly, sp.price_annual
      FROM subscription_history sh
      JOIN subscription_plans sp ON sh.plan_id = sp.id
      WHERE sh.user_id = ?
      ORDER BY sh.created_at DESC
    `).bind(userId).all()

    return c.json<ApiResponse>({
      success: true,
      data: history.results
    })

  } catch (error) {
    console.error('Get subscription history error:', error)
    return c.json<ApiResponse>({ 
      success: false, 
      error: 'Failed to fetch subscription history' 
    }, 500)
  }
})