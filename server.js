const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// ============ DATABASE (In-memory) ============
let users = [];
let orders = [];
let carts = {};
let nextUserId = 1;
let nextOrderId = 1;

// ============ PRODUCTS (Indian Rupees - ₹) ============
let products = [];
let nextProductId = 1;

// ELECTRONICS (10 products)
const electronics = [
    { name: "Apple MacBook Pro M3", price: 189999, description: "16-inch, 16GB RAM, 512GB SSD, M3 Pro chip - Perfect for professionals", category: "Electronics", stock: 10, image: "💻", rating: 4.9, reviews: 234, featured: true, discount: 10 },
    { name: "iPhone 15 Pro Max", price: 159999, description: "256GB, Titanium, A17 Pro chip, 48MP camera with 5x zoom", category: "Electronics", stock: 15, image: "📱", rating: 4.9, reviews: 890, featured: true },
    { name: "Sony WH-1000XM5", price: 29990, description: "Industry-leading noise cancellation, 30-hour battery life", category: "Electronics", stock: 25, image: "🎧", rating: 4.8, reviews: 567, featured: true },
    { name: "Apple Watch Ultra 2", price: 89999, description: "49mm titanium case, 100m water resistance, dual-frequency GPS", category: "Electronics", stock: 8, image: "⌚", rating: 4.9, reviews: 123, featured: true },
    { name: "Samsung Galaxy S24 Ultra", price: 129999, description: "256GB, 200MP camera, S Pen included, AI features", category: "Electronics", stock: 12, image: "📱", rating: 4.7, reviews: 456, featured: false },
    { name: "iPad Pro 12.9-inch", price: 119999, description: "M2 chip, Liquid Retina XDR display, 128GB storage", category: "Electronics", stock: 10, image: "📟", rating: 4.8, reviews: 234, featured: false },
    { name: "DJI Mini 4 Pro Drone", price: 79999, description: "4K HDR video, 34min flight time, obstacle avoidance", category: "Electronics", stock: 5, image: "🚁", rating: 4.8, reviews: 89, featured: false },
    { name: "Canon EOS R50 Camera", price: 69999, description: "24.2MP, 4K video, mirrorless with kit lens", category: "Electronics", stock: 8, image: "📷", rating: 4.7, reviews: 67, featured: false },
    { name: "PlayStation 5", price: 54999, description: "Ultra HD Blu-ray, 825GB SSD, DualSense controller", category: "Electronics", stock: 20, image: "🎮", rating: 4.9, reviews: 567, featured: true },
    { name: "Xbox Series X", price: 54999, description: "1TB SSD, 4K gaming, backwards compatible", category: "Electronics", stock: 18, image: "🎮", rating: 4.8, reviews: 345, featured: false },
    { name: "Nothing Phone 2", price: 44999, description: "12GB RAM, 256GB, Glyph Interface, 50MP dual camera", category: "Electronics", stock: 20, image: "📱", rating: 4.5, reviews: 234, featured: false },
    { name: "OnePlus 12", price: 64999, description: "16GB RAM, 512GB, Hasselblad camera, 100W charging", category: "Electronics", stock: 15, image: "📱", rating: 4.6, reviews: 456, featured: false }
];

