import { Router, Request, Response } from 'express';
import { dbInstance, Product, Order, User, Coupon, Review, CMSBanner, CMSBlog, Consultation } from './db.js';
import { GoogleGenAI } from '@google/genai';

export const apiRouter = Router();

// Admin Authentication Store & Protection
const adminTokens = new Set<string>();

apiRouter.post('/admin/verify-password', (req: Request, res: Response) => {
  const { password } = req.body;
  const correctPassword = process.env.ADMIN_PASSWORD || 'neelu_bora_vault';
  if (password === correctPassword) {
    const token = 'admin-tok-' + Math.random().toString(36).substr(2, 15);
    adminTokens.add(token);
    res.json({ success: true, token });
  } else {
    res.status(401).json({ error: 'Incorrect Password' });
  }
});

apiRouter.post('/admin/logout', (req: Request, res: Response) => {
  const token = req.headers['x-admin-token'];
  if (token && typeof token === 'string') {
    adminTokens.delete(token);
  }
  res.json({ success: true });
});

// Admin Protection Middleware
apiRouter.use((req: Request, res: Response, next) => {
  const path = req.path;
  const method = req.method;

  // Identify admin-specific endpoints
  const isLogs = path === '/admin/logs';
  const isProductsAdmin = path === '/admin/products';
  const isCouponsAdmin = path === '/coupons' && method !== 'GET';
  const isProductsMutate = path.startsWith('/products') && method !== 'GET';
  const isOrdersAdmin = (path === '/orders' || path === '/orders/all') && method === 'GET';
  const isOrdersMutate = ((path.endsWith('/status') || path.endsWith('/shiprocket') || path.endsWith('/refund')) && path.startsWith('/orders')) || (path.startsWith('/orders') && method === 'DELETE');
  const isShiprocketBook = path === '/shiprocket/book';
  const isCMSAdmin = path === '/cms' && method !== 'GET';

  if (isLogs || isProductsAdmin || isCouponsAdmin || isProductsMutate || isOrdersAdmin || isOrdersMutate || isShiprocketBook || isCMSAdmin) {
    const token = req.headers['x-admin-token'];
    if (!token || typeof token !== 'string' || !adminTokens.has(token)) {
      return res.status(401).json({ error: 'Unauthorized: Admin authentication required' });
    }
  }
  next();
});

// Helper to get Gemini Client if key exists
function getGeminiClient(): GoogleGenAI | null {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key === 'MY_GEMINI_API_KEY' || key.trim() === '') {
    return null;
  }
  try {
    return new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  } catch (err) {
    console.error('Failed to initialize Gemini Client', err);
    return null;
  }
}

// -------------------------------------------------------------------------
// AUTHENTICATION API
// -------------------------------------------------------------------------

// Helper to generate a random session token (simulation)
const sessionStore = new Map<string, User>();

apiRouter.post('/auth/register', (req: Request, res: Response) => {
  const { email, password, name, phone } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Email, password, and name are required' });
  }

  const db = dbInstance.getDB();
  const existing = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(400).json({ error: 'User already exists with this email' });
  }

  const newUser: User = {
    id: 'usr-' + Math.random().toString(36).substr(2, 9),
    email: email.toLowerCase(),
    passwordHash: '$2b$10$r8VpxbW92oPzP3T5W3W3WeMofB8eZ7fW3oOWeV5R2zF7fW6V.FzU6', // Mock hash for "admin123"
    name,
    phone: phone || '',
    role: 'Customer',
    addresses: [],
    createdAt: new Date().toISOString()
  };

  db.users.push(newUser);
  dbInstance.save();
  dbInstance.log(newUser.email, 'User registered successfully');

  // Auto-login
  const token = 'tok-' + Math.random().toString(36).substr(2, 15);
  sessionStore.set(token, newUser);

  res.status(201).json({ token, user: { id: newUser.id, email: newUser.email, name: newUser.name, role: newUser.role, phone: newUser.phone, addresses: newUser.addresses } });
});

apiRouter.post('/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const db = dbInstance.getDB();
  const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  // We simulate successful passwords. In real production we check bcrypt.
  // We allow 'admin123' as default password for seed users
  if (password !== 'admin123' && password !== 'password') {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = 'tok-' + Math.random().toString(36).substr(2, 15);
  sessionStore.set(token, user);
  dbInstance.log(user.email, 'User logged in');

  res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role, phone: user.phone, addresses: user.addresses || [] } });
});

// Send OTP
const otpStore = new Map<string, string>(); // mobile -> otp

apiRouter.post('/auth/otp-send', (req: Request, res: Response) => {
  const { phone } = req.body;
  if (!phone) {
    return res.status(400).json({ error: 'Mobile number is required' });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore.set(phone, otp);
  console.log(`[SMS Notification System] Sent OTP ${otp} to ${phone}`);

  res.json({ message: 'OTP sent successfully to ' + phone, success: true });
});

apiRouter.post('/auth/otp-verify', (req: Request, res: Response) => {
  const { phone, otp, name } = req.body;
  if (!phone || !otp) {
    return res.status(400).json({ error: 'Mobile and OTP are required' });
  }

  const storedOtp = otpStore.get(phone);
  if (storedOtp !== otp && otp !== '123456') { // Allow 123456 as bypass test OTP
    return res.status(400).json({ error: 'Invalid or expired OTP' });
  }

  const db = dbInstance.getDB();
  // Find user by phone, or create customer
  let user = db.users.find(u => u.phone === phone);
  let created = false;

  if (!user) {
    user = {
      id: 'usr-' + Math.random().toString(36).substr(2, 9),
      email: `${phone.replace(/\D/g, '')}@neeluvoracustomer.com`,
      name: name || 'Guest Client',
      phone,
      role: 'Customer',
      addresses: [],
      createdAt: new Date().toISOString()
    };
    db.users.push(user);
    dbInstance.save();
    created = true;
  }

  const token = 'tok-' + Math.random().toString(36).substr(2, 15);
  sessionStore.set(token, user);
  dbInstance.log(user.email, created ? 'User auto-registered via OTP' : 'User logged in via OTP');

  res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role, phone: user.phone, addresses: user.addresses || [] } });
});

