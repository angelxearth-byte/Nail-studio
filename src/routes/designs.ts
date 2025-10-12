import { Hono } from 'hono'
import type { Bindings, Design, Category, PaginatedResponse, ApiResponse } from '../types'
import { authMiddleware } from './auth'

export const designRoutes = new Hono<{ Bindings: Bindings }>()

// Get all categories
designRoutes.get('/categories', async (c) => {
  try {
    const categories = await c.env.DB.prepare(`
      SELECT * FROM categories 
      WHERE is_active = TRUE 
      ORDER BY display_order, name
    `).all<Category>()

    return c.json<ApiResponse<Category[]>>({
      success: true,
      data: categories.results
    })

  } catch (error) {
    console.error('Get categories error:', error)
    return c.json<ApiResponse>({ 
      success: false, 
      error: 'Failed to fetch categories' 
    }, 500)
  }
})

// Get designs with filtering and pagination
designRoutes.get('/', async (c) => {
  try {
    const page = parseInt(c.req.query('page') || '1')
    const limit = parseInt(c.req.query('limit') || '12')
    const category = c.req.query('category')
    const search = c.req.query('search')
    const sort = c.req.query('sort') || 'popularity' // popularity, price_low, price_high, newest
    const premium = c.req.query('premium') // true/false
    
    const offset = (page - 1) * limit

    // Build WHERE clause
    let whereClause = 'WHERE d.is_active = TRUE'
    const params: any[] = []

    if (category) {
      whereClause += ' AND d.category_id = ?'
      params.push(parseInt(category))
    }

    if (search) {
      whereClause += ' AND (d.name LIKE ? OR d.description LIKE ?)'
      params.push(`%${search}%`, `%${search}%`)
    }

    if (premium === 'true') {
      whereClause += ' AND d.is_premium = TRUE'
    } else if (premium === 'false') {
      whereClause += ' AND d.is_premium = FALSE'
    }

    // Build ORDER BY clause
    let orderClause = ''
    switch (sort) {
      case 'price_low':
        orderClause = 'ORDER BY d.base_price ASC'
        break
      case 'price_high':
        orderClause = 'ORDER BY d.base_price DESC'
        break
      case 'newest':
        orderClause = 'ORDER BY d.created_at DESC'
        break
      case 'popularity':
      default:
        orderClause = 'ORDER BY d.popularity_score DESC, d.created_at DESC'
        break
    }

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM designs d 
      LEFT JOIN categories c ON d.category_id = c.id
      ${whereClause}
    `
    
    const countResult = await c.env.DB.prepare(countQuery).bind(...params).first<{ total: number }>()
    const total = countResult?.total || 0

    // Get designs
    const designsQuery = `
      SELECT 
        d.id, d.name, d.description, d.category_id, d.image_url, d.thumbnail_url,
        d.colors, d.patterns, d.difficulty_level, d.estimated_time_minutes,
        d.base_price, d.subscription_price, d.is_premium, d.is_custom,
        d.popularity_score, d.is_active, d.created_at, d.updated_at,
        c.name as category_name, c.description as category_description
      FROM designs d
      LEFT JOIN categories c ON d.category_id = c.id
      ${whereClause}
      ${orderClause}
      LIMIT ? OFFSET ?
    `
    
    const designs = await c.env.DB.prepare(designsQuery)
      .bind(...params, limit, offset)
      .all<Design & { category_name: string; category_description: string }>()

    // Parse JSON fields and add category info
    const processedDesigns = designs.results.map(design => ({
      ...design,
      colors: design.colors ? JSON.parse(design.colors) : [],
      patterns: design.patterns ? JSON.parse(design.patterns) : [],
      category: design.category_name ? {
        id: design.category_id!,
        name: design.category_name,
        description: design.category_description
      } : undefined
    }))

    const totalPages = Math.ceil(total / limit)

    return c.json<PaginatedResponse<Design>>({
      success: true,
      data: processedDesigns,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    })

  } catch (error) {
    console.error('Get designs error:', error)
    return c.json<ApiResponse>({ 
      success: false, 
      error: 'Failed to fetch designs' 
    }, 500)
  }
})

// Get featured/popular designs for homepage
designRoutes.get('/featured', async (c) => {
  try {
    const limit = parseInt(c.req.query('limit') || '8')

    const designs = await c.env.DB.prepare(`
      SELECT 
        d.id, d.name, d.description, d.image_url, d.thumbnail_url,
        d.colors, d.patterns, d.base_price, d.subscription_price, 
        d.is_premium, d.popularity_score,
        c.name as category_name
      FROM designs d
      LEFT JOIN categories c ON d.category_id = c.id
      WHERE d.is_active = TRUE
      ORDER BY d.popularity_score DESC, d.created_at DESC
      LIMIT ?
    `).bind(limit).all<Design & { category_name: string }>()

    // Parse JSON fields
    const processedDesigns = designs.results.map(design => ({
      ...design,
      colors: design.colors ? JSON.parse(design.colors) : [],
      patterns: design.patterns ? JSON.parse(design.patterns) : [],
      category_name: design.category_name
    }))

    return c.json<ApiResponse<Design[]>>({
      success: true,
      data: processedDesigns
    })

  } catch (error) {
    console.error('Get featured designs error:', error)
    return c.json<ApiResponse>({ 
      success: false, 
      error: 'Failed to fetch featured designs' 
    }, 500)
  }
})

// Get single design by ID
designRoutes.get('/:id', async (c) => {
  try {
    const designId = c.req.param('id')

    const design = await c.env.DB.prepare(`
      SELECT 
        d.id, d.name, d.description, d.category_id, d.image_url, d.thumbnail_url,
        d.colors, d.patterns, d.difficulty_level, d.estimated_time_minutes,
        d.base_price, d.subscription_price, d.is_premium, d.is_custom,
        d.popularity_score, d.is_active, d.created_at, d.updated_at,
        c.name as category_name, c.description as category_description
      FROM designs d
      LEFT JOIN categories c ON d.category_id = c.id
      WHERE d.id = ? AND d.is_active = TRUE
    `).bind(designId).first<Design & { category_name: string; category_description: string }>()

    if (!design) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: 'Design not found' 
      }, 404)
    }

    // Parse JSON fields and add category info
    const processedDesign = {
      ...design,
      colors: design.colors ? JSON.parse(design.colors) : [],
      patterns: design.patterns ? JSON.parse(design.patterns) : [],
      category: design.category_name ? {
        id: design.category_id!,
        name: design.category_name,
        description: design.category_description
      } : undefined
    }

    // Get related designs from same category
    const relatedDesigns = await c.env.DB.prepare(`
      SELECT 
        d.id, d.name, d.image_url, d.thumbnail_url, d.base_price, d.subscription_price, d.is_premium
      FROM designs d
      WHERE d.category_id = ? AND d.id != ? AND d.is_active = TRUE
      ORDER BY d.popularity_score DESC
      LIMIT 4
    `).bind(design.category_id, designId).all<Partial<Design>>()

    // Get reviews for this design
    const reviews = await c.env.DB.prepare(`
      SELECT 
        r.id, r.rating, r.review_text, r.images, r.is_featured, r.created_at,
        u.first_name, u.last_name
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.design_id = ? AND r.review_text IS NOT NULL
      ORDER BY r.is_featured DESC, r.created_at DESC
      LIMIT 10
    `).bind(designId).all()

    // Calculate average rating
    const avgRating = await c.env.DB.prepare(`
      SELECT AVG(rating) as avg_rating, COUNT(*) as total_reviews
      FROM reviews
      WHERE design_id = ?
    `).bind(designId).first<{ avg_rating: number; total_reviews: number }>()

    return c.json<ApiResponse>({
      success: true,
      data: {
        design: processedDesign,
        related_designs: relatedDesigns.results,
        reviews: reviews.results.map(review => ({
          ...review,
          images: review.images ? JSON.parse(review.images) : []
        })),
        rating_info: {
          average_rating: avgRating?.avg_rating || 0,
          total_reviews: avgRating?.total_reviews || 0
        }
      }
    })

  } catch (error) {
    console.error('Get design error:', error)
    return c.json<ApiResponse>({ 
      success: false, 
      error: 'Failed to fetch design' 
    }, 500)
  }
})

// Add design to favorites (requires auth)
designRoutes.post('/:id/favorite', authMiddleware, async (c) => {
  try {
    const designId = c.req.param('id')
    const userId = c.get('userId')

    // Check if design exists
    const design = await c.env.DB.prepare(
      'SELECT id FROM designs WHERE id = ? AND is_active = TRUE'
    ).bind(designId).first()

    if (!design) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: 'Design not found' 
      }, 404)
    }

    // Check if already favorited (would need a favorites table in production)
    // For now, just return success
    
    return c.json<ApiResponse>({
      success: true,
      message: 'Design added to favorites'
    })

  } catch (error) {
    console.error('Add favorite error:', error)
    return c.json<ApiResponse>({ 
      success: false, 
      error: 'Failed to add favorite' 
    }, 500)
  }
})

// Search designs with advanced filters
designRoutes.post('/search', async (c) => {
  try {
    const {
      query,
      categories,
      colors,
      price_min,
      price_max,
      difficulty,
      is_premium,
      page = 1,
      limit = 12
    } = await c.req.json()

    const offset = (page - 1) * limit
    let whereClause = 'WHERE d.is_active = TRUE'
    const params: any[] = []

    if (query) {
      whereClause += ' AND (d.name LIKE ? OR d.description LIKE ? OR d.patterns LIKE ?)'
      params.push(`%${query}%`, `%${query}%`, `%${query}%`)
    }

    if (categories && categories.length > 0) {
      const placeholders = categories.map(() => '?').join(',')
      whereClause += ` AND d.category_id IN (${placeholders})`
      params.push(...categories)
    }

    if (colors && colors.length > 0) {
      // Search in JSON colors field
      const colorConditions = colors.map(() => 'd.colors LIKE ?').join(' OR ')
      whereClause += ` AND (${colorConditions})`
      params.push(...colors.map((color: string) => `%${color}%`))
    }

    if (price_min !== undefined) {
      whereClause += ' AND d.base_price >= ?'
      params.push(price_min)
    }

    if (price_max !== undefined) {
      whereClause += ' AND d.base_price <= ?'
      params.push(price_max)
    }

    if (difficulty) {
      whereClause += ' AND d.difficulty_level = ?'
      params.push(difficulty)
    }

    if (is_premium !== undefined) {
      whereClause += ' AND d.is_premium = ?'
      params.push(is_premium)
    }

    // Get total count
    const countResult = await c.env.DB.prepare(`
      SELECT COUNT(*) as total FROM designs d ${whereClause}
    `).bind(...params).first<{ total: number }>()

    const total = countResult?.total || 0

    // Get designs
    const designs = await c.env.DB.prepare(`
      SELECT 
        d.id, d.name, d.description, d.image_url, d.thumbnail_url,
        d.colors, d.patterns, d.base_price, d.subscription_price, 
        d.is_premium, d.difficulty_level, d.popularity_score,
        c.name as category_name
      FROM designs d
      LEFT JOIN categories c ON d.category_id = c.id
      ${whereClause}
      ORDER BY d.popularity_score DESC
      LIMIT ? OFFSET ?
    `).bind(...params, limit, offset).all<Design & { category_name: string }>()

    const processedDesigns = designs.results.map(design => ({
      ...design,
      colors: design.colors ? JSON.parse(design.colors) : [],
      patterns: design.patterns ? JSON.parse(design.patterns) : []
    }))

    return c.json<PaginatedResponse<Design>>({
      success: true,
      data: processedDesigns,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Advanced search error:', error)
    return c.json<ApiResponse>({ 
      success: false, 
      error: 'Search failed' 
    }, 500)
  }
})