-- Insert nail art categories
INSERT OR IGNORE INTO categories (name, description, display_order) VALUES 
  ('French Classic', 'Timeless French manicure styles with modern twists', 1),
  ('Abstract Art', 'Creative abstract patterns and artistic designs', 2),
  ('Seasonal', 'Holiday and seasonal themed nail art', 3),
  ('Minimalist', 'Clean, simple, and elegant designs', 4),
  ('Glitter & Glam', 'Sparkly and glamorous nail designs', 5),
  ('Floral', 'Beautiful flower and botanical patterns', 6),
  ('Geometric', 'Modern geometric shapes and patterns', 7),
  ('Vintage', 'Retro and vintage-inspired designs', 8),
  ('Animals', 'Cute animal and wildlife themed nails', 9),
  ('Custom', 'User-submitted custom designs', 10);

-- Insert subscription plans
INSERT OR IGNORE INTO subscription_plans (name, description, price_monthly, price_annual, benefits, max_designs_per_month, discount_percentage, free_shipping) VALUES 
  ('Basic Monthly', 'Access to premium designs with monthly billing', 24.99, NULL, '["Access to premium designs", "Priority customer support", "15% discount on custom designs"]', 2, 10, TRUE),
  ('Premium Annual', 'Full access with annual billing and best value', 19.99, 199.99, '["Unlimited premium designs", "Free custom design consultations", "Priority manufacturing", "Free shipping", "Exclusive seasonal collections"]', -1, 25, TRUE),
  ('VIP Unlimited', 'Ultimate nail art experience with unlimited access', 39.99, 399.99, '["Unlimited everything", "Personal nail artist consultation", "Express 2-day shipping", "Exclusive VIP designs", "First access to new collections"]', -1, 30, TRUE);

-- Insert sample suppliers (for dropshipping)
INSERT OR IGNORE INTO suppliers (name, contact_email, contact_phone, address, reliability_score, average_fulfillment_days) VALUES 
  ('NailPro Manufacturing USA', 'orders@nailpro-usa.com', '(555) 123-4567', '1234 Nail Street, Los Angeles, CA 90210', 95, 3),
  ('Eco Nails Direct', 'fulfillment@econails.com', '(555) 234-5678', '5678 Green Ave, Portland, OR 97201', 92, 4),
  ('Premium Nail Works', 'support@premiumnails.com', '(555) 345-6789', '9012 Craft Blvd, Austin, TX 78701', 97, 2);

-- Insert sample nail art designs (French Classic category)
INSERT OR IGNORE INTO designs (name, description, category_id, image_url, thumbnail_url, colors, patterns, base_price, subscription_price, is_premium) VALUES 
  ('Classic White French', 'Traditional white tip French manicure with clear base', 1, '/static/images/designs/french-classic-white.jpg', '/static/images/designs/thumbs/french-classic-white.jpg', '["#FFFFFF", "#F8F8FF"]', '["French tip", "Clean line"]', 15.99, 9.99, FALSE),
  ('Rose Gold French', 'Elegant rose gold French tips with nude base', 1, '/static/images/designs/french-rose-gold.jpg', '/static/images/designs/thumbs/french-rose-gold.jpg', '["#E8B4A0", "#F5E6D3"]', '["French tip", "Metallic finish"]', 19.99, 12.99, TRUE),
  ('Black French Modern', 'Chic black French tips with matte finish', 1, '/static/images/designs/french-black-modern.jpg', '/static/images/designs/thumbs/french-black-modern.jpg', '["#000000", "#F5F5F5"]', '["French tip", "Matte finish"]', 17.99, 11.99, TRUE);

-- Insert sample designs (Abstract Art category)
INSERT OR IGNORE INTO designs (name, description, category_id, image_url, thumbnail_url, colors, patterns, base_price, subscription_price, is_premium) VALUES 
  ('Marble Swirl', 'Beautiful marble effect with gold veining', 2, '/static/images/designs/abstract-marble.jpg', '/static/images/designs/thumbs/abstract-marble.jpg', '["#FFFFFF", "#C0C0C0", "#FFD700"]', '["Marble", "Veining", "Abstract"]', 22.99, 15.99, TRUE),
  ('Rainbow Gradient', 'Vibrant rainbow gradient with smooth transitions', 2, '/static/images/designs/abstract-rainbow.jpg', '/static/images/designs/thumbs/abstract-rainbow.jpg', '["#FF0000", "#FF7F00", "#FFFF00", "#00FF00", "#0000FF", "#4B0082", "#9400D3"]', '["Gradient", "Rainbow", "Ombre"]', 24.99, 16.99, TRUE),
  ('Watercolor Splash', 'Artistic watercolor effect in soft pastels', 2, '/static/images/designs/abstract-watercolor.jpg', '/static/images/designs/thumbs/abstract-watercolor.jpg', '["#FFB6C1", "#E6E6FA", "#B0E0E6"]', '["Watercolor", "Splash", "Soft blend"]', 20.99, 13.99, TRUE);

