import fs from 'fs';
import path from 'path';

// Interfaces for our Luxury E-Commerce Database

export interface ProductVariant {
  name: string; // e.g., "Size 2.4", "Size 2.6", "Crimson Red"
  stock: number;
  priceAdjust?: number; // extra cost
}

export interface Product {
  id: string;
  name: string;
  category: string; // "Necklaces" | "Bangles" | "Rings" | "Silk Sarees" | "Cotton Sarees"
  description: string;
  price: number;
  discountedPrice?: number;
  stockQuantity: number;
  images: string[];
  videos: string[];
  instagramReels?: string[];
  youtubeVideos?: string[];
  instagramReelUrl?: string;
  metalType?: string; // "Gold" | "Silver" | "Platinum"
  purity?: string; // "18K" | "22K" | "24K"
  fabric?: string; // "Silk" | "Katan Silk" | "Chanderi Cotton"
  color?: string;
  occasion?: string;
  seoTitle?: string;
  seoDescription?: string;
  featured?: boolean;
  draft?: boolean;
  variants?: ProductVariant[];
  createdAt?: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  productImage: string;
  price: number;
  quantity: number;
  variant?: string;
}

export interface Order {
  id: string;
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
  paymentMethod: 'Razorpay' | 'COD';
  paymentStatus: 'Pending' | 'Paid' | 'Failed' | 'Refunded';
  orderStatus: 'New' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled' | 'Return Requested' | 'Refunded';
  trackingId?: string;
  trackingStatus?: string;
  courierName?: string;
  createdAt: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  refundReason?: string;
  returnReason?: string;
}

export interface User {
  id: string;
  email: string;
  passwordHash?: string;
  name: string;
  phone?: string;
  role: 'Super Admin' | 'Staff' | 'Customer';
  addresses?: {
    id: string;
    address: string;
    pincode: string;
    city: string;
    state: string;
    isDefault?: boolean;
  }[];
  googleId?: string;
  createdAt: string;
}

export interface Coupon {
  id: string;
  code: string; // uppercase code
  discountType: 'percentage' | 'flat';
  discountValue: number;
  minCartValue: number;
  maxDiscountCap?: number;
  expiryDate: string;
  usageLimit: number; // total times coupon can be used
  usageCount: number;
  active: boolean;
}

export interface Review {
  id: string;
  productId: string;
  customerName: string;
  rating: number; // 1-5
  text: string;
  image?: string; // base64 or URL
  video?: string; // base64 or URL
  approved: boolean;
  createdAt: string;
}

export interface CMSBanner {
  image: string;
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
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

export interface CMS {
  banners: CMSBanner[];
  blogs: CMSBlog[];
  legalPages: { [key: string]: string };
}

export interface Consultation {
  id: string;
  customerName: string;
  customerPhone: string;
  preferredTime: string;
  notes?: string;
  productId?: string;
  productName?: string;
  status: 'Pending' | 'Scheduled' | 'Completed';
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  userEmail: string;
  action: string;
  timestamp: string;
}

export interface DB {
  products: Product[];
  orders: Order[];
  users: User[];
  coupons: Coupon[];
  reviews: Review[];
  cms: CMS;
  consultations: Consultation[];
  logs: ActivityLog[];
}

const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'db.json');

// Helper to load raw file database
function loadRawDB(): DB {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Failed to load database file, generating defaults', err);
  }
  return generateDefaults();
}

// Helper to save database to file
function saveRawDB(db: DB) {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to save database file', err);
  }
}

