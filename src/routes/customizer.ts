import { Hono } from 'hono'
import type { Bindings, ApiResponse } from '../types'
import { authMiddleware } from './auth'

export const customizerRoutes = new Hono<{ Bindings: Bindings }>()

// Get design templates and assets for customizer
customizerRoutes.get('/templates', async (c) => {
  try {
    // Get nail shapes, base colors, patterns, and textures
    const templates = {
      nail_shapes: [
        { id: 'square', name: 'Square', preview: '/static/images/shapes/square.svg' },
        { id: 'round', name: 'Round', preview: '/static/images/shapes/round.svg' },
        { id: 'oval', name: 'Oval', preview: '/static/images/shapes/oval.svg' },
        { id: 'almond', name: 'Almond', preview: '/static/images/shapes/almond.svg' },
        { id: 'stiletto', name: 'Stiletto', preview: '/static/images/shapes/stiletto.svg' },
        { id: 'coffin', name: 'Coffin', preview: '/static/images/shapes/coffin.svg' },
        { id: 'squoval', name: 'Squoval', preview: '/static/images/shapes/squoval.svg' }
      ],
      base_colors: [
        '#FFFFFF', '#FFB6C1', '#DDA0DD', '#87CEEB', '#98FB98', '#F0E68C',
        '#FFA07A', '#20B2AA', '#87CEFA', '#DDA0DD', '#F5DEB3', '#FFF8DC',
        '#FF69B4', '#FF1493', '#DC143C', '#B22222', '#8B0000', '#000000',
        '#2F4F4F', '#708090', '#D3D3D3', '#A9A9A9', '#696969', '#363636'
      ],
      patterns: [
        { id: 'solid', name: 'Solid Color', preview: 'solid' },
        { id: 'french', name: 'French Tip', preview: 'french' },
        { id: 'gradient', name: 'Gradient', preview: 'gradient' },
        { id: 'ombre', name: 'Ombre', preview: 'ombre' },
        { id: 'marble', name: 'Marble', preview: 'marble' },
        { id: 'glitter', name: 'Glitter', preview: 'glitter' },
        { id: 'chrome', name: 'Chrome', preview: 'chrome' },
        { id: 'matte', name: 'Matte', preview: 'matte' },
        { id: 'holographic', name: 'Holographic', preview: 'holographic' },
        { id: 'geometric', name: 'Geometric', preview: 'geometric' },
        { id: 'floral', name: 'Floral', preview: 'floral' },
        { id: 'abstract', name: 'Abstract Art', preview: 'abstract' }
      ],
      textures: [
        { id: 'glossy', name: 'Glossy', description: 'High shine finish' },
        { id: 'matte', name: 'Matte', description: 'No shine, smooth finish' },
        { id: 'satin', name: 'Satin', description: 'Subtle shine' },
        { id: 'glitter', name: 'Glitter', description: 'Sparkly particles' },
        { id: 'chrome', name: 'Chrome', description: 'Mirror-like metallic' },
        { id: 'velvet', name: 'Velvet', description: 'Soft, textured feel' },
        { id: 'sand', name: 'Sand', description: 'Gritty texture' }
      ],
      sizes: [
        { id: 'xs', name: 'XS', width: '8mm', description: 'Extra Small' },
        { id: 's', name: 'S', width: '10mm', description: 'Small' },
        { id: 'm', name: 'M', width: '12mm', description: 'Medium' },
        { id: 'l', name: 'L', width: '14mm', description: 'Large' },
        { id: 'xl', name: 'XL', width: '16mm', description: 'Extra Large' }
      ]
    }

    return c.json<ApiResponse>({
      success: true,
      data: templates
    })

  } catch (error) {
    console.error('Get templates error:', error)
    return c.json<ApiResponse>({ 
      success: false, 
      error: 'Failed to fetch templates' 
    }, 500)
  }
})

// Save custom design
customizerRoutes.post('/save-design', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const { 
      name, 
      description,
      design_data, // JSON object with shape, colors, patterns, etc.
      preview_image_url,
      is_public = false 
    } = await c.req.json()

    if (!name || !design_data) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: 'Name and design data are required' 
      }, 400)
    }

    // Save to custom_designs table
    const result = await c.env.DB.prepare(`
      INSERT INTO custom_designs (
        user_id, name, description, reference_images, 
        special_instructions, colors_requested, status
      ) VALUES (?, ?, ?, ?, ?, ?, 'completed')
    `).bind(
      userId, 
      name, 
      description || null,
      JSON.stringify([preview_image_url || '']),
      JSON.stringify(design_data),
      JSON.stringify(design_data.colors || [])
    ).run()

    return c.json<ApiResponse>({
      success: true,
      data: { id: result.meta?.last_row_id },
      message: 'Design saved successfully'
    })

  } catch (error) {
    console.error('Save design error:', error)
    return c.json<ApiResponse>({ 
      success: false, 
      error: 'Failed to save design' 
    }, 500)
  }
})

// Upload user design image
customizerRoutes.post('/upload-design', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    
    // In a real implementation, you would handle file upload here
    // For demo purposes, we'll simulate this
    const { 
      image_data, // base64 or file upload
      name,
      description,
      category_id,
      tags = []
    } = await c.req.json()

    if (!image_data || !name) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: 'Image and name are required' 
      }, 400)
    }

    // In production, upload to R2 or other storage
    const mockImageUrl = `/static/images/user-uploads/${Date.now()}-${userId}.jpg`

    // Save to custom designs
    const result = await c.env.DB.prepare(`
      INSERT INTO custom_designs (
        user_id, name, description, reference_images, 
        special_instructions, status
      ) VALUES (?, ?, ?, ?, ?, 'pending')
    `).bind(
      userId,
      name,
      description || null,
      JSON.stringify([mockImageUrl]),
      JSON.stringify({ tags, category_id }),
    ).run()

    return c.json<ApiResponse>({
      success: true,
      data: { 
        id: result.meta?.last_row_id,
        preview_url: mockImageUrl
      },
      message: 'Design uploaded successfully and pending review'
    })

  } catch (error) {
    console.error('Upload design error:', error)
    return c.json<ApiResponse>({ 
      success: false, 
      error: 'Failed to upload design' 
    }, 500)
  }
})

// Get user's custom designs
customizerRoutes.get('/my-designs', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')

    const designs = await c.env.DB.prepare(`
      SELECT * FROM custom_designs 
      WHERE user_id = ? 
      ORDER BY created_at DESC
    `).bind(userId).all()

    const processedDesigns = designs.results.map(design => ({
      ...design,
      reference_images: design.reference_images ? JSON.parse(design.reference_images) : [],
      special_instructions: design.special_instructions ? JSON.parse(design.special_instructions) : null,
      colors_requested: design.colors_requested ? JSON.parse(design.colors_requested) : []
    }))

    return c.json<ApiResponse>({
      success: true,
      data: processedDesigns
    })

  } catch (error) {
    console.error('Get user designs error:', error)
    return c.json<ApiResponse>({ 
      success: false, 
      error: 'Failed to fetch designs' 
    }, 500)
  }
})