-- Insert sample designs (Minimalist category)
INSERT OR IGNORE INTO designs (name, description, category_id, image_url, thumbnail_url, colors, patterns, base_price, subscription_price, is_premium) VALUES 
  ('Nude Elegance', 'Simple nude base with single gold stripe accent', 4, '/static/images/designs/minimal-nude.jpg', '/static/images/designs/thumbs/minimal-nude.jpg', '["#F5DEB3", "#FFD700"]', '["Nude base", "Stripe accent"]', 14.99, 8.99, FALSE),
  ('Matte Black Minimal', 'Sleek matte black with geometric accent nail', 4, '/static/images/designs/minimal-black.jpg', '/static/images/designs/thumbs/minimal-black.jpg', '["#000000", "#FFFFFF"]', '["Matte finish", "Geometric accent"]', 16.99, 10.99, TRUE),
  ('Clear Glass Effect', 'Crystal clear with subtle iridescent shimmer', 4, '/static/images/designs/minimal-clear.jpg', '/static/images/designs/thumbs/minimal-clear.jpg', '["#FFFFFF", "#F0F8FF"]', '["Clear base", "Iridescent shimmer"]', 13.99, 7.99, FALSE);

-- Insert sample designs (Glitter & Glam category)
INSERT OR IGNORE INTO designs (name, description, category_id, image_url, thumbnail_url, colors, patterns, base_price, subscription_price, is_premium) VALUES 
  ('Holographic Dreams', 'Full holographic glitter with rainbow reflections', 5, '/static/images/designs/glitter-holo.jpg', '/static/images/designs/thumbs/glitter-holo.jpg', '["#C0C0C0", "holographic"]', '["Full glitter", "Holographic", "Rainbow shift"]', 28.99, 19.99, TRUE),
  ('Rose Gold Sparkle', 'Rose gold base with chunky glitter overlay', 5, '/static/images/designs/glitter-rose-gold.jpg', '/static/images/designs/thumbs/glitter-rose-gold.jpg', '["#E8B4A0", "#FFD700"]', '["Glitter overlay", "Chunky sparkles"]', 25.99, 17.99, TRUE),
  ('Silver Chrome Mirror', 'Ultra-reflective chrome mirror finish', 5, '/static/images/designs/glitter-chrome.jpg', '/static/images/designs/thumbs/glitter-chrome.jpg', '["#C0C0C0", "#B8B8B8"]', '["Chrome finish", "Mirror effect"]', 32.99, 22.99, TRUE);

-- Insert sample designs (Floral category)
INSERT OR IGNORE INTO designs (name, description, category_id, image_url, thumbnail_url, colors, patterns, base_price, subscription_price, is_premium) VALUES 
  ('Cherry Blossoms', 'Delicate pink cherry blossoms on nude base', 6, '/static/images/designs/floral-cherry.jpg', '/static/images/designs/thumbs/floral-cherry.jpg', '["#FFB6C1", "#FFFFFF", "#90EE90"]', '["Cherry blossoms", "Floral art", "Spring theme"]', 21.99, 14.99, TRUE),
  ('Vintage Roses', 'Classic red roses with gold leaf accents', 6, '/static/images/designs/floral-roses.jpg', '/static/images/designs/thumbs/floral-roses.jpg', '["#DC143C", "#FFD700", "#228B22"]', '["Rose pattern", "Gold leaf", "Vintage style"]', 26.99, 18.99, TRUE),
  ('Tropical Hibiscus', 'Bright tropical hibiscus flowers with palm leaves', 6, '/static/images/designs/floral-hibiscus.jpg', '/static/images/designs/thumbs/floral-hibiscus.jpg', '["#FF4500", "#FF69B4", "#32CD32"]', '["Hibiscus", "Tropical", "Palm leaves"]', 23.99, 16.99, TRUE);

-- Insert sample designs (Seasonal category)
INSERT OR IGNORE INTO designs (name, description, category_id, image_url, thumbnail_url, colors, patterns, base_price, subscription_price, is_premium) VALUES 
  ('Halloween Spooky', 'Black and orange Halloween theme with spider web', 3, '/static/images/designs/seasonal-halloween.jpg', '/static/images/designs/thumbs/seasonal-halloween.jpg', '["#000000", "#FF8C00", "#FFFFFF"]', '["Spider web", "Halloween", "Spooky"]', 18.99, 12.99, TRUE),
  ('Christmas Holly', 'Festive red and green with holly and berries', 3, '/static/images/designs/seasonal-christmas.jpg', '/static/images/designs/thumbs/seasonal-christmas.jpg', '["#DC143C", "#228B22", "#FFD700"]', '["Holly leaves", "Berries", "Christmas"]', 20.99, 14.99, TRUE),
  ('Valentine Hearts', 'Romantic pink and red hearts with glitter', 3, '/static/images/designs/seasonal-valentine.jpg', '/static/images/designs/thumbs/seasonal-valentine.jpg', '["#FF69B4", "#DC143C", "#FFB6C1"]', '["Hearts", "Valentine", "Romantic"]', 19.99, 13.99, TRUE);

-- Create sample test user
INSERT OR IGNORE INTO users (email, password_hash, first_name, last_name, referral_code) VALUES 
  ('demo@nailart.com', 'hashed_password_placeholder', 'Demo', 'User', 'DEMO2024');

-- Link suppliers to products
INSERT OR IGNORE INTO supplier_products (supplier_id, design_id, supplier_product_id, cost_price, stock_quantity) VALUES 
  (1, 1, 'NP-FRENCH-001', 8.99, 100),
  (1, 2, 'NP-FRENCH-002', 11.99, 75),
  (2, 3, 'EN-FRENCH-003', 10.99, 50),
  (1, 4, 'NP-ABS-001', 13.99, 60),
  (2, 5, 'EN-ABS-002', 15.99, 40),
  (3, 6, 'PN-ABS-003', 12.99, 80);