// NailCraft Studio Frontend Application

class NailCraftApp {
    constructor() {
        this.user = null;
        this.cart = [];
        this.designs = [];
        this.categories = [];
        this.currentPage = 1;
        this.isLoading = false;
        
        this.init();
    }

    async init() {
        // Check if user is authenticated
        await this.checkAuthStatus();
        
        // Load initial data
        await this.loadCategories();
        await this.loadFeaturedDesigns();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Update cart count
        await this.updateCartCount();
        
        console.log('NailCraft Studio initialized');
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

        const designsHTML = this.designs.map(design => `
            <div class="design-card" onclick="app.showDesignDetails(${design.id})">
                ${design.is_premium ? '<div class="premium-badge">PREMIUM</div>' : ''}
                <div class="relative overflow-hidden">
                    <img src="${design.image_url || '/static/images/placeholder-nail.jpg'}" 
                         alt="${design.name}" 
                         class="w-full h-48 object-cover">
                </div>
                <div class="p-4">
                    <h4 class="font-semibold text-lg mb-2">${design.name}</h4>
                    <p class="text-gray-600 text-sm mb-3 line-clamp-2">${design.description || ''}</p>
                    <div class="flex items-center justify-between">
                        <div class="flex items-center space-x-2">
                            ${design.subscription_price ? 
                                `<span class="text-sm text-gray-500 line-through">$${design.base_price}</span>
                                 <span class="price-tag">$${design.subscription_price}</span>` :
                                `<span class="price-tag">$${design.base_price}</span>`
                            }
                        </div>
                        <button onclick="event.stopPropagation(); app.addToCart(${design.id})" 
                                class="text-nail-pink hover:text-premium-purple transition-colors">
                            <i class="fas fa-cart-plus"></i>
                        </button>
                    </div>
                    <div class="mt-2 flex items-center space-x-1">
                        ${design.colors ? design.colors.slice(0, 3).map(color => 
                            `<div class="w-4 h-4 rounded-full border" style="background-color: ${color}"></div>`
                        ).join('') : ''}
                        <span class="text-xs text-gray-500 ml-2">${design.category_name || ''}</span>
                    </div>
                </div>
            </div>
        `).join('');

        grid.innerHTML = designsHTML;
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

        try {
            const response = await axios.post('/api/cart/add', {
                design_id: designId,
                quantity: quantity,
                nail_size: nailSize
            });
            
            if (response.data.success) {
                this.showNotification('Added to cart!', 'success');
                await this.updateCartCount();
            }
        } catch (error) {
            this.showNotification(error.response?.data?.error || 'Failed to add to cart', 'error');
        }
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
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="flex items-center justify-between">
                <div class="flex items-center">
                    <i class="fas ${type === 'success' ? 'fa-check-circle' : 
                                   type === 'error' ? 'fa-exclamation-circle' : 
                                   'fa-info-circle'} mr-2"></i>
                    <span>${message}</span>
                </div>
                <button onclick="this.parentElement.parentElement.remove()" class="text-gray-400 hover:text-gray-600">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        document.body.appendChild(notification);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
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

// Initialize the app when page loads
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new NailCraftApp();
});