apiRouter.post('/auth/me', (req: Request, res: Response) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  const user = sessionStore.get(token);
  if (!user) return res.status(401).json({ error: 'Unauthorized or expired session' });

  res.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role, phone: user.phone, addresses: user.addresses || [] } });
});

apiRouter.post('/auth/update-profile', (req: Request, res: Response) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  const loggedUser = sessionStore.get(token);
  if (!loggedUser) return res.status(401).json({ error: 'Unauthorized' });

  const { name, email, phone, addresses } = req.body;
  const db = dbInstance.getDB();
  const user = db.users.find(u => u.id === loggedUser.id);

  if (user) {
    if (name) user.name = name;
    if (email) user.email = email.toLowerCase();
    if (phone) user.phone = phone;
    if (addresses) user.addresses = addresses;
    
    dbInstance.save();
    sessionStore.set(token, user); // Update session cache
    res.json({ success: true, user: { id: user.id, email: user.email, name: user.name, role: user.role, phone: user.phone, addresses: user.addresses || [] } });
  } else {
    res.status(404).json({ error: 'User not found' });
  }
});


// -------------------------------------------------------------------------
// PRODUCTS API
// -------------------------------------------------------------------------

apiRouter.get('/products', (req: Request, res: Response) => {
  const db = dbInstance.getDB();
  let list = db.products.filter(p => !p.draft);

  // Search filter
  const q = req.query.q as string;
  if (q) {
    const query = q.toLowerCase();
    list = list.filter(p => p.name.toLowerCase().includes(query) || p.description.toLowerCase().includes(query) || p.category.toLowerCase().includes(query));
  }

  // Category filter
  const cat = req.query.category as string;
  if (cat) {
    list = list.filter(p => p.category.toLowerCase() === cat.toLowerCase());
  }

  // Metal Type filter
  const metal = req.query.metal as string;
  if (metal) {
    list = list.filter(p => p.metalType?.toLowerCase() === metal.toLowerCase());
  }

  // Purity filter
  const purity = req.query.purity as string;
  if (purity) {
    list = list.filter(p => p.purity?.toLowerCase() === purity.toLowerCase());
  }

  // Fabric filter
  const fabric = req.query.fabric as string;
  if (fabric) {
    list = list.filter(p => p.fabric?.toLowerCase() === fabric.toLowerCase());
  }

  // Color filter
  const color = req.query.color as string;
  if (color) {
    list = list.filter(p => p.color?.toLowerCase() === color.toLowerCase());
  }

  // Sort dropdown
  const sort = req.query.sort as string;
  if (sort === 'low-high') {
    list.sort((a, b) => (a.discountedPrice || a.price) - (b.discountedPrice || b.price));
  } else if (sort === 'high-low') {
    list.sort((a, b) => (b.discountedPrice || b.price) - (a.discountedPrice || a.price));
  } else if (sort === 'newest') {
    list.reverse(); // Simplified newest
  }

  res.json(list);
});

// Admin-specific product listing (including drafts)
apiRouter.get('/admin/products', (req: Request, res: Response) => {
  const db = dbInstance.getDB();
  res.json(db.products);
});

// Admin-specific ledger logs listing
apiRouter.get('/admin/logs', (req: Request, res: Response) => {
  const db = dbInstance.getDB();
  const formattedLogs = (db.logs || []).map(log => {
    try {
      const timeStr = log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : 'Unknown';
      return `${timeStr} - ${log.userEmail}: ${log.action}`;
    } catch {
      return `Unknown Time - ${log.userEmail}: ${log.action}`;
    }
  });
  res.json(formattedLogs);
});

apiRouter.get('/products/:id', (req: Request, res: Response) => {
  const db = dbInstance.getDB();
  const product = db.products.find(p => p.id === req.params.id);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }
  res.json(product);
});

// Create product
apiRouter.post('/products', (req: Request, res: Response) => {
  const db = dbInstance.getDB();
  const newProduct: Product = {
    id: 'prod-' + Math.random().toString(36).substr(2, 9),
    name: req.body.name,
    category: req.body.category,
    description: req.body.description,
    price: Number(req.body.price),
    discountedPrice: req.body.discountedPrice ? Number(req.body.discountedPrice) : undefined,
    stockQuantity: Number(req.body.stockQuantity || 0),
    images: req.body.images || ['https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=80'],
    videos: req.body.videos || [],
    instagramReels: req.body.instagramReels || [],
    youtubeVideos: req.body.youtubeVideos || [],
    instagramReelUrl: req.body.instagramReelUrl,
    metalType: req.body.metalType,
    purity: req.body.purity,
    fabric: req.body.fabric,
    color: req.body.color,
    occasion: req.body.occasion,
    seoTitle: req.body.seoTitle || req.body.name,
    seoDescription: req.body.seoDescription || req.body.description?.substring(0, 150),
    featured: req.body.featured || false,
    draft: req.body.draft || false,
    variants: req.body.variants || [],
    createdAt: new Date().toISOString()
  };

  db.products.push(newProduct);
  dbInstance.save();
  dbInstance.log('admin@neeluvora.com', `Created product: ${newProduct.name}`);

  res.status(201).json(newProduct);
});

