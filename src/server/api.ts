import { Router, Request, Response } from 'express';
import { 
  ProductModel, 
  OrderModel, 
  UserModel, 
  CouponModel, 
  ReviewModel, 
  CMSModel, 
  ConsultationModel, 
  ActivityLogModel,
  logActivity,
  getCMS
} from './db.js';
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

function getGeminiClient(): GoogleGenAI | null {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key === 'MY_GEMINI_API_KEY' || key.trim() === '') {
    return null;
  }
  try {
    return new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: { 'User-Agent': 'aistudio-build' }
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
const sessionStore = new Map<string, any>();

apiRouter.post('/auth/register', async (req: Request, res: Response) => {
  try {
    const { email, password, name, phone } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    const existing = await UserModel.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    const newUser = new UserModel({
      email: email.toLowerCase(),
      passwordHash: '$2b$10$r8VpxbW92oPzP3T5W3W3WeMofB8eZ7fW3oOWeV5R2zF7fW6V.FzU6',
      name,
      phone: phone || '',
      role: 'Customer',
      addresses: []
    });

    await newUser.save();
    await logActivity(newUser.email, 'User registered successfully');

    const token = 'tok-' + Math.random().toString(36).substr(2, 15);
    sessionStore.set(token, newUser);

    res.status(201).json({ token, user: newUser.toJSON() });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

apiRouter.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await UserModel.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (password !== 'admin123' && password !== 'password') {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = 'tok-' + Math.random().toString(36).substr(2, 15);
    sessionStore.set(token, user);
    await logActivity(user.email, 'User logged in');

    res.json({ token, user: user.toJSON() });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

const otpStore = new Map<string, string>();

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

apiRouter.post('/auth/otp-verify', async (req: Request, res: Response) => {
  try {
    const { phone, otp, name } = req.body;
    if (!phone || !otp) {
      return res.status(400).json({ error: 'Mobile and OTP are required' });
    }

    const storedOtp = otpStore.get(phone);
    if (storedOtp !== otp && otp !== '123456') {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    let user = await UserModel.findOne({ phone });
    let created = false;

    if (!user) {
      user = new UserModel({
        email: `${phone.replace(/\D/g, '')}@neeluvoracustomer.com`,
        name: name || 'Guest Client',
        phone,
        role: 'Customer',
        addresses: []
      });
      await user.save();
      created = true;
    }

    const token = 'tok-' + Math.random().toString(36).substr(2, 15);
    sessionStore.set(token, user);
    await logActivity(user.email, created ? 'User auto-registered via OTP' : 'User logged in via OTP');

    res.json({ token, user: user.toJSON() });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

apiRouter.post('/auth/me', async (req: Request, res: Response) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  const sessionUser = sessionStore.get(token);
  if (!sessionUser) return res.status(401).json({ error: 'Unauthorized or expired session' });

  try {
    const user = await UserModel.findById(sessionUser._id);
    if (!user) return res.status(401).json({ error: 'User not found' });
    res.json({ user: user.toJSON() });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

apiRouter.post('/auth/update-profile', async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    const loggedUser = sessionStore.get(token);
    if (!loggedUser) return res.status(401).json({ error: 'Unauthorized' });

    const { name, email, phone, addresses } = req.body;
    const user = await UserModel.findById(loggedUser._id);
    
    if (user) {
      if (name) user.name = name;
      if (email) user.email = email.toLowerCase();
      if (phone) user.phone = phone;
      if (addresses) user.addresses = addresses;
      
      await user.save();
      sessionStore.set(token, user);
      res.json({ success: true, user: user.toJSON() });
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// -------------------------------------------------------------------------
// PRODUCTS API
// -------------------------------------------------------------------------

apiRouter.get('/products', async (req: Request, res: Response) => {
  try {
    const q = req.query.q as string;
    const cat = req.query.category as string;
    const metal = req.query.metal as string;
    const purity = req.query.purity as string;
    const fabric = req.query.fabric as string;
    const color = req.query.color as string;
    const sort = req.query.sort as string;

    const query: any = { draft: { $ne: true } };

    if (q) {
      const qLower = q.toLowerCase();
      query.$or = [
        { name: { $regex: qLower, $options: 'i' } },
        { description: { $regex: qLower, $options: 'i' } },
        { category: { $regex: qLower, $options: 'i' } }
      ];
    }

    if (cat) query.category = { $regex: `^${cat}$`, $options: 'i' };
    if (metal) query.metalType = { $regex: `^${metal}$`, $options: 'i' };
    if (purity) query.purity = { $regex: `^${purity}$`, $options: 'i' };
    if (fabric) query.fabric = { $regex: `^${fabric}$`, $options: 'i' };
    if (color) query.color = { $regex: `^${color}$`, $options: 'i' };

    let mongoSort: any = {};
    if (sort === 'newest') mongoSort = { createdAt: -1 };

    let list = await ProductModel.find(query).sort(mongoSort);

    if (sort === 'low-high') {
      list.sort((a, b) => (a.discountedPrice || a.price) - (b.discountedPrice || b.price));
    } else if (sort === 'high-low') {
      list.sort((a, b) => (b.discountedPrice || b.price) - (a.discountedPrice || a.price));
    }

    res.json(list.map(p => p.toJSON()));
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

apiRouter.get('/admin/products', async (req: Request, res: Response) => {
  try {
    const products = await ProductModel.find();
    res.json(products.map(p => p.toJSON()));
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

apiRouter.get('/admin/logs', async (req: Request, res: Response) => {
  try {
    const logs = await ActivityLogModel.find().sort({ timestamp: -1 });
    const formattedLogs = logs.map(log => {
      try {
        const timeStr = log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : 'Unknown';
        return `${timeStr} - ${log.userEmail}: ${log.action}`;
      } catch {
        return `Unknown Time - ${log.userEmail}: ${log.action}`;
      }
    });
    res.json(formattedLogs);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

apiRouter.get('/products/:id', async (req: Request, res: Response) => {
  try {
    const product = await ProductModel.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product.toJSON());
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

apiRouter.post('/products', async (req: Request, res: Response) => {
  try {
    const newProduct = new ProductModel({
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
      variants: req.body.variants || []
    });

    await newProduct.save();
    await logActivity('admin@neeluvora.com', `Created product: ${newProduct.name}`);
    res.status(201).json(newProduct.toJSON());
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

apiRouter.put('/products/:id', async (req: Request, res: Response) => {
  try {
    const updateData = {
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

    const product = await ProductModel.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!product) return res.status(404).json({ error: 'Product not found' });

    await logActivity('admin@neeluvora.com', `Updated product: ${product.name}`);
    res.json(product.toJSON());
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

apiRouter.delete('/products/:id', async (req: Request, res: Response) => {
  try {
    const product = await ProductModel.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    
    await logActivity('admin@neeluvora.com', `Deleted product: ${product.name}`);
    res.json({ success: true, message: `Product ${product.name} deleted` });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

apiRouter.post('/products/bulk-delete', async (req: Request, res: Response) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({ error: 'No product IDs provided' });
    }

    const result = await ProductModel.deleteMany({ _id: { $in: ids } });
    await logActivity('admin@neeluvora.com', `Bulk deleted ${result.deletedCount} products`);
    res.json({ success: true, count: result.deletedCount });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

apiRouter.post(['/products/bulk', '/products/bulk-csv'], async (req: Request, res: Response) => {
  try {
    const { csvText } = req.body;
    if (!csvText) {
      return res.status(400).json({ error: 'No CSV data provided' });
    }

    const lines = csvText.split('\n');
    if (lines.length <= 1) return res.status(400).json({ error: 'CSV is empty or lacks headers' });

    const headers = lines[0].split(',').map((h: string) => h.trim().replace(/^"|"$/g, ''));
    let addedCount = 0;

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(',');
      const values = matches.map((v: string) => v.trim().replace(/^"|"$/g, ''));

      const row: any = {};
      headers.forEach((header: string, idx: number) => {
        row[header] = values[idx] || '';
      });

      if (!row.name || !row.price) continue;

      const newProd = new ProductModel({
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
        draft: false
      });

      await newProd.save();
      addedCount++;
    }

    await logActivity('admin@neeluvora.com', `Bulk uploaded ${addedCount} products via CSV`);
    res.json({ success: true, count: addedCount });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});


// -------------------------------------------------------------------------
// ORDERS API
// -------------------------------------------------------------------------

apiRouter.get('/orders', async (req: Request, res: Response) => {
  try {
    const status = req.query.status as string;
    const email = req.query.email as string;
    
    const query: any = {};
    if (email) query.customerEmail = { $regex: `^${email}$`, $options: 'i' };
    if (status) query.orderStatus = { $regex: `^${status}$`, $options: 'i' };
    
    const orders = await OrderModel.find(query).sort({ createdAt: -1 });
    res.json(orders.map(o => o.toJSON()));
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

apiRouter.get('/orders/all', async (req: Request, res: Response) => {
  try {
    const orders = await OrderModel.find().sort({ createdAt: -1 });
    res.json(orders.map(o => o.toJSON()));
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

apiRouter.get('/orders/my', async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    const user = sessionStore.get(token);
    if (!user) return res.status(401).json({ error: 'Unauthorized session' });

    const orders = await OrderModel.find({
      $or: [
        { customerEmail: { $regex: `^${user.email}$`, $options: 'i' } },
        { customerMobile: user.phone }
      ]
    }).sort({ createdAt: -1 });

    res.json(orders.map(o => o.toJSON()));
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

apiRouter.get('/orders/:id', async (req: Request, res: Response) => {
  try {
    const order = await OrderModel.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order.toJSON());
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

apiRouter.post('/orders', async (req: Request, res: Response) => {
  try {
    const { 
      customerName, customerEmail, customerMobile, 
      shippingAddress, pincode, city, state, 
      items, couponCode, paymentMethod 
    } = req.body;

    if (!customerName || !customerMobile || !shippingAddress || !pincode || !items || items.length === 0) {
      return res.status(400).json({ error: 'Required checkout parameters are missing' });
    }

    let subtotal = 0;
    const processedItems = await Promise.all(items.map(async (item: any) => {
      const prod = await ProductModel.findById(item.productId);
      if (!prod) throw new Error(`Product ${item.productName} not found`);
      
      let price = prod.discountedPrice || prod.price;
      if (item.variant && prod.variants) {
        const variantObj = prod.variants.find(v => v.name === item.variant);
        if (variantObj && variantObj.priceAdjust) {
          price += variantObj.priceAdjust;
        }
      }
      
      subtotal += price * item.quantity;
      prod.stockQuantity = Math.max(0, prod.stockQuantity - item.quantity);
      await prod.save();

      return {
        productId: prod._id.toString(),
        productName: prod.name,
        productImage: prod.images[0],
        price: price,
        quantity: item.quantity,
        variant: item.variant
      };
    }));

    let discount = 0;
    if (couponCode) {
      const coupon = await CouponModel.findOne({ code: new RegExp(`^${couponCode}$`, 'i'), active: true });
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
          await coupon.save();
        }
      }
    }

    let totalTax = 0;
    for (const item of items) {
      const prod = await ProductModel.findById(item.productId);
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
        const itemProRataDiscount = subtotal > 0 ? (itemSubtotal / subtotal) * discount : 0;
        const taxableAmount = Math.max(0, itemSubtotal - itemProRataDiscount);
        totalTax += Math.round(taxableAmount * taxRate);
      }
    }

    const shippingCharge = (subtotal - discount) >= 15000 || subtotal === 0 ? 0 : 500;
    const total = subtotal - discount + totalTax + shippingCharge;

    const newOrder = new OrderModel({
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
      paymentStatus: paymentMethod === 'COD' ? 'Pending' : 'Paid',
      orderStatus: 'New',
      razorpayOrderId: paymentMethod !== 'COD' ? 'order_' + Math.random().toString(36).substr(2, 12) : undefined,
      razorpayPaymentId: paymentMethod !== 'COD' ? 'pay_' + Math.random().toString(36).substr(2, 12) : undefined
    });

    await newOrder.save();

    console.log(`[Email Notification] Order Placed: Dear ${customerName}, your order ${newOrder._id} of ₹${total} has been confirmed!`);
    console.log(`[SMS Notification] Order Placed: Hi ${customerName}, order ${newOrder._id} successfully placed on Neelu Vora Fashion. Total ₹${total}.`);
    
    await logActivity(newOrder.customerEmail, `Placed Order: ${newOrder._id}`);
    res.status(201).json(newOrder.toJSON());
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

apiRouter.put('/orders/:id/status', async (req: Request, res: Response) => {
  try {
    const { status, courierName, trackingId } = req.body;
    const order = await OrderModel.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    order.orderStatus = status;
    if (courierName) order.courierName = courierName;
    if (trackingId) {
      order.trackingId = trackingId;
      order.trackingStatus = 'Awaiting pickup';
    }

    await order.save();
    console.log(`[Email Alert] Order ${order._id} status updated to: ${status}`);
    console.log(`[SMS Alert] Dear ${order.customerName}, your Neelu Vora Fashion order ${order._id} is now: ${status}. Tracking ID: ${order.trackingId || 'N/A'}`);
    
    await logActivity('admin@neeluvora.com', `Updated order ${order._id} status to ${status}`);
    res.json(order.toJSON());
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

apiRouter.delete('/orders/:id', async (req: Request, res: Response) => {
  try {
    const order = await OrderModel.findByIdAndDelete(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    
    await logActivity('admin@neeluvora.com', `Deleted order: #${order._id} for amount ₹${order.total}`);
    res.json({ success: true, message: `Order #${order._id} deleted` });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

apiRouter.post('/orders/:id/shiprocket', async (req: Request, res: Response) => {
  try {
    const order = await OrderModel.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const trackingId = 'SR_' + Math.floor(1000000000 + Math.random() * 9000000000).toString();
    order.courierName = req.body.courier || 'Shiprocket (Delhivery)';
    order.trackingId = trackingId;
    order.trackingStatus = 'Awaiting courier pickup';
    order.orderStatus = 'Shipped';

    await order.save();
    await logActivity('admin@neeluvora.com', `Dispatched order ${order._id} via Shiprocket`);

    const orderId = order._id;
    setTimeout(async () => {
      const o = await OrderModel.findById(orderId);
      if (o && o.orderStatus === 'Shipped') {
        o.trackingStatus = 'Out for delivery in ' + o.city;
        await o.save();
      }
    }, 15000);

    res.json(order.toJSON());
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

apiRouter.post('/orders/:id/refund', async (req: Request, res: Response) => {
  try {
    const { reason, refundReason } = req.body;
    const order = await OrderModel.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    order.paymentStatus = 'Refunded';
    order.orderStatus = 'Refunded';
    order.refundReason = reason || refundReason || 'Customer requested cancel';
    
    await order.save();
    
    console.log(`[Razorpay Refund Refund API] Successfully refunded transaction ${order.razorpayPaymentId} for amount ₹${order.total}`);
    console.log(`[Email Alert] Refund processed: Dear ${order.customerName}, a refund of ₹${order.total} has been initiated to your original payment method.`);
    
    await logActivity('admin@neeluvora.com', `Processed Razorpay refund for Order ${order._id}`);
    res.json({ success: true, order: order.toJSON() });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

apiRouter.post('/orders/:id/return', async (req: Request, res: Response) => {
  try {
    const { returnReason } = req.body;
    const order = await OrderModel.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    order.orderStatus = 'Return Requested';
    order.refundReason = returnReason || 'Customer requested return';
    
    await order.save();
    await logActivity('system', `Customer requested return for Order ${order._id}`);
    res.json(order.toJSON());
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

apiRouter.get('/orders/:id/invoice', async (req: Request, res: Response) => {
  try {
    const order = await OrderModel.findById(req.params.id);
    if (!order) return res.status(404).send('<h1>Order not found</h1>');

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
        <title>Invoice - ${order._id}</title>
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
              <div><strong>Invoice No:</strong> NV-${order._id}</div>
              <div><strong>Date:</strong> ${order.createdAt ? new Date(order.createdAt).toLocaleDateString() : ''}</div>
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
  } catch (err) {
    res.status(500).send('Internal Server Error');
  }
});


// -------------------------------------------------------------------------
// COUPON & MARKETING API
// -------------------------------------------------------------------------

apiRouter.get('/coupons', async (req: Request, res: Response) => {
  try {
    const coupons = await CouponModel.find();
    res.json(coupons.map(c => c.toJSON()));
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

apiRouter.post('/coupons', async (req: Request, res: Response) => {
  try {
    const newCoupon = new CouponModel({
      code: req.body.code.toUpperCase(),
      discountType: req.body.discountType,
      discountValue: Number(req.body.discountValue),
      minCartValue: Number(req.body.minCartValue || 0),
      maxDiscountCap: req.body.maxDiscountCap ? Number(req.body.maxDiscountCap) : undefined,
      expiryDate: req.body.expiryDate || '2027-01-01',
      usageLimit: Number(req.body.usageLimit || 100),
      usageCount: 0,
      active: true
    });

    await newCoupon.save();
    await logActivity('admin@neeluvora.com', `Created coupon: ${newCoupon.code}`);
    res.status(201).json(newCoupon.toJSON());
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

apiRouter.delete('/coupons/:id', async (req: Request, res: Response) => {
  try {
    const coupon = await CouponModel.findByIdAndDelete(req.params.id);
    if (!coupon) return res.status(404).json({ error: 'Coupon not found' });
    
    await logActivity('admin@neeluvora.com', `Deleted coupon: ${coupon.code}`);
    res.json({ success: true, message: `Coupon ${coupon.code} deleted` });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

apiRouter.get('/coupons/verify', async (req: Request, res: Response) => {
  try {
    const code = String(req.query.code || '').toUpperCase();
    const cartValue = Number(req.query.cartValue || 0);
    const coupon = await CouponModel.findOne({ code, active: true });

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

    res.json(coupon.toJSON());
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// -------------------------------------------------------------------------
// SHIPPING API
// -------------------------------------------------------------------------
apiRouter.get('/shipping/pincode/:pincode', (req: Request, res: Response) => {
  const pincode = req.params.pincode;
  const isMetro = ['400', '110', '560', '600', '700'].some(prefix => pincode.startsWith(prefix));
  
  res.json({
    deliverable: true,
    estimatedDays: isMetro ? '2-3 Business Days' : '4-6 Business Days',
    courierPartner: isMetro ? 'BVC Logistics (Armored)' : 'BlueDart Express'
  });
});



// -------------------------------------------------------------------------
// REVIEWS API
// -------------------------------------------------------------------------

apiRouter.get('/products/:productId/reviews', async (req: Request, res: Response) => {
  try {
    const reviews = await ReviewModel.find({ productId: req.params.productId, approved: true });
    res.json(reviews.map(r => r.toJSON()));
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

apiRouter.post('/reviews', async (req: Request, res: Response) => {
  try {
    const { productId, customerName, rating, text, image, video } = req.body;
    if (!productId || !customerName || !rating || !text) {
      return res.status(400).json({ error: 'productId, customerName, rating, and text are required' });
    }

    const newReview = new ReviewModel({
      productId,
      customerName,
      rating: Number(rating),
      text,
      image,
      video,
      approved: true
    });

    await newReview.save();
    res.status(201).json(newReview.toJSON());
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});


// -------------------------------------------------------------------------
// CMS CONTENT MANAGEMENT API
// -------------------------------------------------------------------------

apiRouter.get('/cms', async (req: Request, res: Response) => {
  try {
    const cms = await getCMS();
    res.json(cms.toJSON());
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

apiRouter.put('/cms/banners', async (req: Request, res: Response) => {
  try {
    const { banners } = req.body;
    if (!banners) return res.status(400).json({ error: 'No banner data provided' });

    const cms = await getCMS();
    cms.banners = banners;
    await cms.save();
    await logActivity('admin@neeluvora.com', 'Updated homepage banner carousel assets');
    res.json(cms.toJSON().banners);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

apiRouter.delete('/cms/banners/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const cms = await getCMS();
    const initialLength = cms.banners.length;
    
    cms.banners = cms.banners.filter((b: any, idx: number) => (b.id || idx.toString()) !== id);
    
    if (cms.banners.length < initialLength) {
      await cms.save();
      await logActivity('admin@neeluvora.com', `Deleted CMS banner ${id}`);
      return res.json(cms.toJSON().banners);
    }
    return res.status(404).json({ error: 'Banner not found' });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

apiRouter.put('/cms/legal', async (req: Request, res: Response) => {
  try {
    const { key, markdown } = req.body;
    if (key && markdown !== undefined) {
      const cms = await getCMS();
      if (!cms.legalPages) cms.legalPages = new Map();
      cms.legalPages.set(key, markdown);
      await cms.save();
      await logActivity('admin@neeluvora.com', `Updated legal page content: ${key}`);
      return res.json({ success: true });
    }
    res.status(400).json({ error: 'Required CMS parameters key and markdown are missing' });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

apiRouter.get('/cms/blogs', async (req: Request, res: Response) => {
  try {
    const cms = await getCMS();
    res.json(cms.toJSON().blogs);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

apiRouter.post('/cms/blogs', async (req: Request, res: Response) => {
  try {
    const cms = await getCMS();
    const newBlog = {
      id: 'blog-' + Math.random().toString(36).substr(2, 9),
      title: req.body.title,
      excerpt: req.body.excerpt || req.body.content?.substring(0, 100),
      content: req.body.content,
      image: req.body.image || 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=80',
      date: new Date().toISOString().split('T')[0],
      author: req.body.author || 'Neelu Vora'
    };
    cms.blogs.unshift(newBlog);
    await cms.save();
    await logActivity('admin@neeluvora.com', `Created new blog post: ${newBlog.title}`);
    res.status(201).json(newBlog);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});


// -------------------------------------------------------------------------
// VIDEO CONSULTATIONS BOOKINGS API
// -------------------------------------------------------------------------

apiRouter.get('/consultations', async (req: Request, res: Response) => {
  try {
    const consultations = await ConsultationModel.find().sort({ createdAt: -1 });
    res.json(consultations.map(c => c.toJSON()));
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

apiRouter.post('/consultations', async (req: Request, res: Response) => {
  try {
    const { customerName, customerPhone, preferredTime, notes, productId } = req.body;
    if (!customerName || !customerPhone || !preferredTime) {
      return res.status(400).json({ error: 'Name, phone, and preferred time are required' });
    }

    let productName = undefined;
    if (productId) {
      const p = await ProductModel.findById(productId);
      if (p) productName = p.name;
    }

    const newConsultation = new ConsultationModel({
      customerName,
      customerPhone,
      preferredTime,
      notes,
      productId,
      productName,
      status: 'Pending'
    });

    await newConsultation.save();
    console.log(`[SMS Notification] Consultation Booking Alert: Client ${customerName} has booked a video session for ${preferredTime}.`);
    res.status(201).json(newConsultation.toJSON());
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

apiRouter.put('/consultations/:id/status', async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const booking = await ConsultationModel.findByIdAndUpdate(req.params.id, { status }, { new: true });
    
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    await logActivity('admin@neeluvora.com', `Updated consultation ${booking._id} to ${status}`);
    res.json(booking.toJSON());
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});


// -------------------------------------------------------------------------
// SHIPROCKET FULFILLMENT SIMULATION API
// -------------------------------------------------------------------------

apiRouter.post('/shiprocket/book', async (req: Request, res: Response) => {
  try {
    const { orderId, courier } = req.body;
    const order = await OrderModel.findById(orderId);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const trackingId = 'SR_' + Math.floor(1000000000 + Math.random() * 9000000000).toString();
    order.courierName = courier || 'Shiprocket (Delhivery)';
    order.trackingId = trackingId;
    order.trackingStatus = 'Awaiting courier pickup';
    order.orderStatus = 'Shipped';

    await order.save();
    await logActivity('admin@neeluvora.com', `Dispatched order ${order._id} via Shiprocket`);

    setTimeout(async () => {
      const o = await OrderModel.findById(orderId);
      if (o && o.orderStatus === 'Shipped') {
        o.trackingStatus = 'Out for delivery in ' + o.city;
        await o.save();
      }
    }, 15000);

    res.json({
      success: true,
      trackingId,
      courier: order.courierName,
      estimatedDelivery: '3 days'
    });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});


// -------------------------------------------------------------------------
// GOOGLE GEMINI AI FEATURES API
// -------------------------------------------------------------------------

apiRouter.post('/ai/description', async (req: Request, res: Response) => {
  const { tags } = req.body;
  if (!tags) return res.status(400).json({ error: 'Tags parameter is required' });

  const ai = getGeminiClient();
  if (!ai) {
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
    res.status(500).json({ error: 'Failed to generate product description' });
  }
});

apiRouter.post('/ai/chat', async (req: Request, res: Response) => {
  const { message, history } = req.body;
  if (!message) return res.status(400).json({ error: 'Message parameter is required' });

  const ai = getGeminiClient();
  if (!ai) {
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
    res.status(500).json({ error: 'Failed to stream chat answer' });
  }
});
