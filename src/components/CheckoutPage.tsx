import React, { useState, useEffect } from 'react';
import { CreditCard, Truck, ShieldCheck, ArrowRight, Sparkles, ShoppingBag } from 'lucide-react';
import { CartItem, User, Order } from '../types';

interface CheckoutPageProps {
  cartItems: CartItem[];
  user: User | null;
  pricing: {
    finalTotal: number;
    subtotal: number;
    gstTax: number;
    shippingCharge: number;
    discount: number;
  };
  onClearCart: () => void;
  onNavigate: (view: any, params?: any) => void;
}

export default function CheckoutPage({
  cartItems,
  user,
  pricing,
  onClearCart,
  onNavigate
}: CheckoutPageProps) {
  
  if (!cartItems || cartItems.length === 0 || !pricing || !pricing.finalTotal) {
    return (
      <div className="pt-32 pb-20 px-4 min-h-[60vh] flex flex-col items-center justify-center text-center bg-luxury-cream">
        <ShoppingBag size={48} className="text-gold-400 mb-4" />
        <h2 className="font-serif text-2xl mb-2 text-luxury-black font-bold">Checkout Unavailable</h2>
        <p className="text-gray-500 mb-6 max-w-md text-sm">Your shopping bag is empty or pricing details are missing. Please return to the shop to add items.</p>
        <button
          onClick={() => onNavigate('collection')}
          className="bg-luxury-black text-white px-8 py-3 rounded text-xs font-bold uppercase tracking-widest hover:bg-gold-600 hover:text-black transition"
        >
          Return to Shop
        </button>
      </div>
    );
  }

  // Form Inputs
  const [name, setName] = useState(user ? user.name : '');
  const [email, setEmail] = useState(user ? user.email : '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState('');
  const [pincode, setPincode] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');

  // Form validations & loadings
  const [pincodeResolving, setPincodeResolving] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'Razorpay' | 'COD'>('Razorpay');
  const [submitting, setSubmitting] = useState(false);
  
  // Razorpay Overlay State
  const [showRazorpayOverlay, setShowRazorpayOverlay] = useState(false);
  const [razorpayStep, setRazorpayStep] = useState<'details' | 'processing' | 'success'>('details');

  // Completed Order State
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

  // Sync authenticated user details if logged in
  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      if (user.phone) setPhone(user.phone);
      if (user.addresses && user.addresses.length > 0) {
        const defAddr = user.addresses.find(a => a.isDefault) || user.addresses[0];
        setAddress(defAddr.address);
        setPincode(defAddr.pincode);
        setCity(defAddr.city);
        setState(defAddr.state);
      }
    }
  }, [user]);

  // Indian Pincode Auto-lookup (Section 11.2)
  useEffect(() => {
    if (pincode.length === 6) {
      setPincodeResolving(true);
      fetch(`/api/shipping/pincode/${pincode}`)
        .then(res => res.json())
        .then(data => {
          if (data.deliverable && data.location) {
            const parts = data.location.split(', ');
            if (parts.length >= 2) {
              setCity(parts[0]);
              setState(parts[1]);
            }
          }
          setPincodeResolving(false);
        })
        .catch(err => {
          console.error(err);
          setPincodeResolving(false);
        });
    }
  }, [pincode]);

  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !phone || !address || !pincode || !city || !state) return;

    if (paymentMethod === 'Razorpay') {
      // Trigger Razorpay simulated checkout overlay
      setShowRazorpayOverlay(true);
      setRazorpayStep('details');
    } else {
      // Direct Cash on Delivery order creation
      executeCreateOrder('COD');
    }
  };

  const executeCreateOrder = (method: 'Razorpay' | 'COD', razorpayPayload?: { orderId: string; paymentId: string }) => {
    setSubmitting(true);

    const orderItems = cartItems.map(item => ({
      productId: item.product.id,
      productName: item.product.name,
      productImage: item.product.images[0],
      price: item.price,
      quantity: item.quantity,
      variant: item.selectedVariant
    }));

    const orderPayload = {
      customerName: name,
      customerEmail: email,
      customerMobile: phone,
      shippingAddress: address,
      pincode,
      city,
      state,
      items: orderItems,
      subtotal: pricing.subtotal,
      taxGst: pricing.gstTax,
      shippingCharge: pricing.shippingCharge,
      discount: pricing.discount,
      total: pricing.finalTotal,
      paymentMethod: method,
      razorpayOrderId: razorpayPayload?.orderId,
      razorpayPaymentId: razorpayPayload?.paymentId,
      paymentStatus: method === 'Razorpay' ? 'Paid' : 'Pending'
    };

    fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderPayload)
    })
      .then(res => res.json())
      .then((newOrder: Order) => {
        setCompletedOrder(newOrder);
        onClearCart();
        setSubmitting(false);
        setShowRazorpayOverlay(false);
      })
      .catch(err => {
        console.error(err);
        alert("Failed to place order. Please try again.");
        setSubmitting(false);
        setShowRazorpayOverlay(false);
      });
  };

  // Simulated Razorpay payment flow with processing steps
  const handleSimulateRazorpaySuccess = () => {
    setRazorpayStep('processing');
    
    // Simulate API authorization wait
    setTimeout(() => {
      const simulatedOrderId = `rzp_order_${Math.random().toString(36).substring(2, 10)}`;
      const simulatedPaymentId = `rzp_pay_${Math.random().toString(36).substring(2, 10)}`;
      
      // Execute database save
      executeCreateOrder('Razorpay', { orderId: simulatedOrderId, paymentId: simulatedPaymentId });
    }, 2500);
  };

  // 1. SUCCESS DISPLAY SCREEN
  if (completedOrder) {
    return (
      <div id="checkout-success-container" className="max-w-xl mx-auto px-4 py-20 text-center animate-fadeIn">
        <span className="text-emerald-700 text-5xl block mb-4 font-bold">⚜</span>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-luxury-black uppercase tracking-wide mb-2">Order Confirmed</h1>
        <p className="text-xs text-gold-700 font-bold uppercase tracking-widest mb-6">Namaste, {completedOrder.customerName}</p>

        <div className="bg-luxury-cream border border-gold-200/50 rounded p-6 text-left space-y-4 mb-8 text-xs font-sans">
          <div className="flex justify-between border-b border-gold-100 pb-2">
            <span className="text-gray-400 font-semibold uppercase">Maison Order ID</span>
            <span className="font-mono font-bold text-luxury-black">{completedOrder.id}</span>
          </div>
          {completedOrder.razorpayPaymentId && (
            <div className="flex justify-between border-b border-gold-100 pb-2">
              <span className="text-gray-400 font-semibold uppercase">Razorpay Payment Reference</span>
              <span className="font-mono text-gray-600">{completedOrder.razorpayPaymentId}</span>
            </div>
          )}
          <div className="flex justify-between border-b border-gold-100 pb-2">
            <span className="text-gray-400 font-semibold uppercase">Shipping Destination</span>
            <span className="text-gray-600 text-right">{completedOrder.shippingAddress}, {completedOrder.city}, {completedOrder.state} - {completedOrder.pincode}</span>
          </div>
          <div className="flex justify-between font-serif text-sm font-bold text-luxury-black pt-2">
            <span>Amount Transacted</span>
            <span className="font-mono text-gold-700">₹{completedOrder.total.toLocaleString()}</span>
          </div>
        </div>

        <p className="text-xs text-gray-500 max-w-sm mx-auto mb-8 leading-relaxed font-light">
          Your luxury masterworks are being packaged with premium cotton rolls and armored sealing box wrappers. A simulated tracking ID will appear on your account profile board once handed over to Sequre Logistics.
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <button
            onClick={() => onNavigate('account', { tab: 'orders' })}
            className="bg-luxury-black hover:bg-gold-600 hover:text-black text-white font-bold text-xs tracking-widest uppercase px-6 py-3 transition rounded"
          >
            Track Order Progress
          </button>
          <button
            onClick={() => onNavigate('home')}
            className="border border-gold-300 hover:bg-gold-50 text-gray-600 font-bold text-xs tracking-widest uppercase px-6 py-3 transition rounded bg-white"
          >
            Maison Homepage
          </button>
        </div>
      </div>
    );
  }

  return (
    <div id="checkout-view-container" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fadeIn">
      
      <h1 className="font-serif text-3xl font-bold text-luxury-black mb-8 tracking-wide">
        Secure Checkout Gate
      </h1>

      <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
        
        {/* Left Columns: Forms */}
        <div className="lg:col-span-2 space-y-8 bg-white border border-gold-200/50 p-6 sm:p-8 rounded shadow-sm">
          
          {/* Section 1: Contact Detail */}
          <div>
            <h3 className="font-serif text-lg font-bold text-luxury-black uppercase tracking-wide border-b border-gold-100 pb-2.5 mb-5 flex items-center gap-1.5">
              <span className="text-gold-600">1.</span> Contact Coordinates
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Your Full Name</label>
                <input
                  id="checkout-name"
                  type="text"
                  required
                  placeholder="e.g. Suman Sen"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-gold-300 text-xs rounded px-3 py-2 text-gray-700 focus:outline-none focus:border-gold-600 bg-white"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Email Address</label>
                <input
                  id="checkout-email"
                  type="email"
                  required
                  placeholder="e.g. concierge@client.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-gold-300 text-xs rounded px-3 py-2 text-gray-700 focus:outline-none focus:border-gold-600 bg-white"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Mobile Contact Number (WhatsApp alerts)</label>
                <input
                  id="checkout-phone"
                  type="tel"
                  required
                  placeholder="e.g. +91 99999 12345"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full border border-gold-300 text-xs rounded px-3 py-2 text-gray-700 focus:outline-none focus:border-gold-600 bg-white"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Address */}
          <div>
            <h3 className="font-serif text-lg font-bold text-luxury-black uppercase tracking-wide border-b border-gold-100 pb-2.5 mb-5 flex items-center gap-1.5">
              <span className="text-gold-600">2.</span> Insured Shipping Address
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-3">
                <label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Street Address, Villa/Apartment Number</label>
                <input
                  id="checkout-address"
                  type="text"
                  required
                  placeholder="e.g. Flat 4B, Samudra Mahal, Worli"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full border border-gold-300 text-xs rounded px-3 py-2 text-gray-700 focus:outline-none focus:border-gold-600 bg-white"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-gray-500 block mb-1 flex items-center justify-between">
                  <span>6-Digit Pincode</span>
                  {pincodeResolving && <span className="text-[9px] text-gold-600 animate-pulse font-normal">Lookup...</span>}
                </label>
                <input
                  id="checkout-pincode"
                  type="text"
                  maxLength={6}
                  required
                  placeholder="e.g. 400018"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                  className="w-full border border-gold-300 text-xs rounded px-3 py-2 text-gray-700 focus:outline-none focus:border-gold-600 bg-white"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">City / Town</label>
                <input
                  id="checkout-city"
                  type="text"
                  required
                  placeholder="e.g. Mumbai"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full border border-gold-300 text-xs rounded px-3 py-2 text-gray-700 focus:outline-none focus:border-gold-600 bg-white"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">State / Union Territory</label>
                <input
                  id="checkout-state"
                  type="text"
                  required
                  placeholder="e.g. Maharashtra"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full border border-gold-300 text-xs rounded px-3 py-2 text-gray-700 focus:outline-none focus:border-gold-600 bg-white"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Payment Method */}
          <div>
            <h3 className="font-serif text-lg font-bold text-luxury-black uppercase tracking-wide border-b border-gold-100 pb-2.5 mb-5 flex items-center gap-1.5">
              <span className="text-gold-600">3.</span> Settlement Method
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Razorpay Option */}
              <label className={`border-2 rounded p-4 flex items-center cursor-pointer justify-between transition ${paymentMethod === 'Razorpay' ? 'border-gold-600 bg-gold-50/10' : 'border-gold-200 hover:bg-gold-50/5'}`}>
                <div className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="pm-group"
                    checked={paymentMethod === 'Razorpay'}
                    onChange={() => setPaymentMethod('Razorpay')}
                    className="accent-gold-600"
                  />
                  <div>
                    <h5 className="font-bold text-xs uppercase tracking-wider text-luxury-black flex items-center gap-1.5">
                      <CreditCard size={14} className="text-gold-600" />
                      Razorpay Gateway
                    </h5>
                    <p className="text-[10px] text-gray-500 font-light mt-0.5">Credit/Debit cards, UPI, net banking</p>
                  </div>
                </div>
                <span className="text-[9px] uppercase tracking-wider font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">Fastest</span>
              </label>

              {/* COD Option */}
              <label className={`border-2 rounded p-4 flex items-center cursor-pointer justify-between transition ${paymentMethod === 'COD' ? 'border-gold-600 bg-gold-50/10' : 'border-gold-200 hover:bg-gold-50/5'}`}>
                <div className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="pm-group"
                    checked={paymentMethod === 'COD'}
                    onChange={() => setPaymentMethod('COD')}
                    className="accent-gold-600"
                  />
                  <div>
                    <h5 className="font-bold text-xs uppercase tracking-wider text-luxury-black flex items-center gap-1.5">
                      <Truck size={14} className="text-gold-600" />
                      Cash On Delivery (COD)
                    </h5>
                    <p className="text-[10px] text-gray-500 font-light mt-0.5">Settle with courier representative</p>
                  </div>
                </div>
              </label>

            </div>
          </div>

        </div>

        {/* Right Column: Summaries */}
        <div className="space-y-6">
          
          <div className="bg-white border border-gold-200/50 rounded p-6 shadow-sm">
            <h3 className="font-serif text-lg font-bold text-luxury-black mb-6 border-b border-gold-100 pb-3 uppercase tracking-wide">
              Summary Matrice
            </h3>

            {/* Products brief */}
            <div className="divide-y divide-gold-100 max-h-48 overflow-y-auto pr-2 mb-6">
              {cartItems.map((item, idx) => (
                <div key={idx} className="py-3 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-3.5">
                    <img src={item.product.images[0]} alt="" className="w-8 h-10 object-cover rounded border border-gold-100" />
                    <div>
                      <span className="block font-serif font-bold text-luxury-black line-clamp-1">{item.product.name}</span>
                      <span className="block text-[9px] text-gray-400 mt-0.5">Qty {item.quantity} {item.selectedVariant ? `• ${item.selectedVariant}` : ''}</span>
                    </div>
                  </div>
                  <span className="font-mono font-semibold text-gray-700">₹{(item.price * item.quantity).toLocaleString()}</span>
                </div>
              ))}
            </div>

            {/* Calculations breakdown */}
            <div className="space-y-4 text-xs font-mono border-b border-gold-100 pb-5">
              <div className="flex justify-between">
                <span className="text-gray-500">Cart subtotal</span>
                <span>₹{pricing.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Atelier GST Tax</span>
                <span>₹{pricing.gstTax.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Logistics Transport</span>
                {pricing.shippingCharge === 0 ? (
                  <span className="text-emerald-700 font-bold uppercase text-[9px] tracking-wider">⚜ Complimentary</span>
                ) : (
                  <span>₹{pricing.shippingCharge.toLocaleString()}</span>
                )}
              </div>
              {pricing.discount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Promo Discount</span>
                  <span>-₹{pricing.discount.toLocaleString()}</span>
                </div>
              )}
            </div>

            <div className="flex justify-between items-baseline py-5 font-serif text-base sm:text-lg font-bold text-luxury-black">
              <span>Grand Total:</span>
              <span className="font-mono text-xl text-gold-700">₹{pricing.finalTotal.toLocaleString()}</span>
            </div>

            <button
              id="checkout-finalize-btn"
              type="submit"
              disabled={submitting}
              className="w-full bg-luxury-black hover:bg-gold-600 hover:text-black text-white font-bold text-xs tracking-widest uppercase py-4 transition rounded flex items-center justify-center gap-2 group shadow-md"
            >
              <span>{paymentMethod === 'Razorpay' ? 'Launch Secure Gate' : 'Confirm Cash Order'}</span>
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Verification labels */}
          <div className="text-center space-y-2 text-[10px] text-gray-400 uppercase tracking-widest font-semibold">
            <span className="flex items-center justify-center gap-1"><ShieldCheck size={14} className="text-gold-500" /> Fully Encrypted SSL Security</span>
          </div>

        </div>

      </form>

      {/* 2. SIMULATED RAZORPAY GATEWAY OVERLAY MODAL */}
      {showRazorpayOverlay && (
        <div id="razorpay-overlay-modal" className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
          <div className="bg-luxury-black border border-gold-600/30 text-white rounded-lg shadow-2xl max-w-sm w-full p-6 relative overflow-hidden animate-scaleUp">
            
            <button
              onClick={() => { if (razorpayStep !== 'processing') setShowRazorpayOverlay(false); }}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              &times;
            </button>

            {/* Header / Logo */}
            <div className="text-center border-b border-gold-800/20 pb-4 mb-6">
              <span className="block font-serif text-lg tracking-widest text-gold-300 uppercase font-bold">Razorpay Gate</span>
              <span className="block text-[8px] tracking-[0.3em] uppercase text-gold-500 mt-1">Maison Client checkout Authorization</span>
            </div>

            {/* Step: Details */}
            {razorpayStep === 'details' && (
              <div className="space-y-4">
                <div className="bg-gold-950/20 border border-gold-800/20 p-4 rounded text-xs text-left space-y-2 font-mono">
                  <div className="flex justify-between">
                    <span className="text-gold-400">Merchant:</span>
                    <span className="text-gold-100 font-bold">NEELU VORA FASHION</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gold-400">Billed amount:</span>
                    <span className="text-gold-100 font-bold">₹{pricing.finalTotal.toLocaleString()}</span>
                  </div>
                </div>

                <div className="p-3 bg-gold-900/10 border border-gold-800/30 text-[10px] text-gold-300 leading-relaxed font-sans rounded">
                  <Sparkles size={14} className="inline mr-1 text-gold-400 animate-pulse" />
                  This is a secure gateway transaction. Click "Confirm Settlement" to mock a successful payment capture, simulating Razorpay's webhook response in real-time.
                </div>

                <div className="flex space-x-3 mt-6">
                  <button
                    id="rzp-cancel-btn"
                    type="button"
                    onClick={() => setShowRazorpayOverlay(false)}
                    className="w-1/2 border border-gold-800/40 hover:bg-gold-950 text-gold-300 font-bold text-[10px] uppercase tracking-widest py-3 rounded transition"
                  >
                    Abort
                  </button>
                  <button
                    id="rzp-pay-btn"
                    type="button"
                    onClick={handleSimulateRazorpaySuccess}
                    className="w-1/2 bg-gold-500 hover:bg-gold-400 text-black font-bold text-[10px] uppercase tracking-widest py-3 rounded transition shadow-lg"
                  >
                    Confirm Settlement
                  </button>
                </div>
              </div>
            )}

            {/* Step: Processing */}
            {razorpayStep === 'processing' && (
              <div className="text-center py-8 space-y-4">
                <span className="animate-spin inline-block text-gold-400 text-3xl font-bold">⚜</span>
                <h4 className="font-serif text-base font-bold text-gold-200">Processing Payment...</h4>
                <p className="text-[10px] text-gold-100/50 max-w-xs mx-auto leading-relaxed">
                  Securing channel authorization. Establishing digital signature validation and updating the Maison cloud ledger. Please do not close this window.
                </p>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
