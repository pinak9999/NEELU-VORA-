import React, { useState, useEffect } from 'react';
import { ArrowRight, Star, Award, ShieldCheck, Truck, RefreshCw, Sparkles, Video } from 'lucide-react';
import { Product, CMSBanner, CMSBlog } from '../types';
import ProductCard from './ProductCard';

interface HomepageProps {
  products: Product[];
  onNavigate: (view: any, params?: any) => void;
  wishlist: string[];
  onToggleWishlist: (productId: string, e: React.MouseEvent) => void;
  onAddToCart: (product: Product, e: React.MouseEvent) => void;
}

export default function Homepage({
  products,
  onNavigate,
  wishlist,
  onToggleWishlist,
  onAddToCart
}: HomepageProps) {
  const [banners, setBanners] = useState<CMSBanner[]>([]);
  const [blogs, setBlogs] = useState<CMSBlog[]>([]);
  const [activeBanner, setActiveBanner] = useState(0);

  // Fetch CMS data
  useEffect(() => {
    fetch('/api/cms')
      .then(res => res.json())
      .then(data => {
        if (data.banners) setBanners(data.banners);
        if (data.blogs) setBlogs(data.blogs);
      })
      .catch(err => console.error(err));
  }, []);

  // Banner slide intervals
  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setActiveBanner(prev => (prev + 1) % banners.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [banners]);

  const categoryTiles = [
    { name: 'Necklaces', img: 'https://images.unsplash.com/photo-1601121141461-9d6647bca1ed?auto=format&fit=crop&w=600&q=80', count: 'Preserving Mughal Kundan' },
    { name: 'Bangles', img: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&w=600&q=80', count: 'Generational Rajasthani' },
    { name: 'Rings', img: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=600&q=80', count: 'Precious Rubies & Diamonds' },
    { name: 'Silk Sarees', img: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80', count: 'Pure Varanasi Brocade' },
    { name: 'Cotton Sarees', img: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=600&q=80', count: 'Featherlight Chanderi Weaves' }
  ];

  const featuredProducts = products.filter(p => p.featured).slice(0, 4);
  const newArrivals = products.slice(-4).reverse();

  return (
    <div id="homepage-container" className="animate-fadeIn">
      
      {/* 1. Hero Banner Carousel */}
      {banners.length > 0 && (
        <section className="relative h-[480px] sm:h-[600px] bg-luxury-black overflow-hidden border-b border-gold-800/20">
          {banners.map((banner, idx) => (
            <div
              key={idx}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${idx === activeBanner ? 'opacity-100' : 'opacity-0'}`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent z-10" />
              <img
                src={banner.image}
                alt={banner.title}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 flex items-center z-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full text-left">
                  <div className="max-w-xl">
                    <span className="text-gold-400 text-xs font-semibold uppercase tracking-[0.3em] block mb-3 animate-slideUp">
                      Exclusive Atelier Design
                    </span>
                    <h1 className="font-serif text-3xl sm:text-5xl text-luxury-cream font-bold leading-tight mb-4 tracking-wide">
                      {banner.title}
                    </h1>
                    <p className="text-sm sm:text-base text-gold-100/80 mb-8 leading-relaxed font-sans font-light">
                      {banner.subtitle}
                    </p>
                    <button
                      onClick={() => onNavigate('collection')}
                      className="bg-gold-500 hover:bg-gold-400 text-black font-bold text-xs uppercase tracking-widest px-8 py-3.5 transition shadow-lg flex items-center gap-2 group rounded"
                    >
                      <span>{banner.ctaText}</span>
                      <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Carousel dots indicator */}
          {banners.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-2.5 z-30">
              {banners.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveBanner(idx)}
                  className={`w-2.5 h-2.5 rounded-full border border-gold-400/50 transition-all ${idx === activeBanner ? 'bg-gold-400 w-6' : 'bg-transparent'}`}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* 2. Trust Badges Row */}
      <section className="bg-luxury-black/95 py-8 border-b border-gold-800/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="flex flex-col items-center">
              <Award size={32} className="text-gold-400 mb-2" />
              <h5 className="text-[11px] uppercase tracking-wider font-bold text-gold-100">Certified Purity</h5>
              <p className="text-[10px] text-gold-100/50 mt-1 font-light">Hallmarked 22K Gold & Pure Silks</p>
            </div>
            <div className="flex flex-col items-center">
              <ShieldCheck size={32} className="text-gold-400 mb-2" />
              <h5 className="text-[11px] uppercase tracking-wider font-bold text-gold-100">Secure Insured Transit</h5>
              <p className="text-[10px] text-gold-100/50 mt-1 font-light">Armored Escort on Precious Jewels</p>
            </div>
            <div className="flex flex-col items-center">
              <RefreshCw size={32} className="text-gold-400 mb-2" />
              <h5 className="text-[11px] uppercase tracking-wider font-bold text-gold-100">Concierge Returns</h5>
              <p className="text-[10px] text-gold-100/50 mt-1 font-light">Flexible 3-Day checks & 7-Day saree returns</p>
            </div>
            <div className="flex flex-col items-center">
              <Truck size={32} className="text-gold-400 mb-2" />
              <h5 className="text-[11px] uppercase tracking-wider font-bold text-gold-100">Free Express Delivery</h5>
              <p className="text-[10px] text-gold-100/50 mt-1 font-light">Complimentary logistics over ₹15,000</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Category Tiles Grid */}
      <section className="py-16 bg-luxury-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-gold-600 text-[11px] uppercase tracking-[0.3em] block mb-2 font-semibold">
            Atelier Directories
          </span>
          <h2 className="font-serif text-2xl sm:text-4xl text-luxury-black font-bold mb-10 tracking-wide">
            Shop By Signature Categories
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {categoryTiles.map((cat, idx) => (
              <div
                key={idx}
                onClick={() => onNavigate('collection', { category: cat.name })}
                className="group relative h-72 rounded overflow-hidden cursor-pointer shadow-sm hover:shadow-lg transition-all duration-500 border border-gold-200/20"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10 group-hover:from-black/95 transition-all duration-500" />
                <img
                  src={cat.img}
                  alt={cat.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700 ease-out"
                />
                <div className="absolute bottom-6 inset-x-4 z-20 text-center">
                  <h4 className="font-serif text-lg font-bold text-white mb-1 group-hover:text-gold-300 transition duration-300">
                    {cat.name}
                  </h4>
                  <p className="text-[9px] uppercase tracking-widest text-gold-400 font-sans font-medium">
                    {cat.count}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Best Sellers & New Arrivals Showcase */}
      {featuredProducts.length > 0 && (
        <section className="py-16 bg-white border-t border-gold-200/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row items-center justify-between border-b border-gold-100 pb-4 mb-10">
              <div>
                <span className="text-gold-600 text-[10px] uppercase tracking-[0.3em] font-semibold block">
                  Couture Highlights
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-luxury-black tracking-wide mt-1">
                  Atelier Best Sellers
                </h2>
              </div>
              <button
                onClick={() => onNavigate('collection')}
                className="mt-4 sm:mt-0 text-xs font-bold text-gold-600 uppercase tracking-widest hover:text-gold-800 transition flex items-center gap-1"
              >
                <span>View Full Catalog</span>
                <ArrowRight size={14} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.map(p => (
                <ProductCard
                  key={p.id}
                  product={p}
                  onNavigate={onNavigate}
                  isWishlisted={wishlist.includes(p.id)}
                  onToggleWishlist={onToggleWishlist}
                  onAddToCart={onAddToCart}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Promo Banner: Private Consultation */}
      <section className="bg-luxury-black py-16 relative overflow-hidden border-y border-gold-800/20">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gold-900 via-luxury-black to-luxury-black z-0" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <Video size={40} className="text-gold-400 mx-auto mb-4" />
          <span className="text-gold-400 text-xs font-semibold uppercase tracking-[0.3em] block mb-2">
            Maison Concierge Service
          </span>
          <h2 className="font-serif text-2xl sm:text-4xl text-white font-bold mb-4 tracking-wide leading-tight">
            Book A Private Video Consultation
          </h2>
          <p className="text-xs sm:text-sm text-gold-100/70 max-w-xl mx-auto mb-8 leading-relaxed font-sans">
            Schedule a dedicated, private video chat with Neelu Vora or our senior jewel designers to custom design bridal commissions, custom-fit bangles, or view saree drapes from our boutique floor.
          </p>
          <button
            onClick={() => onNavigate('collection', { category: 'Necklaces' })}
            className="border border-gold-400 hover:bg-gold-400 hover:text-black text-gold-300 font-bold text-xs uppercase tracking-widest px-8 py-3.5 transition duration-500 rounded"
          >
            Schedule Private Session
          </button>
        </div>
      </section>

      {/* 5. New Arrivals Carousel-like shelf */}
      {newArrivals.length > 0 && (
        <section className="py-16 bg-luxury-cream">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row items-center justify-between border-b border-gold-200 pb-4 mb-10">
              <div>
                <span className="text-gold-600 text-[10px] uppercase tracking-[0.3em] font-semibold block">
                  Just Handwoven & Polished
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-luxury-black tracking-wide mt-1">
                  Atelier New Arrivals
                </h2>
              </div>
              <button
                onClick={() => onNavigate('collection')}
                className="mt-4 sm:mt-0 text-xs font-bold text-gold-600 uppercase tracking-widest hover:text-gold-800 transition flex items-center gap-1"
              >
                <span>Browse All New Items</span>
                <ArrowRight size={14} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {newArrivals.map(p => (
                <ProductCard
                  key={p.id}
                  product={p}
                  onNavigate={onNavigate}
                  isWishlisted={wishlist.includes(p.id)}
                  onToggleWishlist={onToggleWishlist}
                  onAddToCart={onAddToCart}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 6. Customer Testimonials */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-gold-600 text-[10px] uppercase tracking-[0.3em] font-bold block mb-2">
            Maison Testimonials
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-luxury-black mb-12 tracking-wide">
            Voices of Trust & Royal Legacy
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-luxury-cream p-6 sm:p-8 rounded border border-gold-200/20 text-left relative shadow-sm">
              <div className="flex text-gold-500 mb-3">
                {[...Array(5)].map((_, i) => <Star key={i} size={14} fill="currentColor" />)}
              </div>
              <p className="text-xs text-gray-600 leading-relaxed italic mb-6">
                "The Varanasi brocade silk saree is beautiful. Heavy luxury borders, exact crimson-red bridal shade, draped beautifully. The armored delivery was very professional too. Recommended!"
              </p>
              <div>
                <h5 className="text-xs font-bold text-luxury-black uppercase tracking-wider">Aishwarya R.</h5>
                <p className="text-[10px] text-gold-600 mt-0.5">Varanasi Saree Bride</p>
              </div>
            </div>
            <div className="bg-luxury-cream p-6 sm:p-8 rounded border border-gold-200/20 text-left relative shadow-sm">
              <div className="flex text-gold-500 mb-3">
                {[...Array(5)].map((_, i) => <Star key={i} size={14} fill="currentColor" />)}
              </div>
              <p className="text-xs text-gray-600 leading-relaxed italic mb-6">
                "We scheduled a private video consultation to view the Kundan choker. Neelu showed us detailed angles and weights. Absolute transparent experience and certified gold purity."
              </p>
              <div>
                <h5 className="text-xs font-bold text-luxury-black uppercase tracking-wider">Shruti Sen</h5>
                <p className="text-[10px] text-gold-600 mt-0.5">Kundan Bridal Client, Delhi</p>
              </div>
            </div>
            <div className="bg-luxury-cream p-6 sm:p-8 rounded border border-gold-200/20 text-left relative shadow-sm">
              <div className="flex text-gold-500 mb-3">
                {[...Array(5)].map((_, i) => <Star key={i} size={14} fill="currentColor" />)}
              </div>
              <p className="text-xs text-gray-600 leading-relaxed italic mb-6">
                "Unparalleled craftsmanship! The Mayura filigree kadas have a substantial royal heft, and the rubies have natural red saturation. Every details feels handcrafted to perfection."
              </p>
              <div>
                <h5 className="text-xs font-bold text-luxury-black uppercase tracking-wider">Princess Aditi</h5>
                <p className="text-[10px] text-gold-600 mt-0.5">Heritage Collector, Jaipur</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Craft Heritage Journal Section */}
      {blogs.length > 0 && (
        <section id="blogs-section" className="py-16 bg-luxury-cream border-t border-gold-200/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <span className="text-gold-600 text-[10px] uppercase tracking-[0.3em] font-bold block mb-2">
                Atelier Chronicles
              </span>
              <h2 className="font-serif text-2xl sm:text-4xl text-luxury-black font-bold tracking-wide">
                The Heritage Craft Journal
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {blogs.map(blog => (
                <div
                  key={blog.id}
                  onClick={() => onNavigate('static', { page: blog.id, isBlog: true, blog })}
                  className="bg-white rounded border border-gold-200/20 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer flex flex-col md:flex-row"
                >
                  <div className="md:w-1/3 h-48 md:h-auto bg-luxury-cream">
                    <img src={blog.image} alt={blog.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="p-6 md:w-2/3 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center text-[10px] uppercase tracking-wider text-gold-600 font-bold mb-2">
                        <span>Journal entry</span>
                        <span className="mx-2">•</span>
                        <span>{new Date(blog.date).toLocaleDateString()}</span>
                      </div>
                      <h3 className="font-serif text-base sm:text-lg font-bold text-luxury-black mb-2 line-clamp-1">
                        {blog.title}
                      </h3>
                      <p className="text-xs text-gray-500 line-clamp-3 leading-relaxed mb-4">
                        {blog.excerpt}
                      </p>
                    </div>
                    <span className="text-xs font-bold text-gold-600 uppercase tracking-widest flex items-center hover:underline">
                      Read Entry &rarr;
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

    </div>
  );
}
