export interface ProductVariant {
  name: string;
  stock: number;
  priceAdjust?: number;
}

export interface Product {
  id: string;
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
  createdAt?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedVariant?: string;
  price: number; // Adjusted price based on variant
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'Super Admin' | 'Staff' | 'Customer';
  phone?: string;
  addresses?: {
    id: string;
    address: string;
    pincode: string;
    city: string;
    state: string;
    isDefault?: boolean;
  }[];
}

export interface Coupon {
  id: string;
  code: string;
  discountType: 'percentage' | 'flat';
  discountValue: number;
  minCartValue: number;
  maxDiscountCap?: number;
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

export interface Review {
  id: string;
  productId: string;
  customerName: string;
  rating: number;
  text: string;
  image?: string;
  video?: string;
  approved: boolean;
  createdAt: string;
}

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
