// Database bindings for Cloudflare
export interface Bindings {
  DB: D1Database;
}

// User types
export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  birth_date?: string;
  subscription_status: 'none' | 'monthly' | 'annual';
  referral_code?: string;
  referred_by?: number;
  total_referrals: number;
  free_nails_balance: number;
  created_at: string;
  updated_at: string;
}

export interface UserAddress {
  id: number;
  user_id: number;
  is_default: boolean;
  recipient_name: string;
  street_address: string;
  apartment?: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  created_at: string;
}

// Design types
export interface Category {
  id: number;
  name: string;
  description?: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

export interface Design {
  id: number;
  name: string;
  description?: string;
  category_id?: number;
  image_url: string;
  thumbnail_url?: string;
  colors: string[]; // JSON parsed array
  patterns: string[]; // JSON parsed array
  difficulty_level: 'easy' | 'medium' | 'hard';
  estimated_time_minutes: number;
  base_price: number;
  subscription_price?: number;
  is_premium: boolean;
  is_custom: boolean;
  popularity_score: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  category?: Category;
}

export interface CustomDesign {
  id: number;
  user_id: number;
  name: string;
  description?: string;
  reference_images: string[]; // JSON parsed array
  special_instructions?: string;
  colors_requested: string[]; // JSON parsed array
  inspiration_design_id?: number;
  estimated_price?: number;
  status: 'pending' | 'approved' | 'in_progress' | 'completed' | 'rejected';
  admin_notes?: string;
  created_at: string;
  updated_at: string;
}

// Cart and Order types
export interface CartItem {
  id: number;
  user_id: number;
  design_id?: number;
  custom_design_id?: number;
  quantity: number;
  nail_size: string;
  special_instructions?: string;
  price: number;
  created_at: string;
  design?: Design;
  custom_design?: CustomDesign;
}

export interface Order {
  id: number;
  user_id: number;
  order_number: string;
  subtotal: number;
  tax_amount: number;
  shipping_cost: number;
  discount_amount: number;
  total_amount: number;
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  order_status: 'processing' | 'confirmed' | 'manufacturing' | 'shipped' | 'delivered' | 'cancelled';
  payment_method?: string;
  payment_transaction_id?: string;
  shipping_name: string;
  shipping_street: string;
  shipping_apartment?: string;
  shipping_city: string;
  shipping_state: string;
  shipping_zip: string;
  shipping_country: string;
  tracking_number?: string;
  estimated_delivery_date?: string;
  shipped_at?: string;
  delivered_at?: string;
  referral_discount_used: boolean;
  free_nails_used: number;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: number;
  order_id: number;
  design_id?: number;
  custom_design_id?: number;
  design_name: string;
  quantity: number;
  nail_size: string;
  unit_price: number;
  total_price: number;
  special_instructions?: string;
  manufacturing_status: 'pending' | 'in_progress' | 'completed';
  created_at: string;
}

// Subscription types
export interface SubscriptionPlan {
  id: number;
  name: string;
  description?: string;
  price_monthly: number;
  price_annual?: number;
  benefits: string[]; // JSON parsed array
  max_designs_per_month: number; // -1 for unlimited
  discount_percentage: number;
  free_shipping: boolean;
  is_active: boolean;
  created_at: string;
}

// Review types
export interface Review {
  id: number;
  user_id: number;
  order_id: number;
  design_id?: number;
  custom_design_id?: number;
  rating: number;
  review_text?: string;
  images: string[]; // JSON parsed array
  is_verified_purchase: boolean;
  is_featured: boolean;
  admin_response?: string;
  created_at: string;
  user?: User;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Auth types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  referral_code?: string;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  token?: string;
  error?: string;
}

// Cart types
export interface AddToCartRequest {
  design_id?: number;
  custom_design_id?: number;
  quantity: number;
  nail_size: string;
  special_instructions?: string;
}

// Custom design submission
export interface CustomDesignRequest {
  name: string;
  description?: string;
  reference_images: string[];
  special_instructions?: string;
  colors_requested: string[];
  inspiration_design_id?: number;
}