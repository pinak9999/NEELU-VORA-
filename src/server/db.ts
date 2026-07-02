import mongoose, { Schema, Document } from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/neeluvora';

mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 })
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch(err => console.error('Failed to connect to MongoDB Atlas (Please ensure MONGODB_URI is set in the environment)', err.message));

export interface ProductVariant {
  name: string;
  stock: number;
  priceAdjust?: number;
}

export interface Product extends Document {
  id?: string;
  name: string;
  category: string;
  description: string;
  price: number;
  discountedPrice?: number;
  stockQuantity: number;
  images: string[];
  videos: string[];
  instagramReels?: string[];
  youtubeVideos?: string[];
  instagramReelUrl?: string;
  metalType?: string;
  purity?: string;
  fabric?: string;
  color?: string;
  occasion?: string;
  seoTitle?: string;
  seoDescription?: string;
  featured?: boolean;
  draft?: boolean;
  variants?: ProductVariant[];
  createdAt?: Date;
}

const ProductSchema = new Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  discountedPrice: { type: Number },
  stockQuantity: { type: Number, required: true, default: 0 },
  images: [{ type: String }],
  videos: [{ type: String }],
  instagramReels: [{ type: String }],
  youtubeVideos: [{ type: String }],
  instagramReelUrl: { type: String },
  metalType: { type: String },
  purity: { type: String },
  fabric: { type: String },
  color: { type: String },
  occasion: { type: String },
  seoTitle: { type: String },
  seoDescription: { type: String },
  featured: { type: Boolean, default: false },
  draft: { type: Boolean, default: false },
  variants: [{
    name: String,
    stock: Number,
    priceAdjust: Number
  }],
}, { timestamps: true });

ProductSchema.set('toJSON', {
  virtuals: true,
  transform: (doc: any, ret: any) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
  }
});

export const ProductModel = mongoose.model<Product>('Product', ProductSchema);


export interface OrderItem {
  productId: string;
  productName: string;
  productImage: string;
  price: number;
  quantity: number;
  variant?: string;
}

export interface Order extends Document {
  id?: string;
  customerName: string;
  customerEmail: string;
  customerMobile: string;
  shippingAddress: string;
  pincode: string;
  city: string;
  state: string;
  items: OrderItem[];
  subtotal: number;
  taxGst: number;
  shippingCharge: number;
  discount: number;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  trackingId?: string;
  trackingStatus?: string;
  courierName?: string;
  createdAt?: Date;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  refundReason?: string;
  returnReason?: string;
}

const OrderSchema = new Schema({
  customerName: { type: String, required: true },
  customerEmail: { type: String },
  customerMobile: { type: String, required: true },
  shippingAddress: { type: String, required: true },
  pincode: { type: String, required: true },
  city: { type: String },
  state: { type: String },
  items: [{
    productId: String,
    productName: String,
    productImage: String,
    price: Number,
    quantity: Number,
    variant: String
  }],
  subtotal: { type: Number, required: true },
  taxGst: { type: Number, required: true },
  shippingCharge: { type: Number, required: true },
  discount: { type: Number, required: true },
  total: { type: Number, required: true },
  paymentMethod: { type: String, required: true },
  paymentStatus: { type: String, required: true },
  orderStatus: { type: String, required: true },
  trackingId: { type: String },
  trackingStatus: { type: String },
  courierName: { type: String },
  razorpayOrderId: { type: String },
  razorpayPaymentId: { type: String },
  refundReason: { type: String },
  returnReason: { type: String }
}, { timestamps: true });

OrderSchema.set('toJSON', {
  virtuals: true,
  transform: (doc: any, ret: any) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
  }
});

export const OrderModel = mongoose.model<Order>('Order', OrderSchema);


export interface User extends Document {
  id?: string;
  email: string;
  passwordHash?: string;
  name: string;
  phone?: string;
  role: string;
  addresses?: {
    id: string;
    address: string;
    pincode: string;
    city: string;
    state: string;
    isDefault?: boolean;
  }[];
  googleId?: string;
  createdAt?: Date;
}

const UserSchema = new Schema({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String },
  name: { type: String, required: true },
  phone: { type: String },
  role: { type: String, required: true, default: 'Customer' },
  addresses: [{
    id: String,
    address: String,
    pincode: String,
    city: String,
    state: String,
    isDefault: Boolean
  }],
  googleId: { type: String }
}, { timestamps: true });

