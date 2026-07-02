import React, { useState, useEffect } from 'react';
import { SlidersHorizontal, ArrowUpDown, Filter, RotateCcw } from 'lucide-react';
import { Product } from '../types';
import ProductCard from './ProductCard';

interface CollectionPageProps {
  initialCategory?: string;
  initialQuery?: string;
  onNavigate: (view: any, params?: any) => void;
  wishlist: string[];
  onToggleWishlist: (productId: string, e: React.MouseEvent) => void;
  onAddToCart: (product: Product, e: React.MouseEvent) => void;
}

export default function CollectionPage({
  initialCategory = '',
  initialQuery = '',
  onNavigate,
  wishlist,
  onToggleWishlist,
  onAddToCart
}: CollectionPageProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [category, setCategory] = useState(initialCategory);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [metal, setMetal] = useState('');
  const [purity, setPurity] = useState('');
  const [fabric, setFabric] = useState('');
  const [color, setColor] = useState('');
  const [occasion, setOccasion] = useState('');
  const [sort, setSort] = useState('newest');
  const [maxPrice, setMaxPrice] = useState(200000);

  // Sync inputs with incoming props
  useEffect(() => {
    setCategory(initialCategory);
    setSearchQuery(initialQuery);
  }, [initialCategory, initialQuery]);

  // Fetch filtered catalog products from API
  useEffect(() => {
    setLoading(true);
    let url = `/api/products?sort=${sort}`;
    if (category) url += `&category=${encodeURIComponent(category)}`;
    if (searchQuery) url += `&q=${encodeURIComponent(searchQuery)}`;
    if (metal) url += `&metal=${encodeURIComponent(metal)}`;
    if (purity) url += `&purity=${encodeURIComponent(purity)}`;
    if (fabric) url += `&fabric=${encodeURIComponent(fabric)}`;
    if (color) url += `&color=${encodeURIComponent(color)}`;

    fetch(url)
      .then(res => res.json())
      .then((data: Product[]) => {
        // Price slider client-side filtering for sub-adjusts
        let filtered = data.filter(p => (p.discountedPrice || p.price) <= maxPrice);
        if (occasion) {
          filtered = filtered.filter(p => p.occasion?.toLowerCase() === occasion.toLowerCase());
        }
        setProducts(filtered);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [category, searchQuery, metal, purity, fabric, color, occasion, sort, maxPrice]);

  const resetFilters = () => {
    setCategory('');
    setSearchQuery('');
    setMetal('');
    setPurity('');
    setFabric('');
    setColor('');
    setOccasion('');
    setSort('newest');
    setMaxPrice(200000);
  };

  const isJewelryCategory = ['Necklaces', 'Bangles', 'Rings'].includes(category);
  const isApparelCategory = ['Silk Sarees', 'Cotton Sarees'].includes(category);

  return (
    <div id="collection-view-container" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fadeIn">
      
      {/* Catalog Title */}
      <div className="border-b border-gold-200 pb-5 mb-8 flex flex-col md:flex-row items-baseline justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-luxury-black tracking-wide">
            {category ? `${category} Collection` : 'The Haute Atelier Catalog'}
          </h1>
          <p className="text-xs text-gray-500 mt-1 font-light tracking-wide uppercase">
            {products.length} Masterpiece{products.length !== 1 ? 's' : ''} available
          </p>
        </div>
        
        {/* Sort and Actions */}
        <div className="flex items-center space-x-4 self-end w-full md:w-auto">
          <div className="flex items-center space-x-2 text-xs border border-gold-300 rounded bg-white px-3 py-1.5 text-gray-700 w-full md:w-auto">
            <ArrowUpDown size={14} className="text-gold-600" />
            <select
              id="catalog-sort"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="bg-transparent focus:outline-none text-xs font-semibold uppercase tracking-wider w-full cursor-pointer"
            >
              <option value="newest">Sort: Newest</option>
              <option value="low-high">Price: Low to High</option>
              <option value="high-low">Price: High to Low</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Filter Sidebar Panel */}
        <aside id="filter-sidebar" className="lg:col-span-1 bg-white border border-gold-200/50 p-6 rounded shadow-sm self-start">
          <div className="flex items-center justify-between border-b border-gold-100 pb-3 mb-6">
            <h4 className="font-serif text-base font-bold text-luxury-black flex items-center gap-1.5 uppercase tracking-wide">
              <SlidersHorizontal size={16} className="text-gold-600" />
              Atelier Filters
            </h4>
            <button
              id="reset-filters-btn"
              onClick={resetFilters}
              className="text-[10px] uppercase font-bold text-gold-600 hover:text-gold-800 tracking-wider flex items-center gap-1 transition"
            >
              <RotateCcw size={10} /> Reset
            </button>
          </div>

          <div className="space-y-6">
            {/* Category Filter */}
            <div>
              <h5 className="text-[11px] uppercase tracking-wider font-bold text-luxury-black mb-2.5">Category</h5>
              <div className="space-y-2 text-xs">
                {['Necklaces', 'Bangles', 'Rings', 'Silk Sarees', 'Cotton Sarees'].map(cat => (
                  <label key={cat} className="flex items-center cursor-pointer text-gray-600 hover:text-luxury-black">
                    <input
                      type="radio"
                      name="cat-group"
                      checked={category === cat}
                      onChange={() => setCategory(cat)}
                      className="accent-gold-600 mr-2.5"
                    />
                    <span>{cat}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Price Filter Slider */}
            <div>
              <div className="flex justify-between text-[11px] uppercase tracking-wider font-bold text-luxury-black mb-2.5">
                <span>Max Price</span>
                <span className="font-mono text-gold-700">₹{maxPrice.toLocaleString()}</span>
              </div>
              <input
                id="price-range-slider"
                type="range"
                min="10000"
                max="200000"
                step="5000"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full h-1.5 bg-gold-50 rounded-lg appearance-none cursor-pointer accent-gold-600"
              />
            </div>

            {/* Jewelry-specific metal selection */}
            {(!category || isJewelryCategory) && (
              <>
                <div>
                  <h5 className="text-[11px] uppercase tracking-wider font-bold text-luxury-black mb-2.5">Metal Type</h5>
                  <select
                    id="metal-type-filter"
                    value={metal}
                    onChange={(e) => setMetal(e.target.value)}
                    className="w-full bg-white border border-gold-300 rounded text-xs p-2 text-gray-700 focus:outline-none focus:border-gold-600 cursor-pointer uppercase tracking-wider"
                  >
                    <option value="">All Metals</option>
                    <option value="Gold">Gold Only</option>
                    <option value="Silver">Silver Only</option>
                  </select>
                </div>

                <div>
                  <h5 className="text-[11px] uppercase tracking-wider font-bold text-luxury-black mb-2.5">Gold Purity</h5>
                  <select
                    id="purity-filter"
                    value={purity}
                    onChange={(e) => setPurity(e.target.value)}
                    className="w-full bg-white border border-gold-300 rounded text-xs p-2 text-gray-700 focus:outline-none focus:border-gold-600 cursor-pointer uppercase tracking-wider"
                  >
                    <option value="">All Purities</option>
                    <option value="18K">18K Gold</option>
                    <option value="22K">22K Gold</option>
                    <option value="24K">24K Pure Gold</option>
                  </select>
                </div>
              </>
            )}

            {/* Saree-specific fabric selection */}
            {(!category || isApparelCategory) && (
              <div>
                <h5 className="text-[11px] uppercase tracking-wider font-bold text-luxury-black mb-2.5">Fabric</h5>
                <select
                  id="fabric-filter"
                  value={fabric}
                  onChange={(e) => setFabric(e.target.value)}
                  className="w-full bg-white border border-gold-300 rounded text-xs p-2 text-gray-700 focus:outline-none focus:border-gold-600 cursor-pointer uppercase tracking-wider"
                >
                  <option value="">All Fabrics</option>
                  <option value="Silk">Mulberry Silk</option>
                  <option value="Katan Silk">Katan Silk</option>
                  <option value="Chanderi Cotton-Silk">Chanderi Cotton-Silk</option>
                </select>
              </div>
            )}

            {/* Universal occasion filter */}
            <div>
              <h5 className="text-[11px] uppercase tracking-wider font-bold text-luxury-black mb-2.5">Occasion</h5>
              <select
                id="occasion-filter"
                value={occasion}
                onChange={(e) => setOccasion(e.target.value)}
                className="w-full bg-white border border-gold-300 rounded text-xs p-2 text-gray-700 focus:outline-none focus:border-gold-600 cursor-pointer uppercase tracking-wider"
              >
                <option value="">All Occasions</option>
                <option value="Bridal">Bridal Wear</option>
                <option value="Festive">Festive Wear</option>
                <option value="Engagement">Engagement</option>
              </select>
            </div>

            {/* Colors */}
            <div>
              <h5 className="text-[11px] uppercase tracking-wider font-bold text-luxury-black mb-2.5">Signature Tone</h5>
              <select
                id="color-filter"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-full bg-white border border-gold-300 rounded text-xs p-2 text-gray-700 focus:outline-none focus:border-gold-600 cursor-pointer uppercase tracking-wider"
              >
                <option value="">All Tones</option>
                <option value="Gold">Luxury Gold</option>
                <option value="Crimson Red">Crimson Red</option>
                <option value="Pastel Mint">Pastel Mint</option>
                <option value="Emerald Green">Emerald Green</option>
              </select>
            </div>

          </div>
        </aside>

        {/* Catalog Showcase Grid */}
        <main className="lg:col-span-3">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 text-gray-400 font-serif">
              <span className="animate-spin text-gold-600 text-2xl mb-4 font-bold">⚜</span>
              <span>Invoking the Maison vaults...</span>
            </div>
          ) : products.length === 0 ? (
            <div className="bg-white border border-gold-100 rounded text-center py-16 px-6 shadow-sm">
              <Filter className="text-gold-400 mx-auto mb-3" size={32} />
              <h3 className="font-serif text-lg font-bold text-luxury-black uppercase tracking-wide mb-1">Vault empty</h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto mb-6">No creations matching these criteria are cataloged today. Reset filters to view heritage pieces.</p>
              <button
                onClick={resetFilters}
                className="bg-gold-600 text-black font-bold text-[10px] uppercase tracking-widest px-6 py-2.5 rounded transition"
              >
                Clear Catalog Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map(p => (
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
          )}
        </main>

      </div>
    </div>
  );
}
