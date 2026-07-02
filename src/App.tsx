import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Homepage from './components/Homepage';
import CollectionPage from './components/CollectionPage';
import ProductDetailPage from './components/ProductDetailPage';
import CartPage from './components/CartPage';
import CheckoutPage from './components/CheckoutPage';
import AccountPage from './components/AccountPage';
import AdminDashboard from './components/AdminDashboard';
import AdminPasswordPopup from './components/AdminPasswordPopup';
import LookbookPage from './components/LookbookPage';
import ChatbotWidget from './components/ChatbotWidget';
import { Product, CartItem, User, Coupon } from './types';
import { Sparkles, MapPin, Phone, Mail, Clock } from 'lucide-react';

export default function App() {
  // Navigation State Routing
  const [view, setView] = useState<'home' | 'collection' | 'product' | 'cart' | 'checkout' | 'account' | 'lookbook' | 'admin' | 'static'>('home');
  const [viewParams, setViewParams] = useState<any>({});

  // Global Products catalog
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);

  // Cart & Wishlist persistence
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);

  // User session state
  const [user, setUser] = useState<User | null>(null);

  // Admin authentication state
  const [isAdminAuth, setIsAdminAuth] = useState(false);

  // Active discount Coupon state
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);

  // Checkout Pricing State
  const [checkoutPricing, setCheckoutPricing] = useState({
    finalTotal: 0,
    subtotal: 0,
    gstTax: 0,
    shippingCharge: 0,
    discount: 0
  });

  // Fetch full products list on mount
  const fetchProductsCatalog = () => {
    setProductsLoading(true);
    fetch('/api/products')
      .then(res => res.json())
      .then((data: any) => {
        if (Array.isArray(data)) {
          setProducts(data);
        } else {
          setProducts([]);
        }
        setProductsLoading(false);
      })
      .catch(err => {
        console.error("Failed to load catalog products", err);
        setProductsLoading(false);
      });
  };

  useEffect(() => {
    fetchProductsCatalog();

    // Check if URL is /admin
    if (window.location.pathname === '/admin') {
      setView('admin');
    }

    // Handle browser navigation (back/forward)
    const handlePopState = () => {
      if (window.location.pathname === '/admin') {
        setView('admin');
      } else {
        setView('home');
      }
    };
    window.addEventListener('popstate', handlePopState);

    // Load persisted local stores
    const savedCart = localStorage.getItem('nm_cart');
    if (savedCart) {
      try { setCart(JSON.parse(savedCart)); } catch (e) {}
    }

    const savedWishlist = localStorage.getItem('nm_wishlist');
    if (savedWishlist) {
      try { setWishlist(JSON.parse(savedWishlist)); } catch (e) {}
    }

    const savedUser = localStorage.getItem('nm_user');
    if (savedUser) {
      try { setUser(JSON.parse(savedUser)); } catch (e) {}
    }

    const savedAdminToken = localStorage.getItem('nm_admin_token');
    if (savedAdminToken) {
      setIsAdminAuth(true);
    }

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Save Cart to local Storage on change
  useEffect(() => {
    localStorage.setItem('nm_cart', JSON.stringify(cart));
  }, [cart]);

  // Save Wishlist to local Storage on change
  useEffect(() => {
    localStorage.setItem('nm_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  // Save User session to local Storage on change
  useEffect(() => {
    if (user) {
      localStorage.setItem('nm_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('nm_user');
    }
  }, [user]);

  // Navigation controller
  const handleNavigate = (newView: typeof view, params: any = {}) => {
    setView(newView);
    setViewParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Synchronize browser path for /admin route
    if (newView === 'admin') {
      window.history.pushState({}, '', '/admin');
    } else if (window.location.pathname === '/admin') {
      window.history.pushState({}, '', '/');
    }
  };

  // Add item to shopping cart (handles price adjustments & duplicates)
  const handleAddToCart = (product: Product, quantity: number, selectedVariant?: string) => {
    const variantObj = product.variants?.find(v => v.name === selectedVariant);
    const priceAdjust = variantObj?.priceAdjust || 0;
    const itemPrice = (product.discountedPrice || product.price) + priceAdjust;

    setCart(prev => {
      const existingIdx = prev.findIndex(item => 
        item.product.id === product.id && item.selectedVariant === selectedVariant
      );

      if (existingIdx > -1) {
        // Increment quantity safely
        const updated = [...prev];
        const newQty = updated[existingIdx].quantity + quantity;
        updated[existingIdx].quantity = Math.min(variantObj ? variantObj.stock : product.stockQuantity, newQty);
        return updated;
      } else {
        // Add new line
        return [...prev, {
          product,
          quantity,
          selectedVariant,
          price: itemPrice
        }];
      }
    });
  };

  // Quick buy list card trigger
  const handleQuickAdd = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    const defaultVar = product.variants && product.variants.length > 0 ? product.variants[0].name : undefined;
    handleAddToCart(product, 1, defaultVar);
  };

  const handleUpdateQuantity = (index: number, quantity: number) => {
    setCart(prev => {
      const updated = [...prev];
      updated[index].quantity = quantity;
      return updated;
    });
  };

  const handleRemoveCartItem = (index: number) => {
    setCart(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleToggleWishlist = (productId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setWishlist(prev => 
      prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]
    );
  };

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    handleNavigate('account');
  };

  const handleLogout = () => {
    setUser(null);
    setCart([]);
    setWishlist([]);
    setAppliedCoupon(null);
    localStorage.removeItem('nm_user');
    localStorage.removeItem('nm_cart');
    localStorage.removeItem('nm_wishlist');
    handleNavigate('home');
  };

  const handleClearCart = () => {
    setCart([]);
    setAppliedCoupon(null);
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-luxury-cream text-luxury-black font-sans">
      
      {/* 1. Global Navigation Bar */}
      <Navbar
        currentView={view}
        onNavigate={handleNavigate}
        cartCount={cart.reduce((acc, i) => acc + i.quantity, 0)}
        wishlistCount={wishlist.length}
        user={user}
        onLogout={handleLogout}
      />

      {/* 2. Primary Route View Switcher */}
      <main className="flex-grow">
        {productsLoading ? (
          <div className="flex flex-col items-center justify-center py-40 text-gray-400 font-serif">
            <span className="animate-spin text-gold-600 text-3xl mb-4 font-bold">⚜</span>
            <span>Unsealing the Neelu Vora Vaults...</span>
          </div>
        ) : (
          <>
            {/* View: Home */}
            {view === 'home' && (
              <Homepage
                products={products}
                onNavigate={handleNavigate}
                wishlist={wishlist}
                onToggleWishlist={handleToggleWishlist}
                onAddToCart={handleQuickAdd}
              />
            )}

            {/* View: Catalog Collection */}
            {view === 'collection' && (
              <CollectionPage
                initialCategory={viewParams.category}
                initialQuery={viewParams.q}
                onNavigate={handleNavigate}
                wishlist={wishlist}
                onToggleWishlist={handleToggleWishlist}
                onAddToCart={handleQuickAdd}
              />
            )}

            {/* View: Product Details */}
            {view === 'product' && (
              <ProductDetailPage
                productId={viewParams.id}
                onNavigate={handleNavigate}
                isWishlisted={wishlist.includes(viewParams.id)}
                onToggleWishlist={handleToggleWishlist}
                onAddToCart={handleAddToCart}
                products={products}
              />
            )}

            {/* View: Cart page */}
            {view === 'cart' && (
              <CartPage
                cartItems={cart}
                onUpdateQuantity={handleUpdateQuantity}
                onRemoveItem={handleRemoveCartItem}
                onNavigate={(newV, params) => {
                  if (newV === 'checkout') {
                    setCheckoutPricing(params);
                    handleNavigate('checkout');
                  } else {
                    handleNavigate(newV, params);
                  }
                }}
                onApplyCoupon={setAppliedCoupon}
                appliedCoupon={appliedCoupon}
              />
            )}

            {/* View: Checkout Gate */}
            {view === 'checkout' && (
              <CheckoutPage
                cartItems={viewParams.isBuyNow ? [viewParams.buyNowItem] : cart}
                user={user}
                pricing={viewParams.isBuyNow ? viewParams.pricing : checkoutPricing}
                onClearCart={viewParams.isBuyNow ? () => {} : handleClearCart}
                onNavigate={handleNavigate}
              />
            )}

            {/* View: User Account Board */}
            {view === 'account' && (
              <AccountPage
                user={user}
                onLogin={handleLogin}
                onLogout={handleLogout}
                onNavigate={handleNavigate}
                wishlist={wishlist}
                products={products}
              />
            )}

            {/* View: Shop the Look Reels */}
            {view === 'lookbook' && (
              <LookbookPage
                products={products}
                onNavigate={handleNavigate}
              />
            )}

            {/* View: Back-Office Admin console */}
            {view === 'admin' && (
              isAdminAuth ? (
                <AdminDashboard
                  onNavigate={handleNavigate}
                  products={products}
                  onRefreshProducts={fetchProductsCatalog}
                  onAdminLogout={() => {
                    setIsAdminAuth(false);
                    localStorage.removeItem('nm_admin_token');
                    handleNavigate('home');
                  }}
                />
              ) : (
                <AdminPasswordPopup
                  onSuccess={(token: string) => {
                    localStorage.setItem('nm_admin_token', token);
                    setIsAdminAuth(true);
                  }}
                  onCancel={() => {
                    handleNavigate('home');
                  }}
                />
              )
            )}

            {/* View: Static Legal Pages */}
            {view === 'static' && (
              <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fadeIn bg-white border border-gold-200/50 rounded shadow-sm my-10 font-sans text-xs sm:text-sm leading-relaxed text-gray-600">
                
                {viewParams.isBlog ? (
                  /* Editorial Blog post */
                  <article className="space-y-6">
                    <div className="text-center pb-6 border-b border-gold-100">
                      <span className="text-gold-600 text-[10px] uppercase tracking-[0.3em] font-bold block mb-2">Chronicles entry</span>
                      <h1 className="font-serif text-2xl sm:text-4xl font-bold text-luxury-black mb-3">{viewParams.blog.title}</h1>
                      <div className="text-gray-400 text-xs font-mono">
                        <span>By {viewParams.blog.author}</span>
                        <span className="mx-2">•</span>
                        <span>{new Date(viewParams.blog.date).toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    <div className="aspect-video bg-luxury-cream overflow-hidden rounded">
                      <img src={viewParams.blog.image} alt="" className="w-full h-full object-cover" />
                    </div>

                    <div className="space-y-4 font-sans text-gray-700 leading-relaxed pt-4">
                      <p className="font-bold font-serif text-base text-luxury-black">{viewParams.blog.excerpt}</p>
                      <p>{viewParams.blog.content}</p>
                    </div>
                  </article>
                ) : (
                  /* Standard Legal Static Page */
                  <div className="space-y-8">
                    {viewParams.page === 'shipping' && (
                      <div className="space-y-4">
                        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-luxury-black tracking-wide border-b border-gold-100 pb-3 uppercase">Shipping & Delivery Policy</h1>
                        <p>Neelu Vora Haute Atelier ensures highly insured, professional transit solutions for all high-value fine jewelry and luxury apparel.</p>
                        <h4 className="font-bold text-luxury-black">1. Armored Logistics</h4>
                        <p>Fine jewelry pieces exceeding ₹50,000 are escorted via specialized bullet-insured logistics carriers (Sequre, BVC Express). Your signature is strictly authenticated against state identification documents before parcel handover.</p>
                        <h4 className="font-bold text-luxury-black">2. Timelines</h4>
                        <p>All items in stock are shipped within 48 hours of credit clearance. Metros delivery maps take 3-5 business days. Remote locations, Jammu-Kashmir, and Northeast territories require 7-10 business days.</p>
                      </div>
                    )}

                    {viewParams.page === 'return' && (
                      <div className="space-y-4">
                        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-luxury-black tracking-wide border-b border-gold-100 pb-3 uppercase">Returns, Exchanges & Refunds</h1>
                        <p>We preserve our crafting trust values. Policies differ by collection categories:</p>
                        <h4 className="font-bold text-luxury-black">1. Fine Jewelry</h4>
                        <p>Eligible for return or resize exchange within <strong>3 days</strong> of delivery. Return items undergo rigorous weight audits, gem inspection, and gold laboratory assays upon return. Any missing safety tags, micro-abrasions, or customized initials invalidate returns.</p>
                        <h4 className="font-bold text-luxury-black">2. Handloomed Apparel</h4>
                        <p>Sarees are returnable within <strong>7 days</strong>. Fabrics must remain untampered, unworn, and folded inside original designer presentation drawers.</p>
                      </div>
                    )}

                    {viewParams.page === 'terms' && (
                      <div className="space-y-4">
                        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-luxury-black tracking-wide border-b border-gold-100 pb-3 uppercase">Terms & Conditions</h1>
                        <p>Welcome to Neelu Vora Fashion. By exploring our digital salon or commissioning jewelry items, you bind yourself to the following legal terms:</p>
                        <p>All gold prices published represent dynamic 22K/24K spot market references and are subject to minor settlement day adjustments. Images displayed are high-fidelity captures; slight weave variations in handcrafted Varanasi silk are intrinsic natural characteristics of manual looming arts and do not represent defects.</p>
                      </div>
                    )}

                    {viewParams.page === 'privacy' && (
                      <div className="space-y-4">
                        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-luxury-black tracking-wide border-b border-gold-100 pb-3 uppercase">Privacy Policy</h1>
                        <p>Your privacy is a Maison honor. We strictly encrypt client records, address registers, and Razorpay signature logs.</p>
                        <p>We never sell your phone numbers or wedding registry coordinates to third-party marketing companies. Personal metadata is preserved under secured firewalls for private viewing appointment dispatching and order transport logistics only.</p>
                      </div>
                    )}

                    {viewParams.page === 'about' && (
                      <div className="space-y-4">
                        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-luxury-black tracking-wide border-b border-gold-100 pb-3 uppercase">The Maison Heritage</h1>
                        <p>For three generations, the House of Neelu Vora has stood as an elegant beacon of classic Indian royal couture.</p>
                        <p>Beginning as a private jewelry commission room in Jaipur, our atelier expanded into a unified, full-scale maison in Colaba, Mumbai. Our hand-forging goldsmiths preserve intricate Mughal-era filigree work and hand-weave Banarasi brocade, offering legacy bridal wardrobes designed to endure forever.</p>
                      </div>
                    )}

                    {viewParams.page === 'contact' && (
                      <div className="space-y-6">
                        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-luxury-black tracking-wide border-b border-gold-100 pb-3 uppercase">The Colaba Atelier</h1>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-4">
                          <div className="space-y-4 text-xs font-sans">
                            <h4 className="font-serif text-sm font-bold text-luxury-black">Atelier Coordinates</h4>
                            <p className="flex items-start gap-2">
                              <MapPin size={16} className="text-gold-600 shrink-0" />
                              <span>Neelu Vora Flagship, Ground Floor, Royal Chambers, Colaba Causeway, Mumbai, Maharashtra 400005</span>
                            </p>
                            <p className="flex items-center gap-2">
                              <Phone size={16} className="text-gold-600" />
                              <span>+91 22 4599 0000 (Concierge desk)</span>
                            </p>
                            <p className="flex items-center gap-2">
                              <Mail size={16} className="text-gold-600" />
                              <span>concierge@neeluvora.com</span>
                            </p>
                            <p className="flex items-center gap-2">
                              <Clock size={16} className="text-gold-600" />
                              <span>Tues-Sun: 11:00 AM - 08:30 PM (Mondays private view only)</span>
                            </p>
                          </div>

                          <div className="bg-luxury-cream border border-gold-200 rounded p-6 flex flex-col justify-center text-center">
                            <span className="text-gold-600 text-3xl font-bold block mb-2">⚜</span>
                            <h4 className="font-serif text-sm font-bold text-luxury-black uppercase tracking-wide mb-1">Private Viewing Room</h4>
                            <p className="text-[10px] text-gray-500 max-w-xs mx-auto mb-4 leading-relaxed">Schedule a private, high-security showroom session to try chokers or custom design engagement rings.</p>
                            <button
                              onClick={() => handleNavigate('collection')}
                              className="bg-luxury-black hover:bg-gold-600 hover:text-black text-white font-bold text-[9px] uppercase tracking-widest py-2 rounded transition"
                            >
                              Request Showroom pass
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

              </div>
            )}
          </>
        )}
      </main>

      {/* 3. Floating Gemini Concierge AI Assistant */}
      <ChatbotWidget />

      {/* 4. Global Footer Section */}
      <Footer onNavigate={handleNavigate} />

    </div>
  );
}
