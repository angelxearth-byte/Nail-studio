// NailCraft Studio Frontend Application

class NailCraftApp {
    constructor() {
        this.user = null;
        this.cart = [];
        this.designs = [];
        this.categories = [];
        this.currentPage = 1;
        this.isLoading = false;
        this.currentFilter = 'all';
        this.searchTimeout = null;
        this.wishlist = [];
        
        this.init();
    }

    async init() {
        // Add loading overlay
        this.showPageLoader();
        
        try {
            // Check if user is authenticated
            await this.checkAuthStatus();
            
            // Load initial data
            await this.loadCategories();
            await this.loadFeaturedDesigns();
            
            // Setup event listeners
            this.setupEventListeners();
            this.setupModernInteractions();
            
            // Update cart count
            await this.updateCartCount();
            
            // Initialize animations
            this.initializeAnimations();
            
            console.log('NailCraft Studio initialized');
        } finally {
            // Hide loading overlay
            this.hidePageLoader();
        }
    }

    showPageLoader() {
        const loader = document.createElement('div');
        loader.id = 'page-loader';
        loader.className = 'fixed inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center z-[100]';
        loader.innerHTML = `
            <div class="text-center">
                <div class="w-16 h-16 bg-gradient-to-r from-primary to-secondary rounded-2xl flex items-center justify-center mb-4 animate-pulse-soft mx-auto">
                    <i class="fas fa-gem text-white text-xl"></i>
                </div>
                <div class="text-lg font-semibold text-dark mb-2">Loading NailCraft Studio</div>
                <div class="w-32 h-1 bg-gray-200 rounded-full overflow-hidden mx-auto">
                    <div class="h-full bg-gradient-to-r from-primary to-secondary rounded-full animate-pulse"></div>
                </div>
            </div>
        `;
        document.body.appendChild(loader);
    }

    hidePageLoader() {
        setTimeout(() => {
            const loader = document.getElementById('page-loader');
            if (loader) {
                loader.style.opacity = '0';
                setTimeout(() => loader.remove(), 300);
            }
        }, 500);
    }

    initializeAnimations() {
        // Add entrance animations to elements
        const animateOnScroll = () => {
            const elements = document.querySelectorAll('[data-animate]');
            elements.forEach(el => {
                const rect = el.getBoundingClientRect();
                if (rect.top < window.innerHeight * 0.8) {
                    el.classList.add('animate-fade-in');
                    el.style.animationDelay = el.dataset.delay || '0s';
                }
            });
        };

        window.addEventListener('scroll', animateOnScroll);
        animateOnScroll(); // Run once on load
    }

    setupModernInteractions() {
        // Category filter interactions
        this.setupCategoryFilters();
        
        // Search functionality
        this.setupSearch();
        
        // Wishlist functionality
        this.setupWishlist();
        
        // Quick view functionality
        this.setupQuickView();
        
        // Smooth scrolling
        this.setupSmoothScrolling();
        
        // Modern cart interactions
        this.setupCartInteractions();
    }