UserSchema.set('toJSON', {
  virtuals: true,
  transform: (doc: any, ret: any) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
  }
});

export const UserModel = mongoose.model<User>('User', UserSchema);


export interface Coupon extends Document {
  id?: string;
  code: string;
  discountType: string;
  discountValue: number;
  minCartValue: number;
  maxDiscountCap?: number;
  expiryDate: string;
  usageLimit: number;
  usageCount: number;
  active: boolean;
}

const CouponSchema = new Schema({
  code: { type: String, required: true, unique: true },
  discountType: { type: String, required: true },
  discountValue: { type: Number, required: true },
  minCartValue: { type: Number, required: true },
  maxDiscountCap: { type: Number },
  expiryDate: { type: String, required: true },
  usageLimit: { type: Number, required: true },
  usageCount: { type: Number, required: true, default: 0 },
  active: { type: Boolean, required: true, default: true }
}, { timestamps: true });

CouponSchema.set('toJSON', {
  virtuals: true,
  transform: (doc: any, ret: any) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
  }
});

export const CouponModel = mongoose.model<Coupon>('Coupon', CouponSchema);


export interface Review extends Document {
  id?: string;
  productId: string;
  customerName: string;
  rating: number;
  text: string;
  image?: string;
  video?: string;
  approved: boolean;
  createdAt?: Date;
}

const ReviewSchema = new Schema({
  productId: { type: String, required: true },
  customerName: { type: String, required: true },
  rating: { type: Number, required: true },
  text: { type: String, required: true },
  image: { type: String },
  video: { type: String },
  approved: { type: Boolean, required: true, default: false }
}, { timestamps: true });

ReviewSchema.set('toJSON', {
  virtuals: true,
  transform: (doc: any, ret: any) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
  }
});

export const ReviewModel = mongoose.model<Review>('Review', ReviewSchema);


export interface CMSBanner {
  id?: string;
  image: string;
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
  createdAt?: string;
}

export interface CMSBlog {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  image: string;
  date: string;
  author: string;
}

export interface CMS extends Document {
  banners: CMSBanner[];
  blogs: CMSBlog[];
  legalPages: Map<string, string>;
}

const CMSSchema = new Schema({
  banners: [{
    id: String,
    image: String,
    title: String,
    subtitle: String,
    ctaText: String,
    ctaLink: String,
    createdAt: String
  }],
  blogs: [{
    id: String,
    title: String,
    excerpt: String,
    content: String,
    image: String,
    date: String,
    author: String
  }],
  legalPages: {
    type: Map,
    of: String
  }
}, { timestamps: true });

CMSSchema.set('toJSON', {
  virtuals: true,
  transform: (doc: any, ret: any) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    if (ret.legalPages instanceof Map) {
      ret.legalPages = Object.fromEntries(ret.legalPages);
    }
  }
});

export const CMSModel = mongoose.model<CMS>('CMS', CMSSchema);


export interface Consultation extends Document {
  id?: string;
  customerName: string;
  customerPhone: string;
  preferredTime: string;
  notes?: string;
  productId?: string;
  productName?: string;
  status: string;
  createdAt?: Date;
}

const ConsultationSchema = new Schema({
  customerName: { type: String, required: true },
  customerPhone: { type: String, required: true },
  preferredTime: { type: String, required: true },
  notes: { type: String },
  productId: { type: String },
  productName: { type: String },
  status: { type: String, required: true, default: 'Pending' }
}, { timestamps: true });

ConsultationSchema.set('toJSON', {
  virtuals: true,
  transform: (doc: any, ret: any) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
  }
});

export const ConsultationModel = mongoose.model<Consultation>('Consultation', ConsultationSchema);


export interface ActivityLog extends Document {
  id?: string;
  userEmail: string;
  action: string;
  timestamp: string;
}

const ActivityLogSchema = new Schema({
  userEmail: { type: String, required: true },
  action: { type: String, required: true },
  timestamp: { type: String, required: true }
}, { timestamps: true });

ActivityLogSchema.set('toJSON', {
  virtuals: true,
  transform: (doc: any, ret: any) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
  }
});

export const ActivityLogModel = mongoose.model<ActivityLog>('ActivityLog', ActivityLogSchema);