// Generate premium default seeded data
function generateDefaults(): DB {
  const products: Product[] = [
    {
      id: "prod-necklace-1",
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
      id: "prod-bangle-1",
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
    },
    {
      id: "prod-ring-1",
      name: "Padma Ruby Solitaire Ring",
      category: "Rings",
      description: "Centering a hand-selected 2.5-carat oval Burmese Ruby, nested gracefully in a lotus-bud (Padma) 18K yellow gold setting, flanked by fine VS-clarity pavé-set brilliant-cut diamonds.",
      price: 42000,
      discountedPrice: 38000,
      stockQuantity: 5,
      images: [
        "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=1200&q=80"
      ],
      videos: [],
      metalType: "Gold",
      purity: "18K",
      occasion: "Engagement",
      featured: false,
      draft: false,
      variants: [
        { name: "Size 12", stock: 2 },
        { name: "Size 14", stock: 2 },
        { name: "Size 16", stock: 1 }
      ]
    },
    {
      id: "prod-saree-1",
      name: "Varanasi Katan Silk Brocade Saree",
      category: "Silk Sarees",
      description: "A spectacular royal handwoven pure Katan Silk saree from the looms of Banaras. It features a rich, dense golden zari hunting motif (Shikargah) woven entirely across the body, leading to an exquisite kadwa-woven pallu of incomparable elegance.",
      price: 35000,
      discountedPrice: 32500,
      stockQuantity: 3,
      images: [
        "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1200&q=80"
      ],
      videos: [],
      fabric: "Katan Silk",
      color: "Crimson Red",
      occasion: "Bridal",
      seoTitle: "Banarasi Crimson Red Katan Silk Saree - Neelu Vora",
      featured: true,
      draft: false,
      variants: [
        { name: "With Unstitched Blouse", stock: 3 }
      ]
    },
    {
      id: "prod-saree-2",
      name: "Chanderi Pastel Mint Zari Saree",
      category: "Cotton Sarees",
      description: "Exquisite and featherlight handloom cotton-silk Chanderi saree. Features fine hand-woven coin-shaped silver and gold zari buttis, trimmed with a classic horizontal borders. Sophisticated pastel charm for daytime festive affairs.",
      price: 12500,
      stockQuantity: 6,
      images: [
        "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=1200&q=80"
      ],
      videos: [],
      fabric: "Chanderi Cotton-Silk",
      color: "Pastel Mint",
      occasion: "Festive",
      featured: false,
      draft: false,
      variants: [
        { name: "Standard", stock: 6 }
      ]
    }
  ];

  const users: User[] = [
    {
      id: "usr-admin",
      email: "admin@neeluvora.com",
      passwordHash: "$2b$10$r8VpxbW92oPzP3T5W3W3WeMofB8eZ7fW3oOWeV5R2zF7fW6V.FzU6", // hashed "admin123"
      name: "Neelu Vora",
      role: "Super Admin",
      createdAt: new Date().toISOString()
    },
    {
      id: "usr-staff",
      email: "staff@neeluvora.com",
      passwordHash: "$2b$10$r8VpxbW92oPzP3T5W3W3WeMofB8eZ7fW3oOWeV5R2zF7fW6V.FzU6", // hashed "admin123"
      name: "Aarav Sharma",
      role: "Staff",
      createdAt: new Date().toISOString()
    },
    {
      id: "usr-customer",
      email: "customer@gmail.com",
      passwordHash: "$2b$10$r8VpxbW92oPzP3T5W3W3WeMofB8eZ7fW3oOWeV5R2zF7fW6V.FzU6", // hashed "admin123"
      name: "Devendra Pinako",
      phone: "+91 9876543210",
      role: "Customer",
      addresses: [
        {
          id: "addr-1",
          address: "Flat 405, Luxury Heights, Marine Drive",
          pincode: "400021",
          city: "Mumbai",
          state: "Maharashtra",
          isDefault: true
        }
      ],
      createdAt: new Date().toISOString()
    }
  ];

  const coupons: Coupon[] = [
    {
      id: "coup-festive",
      code: "FESTIVE10",
      discountType: "percentage",
      discountValue: 10,
      minCartValue: 15000,
      maxDiscountCap: 5000,
      expiryDate: "2027-01-01",
      usageLimit: 100,
      usageCount: 5,
      active: true
    },
    {
      id: "coup-royal",
      code: "ROYALROYAL",
      discountType: "flat",
      discountValue: 5000,
      minCartValue: 50000,
      expiryDate: "2027-01-01",
      usageLimit: 50,
      usageCount: 2,
      active: true
    }
  ];

  const reviews: Review[] = [
    {
      id: "rev-1",
      productId: "prod-necklace-1",
      customerName: "Sushma R.",
      rating: 5,
      text: "Absolutely stunning choker set. The gold shine is pristine and the Kundan stones have that true vintage look. It was the centerpiece of my bridal trousseau!",
      approved: true,
      createdAt: "2026-06-15T10:30:00Z"
    },
    {
      id: "rev-2",
      productId: "prod-saree-1",
      customerName: "Kriti M.",
      rating: 5,
      text: "The zari work is incredibly fine, pure silk drape is fantastic. Truly luxury heritage Banarasi. Highly recommend buying from Neelu Vora!",
      approved: true,
      createdAt: "2026-06-20T14:15:00Z"
    }
  ];

  const cms: CMS = {
    banners: [
      {
        image: "https://images.unsplash.com/photo-1601121141461-9d6647bca1ed?auto=format&fit=crop&w=1600&q=80",
        title: "Heritage Fine Jewelry",
        subtitle: "Handcrafted 22K Kundan Polki & Solitaire Rubies",
        ctaText: "Explore Collection",
        ctaLink: "/category/Necklaces"
      },
      {
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
      },
      {
        id: "blog-2",
        title: "Bridal Styling Guide: Draping the Banarasi Saree",
        excerpt: "How to perfectly pair heavy handwoven Katan silks with heritage temple jewelry for an authentic, breathtaking bridal look.",
        content: "The handloom Banarasi silk saree represents the pinnacle of Indian textile arts. Woven using pure mulberry silk threads (Katan) and real gold and silver metallic wire (Zari), these sarees are heirloom investments passed down across generations.\n\nWhen draping a Varanasi Katan Silk Brocade Saree for your wedding day, consider balancing the drape's visual volume with structural heritage ornaments. A classic royal kundan choker sits perfectly above a high or square-necked blouse, while heavy Mayura Filigree Kadas on the wrists anchor the rich metallic borders of the saree. We recommend a traditional seed-palla drape to prominently feature the elaborate zari hunt scenes (Shikargah) of the pallu, allowing the pure silk to catch the light beautifully.",
        image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80",
        date: "2026-06-28",
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
  };

  const orders: Order[] = [
    {
      id: "ord-1001",
      customerName: "Devendra Pinako",
      customerEmail: "davepinak0@gmail.com",
      customerMobile: "+91 9876543210",
      shippingAddress: "Flat 405, Luxury Heights, Marine Drive",
      pincode: "400021",
      city: "Mumbai",
      state: "Maharashtra",
      items: [
        {
          productId: "prod-saree-1",
          productName: "Varanasi Katan Silk Brocade Saree",
          productImage: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80",
          price: 32500,
          quantity: 1,
          variant: "With Unstitched Blouse"
        }
      ],
      subtotal: 32500,
      taxGst: 1625, // 5% GST for silk sarees
      shippingCharge: 0,
      discount: 0,
      total: 34125,
      paymentMethod: "Razorpay",
      paymentStatus: "Paid",
      orderStatus: "Processing",
      trackingId: "SR_9921004822",
      trackingStatus: "Dispatched from Mumbai Hub",
      courierName: "BlueDart",
      createdAt: "2026-06-30T11:00:00Z",
      razorpayOrderId: "order_Qz98110xskad",
      razorpayPaymentId: "pay_Qz985519askm"
    }
  ];

  const consultations: Consultation[] = [
    {
      id: "cons-1",
      customerName: "Radha V.",
      customerPhone: "+91 9922334455",
      preferredTime: "2026-07-05 14:00",
      notes: "Looking for customized bridal choker matching a green silk lehenga.",
      productId: "prod-necklace-1",
      productName: "Aishwarya Royal Kundan Choker",
      status: "Pending",
      createdAt: "2026-07-01T10:00:00Z"
    }
  ];

  const logs: ActivityLog[] = [
    {
      id: "log-1",
      userEmail: "admin@neeluvora.com",
      action: "Initial database seeded",
      timestamp: new Date().toISOString()
    }
  ];

  return {
    products,
    orders,
    users,
    coupons,
    reviews,
    cms,
    consultations,
    logs
  };
}

class Store {
  private db: DB;

  constructor() {
    this.db = loadRawDB();
  }

  getDB(): DB {
    return this.db;
  }

  save() {
    saveRawDB(this.db);
  }

  // Logger
  log(userEmail: string, action: string) {
    this.db.logs.unshift({
      id: 'log-' + Math.random().toString(36).substr(2, 9),
      userEmail,
      action,
      timestamp: new Date().toISOString()
    });
    // Keep last 100 logs
    if (this.db.logs.length > 100) {
      this.db.logs.pop();
    }
    this.save();
  }
}

export const dbInstance = new Store();
