import React, { useState, useEffect } from 'react';
import { ShoppingBag, Heart, Star, Calendar, MessageCircle, FileText, Truck, ShieldAlert, Sparkles, Sliders, ChevronLeft, ChevronRight, Video, Instagram } from 'lucide-react';
import { Product, Review, CartItem } from '../types';

interface ProductDetailPageProps {
  productId: string;
  onNavigate: (view: any, params?: any) => void;
  isWishlisted: boolean;
  onToggleWishlist: (productId: string, e: React.MouseEvent) => void;
  onAddToCart: (product: Product, quantity: number, variant?: string) => void;
  products: Product[]; // for recommendations
}

export default function ProductDetailPage({
  productId,
  onNavigate,
  isWishlisted,
  onToggleWishlist,
  onAddToCart,
  products
}: ProductDetailPageProps) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Media States
  const [activeMediaTab, setActiveMediaTab] = useState<'images' | 'spin' | 'video'>('images');
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [selectedMediaIdx, setSelectedMediaIdx] = useState(0);
  const [spinIndex, setSpinIndex] = useState(0);

  // Embed helpers
  const getInstagramEmbedUrl = (url: string) => {
    const match = url?.match(/instagram\.com\/(p|reel|tv)\/([^/?#&]+)/i);
    if (match && match[2]) {
      return `https://www.instagram.com/p/${match[2]}/embed`;
    }
    return '';
  };

  const getYouTubeEmbedUrl = (url: string) => {
    let videoId = '';
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url?.match(regExp);
    if (match && match[2] && match[2].length === 11) {
      videoId = match[2];
    }
    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}`;
    }
    return '';
  };
  
  // Custom Reviews List
  const [reviews, setReviews] = useState<Review[]>([]);
  const [activeInfoTab, setActiveInfoTab] = useState<'description' | 'delivery' | 'reviews'>('description');
  
  // Consultation booking modal
  const [showConsultationModal, setShowConsultationModal] = useState(false);
  const [bookingName, setBookingName] = useState('');
  const [bookingPhone, setBookingPhone] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [bookingNotes, setBookingNotes] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // Review Input Form
  const [reviewerName, setReviewerName] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [reviewImage, setReviewImage] = useState<string | null>(null);
  const [reviewVideo, setReviewVideo] = useState<string | null>(null);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  // Selected Options
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<string>('');

  // Fetch product data and its reviews
  useEffect(() => {
    setLoading(true);
    fetch(`/api/products/${productId}`)
      .then(res => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data: Product) => {
        setProduct(data);
        if (data.variants && data.variants.length > 0) {
          setSelectedVariant(data.variants[0].name);
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });

    fetch(`/api/products/${productId}/reviews`)
      .then(res => res.json())
      .then((data: Review[]) => setReviews(data))
      .catch(err => console.error(err));
  }, [productId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-gray-400 font-serif">
        <span className="animate-spin text-gold-600 text-2xl mb-4 font-bold">⚜</span>
        <span>Unveiling your masterpiece selection...</span>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h2 className="font-serif text-2xl font-bold text-luxury-black mb-4">Masterpiece Not Found</h2>
        <button onClick={() => onNavigate('collection')} className="bg-gold-600 px-6 py-2 text-black font-bold uppercase tracking-wider rounded">
          Return To Catalog
        </button>
      </div>
    );
  }

  // Multi-angle Spin Viewer simulation images list (using different crops/sizes or Unsplash variants)
  const spinImages = [
    product.images[0],
    product.images[1] || product.images[0],
    product.images[2] || product.images[0],
    product.images[1] || product.images[0],
    product.images[0]
  ];

  // Variant Adjustments
  const activeVariantObj = product.variants?.find(v => v.name === selectedVariant);
  const priceAdjust = activeVariantObj?.priceAdjust || 0;
  const currentPrice = (product.discountedPrice || product.price) + priceAdjust;
  const basePrice = product.price + priceAdjust;
  const hasDiscount = !!product.discountedPrice;
  const inStock = (activeVariantObj ? activeVariantObj.stock : product.stockQuantity) > 0;

  // Categories helper
  const isJewelry = ['Necklaces', 'Bangles', 'Rings'].includes(product.category);

  // Submit Review Handler (base64 image/video integration)
  const handleReviewFile = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'image') setReviewImage(reader.result as string);
        else setReviewVideo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const submitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewerName || !reviewText) return;
    setReviewSubmitting(true);

    fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId,
        customerName: reviewerName,
        rating: reviewRating,
        text: reviewText,
        image: reviewImage,
        video: reviewVideo
      })
    })
      .then(res => res.json())
      .then((newRev: Review) => {
        setReviews(prev => [newRev, ...prev]);
        setReviewerName('');
        setReviewText('');
        setReviewImage(null);
        setReviewVideo(null);
        setReviewSubmitting(false);
      })
      .catch(err => {
        console.error(err);
        setReviewSubmitting(false);
      });
  };

  // Submit Video Consultation Form
  const handleBookConsultation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingName || !bookingPhone || !bookingTime) return;

    fetch('/api/consultations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: bookingName,
        customerPhone: bookingPhone,
        preferredTime: bookingTime,
        notes: bookingNotes,
        productId: product.id
      })
    })
      .then(res => res.json())
      .then(() => {
        setBookingSuccess(true);
        setTimeout(() => {
          setShowConsultationModal(false);
          setBookingSuccess(false);
          setBookingName('');
          setBookingPhone('');
          setBookingTime('');
          setBookingNotes('');
        }, 2500);
      })
      .catch(err => console.error(err));
  };

  // Recommendations: products from same category
  const recommendations = products
    .filter(p => p.category === product.category && p.id !== product.id)
    .slice(0, 3);

  // WhatsApp chat ordering
  const whatsappUrl = `https://wa.me/919999912345?text=${encodeURIComponent(
    `Namaste, I am interested in purchasing the "${product.name}" (${isJewelry ? product.purity || '22K Gold' : product.fabric || 'Pure Silk'}). Please assist me with ordering.`
  )}`;

  return (
    <div id={`detail-container-${product.id}`} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fadeIn relative">
      
      {/* Back button */}
      <button
        onClick={() => onNavigate('collection')}
        className="text-xs uppercase tracking-widest font-bold text-gold-600 hover:text-gold-800 transition flex items-center gap-1.5 mb-6"
      >
        &larr; Back to catalog Collection
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 sm:gap-16 items-start">
        
        {/* Left Panel: Media Center */}
        <div className="space-y-6">
          {(() => {
            const mediaItems: { type: 'image' | 'video' | 'instagram' | 'youtube'; url: string }[] = [];
            if (product.images && product.images.length > 0) {
              product.images.forEach(img => mediaItems.push({ type: 'image', url: img }));
            }
            if (product.videos && product.videos.length > 0) {
              product.videos.forEach(vid => mediaItems.push({ type: 'video', url: vid }));
            }
            if (product.instagramReels && product.instagramReels.length > 0) {
              product.instagramReels.forEach(url => mediaItems.push({ type: 'instagram', url }));
            } else if (product.instagramReelUrl) {
              mediaItems.push({ type: 'instagram', url: product.instagramReelUrl });
            }
            if (product.youtubeVideos && product.youtubeVideos.length > 0) {
              product.youtubeVideos.forEach(url => mediaItems.push({ type: 'youtube', url }));
            }

            // Fallback index if out of range
            const activeIdx = selectedMediaIdx >= mediaItems.length ? 0 : selectedMediaIdx;
            const activeItem = mediaItems[activeIdx];

            return (
              <div className="space-y-6">
                <div className="relative bg-[#080808] border border-gold-200/50 rounded overflow-hidden shadow-sm aspect-[4/5] flex items-center justify-center">
                  
                  {/* Tab: Combined Media Gallery */}
                  {activeMediaTab === 'images' && mediaItems.length > 0 && (
                    <div className="w-full h-full relative flex items-center justify-center">
                      {activeItem?.type === 'image' && (
                        <div className="relative w-full h-full group/zoom">
                          <img
                            src={activeItem.url}
                            alt={product.name}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover/zoom:scale-125"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      )}
                      {activeItem?.type === 'video' && (
                        <div className="relative w-full h-full bg-black flex items-center justify-center">
                          <video
                            src={activeItem.url}
                            controls
                            autoPlay
                            loop
                            muted
                            className="w-full h-full object-contain"
                          />
                        </div>
                      )}
                      {activeItem?.type === 'instagram' && (
                        <div className="relative w-full h-full bg-[#0a0a0a] flex flex-col justify-between">
                          <div className="flex-1 w-full h-full flex items-center justify-center">
                            {getInstagramEmbedUrl(activeItem.url) ? (
                              <iframe
                                src={getInstagramEmbedUrl(activeItem.url)}
                                className="w-full h-full border-0"
                                allowTransparency
                                scrolling="no"
                                frameBorder="0"
                                title="Instagram Reel Lookbook"
                              />
                            ) : (
                              <div className="text-center p-6 text-white space-y-4">
                                <Instagram size={40} className="text-gold-400 mx-auto" />
                                <h4 className="font-serif text-sm font-bold">Watch Lookbook Reel</h4>
                                <p className="text-xs text-gold-100/60 max-w-xs mx-auto">This public Instagram post/reel can be viewed directly on Instagram by tapping below.</p>
                                <a
                                  href={activeItem.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  referrerPolicy="no-referrer"
                                  className="inline-block bg-gold-600 hover:bg-gold-500 text-black text-[10px] font-bold uppercase tracking-widest px-5 py-2.5 rounded transition"
                                >
                                  Open Reel Lookbook
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      {activeItem?.type === 'youtube' && (
                        <div className="relative w-full h-full bg-black">
                          {getYouTubeEmbedUrl(activeItem.url) ? (
                            <iframe
                              src={getYouTubeEmbedUrl(activeItem.url)}
                              className="w-full h-full border-0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                              title="YouTube Video"
                            />
                          ) : (
                            <div className="text-center p-6 text-white space-y-4 flex flex-col justify-center items-center h-full">
                              <Video size={40} className="text-gold-400 mx-auto mb-2" />
                              <h4 className="font-serif text-sm font-bold">YouTube Video Preview</h4>
                              <a
                                href={activeItem.url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-block bg-gold-600 hover:bg-gold-500 text-black text-[10px] font-bold uppercase tracking-widest px-5 py-2.5 rounded transition"
                              >
                                Watch on YouTube
                              </a>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tab: Multi-angle 3D rotating viewer simulation */}
                  {activeMediaTab === 'spin' && (
                    <div className="w-full h-full flex flex-col justify-between p-6 bg-white">
                      <div className="flex-1 flex items-center justify-center">
                        <img
                          src={spinImages[spinIndex]}
                          alt="360 rotation"
                          className="max-h-[350px] object-cover rounded"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="space-y-2 mt-4 text-center">
                        <span className="text-[10px] uppercase font-bold text-gold-600 tracking-wider">Drag Slider to Rotate 360° View</span>
                        <input
                          type="range"
                          min="0"
                          max="4"
                          step="1"
                          value={spinIndex}
                          onChange={(e) => setSpinIndex(Number(e.target.value))}
                          className="w-full h-1 bg-gold-100 rounded-lg appearance-none cursor-pointer accent-gold-600"
                        />
                      </div>
                    </div>
                  )}

                </div>

                {/* Media Select Buttons */}
                <div className="flex items-center justify-between border-b border-gold-200/40 pb-3">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setActiveMediaTab('images');
                        const firstImgIdx = mediaItems.findIndex(item => item.type === 'image');
                        if (firstImgIdx !== -1) setSelectedMediaIdx(firstImgIdx);
                      }}
                      className={`text-[10px] uppercase tracking-widest font-bold px-4 py-1.5 border rounded transition ${activeMediaTab === 'images' && mediaItems[activeIdx]?.type === 'image' ? 'bg-luxury-black text-white border-luxury-black shadow-lg shadow-gold-500/5' : 'border-gold-300 text-gray-600 hover:bg-gold-50'}`}
                    >
                      Atelier Gallery
                    </button>
                    <button
                      onClick={() => setActiveMediaTab('spin')}
                      className={`text-[10px] uppercase tracking-widest font-bold px-4 py-1.5 border rounded transition ${activeMediaTab === 'spin' ? 'bg-luxury-black text-white border-luxury-black shadow-lg shadow-gold-500/5' : 'border-gold-300 text-gray-600 hover:bg-gold-50'}`}
                    >
                      360° Multi-Angle View
                    </button>
                    {mediaItems.some(item => item.type !== 'image') && (
                      <button
                        onClick={() => {
                          setActiveMediaTab('images');
                          const firstVideoIdx = mediaItems.findIndex(item => item.type !== 'image');
                          if (firstVideoIdx !== -1) setSelectedMediaIdx(firstVideoIdx);
                        }}
                        className={`text-[10px] uppercase tracking-widest font-bold px-4 py-1.5 border rounded transition ${activeMediaTab === 'images' && mediaItems[activeIdx]?.type !== 'image' ? 'bg-luxury-black text-white border-luxury-black shadow-lg shadow-gold-500/5' : 'border-gold-300 text-gray-600 hover:bg-gold-50'}`}
                      >
                        Video / Reels
                      </button>
                    )}
                  </div>
                </div>

                {/* Combined Thumbnails list */}
                {activeMediaTab === 'images' && mediaItems.length > 0 && (
                  <div className="flex space-x-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gold-500">
                    {mediaItems.map((item, idx) => {
                      const isSelected = idx === activeIdx;
                      return (
                        <button
                          key={idx}
                          onClick={() => setSelectedMediaIdx(idx)}
                          className={`w-16 h-20 rounded overflow-hidden border-2 transition relative shrink-0 bg-[#080808] flex items-center justify-center ${isSelected ? 'border-gold-600 scale-105 shadow-md shadow-gold-500/10' : 'border-transparent hover:border-gold-500/30'}`}
                        >
                          {item.type === 'image' && (
                            <img src={item.url} alt="" className="w-full h-full object-cover" />
                          )}
                          {item.type === 'video' && (
                            <div className="relative w-full h-full flex items-center justify-center">
                              <video src={item.url} muted className="w-full h-full object-cover opacity-60" />
                              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                <Video size={16} className="text-gold-400" />
                              </div>
                            </div>
                          )}
                          {item.type === 'instagram' && (
                            <div className="relative w-full h-full flex items-center justify-center bg-zinc-950">
                              <Instagram size={20} className="text-pink-500" />
                              <span className="absolute bottom-1 right-1 text-[8px] font-mono text-gray-400">Reel</span>
                            </div>
                          )}
                          {item.type === 'youtube' && (
                            <div className="relative w-full h-full flex items-center justify-center bg-zinc-950">
                              <Video size={20} className="text-red-500" />
                              <span className="absolute bottom-1 right-1 text-[8px] font-mono text-gray-400">YT</span>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

              </div>
            );
          })()}
        </div>

        {/* Right Panel: Shopping configurations */}
        <div className="space-y-6">
          
          {/* Metadata breadcrumbs & Tag */}
          <div className="flex items-center space-x-2 text-[10px] text-gray-400 uppercase tracking-wider font-semibold">
            <span>{product.category}</span>
            <span>&bull;</span>
            <span>{isJewelry ? product.purity || '22K Gold' : product.fabric || 'Pure Handloom'}</span>
          </div>

          {/* Heading Name */}
          <h1 className="font-serif text-3xl sm:text-4xl text-luxury-black font-bold tracking-wide">
            {product.name}
          </h1>

          {/* Price tags */}
          <div className="flex items-baseline space-x-4 border-b border-gold-100 pb-5">
            <span className="font-mono text-2xl sm:text-3xl font-bold text-luxury-black">
              ₹{currentPrice.toLocaleString()}
            </span>
            {hasDiscount && (
              <span className="font-mono text-sm sm:text-base text-gray-400 line-through">
                ₹{basePrice.toLocaleString()}
              </span>
            )}
            {hasDiscount && (
              <span className="text-red-600 text-xs font-bold tracking-wider uppercase bg-red-50 px-2.5 py-0.5 rounded">
                Save ₹{(basePrice - currentPrice).toLocaleString()}
              </span>
            )}
          </div>

          {/* Description highlight */}
          <p className="text-xs sm:text-sm text-gray-600 leading-relaxed font-sans font-light">
            {product.description}
          </p>

          {/* Configurable Variants */}
          {product.variants && product.variants.length > 0 && (
            <div className="space-y-3">
              <span className="text-[11px] uppercase tracking-wider font-bold text-luxury-black block">
                {isJewelry ? 'Choose Kada / Bangle / Ring Size:' : 'Select Border / Blouse Style:'}
              </span>
              <div className="flex flex-wrap gap-2">
                {product.variants.map(v => (
                  <button
                    key={v.name}
                    id={`variant-btn-${v.name}`}
                    onClick={() => setSelectedVariant(v.name)}
                    className={`px-4 py-2 text-xs font-semibold tracking-wider border rounded transition ${selectedVariant === v.name ? 'bg-luxury-black text-white border-luxury-black' : 'border-gold-200 text-gray-600 hover:bg-gold-50'}`}
                  >
                    <span>{v.name}</span>
                    {v.priceAdjust && v.priceAdjust > 0 ? ` (+₹${v.priceAdjust.toLocaleString()})` : ''}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Stock Indicators */}
          <div className="flex items-center space-x-3 text-xs">
            <span className="font-bold">Availability:</span>
            {inStock ? (
              <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded flex items-center">
                ⚜ In Stock ({activeVariantObj ? activeVariantObj.stock : product.stockQuantity} items)
              </span>
            ) : (
              <span className="text-red-700 font-semibold bg-red-50 px-2 py-0.5 rounded">
                Out of Stock
              </span>
            )}
          </div>

          {/* Quantity Selector & Add to Cart Action */}
          {inStock && (
            <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
              <div className="flex border border-gold-300 rounded overflow-hidden w-28 h-12">
                <button
                  id="qty-decrement"
                  onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                  className="w-1/3 bg-gold-50/50 hover:bg-gold-100 font-bold text-center border-r border-gold-300 transition"
                >
                  -
                </button>
                <span id="qty-value" className="w-1/3 flex items-center justify-center font-mono font-bold text-sm bg-white">
                  {quantity}
                </span>
                <button
                  id="qty-increment"
                  onClick={() => setQuantity(prev => Math.min(activeVariantObj ? activeVariantObj.stock : product.stockQuantity, prev + 1))}
                  className="w-1/3 bg-gold-50/50 hover:bg-gold-100 font-bold text-center border-l border-gold-300 transition"
                >
                  +
                </button>
              </div>

              <button
                id="add-to-cart-action-btn"
                onClick={() => onAddToCart(product, quantity, selectedVariant || undefined)}
                className="flex-1 bg-luxury-black hover:bg-gold-600 hover:text-black text-white text-xs font-bold tracking-widest uppercase h-12 px-8 transition rounded flex items-center justify-center gap-2"
              >
                <ShoppingBag size={16} />
                <span>Add to Shopping Bag</span>
              </button>

              <button
                id="buy-now-btn"
                onClick={() => {
                  const itemPrice = (product.discountedPrice || product.price) + (product.variants?.find(v => v.name === selectedVariant)?.priceAdjust || 0);
                  const subtotal = itemPrice * quantity;
                  const isJewelry = ['Necklaces', 'Bangles', 'Rings'].includes(product.category);
                  const taxRate = isJewelry ? 0.03 : 0.05;
                  const gstTax = Math.round(subtotal * taxRate);
                  const shippingCharge = subtotal >= 15000 || subtotal === 0 ? 0 : 500;
                  const finalTotal = subtotal + gstTax + shippingCharge;
                  
                  const checkoutItem: CartItem = {
                    product,
                    quantity,
                    selectedVariant: selectedVariant || undefined,
                    price: itemPrice
                  };

                  onNavigate('checkout', {
                    isBuyNow: true,
                    buyNowItem: checkoutItem,
                    pricing: {
                      subtotal,
                      gstTax,
                      shippingCharge,
                      discount: 0,
                      finalTotal
                    }
                  });
                }}
                className="bg-gold-500 hover:bg-gold-400 text-black text-xs font-bold tracking-widest uppercase h-12 px-8 transition rounded"
              >
                Buy Now
              </button>
            </div>
          )}

          {/* Actions: Wishlist Heart & Video Booking buttons */}
          <div className="pt-4 border-t border-gold-100/50 flex flex-wrap gap-3">
            <button
              id={`wishlist-toggle-detail-${product.id}`}
              onClick={(e) => onToggleWishlist(product.id, e)}
              className="border border-gold-300 hover:border-red-500 hover:text-red-500 text-gray-500 rounded px-4 py-2.5 text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition bg-white"
            >
              <Heart size={14} fill={isWishlisted ? '#ef4444' : 'none'} className={isWishlisted ? 'text-red-500' : ''} />
              <span>{isWishlisted ? 'Saved in Wishlist' : 'Add to Wishlist'}</span>
            </button>

            <button
              id="detail-book-video-btn"
              onClick={() => setShowConsultationModal(true)}
              className="border border-gold-400/60 hover:bg-gold-50 text-gold-700 rounded px-4 py-2.5 text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition bg-white"
            >
              <Calendar size={14} className="text-gold-600" />
              <span>Book Video Consultation</span>
            </button>
          </div>

        </div>

      </div>

      {/* Primary Detail and Reviews Info Tabs */}
      <section className="mt-16 bg-white border border-gold-200/50 p-6 sm:p-10 rounded shadow-sm">
        <div className="flex border-b border-gold-100 space-x-6 sm:space-x-8 mb-6 text-xs sm:text-sm uppercase tracking-widest font-bold text-gray-500">
          <button
            onClick={() => setActiveInfoTab('description')}
            className={`pb-3 border-b-2 transition ${activeInfoTab === 'description' ? 'text-gold-600 border-gold-600' : 'border-transparent hover:text-luxury-black'}`}
          >
            Product Specifications
          </button>
          <button
            onClick={() => setActiveInfoTab('delivery')}
            className={`pb-3 border-b-2 transition ${activeInfoTab === 'delivery' ? 'text-gold-600 border-gold-600' : 'border-transparent hover:text-luxury-black'}`}
          >
            Delivery & Return Policy
          </button>
          <button
            onClick={() => setActiveInfoTab('reviews')}
            className={`pb-3 border-b-2 transition ${activeInfoTab === 'reviews' ? 'text-gold-600 border-gold-600' : 'border-transparent hover:text-luxury-black'}`}
          >
            Client Reviews ({reviews.length})
          </button>
        </div>

        {/* Tab 1: Product Specs */}
        {activeInfoTab === 'description' && (
          <div className="space-y-4 text-xs sm:text-sm leading-relaxed text-gray-600">
            <p>{product.description}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 text-xs font-mono">
              <div className="flex justify-between py-2 border-b border-gold-100">
                <span className="text-gray-400 uppercase">Collection Type</span>
                <span className="font-bold text-luxury-black">{product.category}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gold-100">
                <span className="text-gray-400 uppercase">Signature Occasion</span>
                <span className="font-bold text-luxury-black">{product.occasion || 'Bridal/Festive'}</span>
              </div>
              {isJewelry ? (
                <>
                  <div className="flex justify-between py-2 border-b border-gold-100">
                    <span className="text-gray-400 uppercase">Gold Certified Purity</span>
                    <span className="font-bold text-luxury-black">{product.purity || '22K Gold'}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gold-100">
                    <span className="text-gray-400 uppercase">Metal Quality</span>
                    <span className="font-bold text-luxury-black">{product.metalType || 'Gold'}</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between py-2 border-b border-gold-100">
                    <span className="text-gray-400 uppercase">Craft Loom Fabric</span>
                    <span className="font-bold text-luxury-black">{product.fabric || 'Pure Silk'}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gold-100">
                    <span className="text-gray-400 uppercase">Artisan Dye Tone</span>
                    <span className="font-bold text-luxury-black">{product.color || 'Royal Hue'}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Delivery Rules */}
        {activeInfoTab === 'delivery' && (
          <div className="space-y-6 text-xs sm:text-sm text-gray-600 leading-relaxed font-sans">
            <div>
              <h4 className="font-bold text-luxury-black uppercase tracking-wider flex items-center gap-1 mb-2">
                <Truck size={14} className="text-gold-600" /> Secure Express Delivery
              </h4>
              <p>We provide free insured logistics on orders over ₹15,000. For fine jewelry, transport is coordinated via armored escort carriers (such as Sequre/BVC) ensuring secure delivery. Metros: 3-5 working days.</p>
            </div>
            
            <div className="border-t border-gold-100 pt-4">
              <h4 className="font-bold text-luxury-black uppercase tracking-wider flex items-center gap-1 mb-2">
                <ShieldAlert size={14} className="text-gold-600" /> Category-Specific Return Rules
              </h4>
              {isJewelry ? (
                <p className="bg-gold-50 p-3 rounded text-gold-900 border-l-4 border-gold-400">
                  <strong>Fine Jewelry Policy:</strong> Returns or exchanges are accepted within <strong>3 days</strong> of courier receipt. Gold jewelry is subjected to rigorous weight, tagging, and purity checks at our laboratory upon return. Tampered security tags invalidate return eligibility. Custom commissions are non-refundable.
                </p>
              ) : (
                <p className="bg-gold-50 p-3 rounded text-gold-900 border-l-4 border-gold-400">
                  <strong>Luxury Apparel Policy:</strong> Sarees are eligible for return or exchange within <strong>7 days</strong> of delivery. Fabric must be returned pristine, completely un-draped, unworn, unwashed, and folded originally inside our custom designer gift boxes with tags intact.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Reviews */}
        {activeInfoTab === 'reviews' && (
          <div className="space-y-8">
            {/* Reviews list */}
            {reviews.length === 0 ? (
              <p className="text-xs text-gray-500 italic">No reviews have been published for this masterpiece yet. Be the first to publish a review!</p>
            ) : (
              <div className="divide-y divide-gold-100">
                {reviews.map(rev => (
                  <div key={rev.id} className="py-6 first:pt-0">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h5 className="font-bold text-xs text-luxury-black uppercase tracking-wider">{rev.customerName}</h5>
                        <div className="flex text-gold-500 mt-1">
                          {[...Array(5)].map((_, i) => <Star key={i} size={11} fill={i < rev.rating ? 'currentColor' : 'none'} />)}
                        </div>
                      </div>
                      <span className="text-[10px] text-gray-400 font-mono">{new Date(rev.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed mt-2">{rev.text}</p>
                    
                    {/* Attached Photo/Video Reviews (Section 10.6) */}
                    {(rev.image || rev.video) && (
                      <div className="flex items-center space-x-3 mt-3">
                        {rev.image && (
                          <div className="w-16 h-16 rounded overflow-hidden border border-gold-200">
                            <img src={rev.image} alt="User Review Attachment" className="w-full h-full object-cover" />
                          </div>
                        )}
                        {rev.video && (
                          <div className="w-16 h-16 rounded overflow-hidden border border-gold-200 bg-black flex items-center justify-center relative">
                            <Video size={16} className="text-gold-400" />
                            <span className="absolute bottom-0 inset-x-0 bg-black/75 text-[8px] text-center text-white py-0.5">Video review</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Write a review form */}
            <div className="border-t border-gold-100 pt-8">
              <h4 className="font-serif text-base font-bold text-luxury-black mb-4 uppercase tracking-wide flex items-center gap-1.5">
                <Sparkles size={16} className="text-gold-600" />
                Submit Your Critique
              </h4>
              <form onSubmit={submitReview} className="space-y-4 max-w-xl">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Your Name</label>
                    <input
                      id="review-name"
                      type="text"
                      required
                      placeholder="e.g. Suman S."
                      value={reviewerName}
                      onChange={(e) => setReviewerName(e.target.value)}
                      className="w-full border border-gold-300 text-xs rounded px-3 py-2 text-gray-700 focus:outline-none focus:border-gold-600 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Critique Rating</label>
                    <select
                      id="review-rating"
                      value={reviewRating}
                      onChange={(e) => setReviewRating(Number(e.target.value))}
                      className="w-full border border-gold-300 text-xs rounded p-2 text-gray-700 focus:outline-none focus:border-gold-600 bg-white cursor-pointer font-semibold"
                    >
                      <option value="5">★★★★★ Exceptional (5/5)</option>
                      <option value="4">★★★★☆ Very Fine (4/5)</option>
                      <option value="3">★★★☆☆ Satisfactory (3/5)</option>
                      <option value="2">★★☆☆☆ Sub-par (2/5)</option>
                      <option value="1">★☆☆☆☆ Poor (1/5)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Detailed Review</label>
                  <textarea
                    id="review-text"
                    required
                    rows={3}
                    placeholder="Describe your satisfaction with the purity, weight, drape, and delivery service..."
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    className="w-full border border-gold-300 text-xs rounded px-3 py-2 text-gray-700 focus:outline-none focus:border-gold-600 bg-white"
                  />
                </div>

                {/* Photo & Video Review Uploads */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Attach Photo Critique</label>
                    <input
                      id="review-image-upload"
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleReviewFile(e, 'image')}
                      className="text-xs file:bg-gold-50 file:border-gold-300 file:text-gold-800 file:px-3 file:py-1.5 file:rounded file:text-xs file:font-semibold cursor-pointer"
                    />
                    {reviewImage && <p className="text-[9px] text-emerald-700 mt-1 font-bold">✓ Photo Critique Attached</p>}
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Attach Video Critique</label>
                    <input
                      id="review-video-upload"
                      type="file"
                      accept="video/*"
                      onChange={(e) => handleReviewFile(e, 'video')}
                      className="text-xs file:bg-gold-50 file:border-gold-300 file:text-gold-800 file:px-3 file:py-1.5 file:rounded file:text-xs file:font-semibold cursor-pointer"
                    />
                    {reviewVideo && <p className="text-[9px] text-emerald-700 mt-1 font-bold">✓ Video Critique Attached</p>}
                  </div>
                </div>

                <button
                  id="submit-review-btn"
                  type="submit"
                  disabled={reviewSubmitting}
                  className="bg-luxury-black hover:bg-gold-600 hover:text-black text-white font-bold text-[10px] uppercase tracking-widest px-6 py-2.5 rounded transition disabled:opacity-50"
                >
                  {reviewSubmitting ? 'Publishing...' : 'Publish Critique'}
                </button>
              </form>
            </div>
          </div>
        )}
      </section>

      {/* "Complete the Look" Cross-sell shelf */}
      {recommendations.length > 0 && (
        <section className="mt-16 border-t border-gold-200/40 pt-16">
          <div className="mb-8">
            <span className="text-gold-600 text-[10px] uppercase tracking-[0.3em] font-semibold block">Complete the look</span>
            <h2 className="font-serif text-2xl font-bold text-luxury-black tracking-wide mt-1">Recommended Pairings</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {recommendations.map(p => (
              <div
                key={p.id}
                onClick={() => onNavigate('product', { id: p.id })}
                className="group border border-gold-200/40 bg-white rounded overflow-hidden shadow-sm hover:shadow-md cursor-pointer transition flex flex-col justify-between"
              >
                <div className="aspect-[4/5] bg-luxury-cream overflow-hidden">
                  <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500" />
                </div>
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="font-serif text-sm font-bold text-luxury-black line-clamp-1">{p.name}</h4>
                    <p className="text-[10px] text-gold-600 uppercase tracking-wider mt-1">{p.category}</p>
                  </div>
                  <div className="flex justify-between items-baseline mt-4 pt-2 border-t border-gold-100">
                    <span className="font-mono text-xs font-bold text-luxury-black">₹{(p.discountedPrice || p.price).toLocaleString()}</span>
                    <span className="text-[9px] uppercase font-bold text-gold-600 tracking-widest">Shop &rarr;</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Floating WhatsApp Action Button */}
      <a
        id="whatsapp-chat-button"
        href={whatsappUrl}
        target="_blank"
        referrerPolicy="no-referrer"
        className="fixed bottom-6 right-6 z-40 bg-[#25D366] hover:bg-[#20ba5a] text-white p-4 rounded-full shadow-2xl transition-all hover:scale-110 flex items-center justify-center border border-white"
        title="WhatsApp to Order"
      >
        <MessageCircle size={28} />
        <span className="absolute right-full mr-3 bg-luxury-black/95 text-white text-[10px] font-bold uppercase tracking-widest py-1.5 px-3 rounded shadow-lg opacity-0 hover:opacity-100 focus:opacity-100 pointer-events-none whitespace-nowrap border border-gold-800/20">
          Chat to Order Fine jewels
        </span>
      </a>

      {/* Video Consultation Booking Modal Overlay */}
      {showConsultationModal && (
        <div id="consultation-modal" className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white border border-gold-300 rounded shadow-2xl max-w-md w-full p-6 relative animate-scaleUp">
            <button
              onClick={() => setShowConsultationModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-black"
            >
              &times;
            </button>

            {bookingSuccess ? (
              <div className="text-center py-8">
                <span className="text-4xl block mb-3 text-emerald-700 font-bold">⚜</span>
                <h3 className="font-serif text-xl font-bold text-luxury-black uppercase tracking-wide mb-2">Session Scheduled</h3>
                <p className="text-xs text-gray-500 max-w-xs mx-auto">An invitation link has been dispatched to your phone and the Maison consultant desk. Namaste!</p>
              </div>
            ) : (
              <form onSubmit={handleBookConsultation} className="space-y-4">
                <div className="text-center mb-4">
                  <span className="text-gold-600 text-[10px] uppercase tracking-[0.3em] font-bold block mb-1">Maison Salon Booking</span>
                  <h3 className="font-serif text-lg font-bold text-luxury-black uppercase tracking-wide">Book A Video Consultation</h3>
                  <p className="text-[10px] text-gray-500 mt-1">Book an appointment for: {product.name}</p>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Full Name</label>
                  <input
                    id="book-name"
                    type="text"
                    required
                    placeholder="e.g. Aditi Sharma"
                    value={bookingName}
                    onChange={(e) => setBookingName(e.target.value)}
                    className="w-full border border-gold-300 text-xs rounded px-3 py-2 text-gray-700 focus:outline-none focus:border-gold-600"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Mobile Contact Number</label>
                  <input
                    id="book-phone"
                    type="tel"
                    required
                    placeholder="e.g. +91 99999 12345"
                    value={bookingPhone}
                    onChange={(e) => setBookingPhone(e.target.value)}
                    className="w-full border border-gold-300 text-xs rounded px-3 py-2 text-gray-700 focus:outline-none focus:border-gold-600"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Preferred Time Slot</label>
                  <input
                    id="book-time"
                    type="datetime-local"
                    required
                    value={bookingTime}
                    onChange={(e) => setBookingTime(e.target.value)}
                    className="w-full border border-gold-300 text-xs rounded px-3 py-2 text-gray-700 focus:outline-none focus:border-gold-600"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Notes / Preferences (Optional)</label>
                  <textarea
                    id="book-notes"
                    rows={2}
                    placeholder="Specific design parameters, ring sizes, gold preference..."
                    value={bookingNotes}
                    onChange={(e) => setBookingNotes(e.target.value)}
                    className="w-full border border-gold-300 text-xs rounded px-3 py-2 text-gray-700 focus:outline-none focus:border-gold-600"
                  />
                </div>

                <button
                  id="submit-booking-btn"
                  type="submit"
                  className="w-full bg-luxury-black hover:bg-gold-600 hover:text-black text-white font-bold text-xs uppercase tracking-widest py-3 transition rounded"
                >
                  Schedule Private Video Call
                </button>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