// CLOTHING (12 products)
const clothing = [
    { name: "Premium Cotton T-Shirt", price: 1299, description: "100% combed cotton, premium quality, round neck, 5 colors", category: "Clothing", stock: 50, image: "👕", rating: 4.3, reviews: 89, featured: false },
    { name: "Men's Denim Jacket", price: 3999, description: "Classic blue denim, button closure, multiple pockets", category: "Clothing", stock: 30, image: "🧥", rating: 4.5, reviews: 67, featured: true, discount: 15 },
    { name: "Women's Floral Dress", price: 2499, description: "Floral print, knee-length, sleeveless, breathable fabric", category: "Clothing", stock: 40, image: "👗", rating: 4.6, reviews: 123, featured: false },
    { name: "Hoodie Sweatshirt", price: 1999, description: "Cotton blend, pullover hoodie, kangaroo pocket", category: "Clothing", stock: 60, image: "🧥", rating: 4.4, reviews: 78, featured: false },
    { name: "Formal Shirt", price: 2499, description: "Cotton, slim fit, wrinkle-free, office wear", category: "Clothing", stock: 45, image: "👔", rating: 4.2, reviews: 56, featured: false },
    { name: "Women's Leggings", price: 999, description: "High-waist, stretchable, comfortable for yoga/gym", category: "Clothing", stock: 80, image: "👖", rating: 4.4, reviews: 112, featured: false },
    { name: "Men's Blazer", price: 5999, description: "Formal blazer, single-breasted, slim fit", category: "Clothing", stock: 20, image: "👔", rating: 4.6, reviews: 45, featured: true },
    { name: "Winter Sweater", price: 2999, description: "Wool blend, crew neck, warm and soft", category: "Clothing", stock: 35, image: "🧥", rating: 4.5, reviews: 89, featured: false },
    { name: "Running Shorts", price: 999, description: "Breathable fabric, quick-dry, elastic waist", category: "Clothing", stock: 100, image: "🩳", rating: 4.1, reviews: 56, featured: false },
    { name: "Yoga Pants", price: 1499, description: "High-waist, moisture-wicking, 4-way stretch", category: "Clothing", stock: 70, image: "👖", rating: 4.5, reviews: 98, featured: false },
    { name: "Silk Saree", price: 5999, description: "Banarasi silk, traditional design, unstitched", category: "Clothing", stock: 15, image: "👗", rating: 4.7, reviews: 234, featured: true },
    { name: "Kurta Set", price: 3499, description: "Cotton kurta with pajama, festive wear", category: "Clothing", stock: 40, image: "👔", rating: 4.4, reviews: 156, featured: false }
];

// FOOTWEAR (12 products)
const footwear = [
    { name: "Nike Air Max 90", price: 12999, description: "Running shoes with Air cushioning, breathable mesh", category: "Footwear", stock: 30, image: "👟", rating: 4.5, reviews: 456, featured: true, discount: 20 },
    { name: "Adidas Ultraboost", price: 15999, description: "Boost cushioning, Primeknit upper, energy return", category: "Footwear", stock: 25, image: "👟", rating: 4.7, reviews: 234, featured: true },
    { name: "Puma RS-X", price: 8999, description: "Retro design, chunky sole, comfortable", category: "Footwear", stock: 40, image: "👟", rating: 4.3, reviews: 123, featured: false },
    { name: "Formal Leather Shoes", price: 4999, description: "Genuine leather, slip-resistant, formal events", category: "Footwear", stock: 35, image: "👞", rating: 4.4, reviews: 89, featured: false },
    { name: "Women's Heels", price: 2999, description: "Stiletto heels, ankle strap, formal wear", category: "Footwear", stock: 25, image: "👠", rating: 4.2, reviews: 67, featured: false },
    { name: "Sports Sandals", price: 1999, description: "Adjustable straps, cushioned footbed", category: "Footwear", stock: 50, image: "👡", rating: 4.3, reviews: 56, featured: false },
    { name: "Hiking Boots", price: 7999, description: "Waterproof, ankle support, durable sole", category: "Footwear", stock: 20, image: "🥾", rating: 4.6, reviews: 78, featured: true },
    { name: "Crocs Clogs", price: 2499, description: "Lightweight, breathable, comfortable", category: "Footwear", stock: 60, image: "👡", rating: 4.1, reviews: 234, featured: false },
    { name: "Skateboard Shoes", price: 4999, description: "Durable suede, padded collar, flat sole", category: "Footwear", stock: 30, image: "👟", rating: 4.3, reviews: 45, featured: false },
    { name: "Bata Slippers", price: 799, description: "Comfortable, durable, indoor/outdoor", category: "Footwear", stock: 100, image: "🩴", rating: 4.0, reviews: 345, featured: false },
    { name: "Woodland Boots", price: 8999, description: "Premium leather, rugged sole, all-terrain", category: "Footwear", stock: 25, image: "🥾", rating: 4.5, reviews: 189, featured: false },
    { name: "Running Shoes", price: 3999, description: "Lightweight, cushioned sole, breathable", category: "Footwear", stock: 60, image: "👟", rating: 4.3, reviews: 234, featured: false }
];

