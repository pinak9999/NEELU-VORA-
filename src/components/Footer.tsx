import React, { useState } from 'react';
import { Mail, Phone, MapPin, Sparkles } from 'lucide-react';

interface FooterProps {
  onNavigate: (view: any, params?: any) => void;
}

export default function Footer({ onNavigate }: FooterProps) {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      console.log(`[Newsletter Subscription] Registered user email: ${email}`);
      setSubscribed(true);
      setEmail('');
    }
  };

  return (
    <footer id="footer-section" className="bg-luxury-black text-white pt-0 pb-12 border-t border-gold-800/20">
      
      {/* Prestige Trust Badges Grid from Theme Design */}
      <div className="border-b border-gold-500/10 grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-gold-500/10 mb-12 bg-gold-500/5">
        <div className="flex flex-col items-center justify-center py-6 text-center px-4">
          <span className="text-[10px] uppercase tracking-[0.2em] text-[#D4AF37] font-bold mb-1">Purity Guaranteed</span>
          <span className="text-[11px] font-light text-gray-400">BIS Hallmark Certified</span>
        </div>
        <div className="flex flex-col items-center justify-center py-6 text-center px-4">
          <span className="text-[10px] uppercase tracking-[0.2em] text-[#D4AF37] font-bold mb-1">Secure Logistics</span>
          <span className="text-[11px] font-light text-gray-400">Insured Global Shipping</span>
        </div>
        <div className="flex flex-col items-center justify-center py-6 text-center px-4">
          <span className="text-[10px] uppercase tracking-[0.2em] text-[#D4AF37] font-bold mb-1">Artisanal Legacy</span>
          <span className="text-[11px] font-light text-gray-400">Hand-linked in Jaipur</span>
        </div>
        <div 
          onClick={() => onNavigate('home')}
          className="flex flex-col items-center justify-center py-6 text-center px-4 bg-[#D4AF37]/5 cursor-pointer hover:bg-[#D4AF37]/10 transition"
        >
          <span className="text-[10px] uppercase tracking-[0.2em] text-[#D4AF37] font-bold mb-1">Private Viewing</span>
          <span className="text-[11px] font-serif italic text-[#D4AF37] hover:underline">Book a Video Consultation &rarr;</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Core footer columns */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 border-b border-gold-950 pb-12">
          
          {/* Brand block */}
          <div className="md:col-span-1">
            <span className="block font-serif text-2xl tracking-widest text-gold-300 font-bold uppercase mb-4">
              Neelu Vora
            </span>
            <p className="text-xs text-gold-100/70 leading-relaxed font-sans mb-6">
              An ultra-premium atelier preserving generations of hand-forged Indian goldsmithing and handloomed textile arts. Designed for enduring bridal legacies and timeless collections.
            </p>
            <div className="flex space-x-4">
              <a href="https://instagram.com" target="_blank" referrerPolicy="no-referrer" className="text-gold-300 hover:text-white transition text-xs uppercase tracking-widest">Instagram</a>
              <a href="https://whatsapp.com" target="_blank" referrerPolicy="no-referrer" className="text-gold-300 hover:text-white transition text-xs uppercase tracking-widest">WhatsApp</a>
            </div>
          </div>

          {/* Customer Service pages */}
          <div>
            <h4 className="text-xs uppercase tracking-[0.2em] font-bold text-gold-400 mb-4">Atelier Policies</h4>
            <ul className="space-y-3 text-xs text-gold-100/70">
              <li><button onClick={() => onNavigate('static', { page: 'shipping' })} className="hover:text-gold-300 transition text-left">Shipping & Delivery</button></li>
              <li><button onClick={() => onNavigate('static', { page: 'return' })} className="hover:text-gold-300 transition text-left">Returns & Exchanges</button></li>
              <li><button onClick={() => onNavigate('static', { page: 'terms' })} className="hover:text-gold-300 transition text-left">Terms of Service</button></li>
              <li><button onClick={() => onNavigate('static', { page: 'privacy' })} className="hover:text-gold-300 transition text-left">Privacy Policy</button></li>
            </ul>
          </div>

          {/* About & Blogs links */}
          <div>
            <h4 className="text-xs uppercase tracking-[0.2em] font-bold text-gold-400 mb-4">The Maison</h4>
            <ul className="space-y-3 text-xs text-gold-100/70">
              <li><button onClick={() => onNavigate('static', { page: 'about' })} className="hover:text-gold-300 transition text-left">Our Heritage Story</button></li>
              <li><button onClick={() => onNavigate('static', { page: 'contact' })} className="hover:text-gold-300 transition text-left">Contact & Atelier Map</button></li>
              <li><button onClick={() => onNavigate('home', { section: 'blogs' })} className="hover:text-gold-300 transition text-left">Craft Heritage Journal</button></li>
              <li><button onClick={() => onNavigate('lookbook')} className="hover:text-gold-300 transition text-left">Shop The Reel Lookbook</button></li>
            </ul>
          </div>

          {/* Newsletter subscription */}
          <div>
            <h4 className="text-xs uppercase tracking-[0.2em] font-bold text-gold-400 mb-4">Join The Club</h4>
            <p className="text-xs text-gold-100/70 leading-relaxed mb-4">
              Subscribe to receive exclusive invitations to private viewings, seasonal lookbooks, and craft insights.
            </p>
            {subscribed ? (
              <div className="bg-gold-950/40 border border-gold-800/40 p-3 rounded text-center">
                <span className="text-xs text-gold-300 font-medium flex items-center justify-center">
                  <Sparkles size={14} className="mr-1 text-gold-400" />
                  Welcome to the Atelier Circle
                </span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex flex-col space-y-2">
                <input
                  id="newsletter-email"
                  type="email"
                  required
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-gold-950/20 border border-gold-800/30 text-xs px-3 py-2 text-white placeholder-gold-800 rounded focus:outline-none focus:border-gold-400"
                />
                <button
                  id="newsletter-submit"
                  type="submit"
                  className="bg-gold-600 hover:bg-gold-500 text-black font-semibold text-xs tracking-widest uppercase py-2 transition rounded"
                >
                  Request Invite
                </button>
              </form>
            )}
          </div>

        </div>

        {/* Bottom line coordinates */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-[11px] text-gold-100/50">
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mb-4 sm:mb-0">
            <span className="flex items-center"><MapPin size={12} className="mr-1 text-gold-400" /> Colaba, Mumbai</span>
            <span className="flex items-center"><Phone size={12} className="mr-1 text-gold-400" /> +91 22 4599 0000</span>
            <span className="flex items-center"><Mail size={12} className="mr-1 text-gold-400" /> concierge@neeluvora.com</span>
          </div>
          <div className="text-center sm:text-right">
            &copy; {new Date().getFullYear()} Neelu Vora Fashion Pvt. Ltd. All Rights Reserved.
          </div>
        </div>

      </div>
    </footer>
  );
}
