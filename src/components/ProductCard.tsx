import React from 'react';
import { Heart, ShoppingCart, Sparkles } from 'lucide-react';
import { Product } from '../types';

interface ProductCardProps {
  key?: string | number;
  product: Product;
  onNavigate: (view: any, params?: any) => void;
  isWishlisted: boolean;
  onToggleWishlist: (productId: string, e: React.MouseEvent) => void;
  onAddToCart: (product: Product, e: React.MouseEvent) => void;
}

export default function ProductCard({
  product,
  onNavigate,
  isWishlisted,
  onToggleWishlist,
  onAddToCart
}: ProductCardProps) {
  const currentPrice = product.discountedPrice || product.price;
  const hasDiscount = !!product.discountedPrice && product.discountedPrice < product.price;
  const discountPercent = hasDiscount ? Math.round(((product.price - product.discountedPrice!) / product.price) * 100) : 0;

  const isJewelry = ['Necklaces', 'Bangles', 'Rings'].includes(product.category);

  return (
    <div
      id={`product-card-${product.id}`}
      onClick={() => onNavigate('product', { id: product.id })}
      className="group relative bg-white border border-gold-200/40 rounded shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden cursor-pointer flex flex-col justify-between"
    >
      
      {/* Product Image Panel */}
      <div className="relative aspect-[4/5] bg-luxury-cream overflow-hidden">
        <img
          src={product.images[0]}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700 ease-out"
          referrerPolicy="no-referrer"
        />
        
        {/* Transparent dark overlay on hover */}
        <div className="absolute inset-0 bg-luxury-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          {product.featured && (
            <span className="bg-gold-600 text-black text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center">
              <Sparkles size={10} className="mr-0.5" /> Featured
            </span>
          )}
          {hasDiscount && (
            <span className="bg-red-600 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">
              {discountPercent}% OFF
            </span>
          )}
          {product.stockQuantity > 0 && product.stockQuantity <= 3 && (
            <span className="bg-gold-50 text-gold-800 border border-gold-300 text-[8px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded">
              Only {product.stockQuantity} Left
            </span>
          )}
          {product.stockQuantity === 0 && (
            <span className="bg-gray-800 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">
              Sold Out
            </span>
          )}
        </div>

        {/* Wishlist toggle */}
        <button
          id={`wishlist-toggle-${product.id}`}
          onClick={(e) => onToggleWishlist(product.id, e)}
          className="absolute top-3 right-3 p-2 bg-white/90 hover:bg-white rounded-full text-gray-400 hover:text-red-500 shadow-md transition-all z-10"
          title="Add to Wishlist"
        >
          <Heart size={16} fill={isWishlisted ? '#ef4444' : 'none'} className={isWishlisted ? 'text-red-500' : ''} />
        </button>

        {/* Hover Action Strip */}
        {product.stockQuantity > 0 && (
          <div className="absolute bottom-0 inset-x-0 bg-luxury-black/95 text-white transform translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out flex items-center justify-center py-3 z-10">
            <button
              id={`quick-add-${product.id}`}
              onClick={(e) => onAddToCart(product, e)}
              className="flex items-center space-x-2 text-xs font-semibold tracking-widest uppercase hover:text-gold-300 transition"
            >
              <ShoppingCart size={14} className="text-gold-400" />
              <span>Add To Cart</span>
            </button>
          </div>
        )}
      </div>

      {/* Product Information */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Subheader: Category and Metal/Fabric */}
          <div className="flex items-center justify-between text-[10px] text-gray-500 font-medium uppercase tracking-wider mb-1.5">
            <span>{product.category}</span>
            <span>{isJewelry ? product.purity || '22K Gold' : product.fabric || 'Pure Silk'}</span>
          </div>

          {/* Heading */}
          <h3 className="font-serif text-sm sm:text-base text-luxury-black font-semibold line-clamp-1 group-hover:text-gold-700 transition duration-300">
            {product.name}
          </h3>
          
          <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        </div>

        {/* Price and Action Section */}
        <div className="mt-4 pt-3 border-t border-gold-100/50 flex items-center justify-between">
          <div className="flex items-baseline space-x-2 font-mono">
            <span className="text-sm sm:text-base font-bold text-luxury-black">
              ₹{currentPrice.toLocaleString()}
            </span>
            {hasDiscount && (
              <span className="text-xs text-gray-400 line-through">
                ₹{product.price.toLocaleString()}
              </span>
            )}
          </div>
          <span className="text-[10px] uppercase font-bold text-gold-600 tracking-wider group-hover:underline flex items-center">
            View Details &rarr;
          </span>
        </div>
      </div>

    </div>
  );
}