// Edit product
apiRouter.put('/products/:id', (req: Request, res: Response) => {
  const db = dbInstance.getDB();
  const index = db.products.findIndex(p => p.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Product not found' });
  }

  db.products[index] = {
    ...db.products[index],
    name: req.body.name,
    category: req.body.category,
    description: req.body.description,
    price: Number(req.body.price),
    discountedPrice: req.body.discountedPrice ? Number(req.body.discountedPrice) : undefined,
    stockQuantity: Number(req.body.stockQuantity),
    images: req.body.images || [],
    videos: req.body.videos || [],
    instagramReels: req.body.instagramReels || [],
    youtubeVideos: req.body.youtubeVideos || [],
    instagramReelUrl: req.body.instagramReelUrl,
    metalType: req.body.metalType,
    purity: req.body.purity,
    fabric: req.body.fabric,
    color: req.body.color,
    occasion: req.body.occasion,
    seoTitle: req.body.seoTitle,
    seoDescription: req.body.seoDescription,
    featured: req.body.featured,
    draft: req.body.draft,
    variants: req.body.variants || []
  };

  dbInstance.save();
  dbInstance.log('admin@neeluvora.com', `Updated product: ${db.products[index].name}`);
  res.json(db.products[index]);
});

// Delete product
apiRouter.delete('/products/:id', (req: Request, res: Response) => {
  const db = dbInstance.getDB();
  const index = db.products.findIndex(p => p.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Product not found' });
  }

  const name = db.products[index].name;
  db.products.splice(index, 1);
  dbInstance.save();
  dbInstance.log('admin@neeluvora.com', `Deleted product: ${name}`);
  res.json({ success: true, message: `Product ${name} deleted` });
});

// Bulk delete products
apiRouter.post('/products/bulk-delete', (req: Request, res: Response) => {
  const { ids } = req.body;
  if (!ids || !Array.isArray(ids)) {
    return res.status(400).json({ error: 'No product IDs provided' });
  }

  const db = dbInstance.getDB();
  const initialCount = db.products.length;
  db.products = db.products.filter(p => !ids.includes(p.id));
  const deletedCount = initialCount - db.products.length;

  dbInstance.save();
  dbInstance.log('admin@neeluvora.com', `Bulk deleted ${deletedCount} products`);
  res.json({ success: true, count: deletedCount });
});

// Bulk upload CSV
apiRouter.post(['/products/bulk', '/products/bulk-csv'], (req: Request, res: Response) => {
  const { csvText } = req.body;
  if (!csvText) {
    return res.status(400).json({ error: 'No CSV data provided' });
  }

  const lines = csvText.split('\n');
  if (lines.length <= 1) {
    return res.status(400).json({ error: 'CSV is empty or lacks headers' });
  }

  const db = dbInstance.getDB();
  const headers = lines[0].split(',').map((h: string) => h.trim().replace(/^"|"$/g, ''));
  let addedCount = 0;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Simple robust comma-separated-value parser with quote handling
    const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(',');
    const values = matches.map((v: string) => v.trim().replace(/^"|"$/g, ''));

    // Construct product mapping headers to keys
    const row: any = {};
    headers.forEach((header: string, idx: number) => {
      row[header] = values[idx] || '';
    });

    if (!row.name || !row.price) continue;

    const newProd: Product = {
      id: 'prod-' + Math.random().toString(36).substr(2, 9),
      name: row.name,
      category: row.category || 'Necklaces',
      description: row.description || `${row.name} luxury handcrafted item.`,
      price: Number(row.price),
      discountedPrice: row.discountedPrice ? Number(row.discountedPrice) : undefined,
      stockQuantity: Number(row.stockQuantity || 10),
      images: row.images ? row.images.split(';') : ['https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=80'],
      videos: [],
      metalType: row.metalType || undefined,
      purity: row.purity || undefined,
      fabric: row.fabric || undefined,
      color: row.color || undefined,
      occasion: row.occasion || undefined,
      featured: row.featured === 'true' || row.featured === '1',
      draft: false,
      createdAt: new Date().toISOString()
    };

    db.products.push(newProd);
    addedCount++;
  }

  dbInstance.save();
  dbInstance.log('admin@neeluvora.com', `Bulk uploaded ${addedCount} products via CSV`);
  res.json({ success: true, count: addedCount });
});


// -------------------------------------------------------------------------
// ORDERS API
// -------------------------------------------------------------------------

apiRouter.get('/orders', (req: Request, res: Response) => {
  const db = dbInstance.getDB();
  const status = req.query.status as string;
  const email = req.query.email as string;
  
  let result = db.orders;
  if (email) {
    result = result.filter(o => o.customerEmail.toLowerCase() === email.toLowerCase());
  }
  if (status) {
    result = result.filter(o => o.orderStatus.toLowerCase() === status.toLowerCase());
  }
  res.json(result);
});

apiRouter.get('/orders/all', (req: Request, res: Response) => {
  const db = dbInstance.getDB();
  res.json(db.orders);
});

apiRouter.get('/orders/my', (req: Request, res: Response) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  const user = sessionStore.get(token);
  if (!user) return res.status(401).json({ error: 'Unauthorized session' });

  const db = dbInstance.getDB();
  // Filter by registered email or mobile
  const userOrders = db.orders.filter(o => 
    o.customerEmail.toLowerCase() === user.email.toLowerCase() || 
    (user.phone && o.customerMobile === user.phone)
  );
  res.json(userOrders);
});

apiRouter.get('/orders/:id', (req: Request, res: Response) => {
  const db = dbInstance.getDB();
  const order = db.orders.find(o => o.id === req.params.id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }
  res.json(order);
});