// ACCESSORIES (15 products)
const accessories = [
    { name: "Leather Wallet", price: 2499, description: "Genuine leather, RFID blocking, 6 card slots", category: "Accessories", stock: 40, image: "👛", rating: 4.2, reviews: 45, featured: false },
    { name: "Smart Watch Band", price: 899, description: "Silicone, interchangeable, comfortable fit", category: "Accessories", stock: 80, image: "⌚", rating: 4.1, reviews: 67, featured: false },
    { name: "Wireless Power Bank", price: 2999, description: "20000mAh, fast charging, dual USB ports", category: "Accessories", stock: 45, image: "🔋", rating: 4.5, reviews: 123, featured: true },
    { name: "Laptop Bag", price: 3499, description: "Waterproof, 15.6-inch, padded compartment", category: "Accessories", stock: 30, image: "🎒", rating: 4.4, reviews: 89, featured: false },
    { name: "Sunglasses", price: 1999, description: "UV protection, polarized, unisex design", category: "Accessories", stock: 50, image: "🕶️", rating: 4.3, reviews: 156, featured: false },
    { name: "Backpack", price: 3999, description: "Water-resistant, multiple pockets, laptop sleeve", category: "Accessories", stock: 35, image: "🎒", rating: 4.6, reviews: 234, featured: true },
    { name: "Phone Case", price: 599, description: "Shockproof, slim fit, raised edges protection", category: "Accessories", stock: 120, image: "📱", rating: 4.2, reviews: 456, featured: false },
    { name: "Smartwatch Charger", price: 499, description: "Magnetic charging dock, fast charge", category: "Accessories", stock: 60, image: "🔌", rating: 4.0, reviews: 34, featured: false },
    { name: "Selfie Stick Tripod", price: 1299, description: "Bluetooth remote, extendable, lightweight", category: "Accessories", stock: 40, image: "🎥", rating: 4.3, reviews: 78, featured: false },
    { name: "Wireless Mouse", price: 1499, description: "Silent click, ergonomic, 2.4GHz", category: "Accessories", stock: 55, image: "🖱️", rating: 4.4, reviews: 112, featured: false },
    { name: "USB-C Hub", price: 3499, description: "7-in-1, 4K HDMI, USB 3.0, SD card reader", category: "Accessories", stock: 30, image: "🔌", rating: 4.6, reviews: 67, featured: false },
    { name: "Gaming Headset", price: 4999, description: "7.1 surround sound, RGB, noise-cancelling mic", category: "Accessories", stock: 25, image: "🎧", rating: 4.7, reviews: 89, featured: true },
    { name: "Belt", price: 1299, description: "Genuine leather, adjustable, formal/casual", category: "Accessories", stock: 70, image: "👔", rating: 4.1, reviews: 123, featured: false },
    { name: "Cap", price: 599, description: "Cotton, adjustable, unisex", category: "Accessories", stock: 90, image: "🧢", rating: 4.0, reviews: 234, featured: false },
    { name: "Wrist Watch", price: 5999, description: "Analog, stainless steel, water resistant", category: "Accessories", stock: 30, image: "⌚", rating: 4.5, reviews: 189, featured: false }
];

// SPORTS (12 products)
const sports = [
    { name: "Premium Yoga Mat", price: 1499, description: "Non-slip, eco-friendly, 6mm thickness", category: "Sports", stock: 60, image: "🧘", rating: 4.3, reviews: 67, featured: false },
    { name: "Cricket Bat", price: 4999, description: "English willow, full size, cane handle", category: "Sports", stock: 20, image: "🏏", rating: 4.5, reviews: 89, featured: true },
    { name: "Football", price: 1999, description: "Size 5, machine stitched, durable", category: "Sports", stock: 40, image: "⚽", rating: 4.4, reviews: 123, featured: false },
    { name: "Badminton Racket", price: 2499, description: "Carbon fiber, lightweight, full cover", category: "Sports", stock: 35, image: "🏸", rating: 4.6, reviews: 78, featured: false },
    { name: "Dumbbells Set", price: 4999, description: "5kg pair, rubber coated, anti-slip", category: "Sports", stock: 25, image: "🏋️", rating: 4.5, reviews: 112, featured: true },
    { name: "Resistance Bands", price: 999, description: "5 levels of resistance, portable, durable", category: "Sports", stock: 80, image: "💪", rating: 4.3, reviews: 234, featured: false },
    { name: "Jump Rope", price: 499, description: "Adjustable length, ball bearings, comfortable grip", category: "Sports", stock: 100, image: "🪢", rating: 4.2, reviews: 156, featured: false },
    { name: "Gym Gloves", price: 899, description: "Leather palm, wrist support, breathable", category: "Sports", stock: 60, image: "🧤", rating: 4.1, reviews: 78, featured: false },
    { name: "Water Bottle", price: 599, description: "Stainless steel, insulated, 1L", category: "Sports", stock: 90, image: "💧", rating: 4.4, reviews: 234, featured: false },
    { name: "Fitness Tracker", price: 3999, description: "Heart rate monitor, step counter, waterproof", category: "Sports", stock: 30, image: "⌚", rating: 4.5, reviews: 156, featured: true },
    { name: "Tennis Racket", price: 3999, description: "Carbon fiber, lightweight, vibration dampening", category: "Sports", stock: 25, image: "🎾", rating: 4.4, reviews: 89, featured: false },
    { name: "Cycling Helmet", price: 2499, description: "Ventilated, adjustable, safety certified", category: "Sports", stock: 35, image: "🚴", rating: 4.3, reviews: 67, featured: false }
];