// Logger Utility
export const logActivity = async (userEmail: string, action: string) => {
  try {
    const log = new ActivityLogModel({
      userEmail,
      action,
      timestamp: new Date().toISOString()
    });
    await log.save();
    
    // Keep last 100 logs
    const count = await ActivityLogModel.countDocuments();
    if (count > 100) {
      const oldestLogs = await ActivityLogModel.find().sort({ timestamp: 1 }).limit(count - 100);
      for (const oldLog of oldestLogs) {
        await ActivityLogModel.findByIdAndDelete(oldLog._id);
      }
    }
  } catch (err) {
    console.error('Failed to log activity', err);
  }
};

export const getCMS = async () => {
  let cms = await CMSModel.findOne();
  if (!cms) {
    cms = new CMSModel({
      banners: [
        {
          id: 'banner_1',
          image: "https://images.unsplash.com/photo-1601121141461-9d6647bca1ed?auto=format&fit=crop&w=1600&q=80",
          title: "Heritage Fine Jewelry",
          subtitle: "Handcrafted 22K Kundan Polki & Solitaire Rubies",
          ctaText: "Explore Collection",
          ctaLink: "/category/Necklaces"
        },
        {
          id: 'banner_2',
          image: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1600&q=80",
          title: "Royal Silk Weaves",
          subtitle: "Pure Varanasi Brocades & Featherlight Chanderi Sarees",
          ctaText: "Browse Apparel",
          ctaLink: "/category/Silk Sarees"
        }
      ],
      blogs: [
        {
          id: "blog-1",
          title: "The Art of Kundan Polki: A Mughal Heritage",
          excerpt: "Discover the intricate craft of embedding uncut diamonds in gold foil, a design heritage dating back centuries to the imperial Mughal courts of Northern India.",
          content: "Kundan and Polki are often spoken of together but represent distinct elements of traditional Indian royal jewelry. Polki is uncut diamond, retaining its raw earthborn character and brilliant, natural refraction. Kundan refers to the process of setting these stones using highly purified, ultra-soft 24-karat gold foil. This craft requires decades of training, where artisans (known as Chateras) design the golden base, while Meenakars paint the reverse with exquisite red, green, and white enamel, ensuring the jewelry is as beautiful on its back as it is on the front.\n\nAt Neelu Vora Fashion, we keep this ancient art alive, sourcing Colombian emeralds, natural rubies, and polki diamonds to frame masterpieces like our Aishwarya Choker. A single piece can take over 200 hours of manual, uninterrupted craftsmanship to complete.",
          image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=80",
          date: "2026-06-25",
          author: "Neelu Vora"
        }
      ],
      legalPages: {
        "about": "# About Neelu Vora Fashion\n\nWelcome to Neelu Vora Fashion, India's premier D2C home of ultra-premium fine jewelry and luxury handloom apparel. Founded by couturier and jewel curator Neelu Vora, our brand is a testament to the preservation of Indian craftsmanship.\n\nEach of our pieces is created using pristine raw materials: certified 22K gold, certified uncut polki diamonds, natural rubies and Colombian emeralds, alongside pure silk and cotton-silk handloom yarns sourced directly from Banaras and Chanderi craft cooperatives.\n\n### Our Philosophy\n- **Heritage Quality**: We do not compromise. Our jewelry is certified for purity and our sarees are handwoven.\n- **Ethical Craft**: We partner directly with master weavers and goldsmiths, ensuring fair wages and direct lineage.\n- **Enduring Luxury**: We create heirloom pieces meant to be loved, draped, and passed down across generations.",
        "contact": "# Contact Us\n\nOur concierge desk is available to assist you with customized styling, video consultations, and order inquiries.\n\n- **Flagship Atelier**: Neelu Vora Mansion, Colaba, Mumbai, MH - 400005\n- **Concierge Email**: concierge@neeluvora.com\n- **Support Phone**: +91 22 4599 0000 (Mon-Sat, 10 AM to 7 PM IST)\n- **WhatsApp Support**: +91 99999 12345",
        "privacy": "# Privacy Policy\n\nAt Neelu Vora Fashion, we respect your privacy. All your data, from billing address to payment security parameters, is protected with industry-standard TLS encryption. We do not store card details on our servers; payments are processed entirely through Razorpay's secure SDK.",
        "terms": "# Terms & Conditions\n\nAll transactions made on Neelu Vora Fashion are subject to Indian jurisdictional law. Prices of luxury items like 22K/18K gold and handloom fabrics are subject to change based on raw material spot prices. Gold jewelry items are dispatched with certified hallmarking tags.",
        "shipping": "# Shipping & Delivery Policy\n\nWe offer free insured shipping within India on all orders over ₹15,000. Under ₹15,000, a flat shipping fee of ₹150 applies.\n\n- **Jewelry Delivery**: Dispatched within 2-3 business days via highly secure armored transport (e.g., Sequre/BVC). Insured door-to-door transit.\n- **Saree Delivery**: Dispatched within 1-2 business days via premium express couriers (BlueDart/Shiprocket).\n- **Transit Times**: 3-5 business days across major metro cities in India.",
        "return": "# Return, Exchange & Refund Policy\n\nWe strive for complete satisfaction with your luxury purchase. However, given the high-value custom nature of our goods:\n\n### Fine Jewelry Return Policy\n- Returns or exchanges are accepted within **3 days** of delivery.\n- Gold purity and weight checks will be performed at our lab upon return. The security tag must be completely intact and un-tampered.\n- Customized or engraved jewelry pieces are **final sale** and non-returnable.\n\n### Saree & Apparel Return Policy\n- Sarees are accepted for return or exchange within **7 days** of delivery.\n- Fabric must be completely folded in original packing, un-draped, unwashed, and with all designer tags intact."
      }
    });
    await cms.save();
  }
  return cms;
};

