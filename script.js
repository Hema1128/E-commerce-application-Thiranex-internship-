let currentUser = null;
let currentProducts = [];
let cart = [];
let wishlist = [];
let currentFilter = 'all';
let currentSort = 'default';

const API = 'http://localhost:3003/api';

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.style.background = type === 'success' ? '#27ae60' : '#e74c3c';
    toast.innerHTML = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

async function register() {
    const username = document.getElementById('regName').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;

    try {
        const res = await fetch(API + '/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });
        const data = await res.json();
        if (res.ok) {
            localStorage.setItem('token', data.token);
            currentUser = data.user;
            updateUI();
            loadProducts();
            showPage('home');
            showToast('Registration successful!');
        } else {
            document.getElementById('registerError').innerText = data.error;
        }
    } catch (err) {
        document.getElementById('registerError').innerText = 'Server error';
    }
}

async function login() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const res = await fetch(API + '/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (res.ok) {
            localStorage.setItem('token', data.token);
            currentUser = data.user;
            updateUI();
            loadProducts();
            showPage('home');
            showToast('Welcome back!');
            loadWishlist();
        } else {
            document.getElementById('loginError').innerText = data.error;
        }
    } catch (err) {
        document.getElementById('loginError').innerText = 'Server error';
    }
}

function logout() {
    localStorage.removeItem('token');
    currentUser = null;
    wishlist = [];
    updateUI();
    showPage('home');
    loadProducts();
    showToast('Logged out');
}

function updateUI() {
    if (currentUser) {
        document.getElementById('authLinks').style.display = 'none';
        document.getElementById('userLinks').style.display = 'flex';
        document.getElementById('username').innerHTML = '👤 ' + currentUser.username;
    } else {
        document.getElementById('authLinks').style.display = 'flex';
        document.getElementById('userLinks').style.display = 'none';
    }
}

async function loadProducts() {
    try {
        const res = await fetch(API + '/products');
        currentProducts = await res.json();
        applyFiltersAndSort();
    } catch (err) {
        console.error('Error loading products:', err);
    }
}

function applyFiltersAndSort() {
    let filtered = [...currentProducts];
    
    // Apply filter
    if (currentFilter !== 'all') {
        filtered = filtered.filter(p => p.category === currentFilter);
    }
    
    // Apply sort
    if (currentSort === 'priceLow') {
        filtered.sort((a, b) => a.price - b.price);
    } else if (currentSort === 'priceHigh') {
        filtered.sort((a, b) => b.price - a.price);
    } else if (currentSort === 'rating') {
        filtered.sort((a, b) => b.rating - a.rating);
    }
    
    displayProducts(filtered);
}

