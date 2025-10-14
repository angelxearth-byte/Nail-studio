import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'
import { renderer } from './renderer'
import type { Bindings } from './types'

// Import route handlers
import { authRoutes } from './routes/auth'
import { designRoutes } from './routes/designs'
import { cartRoutes } from './routes/cart'
import { orderRoutes } from './routes/orders'
import { userRoutes } from './routes/user'
import { subscriptionRoutes } from './routes/subscriptions'

const app = new Hono<{ Bindings: Bindings }>()

// Enable CORS for API routes
app.use('/api/*', cors({
  origin: ['http://localhost:3000', 'https://webapp.pages.dev'],
  credentials: true
}))

// Serve static files
app.use('/static/*', serveStatic({ root: './public' }))

// Use the renderer for HTML responses
app.use(renderer)

// API Routes
app.route('/api/auth', authRoutes)
app.route('/api/designs', designRoutes)
app.route('/api/cart', cartRoutes)
app.route('/api/orders', orderRoutes)
app.route('/api/user', userRoutes)
app.route('/api/subscriptions', subscriptionRoutes)

// Main page route
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>NailCraft Studio - Custom Nail Art Subscription</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <link href="/static/styles.css" rel="stylesheet">
        <script>
          tailwind.config = {
            theme: {
              extend: {
                colors: {
                  'primary': '#2563eb',
                  'primary-dark': '#1d4ed8',
                  'secondary': '#7c3aed',
                  'accent': '#f59e0b',
                  'success': '#059669',
                  'danger': '#dc2626',
                  'warning': '#d97706',
                  'dark': '#111827',
                  'light': '#f8fafc',
                  'muted': '#64748b'
                },
                fontFamily: {
                  'sans': ['Inter', 'system-ui', 'sans-serif']
                },
                animation: {
                  'fade-in': 'fadeIn 0.5s ease-in-out',
                  'slide-up': 'slideUp 0.3s ease-out',
                  'bounce-subtle': 'bounceSubtle 2s infinite',
                  'pulse-soft': 'pulseSoft 2s infinite'
                },
                boxShadow: {
                  'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
                  'medium': '0 4px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 30px -5px rgba(0, 0, 0, 0.08)',
                  'strong': '0 10px 40px -10px rgba(0, 0, 0, 0.2), 0 20px 50px -10px rgba(0, 0, 0, 0.15)'
                }
              }
            }
          }
        </script>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes slideUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes bounceSubtle {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-5px); }
          }
          @keyframes pulseSoft {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.02); }
          }
        </style>
    </head>
    <body class="bg-light font-sans min-h-screen">
        <div id="app">
            <!-- Header -->
            <header class="bg-white border-b border-gray-100 sticky top-0 z-50 backdrop-blur-md bg-white/95">
                <nav class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div class="flex justify-between items-center h-16">
                        <div class="flex items-center">
                            <div class="flex-shrink-0 flex items-center group cursor-pointer">
                                <div class="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center mr-3 group-hover:scale-105 transition-transform">
                                    <i class="fas fa-gem text-white text-sm"></i>
                                </div>
                                <h1 class="text-xl font-bold text-dark">NailCraft</h1>
                                <span class="text-xs font-medium text-primary ml-1 bg-primary/10 px-2 py-0.5 rounded-full">Studio</span>
                            </div>
                            <div class="hidden lg:block ml-12">
                                <div class="flex items-center space-x-8">
                                    <a href="#portfolio" class="nav-link group">
                                        <span>Portfolio</span>
                                        <div class="w-0 group-hover:w-full h-0.5 bg-primary transition-all duration-300"></div>
                                    </a>
                                    <a href="#custom" class="nav-link group">
                                        <span>Custom</span>
                                        <div class="w-0 group-hover:w-full h-0.5 bg-primary transition-all duration-300"></div>
                                    </a>
                                    <a href="#subscriptions" class="nav-link group">
                                        <span>Plans</span>
                                        <div class="w-0 group-hover:w-full h-0.5 bg-primary transition-all duration-300"></div>
                                    </a>
                                    <a href="#about" class="nav-link group">
                                        <span>About</span>
                                        <div class="w-0 group-hover:w-full h-0.5 bg-primary transition-all duration-300"></div>
                                    </a>
                                </div>
                            </div>
                        </div>
                        <div class="flex items-center space-x-4">
                            <button class="hidden md:block text-muted hover:text-dark transition-colors p-2">
                                <i class="fas fa-search text-lg"></i>
                            </button>
                            <button id="cart-btn" class="relative p-2 text-muted hover:text-dark transition-all duration-200 hover:bg-gray-50 rounded-lg group">
                                <i class="fas fa-shopping-bag text-lg group-hover:scale-110 transition-transform"></i>
                                <span id="cart-count" class="absolute -top-1 -right-1 bg-danger text-white text-xs rounded-full h-5 w-5 flex items-center justify-center hidden animate-pulse">0</span>
                            </button>
                            <button class="hidden md:block text-muted hover:text-dark transition-colors p-2">
                                <i class="fas fa-heart text-lg"></i>
                            </button>
                            <button id="auth-btn" class="bg-primary text-white px-6 py-2.5 rounded-xl hover:bg-primary-dark transition-all duration-200 font-medium shadow-soft hover:shadow-medium transform hover:scale-105">
                                Sign In
                            </button>
                            <button class="md:hidden p-2 text-muted hover:text-dark">
                                <i class="fas fa-bars text-lg"></i>
                            </button>
                        </div>
                    </div>
                </nav>
            </header>

            <!-- Hero Section -->
            <section class="relative overflow-hidden bg-gradient-to-br from-primary via-secondary to-primary-dark">
                <!-- Background Pattern -->
                <div class="absolute inset-0 opacity-10">
                    <div class="absolute inset-0" style="background-image: radial-gradient(circle at 20% 20%, rgba(255,255,255,0.1) 1px, transparent 1px); background-size: 50px 50px;"></div>
                </div>
                
                <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
                    <div class="grid lg:grid-cols-2 gap-12 items-center">
                        <div class="text-white animate-fade-in">
                            <div class="inline-flex items-center bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
                                <span class="text-sm font-medium">✨ New Collection Available</span>
                            </div>
                            <h1 class="text-5xl lg:text-7xl font-bold mb-6 leading-tight">
                                Premium
                                <span class="bg-gradient-to-r from-accent to-yellow-300 bg-clip-text text-transparent">
                                    Nail Art
                                </span>
                                <br>Delivered
                            </h1>
                            <p class="text-xl lg:text-2xl text-white/80 mb-8 leading-relaxed">
                                Discover thousands of stunning designs, create custom art, 
                                and enjoy subscription benefits with premium quality.
                            </p>
                            <div class="flex flex-col sm:flex-row gap-4">
                                <button class="group bg-white text-primary px-8 py-4 rounded-xl text-lg font-semibold hover:bg-gray-50 transition-all duration-200 flex items-center justify-center shadow-strong hover:shadow-xl transform hover:scale-105">
                                    <i class="fas fa-palette mr-3 group-hover:rotate-12 transition-transform"></i>
                                    Explore Designs
                                </button>
                                <button class="group border-2 border-white/30 backdrop-blur-sm text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-white/10 transition-all duration-200 flex items-center justify-center">
                                    <i class="fas fa-play mr-3 group-hover:scale-110 transition-transform"></i>
                                    Watch Demo
                                </button>
                            </div>
                            <div class="flex items-center mt-8 space-x-6">
                                <div class="flex items-center text-white/80">
                                    <i class="fas fa-star text-accent mr-2"></i>
                                    <span class="font-medium">4.9/5</span>
                                    <span class="ml-1 text-sm">(2.1k reviews)</span>
                                </div>
                                <div class="flex items-center text-white/80">
                                    <i class="fas fa-shipping-fast text-success mr-2"></i>
                                    <span class="text-sm">Free shipping worldwide</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="relative animate-fade-in">
                            <div class="grid grid-cols-2 gap-4 lg:gap-6">
                                <div class="space-y-4 lg:space-y-6">
                                    <div class="nail-showcase-card animate-bounce-subtle">
                                        <img src="/static/images/hero-nail-1.jpg" alt="French Elegance" class="w-full h-32 lg:h-40 object-cover rounded-2xl shadow-strong">
                                        <div class="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent rounded-2xl"></div>
                                        <div class="absolute bottom-3 left-3 text-white">
                                            <div class="text-sm font-medium">French Elegance</div>
                                            <div class="text-xs opacity-80">$24.99</div>
                                        </div>
                                    </div>
                                    <div class="nail-showcase-card" style="animation-delay: 0.2s">
                                        <img src="/static/images/hero-nail-2.jpg" alt="Abstract Art" class="w-full h-24 lg:h-32 object-cover rounded-2xl shadow-medium">
                                    </div>
                                </div>
                                <div class="space-y-4 lg:space-y-6 pt-8">
                                    <div class="nail-showcase-card" style="animation-delay: 0.4s">
                                        <img src="/static/images/hero-nail-3.jpg" alt="Floral Dream" class="w-full h-24 lg:h-32 object-cover rounded-2xl shadow-medium">
                                    </div>
                                    <div class="nail-showcase-card" style="animation-delay: 0.6s">
                                        <img src="/static/images/hero-nail-4.jpg" alt="Glitter Glam" class="w-full h-32 lg:h-40 object-cover rounded-2xl shadow-strong">
                                        <div class="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent rounded-2xl"></div>
                                        <div class="absolute bottom-3 left-3 text-white">
                                            <div class="text-sm font-medium">Glitter Glam</div>
                                            <div class="text-xs opacity-80">$32.99</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Floating Elements -->
                            <div class="absolute -top-4 -right-4 w-20 h-20 bg-accent/20 rounded-full blur-xl animate-pulse-soft"></div>
                            <div class="absolute -bottom-4 -left-4 w-16 h-16 bg-success/20 rounded-full blur-xl animate-pulse-soft" style="animation-delay: 1s"></div>
                        </div>
                    </div>
                </div>
                
                <!-- Wave Separator -->
                <div class="absolute bottom-0 left-0 right-0">
                    <svg class="w-full h-12 text-light" viewBox="0 0 1200 120" preserveAspectRatio="none">
                        <path d="M1200 120L0 16.48 0 0 1200 0 1200 120z" fill="currentColor"></path>
                    </svg>
                </div>
            </section>

            <!-- Features Section -->
            <section class="py-20 bg-white">
                <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div class="text-center mb-16">
                        <div class="inline-flex items-center bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
                            <i class="fas fa-crown mr-2"></i>
                            Premium Experience
                        </div>
                        <h2 class="text-4xl lg:text-5xl font-bold text-dark mb-6">Why Choose NailCraft?</h2>
                        <p class="text-xl text-muted max-w-2xl mx-auto">Experience the perfect blend of artistry, technology, and convenience</p>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        <div class="feature-card group">
                            <div class="feature-icon bg-gradient-to-br from-success to-green-600">
                                <i class="fas fa-leaf"></i>
                            </div>
                            <h3 class="feature-title">Eco-Friendly</h3>
                            <p class="feature-description">Sustainable materials and carbon-neutral shipping for conscious beauty</p>
                            <div class="feature-overlay"></div>
                        </div>
                        
                        <div class="feature-card group">
                            <div class="feature-icon bg-gradient-to-br from-primary to-secondary">
                                <i class="fas fa-palette"></i>
                            </div>
                            <h3 class="feature-title">Endless Designs</h3>
                            <p class="feature-description">5000+ curated designs with new collections added weekly by top artists</p>
                            <div class="feature-overlay"></div>
                        </div>
                        
                        <div class="feature-card group">
                            <div class="feature-icon bg-gradient-to-br from-accent to-orange-600">
                                <i class="fas fa-shipping-fast"></i>
                            </div>
                            <h3 class="feature-title">Express Delivery</h3>
                            <p class="feature-description">24-48 hour delivery with real-time tracking and premium packaging</p>
                            <div class="feature-overlay"></div>
                        </div>
                        
                        <div class="feature-card group">
                            <div class="feature-icon bg-gradient-to-br from-secondary to-purple-600">
                                <i class="fas fa-magic"></i>
                            </div>
                            <h3 class="feature-title">Custom Creations</h3>
                            <p class="feature-description">Personal nail artist consultations and bespoke design services</p>
                            <div class="feature-overlay"></div>
                        </div>
                    </div>
                    
                    <!-- Trust Indicators -->
                    <div class="mt-20 grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
                        <div class="trust-metric">
                            <div class="text-3xl lg:text-4xl font-bold text-primary mb-2">50K+</div>
                            <div class="text-muted text-sm">Happy Customers</div>
                        </div>
                        <div class="trust-metric">
                            <div class="text-3xl lg:text-4xl font-bold text-success mb-2">4.9★</div>
                            <div class="text-muted text-sm">Average Rating</div>
                        </div>
                        <div class="trust-metric">
                            <div class="text-3xl lg:text-4xl font-bold text-accent mb-2">5000+</div>
                            <div class="text-muted text-sm">Nail Designs</div>
                        </div>
                        <div class="trust-metric">
                            <div class="text-3xl lg:text-4xl font-bold text-secondary mb-2">24h</div>
                            <div class="text-muted text-sm">Delivery Time</div>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Portfolio Preview Section -->
            <section id="portfolio" class="py-20 bg-gradient-to-br from-gray-50 to-blue-50/30">
                <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div class="text-center mb-16">
                        <div class="inline-flex items-center bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
                            <i class="fas fa-palette mr-2"></i>
                            Trending Now
                        </div>
                        <h2 class="text-4xl lg:text-5xl font-bold text-dark mb-6">Featured Designs</h2>
                        <p class="text-xl text-muted max-w-2xl mx-auto">Handpicked by our expert artists and loved by thousands of customers</p>
                    </div>
                    
                    <!-- Category Filter -->
                    <div class="flex flex-wrap justify-center gap-3 mb-12">
                        <button class="category-filter active" data-category="all">
                            All Designs
                        </button>
                        <button class="category-filter" data-category="french">
                            French Classic
                        </button>
                        <button class="category-filter" data-category="abstract">
                            Abstract Art
                        </button>
                        <button class="category-filter" data-category="glitter">
                            Glitter & Glam
                        </button>
                        <button class="category-filter" data-category="floral">
                            Floral
                        </button>
                    </div>
                    
                    <div id="design-grid" class="design-grid mb-12">
                        <!-- Loading Skeletons -->
                        <div class="design-card-modern loading">
                            <div class="aspect-square bg-gray-200 animate-pulse rounded-t-2xl"></div>
                            <div class="p-6">
                                <div class="h-4 bg-gray-200 rounded mb-3 animate-pulse"></div>
                                <div class="h-3 bg-gray-200 rounded w-2/3 mb-4 animate-pulse"></div>
                                <div class="flex items-center justify-between">
                                    <div class="h-6 bg-gray-200 rounded w-16 animate-pulse"></div>
                                    <div class="h-8 w-8 bg-gray-200 rounded-full animate-pulse"></div>
                                </div>
                            </div>
                        </div>
                        <div class="design-card-modern loading">
                            <div class="aspect-square bg-gray-200 animate-pulse rounded-t-2xl"></div>
                            <div class="p-6">
                                <div class="h-4 bg-gray-200 rounded mb-3 animate-pulse"></div>
                                <div class="h-3 bg-gray-200 rounded w-2/3 mb-4 animate-pulse"></div>
                                <div class="flex items-center justify-between">
                                    <div class="h-6 bg-gray-200 rounded w-16 animate-pulse"></div>
                                    <div class="h-8 w-8 bg-gray-200 rounded-full animate-pulse"></div>
                                </div>
                            </div>
                        </div>
                        <div class="design-card-modern loading">
                            <div class="aspect-square bg-gray-200 animate-pulse rounded-t-2xl"></div>
                            <div class="p-6">
                                <div class="h-4 bg-gray-200 rounded mb-3 animate-pulse"></div>
                                <div class="h-3 bg-gray-200 rounded w-2/3 mb-4 animate-pulse"></div>
                                <div class="flex items-center justify-between">
                                    <div class="h-6 bg-gray-200 rounded w-16 animate-pulse"></div>
                                    <div class="h-8 w-8 bg-gray-200 rounded-full animate-pulse"></div>
                                </div>
                            </div>
                        </div>
                        <div class="design-card-modern loading">
                            <div class="aspect-square bg-gray-200 animate-pulse rounded-t-2xl"></div>
                            <div class="p-6">
                                <div class="h-4 bg-gray-200 rounded mb-3 animate-pulse"></div>
                                <div class="h-3 bg-gray-200 rounded w-2/3 mb-4 animate-pulse"></div>
                                <div class="flex items-center justify-between">
                                    <div class="h-6 bg-gray-200 rounded w-16 animate-pulse"></div>
                                    <div class="h-8 w-8 bg-gray-200 rounded-full animate-pulse"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="text-center">
                        <button class="btn-primary-modern group">
                            <span>View All Designs</span>
                            <i class="fas fa-arrow-right ml-2 group-hover:translate-x-1 transition-transform"></i>
                        </button>
                    </div>
                </div>
            </section>

            <!-- Subscription Plans -->
            <section id="subscriptions" class="py-20 bg-white relative">
                <!-- Background Pattern -->
                <div class="absolute inset-0 opacity-5">
                    <div class="absolute inset-0" style="background-image: radial-gradient(circle at 30% 70%, rgba(37, 99, 235, 0.1) 1px, transparent 1px); background-size: 40px 40px;"></div>
                </div>
                
                <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div class="text-center mb-16">
                        <div class="inline-flex items-center bg-accent/10 text-accent px-4 py-2 rounded-full text-sm font-medium mb-4">
                            <i class="fas fa-crown mr-2"></i>
                            Flexible Plans
                        </div>
                        <h2 class="text-4xl lg:text-5xl font-bold text-dark mb-6">Choose Your Experience</h2>
                        <p class="text-xl text-muted max-w-2xl mx-auto">From casual enthusiasts to nail art devotees, we have the perfect plan for you</p>
                    </div>
                    
                    <!-- Plan Toggle -->
                    <div class="flex items-center justify-center mb-12">
                        <div class="bg-gray-100 p-1 rounded-xl">
                            <button class="plan-toggle active px-6 py-2 rounded-lg text-sm font-medium transition-all" data-plan="monthly">
                                Monthly
                            </button>
                            <button class="plan-toggle px-6 py-2 rounded-lg text-sm font-medium transition-all" data-plan="annual">
                                Annual
                                <span class="ml-2 bg-success text-white text-xs px-2 py-0.5 rounded-full">Save 20%</span>
                            </button>
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                        <!-- Starter Plan -->
                        <div class="pricing-card">
                            <div class="pricing-header">
                                <div class="pricing-icon bg-gradient-to-br from-muted to-gray-600">
                                    <i class="fas fa-paint-brush"></i>
                                </div>
                                <h3 class="pricing-title">Pay Per Design</h3>
                                <div class="pricing-price">
                                    <span class="text-5xl font-bold text-dark">$15</span>
                                    <span class="text-muted">- $35</span>
                                </div>
                                <p class="pricing-subtitle">Perfect for occasional treat</p>
                            </div>
                            <div class="pricing-features">
                                <div class="pricing-feature">
                                    <i class="fas fa-check text-success"></i>
                                    <span>Single design purchase</span>
                                </div>
                                <div class="pricing-feature">
                                    <i class="fas fa-check text-success"></i>
                                    <span>No commitment required</span>
                                </div>
                                <div class="pricing-feature">
                                    <i class="fas fa-check text-success"></i>
                                    <span>Standard 5-7 day shipping</span>
                                </div>
                                <div class="pricing-feature">
                                    <i class="fas fa-check text-success"></i>
                                    <span>Access to basic collection</span>
                                </div>
                            </div>
                            <button class="pricing-button pricing-button-secondary">
                                Browse Designs
                            </button>
                        </div>

                        <!-- Pro Plan -->
                        <div class="pricing-card pricing-card-featured">
                            <div class="pricing-badge">
                                <i class="fas fa-star mr-1"></i>
                                Most Popular
                            </div>
                            <div class="pricing-header">
                                <div class="pricing-icon bg-gradient-to-br from-primary to-secondary">
                                    <i class="fas fa-palette"></i>
                                </div>
                                <h3 class="pricing-title">Pro Monthly</h3>
                                <div class="pricing-price">
                                    <span class="text-5xl font-bold text-primary">$25</span>
                                    <span class="text-muted">/month</span>
                                </div>
                                <p class="pricing-subtitle">Best value for nail art lovers</p>
                            </div>
                            <div class="pricing-features">
                                <div class="pricing-feature">
                                    <i class="fas fa-check text-success"></i>
                                    <span>2 premium designs monthly</span>
                                </div>
                                <div class="pricing-feature">
                                    <i class="fas fa-check text-success"></i>
                                    <span>20% off additional designs</span>
                                </div>
                                <div class="pricing-feature">
                                    <i class="fas fa-check text-success"></i>
                                    <span>Free priority shipping</span>
                                </div>
                                <div class="pricing-feature">
                                    <i class="fas fa-check text-success"></i>
                                    <span>Custom design consultation</span>
                                </div>
                                <div class="pricing-feature">
                                    <i class="fas fa-check text-success"></i>
                                    <span>Access to premium collection</span>
                                </div>
                            </div>
                            <button class="pricing-button pricing-button-primary">
                                Start Free Trial
                            </button>
                        </div>

                        <!-- VIP Plan -->
                        <div class="pricing-card">
                            <div class="pricing-header">
                                <div class="pricing-icon bg-gradient-to-br from-accent to-yellow-600">
                                    <i class="fas fa-crown"></i>
                                </div>
                                <h3 class="pricing-title">VIP Unlimited</h3>
                                <div class="pricing-price">
                                    <span class="text-5xl font-bold text-dark">$40</span>
                                    <span class="text-muted">/month</span>
                                </div>
                                <p class="pricing-subtitle">Ultimate nail art experience</p>
                            </div>
                            <div class="pricing-features">
                                <div class="pricing-feature">
                                    <i class="fas fa-check text-success"></i>
                                    <span>Unlimited premium designs</span>
                                </div>
                                <div class="pricing-feature">
                                    <i class="fas fa-check text-success"></i>
                                    <span>Express 24-48h delivery</span>
                                </div>
                                <div class="pricing-feature">
                                    <i class="fas fa-check text-success"></i>
                                    <span>Personal nail artist access</span>
                                </div>
                                <div class="pricing-feature">
                                    <i class="fas fa-check text-success"></i>
                                    <span>Exclusive VIP-only designs</span>
                                </div>
                                <div class="pricing-feature">
                                    <i class="fas fa-check text-success"></i>
                                    <span>Priority customer support</span>
                                </div>
                            </div>
                            <button class="pricing-button pricing-button-secondary">
                                Go VIP
                            </button>
                        </div>
                    </div>
                    
                    <!-- Trust Indicators -->
                    <div class="mt-16 text-center">
                        <p class="text-muted mb-6">Trusted by nail art enthusiasts worldwide</p>
                        <div class="flex items-center justify-center space-x-8 opacity-60">
                            <div class="flex items-center">
                                <i class="fas fa-shield-alt text-success mr-2"></i>
                                <span class="text-sm">30-day guarantee</span>
                            </div>
                            <div class="flex items-center">
                                <i class="fas fa-lock text-primary mr-2"></i>
                                <span class="text-sm">Secure payment</span>
                            </div>
                            <div class="flex items-center">
                                <i class="fas fa-undo text-accent mr-2"></i>
                                <span class="text-sm">Cancel anytime</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Footer -->
            <footer class="bg-gray-900 text-white py-12">
                <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
                        <div>
                            <div class="flex items-center mb-4">
                                <i class="fas fa-paint-brush text-2xl text-nail-pink mr-2"></i>
                                <h3 class="text-xl font-bold">NailCraft Studio</h3>
                            </div>
                            <p class="text-gray-400">Premium custom nail art with eco-friendly materials and fast delivery.</p>
                        </div>
                        <div>
                            <h4 class="text-lg font-semibold mb-4">Quick Links</h4>
                            <ul class="space-y-2">
                                <li><a href="#" class="text-gray-400 hover:text-white transition-colors">Browse Designs</a></li>
                                <li><a href="#" class="text-gray-400 hover:text-white transition-colors">Custom Design</a></li>
                                <li><a href="#" class="text-gray-400 hover:text-white transition-colors">Subscriptions</a></li>
                                <li><a href="#" class="text-gray-400 hover:text-white transition-colors">Track Order</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 class="text-lg font-semibold mb-4">Support</h4>
                            <ul class="space-y-2">
                                <li><a href="#" class="text-gray-400 hover:text-white transition-colors">Help Center</a></li>
                                <li><a href="#" class="text-gray-400 hover:text-white transition-colors">Shipping Info</a></li>
                                <li><a href="#" class="text-gray-400 hover:text-white transition-colors">Returns</a></li>
                                <li><a href="#" class="text-gray-400 hover:text-white transition-colors">Contact Us</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 class="text-lg font-semibold mb-4">Connect</h4>
                            <div class="flex space-x-4">
                                <a href="#" class="text-gray-400 hover:text-white transition-colors text-xl">
                                    <i class="fab fa-instagram"></i>
                                </a>
                                <a href="#" class="text-gray-400 hover:text-white transition-colors text-xl">
                                    <i class="fab fa-tiktok"></i>
                                </a>
                                <a href="#" class="text-gray-400 hover:text-white transition-colors text-xl">
                                    <i class="fab fa-pinterest"></i>
                                </a>
                                <a href="#" class="text-gray-400 hover:text-white transition-colors text-xl">
                                    <i class="fab fa-youtube"></i>
                                </a>
                            </div>
                        </div>
                    </div>
                    <div class="border-t border-gray-800 mt-8 pt-8 text-center">
                        <p class="text-gray-400">&copy; 2024 NailCraft Studio. All rights reserved. Made with ❤️ and eco-friendly materials.</p>
                    </div>
                </div>
            </footer>
        </div>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="/static/app.js"></script>
    </body>
    </html>
  `)
})

export default app