    setupCategoryFilters() {
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('category-filter')) {
                e.preventDefault();
                
                // Update active state
                document.querySelectorAll('.category-filter').forEach(btn => {
                    btn.classList.remove('active');
                });
                e.target.classList.add('active');
                
                // Filter designs
                const category = e.target.dataset.category;
                this.filterDesigns(category);
            }
        });
    }

    async filterDesigns(category) {
        this.currentFilter = category;
        this.showDesignGridLoader();
        
        try {
            let url = '/api/designs/featured?limit=8';
            if (category !== 'all') {
                url = `/api/designs?category=${category}&limit=8`;
            }
            
            const response = await axios.get(url);
            if (response.data.success) {
                this.designs = response.data.data;
                this.renderFeaturedDesigns();
            }
        } catch (error) {
            console.error('Filter error:', error);
            this.showNotification('Failed to filter designs', 'error');
        }
    }

    showDesignGridLoader() {
        const grid = document.getElementById('design-grid');
        if (grid) {
            grid.innerHTML = Array(4).fill(0).map(() => `
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
            `).join('');
        }
    }

    setupSearch() {
        const searchBtn = document.querySelector('.fa-search')?.parentElement;
        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                this.showSearchModal();
            });
        }
    }

    showSearchModal() {
        const modalHTML = `
            <div class="modal-overlay" id="search-modal">
                <div class="modal-content max-w-2xl">
                    <div class="modal-header">
                        <h3 class="text-xl font-semibold">Search Designs</h3>
                        <button onclick="app.closeModal('search-modal')" class="text-muted hover:text-dark">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div class="relative mb-6">
                            <input type="text" id="search-input" placeholder="Search for nail art designs..." 
                                   class="form-input pl-12 text-lg" autofocus>
                            <i class="fas fa-search absolute left-4 top-1/2 transform -translate-y-1/2 text-muted"></i>
                        </div>
                        
                        <div class="mb-4">
                            <h4 class="font-semibold mb-3">Popular Searches</h4>
                            <div class="flex flex-wrap gap-2">
                                <button class="search-tag">French Manicure</button>
                                <button class="search-tag">Glitter Nails</button>
                                <button class="search-tag">Floral Design</button>
                                <button class="search-tag">Abstract Art</button>
                                <button class="search-tag">Wedding Nails</button>
                            </div>
                        </div>
                        
                        <div id="search-results" class="hidden">
                            <h4 class="font-semibold mb-3">Search Results</h4>
                            <div id="search-results-grid" class="grid grid-cols-2 gap-4"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.setupSearchInput();
    }

    setupSearchInput() {
        const input = document.getElementById('search-input');
        if (input) {
            input.addEventListener('input', (e) => {
                clearTimeout(this.searchTimeout);
                this.searchTimeout = setTimeout(() => {
                    this.performSearch(e.target.value);
                }, 300);
            });
        }
        
        // Search tag clicks
        document.querySelectorAll('.search-tag').forEach(tag => {
            tag.addEventListener('click', () => {
                input.value = tag.textContent;
                this.performSearch(tag.textContent);
            });
        });
    }

    async performSearch(query) {
        if (query.length < 2) {
            document.getElementById('search-results').classList.add('hidden');
            return;
        }
        
        try {
            const response = await axios.post('/api/designs/search', {
                query: query,
                limit: 6
            });
            
            if (response.data.success) {
                this.renderSearchResults(response.data.data);
                document.getElementById('search-results').classList.remove('hidden');
            }
        } catch (error) {
            console.error('Search error:', error);
        }
    }

    renderSearchResults(results) {
        const grid = document.getElementById('search-results-grid');
        if (!grid) return;
        
        grid.innerHTML = results.map(design => `
            <div class="search-result-item p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 cursor-pointer transition-colors" 
                 onclick="app.closeModal('search-modal'); app.showDesignDetails(${design.id})">
                <img src="${design.image_url || '/static/images/placeholder-nail.jpg'}" 
                     alt="${design.name}" class="w-full h-20 object-cover rounded-lg mb-2">
                <div class="text-sm font-medium text-dark">${design.name}</div>
                <div class="text-xs text-muted">$${design.base_price}</div>
            </div>
        `).join('');
    }

    setupWishlist() {
        // Wishlist button functionality
        document.addEventListener('click', (e) => {
            if (e.target.closest('.wishlist-btn')) {
                e.preventDefault();
                e.stopPropagation();
                
                const btn = e.target.closest('.wishlist-btn');
                const designId = parseInt(btn.dataset.designId);
                this.toggleWishlist(designId, btn);
            }
        });
    }

    toggleWishlist(designId, btn) {
        if (!this.user) {
            this.showAuthModal();
            return;
        }
        
        const isWishlisted = this.wishlist.includes(designId);
        
        if (isWishlisted) {
            this.wishlist = this.wishlist.filter(id => id !== designId);
            btn.innerHTML = '<i class="far fa-heart"></i>';
            this.showNotification('Removed from wishlist', 'success');
        } else {
            this.wishlist.push(designId);
            btn.innerHTML = '<i class="fas fa-heart text-danger"></i>';
            this.showNotification('Added to wishlist', 'success');
        }
        
        // Add animation
        btn.style.transform = 'scale(1.2)';
        setTimeout(() => {
            btn.style.transform = 'scale(1)';
        }, 150);
    }

    setupQuickView() {
        // Quick view on hover/click
        document.addEventListener('mouseenter', (e) => {
            if (e.target.closest('.design-card-modern')) {
                const card = e.target.closest('.design-card-modern');
                this.showQuickViewButton(card);
            }
        });
        
        document.addEventListener('mouseleave', (e) => {
            if (e.target.closest('.design-card-modern')) {
                this.hideQuickViewButton();
            }
        });
    }

    showQuickViewButton(card) {
        // Remove existing quick view button
        this.hideQuickViewButton();
        
        const button = document.createElement('button');
        button.className = 'quick-view-btn absolute top-4 right-4 bg-white/90 backdrop-blur-sm text-dark p-2 rounded-lg shadow-soft hover:bg-white transition-all opacity-0';
        button.innerHTML = '<i class="fas fa-eye text-sm"></i>';
        
        card.style.position = 'relative';
        card.appendChild(button);
        
        // Fade in
        setTimeout(() => {
            button.style.opacity = '1';
        }, 50);
        
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            const designId = this.getDesignIdFromCard(card);
            if (designId) {
                this.showDesignDetails(designId);
            }
        });
    }

    hideQuickViewButton() {
        const existing = document.querySelector('.quick-view-btn');
        if (existing) {
            existing.style.opacity = '0';
            setTimeout(() => existing.remove(), 200);
        }
    }

    getDesignIdFromCard(card) {
        // Extract design ID from card onclick attribute or data attribute
        const onclick = card.getAttribute('onclick');
        if (onclick) {
            const match = onclick.match(/showDesignDetails\((\d+)\)/);
            return match ? parseInt(match[1]) : null;
        }
        return null;
    }

    setupSmoothScrolling() {
        // Enhanced smooth scrolling for navigation
        document.querySelectorAll('a[href^="#"]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(link.getAttribute('href'));
                if (target) {
                    const offsetTop = target.offsetTop - 80; // Account for header
                    window.scrollTo({
                        top: offsetTop,
                        behavior: 'smooth'
                    });
                    
                    // Add highlight effect
                    target.style.transform = 'scale(1.02)';
                    setTimeout(() => {
                        target.style.transform = 'scale(1)';
                    }, 300);
                }
            });
        });
    }

    setupCartInteractions() {
        // Enhanced cart button with animation
        const cartBtn = document.getElementById('cart-btn');
        if (cartBtn) {
            cartBtn.addEventListener('click', () => {
                // Add click animation
                cartBtn.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    cartBtn.style.transform = 'scale(1)';
                    this.showCart();
                }, 100);
            });
        }
    }

    // Authentication methods
    async checkAuthStatus() {
        try {
            const response = await axios.get('/api/auth/me');
            if (response.data.success) {
                this.user = response.data.user;
                this.updateAuthUI();
            }
        } catch (error) {
            console.log('User not authenticated');
        }
    }

    updateAuthUI() {
        const authBtn = document.getElementById('auth-btn');
        if (this.user) {
            authBtn.textContent = `Hi, ${this.user.first_name}`;
            authBtn.onclick = () => this.showUserMenu();
        } else {
            authBtn.textContent = 'Sign In';
            authBtn.onclick = () => this.showAuthModal();
        }
    }

    showAuthModal() {
        const modalHTML = `
            <div class="modal-overlay" id="auth-modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3 class="text-xl font-semibold">Welcome to NailCraft Studio</h3>
                        <button onclick="this.closeModal('auth-modal')" class="text-gray-400 hover:text-gray-600">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div id="auth-tabs" class="flex border-b mb-4">
                            <button class="tab-btn active px-4 py-2 border-b-2 border-nail-pink text-nail-pink" data-tab="login">
                                Sign In
                            </button>
                            <button class="tab-btn px-4 py-2 text-gray-600" data-tab="register">
                                Sign Up
                            </button>
                        </div>
                        
                        <!-- Login Form -->
                        <div id="login-form" class="tab-content">
                            <form id="login-form-element">
                                <div class="mb-4">
                                    <label class="form-label">Email</label>
                                    <input type="email" name="email" class="form-input" required>
                                </div>
                                <div class="mb-6">
                                    <label class="form-label">Password</label>
                                    <input type="password" name="password" class="form-input" required>
                                </div>
                                <button type="submit" class="w-full btn-primary">
                                    Sign In
                                </button>
                            </form>
                        </div>
                        
                        <!-- Register Form -->
                        <div id="register-form" class="tab-content hidden">
                            <form id="register-form-element">
                                <div class="grid grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label class="form-label">First Name</label>
                                        <input type="text" name="first_name" class="form-input" required>
                                    </div>
                                    <div>
                                        <label class="form-label">Last Name</label>
                                        <input type="text" name="last_name" class="form-input" required>
                                    </div>
                                </div>
                                <div class="mb-4">
                                    <label class="form-label">Email</label>
                                    <input type="email" name="email" class="form-input" required>
                                </div>
                                <div class="mb-4">
                                    <label class="form-label">Password</label>
                                    <input type="password" name="password" class="form-input" required minlength="6">
                                </div>
                                <div class="mb-6">
                                    <label class="form-label">Referral Code (Optional)</label>
                                    <input type="text" name="referral_code" class="form-input" placeholder="Enter referral code">
                                </div>
                                <button type="submit" class="w-full btn-primary">
                                    Create Account
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.setupAuthModalEvents();
    }

    setupAuthModalEvents() {
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;
                
                // Update active tab
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active', 'border-nail-pink', 'text-nail-pink'));
                e.target.classList.add('active', 'border-nail-pink', 'text-nail-pink');
                
                // Show/hide forms
                document.querySelectorAll('.tab-content').forEach(content => content.classList.add('hidden'));
                document.getElementById(`${tabName}-form`).classList.remove('hidden');
            });
        });

        // Form submissions
        document.getElementById('login-form-element').addEventListener('submit', (e) => this.handleLogin(e));
        document.getElementById('register-form-element').addEventListener('submit', (e) => this.handleRegister(e));
    }

    async handleLogin(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        
        try {
            const response = await axios.post('/api/auth/login', data);
            if (response.data.success) {
                this.user = response.data.user;
                this.updateAuthUI();
                this.closeModal('auth-modal');
                this.showNotification('Welcome back!', 'success');
                await this.updateCartCount();
            }
        } catch (error) {
            this.showNotification(error.response?.data?.error || 'Login failed', 'error');
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        
        try {
            const response = await axios.post('/api/auth/register', data);
            if (response.data.success) {
                this.user = response.data.user;
                this.updateAuthUI();
                this.closeModal('auth-modal');
                this.showNotification('Account created successfully!', 'success');
                await this.updateCartCount();
            }
        } catch (error) {
            this.showNotification(error.response?.data?.error || 'Registration failed', 'error');
        }
    }

    // Data loading methods
    async loadCategories() {
        try {
            const response = await axios.get('/api/designs/categories');
            if (response.data.success) {
                this.categories = response.data.data;
            }
        } catch (error) {
            console.error('Failed to load categories:', error);
        }
    }

    async loadFeaturedDesigns() {
        try {
            const response = await axios.get('/api/designs/featured?limit=8');
            if (response.data.success) {
                this.designs = response.data.data;
                this.renderFeaturedDesigns();
            }
        } catch (error) {
            console.error('Failed to load featured designs:', error);
        }
    }

    renderFeaturedDesigns() {
        const grid = document.getElementById('design-grid');
        if (!grid) return;

        const designsHTML = this.designs.map((design, index) => `
            <div class="design-card-modern group" onclick="app.showDesignDetails(${design.id})" 
                 data-animate style="animation-delay: ${index * 0.1}s">
                <div class="relative overflow-hidden">
                    <img src="${design.image_url || '/static/images/placeholder-nail.jpg'}" 
                         alt="${design.name}" 
                         class="aspect-square object-cover w-full">
                    
                    ${design.is_premium ? `
                        <div class="absolute top-4 left-4 bg-gradient-to-r from-accent to-yellow-600 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-soft">
                            <i class="fas fa-crown mr-1"></i>
                            Premium
                        </div>
                    ` : ''}
                    
                    <button class="wishlist-btn absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-muted hover:text-danger transition-all transform hover:scale-110 opacity-0 group-hover:opacity-100" 
                            data-design-id="${design.id}">
                        <i class="far fa-heart"></i>
                    </button>
                    
                    <div class="design-overlay"></div>
                    <div class="design-info">
                        <div class="text-sm font-medium mb-1">${design.name}</div>
                        <div class="text-xs opacity-80">${design.category_name || 'Premium Design'}</div>
                    </div>
                    
                    <!-- Quick Actions -->
                    <div class="absolute bottom-4 left-4 right-4 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-4 group-hover:translate-y-0">
                        <button onclick="event.stopPropagation(); app.addToCart(${design.id})" 
                                class="bg-white text-dark px-4 py-2 rounded-xl text-sm font-semibold hover:bg-gray-100 transition-colors flex items-center shadow-soft">
                            <i class="fas fa-cart-plus mr-2"></i>
                            Add
                        </button>
                        <div class="text-white font-bold text-lg">
                            ${design.subscription_price && this.user?.subscription_status !== 'none' ? 
                                `$${design.subscription_price}` : `$${design.base_price}`
                            }
                        </div>
                    </div>
                </div>
                
                <div class="p-6">
                    <h3 class="font-bold text-lg text-dark mb-2 line-clamp-1">${design.name}</h3>
                    <p class="text-muted text-sm mb-4 line-clamp-2">${design.description || 'Beautiful nail art design crafted by expert artists'}</p>
                    
                    <div class="flex items-center justify-between mb-3">
                        <div class="flex items-center space-x-2">
                            ${design.subscription_price && this.user?.subscription_status !== 'none' ? 
                                `<span class="text-sm text-muted line-through">$${design.base_price}</span>
                                 <span class="text-xl font-bold text-primary">$${design.subscription_price}</span>` :
                                `<span class="text-xl font-bold text-dark">$${design.base_price}</span>`
                            }
                        </div>
                        <div class="flex items-center text-xs text-muted">
                            <i class="fas fa-star text-accent mr-1"></i>
                            4.8 (124)
                        </div>
                    </div>
                    
                    <!-- Color Palette -->
                    ${design.colors && design.colors.length ? `
                        <div class="flex items-center space-x-2 mb-3">
                            <span class="text-xs text-muted">Colors:</span>
                            ${design.colors.slice(0, 4).map(color => 
                                `<div class="w-4 h-4 rounded-full border-2 border-white shadow-soft" 
                                      style="background-color: ${color}" title="${color}"></div>`
                            ).join('')}
                            ${design.colors.length > 4 ? `<span class="text-xs text-muted">+${design.colors.length - 4}</span>` : ''}
                        </div>
                    ` : ''}
                    
                    <!-- Tags -->
                    <div class="flex items-center justify-between">
                        <div class="flex items-center space-x-2">
                            ${design.difficulty_level ? `
                                <span class="badge badge-${
                                    design.difficulty_level === 'easy' ? 'success' : 
                                    design.difficulty_level === 'medium' ? 'warning' : 'danger'
                                }">
                                    ${design.difficulty_level}
                                </span>
                            ` : ''}
                            ${design.estimated_time_minutes ? `
                                <span class="text-xs text-muted">${design.estimated_time_minutes}min</span>
                            ` : ''}
                        </div>
                        <button onclick="event.stopPropagation(); app.addToCart(${design.id})" 
                                class="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center hover:bg-primary-dark transition-all transform hover:scale-110 shadow-soft">
                            <i class="fas fa-plus text-sm"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        grid.innerHTML = designsHTML;
        
        // Initialize animations
        setTimeout(() => {
            document.querySelectorAll('[data-animate]').forEach(el => {
                el.classList.add('animate-fade-in');
            });
        }, 100);
    }

    async showDesignDetails(designId) {
        try {
            const response = await axios.get(`/api/designs/${designId}`);
            if (response.data.success) {
                const { design, related_designs, reviews, rating_info } = response.data.data;
                this.renderDesignModal(design, related_designs, reviews, rating_info);
            }
        } catch (error) {
            this.showNotification('Failed to load design details', 'error');
        }
    }

    renderDesignModal(design, relatedDesigns, reviews, ratingInfo) {
        const modalHTML = `
            <div class="modal-overlay" id="design-modal">
                <div class="modal-content max-w-4xl">
                    <div class="modal-header">
                        <div class="flex items-center justify-between">
                            <h3 class="text-2xl font-bold">${design.name}</h3>
                            <button onclick="app.closeModal('design-modal')" class="text-gray-400 hover:text-gray-600">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        ${design.is_premium ? '<span class="subscription-badge">PREMIUM</span>' : ''}
                    </div>
                    <div class="modal-body max-h-96 overflow-y-auto custom-scrollbar">
                        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div>
                                <img src="${design.image_url || '/static/images/placeholder-nail.jpg'}" 
                                     alt="${design.name}" 
                                     class="w-full h-80 object-cover rounded-lg">
                                
                                <!-- Color palette -->
                                <div class="mt-4">
                                    <h4 class="font-semibold mb-2">Colors</h4>
                                    <div class="flex space-x-2">
                                        ${design.colors ? design.colors.map(color => 
                                            `<div class="color-swatch" style="background-color: ${color}" title="${color}"></div>`
                                        ).join('') : ''}
                                    </div>
                                </div>
                                
                                <!-- Patterns -->
                                ${design.patterns && design.patterns.length ? `
                                <div class="mt-4">
                                    <h4 class="font-semibold mb-2">Patterns</h4>
                                    <div class="flex flex-wrap gap-2">
                                        ${design.patterns.map(pattern => 
                                            `<span class="bg-gray-100 px-2 py-1 rounded text-sm">${pattern}</span>`
                                        ).join('')}
                                    </div>
                                </div>
                                ` : ''}
                            </div>
                            
                            <div>
                                <div class="mb-4">
                                    <p class="text-gray-600 mb-4">${design.description || ''}</p>
                                    
                                    <div class="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                                        <div>Difficulty: <span class="font-semibold capitalize">${design.difficulty_level}</span></div>
                                        <div>Time: <span class="font-semibold">${design.estimated_time_minutes} min</span></div>
                                        <div>Category: <span class="font-semibold">${design.category?.name || 'N/A'}</span></div>
                                        <div class="flex items-center">
                                            Rating: 
                                            <div class="star-rating ml-1">
                                                ${this.renderStars(ratingInfo.average_rating)}
                                                <span class="text-xs ml-1">(${ratingInfo.total_reviews})</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="border-t pt-4">
                                        <div class="flex items-center justify-between mb-4">
                                            <div>
                                                ${design.subscription_price ? 
                                                    `<div class="text-sm text-gray-500 line-through">Regular: $${design.base_price}</div>
                                                     <div class="text-2xl font-bold text-nail-pink">Subscriber: $${design.subscription_price}</div>` :
                                                    `<div class="text-2xl font-bold text-nail-pink">$${design.base_price}</div>`
                                                }
                                            </div>
                                        </div>
                                        
                                        <div class="mb-4">
                                            <label class="form-label">Nail Size</label>
                                            <select id="nail-size" class="form-input">
                                                <option value="XS">XS</option>
                                                <option value="S">S</option>
                                                <option value="M" selected>M</option>
                                                <option value="L">L</option>
                                                <option value="XL">XL</option>
                                            </select>
                                        </div>
                                        
                                        <div class="mb-4">
                                            <label class="form-label">Quantity</label>
                                            <div class="quantity-controls">
                                                <button class="quantity-btn" onclick="app.updateQuantity(-1)">-</button>
                                                <input type="number" id="quantity" value="1" min="1" max="10" 
                                                       class="w-16 text-center border border-gray-300 rounded">
                                                <button class="quantity-btn" onclick="app.updateQuantity(1)">+</button>
                                            </div>
                                        </div>
                                        
                                        <button onclick="app.addToCartFromModal(${design.id})" 
                                                class="w-full btn-primary mb-2">
                                            <i class="fas fa-cart-plus mr-2"></i>
                                            Add to Cart
                                        </button>
                                        
                                        ${!this.user ? '<p class="text-sm text-gray-500 text-center">Sign in for subscription pricing</p>' : ''}
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Reviews section -->
                        ${reviews && reviews.length ? `
                        <div class="border-t pt-6 mt-6">
                            <h4 class="font-semibold mb-4">Customer Reviews</h4>
                            <div class="space-y-4">
                                ${reviews.slice(0, 3).map(review => `
                                    <div class="border-b pb-4">
                                        <div class="flex items-center justify-between mb-2">
                                            <span class="font-medium">${review.first_name} ${review.last_name}</span>
                                            <div class="star-rating">
                                                ${this.renderStars(review.rating)}
                                            </div>
                                        </div>
                                        <p class="text-gray-600 text-sm">${review.review_text}</p>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    renderStars(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        let starsHTML = '';
        
        for (let i = 0; i < 5; i++) {
            if (i < fullStars) {
                starsHTML += '<i class="fas fa-star text-yellow-400"></i>';
            } else if (i === fullStars && hasHalfStar) {
                starsHTML += '<i class="fas fa-star-half-alt text-yellow-400"></i>';
            } else {
                starsHTML += '<i class="far fa-star text-gray-300"></i>';
            }
        }
        return starsHTML;
    }

    updateQuantity(change) {
        const quantityInput = document.getElementById('quantity');
        if (quantityInput) {
            const currentValue = parseInt(quantityInput.value);
            const newValue = Math.max(1, Math.min(10, currentValue + change));
            quantityInput.value = newValue;
        }
    }

    // Cart methods
    async addToCart(designId, quantity = 1, nailSize = 'M') {
        if (!this.user) {
            this.showAuthModal();
            return;
        }

        // Show loading state
        const button = event?.target?.closest('button');
        const originalContent = button?.innerHTML;
        if (button) {
            button.innerHTML = '<i class="fas fa-spinner animate-spin"></i>';
            button.disabled = true;
        }

        try {
            const response = await axios.post('/api/cart/add', {
                design_id: designId,
                quantity: quantity,
                nail_size: nailSize
            });
            
            if (response.data.success) {
                // Success animation
                if (button) {
                    button.innerHTML = '<i class="fas fa-check"></i>';
                    button.classList.add('bg-success', 'text-white');
                    
                    // Cart flying animation
                    this.animateToCart(button);
                    
                    setTimeout(() => {
                        if (button && originalContent) {
                            button.innerHTML = originalContent;
                            button.classList.remove('bg-success', 'text-white');
                            button.disabled = false;
                        }
                    }, 2000);
                }
                
                this.showNotification('Added to cart successfully!', 'success');
                await this.updateCartCount();
            }
        } catch (error) {
            if (button && originalContent) {
                button.innerHTML = originalContent;
                button.disabled = false;
            }
            this.showNotification(error.response?.data?.error || 'Failed to add to cart', 'error');
        }
    }

    animateToCart(fromElement) {
        const cart = document.getElementById('cart-btn');
        if (!cart || !fromElement) return;
        
        const fromRect = fromElement.getBoundingClientRect();
        const cartRect = cart.getBoundingClientRect();
        
        const flyingItem = document.createElement('div');
        flyingItem.className = 'fixed w-6 h-6 bg-primary rounded-full z-[110] pointer-events-none';
        flyingItem.style.left = fromRect.left + fromRect.width/2 - 12 + 'px';
        flyingItem.style.top = fromRect.top + fromRect.height/2 - 12 + 'px';
        flyingItem.innerHTML = '<i class="fas fa-gem text-white text-xs flex items-center justify-center h-full"></i>';
        
        document.body.appendChild(flyingItem);
        
        // Animate to cart
        flyingItem.animate([
            { 
                transform: 'translate(0, 0) scale(1)', 
                opacity: 1 
            },
            { 
                transform: `translate(${cartRect.left - fromRect.left}px, ${cartRect.top - fromRect.top}px) scale(0.3)`, 
                opacity: 0 
            }
        ], {
            duration: 600,
            easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
        }).onfinish = () => {
            flyingItem.remove();
            
            // Cart bounce animation
            cart.style.animation = 'bounceSubtle 0.6s ease-out';
            setTimeout(() => {
                cart.style.animation = '';
            }, 600);
        };
    }

    async addToCartFromModal(designId) {
        const nailSize = document.getElementById('nail-size')?.value || 'M';
        const quantity = parseInt(document.getElementById('quantity')?.value || 1);
        
        await this.addToCart(designId, quantity, nailSize);
        this.closeModal('design-modal');
    }

    async updateCartCount() {
        if (!this.user) return;

        try {
            const response = await axios.get('/api/cart');
            if (response.data.success) {
                const itemCount = response.data.data.summary.item_count;
                const cartCountElement = document.getElementById('cart-count');
                
                if (itemCount > 0) {
                    cartCountElement.textContent = itemCount;
                    cartCountElement.classList.remove('hidden');
                } else {
                    cartCountElement.classList.add('hidden');
                }
            }
        } catch (error) {
            console.error('Failed to update cart count:', error);
        }
    }

    async showCart() {
        if (!this.user) {
            this.showAuthModal();
            return;
        }

        try {
            const response = await axios.get('/api/cart');
            if (response.data.success) {
                this.renderCartModal(response.data.data);
            }
        } catch (error) {
            this.showNotification('Failed to load cart', 'error');
        }
    }

    renderCartModal(cartData) {
        const { items, summary } = cartData;
        
        const modalHTML = `
            <div class="modal-overlay" id="cart-modal">
                <div class="modal-content max-w-2xl">
                    <div class="modal-header">
                        <h3 class="text-xl font-semibold">Shopping Cart (${summary.item_count} items)</h3>
                        <button onclick="app.closeModal('cart-modal')" class="text-gray-400 hover:text-gray-600">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body max-h-96 overflow-y-auto custom-scrollbar">
                        ${items.length === 0 ? `
                            <div class="text-center py-8">
                                <i class="fas fa-shopping-cart text-4xl text-gray-300 mb-4"></i>
                                <p class="text-gray-500">Your cart is empty</p>
                                <button onclick="app.closeModal('cart-modal')" class="btn-primary mt-4">
                                    Continue Shopping
                                </button>
                            </div>
                        ` : `
                            <div class="space-y-4">
                                ${items.map(item => `
                                    <div class="cart-item">
                                        <img src="${item.design?.image_url || '/static/images/placeholder-nail.jpg'}" 
                                             alt="${item.design?.name || item.custom_design?.name}" 
                                             class="w-16 h-16 object-cover rounded-lg">
                                        <div class="flex-1">
                                            <h4 class="font-medium">${item.design?.name || item.custom_design?.name}</h4>
                                            <p class="text-sm text-gray-500">Size: ${item.nail_size}</p>
                                            <div class="flex items-center justify-between mt-2">
                                                <div class="quantity-controls">
                                                    <button class="quantity-btn" onclick="app.updateCartItem(${item.id}, ${item.quantity - 1})">-</button>
                                                    <span class="px-3 py-1">${item.quantity}</span>
                                                    <button class="quantity-btn" onclick="app.updateCartItem(${item.id}, ${item.quantity + 1})">+</button>
                                                </div>
                                                <div class="text-right">
                                                    <div class="font-semibold">$${(item.price * item.quantity).toFixed(2)}</div>
                                                    <button onclick="app.removeCartItem(${item.id})" 
                                                            class="text-red-500 hover:text-red-700 text-sm">
                                                        Remove
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                            
                            <div class="border-t mt-6 pt-4">
                                <div class="space-y-2">
                                    <div class="flex justify-between">
                                        <span>Subtotal:</span>
                                        <span>$${summary.subtotal.toFixed(2)}</span>
                                    </div>
                                    <div class="flex justify-between">
                                        <span>Tax:</span>
                                        <span>$${summary.estimated_tax.toFixed(2)}</span>
                                    </div>
                                    <div class="flex justify-between">
                                        <span>Shipping:</span>
                                        <span>${summary.estimated_shipping === 0 ? 'FREE' : '$' + summary.estimated_shipping.toFixed(2)}</span>
                                    </div>
                                    <div class="flex justify-between font-bold text-lg border-t pt-2">
                                        <span>Total:</span>
                                        <span>$${summary.estimated_total.toFixed(2)}</span>
                                    </div>
                                </div>
                                
                                <button onclick="app.proceedToCheckout()" class="w-full btn-primary mt-4">
                                    Proceed to Checkout
                                </button>
                            </div>
                        `}
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    async updateCartItem(itemId, newQuantity) {
        if (newQuantity < 1) {
            await this.removeCartItem(itemId);
            return;
        }

        try {
            await axios.put(`/api/cart/${itemId}`, { quantity: newQuantity });
            this.closeModal('cart-modal');
            await this.showCart(); // Refresh cart
            await this.updateCartCount();
        } catch (error) {
            this.showNotification('Failed to update item', 'error');
        }
    }

    async removeCartItem(itemId) {
        try {
            await axios.delete(`/api/cart/${itemId}`);
            this.closeModal('cart-modal');
            await this.showCart(); // Refresh cart
            await this.updateCartCount();
        } catch (error) {
            this.showNotification('Failed to remove item', 'error');
        }
    }

    proceedToCheckout() {
        // In a real app, this would redirect to a checkout page
        this.showNotification('Checkout functionality coming soon!', 'warning');
    }

    // Utility methods
    setupEventListeners() {
        // Cart button
        document.getElementById('cart-btn')?.addEventListener('click', () => this.showCart());
        
        // Smooth scrolling for navigation links
        document.querySelectorAll('a[href^="#"]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(link.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            });
        });

        // Close modal when clicking overlay
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                e.target.remove();
            }
        });

        // Handle escape key for modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const modal = document.querySelector('.modal-overlay');
                if (modal) {
                    modal.remove();
                }
            }
        });
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.remove();
        }
    }

    showNotification(message, type = 'info') {
        // Remove existing notifications of the same type
        document.querySelectorAll(`.notification.${type}`).forEach(n => n.remove());
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="flex items-center justify-between">
                <div class="flex items-center">
                    <div class="w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                        type === 'success' ? 'bg-success/10' : 
                        type === 'error' ? 'bg-danger/10' : 
                        type === 'warning' ? 'bg-warning/10' : 'bg-primary/10'
                    }">
                        <i class="fas ${
                            type === 'success' ? 'fa-check text-success' : 
                            type === 'error' ? 'fa-exclamation-triangle text-danger' : 
                            type === 'warning' ? 'fa-exclamation text-warning' : 
                            'fa-info-circle text-primary'
                        }"></i>
                    </div>
                    <div>
                        <div class="font-semibold text-dark mb-1">
                            ${type === 'success' ? 'Success!' : 
                              type === 'error' ? 'Error' : 
                              type === 'warning' ? 'Warning' : 'Info'}
                        </div>
                        <div class="text-sm text-muted">${message}</div>
                    </div>
                </div>
                <button onclick="this.parentElement.parentElement.style.opacity='0'; setTimeout(() => this.parentElement.parentElement.remove(), 300)" 
                        class="text-muted hover:text-dark transition-colors p-1">
                    <i class="fas fa-times text-sm"></i>
                </button>
            </div>
        `;

        document.body.appendChild(notification);
        
        // Trigger entrance animation
        setTimeout(() => notification.style.opacity = '1', 50);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.style.opacity = '0';
                setTimeout(() => notification.remove(), 300);
            }
        }, 5000);
    }

    showUserMenu() {
        // Simple user menu - in a real app this would be more comprehensive
        const menu = document.createElement('div');
        menu.className = 'absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50';
        menu.innerHTML = `
            <div class="p-2">
                <div class="px-4 py-2 text-sm text-gray-700 border-b">
                    ${this.user.first_name} ${this.user.last_name}
                </div>
                <button class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded">
                    Profile
                </button>
                <button class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded">
                    Orders
                </button>
                <button class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded">
                    Subscriptions
                </button>
                <button onclick="app.logout()" class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded">
                    Logout
                </button>
            </div>
        `;

        // Position menu relative to auth button
        const authBtn = document.getElementById('auth-btn');
        authBtn.parentElement.style.position = 'relative';
        authBtn.parentElement.appendChild(menu);

        // Remove menu when clicking elsewhere
        const removeMenu = (e) => {
            if (!menu.contains(e.target) && !authBtn.contains(e.target)) {
                menu.remove();
                document.removeEventListener('click', removeMenu);
            }
        };
        
        setTimeout(() => {
            document.addEventListener('click', removeMenu);
        }, 100);
    }

    async logout() {
        try {
            await axios.post('/api/auth/logout');
            this.user = null;
            this.updateAuthUI();
            await this.updateCartCount();
            this.showNotification('Logged out successfully', 'success');
        } catch (error) {
            console.error('Logout error:', error);
        }
    }
}

// Add search tag styles
const searchTagStyles = `
    .search-tag {
        @apply bg-gray-100 hover:bg-primary hover:text-white text-muted px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 cursor-pointer;
    }
    
    .search-result-item:hover {
        transform: translateY(-2px);
    }
`;

// Add styles to page
const styleSheet = document.createElement('style');
styleSheet.textContent = searchTagStyles;
document.head.appendChild(styleSheet);

// Initialize the app when page loads
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new NailCraftApp();
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey || e.metaKey) {
            switch(e.key) {
                case 'k':
                    e.preventDefault();
                    app.showSearchModal();
                    break;
                case '/':
                    e.preventDefault();
                    app.showSearchModal();
                    break;
            }
        }
        
        if (e.key === 'Escape') {
            const modals = document.querySelectorAll('.modal-overlay');
            modals.forEach(modal => modal.remove());
        }
    });
    
    // Add scroll-based navbar styling
    let lastScrollTop = 0;
    const navbar = document.querySelector('header');
    
    window.addEventListener('scroll', () => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        if (scrollTop > lastScrollTop && scrollTop > 100) {
            // Scrolling down
            navbar.style.transform = 'translateY(-100%)';
        } else {
            // Scrolling up
            navbar.style.transform = 'translateY(0)';
        }
        
        // Add background on scroll
        if (scrollTop > 50) {
            navbar.classList.add('shadow-medium');
        } else {
            navbar.classList.remove('shadow-medium');
        }
        
        lastScrollTop = scrollTop;
    });
});