// Create order
apiRouter.post('/orders', (req: Request, res: Response) => {
  const { 
    customerName, customerEmail, customerMobile, 
    shippingAddress, pincode, city, state, 
    items, couponCode, paymentMethod 
  } = req.body;

  if (!customerName || !customerMobile || !shippingAddress || !pincode || !items || items.length === 0) {
    return res.status(400).json({ error: 'Required checkout parameters are missing' });
  }

  const db = dbInstance.getDB();

  // Validate stock & compute totals
  let subtotal = 0;
  const processedItems = items.map((item: any) => {
    const prod = db.products.find(p => p.id === item.productId);
    if (!prod) throw new Error(`Product ${item.productName} not found`);
    
    let price = prod.discountedPrice || prod.price;
    if (item.variant && prod.variants) {
      const variantObj = prod.variants.find(v => v.name === item.variant);
      if (variantObj && variantObj.priceAdjust) {
        price += variantObj.priceAdjust;
      }
    }
    
    subtotal += price * item.quantity;

    // Deduct stock quantity
    prod.stockQuantity = Math.max(0, prod.stockQuantity - item.quantity);

    return {
      productId: item.productId,
      productName: prod.name,
      productImage: prod.images[0],
      price: price,
      quantity: item.quantity,
      variant: item.variant
    };
  });

  // Coupon discount calculation
  let discount = 0;
  if (couponCode) {
    const coupon = db.coupons.find(c => c.code.toUpperCase() === couponCode.toUpperCase() && c.active);
    if (coupon) {
      const now = new Date();
      const expiry = new Date(coupon.expiryDate);
      if (expiry >= now && subtotal >= coupon.minCartValue && coupon.usageCount < coupon.usageLimit) {
        if (coupon.discountType === 'percentage') {
          discount = Math.round((subtotal * coupon.discountValue) / 100);
          if (coupon.maxDiscountCap && discount > coupon.maxDiscountCap) {
            discount = coupon.maxDiscountCap;
          }
        } else {
          discount = coupon.discountValue;
        }
        coupon.usageCount += 1;
      }
    }
  }

  // GST Calculation (Indian Tax: 3% on Fine Jewelry, 5% on Apparel)
  // Jewel cats: Necklaces, Bangles, Rings. Apparel: Silk Sarees, Cotton Sarees
  let totalTax = 0;
  items.forEach((item: any) => {
    const prod = db.products.find(p => p.id === item.productId);
    if (prod) {
      const isJewelry = ['Necklaces', 'Bangles', 'Rings'].includes(prod.category);
      const taxRate = isJewelry ? 0.03 : 0.05;
      let itemPrice = prod.discountedPrice || prod.price;
      if (item.variant && prod.variants) {
        const variantObj = prod.variants.find(v => v.name === item.variant);
        if (variantObj && variantObj.priceAdjust) {
          itemPrice += variantObj.priceAdjust;
        }
      }
      const itemSubtotal = itemPrice * item.quantity;
      // Pro-rata discount subtraction for GST calculation
      const itemProRataDiscount = subtotal > 0 ? (itemSubtotal / subtotal) * discount : 0;
      const taxableAmount = Math.max(0, itemSubtotal - itemProRataDiscount);
      totalTax += Math.round(taxableAmount * taxRate);
    }
  });

  // Shipping charge rule: Free above ₹15,000, flat ₹500 otherwise
  const shippingCharge = (subtotal - discount) >= 15000 || subtotal === 0 ? 0 : 500;
  const total = subtotal - discount + totalTax + shippingCharge;

  const orderId = 'ord-' + Math.floor(1000 + Math.random() * 9000).toString();

  const newOrder: Order = {
    id: orderId,
    customerName,
    customerEmail: customerEmail || 'guest@neeluvora.com',
    customerMobile,
    shippingAddress,
    pincode,
    city,
    state,
    items: processedItems,
    subtotal,
    taxGst: totalTax,
    shippingCharge,
    discount,
    total,
    paymentMethod: paymentMethod || 'Razorpay',
    paymentStatus: paymentMethod === 'COD' ? 'Pending' : 'Paid', // Assuming Razorpay succeeds instantly in simulation
    orderStatus: 'New',
    createdAt: new Date().toISOString(),
    razorpayOrderId: paymentMethod !== 'COD' ? 'order_' + Math.random().toString(36).substr(2, 12) : undefined,
    razorpayPaymentId: paymentMethod !== 'COD' ? 'pay_' + Math.random().toString(36).substr(2, 12) : undefined
  };

  db.orders.unshift(newOrder);
  dbInstance.save();

  // Notifications
  console.log(`[Email Notification] Order Placed: Dear ${customerName}, your order ${newOrder.id} of ₹${total} has been confirmed!`);
  console.log(`[SMS Notification] Order Placed: Hi ${customerName}, order ${newOrder.id} successfully placed on Neelu Vora Fashion. Total ₹${total}.`);

  dbInstance.log(newOrder.customerEmail, `Placed Order: ${newOrder.id}`);

  res.status(201).json(newOrder);
});

// Update order status
apiRouter.put('/orders/:id/status', (req: Request, res: Response) => {
  const { status, courierName, trackingId } = req.body;
  const db = dbInstance.getDB();
  const order = db.orders.find(o => o.id === req.params.id);

  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  order.orderStatus = status;
  if (courierName) order.courierName = courierName;
  if (trackingId) {
    order.trackingId = trackingId;
    order.trackingStatus = 'Awaiting pickup';
  }

  dbInstance.save();

  // Status Change notification
  console.log(`[Email Alert] Order ${order.id} status updated to: ${status}`);
  console.log(`[SMS Alert] Dear ${order.customerName}, your Neelu Vora Fashion order ${order.id} is now: ${status}. Tracking ID: ${order.trackingId || 'N/A'}`);

  dbInstance.log('admin@neeluvora.com', `Updated order ${order.id} status to ${status}`);
  res.json(order);
});

// Delete order
apiRouter.delete('/orders/:id', (req: Request, res: Response) => {
  const db = dbInstance.getDB();
  const orderIndex = db.orders.findIndex(o => o.id === req.params.id);
  if (orderIndex === -1) {
    return res.status(404).json({ error: 'Order not found' });
  }
  const deletedOrder = db.orders[orderIndex];
  db.orders.splice(orderIndex, 1);
  dbInstance.save();
  dbInstance.log('admin@neeluvora.com', `Deleted order: #${deletedOrder.id} for amount ₹${deletedOrder.total}`);
  res.json({ success: true, message: `Order #${deletedOrder.id} deleted` });
});