// HOME & LIVING (10 products)
const home = [
    { name: "Stainless Steel Water Bottle", price: 999, description: "Double wall insulation, keeps hot/cold for 24hrs", category: "Home", stock: 100, image: "💧", rating: 4.4, reviews: 78, featured: false },
    { name: "Coffee Maker", price: 8999, description: "Drip coffee maker with thermal carafe", category: "Home", stock: 20, image: "☕", rating: 4.3, reviews: 78, featured: false },
    { name: "Air Purifier", price: 12999, description: "HEPA filter, removes 99.97% pollutants", category: "Home", stock: 15, image: "🌬️", rating: 4.6, reviews: 67, featured: true },
    { name: "Memory Foam Pillow", price: 1999, description: "Orthopedic, cervical support, washable cover", category: "Home", stock: 45, image: "🛏️", rating: 4.4, reviews: 134, featured: false },
    { name: "LED Desk Lamp", price: 2499, description: "5 modes, adjustable brightness, USB charging", category: "Home", stock: 35, image: "💡", rating: 4.3, reviews: 89, featured: false },
    { name: "Cookware Set", price: 7999, description: "Non-stick, induction compatible, 6 pieces", category: "Home", stock: 25, image: "🍳", rating: 4.5, reviews: 112, featured: true },
    { name: "Bed Sheets Set", price: 2999, description: "100% cotton, 400 thread count, king size", category: "Home", stock: 40, image: "🛏️", rating: 4.2, reviews: 78, featured: false },
    { name: "Wall Clock", price: 1499, description: "Silent movement, modern design, battery operated", category: "Home", stock: 50, image: "🕐", rating: 4.3, reviews: 67, featured: false },
    { name: "Microwave Oven", price: 14999, description: "Convection, 25L, auto-cook menu", category: "Home", stock: 18, image: "🔥", rating: 4.5, reviews: 234, featured: false },
    { name: "Vacuum Cleaner", price: 9999, description: "Bagless, 600W, HEPA filter", category: "Home", stock: 20, image: "🧹", rating: 4.4, reviews: 156, featured: false }
];

// Add all products
function addProducts(productList) {
    for (let p of productList) {
        products.push({
            id: nextProductId++,
            ...p
        });
    }
}

addProducts(electronics);
addProducts(clothing);
addProducts(footwear);
addProducts(accessories);
addProducts(sports);
addProducts(home);

console.log(`✅ Loaded ${products.length} products`);

// Sample admin user
const salt = bcrypt.genSaltSync(10);
users.push({
    id: nextUserId++,
    username: "Admin",
    email: "admin@store.com",
    password: bcrypt.hashSync("admin123", salt),
    role: "admin"
});

// Add a demo user
users.push({
    id: nextUserId++,
    username: "Demo User",
    email: "user@test.com",
    password: bcrypt.hashSync("123456", salt),
    role: "user"
});

// ============ AUTH MIDDLEWARE ============
const authenticate = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) return res.status(401).json({ error: 'No token provided' });
    try {
        const decoded = jwt.verify(token, 'secretkey');
        req.userId = decoded.userId;
        req.userRole = decoded.role;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
};

const isAdmin = (req, res, next) => {
    if (req.userRole !== 'admin') return res.status(403).json({ error: 'Admin access required' });
    next();
};

