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
                  'eco-green': '#10b981',
                  'nail-pink': '#f472b6',
                  'premium-purple': '#8b5cf6'
                }
              }
            }
          ;
        </script>
    </head>
    <body class="bg-gradient-to-br from-pink-50 via-purple-50 to-green-50 min-h-screen">
        <div id="app">
            <!-- Header -->
            <header class="bg-white shadow-lg sticky top-0 z-50">
                <nav class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div class="flex justify-between items-center h-16">
                        <div class="flex items-center">
                            <div class="flex-shrink-0 flex items-center">
                                <i class="fas fa-paint-brush text-2xl text-nail-pink mr-2"></i>
                                <h1 class="text-xl font-bold text-gray-900">NailCraft Studio</h1>
                            </div>
                            <div class="hidden md:block ml-10">
                                <div class="flex items-baseline space-x-4">
                                    <a href="#portfolio" class="nav-link">Portfolio</a>
                                    <a href="#custom" class="nav-link">Custom Design</a>
                                    <a href="#subscriptions" class="nav-link">Subscriptions</a>
                                    <a href="#about" class="nav-link">About</a>
                                </div>
                            </div>
                        </div>
                        <div class="flex items-center space-x-4">
                            <button id="cart-btn" class="relative p-2 text-gray-600 hover:text-nail-pink transition-colors">
                                <i class="fas fa-shopping-cart text-xl"></i>
                                <span id="cart-count" class="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center hidden">0</span>
                            </button>
                            <button id="auth-btn" class="bg-nail-pink text-white px-4 py-2 rounded-lg hover:bg-pink-600 transition-colors">
                                Sign In
                            </button>
                        </div>
                    </div>
                </nav>
            </header>

            <!-- Hero Section -->
            <section class="relative overflow-hidden bg-gradient-to-r from-nail-pink to-premium-purple text-white py-20">
                <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div class="text-center">
                        <h2 class="text-4xl md:text-6xl font-bold mb-6">
                            Custom Nail Art,<br>
                            <span class="text-yellow-300">Delivered to You</span>
                        </h2>
                        <p class="text-xl md:text-2xl mb-8 max-w-3xl mx-auto opacity-90">
                            Eco-friendly, premium nail art with thousands of designs. 
                            Subscribe for unlimited access or pay per design.
                        </p>
                        <div class="flex flex-col sm:flex-row gap-4 justify-center">
                            <button class="bg-white text-nail-pink px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors">
                                <i class="fas fa-palette mr-2"></i>
                                Browse Designs
                            </button>
                            <button class="border-2 border-white text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-white hover:text-nail-pink transition-colors">
                                <i class="fas fa-crown mr-2"></i>
                                Start Subscription
                            </button>
                        </div>
                    </div>
                </div>
                <div class="absolute bottom-0 left-0 right-0">
                    <svg class="w-full h-12" viewBox="0 0 1200 120" preserveAspectRatio="none">
                        <path d="M1200 120L0 16.48 0 0 1200 0 1200 120z" class="fill-pink-50"></path>
                    </svg>
                </div>
            </section>

            <!-- Features Section -->
            <section class="py-20 bg-white">
                <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div class="text-center mb-16">
                        <h3 class="text-3xl font-bold text-gray-900 mb-4">Why Choose NailCraft Studio?</h3>
                        <p class="text-xl text-gray-600">Premium quality, eco-friendly materials, and unmatched creativity</p>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        <div class="text-center">
                            <div class="bg-eco-green w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <i class="fas fa-leaf text-white text-2xl"></i>
                            </div>
                            <h4 class="text-xl font-semibold mb-2">Eco-Friendly</h4>
                            <p class="text-gray-600">100% sustainable materials and eco-conscious packaging</p>
                        </div>
                        <div class="text-center">
                            <div class="bg-nail-pink w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <i class="fas fa-palette text-white text-2xl"></i>
                            </div>
                            <h4 class="text-xl font-semibold mb-2">Thousands of Designs</h4>
                            <p class="text-gray-600">Extensive portfolio with new designs added weekly</p>
                        </div>
                        <div class="text-center">
                            <div class="bg-premium-purple w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <i class="fas fa-shipping-fast text-white text-2xl"></i>
                            </div>
                            <h4 class="text-xl font-semibold mb-2">Fast Shipping</h4>
                            <p class="text-gray-600">2-3 day delivery with premium subscription</p>
                        </div>
                        <div class="text-center">
                            <div class="bg-yellow-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <i class="fas fa-users text-white text-2xl"></i>
                            </div>
                            <h4 class="text-xl font-semibold mb-2">Referral Rewards</h4>
                            <p class="text-gray-600">Earn free nails by referring friends</p>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Portfolio Preview Section -->
            <section id="portfolio" class="py-20 bg-gray-50">
                <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div class="text-center mb-16">
                        <h3 class="text-3xl font-bold text-gray-900 mb-4">Featured Designs</h3>
                        <p class="text-xl text-gray-600">Discover our most popular nail art creations</p>
                    </div>
                    <div id="design-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                        <!-- Designs will be loaded here -->
                        <div class="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
                            <div class="h-48 bg-gray-300"></div>
                            <div class="p-4">
                                <div class="h-4 bg-gray-300 rounded mb-2"></div>
                                <div class="h-3 bg-gray-300 rounded w-2/3"></div>
                            </div>
                        </div>
                        <div class="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
                            <div class="h-48 bg-gray-300"></div>
                            <div class="p-4">
                                <div class="h-4 bg-gray-300 rounded mb-2"></div>
                                <div class="h-3 bg-gray-300 rounded w-2/3"></div>
                            </div>
                        </div>
                        <div class="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
                            <div class="h-48 bg-gray-300"></div>
                            <div class="p-4">
                                <div class="h-4 bg-gray-300 rounded mb-2"></div>
                                <div class="h-3 bg-gray-300 rounded w-2/3"></div>
                            </div>
                        </div>
                        <div class="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
                            <div class="h-48 bg-gray-300"></div>
                            <div class="p-4">
                                <div class="h-4 bg-gray-300 rounded mb-2"></div>
                                <div class="h-3 bg-gray-300 rounded w-2/3"></div>
                            </div>
                        </div>
                    </div>
                    <div class="text-center">
                        <button class="bg-nail-pink text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-pink-600 transition-colors">
                            View All Designs
                        </button>
                    </div>
                </div>
            </section>

            <!-- Subscription Plans -->
            <section id="subscriptions" class="py-20 bg-white">
                <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div class="text-center mb-16">
                        <h3 class="text-3xl font-bold text-gray-900 mb-4">Choose Your Plan</h3>
                        <p class="text-xl text-gray-600">Flexible pricing for every nail art lover</p>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <!-- Pay Per Design -->
                        <div class="border-2 border-gray-200 rounded-lg p-8 text-center">
                            <h4 class="text-2xl font-bold mb-4">Pay Per Design</h4>
                            <div class="text-4xl font-bold text-nail-pink mb-6">$15-35</div>
                            <ul class="space-y-3 mb-8">
                                <li class="flex items-center justify-center">
                                    <i class="fas fa-check text-green-500 mr-2"></i>
                                    <span>Single design purchase</span>
                                </li>
                                <li class="flex items-center justify-center">
                                    <i class="fas fa-check text-green-500 mr-2"></i>
                                    <span>No commitment</span>
                                </li>
                                <li class="flex items-center justify-center">
                                    <i class="fas fa-check text-green-500 mr-2"></i>
                                    <span>Standard shipping</span>
                                </li>
                            </ul>
                            <button class="w-full bg-gray-800 text-white py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors">
                                Choose Design
                            </button>
                        </div>

                        <!-- Monthly Plan -->
                        <div class="border-2 border-nail-pink rounded-lg p-8 text-center relative">
                            <div class="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                                <span class="bg-nail-pink text-white px-4 py-1 rounded-full text-sm font-semibold">Most Popular</span>
                            </div>
                            <h4 class="text-2xl font-bold mb-4">Monthly Pro</h4>
                            <div class="text-4xl font-bold text-nail-pink mb-6">$24.99<span class="text-lg text-gray-500">/mo</span></div>
                            <ul class="space-y-3 mb-8">
                                <li class="flex items-center justify-center">
                                    <i class="fas fa-check text-green-500 mr-2"></i>
                                    <span>2 premium designs/month</span>
                                </li>
                                <li class="flex items-center justify-center">
                                    <i class="fas fa-check text-green-500 mr-2"></i>
                                    <span>15% discount on extras</span>
                                </li>
                                <li class="flex items-center justify-center">
                                    <i class="fas fa-check text-green-500 mr-2"></i>
                                    <span>Free shipping</span>
                                </li>
                                <li class="flex items-center justify-center">
                                    <i class="fas fa-check text-green-500 mr-2"></i>
                                    <span>Custom design consultation</span>
                                </li>
                            </ul>
                            <button class="w-full bg-nail-pink text-white py-3 rounded-lg font-semibold hover:bg-pink-600 transition-colors">
                                Start Monthly Plan
                            </button>
                        </div>

                        <!-- Annual VIP -->
                        <div class="border-2 border-premium-purple rounded-lg p-8 text-center">
                            <h4 class="text-2xl font-bold mb-4">VIP Unlimited</h4>
                            <div class="text-4xl font-bold text-premium-purple mb-6">$39.99<span class="text-lg text-gray-500">/mo</span></div>
                            <ul class="space-y-3 mb-8">
                                <li class="flex items-center justify-center">
                                    <i class="fas fa-check text-green-500 mr-2"></i>
                                    <span>Unlimited designs</span>
                                </li>
                                <li class="flex items-center justify-center">
                                    <i class="fas fa-check text-green-500 mr-2"></i>
                                    <span>Express 2-day shipping</span>
                                </li>
                                <li class="flex items-center justify-center">
                                    <i class="fas fa-check text-green-500 mr-2"></i>
                                    <span>Personal nail artist</span>
                                </li>
                                <li class="flex items-center justify-center">
                                    <i class="fas fa-check text-green-500 mr-2"></i>
                                    <span>Exclusive VIP designs</span>
                                </li>
                            </ul>
                            <button class="w-full bg-premium-purple text-white py-3 rounded-lg font-semibold hover:bg-purple-600 transition-colors">
                                Go VIP
                            </button>
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