// Shiprocket dispatch simulation (Section 12.2)
apiRouter.post('/orders/:id/shiprocket', (req: Request, res: Response) => {
  const db = dbInstance.getDB();
  const order = db.orders.find(o => o.id === req.params.id);

  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  const trackingId = 'SR_' + Math.floor(1000000000 + Math.random() * 9000000000).toString();
  order.courierName = req.body.courier || 'Shiprocket (Delhivery)';
  order.trackingId = trackingId;
  order.trackingStatus = 'Awaiting courier pickup';
  order.orderStatus = 'Shipped';

  dbInstance.save();
  dbInstance.log('admin@neeluvora.com', `Dispatched order ${order.id} via Shiprocket`);

  // Shiprocket webhook simulation: background state update after 15 seconds to "Out for Delivery"
  const orderId = order.id;
  setTimeout(() => {
    const o = dbInstance.getDB().orders.find(ord => ord.id === orderId);
    if (o && o.orderStatus === 'Shipped') {
      o.trackingStatus = 'Out for delivery in ' + o.city;
      dbInstance.save();
    }
  }, 15000);

  res.json(order);
});

// Process Razorpay refund simulation
apiRouter.post('/orders/:id/refund', (req: Request, res: Response) => {
  const { reason, refundReason } = req.body;
  const db = dbInstance.getDB();
  const order = db.orders.find(o => o.id === req.params.id);

  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  order.paymentStatus = 'Refunded';
  order.orderStatus = 'Refunded';
  order.refundReason = reason || refundReason || 'Customer requested cancel';
  
  // Refund notification
  console.log(`[Razorpay Refund Refund API] Successfully refunded transaction ${order.razorpayPaymentId} for amount ₹${order.total}`);
  console.log(`[Email Alert] Refund processed: Dear ${order.customerName}, a refund of ₹${order.total} has been initiated to your original payment method.`);

  dbInstance.save();
  dbInstance.log('admin@neeluvora.com', `Processed Razorpay refund for Order ${order.id}`);
  res.json({ success: true, order });
});

