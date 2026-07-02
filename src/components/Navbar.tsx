import React, { useState, useEffect } from 'react';
import { Search, ShoppingBag, Heart, User, Sparkles, Menu, X, ArrowRight, ShieldCheck } from 'lucide-react';
import { Product, User as UserType } from '../types';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: any, params?: any) => void;
  cartCount: number;
  wishlistCount: number;
  user: UserType | null;
  onLogout: () => void;
}

export default function Navbar({
  currentView,
  onNavigate,
  cartCount,
  wishlistCount,
  user,
  onLogout
}: NavbarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  // Fetch search suggestions
  useEffect(() => {
    if (searchQuery.trim().length > 1) {
      fetch(`/api/products?q=${encodeURIComponent(searchQuery)}`)
        .then(res => res.json())
        .then((data: Product[]) => {
          setSearchResults(data.slice(0, 5));
        })
        .catch(err => console.error(err));
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onNavigate('collection', { q: searchQuery });
      setShowSearch(false);
      setSearchQuery('');
    }
  };

  return (
    <header id="nav-header" className="sticky top-0 z-50 bg-luxury-black text-white border-b border-gold-800/30 shadow-lg">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 relative">
          
          {/* Mobile Menu Button */}
          <button
            id="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-gold-300 hover:text-white p-1 sm:p-2"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          {/* Left: Navigation Categories */}
          <nav className="hidden md:flex items-center space-x-6 text-xs uppercase tracking-widest font-medium text-gold-100">
            <button 
              id="nav-home"
              onClick={() => onNavigate('home')} 
              className={`hover:text-gold-400 transition ${currentView === 'home' ? 'text-gold-400 border-b border-gold-400 pb-1' : ''}`}
            >
              Home
            </button>
            <div className="relative group">
              <button 
                id="nav-jewelry-dropdown"
                onClick={() => onNavigate('collection', { category: 'Necklaces' })}
                className="hover:text-gold-400 py-2 transition"
              >
                Fine Jewelry
              </button>
              <div className="absolute top-full left-0 hidden group-hover:block bg-luxury-black border border-gold-800/30 text-xs w-44 py-2 mt-0 shadow-2xl">
                <button id="nav-necklaces" onClick={() => onNavigate('collection', { category: 'Necklaces' })} className="w-full text-left px-4 py-2 hover:bg-gold-950/40 text-gold-100 hover:text-gold-400">Necklaces</button>
                <button id="nav-bangles" onClick={() => onNavigate('collection', { category: 'Bangles' })} className="w-full text-left px-4 py-2 hover:bg-gold-950/40 text-gold-100 hover:text-gold-400">Bangles</button>
                <button id="nav-rings" onClick={() => onNavigate('collection', { category: 'Rings' })} className="w-full text-left px-4 py-2 hover:bg-gold-950/40 text-gold-100 hover:text-gold-400">Rings</button>
              </div>
            </div>
            <div className="relative group">
              <button 
                id="nav-apparel-dropdown"
                onClick={() => onNavigate('collection', { category: 'Silk Sarees' })}
                className="hover:text-gold-400 py-2 transition"
              >
                Luxury Apparel
              </button>
              <div className="absolute top-full left-0 hidden group-hover:block bg-luxury-black border border-gold-800/30 text-xs w-44 py-2 mt-0 shadow-2xl">
                <button id="nav-silk-sarees" onClick={() => onNavigate('collection', { category: 'Silk Sarees' })} className="w-full text-left px-4 py-2 hover:bg-gold-950/40 text-gold-100 hover:text-gold-400">Silk Sarees</button>
                <button id="nav-cotton-sarees" onClick={() => onNavigate('collection', { category: 'Cotton Sarees' })} className="w-full text-left px-4 py-2 hover:bg-gold-950/40 text-gold-100 hover:text-gold-400">Cotton Sarees</button>
              </div>
            </div>
            <button 
              id="nav-lookbook"
              onClick={() => onNavigate('lookbook')} 
              className={`hover:text-gold-400 transition ${currentView === 'lookbook' ? 'text-gold-400 border-b border-gold-400 pb-1' : ''}`}
            >
              Lookbook
            </button>
          </nav>

          {/* Center: Brand Logo */}
          <div className="absolute left-1/2 -translate-x-1/2 text-center w-max">
            <button id="logo-btn" onClick={() => onNavigate('home')} className="inline-block text-center group">
              <span className="block font-serif text-base sm:text-2xl tracking-widest text-gold-300 font-bold uppercase transition group-hover:text-gold-100 whitespace-nowrap">
                Neelu Vora
              </span>
              <span className="block text-[6px] sm:text-[8px] tracking-[0.2em] sm:tracking-[0.4em] uppercase text-gold-400 text-center font-sans font-medium mt-0.5 sm:mt-0 whitespace-nowrap">
                Fashion • Haute Atelier
              </span>
            </button>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center justify-end space-x-1.5 sm:space-x-4">
            
            {/* Search Toggle */}
            <div className="relative">
              <button
                id="nav-search-btn"
                onClick={() => setShowSearch(!showSearch)}
                className="p-1 sm:p-2 text-gold-300 hover:text-white transition"
                title="Search Products"
              >
                <Search size={20} />
              </button>
              {showSearch && (
                <div className="absolute right-0 mt-3 w-72 sm:w-80 bg-luxury-black border border-gold-800/50 p-3 shadow-2xl rounded">
                  <form onSubmit={handleSearchSubmit} className="flex">
                    <input
                      id="search-input-field"
                      type="text"
                      placeholder="Search neckless, sarees..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="flex-1 bg-gold-950/30 border border-gold-800/30 rounded-l px-3 py-1 text-xs text-white placeholder-gold-700 focus:outline-none focus:border-gold-400"
                    />
                    <button id="search-submit-btn" type="submit" className="bg-gold-600 hover:bg-gold-500 rounded-r px-3 text-xs flex items-center justify-center">
                      <ArrowRight size={14} />
                    </button>
                  </form>
                  {/* Results preview */}
                  {searchResults.length > 0 && (
                    <div className="mt-2 divide-y divide-gold-950">
                      {searchResults.map(p => (
                        <div
                          key={p.id}
                          onClick={() => {
                            onNavigate('product', { id: p.id });
                            setShowSearch(false);
                            setSearchQuery('');
                          }}
                          className="flex items-center py-2 px-1 hover:bg-gold-950/20 cursor-pointer transition text-left"
                        >
                          <img src={p.images[0]} alt={p.name} className="w-8 h-8 object-cover rounded border border-gold-800/20 mr-2" />
                          <div>
                            <div className="text-xs font-medium text-gold-100 line-clamp-1">{p.name}</div>
                            <div className="text-[10px] text-gold-400">₹{(p.discountedPrice || p.price).toLocaleString()}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Wishlist */}
            <button
              id="nav-wishlist-btn"
              onClick={() => onNavigate('account', { tab: 'wishlist' })}
              className="p-1 sm:p-2 text-gold-300 hover:text-white transition relative"
              title="My Wishlist"
            >
              <Heart size={20} />
              {wishlistCount > 0 && (
                <span id="wishlist-badge" className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-[9px] font-bold leading-none text-black bg-gold-400 rounded-full">
                  {wishlistCount}
                </span>
              )}
            </button>

            {/* Cart */}
            <button
              id="nav-cart-btn"
              onClick={() => onNavigate('cart')}
              className="p-1 sm:p-2 text-gold-300 hover:text-white transition relative"
              title="Shopping Cart"
            >
              <ShoppingBag size={20} />
              {cartCount > 0 && (
                <span id="cart-badge" className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-[9px] font-bold leading-none text-black bg-gold-400 rounded-full">
                  {cartCount}
                </span>
              )}
            </button>

            {/* User Account / Admin Dropdown */}
            <div className="relative">
              <button
                id="nav-user-dropdown-btn"
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="p-1 sm:p-2 text-gold-300 hover:text-white transition flex items-center"
                title="Account Menu"
              >
                <User size={20} />
              </button>
              {showUserDropdown && (
                <div className="absolute right-0 mt-3 w-48 bg-luxury-black border border-gold-800/40 py-2 shadow-2xl rounded text-xs">
                  {user ? (
                    <>
                      <div className="px-4 py-2 border-b border-gold-950 font-medium text-gold-300">
                        Namaste, {(user.name || user.email || 'Guest').split(' ')[0]}
                      </div>
                      <button id="dropdown-my-orders" onClick={() => { onNavigate('account', { tab: 'orders' }); setShowUserDropdown(false); }} className="w-full text-left px-4 py-2 hover:bg-gold-950/30 text-gold-100 hover:text-gold-400">My Orders</button>
                      <button id="dropdown-profile" onClick={() => { onNavigate('account', { tab: 'profile' }); setShowUserDropdown(false); }} className="w-full text-left px-4 py-2 hover:bg-gold-950/30 text-gold-100 hover:text-gold-400">My Profile</button>
                      
                      {(user.role === 'Super Admin' || user.role === 'Staff') && (
                        <button id="dropdown-admin-panel" onClick={() => { onNavigate('admin'); setShowUserDropdown(false); }} className="w-full text-left px-4 py-2 hover:bg-gold-900/30 text-gold-300 hover:text-gold-400 font-semibold flex items-center border-t border-gold-950 mt-1">
                          <ShieldCheck size={14} className="mr-1.5 text-gold-400" />
                          Admin Console
                        </button>
                      )}

                      <button id="dropdown-logout" onClick={() => { onLogout(); setShowUserDropdown(false); }} className="w-full text-left px-4 py-2 text-red-400 hover:bg-red-950/10 hover:text-red-300 border-t border-gold-950">Logout</button>
                    </>
                  ) : (
                    <>
                      <button id="dropdown-login" onClick={() => { onNavigate('account', { tab: 'login' }); setShowUserDropdown(false); }} className="w-full text-left px-4 py-2 hover:bg-gold-950/30 text-gold-100 hover:text-gold-400 font-medium">Log In / Sign Up</button>
                      <button id="dropdown-guest-track" onClick={() => { onNavigate('account', { tab: 'orders' }); setShowUserDropdown(false); }} className="w-full text-left px-4 py-2 hover:bg-gold-950/30 text-gold-100 hover:text-gold-400">Track Guest Order</button>
                      <button id="dropdown-admin-login-shortcut" onClick={() => { onNavigate('admin'); setShowUserDropdown(false); }} className="w-full text-left px-4 py-2 text-gold-500 hover:bg-gold-950/30 border-t border-gold-950 flex items-center font-medium">
                        <ShieldCheck size={14} className="mr-1.5" />
                        Admin Access
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div id="mobile-drawer" className="md:hidden bg-luxury-black border-t border-gold-800/20 px-4 py-6 space-y-4 text-sm font-medium tracking-wider uppercase text-gold-100 animate-fadeIn">
          <button id="mobile-home" onClick={() => { onNavigate('home'); setMobileMenuOpen(false); }} className="block w-full text-left py-2 border-b border-gold-950">Home</button>
          <button id="mobile-necklaces" onClick={() => { onNavigate('collection', { category: 'Necklaces' }); setMobileMenuOpen(false); }} className="block w-full text-left py-2 border-b border-gold-950">Necklaces</button>
          <button id="mobile-bangles" onClick={() => { onNavigate('collection', { category: 'Bangles' }); setMobileMenuOpen(false); }} className="block w-full text-left py-2 border-b border-gold-950">Bangles</button>
          <button id="mobile-rings" onClick={() => { onNavigate('collection', { category: 'Rings' }); setMobileMenuOpen(false); }} className="block w-full text-left py-2 border-b border-gold-950">Rings</button>
          <button id="mobile-silk-sarees" onClick={() => { onNavigate('collection', { category: 'Silk Sarees' }); setMobileMenuOpen(false); }} className="block w-full text-left py-2 border-b border-gold-950">Silk Sarees</button>
          <button id="mobile-cotton-sarees" onClick={() => { onNavigate('collection', { category: 'Cotton Sarees' }); setMobileMenuOpen(false); }} className="block w-full text-left py-2 border-b border-gold-950">Cotton Sarees</button>
          <button id="mobile-lookbook" onClick={() => { onNavigate('lookbook'); setMobileMenuOpen(false); }} className="block w-full text-left py-2 border-b border-gold-950">Lookbook</button>
          <button id="mobile-account" onClick={() => { onNavigate('account'); setMobileMenuOpen(false); }} className="block w-full text-left py-2 text-gold-400">My Account</button>
        </div>
      )}
    </header>
  );
}
