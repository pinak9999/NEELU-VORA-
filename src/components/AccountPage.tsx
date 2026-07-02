import React, { useState, useEffect } from 'react';
import { User, Order, Product } from '../types';
import { Shield, Package, Heart, MapPin, Key, Download, RefreshCcw, Eye, ArrowRight, CheckCircle, Clock } from 'lucide-react';

interface AccountPageProps {
  user: User | null;
  onLogin: (user: User) => void;
  onLogout: () => void;
  onNavigate: (view: any, params?: any) => void;
  wishlist: string[];
  products: Product[]; // to map wishlist ids to product details
}

export default function AccountPage({
  user,
  onLogin,
  onLogout,
  onNavigate,
  wishlist,
  products
}: AccountPageProps) {
  
  const [activeTab, setActiveTab] = useState<'orders' | 'wishlist' | 'profile' | 'login'>('login');

  // Auth Forms State
  const [isSignUp, setIsSignUp] = useState(false);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Orders list
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // Return request modal states
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [targetReturnOrder, setTargetReturnOrder] = useState<Order | null>(null);
  const [returnReason, setReturnReason] = useState('Size misfit');
  const [customReturnReason, setCustomReturnReason] = useState('');
  const [returnSuccess, setReturnSuccess] = useState(false);

  // Invoice visualizer overlay
  const [invoiceOrder, setInvoiceOrder] = useState<Order | null>(null);

  // Sync tab with initial user state
  useEffect(() => {
    if (user) {
      setActiveTab('orders');
    } else {
      setActiveTab('login');
    }
  }, [user]);

  // Fetch orders if logged in
  useEffect(() => {
    if (user && activeTab === 'orders') {
      setOrdersLoading(true);
      fetch(`/api/orders?email=${encodeURIComponent(user.email)}`)
        .then(res => res.json())
        .then((data: Order[]) => {
          setOrders(data);
          setOrdersLoading(false);
        })
        .catch(err => {
          console.error(err);
          setOrdersLoading(false);
        });
    }
  }, [user, activeTab]);

  // Handle Login or Signup submission
  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail || !authPassword) return;

    setAuthError('');
    setAuthLoading(true);

    const endpoint = isSignUp ? '/api/auth/register' : '/api/auth/login';
    const payload = isSignUp 
      ? { email: authEmail, password: authPassword, name: authName, phone: authPhone }
      : { email: authEmail, password: authPassword };

    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Authentication failed');
        return data as User;
      })
      .then((loggedInUser: User) => {
        onLogin(loggedInUser);
        setAuthLoading(false);
      })
      .catch(err => {
        setAuthError(err.message);
        setAuthLoading(false);
      });
  };

  // Trigger Return Request (Section 12.3)
  const submitReturnRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetReturnOrder) return;

    const finalReason = returnReason === 'Other' ? customReturnReason : returnReason;

    fetch(`/api/orders/${targetReturnOrder.id}/return`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ returnReason: finalReason })
    })
      .then(res => res.json())
      .then((updatedOrder: Order) => {
        // Update local orders list state
        setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
        setReturnSuccess(true);
        setTimeout(() => {
          setShowReturnModal(false);
          setReturnSuccess(false);
          setTargetReturnOrder(null);
          setCustomReturnReason('');
        }, 2000);
      })
      .catch(err => console.error(err));
  };

  // Map Wishlist product details from IDs
  const wishlistProducts = products.filter(p => wishlist.includes(p.id));

  return (
    <div id="account-view-container" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fadeIn">
      
      {user ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Left Column: Sidebar panel navigation */}
          <aside className="lg:col-span-1 bg-white border border-gold-200/50 p-6 rounded shadow-sm self-start">
            <div className="text-center pb-6 border-b border-gold-100 mb-6">
              <span className="text-gold-600 text-3xl font-bold block mb-1">⚜</span>
              <h3 className="font-serif text-lg font-bold text-luxury-black">{user.name}</h3>
              <p className="text-[10px] uppercase text-gold-600 font-semibold tracking-wider">{user.role}</p>
            </div>

            <nav className="space-y-2 flex flex-col">
              <button
                id="account-orders-tab"
                onClick={() => setActiveTab('orders')}
                className={`w-full text-left px-4 py-3 rounded text-xs font-bold uppercase tracking-wider flex items-center space-x-2 transition ${activeTab === 'orders' ? 'bg-luxury-black text-white' : 'text-gray-600 hover:bg-gold-50/50'}`}
              >
                <Package size={14} />
                <span>My Orders Board</span>
              </button>
              <button
                id="account-wishlist-tab"
                onClick={() => setActiveTab('wishlist')}
                className={`w-full text-left px-4 py-3 rounded text-xs font-bold uppercase tracking-wider flex items-center space-x-2 transition ${activeTab === 'wishlist' ? 'bg-luxury-black text-white' : 'text-gray-600 hover:bg-gold-50/50'}`}
              >
                <Heart size={14} />
                <span>My Wishlist ({wishlist.length})</span>
              </button>
              <button
                id="account-profile-tab"
                onClick={() => setActiveTab('profile')}
                className={`w-full text-left px-4 py-3 rounded text-xs font-bold uppercase tracking-wider flex items-center space-x-2 transition ${activeTab === 'profile' ? 'bg-luxury-black text-white' : 'text-gray-600 hover:bg-gold-50/50'}`}
              >
                <MapPin size={14} />
                <span>Shipping Directories</span>
              </button>
              <button
                id="account-logout-btn"
                onClick={onLogout}
                className="w-full text-left px-4 py-3 rounded text-xs font-bold uppercase tracking-wider text-red-500 hover:bg-red-50 transition border-t border-gold-100/50 mt-4"
              >
                Sign Out
              </button>
            </nav>
          </aside>

          {/* Right Column: Dynamic screens content */}
          <main className="lg:col-span-3">
            
            {/* 1. ORDERS BOARD */}
            {activeTab === 'orders' && (
              <div className="space-y-6">
                <h2 className="font-serif text-2xl font-bold text-luxury-black tracking-wide border-b border-gold-100 pb-3 mb-6">
                  Your Maison Orders
                </h2>

                {ordersLoading ? (
                  <div className="text-center py-16 text-gray-400">
                    <span className="animate-spin text-gold-600 font-bold block mb-2 text-xl">⚜</span>
                    <span>Retrieving order ledger...</span>
                  </div>
                ) : orders.length === 0 ? (
                  <div className="bg-white border border-gold-200/50 rounded text-center py-16 px-6">
                    <Package className="text-gold-400 mx-auto mb-3" size={32} />
                    <h4 className="font-serif text-base font-bold text-luxury-black">No Orders Placed Yet</h4>
                    <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1 mb-6">Discover handwoven sarees and bespoke rings to initialize your legacy catalog.</p>
                    <button onClick={() => onNavigate('collection')} className="bg-gold-600 text-black font-bold text-[10px] uppercase tracking-widest px-6 py-2.5 rounded transition">Browse Catalog</button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {orders.map(order => (
                      <div key={order.id} id={`order-card-${order.id}`} className="bg-white border border-gold-200/40 rounded p-6 shadow-sm space-y-6">
                        
                        {/* Order Header */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gold-100 pb-4 gap-2">
                          <div>
                            <span className="block text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Order placed {new Date(order.createdAt).toLocaleDateString()}</span>
                            <span className="block font-mono text-xs font-bold text-luxury-black mt-0.5">ID Reference: #{order.id}</span>
                          </div>
                          <div className="text-left sm:text-right">
                            <span className="block text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Total Settle</span>
                            <span className="block font-mono text-sm font-bold text-gold-700">₹{order.total.toLocaleString()}</span>
                          </div>
                        </div>

                        {/* Visual Progress Timeline (New -> Processing -> Shipped -> Delivered) */}
                        <div className="py-2">
                          <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider block mb-4">Courier Progress Tracers</span>
                          <div className="grid grid-cols-4 text-center text-[10px] font-bold uppercase relative">
                            {/* Track line behind */}
                            <div className="absolute top-2 left-[12.5%] right-[12.5%] h-0.5 bg-gold-200 z-0" />
                            
                            {/* timeline states */}
                            {['New', 'Processing', 'Shipped', 'Delivered'].map((statusStep, stepIdx) => {
                              const stepMap: Record<string, number> = { 'New': 0, 'Processing': 1, 'Shipped': 2, 'Delivered': 3 };
                              const activeIdx = stepMap[order.orderStatus] !== undefined ? stepMap[order.orderStatus] : (order.orderStatus === 'Cancelled' ? -1 : 1);
                              const isPassed = stepIdx <= activeIdx;
                              
                              return (
                                <div key={statusStep} className="flex flex-col items-center relative z-10">
                                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center text-[8px] transition-all ${isPassed ? 'bg-gold-500 border-gold-600 text-black' : 'bg-white border-gold-200 text-gray-300'}`}>
                                    {isPassed ? '✓' : ''}
                                  </div>
                                  <span className={`mt-2 font-sans tracking-wide text-[9px] ${isPassed ? 'text-luxury-black' : 'text-gray-400'}`}>
                                    {statusStep}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                          
                          {order.trackingId && (
                            <div className="mt-4 bg-gold-50 p-2.5 rounded border border-gold-200/50 flex flex-wrap justify-between items-center text-[10px] font-mono">
                              <div>
                                <span className="text-gray-500">Logistics partner: </span>
                                <strong className="text-luxury-black">{order.courierName || 'Shiprocket'}</strong>
                              </div>
                              <div>
                                <span className="text-gray-500">Tracking Reference: </span>
                                <strong className="text-gold-800">{order.trackingId}</strong>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Order Items Breakdown */}
                        <div className="space-y-3 pt-2">
                          {order.items.map((item, itemIdx) => (
                            <div key={itemIdx} className="flex items-center justify-between text-xs font-sans">
                              <div className="flex items-center space-x-3">
                                <img src={item.productImage} alt="" className="w-8 h-10 object-cover rounded border border-gold-100" />
                                <div>
                                  <span className="font-bold text-luxury-black block">{item.productName}</span>
                                  <span className="text-[9px] text-gray-400 block">Qty {item.quantity} {item.variant ? `• Variant: ${item.variant}` : ''}</span>
                                </div>
                              </div>
                              <span className="font-mono text-gray-700 font-semibold">₹{(item.price * item.quantity).toLocaleString()}</span>
                            </div>
                          ))}
                        </div>

                        {/* Action Operations: Invoice PDF downloads & Returns triggers */}
                        <div className="flex flex-wrap gap-3 pt-4 border-t border-gold-100/50">
                          
                          {/* Print Invoice */}
                          <button
                            id={`invoice-trigger-${order.id}`}
                            onClick={() => setInvoiceOrder(order)}
                            className="bg-gold-50 hover:bg-gold-100 text-gold-800 rounded px-4 py-2 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition"
                          >
                            <Download size={13} />
                            <span>Download GST Invoice</span>
                          </button>

                          {/* Request Return & Refund */}
                          {order.orderStatus === 'Delivered' && (
                            <button
                              id={`return-trigger-${order.id}`}
                              onClick={() => { setTargetReturnOrder(order); setShowReturnModal(true); }}
                              className="border border-gold-300 hover:border-red-500 hover:text-red-500 text-gray-600 rounded px-4 py-2 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition bg-white"
                            >
                              <RefreshCcw size={13} />
                              <span>Request Return / Refund</span>
                            </button>
                          )}

                          {order.orderStatus === 'Return Requested' && (
                            <span className="text-gold-700 bg-gold-50 border border-gold-300 px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider">
                              ✓ Return request Processing
                            </span>
                          )}

                          {order.orderStatus === 'Refunded' && (
                            <span className="text-red-700 bg-red-50 border border-red-300 px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider">
                              Refund settled ({order.refundReason || 'Settled'})
                            </span>
                          )}

                        </div>

                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 2. WISHLIST BOARD */}
            {activeTab === 'wishlist' && (
              <div>
                <h2 className="font-serif text-2xl font-bold text-luxury-black tracking-wide border-b border-gold-100 pb-3 mb-6">
                  Your Curated Wishlist
                </h2>

                {wishlistProducts.length === 0 ? (
                  <p className="text-xs text-gray-500 italic">No masterpieces have been curated to your wishlist board yet. Explore our designer gold links or Banarasi sarees!</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {wishlistProducts.map(p => (
                      <div
                        key={p.id}
                        className="group border border-gold-200/40 bg-white rounded overflow-hidden shadow-sm flex flex-col justify-between"
                      >
                        <div className="aspect-[4/5] bg-luxury-cream overflow-hidden relative">
                          <img src={p.images[0]} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div className="p-4 flex-1 flex flex-col justify-between">
                          <div>
                            <h4 className="font-serif text-sm font-bold text-luxury-black line-clamp-1">{p.name}</h4>
                            <p className="text-[9px] text-gold-600 uppercase tracking-widest font-semibold mt-1">{p.category}</p>
                          </div>
                          <div className="flex justify-between items-baseline mt-4 pt-3 border-t border-gold-100">
                            <span className="font-mono text-xs font-bold text-luxury-black">₹{(p.discountedPrice || p.price).toLocaleString()}</span>
                            <button
                              onClick={() => onNavigate('product', { id: p.id })}
                              className="text-[9px] uppercase font-bold text-gold-600 hover:underline tracking-widest"
                            >
                              Shop &rarr;
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 3. PROFILE DIRECTORIES */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <h2 className="font-serif text-2xl font-bold text-luxury-black tracking-wide border-b border-gold-100 pb-3 mb-6">
                  Profile shipping Directories
                </h2>

                <div className="bg-white border border-gold-200/50 rounded p-6 shadow-sm">
                  <h4 className="font-serif text-base font-bold text-luxury-black mb-4 uppercase tracking-wide">Contact parameters</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                    <div className="p-3 bg-gold-50/50 border border-gold-100 rounded">
                      <span className="text-gray-400 uppercase block text-[9px] font-bold">Client Email</span>
                      <strong className="text-luxury-black mt-1 block">{user.email}</strong>
                    </div>
                    <div className="p-3 bg-gold-50/50 border border-gold-100 rounded">
                      <span className="text-gray-400 uppercase block text-[9px] font-bold">Client Name</span>
                      <strong className="text-luxury-black mt-1 block">{user.name}</strong>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gold-200/50 rounded p-6 shadow-sm">
                  <h4 className="font-serif text-base font-bold text-luxury-black mb-4 uppercase tracking-wide">Saved Delivery Addresses</h4>
                  {user.addresses && user.addresses.length > 0 ? (
                    <div className="space-y-3">
                      {user.addresses.map((addr, idx) => (
                        <div key={idx} className="p-3 border border-gold-200 rounded text-xs leading-relaxed font-sans relative">
                          {addr.isDefault && (
                            <span className="absolute top-3 right-3 text-[9px] uppercase font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                              Primary address
                            </span>
                          )}
                          <p className="font-semibold text-luxury-black">{addr.address}</p>
                          <p className="text-gray-500 mt-1">{addr.city}, {addr.state} - {addr.pincode}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 italic">No addresses saved. Directories will record on your first checkout settlement!</p>
                  )}
                </div>
              </div>
            )}

          </main>

        </div>
      ) : (
        /* 4. LOGIN / REGISTRATION PANEL FOR GUESTS */
        <div id="login-form-panel" className="max-w-md mx-auto bg-white border border-gold-300 rounded-lg p-6 sm:p-10 shadow-2xl animate-fadeIn">
          
          <div className="text-center mb-8">
            <span className="text-gold-600 text-3xl font-bold block mb-1">⚜</span>
            <h2 className="font-serif text-2xl font-bold text-luxury-black tracking-wide uppercase">
              {isSignUp ? 'Create Atelier Account' : 'Maison Client Sign In'}
            </h2>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">
              Secure client records dashboard
            </p>
          </div>

          {authError && (
            <div className="bg-red-50 text-red-700 border-l-4 border-red-500 p-3 rounded text-xs font-semibold mb-6">
              {authError}
            </div>
          )}

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {isSignUp && (
              <div>
                <label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Your Full Name</label>
                <input
                  id="auth-name-field"
                  type="text"
                  required
                  placeholder="e.g. Suman Sen"
                  value={authName}
                  onChange={(e) => setAuthName(e.target.value)}
                  className="w-full border border-gold-300 text-xs rounded px-3 py-2 text-gray-700 focus:outline-none focus:border-gold-600"
                />
              </div>
            )}

            <div>
              <label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Registered Email Address</label>
              <input
                id="auth-email-field"
                type="email"
                required
                placeholder="e.g. concierge@client.com"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                className="w-full border border-gold-300 text-xs rounded px-3 py-2 text-gray-700 focus:outline-none focus:border-gold-600"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Secure Password</label>
              <input
                id="auth-password-field"
                type="password"
                required
                placeholder="••••••••"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                className="w-full border border-gold-300 text-xs rounded px-3 py-2 text-gray-700 focus:outline-none focus:border-gold-600"
              />
            </div>

            {isSignUp && (
              <div>
                <label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Mobile Contact (WhatsApp updates)</label>
                <input
                  id="auth-phone-field"
                  type="tel"
                  placeholder="e.g. +91 99999 12345"
                  value={authPhone}
                  onChange={(e) => setAuthPhone(e.target.value)}
                  className="w-full border border-gold-300 text-xs rounded px-3 py-2 text-gray-700 focus:outline-none focus:border-gold-600"
                />
              </div>
            )}

            <button
              id="auth-submit-btn"
              type="submit"
              disabled={authLoading}
              className="w-full bg-luxury-black hover:bg-gold-600 hover:text-black text-white font-bold text-xs tracking-widest uppercase py-3.5 transition rounded flex items-center justify-center gap-1.5"
            >
              {authLoading ? 'Verifying Credentials...' : (isSignUp ? 'Create Account' : 'Sign In To Atelier')}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-gold-100 text-center text-xs">
            <p className="text-gray-500">
              {isSignUp ? 'Already registered on our client desk?' : 'First time purchasing at Neelu Vora?'}
            </p>
            <button
              id="auth-toggle-mode-btn"
              onClick={() => { setIsSignUp(!isSignUp); setAuthError(''); }}
              className="text-gold-700 hover:text-gold-900 font-bold uppercase mt-1.5 tracking-wider hover:underline"
            >
              {isSignUp ? 'Sign In Instead' : 'Create Guest Account'}
            </button>
          </div>

        </div>
      )}

      {/* MODAL 1: DYNAMIC ORDER RETURNS SUBMISSIONS */}
      {showReturnModal && targetReturnOrder && (
        <div id="return-modal-overlay" className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white border border-gold-300 rounded max-w-md w-full p-6 relative animate-scaleUp">
            
            <button onClick={() => setShowReturnModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-black">&times;</button>

            {returnSuccess ? (
              <div className="text-center py-6">
                <span className="text-3xl block mb-2 text-emerald-700 font-bold">⚜</span>
                <h4 className="font-serif text-base font-bold text-luxury-black uppercase tracking-wide">Request Logged</h4>
                <p className="text-[11px] text-gray-500 max-w-xs mx-auto mt-1">Our concierge agent is dispatching a lab inspection or fold checking package checklist.</p>
              </div>
            ) : (
              <form onSubmit={submitReturnRequest} className="space-y-4">
                <div className="text-center mb-4">
                  <span className="text-gold-600 text-[9px] uppercase tracking-[0.2em] font-bold block mb-1">Atelier Protection Policy</span>
                  <h3 className="font-serif text-base font-bold text-luxury-black uppercase tracking-wide">Request Return & Refund</h3>
                  <p className="text-[10px] text-gray-500 mt-1">For order: #{targetReturnOrder.id}</p>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Reason for Return</label>
                  <select
                    id="return-reason-select"
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value)}
                    className="w-full border border-gold-300 text-xs rounded p-2 text-gray-700 focus:outline-none focus:border-gold-600 font-semibold cursor-pointer"
                  >
                    <option value="Size misfit">Size misfit (requires alternative Kada/Saree border)</option>
                    <option value="Lab inspection check">Request gold lab inspection verification</option>
                    <option value="Unsatisfied with drape border">Apparel handloom weave texture difference</option>
                    <option value="Other">Other reason (describe below)</option>
                  </select>
                </div>

                {returnReason === 'Other' && (
                  <div>
                    <label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Describe Reason</label>
                    <textarea
                      id="custom-return-reason-text"
                      required
                      rows={2}
                      placeholder="Please details why you wish to return this legacy creation..."
                      value={customReturnReason}
                      onChange={(e) => setCustomReturnReason(e.target.value)}
                      className="w-full border border-gold-300 text-xs rounded px-3 py-2 text-gray-700 focus:outline-none"
                    />
                  </div>
                )}

                <button
                  id="return-submit-btn"
                  type="submit"
                  className="w-full bg-luxury-black hover:bg-gold-600 hover:text-black text-white font-bold text-xs uppercase tracking-widest py-3 transition rounded"
                >
                  Submit Return Claim
                </button>
              </form>
            )}

          </div>
        </div>
      )}

      {/* MODAL 2: PRINTER-FRIENDLY GST INVOICE VISUALIZER (Section 12.1) */}
      {invoiceOrder && (
        <div id="invoice-modal-overlay" className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white text-black p-6 sm:p-10 rounded shadow-2xl max-w-2xl w-full relative my-8 font-sans border-t-[8px] border-luxury-black">
            
            {/* Modal Controls */}
            <div className="absolute top-4 right-4 flex space-x-3 print:hidden">
              <button
                onClick={() => window.print()}
                className="bg-gold-600 text-black px-3 py-1.5 text-xs font-bold uppercase rounded flex items-center gap-1 hover:bg-gold-500"
              >
                <span>Print Invoice</span>
              </button>
              <button
                onClick={() => setInvoiceOrder(null)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-1.5 text-xs font-bold uppercase rounded"
              >
                Close
              </button>
            </div>

            {/* Print Header */}
            <div className="flex justify-between items-start border-b border-gray-200 pb-6 mb-6">
              <div>
                <span className="block font-serif text-2xl tracking-widest text-black font-bold uppercase">Neelu Vora</span>
                <span className="block text-[8px] tracking-[0.4em] uppercase text-gold-700 font-semibold">Fashion • Haute Atelier</span>
                <p className="text-[10px] text-gray-500 mt-2">Colaba Flagship, Mumbai, MH, 400005<br />GSTIN: 27AABCV8942K1Z9</p>
              </div>
              <div className="text-right">
                <h4 className="font-serif text-lg font-bold text-luxury-black uppercase tracking-wide">Tax Invoice</h4>
                <p className="text-[10px] text-gray-500 mt-1 font-mono">Invoice No: #{invoiceOrder.id}<br />Date: {new Date(invoiceOrder.createdAt).toLocaleDateString()}</p>
              </div>
            </div>

            {/* Client Directories */}
            <div className="grid grid-cols-2 gap-6 text-[11px] mb-8">
              <div>
                <strong className="uppercase text-gray-400 block tracking-wider font-bold">Billed Destination:</strong>
                <p className="font-bold text-luxury-black mt-1">{invoiceOrder.customerName}</p>
                <p className="text-gray-600">{invoiceOrder.customerEmail}<br />{invoiceOrder.customerMobile}</p>
              </div>
              <div>
                <strong className="uppercase text-gray-400 block tracking-wider font-bold">Insured Ship-To:</strong>
                <p className="text-gray-600 mt-1">
                  {invoiceOrder.shippingAddress}<br />
                  {invoiceOrder.city}, {invoiceOrder.state} - {invoiceOrder.pincode}
                </p>
              </div>
            </div>

            {/* Invoice itemized listing table */}
            <table className="w-full text-left text-xs border-collapse mb-8">
              <thead>
                <tr className="border-b-2 border-gray-200 text-[10px] uppercase text-gray-400 font-bold">
                  <th className="py-2">Heritage Creation</th>
                  <th className="py-2 text-right">Unit Settle</th>
                  <th className="py-2 text-center">Qty</th>
                  <th className="py-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-sans">
                {invoiceOrder.items.map((item, idx) => (
                  <tr key={idx} className="text-[11px]">
                    <td className="py-3">
                      <strong className="text-luxury-black font-bold block">{item.productName}</strong>
                      {item.variant && <span className="text-[9px] text-gray-400">Variant: {item.variant}</span>}
                    </td>
                    <td className="py-3 text-right font-mono">₹{item.price.toLocaleString()}</td>
                    <td className="py-3 text-center">{item.quantity}</td>
                    <td className="py-3 text-right font-mono">₹{(item.price * item.quantity).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Summary matrix */}
            <div className="w-64 ml-auto space-y-2 text-[11px] border-t border-gray-200 pt-4 font-mono text-right">
              <div className="flex justify-between">
                <span className="text-gray-400">Cart value:</span>
                <span>₹{invoiceOrder.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Atelier GST Tax (Integrated):</span>
                <span>₹{invoiceOrder.taxGst.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Insured Transit:</span>
                <span>{invoiceOrder.shippingCharge === 0 ? 'Complimentary' : `₹${invoiceOrder.shippingCharge}`}</span>
              </div>
              {invoiceOrder.discount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Promo discount:</span>
                  <span>-₹{invoiceOrder.discount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between font-serif text-xs font-bold text-luxury-black border-t border-gray-200 pt-2 text-right">
                <span>Grand Settle:</span>
                <span className="text-gold-700 font-mono">₹{invoiceOrder.total.toLocaleString()}</span>
              </div>
            </div>

            {/* Print Footer labels */}
            <div className="border-t border-gray-200 pt-8 mt-8 text-center text-[10px] text-gray-400 uppercase tracking-widest font-semibold flex items-center justify-between">
              <span>Verified Gold Purity ⚜</span>
              <span>Computer Generated Document - Sign Optional</span>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
