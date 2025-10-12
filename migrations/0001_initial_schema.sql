-- Users table for authentication and user management
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  birth_date DATE,
  is_email_verified BOOLEAN DEFAULT FALSE,
  subscription_status TEXT DEFAULT 'none' CHECK (subscription_status IN ('none', 'monthly', 'annual')),
  subscription_start_date DATE,
  subscription_end_date DATE,
  referral_code TEXT UNIQUE,
  referred_by INTEGER,
  total_referrals INTEGER DEFAULT 0,
  free_nails_balance INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (referred_by) REFERENCES users(id)
);

-- User addresses for shipping
CREATE TABLE IF NOT EXISTS user_addresses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  recipient_name TEXT NOT NULL,
  street_address TEXT NOT NULL,
  apartment TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  country TEXT DEFAULT 'USA',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Nail art categories (e.g., "Abstract", "French", "Seasonal", "Custom")
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Nail art designs portfolio
CREATE TABLE IF NOT EXISTS designs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  category_id INTEGER,
  image_url TEXT NOT NULL,
  thumbnail_url TEXT,
  colors TEXT, -- JSON array of color codes
  patterns TEXT, -- JSON array of pattern descriptions
  difficulty_level TEXT DEFAULT 'medium' CHECK (difficulty_level IN ('easy', 'medium', 'hard')),
  estimated_time_minutes INTEGER DEFAULT 30,
  base_price DECIMAL(10,2) NOT NULL,
  subscription_price DECIMAL(10,2), -- Price for subscribers (can be lower or null for free)
  is_premium BOOLEAN DEFAULT FALSE,
  is_custom BOOLEAN DEFAULT FALSE,
  popularity_score INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- Custom nail design submissions from users
CREATE TABLE IF NOT EXISTS custom_designs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  reference_images TEXT, -- JSON array of uploaded image URLs
  special_instructions TEXT,
  colors_requested TEXT, -- JSON array of requested colors
  inspiration_design_id INTEGER, -- Reference to existing design if based on one
  estimated_price DECIMAL(10,2),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'in_progress', 'completed', 'rejected')),
  admin_notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (inspiration_design_id) REFERENCES designs(id)
);

-- Shopping cart items
CREATE TABLE IF NOT EXISTS cart_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  design_id INTEGER,
  custom_design_id INTEGER,
  quantity INTEGER DEFAULT 1,
  nail_size TEXT NOT NULL, -- XS, S, M, L, XL
  special_instructions TEXT,
  price DECIMAL(10,2) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (design_id) REFERENCES designs(id),
  FOREIGN KEY (custom_design_id) REFERENCES custom_designs(id)
);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  order_number TEXT UNIQUE NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  shipping_cost DECIMAL(10,2) DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  order_status TEXT DEFAULT 'processing' CHECK (order_status IN ('processing', 'confirmed', 'manufacturing', 'shipped', 'delivered', 'cancelled')),
  payment_method TEXT,
  payment_transaction_id TEXT,
  
  -- Shipping address (denormalized for historical record)
  shipping_name TEXT NOT NULL,
  shipping_street TEXT NOT NULL,
  shipping_apartment TEXT,
  shipping_city TEXT NOT NULL,
  shipping_state TEXT NOT NULL,
  shipping_zip TEXT NOT NULL,
  shipping_country TEXT DEFAULT 'USA',
  
  tracking_number TEXT,
  estimated_delivery_date DATE,
  shipped_at DATETIME,
  delivered_at DATETIME,
  
  referral_discount_used BOOLEAN DEFAULT FALSE,
  free_nails_used INTEGER DEFAULT 0,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Order items (products in each order)
CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  design_id INTEGER,
  custom_design_id INTEGER,
  design_name TEXT NOT NULL, -- Snapshot of design name at time of order
  quantity INTEGER NOT NULL,
  nail_size TEXT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  special_instructions TEXT,
  manufacturing_status TEXT DEFAULT 'pending' CHECK (manufacturing_status IN ('pending', 'in_progress', 'completed')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (design_id) REFERENCES designs(id),
  FOREIGN KEY (custom_design_id) REFERENCES custom_designs(id)
);

-- Subscription plans
CREATE TABLE IF NOT EXISTS subscription_plans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  price_monthly DECIMAL(10,2) NOT NULL,
  price_annual DECIMAL(10,2),
  benefits TEXT, -- JSON array of benefits
  max_designs_per_month INTEGER,
  discount_percentage INTEGER DEFAULT 0,
  free_shipping BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- User subscription history
CREATE TABLE IF NOT EXISTS subscription_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  plan_id INTEGER NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired')),
  payment_transaction_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (plan_id) REFERENCES subscription_plans(id)
);

-- Referral tracking
CREATE TABLE IF NOT EXISTS referrals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  referrer_id INTEGER NOT NULL,
  referee_id INTEGER NOT NULL,
  referral_code TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired')),
  reward_type TEXT, -- 'free_nails', 'discount', etc.
  reward_value INTEGER, -- Number of free nails or discount amount
  completed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (referrer_id) REFERENCES users(id),
  FOREIGN KEY (referee_id) REFERENCES users(id)
);

-- Inventory management (for dropshipping tracking)
CREATE TABLE IF NOT EXISTS suppliers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  contact_email TEXT,
  contact_phone TEXT,
  address TEXT,
  api_endpoint TEXT,
  api_key_encrypted TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  reliability_score INTEGER DEFAULT 100,
  average_fulfillment_days INTEGER DEFAULT 7,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Product inventory from suppliers
CREATE TABLE IF NOT EXISTS supplier_products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  supplier_id INTEGER NOT NULL,
  design_id INTEGER NOT NULL,
  supplier_product_id TEXT NOT NULL,
  cost_price DECIMAL(10,2) NOT NULL,
  stock_quantity INTEGER DEFAULT 0,
  restock_threshold INTEGER DEFAULT 10,
  last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
  FOREIGN KEY (design_id) REFERENCES designs(id)
);

-- Reviews and ratings
CREATE TABLE IF NOT EXISTS reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  order_id INTEGER NOT NULL,
  design_id INTEGER,
  custom_design_id INTEGER,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  images TEXT, -- JSON array of review image URLs
  is_verified_purchase BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  admin_response TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (design_id) REFERENCES designs(id),
  FOREIGN KEY (custom_design_id) REFERENCES custom_designs(id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);
CREATE INDEX IF NOT EXISTS idx_designs_category ON designs(category_id);
CREATE INDEX IF NOT EXISTS idx_designs_active ON designs(is_active);
CREATE INDEX IF NOT EXISTS idx_designs_popularity ON designs(popularity_score DESC);
CREATE INDEX IF NOT EXISTS idx_custom_designs_user ON custom_designs(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_designs_status ON custom_designs(status);
CREATE INDEX IF NOT EXISTS idx_cart_items_user ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(order_status);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_reviews_design ON reviews(design_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);