export const initializeDB = async () => {
  // Ensure default CMS exists
  await getCMS();
  
  // Create default admin user if no users exist
  const count = await UserModel.countDocuments();
  if (count === 0) {
    const adminUser = new UserModel({
      email: "admin@neeluvora.com",
      passwordHash: "$2b$10$r8VpxbW92oPzP3T5W3W3WeMofB8eZ7fW3oOWeV5R2zF7fW6V.FzU6",
      name: "Neelu Vora",
      role: "Super Admin"
    });
    await adminUser.save();
    
    // Seed some products
    await ProductModel.create([
      {
        name: "Aishwarya Royal Kundan Choker",
        category: "Necklaces",
        description: "Exquisite kundan choker set with raw uncut polki diamonds, real Colombian emerald droplets, and intricate hand-painted enamel backing (Meenakari) on a solid 22K gold base. A masterpiece of Mughal-era heritage designed for the timeless bridal trousseau.",
        price: 145000,
        discountedPrice: 125000,
        stockQuantity: 4,
        images: [
          "https://images.unsplash.com/photo-1601121141461-9d6647bca1ed?auto=format&fit=crop&w=1200&q=80",
          "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1200&q=80",
          "https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?auto=format&fit=crop&w=1200&q=80"
        ],
        videos: [],
        instagramReelUrl: "https://www.instagram.com/p/Cg3_YxNDf6S/", // Placeholder valid format URL
        metalType: "Gold",
        purity: "22K",
        occasion: "Bridal",
        seoTitle: "Aishwarya Royal Kundan Gold Choker - Neelu Vora Fashion",
        seoDescription: "Buy fine luxury kundan polki bridal chokers handcraft in 22K gold. Neelu Vora Fashion Indian designer bridal jewelry collections.",
        featured: true,
        draft: false,
        variants: [
          { name: "With Matching Jhumkas", stock: 2, priceAdjust: 45000 },
          { name: "Choker Only", stock: 2, priceAdjust: 0 }
        ]
      },
      {
        name: "Mayura Filigree Kada Set",
        category: "Bangles",
        description: "A pair of highly detailed 22K gold kadas featuring intricate Rajasthani filigree work, finished with stylized peacock (Mayura) terminal heads encrusted with ruby accents. Includes a secure side-screw mechanism.",
        price: 85000,
        discountedPrice: 79999,
        stockQuantity: 8,
        images: [
          "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&w=1200&q=80"
        ],
        videos: [],
        metalType: "Gold",
        purity: "22K",
        occasion: "Festive",
        seoTitle: "Mayura Peacock Gold Filigree Kada Set - Neelu Vora",
        featured: true,
        draft: false,
        variants: [
          { name: "Size 2.4", stock: 3 },
          { name: "Size 2.6", stock: 3 },
          { name: "Size 2.8", stock: 2 }
        ]
      }
    ]);
  }
};

mongoose.connection.once('open', () => {
  initializeDB();
});