function displayProducts(products) {
    const container = document.getElementById('productsContainer');
    if (!container) return;
    
    if (products.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🔍</div><h3>No products found</h3></div>';
        return;
    }
    
    container.innerHTML = products.map(product => {
        const formattedPrice = '₹' + product.price.toLocaleString('en-IN');
        const stockStatus = product.stock > 0 ? `<span class="in-stock">✓ In Stock (${product.stock})</span>` : `<span class="out-of-stock">✗ Out of Stock</span>`;
        let badges = '';
        if (product.featured) badges += '<span class="product-badge">🔥 Featured</span>';
        if (product.discount) badges += '<span class="product-badge sale">' + product.discount + '% OFF</span>';
        
        return `
            <div class="product-card">
                ${badges}
                <div class="product-image">${product.image}</div>
                <div class="product-info">
                    <div class="product-title">${product.name}</div>
                    <div class="product-price">${formattedPrice}</div>
                    <div class="product-rating">⭐ ${product.rating} / 5 (${product.reviews || 0} reviews)</div>
                    <div class="product-desc">${product.description}</div>
                    <div class="product-stock">${stockStatus}</div>
                    <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem;">
                        <button class="btn-primary" style="flex:1" onclick="addToCart(${product.id})">🛒 Add to Cart</button>
                        <button class="btn-wishlist" onclick="addToWishlist(${product.id})">❤️</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function searchProducts() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    if (!searchTerm) {
        applyFiltersAndSort();
        return;
    }
    const filtered = currentProducts.filter(p => 
        p.name.toLowerCase().includes(searchTerm) || 
        p.category.toLowerCase().includes(searchTerm)
    );
    displayProducts(filtered);
}

function sortProducts() {
    currentSort = document.getElementById('sortSelect').value;
    applyFiltersAndSort();
}

function filterProducts(category) {
    currentFilter = category;
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    if (event && event.target) {
        event.target.classList.add('active');
    }
    applyFiltersAndSort();
}

async function addToCart(productId) {
    if (!currentUser) {
        showToast('Please login first', 'error');
        showPage('login');
        return;
    }
    const token = localStorage.getItem('token');
    try {
        await fetch(API + '/cart', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': token },
            body: JSON.stringify({ productId, quantity: 1 })
        });
        loadCartCount();
        showToast('✓ Added to cart!');
    } catch (err) {
        showToast('Error', 'error');
    }
}

function addToWishlist(productId) {
    if (!currentUser) {
        showToast('Please login first', 'error');
        showPage('login');
        return;
    }
    if (!wishlist.includes(productId)) {
        wishlist.push(productId);
        saveWishlist();
        showToast('❤️ Added to wishlist!');
        updateWishlistCount();
    } else {
        showToast('Already in wishlist', 'error');
    }
}

function saveWishlist() {
    localStorage.setItem('wishlist_' + (currentUser?.id || ''), JSON.stringify(wishlist));
}

function loadWishlist() {
    const saved = localStorage.getItem('wishlist_' + (currentUser?.id || ''));
    wishlist = saved ? JSON.parse(saved) : [];
    updateWishlistCount();
}

function updateWishlistCount() {
    document.getElementById('wishlistCount').innerText = wishlist.length;
}

async function loadCartCount() {
    if (!currentUser) return;
    const token = localStorage.getItem('token');
    try {
        const res = await fetch(API + '/cart', { headers: { 'Authorization': token } });
        const cart = await res.json();
        document.getElementById('cartCount').innerText = cart.length;
    } catch (err) {}
}

async function showCart() {
    if (!currentUser) { showPage('login'); return; }
    const token = localStorage.getItem('token');
    try {
        const res = await fetch(API + '/cart', { headers: { 'Authorization': token } });
        cart = await res.json();
        
        const container = document.getElementById('cartContainer');
        if (!container) return;
        
        if (cart.length === 0) {
            container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🛒</div><h3>Your cart is empty</h3></div>';
            document.getElementById('cartTotal').innerHTML = '';
            return;
        }
        
        let subtotal = 0;
        container.innerHTML = cart.map(item => {
            const itemTotal = item.product.price * item.quantity;
            subtotal += itemTotal;
            return `
                <div class="cart-item">
                    <div class="cart-item-info">
                        <strong>${item.product.name}</strong><br>
                        <small>₹${item.product.price.toLocaleString('en-IN')} each</small>
                    </div>
                    <div class="quantity-control">
                        <button class="quantity-btn" onclick="updateQuantity(${item.productId}, ${item.quantity - 1})">-</button>
                        <span>${item.quantity}</span>
                        <button class="quantity-btn" onclick="updateQuantity(${item.productId}, ${item.quantity + 1})">+</button>
                    </div>
                    <div><strong>₹${itemTotal.toLocaleString('en-IN')}</strong></div>
                    <button class="btn-danger" onclick="removeFromCart(${item.productId})">Remove</button>
                </div>
            `;
        }).join('');
        
        const shipping = subtotal > 999 ? 0 : 49;
        const total = subtotal + shipping;
        
        document.getElementById('cartTotal').innerHTML = `
            <div class="cart-total">
                <h3>Order Summary</h3>
                <div>Subtotal: ₹${subtotal.toLocaleString('en-IN')}</div>
                <div>Shipping: ${shipping === 0 ? 'FREE' : '₹' + shipping}</div>
                <hr>
                <h2>Total: ₹${total.toLocaleString('en-IN')}</h2>
                ${subtotal < 999 ? '<small>Add ₹' + (999 - subtotal).toLocaleString('en-IN') + ' more for FREE shipping!</small>' : '<small>✓ Free shipping applied!</small>'}
            </div>
        `;
    } catch (err) {}
}

function showWishlist() {
    const wishlistProducts = currentProducts.filter(p => wishlist.includes(p.id));
    const container = document.getElementById('wishlistContainer');
    
    if (wishlistProducts.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">❤️</div><h3>Your wishlist is empty</h3></div>';
        return;
    }
    
    container.innerHTML = wishlistProducts.map(product => `
        <div class="cart-item">
            <div class="cart-item-info">
                <strong>${product.name}</strong><br>
                <small>₹${product.price.toLocaleString('en-IN')}</small>
            </div>
            <div>
                <button class="btn-primary" onclick="addToCart(${product.id})">Add to Cart</button>
                <button class="btn-danger" onclick="removeFromWishlist(${product.id})">Remove</button>
            </div>
        </div>
    `).join('');
}

function removeFromWishlist(productId) {
    wishlist = wishlist.filter(id => id !== productId);
    saveWishlist();
    updateWishlistCount();
    showWishlist();
    showToast('Removed from wishlist');
}

async function updateQuantity(productId, newQuantity) {
    if (newQuantity <= 0) {
        removeFromCart(productId);
        return;
    }
    const token = localStorage.getItem('token');
    await fetch(API + '/cart/' + productId, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': token },
        body: JSON.stringify({ quantity: newQuantity })
    });
    showCart();
    loadCartCount();
}

async function removeFromCart(productId) {
    const token = localStorage.getItem('token');
    await fetch(API + '/cart/' + productId, { method: 'DELETE', headers: { 'Authorization': token } });
    showCart();
    loadCartCount();
    showToast('Item removed');
}

async function checkout() {
    const token = localStorage.getItem('token');
    const res = await fetch(API + '/orders', { method: 'POST', headers: { 'Authorization': token } });
    if (res.ok) {
        showToast('🎉 Order placed successfully!');
        showPage('orders');
        loadCartCount();
    }
}

async function showOrders() {
    if (!currentUser) { showPage('login'); return; }
    const token = localStorage.getItem('token');
    const res = await fetch(API + '/orders', { headers: { 'Authorization': token } });
    const orders = await res.json();
    
    const container = document.getElementById('ordersContainer');
    if (orders.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📦</div><h3>No orders yet</h3></div>';
        return;
    }
    
    container.innerHTML = orders.map(order => `
        <div class="order-card">
            <div class="order-header">
                <strong>Order #${order.id}</strong>
                <span class="order-status status-${order.status}">${order.status}</span>
            </div>
            <p>Date: ${new Date(order.createdAt).toLocaleDateString()}</p>
            <p>Total: ₹${order.total.toLocaleString('en-IN')}</p>
            <details>
                <summary>View Items</summary>
                ${order.items.map(item => `<div>${item.product.name} x${item.quantity} = ₹${(item.product.price * item.quantity).toLocaleString('en-IN')}</div>`).join('')}
            </details>
        </div>
    `).join('');
}

function showPage(page) {
    const pages = ['login', 'register', 'home', 'cart', 'wishlist', 'orders'];
    pages.forEach(p => {
        const el = document.getElementById(p + 'Page');
        if (el) el.classList.add('hidden');
    });
    document.getElementById(page + 'Page').classList.remove('hidden');
    
    if (page === 'home') loadProducts();
    if (page === 'cart') showCart();
    if (page === 'orders') showOrders();
    if (page === 'wishlist') showWishlist();
}

// Initialize
const token = localStorage.getItem('token');
if (token) {
    currentUser = { username: 'User', role: 'user', id: 1 };
    updateUI();
    loadProducts();
    loadCartCount();
    loadWishlist();
    showPage('home');
} else {
    showPage('login');
}