// ============ AUTH ROUTES ============
app.post('/api/auth/register', (req, res) => {
    const { username, email, password } = req.body;
    if (users.find(u => u.email === email)) {
        return res.status(400).json({ error: 'Email already exists' });
    }
    const hashedPassword = bcrypt.hashSync(password, 10);
    const newUser = { id: nextUserId++, username, email, password: hashedPassword, role: 'user' };
    users.push(newUser);
    const token = jwt.sign({ userId: newUser.id, role: newUser.role }, 'secretkey', { expiresIn: '24h' });
    res.json({ token, user: { id: newUser.id, username: newUser.username, email: newUser.email, role: newUser.role } });
});

app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    const user = users.find(u => u.email === email);
    if (!user || !bcrypt.compareSync(password, user.password)) {
        return res.status(400).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ userId: user.id, role: user.role }, 'secretkey', { expiresIn: '24h' });
    res.json({ token, user: { id: user.id, username: user.username, email: user.email, role: user.role } });
});

// ============ PRODUCT ROUTES ============
app.get('/api/products', (req, res) => {
    res.json(products);
});

app.get('/api/products/:id', (req, res) => {
    const product = products.find(p => p.id === parseInt(req.params.id));
    if (product) res.json(product);
    else res.status(404).json({ error: 'Product not found' });
});

app.post('/api/products', authenticate, isAdmin, (req, res) => {
    const { name, price, description, category, stock, image } = req.body;
    const newProduct = {
        id: nextProductId++,
        name, price, description, category,
        stock: stock || 0,
        image: image || "📦",
        rating: 0,
        reviews: 0
    };
    products.push(newProduct);
    res.status(201).json(newProduct);
});

// ============ CART ROUTES ============
app.get('/api/cart', authenticate, (req, res) => {
    const cart = carts[req.userId] || [];
    res.json(cart);
});

app.post('/api/cart', authenticate, (req, res) => {
    const { productId, quantity } = req.body;
    const product = products.find(p => p.id === productId);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    
    if (!carts[req.userId]) carts[req.userId] = [];
    const existingItem = carts[req.userId].find(item => item.productId === productId);
    
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        carts[req.userId].push({ productId, quantity, product });
    }
    res.json(carts[req.userId]);
});

app.delete('/api/cart/:productId', authenticate, (req, res) => {
    const productId = parseInt(req.params.productId);
    carts[req.userId] = carts[req.userId].filter(item => item.productId !== productId);
    res.json(carts[req.userId]);
});

app.put('/api/cart/:productId', authenticate, (req, res) => {
    const productId = parseInt(req.params.productId);
    const { quantity } = req.body;
    const item = carts[req.userId]?.find(item => item.productId === productId);
    if (item) item.quantity = quantity;
    res.json(carts[req.userId] || []);
});

// ============ ORDER ROUTES ============
app.post('/api/orders', authenticate, (req, res) => {
    const cart = carts[req.userId] || [];
    if (cart.length === 0) return res.status(400).json({ error: 'Cart is empty' });
    
    const total = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    const newOrder = {
        id: nextOrderId++,
        userId: req.userId,
        items: [...cart],
        total,
        status: 'pending',
        createdAt: new Date().toISOString()
    };
    orders.push(newOrder);
    carts[req.userId] = [];
    res.json(newOrder);
});

app.get('/api/orders', authenticate, (req, res) => {
    const userOrders = orders.filter(o => o.userId === req.userId);
    res.json(userOrders);
});

// ============ ADMIN ORDERS ============
app.get('/api/admin/orders', authenticate, isAdmin, (req, res) => {
    res.json(orders);
});

app.put('/api/admin/orders/:id/status', authenticate, isAdmin, (req, res) => {
    const orderId = parseInt(req.params.id);
    const { status } = req.body;
    const order = orders.find(o => o.id === orderId);
    if (order) {
        order.status = status;
        res.json(order);
    } else {
        res.status(404).json({ error: 'Order not found' });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = 3003;
app.listen(PORT, () => {
    console.log(`\n========================================`);
    console.log(`🛒 E-COMMERCE STORE RUNNING!`);
    console.log(`📱 http://localhost:${PORT}`);
    console.log(`👑 Admin Login: admin@store.com / admin123`);
    console.log(`👤 Demo User: user@test.com / 123456`);
    console.log(`📦 Total Products: ${products.length}`);
    console.log(`========================================\n`);
});