// GST-compliant printable invoice route
apiRouter.get('/orders/:id/invoice', (req: Request, res: Response) => {
  const db = dbInstance.getDB();
  const order = db.orders.find(o => o.id === req.params.id);

  if (!order) {
    return res.status(404).send('<h1>Order not found</h1>');
  }

  const itemsHtml = order.items.map((item, index) => `
    <tr style="border-bottom: 1px solid #e0e0e0;">
      <td style="padding: 12px 6px;">${index + 1}</td>
      <td style="padding: 12px 6px;">
        <div style="font-weight: 500;">${item.productName}</div>
        <div style="font-size: 11px; color: #666;">Variant: ${item.variant || 'Standard'}</div>
      </td>
      <td style="padding: 12px 6px; text-align: right;">₹${item.price.toLocaleString()}</td>
      <td style="padding: 12px 6px; text-align: center;">${item.quantity}</td>
      <td style="padding: 12px 6px; text-align: right;">₹${(item.price * item.quantity).toLocaleString()}</td>
    </tr>
  `).join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Invoice - ${order.id}</title>
      <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; margin: 0; padding: 40px; color: #333; }
        .invoice-box { max-width: 800px; margin: auto; border: 1px solid #eee; box-shadow: 0 0 10px rgba(0, 0, 0, 0.05); padding: 30px; font-size: 14px; line-height: 24px; }
        .invoice-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; border-bottom: 2px solid #dfb766; padding-bottom: 20px; }
        .brand-logo { font-size: 24px; font-weight: bold; letter-spacing: 1px; color: #000; text-transform: uppercase; font-family: Georgia, serif; }
        .invoice-details { text-align: right; font-size: 13px; }
        .section-title { font-size: 14px; text-transform: uppercase; font-weight: bold; letter-spacing: 0.5px; margin-bottom: 10px; color: #a7661b; border-bottom: 1px solid #eee; padding-bottom: 4px; }
        .billing-shipping { display: flex; justify-content: space-between; margin-bottom: 40px; gap: 20px; }
        .billing-shipping > div { flex: 1; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
        th { background: #fbf7ec; font-size: 12px; font-weight: bold; text-transform: uppercase; padding: 10px 6px; text-align: left; color: #503117; }
        .totals { float: right; width: 300px; font-size: 13px; }
        .totals-row { display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px dashed #eee; }
        .totals-row.grand-total { border-top: 1px solid #dfb766; font-size: 16px; font-weight: bold; padding-top: 8px; margin-top: 8px; border-bottom: none; color: #000; }
        .footer { text-align: center; color: #888; font-size: 12px; margin-top: 100px; border-top: 1px solid #eee; padding-top: 20px; }
        @media print {
          body { padding: 0; }
          .invoice-box { border: none; box-shadow: none; padding: 0; }
          .print-btn { display: none; }
        }
      </style>
    </head>
    <body>
      <div style="text-align: center; margin-bottom: 20px;">
        <button class="print-btn" onclick="window.print()" style="background: #a7661b; color: #fff; border: none; padding: 8px 16px; font-size: 14px; border-radius: 4px; cursor: pointer; font-weight: bold;">Print Invoice</button>
      </div>
      <div class="invoice-box">
        <div class="invoice-header">
          <div>
            <div class="brand-logo">Neelu Vora Fashion</div>
            <div style="font-size: 12px; color: #666; margin-top: 4px;">Luxury Jewelry & Apparel Atelier</div>
            <div style="font-size: 11px; color: #888;">GSTIN: 27AABCN8221M1ZC</div>
          </div>
          <div class="invoice-details">
            <div style="font-weight: bold; font-size: 16px; color: #a7661b;">TAX INVOICE</div>
            <div><strong>Invoice No:</strong> NV-${order.id}</div>
            <div><strong>Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</div>
            <div><strong>Payment Mode:</strong> ${order.paymentMethod}</div>
            <div><strong>Status:</strong> ${order.paymentStatus}</div>
          </div>
        </div>

        <div class="billing-shipping">
          <div>
            <div class="section-title">Seller Atelier Info</div>
            <div><strong>Neelu Vora Fashion Private Limited</strong></div>
            <div>Neelu Vora Mansion, Colaba</div>
            <div>Mumbai, Maharashtra - 400005</div>
            <div>Phone: +91 22 4599 0000</div>
            <div>Email: concierge@neeluvora.com</div>
          </div>
          <div>
            <div class="section-title">Shipping & Billing Address</div>
            <div><strong>${order.customerName}</strong></div>
            <div>${order.shippingAddress}</div>
            <div>Pincode: ${order.pincode}</div>
            <div>City: ${order.city}, State: ${order.state}</div>
            <div>Phone: ${order.customerMobile}</div>
            <div>Email: ${order.customerEmail}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 5%;">SNo</th>
              <th style="width: 55%;">Product Details</th>
              <th style="width: 15%; text-align: right;">Unit Price</th>
              <th style="width: 10%; text-align: center;">Qty</th>
              <th style="width: 15%; text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div class="totals">
          <div class="totals-row">
            <span>Subtotal</span>
            <span>₹${order.subtotal.toLocaleString()}</span>
          </div>
          ${order.discount > 0 ? `
          <div class="totals-row" style="color: green;">
            <span>Coupon Discount</span>
            <span>- ₹${order.discount.toLocaleString()}</span>
          </div>
          ` : ''}
          <div class="totals-row">
            <span>GST Tax (Inclusive)</span>
            <span>₹${order.taxGst.toLocaleString()}</span>
          </div>
          <div class="totals-row">
            <span>Shipping Charge</span>
            <span>₹${order.shippingCharge.toLocaleString()}</span>
          </div>
          <div class="totals-row grand-total">
            <span>Grand Total</span>
            <span>₹${order.total.toLocaleString()}</span>
          </div>
        </div>
        <div style="clear: both;"></div>

        <div class="footer">
          <p>This is a computer-generated GST-compliant invoice. No signature is required.</p>
          <p>Thank you for shopping at <strong>Neelu Vora Fashion</strong>. For any support, write to concierge@neeluvora.com.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  res.send(html);
});


// -------------------------------------------------------------------------
// COUPON & MARKETING API
// -------------------------------------------------------------------------

apiRouter.get('/coupons', (req: Request, res: Response) => {
  const db = dbInstance.getDB();
  res.json(db.coupons);
});

apiRouter.post('/coupons', (req: Request, res: Response) => {
  const db = dbInstance.getDB();
  const newCoupon: Coupon = {
    id: 'coup-' + Math.random().toString(36).substr(2, 9),
    code: req.body.code.toUpperCase(),
    discountType: req.body.discountType,
    discountValue: Number(req.body.discountValue),
    minCartValue: Number(req.body.minCartValue || 0),
    maxDiscountCap: req.body.maxDiscountCap ? Number(req.body.maxDiscountCap) : undefined,
    expiryDate: req.body.expiryDate || '2027-01-01',
    usageLimit: Number(req.body.usageLimit || 100),
    usageCount: 0,
    active: true
  };

  db.coupons.push(newCoupon);
  dbInstance.save();
  dbInstance.log('admin@neeluvora.com', `Created coupon: ${newCoupon.code}`);
  res.status(201).json(newCoupon);
});

apiRouter.delete('/coupons/:id', (req: Request, res: Response) => {
  const db = dbInstance.getDB();
  const index = db.coupons.findIndex(c => c.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Coupon not found' });
  }

  const code = db.coupons[index].code;
  db.coupons.splice(index, 1);
  dbInstance.save();
  dbInstance.log('admin@neeluvora.com', `Deleted coupon: ${code}`);
  res.json({ success: true, message: `Coupon ${code} deleted` });
});

apiRouter.get('/coupons/validate/:code', (req: Request, res: Response) => {
  const code = req.params.code.toUpperCase();
  const cartValue = Number(req.query.cartValue || 0);
  const db = dbInstance.getDB();
  const coupon = db.coupons.find(c => c.code.toUpperCase() === code && c.active);

  if (!coupon) {
    return res.status(400).json({ valid: false, error: 'Invalid or inactive coupon code' });
  }

  const now = new Date();
  const expiry = new Date(coupon.expiryDate);
  if (expiry < now) {
    return res.status(400).json({ valid: false, error: 'Coupon has expired' });
  }

  if (cartValue < coupon.minCartValue) {
    return res.status(400).json({ valid: false, error: `Minimum purchase value must be ₹${coupon.minCartValue}` });
  }

  if (coupon.usageCount >= coupon.usageLimit) {
    return res.status(400).json({ valid: false, error: 'Coupon usage limit exceeded' });
  }

  res.json({
    valid: true,
    code: coupon.code,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
    maxDiscountCap: coupon.maxDiscountCap
  });
});


// -------------------------------------------------------------------------
// REVIEWS API
// -------------------------------------------------------------------------

apiRouter.get('/products/:productId/reviews', (req: Request, res: Response) => {
  const db = dbInstance.getDB();
  const list = db.reviews.filter(r => r.productId === req.params.productId && r.approved);
  res.json(list);
});

// Write review (auto approved in preview for fast demoing)
apiRouter.post('/reviews', (req: Request, res: Response) => {
  const { productId, customerName, rating, text, image, video } = req.body;
  if (!productId || !customerName || !rating || !text) {
    return res.status(400).json({ error: 'productId, customerName, rating, and text are required' });
  }

  const db = dbInstance.getDB();
  const newReview: Review = {
    id: 'rev-' + Math.random().toString(36).substr(2, 9),
    productId,
    customerName,
    rating: Number(rating),
    text,
    image,
    video,
    approved: true, // Auto approve in demo sandbox for instantaneous feedback!
    createdAt: new Date().toISOString()
  };

  db.reviews.unshift(newReview);
  dbInstance.save();
  res.status(201).json(newReview);
});


// -------------------------------------------------------------------------
// CMS CONTENT MANAGEMENT API
// -------------------------------------------------------------------------

apiRouter.get('/cms', (req: Request, res: Response) => {
  const db = dbInstance.getDB();
  res.json(db.cms);
});

apiRouter.put('/cms/banners', (req: Request, res: Response) => {
  const db = dbInstance.getDB();
  const { banners } = req.body;
  if (banners) {
    db.cms.banners = banners;
    dbInstance.save();
    dbInstance.log('admin@neeluvora.com', 'Updated homepage banner carousel assets');
    return res.json(db.cms.banners);
  }
  res.status(400).json({ error: 'No banner data provided' });
});

apiRouter.delete('/cms/banners/:id', (req: Request, res: Response) => {
  const db = dbInstance.getDB();
  const id = req.params.id;
  
  const initialLength = db.cms.banners.length;
  db.cms.banners = db.cms.banners.filter((b, idx) => (b.id || idx.toString()) !== id);
  
  if (db.cms.banners.length < initialLength) {
    dbInstance.save();
    dbInstance.log('admin@neeluvora.com', `Deleted CMS banner ${id}`);
    return res.json(db.cms.banners);
  }
  return res.status(404).json({ error: 'Banner not found' });
});

apiRouter.put('/cms/legal', (req: Request, res: Response) => {
  const db = dbInstance.getDB();
  const { key, markdown } = req.body;
  if (key && markdown !== undefined) {
    db.cms.legalPages[key] = markdown;
    dbInstance.save();
    dbInstance.log('admin@neeluvora.com', `Updated legal page content: ${key}`);
    return res.json({ success: true });
  }
  res.status(400).json({ error: 'Required CMS parameters key and markdown are missing' });
});

apiRouter.get('/cms/blogs', (req: Request, res: Response) => {
  const db = dbInstance.getDB();
  res.json(db.cms.blogs);
});

apiRouter.post('/cms/blogs', (req: Request, res: Response) => {
  const db = dbInstance.getDB();
  const newBlog: CMSBlog = {
    id: 'blog-' + Math.random().toString(36).substr(2, 9),
    title: req.body.title,
    excerpt: req.body.excerpt || req.body.content?.substring(0, 100),
    content: req.body.content,
    image: req.body.image || 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=80',
    date: new Date().toISOString().split('T')[0],
    author: req.body.author || 'Neelu Vora'
  };
  db.cms.blogs.unshift(newBlog);
  dbInstance.save();
  dbInstance.log('admin@neeluvora.com', `Created new blog post: ${newBlog.title}`);
  res.status(201).json(newBlog);
});


// -------------------------------------------------------------------------
// VIDEO CONSULTATIONS BOOKINGS API
// -------------------------------------------------------------------------

apiRouter.get('/consultations', (req: Request, res: Response) => {
  const db = dbInstance.getDB();
  res.json(db.consultations);
});

apiRouter.post('/consultations', (req: Request, res: Response) => {
  const { customerName, customerPhone, preferredTime, notes, productId } = req.body;
  if (!customerName || !customerPhone || !preferredTime) {
    return res.status(400).json({ error: 'Name, phone, and preferred time are required' });
  }

  const db = dbInstance.getDB();
  let productName = undefined;
  if (productId) {
    const p = db.products.find(prod => prod.id === productId);
    if (p) productName = p.name;
  }

  const newConsultation: Consultation = {
    id: 'cons-' + Math.random().toString(36).substr(2, 9),
    customerName,
    customerPhone,
    preferredTime,
    notes,
    productId,
    productName,
    status: 'Pending',
    createdAt: new Date().toISOString()
  };

  db.consultations.unshift(newConsultation);
  dbInstance.save();

  console.log(`[SMS Notification] Consultation Booking Alert: Client ${customerName} has booked a video session for ${preferredTime}.`);
  res.status(201).json(newConsultation);
});

apiRouter.put('/consultations/:id/status', (req: Request, res: Response) => {
  const { status } = req.body;
  const db = dbInstance.getDB();
  const booking = db.consultations.find(c => c.id === req.params.id);

  if (!booking) {
    return res.status(404).json({ error: 'Booking not found' });
  }

  booking.status = status;
  dbInstance.save();
  dbInstance.log('admin@neeluvora.com', `Updated consultation ${booking.id} to ${status}`);
  res.json(booking);
});


// -------------------------------------------------------------------------
// SHIPROCKET FULFILLMENT SIMULATION API
// -------------------------------------------------------------------------

apiRouter.post('/shiprocket/book', (req: Request, res: Response) => {
  const { orderId, courier } = req.body;
  const db = dbInstance.getDB();
  const order = db.orders.find(o => o.id === orderId);

  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  const trackingId = 'SR_' + Math.floor(1000000000 + Math.random() * 9000000000).toString();
  order.courierName = courier || 'Shiprocket (Delhivery)';
  order.trackingId = trackingId;
  order.trackingStatus = 'Awaiting courier pickup';
  order.orderStatus = 'Shipped';

  dbInstance.save();

  // Shiprocket webhook simulation: background state update after 15 seconds to "Out for Delivery"
  setTimeout(() => {
    const o = dbInstance.getDB().orders.find(ord => ord.id === orderId);
    if (o && o.orderStatus === 'Shipped') {
      o.trackingStatus = 'Out for delivery in ' + o.city;
      dbInstance.save();
    }
  }, 15000);

  res.json({
    success: true,
    trackingId,
    courier: order.courierName,
    estimatedDelivery: '3 days'
  });
});


// -------------------------------------------------------------------------
// GOOGLE GEMINI AI FEATURES API
// -------------------------------------------------------------------------

// Auto product description generator
apiRouter.post('/ai/description', async (req: Request, res: Response) => {
  const { tags } = req.body;
  if (!tags) {
    return res.status(400).json({ error: 'Tags parameter is required' });
  }

  const ai = getGeminiClient();
  if (!ai) {
    // Elegant luxury handcrafted simulated response when API key is missing
    const list = tags.split(',').map((t: string) => t.trim().toLowerCase());
    const desc = `Indulge in our exquisite ${list[0] || 'luxury piece'}, hand-forged in classic luxury styling. Embellished with premium details like ${list[1] || 'pure kundan'} and crafted with absolute design precision. Perfect for ${list[2] || 'glorious festive occasions'}, this piece by Neelu Vora Fashion tells an enduring tale of ancient Indian craft heritage. It is customized to drape or fit beautifully for immediate premium showcase.`;
    return res.json({ description: desc });
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: `Generate a luxury, elegant, SEO-friendly, premium product description for a couture Indian boutique called "Neelu Vora Fashion". Here are the tags for the item: ${tags}. It should highlight artisan heritage, handcrafting, fine materials, and be highly enticing to high-end jewelry and apparel shoppers in India. Return ONLY the description text, do not write markdown brackets or anything else. Keep it under 120 words.`,
    });
    res.json({ description: response.text?.trim() });
  } catch (err) {
    console.error('Gemini call failed', err);
    res.status(500).json({ error: 'Failed to generate product description' });
  }
});

// Interactive store assistant chatbot
apiRouter.post('/ai/chat', async (req: Request, res: Response) => {
  const { message, history } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Message parameter is required' });
  }

  const ai = getGeminiClient();
  if (!ai) {
    // Beautiful concierge rule-based response when Gemini API key is missing
    const msg = message.toLowerCase();
    let reply = `Welcome to Neelu Vora Fashion Concierge. Our physical atelier is situated at Colaba, Mumbai. How may I assist you with fine jewels and handwoven sarees today?`;
    
    if (msg.includes('shipping') || msg.includes('delivery')) {
      reply = `We provide insured secure shipping across India. Delivery is free for purchases exceeding ₹15,000. Under ₹15,000, a standard charge of ₹150 is appended. Jewelry is transported via armored couriers (Sequre/BVC) within 3-5 metros days.`;
    } else if (msg.includes('return') || msg.includes('refund') || msg.includes('exchange')) {
      reply = `Our return window is category-specific. Fine jewelry can be returned or exchanged within 3 days (subject to weight and purity verification). Sarees can be returned within 7 days in pristine, unused foldings. Custom commissions are final sales.`;
    } else if (msg.includes('jewelry') || msg.includes('gold') || msg.includes('necklace') || msg.includes('bangle') || msg.includes('ring')) {
      reply = `We deal in certified 22K and 18K gold. Features include the hand-fabricated Aishwarya Kundan Choker (₹1,25,000) and the Padma Ruby Solitaire Ring (₹38,000). You can book a live video consultation on our product panels!`;
    } else if (msg.includes('saree') || msg.includes('silk') || msg.includes('apparel')) {
      reply = `We offer pure Varanasi Katan silk brocades (₹32,500) and lightweight cotton-silk Chanderi sarees (₹12,500). All pieces are handloomed directly by generational artisans.`;
    } else if (msg.includes('contact') || msg.includes('phone') || msg.includes('email')) {
      reply = `You can call our Mumbai concierge suite at +91 22 4599 0000 (Mon-Sat, 10 AM to 7 PM IST) or write directly to concierge@neeluvora.com. A floating WhatsApp Order line is also active!`;
    }
    
    return res.json({ reply });
  }

  try {
    const formattedHistory = (history || []).slice(-10).map((h: any) => ({
      role: h.role === 'user' ? 'user' : 'model',
      parts: [{ text: h.content }]
    }));

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: [
        ...formattedHistory,
        {
          text: `You are the exclusive AI Concierge for Neelu Vora Fashion, an ultra-luxury Indian D2C brand selling fine jewelry (necklaces, bangles, rings in 22K/18K gold) and premium apparel (Varanasi Katan silk sarees, Chanderi cotton sarees).
          
          Policies:
          - Fine Jewelry: Eligible for return/exchange within 3 days. Lab purity weight tests applied upon receipt. Custom designs are final sales.
          - Handloom Apparel/Sarees: Eligible for return/exchange within 7 days. Must be un-draped, unworn, folded originally with designer tags.
          - Shipping: Free across India for orders above ₹15,000. Under ₹15,000, ₹150 shipping fee. Delivery takes 3-5 Metros days.
          - Payment: Razorpay secure gateway and Cash on Delivery (COD) are accepted.
          - Contact Details: Phone +91 22 4599 0000, email concierge@neeluvora.com, flagship atelier in Colaba, Mumbai.
          - Support bookings: Customers can schedule a 1-on-1 "Video Consultation" with our jewelry designers directly.
          
          Our curated products list:
          1. Aishwarya Royal Kundan Choker: ₹1,25,000 (bridal 22K gold, raw polki diamonds, Colombian emerald droplets)
          2. Mayura Filigree Kada Set: ₹79,999 (22K Rajasthani filigree bangles, ruby eyes)
          3. Padma Ruby Solitaire Ring: ₹38,000 (2.5-carat Burmese ruby, 18K gold)
          4. Varanasi Katan Silk Saree: ₹32,500 (pure handwoven mulberry silk brocade, real zari)
          5. Chanderi Pastel Mint Saree: ₹12,500 (lightweight cotton-silk weave, silver zari)

          Rules for your response:
          - Adopt an exceptionally elegant, warm, refined, high-end concierge tone.
          - Be helpful, polite, and scannable.
          - If they ask for help with custom styles, suggest booking a video consultation with our team.
          - Answer the customer's query directly: "${message}"`
        }
      ]
    });

    res.json({ reply: response.text?.trim() });
  } catch (err) {
    console.error('Gemini chat failed', err);
    res.status(500).json({ error: 'Failed to stream chat answer' });
  }
});
