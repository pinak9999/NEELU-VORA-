import React, { useState, useEffect } from 'react';
import { Trash2, Tag, Truck, ShieldCheck, ArrowRight, Sparkles } from 'lucide-react';
import { CartItem, Coupon } from '../types';

interface CartPageProps {
  cartItems: CartItem[];
  onUpdateQuantity: (index: number, quantity: number) => void;
  onRemoveItem: (index: number) => void;
  onNavigate: (view: any, params?: any) => void;
  onApplyCoupon: (coupon: Coupon | null) => void;
  appliedCoupon: Coupon | null;
}

export default function CartPage({
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onNavigate,
  onApplyCoupon,
  appliedCoupon
}: CartPageProps) {
  
  // Coupon State
  const [couponCode, setCouponCode] = useState(appliedCoupon ? appliedCoupon.code : '');
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState(appliedCoupon ? 'Promotion applied!' : '');

  // Pincode checking state
  const [pincode, setPincode] = useState('');
  const [pincodeChecking, setPincodeChecking] = useState(false);
  const [pincodeResult, setPincodeResult] = useState<{
    deliverable: boolean;
    location?: string;
    estDays?: string;
  } | null>(null);

  // Auto-fill coupon code if state changes
  useEffect(() => {
    if (appliedCoupon) {
      setCouponCode(appliedCoupon.code);
      setCouponSuccess(`Code '${appliedCoupon.code}' applied successfully!`);
    } else {
      setCouponSuccess('');
    }
  }, [appliedCoupon]);

  // Calculate Subtotal based on adjusted variant prices
  const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  // Dynamic GST tax rates (Weighted: 3% on fine jewelry category items, 5% on apparel sarees)
  const gstTax = cartItems.reduce((acc, item) => {
    const isJewelry = ['Necklaces', 'Bangles', 'Rings'].includes(item.product.category);
    const taxRate = isJewelry ? 0.03 : 0.05;
    return acc + (item.price * item.quantity * taxRate);
  }, 0);

  // Shipping logic (Complimentary above ₹15,000, else standard insured flat rate of ₹500)
  const shippingCharge = subtotal >= 15000 || subtotal === 0 ? 0 : 500;

  // Coupon reduction evaluation
  let discount = 0;
  if (appliedCoupon && subtotal >= appliedCoupon.minCartValue) {
    if (appliedCoupon.discountType === 'percentage') {
      discount = (subtotal * appliedCoupon.discountValue) / 100;
      if (appliedCoupon.maxDiscountCap && discount > appliedCoupon.maxDiscountCap) {
        discount = appliedCoupon.maxDiscountCap;
      }
    } else {
      discount = appliedCoupon.discountValue;
    }
  }

  const finalTotal = Math.max(0, subtotal + gstTax + shippingCharge - discount);

  // Validate coupon code against server backend
  const handleVerifyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    setCouponError('');
    setCouponSuccess('');

    fetch(`/api/coupons/verify?code=${encodeURIComponent(couponCode.trim())}&cartValue=${subtotal}`)
      .then(async res => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Invalid coupon code');
        }
        return data as Coupon;
      })
      .then((coupon: Coupon) => {
        onApplyCoupon(coupon);
        setCouponSuccess(`Coupon code '${coupon.code}' successfully validated!`);
      })
      .catch(err => {
        onApplyCoupon(null);
        setCouponError(err.message || 'Validation failed');
      });
  };

  // Check pincode transit details
  const checkPincode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pincode.trim() || pincode.trim().length !== 6) {
      setPincodeResult({ deliverable: false });
      return;
    }

    setPincodeChecking(true);
    setPincodeResult(null);

    fetch(`/api/shipping/pincode/${pincode.trim()}`)
      .then(res => res.json())
      .then(data => {
        setPincodeResult(data);
        setPincodeChecking(false);
      })
      .catch(err => {
        console.error(err);
        setPincodeChecking(false);
      });
  };

  if (cartItems.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center animate-fadeIn">
        <div className="mb-4 text-gold-600 text-3xl font-bold">⚜</div>
        <h2 className="font-serif text-2xl font-bold text-luxury-black mb-3">Your Shopping Bag is Empty</h2>
        <p className="text-xs text-gray-500 max-w-sm mx-auto mb-8 leading-relaxed">
          The Maison selection is waiting for you. Browse our custom handforged necklaces, gold rings, and pure silk sarees.
        </p>
        <button
          onClick={() => onNavigate('collection')}
          className="bg-luxury-black hover:bg-gold-600 hover:text-black text-white font-bold text-xs tracking-widest uppercase px-8 py-3.5 transition rounded"
        >
          Explore Collections
        </button>
      </div>
    );
  }

  return (
    <div id="cart-container" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fadeIn">
      
      <h1 className="font-serif text-3xl font-bold text-luxury-black mb-8 tracking-wide">
        Your Shopping Bag
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
        
        {/* Left Column: Cart items breakdown */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-gold-200/50 rounded shadow-sm divide-y divide-gold-100">
            {cartItems.map((item, idx) => (
              <div key={idx} id={`cart-item-${idx}`} className="p-4 sm:p-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                
                {/* Product details */}
                <div className="flex items-center space-x-4">
                  <img
                    src={item.product.images[0]}
                    alt={item.product.name}
                    className="w-16 h-20 object-cover rounded border border-gold-200"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <h3
                      onClick={() => onNavigate('product', { id: item.product.id })}
                      className="font-serif text-sm sm:text-base font-bold text-luxury-black hover:text-gold-600 transition cursor-pointer"
                    >
                      {item.product.name}
                    </h3>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-[10px] text-gray-500 uppercase font-semibold">
                      <span>{item.product.category}</span>
                      {item.selectedVariant && (
                        <>
                          <span>&bull;</span>
                          <span className="text-gold-700">Variant: {item.selectedVariant}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions: qty selector, pricing and trash */}
                <div className="flex items-center justify-between sm:justify-end gap-6">
                  {/* Qty */}
                  <div className="flex border border-gold-300 rounded overflow-hidden w-24 h-8 bg-white">
                    <button
                      onClick={() => onUpdateQuantity(idx, Math.max(1, item.quantity - 1))}
                      className="w-1/3 text-center text-xs font-bold hover:bg-gold-50"
                    >
                      -
                    </button>
                    <span className="w-1/3 flex items-center justify-center font-mono font-bold text-xs">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => onUpdateQuantity(idx, Math.min(item.product.stockQuantity, item.quantity + 1))}
                      className="w-1/3 text-center text-xs font-bold hover:bg-gold-50"
                    >
                      +
                    </button>
                  </div>

                  {/* Pricing */}
                  <div className="text-right font-mono text-xs sm:text-sm font-bold text-luxury-black min-w-[100px]">
                    ₹{(item.price * item.quantity).toLocaleString()}
                  </div>

                  {/* Remove */}
                  <button
                    id={`remove-item-${idx}`}
                    onClick={() => onRemoveItem(idx)}
                    className="p-1.5 text-gray-400 hover:text-red-500 transition"
                    title="Remove item"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

              </div>
            ))}
          </div>

          {/* Delivery pincode dynamic estimator */}
          <div className="bg-white border border-gold-200/50 rounded p-6 shadow-sm">
            <h4 className="font-serif text-sm font-bold text-luxury-black uppercase tracking-wider flex items-center gap-1.5 mb-4 border-b border-gold-100 pb-2">
              <Truck size={16} className="text-gold-600" />
              Delivery Pincode Estimator
            </h4>
            <form onSubmit={checkPincode} className="flex gap-2 max-w-sm">
              <input
                id="cart-pincode-input"
                type="text"
                maxLength={6}
                placeholder="Enter 6-digit Indian Pincode (e.g. 400001)"
                value={pincode}
                onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                className="flex-1 border border-gold-300 text-xs rounded px-3 py-2 text-gray-700 focus:outline-none focus:border-gold-600"
              />
              <button
                id="check-pincode-btn"
                type="submit"
                disabled={pincodeChecking}
                className="bg-luxury-black hover:bg-gold-600 hover:text-black text-white font-bold text-[10px] uppercase tracking-widest px-4 py-2 rounded transition"
              >
                {pincodeChecking ? 'Validating...' : 'Verify'}
              </button>
            </form>

            {pincodeResult && (
              <div className="mt-3 text-xs">
                {pincodeResult.deliverable ? (
                  <p className="text-emerald-700 font-semibold bg-emerald-50 px-3 py-2 rounded border-l-4 border-emerald-500">
                    ⚜ Serviceable zone! Deliverable to {pincodeResult.location}. Estimated delivery transit: <strong>{pincodeResult.estDays}</strong>.
                  </p>
                ) : (
                  <p className="text-red-700 font-semibold bg-red-50 px-3 py-2 rounded border-l-4 border-red-500">
                    ❌ Location not recognized or outside courier boundaries. Armored logistics is unavailable.
                  </p>
                )}
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Calculations & Coupon summary */}
        <div className="space-y-6">
          <div className="bg-white border border-gold-200/50 rounded p-6 shadow-sm">
            <h3 className="font-serif text-lg font-bold text-luxury-black mb-6 border-b border-gold-100 pb-3 uppercase tracking-wide">
              Order Value Matrix
            </h3>

            {/* Calculations rows */}
            <div className="space-y-4 text-xs font-mono border-b border-gold-100 pb-5">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal value</span>
                <span className="text-luxury-black font-bold">₹{subtotal.toLocaleString()}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-500 flex items-center gap-1">
                  Atelier GST Tax (Weighted)
                </span>
                <span className="text-luxury-black font-bold">₹{gstTax.toLocaleString()}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-500">Insured Delivery</span>
                {shippingCharge === 0 ? (
                  <span className="text-emerald-700 font-bold uppercase tracking-wider text-[10px]">⚜ Complimentary</span>
                ) : (
                  <span className="text-luxury-black font-bold">₹{shippingCharge.toLocaleString()}</span>
                )}
              </div>

              {discount > 0 && (
                <div className="flex justify-between text-emerald-700 bg-emerald-50/50 p-2 rounded">
                  <span>Promo Discount ({appliedCoupon?.code})</span>
                  <span className="font-bold">-₹{discount.toLocaleString()}</span>
                </div>
              )}
            </div>

            {/* Total */}
            <div className="flex justify-between items-baseline py-5 font-serif text-base sm:text-lg font-bold text-luxury-black">
              <span>Estimated Total:</span>
              <span className="font-mono text-xl text-gold-700">₹{finalTotal.toLocaleString()}</span>
            </div>

            {/* Coupon input form */}
            <div className="mt-2 pt-4 border-t border-gold-100">
              <span className="text-[10px] uppercase font-bold text-gray-500 block mb-2">Have a coupon code?</span>
              <form onSubmit={handleVerifyCoupon} className="flex gap-2">
                <input
                  id="coupon-code-field"
                  type="text"
                  placeholder="Try: NEELU10"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  className="flex-1 border border-gold-300 text-xs rounded px-3 py-1.5 text-gray-700 focus:outline-none focus:border-gold-600 bg-white"
                />
                <button
                  id="apply-coupon-btn"
                  type="submit"
                  className="bg-gold-600 hover:bg-gold-500 text-black font-bold text-[9px] uppercase tracking-widest px-4 py-2 rounded transition"
                >
                  Verify
                </button>
              </form>
              
              {couponError && <p id="coupon-error-msg" className="text-[10px] text-red-600 font-semibold mt-1.5">{couponError}</p>}
              {couponSuccess && (
                <div id="coupon-success-msg" className="text-[10px] text-emerald-700 font-semibold mt-1.5 bg-emerald-50 p-1.5 rounded flex items-center gap-1">
                  <Sparkles size={11} className="text-gold-600" />
                  <span>{couponSuccess}</span>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="mt-8 space-y-3">
              <button
                id="cart-checkout-proceed-btn"
                onClick={() => onNavigate('checkout', { finalTotal, subtotal, gstTax, shippingCharge, discount })}
                className="w-full bg-luxury-black hover:bg-gold-600 hover:text-black text-white font-bold text-xs tracking-widest uppercase py-4 transition rounded flex items-center justify-center gap-2 group shadow-md"
              >
                <span>Proceed to Secure Checkout</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => onNavigate('collection')}
                className="w-full border border-gold-300 hover:bg-gold-50 text-gray-600 font-bold text-xs tracking-widest uppercase py-3 transition rounded bg-white"
              >
                Continue Selecting
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
