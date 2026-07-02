import { Sparkles, Play, Eye, ShoppingCart } from 'lucide-react';
import { Product } from '../types';

interface LookbookPageProps {
  products: Product[];
  onNavigate: (view: any, params?: any) => void;
}

export default function LookbookPage({ products, onNavigate }: LookbookPageProps) {
  
  // Custom lookbook spots linked with seed items
  const lookbooks = [
    {
      id: 'look-1',
      title: 'Mughal Imperial Legacy',
      description: 'The Royal Mayura Choker paired with a handwoven Banarasi Crimson Silk Saree.',
      image: 'https://images.unsplash.com/photo-1601121141461-9d6647bca1ed?auto=format&fit=crop&w=800&q=80',
      tagProducts: ['p-1', 'p-4'], // links to kundan chokar & banarasi saree
      instagramUrl: 'https://instagram.com'
    },
    {
      id: 'look-2',
      title: 'Rajasthani Sunset Bridal',
      description: 'Mayura filigree kadas reflecting gold heritage warmth against pastel mint saree borders.',
      image: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&w=800&q=80',
      tagProducts: ['p-2', 'p-5'], // bangles & cotton-silk saree
      instagramUrl: 'https://instagram.com'
    },
    {
      id: 'look-3',
      title: 'The Modern Queen Solitaire',
      description: 'Royal emerald diamond ring paired with traditional Varanasi brocade silks.',
      image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=800&q=80',
      tagProducts: ['p-3', 'p-4'], // ring & saree
      instagramUrl: 'https://instagram.com'
    },
    {
      id: 'look-4',
      title: 'Varanasi Weave Chronicles',
      description: 'Featherlight Chanderi floral weaves styled with classic filigree cuffs.',
      image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80',
      tagProducts: ['p-5', 'p-2'], // cotton saree & bangles
      instagramUrl: 'https://instagram.com'
    }
  ];

  return (
    <div id="lookbook-view-container" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fadeIn">
      
      {/* Header */}
      <div className="text-center border-b border-gold-200 pb-8 mb-12">
        <span className="text-gold-600 text-[10px] uppercase tracking-[0.3em] font-bold block mb-2">Atelier Reels</span>
        <h1 className="font-serif text-3xl sm:text-4xl text-luxury-black font-bold tracking-wide">Shop The Reel Lookbook</h1>
        <p className="text-xs text-gray-500 max-w-lg mx-auto leading-relaxed mt-2">
          Browse styled catalog frames straight from our designers. Tap on any reel card to discover and shop the featured jewelry masterworks and handloomed sarees instantly.
        </p>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {lookbooks.map((look) => {
          // Resolve linked products
          const matchedProducts = products.filter(p => look.tagProducts.includes(p.id));

          return (
            <div key={look.id} className="bg-white border border-gold-200/50 rounded overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between">
              
              {/* Image Frame with Reel Play simulation overlay */}
              <div className="relative aspect-[4/3] bg-luxury-cream overflow-hidden group">
                <img
                  src={look.image}
                  alt={look.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-black/30 opacity-100 group-hover:opacity-40 transition-opacity flex items-center justify-center">
                  <span className="p-4 bg-white/90 rounded-full text-gold-700 shadow-xl group-hover:scale-110 transition-transform">
                    <Play size={20} fill="currentColor" />
                  </span>
                </div>
              </div>

              {/* Description & Featured product tagging */}
              <div className="p-6 space-y-4">
                <div>
                  <h3 className="font-serif text-lg font-bold text-luxury-black flex items-center gap-1">
                    <Sparkles size={16} className="text-gold-600 animate-pulse" />
                    {look.title}
                  </h3>
                  <p className="text-xs text-gray-600 leading-relaxed mt-1.5">{look.description}</p>
                </div>

                {/* Tagged shop coordinates */}
                <div className="border-t border-gold-100 pt-4">
                  <span className="text-[10px] uppercase font-bold text-gold-600 tracking-wider block mb-3">Shop Featured Items in Look:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {matchedProducts.map(p => (
                      <div
                        key={p.id}
                        onClick={() => onNavigate('product', { id: p.id })}
                        className="flex items-center space-x-2 p-2 border border-gold-100 rounded hover:border-gold-400 cursor-pointer transition bg-gold-50/20"
                      >
                        <img src={p.images[0]} alt="" className="w-8 h-10 object-cover rounded border border-gold-100" />
                        <div className="flex-1 min-w-0">
                          <span className="block text-xs font-serif font-bold text-luxury-black line-clamp-1">{p.name}</span>
                          <span className="block font-mono text-[9px] text-gray-400">₹{(p.discountedPrice || p.price).toLocaleString()}</span>
                        </div>
                        <span className="text-gold-600 hover:text-gold-800 text-xs font-bold">&rarr;</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
}
