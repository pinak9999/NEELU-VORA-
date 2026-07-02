import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { LayoutDashboard, ShoppingCart, Tag, Globe, UploadCloud, RefreshCw, FileText, Plus, Trash2, CheckCircle2, Video, Sparkles, Database, Settings, Search, Filter, Edit2, Eye, Edit, ChevronLeft, ChevronRight, AlertCircle, X } from 'lucide-react';
import { Order, Coupon, CMSBanner, CMSBlog, Product, Consultation } from '../types';

interface AdminDashboardProps {
  onNavigate: (view: any, params?: any) => void;
  products: Product[];
  onRefreshProducts: () => void;
  onAdminLogout: () => void;
}

export default function AdminDashboard({ onNavigate, products, onRefreshProducts, onAdminLogout }: AdminDashboardProps) {
  // Shadowed fetch to automatically append the admin security token header
  const fetch = (url: RequestInfo | URL, options: RequestInit = {}) => {
    const token = localStorage.getItem('nm_admin_token') || '';
    const headers = new Headers(options.headers || {});
    headers.set('x-admin-token', token);
    return window.fetch(url, { ...options, headers });
  };

  const [activeTab, setActiveTab] = useState<'stats' | 'orders' | 'coupons' | 'cms' | 'bulk' | 'consultations' | 'products'>('stats');

  // Stats Analytics
  const [orders, setOrders] = useState<Order[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Stats Counters
  const totalSales = orders.filter(o => o.paymentStatus === 'Paid').reduce((acc, o) => acc + o.total, 0);
  const pendingRefundsCount = orders.filter(o => o.orderStatus === 'Return Requested').length;

  // New Coupon Form
  const [newCode, setNewCode] = useState('');
  const [newType, setNewType] = useState<'percentage' | 'flat'>('percentage');
  const [newValue, setNewValue] = useState(10);
  const [newMin, setNewMin] = useState(10000);
  const [newCap, setNewCap] = useState(5000);

  // CMS Banner States
  const [banners, setBanners] = useState<CMSBanner[]>([]);
  const [bannerTitle, setBannerTitle] = useState('');
  const [bannerSub, setBannerSub] = useState('');
  const [bannerImg, setBannerImg] = useState('');
  const [bannerCta, setBannerCta] = useState('Explore');
  const [editingBannerId, setEditingBannerId] = useState<string | null>(null);
  const [deletingBannerId, setDeletingBannerId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Bulk CSV Upload
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<string>('');
  const [uploadLog, setUploadLog] = useState<string>('');
  const [uploading, setUploading] = useState(false);

  // Product management states
  const [prodSearch, setProdSearch] = useState('');
  const [prodCategory, setProdCategory] = useState('all');
  const [prodStatus, setProdStatus] = useState('all');
  const [prodSort, setProdSort] = useState('newest');
  const [prodPage, setProdPage] = useState(1);
  const itemsPerPage = 8;

  // Selected for deletion or edit
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  // Form states for editing
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editPrice, setEditPrice] = useState(0);
  const [editDiscountPrice, setEditDiscountPrice] = useState<number | undefined>(undefined);
  const [editStock, setEditStock] = useState(0);
  const [editDraft, setEditDraft] = useState(false);
  const [editMetalType, setEditMetalType] = useState('');
  const [editPurity, setEditPurity] = useState('');
  const [editFabric, setEditFabric] = useState('');
  const [editColor, setEditColor] = useState('');
  const [editOccasion, setEditOccasion] = useState('');
  const [editImages, setEditImages] = useState<string[]>([]);
  const [editVideos, setEditVideos] = useState<string[]>([]);
  const [editInstagramReels, setEditInstagramReels] = useState<string[]>([]);
  const [editYoutubeVideos, setEditYoutubeVideos] = useState<string[]>([]);

  // Order deletion states
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [deletingOrderSpinner, setDeletingOrderSpinner] = useState(false);

  // Toast / Status notification banner
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  useEffect(() => {
    if (editingProduct) {
      setEditName(editingProduct.name || '');
      setEditCategory(editingProduct.category || '');
      setEditDesc(editingProduct.description || '');
      setEditPrice(editingProduct.price || 0);
      setEditDiscountPrice(editingProduct.discountedPrice);
      setEditStock(editingProduct.stockQuantity || 0);
      setEditDraft(!!editingProduct.draft);
      setEditMetalType(editingProduct.metalType || '');
      setEditPurity(editingProduct.purity || '');
      setEditFabric(editingProduct.fabric || '');
      setEditColor(editingProduct.color || '');
      setEditOccasion(editingProduct.occasion || '');
      setEditImages(editingProduct.images || []);
      setEditVideos(editingProduct.videos || []);
      setEditInstagramReels(editingProduct.instagramReels || (editingProduct.instagramReelUrl ? [editingProduct.instagramReelUrl] : []));
      setEditYoutubeVideos(editingProduct.youtubeVideos || []);
    }
  }, [editingProduct]);

  useEffect(() => {
    setProdPage(1);
  }, [prodSearch, prodCategory, prodStatus, prodSort]);

  // Fetch admin matrix from backend
  const fetchAdminData = () => {
    setLoading(true);
    
    const handleResponse = async (res: Response, fallbackValue: any) => {
      if (res.status === 401) {
        onAdminLogout();
        throw new Error('Unauthorized');
      }
      if (!res.ok) {
        throw new Error(`Request failed with status ${res.status}`);
      }
      return res.json();
    };

    // Fetch orders, coupons, consultations, logs
    const p1 = fetch('/api/orders/all')
      .then(res => handleResponse(res, []))
      .then(data => {
        if (Array.isArray(data)) setOrders(data);
      })
      .catch(err => {
        if (err.message !== 'Unauthorized') console.error('Failed to fetch orders:', err);
      });

    const p2 = fetch('/api/coupons')
      .then(res => handleResponse(res, []))
      .then(data => {
        if (Array.isArray(data)) setCoupons(data);
      })
      .catch(err => {
        if (err.message !== 'Unauthorized') console.error('Failed to fetch coupons:', err);
      });

    const p3 = fetch('/api/consultations')
      .then(res => handleResponse(res, []))
      .then(data => {
        if (Array.isArray(data)) setConsultations(data);
      })
      .catch(err => {
        if (err.message !== 'Unauthorized') console.error('Failed to fetch consultations:', err);
      });

    const p4 = fetch('/api/cms')
      .then(res => handleResponse(res, {}))
      .then(data => {
        if (data && data.banners && Array.isArray(data.banners)) {
          setBanners(data.banners);
        }
      })
      .catch(err => {
        if (err.message !== 'Unauthorized') console.error('Failed to fetch CMS data:', err);
      });

    const p5 = fetch('/api/admin/logs')
      .then(res => handleResponse(res, []))
      .then(data => {
        if (Array.isArray(data)) setLogs(data);
      })
      .catch(err => {
        if (err.message !== 'Unauthorized') console.error('Failed to fetch admin logs:', err);
      });

    Promise.all([p1, p2, p3, p4, p5])
      .then(() => setLoading(false))
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleDeleteOrderConfirm = () => {
    if (!orderToDelete) return;
    setDeletingOrderSpinner(true);
    fetch(`/api/orders/${orderToDelete.id}`, { method: 'DELETE' })
      .then(res => {
        if (!res.ok) throw new Error('Failed to delete order');
        return res.json();
      })
      .then(() => {
        showToast(`Order #${orderToDelete.id} has been permanently deleted.`);
        setOrderToDelete(null);
        fetchAdminData(); // This automatically refreshes all metrics!
      })
      .catch(err => {
        console.error(err);
        showToast('Failed to delete order', 'error');
      })
      .finally(() => {
        setDeletingOrderSpinner(false);
      });
  };

  const handleDeleteProductConfirm = () => {
    if (!deletingProduct) return;
    fetch(`/api/products/${deletingProduct.id}`, { method: 'DELETE' })
      .then(res => res.json())
      .then(() => {
        showToast(`Product "${deletingProduct.name}" deleted successfully.`);
        setDeletingProduct(null);
        setSelectedProductIds(prev => prev.filter(id => id !== deletingProduct.id));
        onRefreshProducts(); // sync store
        fetchAdminData(); // sync audits
      })
      .catch(err => {
        console.error(err);
        showToast('Failed to delete product', 'error');
      });
  };

  const handleBulkDeleteConfirm = () => {
    if (selectedProductIds.length === 0) return;
    fetch('/api/products/bulk-delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: selectedProductIds })
    })
      .then(res => res.json())
      .then(data => {
        showToast(`Successfully deleted ${data.count || selectedProductIds.length} products.`);
        setSelectedProductIds([]);
        setShowBulkDeleteConfirm(false);
        onRefreshProducts(); // sync store
        fetchAdminData(); // sync audits
      })
      .catch(err => {
        console.error(err);
        showToast('Failed to delete selected products', 'error');
      });
  };

  const handleProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct && !isAddingProduct) return;

    const updatedPayload = {
      name: editName,
      category: editCategory,
      description: editDesc,
      price: Number(editPrice),
      discountedPrice: editDiscountPrice ? Number(editDiscountPrice) : undefined,
      stockQuantity: Number(editStock),
      draft: editDraft,
      metalType: editMetalType || undefined,
      purity: editPurity || undefined,
      fabric: editFabric || undefined,
      color: editColor || undefined,
      occasion: editOccasion || undefined,
      images: editImages,
      videos: editVideos,
      instagramReels: editInstagramReels,
      youtubeVideos: editYoutubeVideos,
      instagramReelUrl: editInstagramReels[0] || undefined
    };

    const url = isAddingProduct ? '/api/products' : `/api/products/${editingProduct?.id}`;
    const method = isAddingProduct ? 'POST' : 'PUT';

    fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedPayload)
    })
      .then(async res => {
        if (!res.ok) {
          const errText = await res.text().catch(() => 'Unknown error');
          throw new Error(errText || `Server returned ${res.status}`);
        }
        return res.json().catch(() => ({}));
      })
      .then(() => {
        showToast(`Product "${editName}" ${isAddingProduct ? 'created' : 'updated'} successfully.`);
        setEditingProduct(null);
        setIsAddingProduct(false);
        onRefreshProducts(); // sync store
        fetchAdminData(); // sync audits
      })
      .catch(err => {
        console.error(err);
        showToast(`Failed to ${isAddingProduct ? 'create' : 'update'} product: ${err.message}`, 'error');
      });
  };

  // Update Order Status
  const handleUpdateOrderStatus = (orderId: string, status: string) => {
    fetch(`/api/orders/${orderId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    })
      .then(res => res.json())
      .then((updated: Order) => {
        setOrders(prev => prev.map(o => o.id === updated.id ? updated : o));
        fetchAdminData(); // refresh audit logs
      })
      .catch(err => console.error(err));
  };

  // Shiprocket dispatch simulation (Section 12.2)
  const handleDispatchCourier = (orderId: string) => {
    fetch(`/api/orders/${orderId}/shiprocket`, { method: 'POST' })
      .then(res => res.json())
      .then((updated: Order) => {
        setOrders(prev => prev.map(o => o.id === updated.id ? updated : o));
        fetchAdminData();
      })
      .catch(err => console.error(err));
  };

  // Razorpay refund initiator (Section 12.3)
  const handleSettleRefund = (orderId: string) => {
    fetch(`/api/orders/${orderId}/refund`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refundReason: 'Inspected return validation' })
    })
      .then(res => res.json())
      .then((updated: Order) => {
        setOrders(prev => prev.map(o => o.id === updated.id ? updated : o));
        fetchAdminData();
      })
      .catch(err => console.error(err));
  };

  // Add Promo Coupon Code (Section 11.1)
  const handleAddCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim()) return;

    fetch('/api/coupons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: newCode.trim().toUpperCase(),
        discountType: newType,
        discountValue: Number(newValue),
        minCartValue: Number(newMin),
        maxDiscountCap: newType === 'percentage' ? Number(newCap) : undefined
      })
    })
      .then(res => res.json())
      .then((newC: Coupon) => {
        setCoupons(prev => [...prev, newC]);
        setNewCode('');
        fetchAdminData();
      })
      .catch(err => console.error(err));
  };

  // Delete Promo Coupon
  const handleDeleteCoupon = (couponId: string) => {
    fetch(`/api/coupons/${couponId}`, { method: 'DELETE' })
      .then(() => {
        setCoupons(prev => prev.filter(c => c.id !== couponId));
        fetchAdminData();
      })
      .catch(err => console.error(err));
  };

  // Update CMS Hero Banners
  const handleSaveBanner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bannerTitle || !bannerImg) return;

    let updatedBanners = [...banners];
    
    if (editingBannerId) {
      updatedBanners = updatedBanners.map((b, idx) => 
        (b.id === editingBannerId || idx.toString() === editingBannerId)
        ? {
            ...b,
            image: bannerImg,
            title: bannerTitle,
            subtitle: bannerSub,
            ctaText: bannerCta,
            ctaLink: '/collection'
          }
        : b
      );
    } else {
      updatedBanners.push({
        id: 'banner_' + Date.now().toString(),
        createdAt: new Date().toISOString(),
        image: bannerImg,
        title: bannerTitle,
        subtitle: bannerSub,
        ctaText: bannerCta,
        ctaLink: '/collection'
      });
    }

    const bannerPayload = {
      banners: updatedBanners
    };

    fetch('/api/cms/banners', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bannerPayload)
    })
      .then(res => res.json())
      .then(data => {
        setBanners(Array.isArray(data) ? data : data.banners || updatedBanners);
        resetBannerForm();
        showToast('Banner saved successfully', 'success');
      })
      .catch(err => {
        console.error(err);
        setToastMessage({ type: 'error', text: 'Failed to save banner' });
      });
  };

  const handleEditBanner = (banner: CMSBanner, idx: number) => {
    setEditingBannerId(banner.id || idx.toString());
    setBannerTitle(banner.title);
    setBannerSub(banner.subtitle);
    setBannerImg(banner.image);
    setBannerCta(banner.ctaText || 'Explore');
    
    const formEl = document.getElementById('cms-form-section');
    if (formEl) formEl.scrollIntoView({ behavior: 'smooth' });
  };

  const resetBannerForm = () => {
    setEditingBannerId(null);
    setBannerTitle('');
    setBannerSub('');
    setBannerImg('');
    setBannerCta('Explore');
  };

  const handleConfirmDeleteBanner = () => {
    if (!deletingBannerId) return;

    const updatedBanners = banners.filter((b, idx) => 
      (b.id || idx.toString()) !== deletingBannerId
    );

    fetch(`/api/cms/banners/${deletingBannerId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' }
    })
      .then(res => res.json())
      .then(data => {
        setBanners(Array.isArray(data) ? data : data.banners || updatedBanners);
        setDeletingBannerId(null);
        setToastMessage({ type: 'success', text: 'Banner deleted permanently' });
      })
      .catch(err => {
        console.error(err);
        setToastMessage({ type: 'error', text: 'Failed to delete banner' });
      });
  };

  // Bulk Products CSV parser trigger (Section 13.5)
  const handleCSVUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvFile) return;

    setUploading(true);
    setUploadLog('');

    const reader = new FileReader();
    reader.onload = (evt) => {
      const csvText = evt.target?.result as string;
      
      fetch('/api/products/bulk-csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csvText })
      })
        .then(async res => {
          const result = await res.json();
          if (!res.ok) throw new Error(result.error || 'Parsing error');
          return result;
        })
        .then(data => {
          setUploadLog(`✓ Bulk Catalog update successful! Parsed and uploaded: ${data.count} items.`);
          setUploading(false);
          setCsvFile(null);
          onRefreshProducts(); // sync frontend store
          fetchAdminData();
        })
        .catch(err => {
          setUploadLog(`❌ CSV Parsing failed: ${err.message}`);
          setUploading(false);
        });
    };
    reader.readAsText(csvFile);
  };

  // Prepare simple dynamic data for charts: map total amounts to order dates
  const chartData = orders
    .filter(o => o.paymentStatus === 'Paid')
    .slice(-7)
    .map(o => ({
      date: new Date(o.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      sales: o.total
    }));

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-gray-400 font-serif">
        <span className="animate-spin text-gold-600 text-2xl mb-4 font-bold">⚜</span>
        <span>Unlocking Admin Console Matrix...</span>
      </div>
    );
  }

  return (
    <div id="admin-view-container" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fadeIn">
      
      {/* Admin Title */}
      <div className="border-b border-gold-200 pb-5 mb-8 flex flex-col md:flex-row items-baseline justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-luxury-black tracking-wide flex items-center gap-2">
            <span>Maison Admin Console</span>
            <span className="text-xs bg-gold-600 text-black px-2.5 py-0.5 rounded font-sans uppercase font-bold tracking-widest">Active session</span>
          </h1>
          <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider font-light">
            Real-time fulfillment, campaign coupon adjustments, and product bulk uploading operations.
          </p>
        </div>
        <div>
          <button
            id="admin-header-logout-btn"
            onClick={onAdminLogout}
            className="bg-red-950/20 border border-red-500/30 text-red-400 hover:bg-red-900/20 text-xs uppercase tracking-wider font-bold px-4 py-2 rounded transition cursor-pointer"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left column: Admin navigation */}
        <aside className="lg:col-span-1 bg-luxury-black text-white p-6 rounded shadow-lg space-y-4">
          <div className="text-center border-b border-gold-800/30 pb-4 mb-4">
            <span className="block font-serif text-gold-400 text-lg tracking-widest font-bold">NEELU VORA</span>
            <span className="block text-[8px] tracking-[0.4em] text-gold-500 uppercase mt-0.5 font-medium">Boutique Command Center</span>
          </div>

          <nav className="space-y-1.5 flex flex-col text-xs uppercase tracking-wider font-bold">
            <button
              onClick={() => setActiveTab('stats')}
              className={`w-full text-left px-4 py-3 rounded flex items-center space-x-2 transition ${activeTab === 'stats' ? 'bg-gold-600 text-black' : 'text-gold-200 hover:bg-gold-950/40'}`}
            >
              <LayoutDashboard size={14} />
              <span>Metrics & Logs</span>
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`w-full text-left px-4 py-3 rounded flex items-center space-x-2 transition ${activeTab === 'orders' ? 'bg-gold-600 text-black' : 'text-gold-200 hover:bg-gold-950/40'}`}
            >
              <ShoppingCart size={14} />
              <span>Orders Dispatch ({orders.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('coupons')}
              className={`w-full text-left px-4 py-3 rounded flex items-center space-x-2 transition ${activeTab === 'coupons' ? 'bg-gold-600 text-black' : 'text-gold-200 hover:bg-gold-950/40'}`}
            >
              <Tag size={14} />
              <span>Coupon Engine ({coupons.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('cms')}
              className={`w-full text-left px-4 py-3 rounded flex items-center space-x-2 transition ${activeTab === 'cms' ? 'bg-gold-600 text-black' : 'text-gold-200 hover:bg-gold-950/40'}`}
            >
              <Globe size={14} />
              <span>CMS Page Customization</span>
            </button>
            <button
              onClick={() => setActiveTab('consultations')}
              className={`w-full text-left px-4 py-3 rounded flex items-center space-x-2 transition ${activeTab === 'consultations' ? 'bg-gold-600 text-black' : 'text-gold-200 hover:bg-gold-950/40'}`}
            >
              <Video size={14} />
              <span>Video Consultations ({consultations.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('bulk')}
              className={`w-full text-left px-4 py-3 rounded flex items-center space-x-2 transition ${activeTab === 'bulk' ? 'bg-gold-600 text-black' : 'text-gold-200 hover:bg-gold-950/40'}`}
            >
              <UploadCloud size={14} />
              <span>Bulk CSV Catalog Upload</span>
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className={`w-full text-left px-4 py-3 rounded flex items-center space-x-2 transition ${activeTab === 'products' ? 'bg-gold-600 text-black' : 'text-gold-200 hover:bg-gold-950/40'}`}
            >
              <Settings size={14} />
              <span>Manage Products ({products.length})</span>
            </button>
            <button
              id="admin-sidebar-logout-btn"
              onClick={onAdminLogout}
              className="w-full text-left px-4 py-3 rounded flex items-center space-x-2 transition text-red-400 border border-red-500/10 hover:bg-red-950/20 mt-4 cursor-pointer text-xs font-bold uppercase tracking-wider"
            >
              <X size={14} />
              <span>Logout Console</span>
            </button>
          </nav>
        </aside>

        {/* Right column: active window */}
        <main className="lg:col-span-3">
          
          {/* TAB 1: METRICS AND LOGS */}
          {activeTab === 'stats' && (
            <div className="space-y-8">
              
              {/* Stats Counters */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="bg-white border border-gold-200 p-5 rounded shadow-sm">
                  <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">Settled Sales (Paid)</span>
                  <strong className="text-xl sm:text-2xl font-mono text-gold-700 block mt-1">₹{totalSales.toLocaleString()}</strong>
                </div>
                <div className="bg-white border border-gold-200 p-5 rounded shadow-sm">
                  <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">Fulfillment Orders</span>
                  <strong className="text-xl sm:text-2xl font-mono text-luxury-black block mt-1">{orders.length} items</strong>
                </div>
                <div className="bg-white border border-gold-200 p-5 rounded shadow-sm">
                  <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">Video Bookings</span>
                  <strong className="text-xl sm:text-2xl font-mono text-luxury-black block mt-1">{consultations.length} calls</strong>
                </div>
                <div className="bg-white border border-gold-200 p-5 rounded shadow-sm">
                  <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">Refund Requests</span>
                  <strong className={`text-xl sm:text-2xl font-mono block mt-1 ${pendingRefundsCount > 0 ? 'text-red-600 font-bold' : 'text-gray-400'}`}>{pendingRefundsCount} claims</strong>
                </div>
              </div>

              {/* Sales Curve (Section 13.1) */}
              <div className="bg-white border border-gold-200 p-6 rounded shadow-sm">
                <h4 className="font-serif text-base font-bold text-luxury-black mb-6 uppercase tracking-wider">Atelier Sales Performance curve</h4>
                <div className="h-64 w-full text-xs">
                  {chartData.length === 0 ? (
                    <p className="text-gray-400 italic text-center pt-24">No transaction curves mapped yet.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#d97706" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#d97706" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" stroke="#9ca3af" />
                        <YAxis stroke="#9ca3af" />
                        <Tooltip />
                        <Area type="monotone" dataKey="sales" stroke="#d97706" fillOpacity={1} fill="url(#colorSales)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Audit Activity Logs (Section 13.4) */}
              <div className="bg-white border border-gold-200 p-6 rounded shadow-sm">
                <h4 className="font-serif text-base font-bold text-luxury-black mb-4 uppercase tracking-wider flex items-center gap-1.5">
                  <Database size={16} className="text-gold-600" />
                  Maison Ledger Audit Trails
                </h4>
                <div className="bg-gray-950 text-emerald-400 font-mono text-[10px] p-4 rounded max-h-48 overflow-y-auto space-y-1.5 shadow-inner">
                  {logs.length === 0 ? (
                    <p className="text-gray-500 italic">No ledger audits logged.</p>
                  ) : (
                    logs.map((log, lidx) => (
                      <div key={lidx} className="line-clamp-1">
                        <span className="text-gray-500">[Audit-Log]</span> {log}
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: ORDER MANAGER */}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              <h2 className="font-serif text-xl font-bold text-luxury-black tracking-wide uppercase border-b border-gold-100 pb-2 mb-4">
                Active Order Ledger ({orders.length})
              </h2>

              <div className="space-y-6 font-sans">
                {orders.length === 0 ? (
                  <div id="no-orders-fallback" className="bg-white border border-gold-200 rounded p-12 text-center text-gray-400 font-serif">
                    <span className="text-3xl block mb-2 text-gold-600">⚜</span>
                    <span className="text-sm font-sans uppercase tracking-wider font-bold text-luxury-black">No Orders Available</span>
                    <p className="text-xs text-gray-400 mt-1 font-sans">All sales ledgers are empty or pending initial checkout actions.</p>
                  </div>
                ) : (
                  orders.map(order => (
                    <div key={order.id} className="bg-white border border-gold-200 rounded p-6 shadow-sm space-y-5">
                      
                      {/* Upper Header: Order ID, Buyer, and Management Actions */}
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gold-100 pb-4 gap-4">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <strong className="text-sm text-luxury-black font-mono">Order: #{order.id}</strong>
                            <span className="text-[9px] font-bold uppercase tracking-wider bg-gold-100 text-gold-800 px-2 py-0.5 rounded">
                              {order.paymentMethod}
                            </span>
                            <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${order.paymentStatus === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                              {order.paymentStatus}
                            </span>
                          </div>
                          <span className="text-[10px] text-gray-500 block mt-1">
                            Placed on {new Date(order.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className="text-[10px] text-gray-400">
                            Buyer: <strong className="text-gray-700">{order.customerName}</strong> ({order.customerEmail}) | {order.customerMobile}
                          </span>
                        </div>
                        
                        {/* Status Update Dropdown & Delete Button */}
                        <div className="flex items-center space-x-3 flex-wrap gap-2 w-full md:w-auto justify-between md:justify-end">
                          <div className="flex items-center space-x-2">
                            <span className="text-[10px] uppercase font-bold text-gray-400">State:</span>
                            <select
                              id={`order-status-select-${order.id}`}
                              value={order.orderStatus}
                              onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                              className="bg-gold-50 border border-gold-300 text-[10px] font-bold uppercase tracking-wider rounded p-1.5 text-luxury-black cursor-pointer focus:outline-none focus:border-gold-500"
                            >
                              <option value="New">New</option>
                              <option value="Processing">Processing</option>
                              <option value="Shipped">Shipped</option>
                              <option value="Delivered">Delivered</option>
                              <option value="Cancelled">Cancelled</option>
                              <option value="Return Requested">Return Requested</option>
                              <option value="Refunded">Refunded</option>
                            </select>
                          </div>
                          
                          <button
                            id={`delete-order-btn-${order.id}`}
                            onClick={() => setOrderToDelete(order)}
                            className="bg-red-50 hover:bg-red-100 border border-red-200 hover:border-red-300 text-red-600 hover:text-red-700 font-bold text-[10px] uppercase tracking-wider px-3 py-1.5 rounded transition flex items-center space-x-1 cursor-pointer"
                            title="Delete Order Permanently"
                          >
                            <Trash2 size={12} />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>

                      {/* Purchased Items & Delivery details split */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
                        
                        {/* Column 1: Items summary */}
                        <div className="md:col-span-2 space-y-3">
                          <h5 className="font-serif text-[10px] uppercase font-bold text-gold-800 tracking-wider">Purchased Creations</h5>
                          <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                            {order.items?.map((item, index) => (
                              <div key={index} className="flex items-center justify-between border-b border-gray-100 pb-2 text-xs">
                                <div className="flex items-center space-x-3">
                                  {item.productImage ? (
                                    <img 
                                      src={item.productImage} 
                                      alt={item.productName} 
                                      className="w-10 h-10 object-cover rounded border border-gray-100" 
                                      referrerPolicy="no-referrer"
                                    />
                                  ) : (
                                    <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center text-[10px] text-gray-400">⚜</div>
                                  )}
                                  <div>
                                    <p className="font-semibold text-luxury-black">{item.productName}</p>
                                    {item.variant && (
                                      <p className="text-[9px] text-gray-500 uppercase tracking-wider">Size/Variant: {item.variant}</p>
                                    )}
                                    <p className="text-[10px] text-gray-400 font-mono">Qty: {item.quantity} × ₹{item.price.toLocaleString()}</p>
                                  </div>
                                </div>
                                <span className="font-mono text-gray-700 font-semibold">₹{(item.price * item.quantity).toLocaleString()}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Column 2: Shipment Destination Address & Billing Recap */}
                        <div className="bg-gray-50/50 p-4 rounded border border-gray-100 space-y-4">
                          <div>
                            <h5 className="font-serif text-[10px] uppercase font-bold text-gold-800 tracking-wider mb-2">Armored Delivery Address</h5>
                            <p className="text-gray-700 leading-relaxed text-[11px]">
                              {order.shippingAddress}, {order.city}, {order.state} - <strong className="font-mono">{order.pincode}</strong>
                            </p>
                          </div>
                          
                          <div className="border-t border-gray-200/60 pt-3 space-y-1 text-[11px]">
                            <h5 className="font-serif text-[10px] uppercase font-bold text-gold-800 tracking-wider mb-2">Billing Ledger</h5>
                            <div className="flex justify-between text-gray-500">
                              <span>Subtotal</span>
                              <span className="font-mono">₹{order.subtotal?.toLocaleString() || order.total.toLocaleString()}</span>
                            </div>
                            {order.discount > 0 && (
                              <div className="flex justify-between text-emerald-600 font-semibold">
                                <span>Savings Discount</span>
                                <span className="font-mono">-₹{order.discount.toLocaleString()}</span>
                              </div>
                            )}
                            {order.taxGst > 0 && (
                              <div className="flex justify-between text-gray-500">
                                <span>GST (Incl.)</span>
                                <span className="font-mono">₹{order.taxGst.toLocaleString()}</span>
                              </div>
                            )}
                            {order.shippingCharge > 0 && (
                              <div className="flex justify-between text-gray-500">
                                <span>Secure Shipping</span>
                                <span className="font-mono">₹{order.shippingCharge.toLocaleString()}</span>
                              </div>
                            )}
                            <div className="flex justify-between font-bold text-luxury-black pt-2 border-t border-gray-200/40 text-xs">
                              <span>Total settled</span>
                              <span className="font-mono text-gold-700">₹{order.total.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>

                      </div>

                      {/* Shiprocket Fulfillment Coupler (Section 12.2) */}
                      <div className="bg-gold-50/40 p-4 rounded border border-gold-200/50 flex flex-wrap justify-between items-center gap-4 text-xs">
                        <div>
                          <p className="font-bold text-luxury-black font-sans">Shiprocket Courier Node</p>
                          {order.trackingId ? (
                            <p className="text-[10px] text-emerald-800 mt-1 font-mono font-bold font-sans">
                              ✓ Handed over! Courier: {order.courierName} | Tracking: {order.trackingId}
                            </p>
                          ) : (
                            <p className="text-[10px] text-gray-500 mt-1 font-sans">Ready for armored transport dispatch assignment.</p>
                          )}
                        </div>

                        {!order.trackingId && order.orderStatus !== 'Cancelled' && (
                          <button
                            id={`dispatch-shiprocket-${order.id}`}
                            onClick={() => handleDispatchCourier(order.id)}
                            className="bg-gold-600 hover:bg-gold-500 text-black font-bold text-[9px] uppercase tracking-widest px-4 py-2 rounded transition cursor-pointer font-sans"
                          >
                            Dispatch Armored Courier
                          </button>
                        )}
                      </div>

                      {/* Razorpay Refund settlement (Section 12.3) */}
                      {order.orderStatus === 'Return Requested' && (
                        <div className="bg-red-50 p-4 rounded border border-red-200/50 flex justify-between items-center text-xs">
                          <div>
                            <p className="font-bold text-red-900 font-sans">Razorpay Settle Refund Request</p>
                            <p className="text-[10px] text-red-600 mt-0.5 font-sans">Claim Reason: {order.returnReason || 'No details'}</p>
                          </div>
                          <button
                            id={`refund-razorpay-${order.id}`}
                            onClick={() => handleSettleRefund(order.id)}
                            className="bg-red-600 hover:bg-red-500 text-white font-bold text-[9px] tracking-widest uppercase px-4 py-2 rounded transition cursor-pointer font-sans"
                          >
                            Settle Razorpay Refund
                          </button>
                        </div>
                      )}

                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 3: COUPON ENGINE */}
          {activeTab === 'coupons' && (
            <div className="space-y-6">
              
              <h2 className="font-serif text-xl font-bold text-luxury-black tracking-wide uppercase border-b border-gold-100 pb-2 mb-4">
                Atelier Coupon Planner
              </h2>

              {/* Coupon formulation */}
              <div className="bg-white border border-gold-200 p-6 rounded shadow-sm">
                <h4 className="font-serif text-base font-bold text-luxury-black mb-4 uppercase tracking-wider">Deploy New Coupon Code</h4>
                <form onSubmit={handleAddCoupon} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 items-end">
                  <div>
                    <label className="text-[9px] uppercase font-bold text-gray-500 block mb-1">Coupon Code</label>
                    <input
                      id="new-coupon-code"
                      type="text"
                      required
                      placeholder="e.g. FESTIVE20"
                      value={newCode}
                      onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                      className="w-full border border-gold-300 text-xs rounded px-3 py-2 text-gray-700 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] uppercase font-bold text-gray-500 block mb-1">Discount Type</label>
                    <select
                      id="new-coupon-type"
                      value={newType}
                      onChange={(e) => setNewType(e.target.value as any)}
                      className="w-full border border-gold-300 text-xs rounded p-2 text-gray-700 focus:outline-none font-semibold cursor-pointer"
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="flat">Flat Cash (₹)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] uppercase font-bold text-gray-500 block mb-1">Discount Value</label>
                    <input
                      id="new-coupon-val"
                      type="number"
                      required
                      value={newValue}
                      onChange={(e) => setNewValue(Number(e.target.value))}
                      className="w-full border border-gold-300 text-xs rounded px-3 py-2 text-gray-700 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] uppercase font-bold text-gray-500 block mb-1">Min Order Threshold (₹)</label>
                    <input
                      id="new-coupon-min"
                      type="number"
                      required
                      value={newMin}
                      onChange={(e) => setNewMin(Number(e.target.value))}
                      className="w-full border border-gold-300 text-xs rounded px-3 py-2 text-gray-700 focus:outline-none"
                    />
                  </div>
                  <button
                    id="submit-coupon-btn"
                    type="submit"
                    className="bg-luxury-black hover:bg-gold-600 hover:text-black text-white font-bold text-[9px] uppercase tracking-widest py-3 rounded transition flex items-center justify-center gap-1"
                  >
                    <Plus size={12} /> Add Code
                  </button>
                </form>
              </div>

              {/* Coupons list */}
              <div className="bg-white border border-gold-200 rounded overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-gold-50 text-[10px] uppercase text-gray-400 font-bold border-b border-gold-200">
                      <th className="p-4">Coupon Code</th>
                      <th className="p-4">Type</th>
                      <th className="p-4 text-right">Value</th>
                      <th className="p-4 text-right">Min Cart Requirement</th>
                      <th className="p-4 text-center">Operation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gold-100 font-mono">
                    {coupons.map(c => (
                      <tr key={c.id}>
                        <td className="p-4 font-bold text-luxury-black font-sans">{c.code}</td>
                        <td className="p-4 uppercase text-[10px] font-sans text-gray-500">{c.discountType}</td>
                        <td className="p-4 text-right font-bold">{c.discountType === 'percentage' ? `${c.discountValue}%` : `₹${c.discountValue.toLocaleString()}`}</td>
                        <td className="p-4 text-right">₹{c.minCartValue.toLocaleString()}</td>
                        <td className="p-4 text-center">
                          <button
                            id={`delete-coupon-${c.id}`}
                            onClick={() => handleDeleteCoupon(c.id)}
                            className="p-1.5 text-gray-400 hover:text-red-500 transition"
                            title="Delete Coupon"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>
          )}

          {/* TAB 4: CMS EDITOR */}
          {activeTab === 'cms' && (
            <div className="space-y-6">
              <h2 className="font-serif text-xl font-bold text-luxury-black tracking-wide uppercase border-b border-gold-100 pb-2 mb-4">
                CMS Page Customization
              </h2>

              <div id="cms-form-section" className="bg-white border border-gold-200 p-6 rounded shadow-sm">
                <h4 className="font-serif text-base font-bold text-luxury-black mb-4 uppercase tracking-wider">
                  {editingBannerId ? 'Edit Hero Landing Banner' : 'Append Hero Landing Banner'}
                </h4>
                <form onSubmit={handleSaveBanner} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[9px] uppercase font-bold text-gray-500 block mb-1">Banner Title</label>
                      <input
                        id="cms-banner-title"
                        type="text"
                        required
                        placeholder="e.g. Golden Royalties Chokers"
                        value={bannerTitle}
                        onChange={(e) => setBannerTitle(e.target.value)}
                        className="w-full border border-gold-300 text-xs rounded px-3 py-2 text-gray-700 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] uppercase font-bold text-gray-500 block mb-1">Banner Image URL</label>
                      <input
                        id="cms-banner-img"
                        type="text"
                        required
                        placeholder="Paste image link..."
                        value={bannerImg}
                        onChange={(e) => setBannerImg(e.target.value)}
                        className="w-full border border-gold-300 text-xs rounded px-3 py-2 text-gray-700 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[9px] uppercase font-bold text-gray-500 block mb-1">Subtitle Brief</label>
                    <input
                      id="cms-banner-sub"
                      type="text"
                      placeholder="e.g. Preserving generations of handloomed kundan..."
                      value={bannerSub}
                      onChange={(e) => setBannerSub(e.target.value)}
                      className="w-full border border-gold-300 text-xs rounded px-3 py-2 text-gray-700 focus:outline-none"
                    />
                  </div>
                  <div className="flex gap-4">
                    <button
                      id="submit-banner-btn"
                      type="submit"
                      className="bg-luxury-black hover:bg-gold-600 hover:text-black text-white font-bold text-[9px] uppercase tracking-widest px-6 py-2.5 rounded transition"
                    >
                      {editingBannerId ? 'Save Changes' : 'Append Banner Slide'}
                    </button>
                    {editingBannerId && (
                      <button
                        type="button"
                        onClick={resetBannerForm}
                        className="bg-gray-200 hover:bg-gray-300 text-luxury-black font-bold text-[9px] uppercase tracking-widest px-6 py-2.5 rounded transition"
                      >
                        Cancel Edit
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* CMS Entries Grid */}
              <div className="mt-8">
                <h3 className="font-serif text-lg font-bold text-luxury-black uppercase tracking-wider mb-4 border-b border-gold-100 pb-2">Existing Hero Banners</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {banners.map((banner, idx) => (
                    <div key={banner.id || idx} className="bg-white border border-gold-200 rounded shadow-sm overflow-hidden flex flex-col group">
                      <div className="h-40 w-full overflow-hidden relative">
                        <img src={banner.image} alt={banner.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                          <button
                            onClick={() => setPreviewImage(banner.image)}
                            className="bg-white/20 hover:bg-white/40 text-white p-2 rounded backdrop-blur-sm"
                            title="Preview Image"
                          >
                            <Eye size={20} />
                          </button>
                        </div>
                      </div>
                      <div className="p-4 flex-1 flex flex-col justify-between">
                        <div>
                          <h4 className="font-serif font-bold text-sm text-luxury-black mb-1">{banner.title}</h4>
                          <p className="text-xs text-gray-500 line-clamp-2 mb-2">{banner.subtitle}</p>
                          <p className="text-[10px] text-gold-700 font-mono">
                            Created: {banner.createdAt ? new Date(banner.createdAt).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                        <div className="flex gap-2 mt-4 pt-3 border-t border-gold-100">
                          <button
                            onClick={() => handleEditBanner(banner, idx)}
                            className="flex-1 flex items-center justify-center gap-2 bg-gold-50 hover:bg-gold-100 text-luxury-black font-bold text-[10px] uppercase tracking-widest py-2 rounded transition"
                          >
                            <Edit2 size={12} /> Edit
                          </button>
                          <button
                            onClick={() => setDeletingBannerId(banner.id || idx.toString())}
                            className="flex-1 flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-[10px] uppercase tracking-widest py-2 rounded transition"
                          >
                            <Trash2 size={12} /> Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {banners.length === 0 && (
                    <p className="text-sm text-gray-500 italic col-span-full">No banners found. Add one above.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Delete Confirmation Modal */}
          {deletingBannerId && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-luxury-black/60 backdrop-blur-sm p-4">
              <div className="bg-white border border-gold-200 rounded shadow-2xl p-6 max-w-sm w-full animate-fadeIn relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-red-500"></div>
                <h3 className="font-serif text-lg font-bold text-luxury-black uppercase tracking-wider mb-2">Delete Banner</h3>
                <p className="text-sm text-gray-600 mb-6 font-sans">
                  Are you sure you want to permanently delete this CMS content? This action cannot be undone and it will be removed from the website immediately.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setDeletingBannerId(null)}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-luxury-black font-bold text-xs uppercase tracking-widest py-3 rounded transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmDeleteBanner}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-widest py-3 rounded transition shadow-md"
                  >
                    Delete Permanently
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Image Preview Modal */}
          {previewImage && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-luxury-black/80 backdrop-blur-sm p-4" onClick={() => setPreviewImage(null)}>
              <div className="relative max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
                <button 
                  onClick={() => setPreviewImage(null)}
                  className="absolute -top-12 right-0 text-white hover:text-gold-300 transition p-2"
                >
                  <X size={28} />
                </button>
                <img src={previewImage} alt="Preview" className="w-full h-auto rounded border-2 border-gold-800 shadow-2xl object-contain max-h-[85vh]" />
              </div>
            </div>
          )}

          {/* TAB 5: VIDEO CONSULTATIONS */}
          {activeTab === 'consultations' && (
            <div className="space-y-6">
              <h2 className="font-serif text-xl font-bold text-luxury-black tracking-wide uppercase border-b border-gold-100 pb-2 mb-4">
                Atelier Salon Consultations ({consultations.length})
              </h2>

              <div className="space-y-4">
                {consultations.length === 0 ? (
                  <p className="text-xs text-gray-500 italic">No boutique video calls scheduled.</p>
                ) : (
                  consultations.map(call => (
                    <div key={call.id} className="bg-white border border-gold-200 p-5 rounded shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <h4 className="font-serif font-bold text-sm text-luxury-black">{call.customerName}</h4>
                        <p className="text-[10px] text-gold-700 font-mono mt-0.5">Mobile: {call.customerPhone} | Time slot: {new Date(call.preferredTime).toLocaleString()}</p>
                        {call.notes && <p className="text-xs text-gray-500 mt-2 italic">Client notes: "{call.notes}"</p>}
                      </div>
                      <div>
                        <span className="text-[9px] uppercase tracking-wider font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded">
                          ✓ Salon Scheduled
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 6: BULK PRODUCT UPLOADER */}
          {activeTab === 'bulk' && (
            <div className="space-y-6">
              
              <h2 className="font-serif text-xl font-bold text-luxury-black tracking-wide uppercase border-b border-gold-100 pb-2 mb-4">
                Bulk Catalog Importer (CSV)
              </h2>

              <div className="bg-white border border-gold-200 p-6 sm:p-8 rounded shadow-sm">
                
                <div className="border-b border-gold-100 pb-4 mb-6">
                  <h4 className="font-serif text-base font-bold text-luxury-black uppercase tracking-wider">Dynamic CSV Parser instructions</h4>
                  <p className="text-xs text-gray-500 leading-relaxed mt-1.5 font-sans">
                    The parser parses standard spreadsheet columns. Ensure the CSV file includes the headers below:
                  </p>
                  <code className="block bg-gray-50 p-2.5 rounded font-mono text-[10px] text-luxury-black mt-3 border border-gray-200">
                    name,category,description,price,discountedPrice,stockQuantity,images,metalType,purity,fabric,color
                  </code>
                </div>

                <form onSubmit={handleCSVUpload} className="space-y-4">
                  <div className="border-2 border-dashed border-gold-300 rounded p-8 text-center bg-gold-50/10 hover:bg-gold-50/30 transition relative cursor-pointer">
                    <input
                      id="bulk-csv-uploader"
                      type="file"
                      accept=".csv"
                      required
                      onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <UploadCloud size={40} className="text-gold-600 mx-auto mb-3" />
                    <span className="block text-xs font-bold uppercase tracking-wider text-luxury-black">
                      {csvFile ? `✓ Selected file: ${csvFile.name}` : 'Drag & Drop CSV File here or Click to Browse'}
                    </span>
                    <span className="block text-[10px] text-gray-400 mt-1 font-light">Supports standard comma-separated templates</span>
                  </div>

                  {csvFile && (
                    <button
                      id="bulk-csv-submit-btn"
                      type="submit"
                      disabled={uploading}
                      className="bg-luxury-black hover:bg-gold-600 hover:text-black text-white font-bold text-xs tracking-widest uppercase py-3.5 px-6 rounded transition disabled:opacity-50"
                    >
                      {uploading ? 'Processing & Validating CSV data...' : 'Process and Insert Products'}
                    </button>
                  )}
                </form>

                {uploadLog && (
                  <div id="bulk-upload-log" className="mt-6 p-4 rounded text-xs font-mono bg-luxury-cream border border-gold-300/40 text-luxury-black leading-relaxed">
                    {uploadLog}
                  </div>
                )}

              </div>

            </div>
          )}

          {/* TAB 7: MANAGE PRODUCTS CATALOG */}
          {activeTab === 'products' && (() => {
            // Get unique categories for filtration
            const availableCategories = Array.from(new Set(products.map(p => p.category))).filter(Boolean);

            // Filter & search logic
            let filteredProds = products.filter(p => {
              const matchesSearch = 
                p.name.toLowerCase().includes(prodSearch.toLowerCase()) || 
                p.category.toLowerCase().includes(prodSearch.toLowerCase()) ||
                p.id.toLowerCase().includes(prodSearch.toLowerCase());
              
              const matchesCategory = prodCategory === 'all' || p.category === prodCategory;
              
              let matchesStatus = true;
              if (prodStatus !== 'all') {
                const isDraft = !!p.draft;
                const isOutOfStock = p.stockQuantity === 0;
                const isLowStock = p.stockQuantity > 0 && p.stockQuantity <= 5;
                const isInStock = p.stockQuantity > 5;

                if (prodStatus === 'draft') matchesStatus = isDraft;
                else if (prodStatus === 'out-of-stock') matchesStatus = !isDraft && isOutOfStock;
                else if (prodStatus === 'low-stock') matchesStatus = !isDraft && isLowStock;
                else if (prodStatus === 'in-stock') matchesStatus = !isDraft && isInStock;
              }

              return matchesSearch && matchesCategory && matchesStatus;
            });

            // Sort logic
            filteredProds = [...filteredProds].sort((a, b) => {
              if (prodSort === 'newest') {
                const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                return dateB - dateA;
              }
              if (prodSort === 'oldest') {
                const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                return dateA - dateB;
              }
              if (prodSort === 'price-high') return b.price - a.price;
              if (prodSort === 'price-low') return a.price - b.price;
              if (prodSort === 'stock-high') return b.stockQuantity - a.stockQuantity;
              if (prodSort === 'stock-low') return a.stockQuantity - b.stockQuantity;
              return 0;
            });

            // Pagination calculation
            const total = filteredProds.length;
            const totalPages = Math.ceil(total / itemsPerPage) || 1;
            const startIdx = (prodPage - 1) * itemsPerPage;
            const paginated = filteredProds.slice(startIdx, startIdx + itemsPerPage);

            // Select all control logic
            const pageProductIds = paginated.map(p => p.id);
            const isAllPageSelected = pageProductIds.length > 0 && pageProductIds.every(id => selectedProductIds.includes(id));

            const toggleSelectAll = () => {
              if (isAllPageSelected) {
                setSelectedProductIds(prev => prev.filter(id => !pageProductIds.includes(id)));
              } else {
                setSelectedProductIds(prev => Array.from(new Set([...prev, ...pageProductIds])));
              }
            };

            const toggleSelectProduct = (id: string) => {
              setSelectedProductIds(prev => 
                prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
              );
            };

            const getStatusBadge = (p: Product) => {
              if (p.draft) return { label: 'Draft', badgeClass: 'bg-gray-500/10 text-gray-400 border border-gray-500/20' };
              if (p.stockQuantity === 0) return { label: 'Out of Stock', badgeClass: 'bg-red-500/10 text-red-500 border border-red-500/20' };
              if (p.stockQuantity <= 5) return { label: 'Low Stock', badgeClass: 'bg-amber-500/10 text-amber-500 border border-amber-500/20' };
              return { label: 'In Stock', badgeClass: 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' };
            };

            return (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gold-100 pb-2 mb-4 gap-4">
                  <div>
                    <h2 className="font-serif text-xl font-bold text-luxury-black tracking-wide uppercase">
                      Manage Atelier Products Catalog ({products.length})
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">
                      Edit details, inspect inventory levels, and perform individual or bulk cleanup of products.
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      id="add-product-trigger-btn"
                      onClick={() => {
                        setEditName('');
                        setEditCategory('');
                        setEditDesc('');
                        setEditPrice(0);
                        setEditDiscountPrice(undefined);
                        setEditStock(0);
                        setEditDraft(false);
                        setEditMetalType('');
                        setEditPurity('');
                        setEditFabric('');
                        setEditColor('');
                        setEditOccasion('');
                        setEditImages([]);
                        setEditVideos([]);
                        setEditInstagramReels([]);
                        setEditYoutubeVideos([]);
                        setIsAddingProduct(true);
                      }}
                      className="bg-gold-600 hover:bg-gold-500 text-black font-bold text-[10px] uppercase tracking-widest px-4 py-2.5 rounded transition flex items-center space-x-1.5 shadow-lg border border-gold-500/20"
                    >
                      <Plus size={12} />
                      <span>Add Product</span>
                    </button>
                    {selectedProductIds.length > 0 && (
                      <button
                        id="bulk-delete-trigger-btn"
                        onClick={() => setShowBulkDeleteConfirm(true)}
                        className="bg-red-600 hover:bg-red-500 text-white font-bold text-[10px] uppercase tracking-widest px-4 py-2.5 rounded transition flex items-center space-x-1.5 shadow-lg border border-red-500/20 animate-fadeIn"
                      >
                        <Trash2 size={12} />
                        <span>Delete Selected ({selectedProductIds.length})</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Filter Controls Row */}
                <div className="bg-[#0c0c0c] border border-gold-500/15 p-4 rounded flex flex-col md:flex-row gap-3 items-center text-xs">
                  {/* Search input */}
                  <div className="relative w-full md:w-1/3">
                    <Search className="absolute left-3 top-2.5 text-gray-400" size={14} />
                    <input
                      id="product-search-input"
                      type="text"
                      placeholder="Search product name, category, ID..."
                      value={prodSearch}
                      onChange={e => setProdSearch(e.target.value)}
                      className="w-full bg-[#121212] border border-gold-500/20 rounded pl-9 pr-4 py-2 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-gold-500"
                    />
                  </div>

                  {/* Category filter */}
                  <div className="relative w-full md:w-1/5 flex items-center gap-1.5">
                    <Filter size={12} className="text-gold-500 shrink-0" />
                    <select
                      id="product-category-filter"
                      value={prodCategory}
                      onChange={e => setProdCategory(e.target.value)}
                      className="w-full bg-[#121212] border border-gold-500/20 rounded p-2 text-gray-200 focus:outline-none focus:border-gold-500 cursor-pointer"
                    >
                      <option value="all">All Categories</option>
                      {availableCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  {/* Status filter */}
                  <div className="w-full md:w-1/5">
                    <select
                      id="product-status-filter"
                      value={prodStatus}
                      onChange={e => setProdStatus(e.target.value)}
                      className="w-full bg-[#121212] border border-gold-500/20 rounded p-2 text-gray-200 focus:outline-none focus:border-gold-500 cursor-pointer"
                    >
                      <option value="all">All Statuses</option>
                      <option value="in-stock">In Stock</option>
                      <option value="low-stock">Low Stock</option>
                      <option value="out-of-stock">Out of Stock</option>
                      <option value="draft">Drafts Only</option>
                    </select>
                  </div>

                  {/* Sorting select */}
                  <div className="w-full md:w-1/5">
                    <select
                      id="product-sort-select"
                      value={prodSort}
                      onChange={e => setProdSort(e.target.value)}
                      className="w-full bg-[#121212] border border-gold-500/20 rounded p-2 text-gray-200 focus:outline-none focus:border-gold-500 cursor-pointer"
                    >
                      <option value="newest">Newest Uploads</option>
                      <option value="oldest">Oldest Uploads</option>
                      <option value="price-high">Price: High to Low</option>
                      <option value="price-low">Price: Low to High</option>
                      <option value="stock-high">Stock: High to Low</option>
                      <option value="stock-low">Stock: Low to High</option>
                    </select>
                  </div>
                </div>

                {/* Table Container */}
                {total === 0 ? (
                  <div className="text-center py-16 bg-[#0c0c0c] border border-gold-500/10 rounded">
                    <AlertCircle size={36} className="text-gold-500/40 mx-auto mb-3" />
                    <p className="text-sm font-serif text-gold-300">No products available.</p>
                    <p className="text-xs text-gray-500 mt-1">Try adjusting your filters or upload some products via CSV.</p>
                  </div>
                ) : (
                  <div className="bg-[#0c0c0c] border border-gold-500/15 rounded overflow-hidden shadow-xl">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs font-sans">
                        <thead>
                          <tr className="bg-gold-500/5 text-[10px] uppercase text-gold-300 font-bold border-b border-gold-500/15">
                            <th className="p-4 w-12 text-center select-none">
                              <input
                                id="product-select-all-checkbox"
                                type="checkbox"
                                checked={isAllPageSelected}
                                onChange={toggleSelectAll}
                                className="rounded text-gold-600 focus:ring-gold-500 bg-[#121212] border-gold-500/20 cursor-pointer"
                              />
                            </th>
                            <th className="p-4">Product Image</th>
                            <th className="p-4">Product Name</th>
                            <th className="p-4">Category</th>
                            <th className="p-4 text-right">Price</th>
                            <th className="p-4 text-right">Discounted Price</th>
                            <th className="p-4 text-center">Stock</th>
                            <th className="p-4 text-center">Status</th>
                            <th className="p-4 text-center">Upload Date</th>
                            <th className="p-4 text-center">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gold-500/10 font-mono text-gray-300">
                          {paginated.map(p => {
                            const status = getStatusBadge(p);
                            const mainImg = p.images && p.images[0] ? p.images[0] : 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=120&q=80';
                            
                            return (
                              <tr key={p.id} className="hover:bg-gold-500/5 transition">
                                <td className="p-4 text-center">
                                  <input
                                    id={`product-select-checkbox-${p.id}`}
                                    type="checkbox"
                                    checked={selectedProductIds.includes(p.id)}
                                    onChange={() => toggleSelectProduct(p.id)}
                                    className="rounded text-gold-600 focus:ring-gold-500 bg-[#121212] border-gold-500/20 cursor-pointer"
                                  />
                                </td>
                                <td className="p-4">
                                  <img
                                    referrerPolicy="no-referrer"
                                    src={mainImg}
                                    alt={p.name}
                                    className="w-12 h-12 object-cover rounded border border-gold-500/15 animate-fadeIn"
                                  />
                                </td>
                                <td className="p-4 font-bold text-gray-100 font-sans tracking-wide">
                                  <span className="block">{p.name}</span>
                                  <span className="text-[10px] text-gray-500 font-mono mt-0.5 block">ID: {p.id}</span>
                                </td>
                                <td className="p-4 font-sans text-gray-400">{p.category}</td>
                                <td className="p-4 text-right font-bold text-gray-100">₹{p.price.toLocaleString()}</td>
                                <td className="p-4 text-right font-bold text-gold-500">
                                  {p.discountedPrice ? `₹${p.discountedPrice.toLocaleString()}` : '-'}
                                </td>
                                <td className="p-4 text-center font-bold text-gray-100">{p.stockQuantity}</td>
                                <td className="p-4 text-center font-sans">
                                  <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wide ${status.badgeClass}`}>
                                    {status.label}
                                  </span>
                                </td>
                                <td className="p-4 text-center text-gray-400 font-sans">
                                  {p.createdAt ? new Date(p.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Legacy'}
                                </td>
                                <td className="p-4 text-center">
                                  <div className="flex items-center justify-center space-x-2">
                                    <button
                                      id={`edit-product-btn-${p.id}`}
                                      onClick={() => setEditingProduct(p)}
                                      className="p-1.5 text-gray-400 hover:text-gold-500 transition border border-transparent hover:border-gold-500/20 rounded"
                                      title="Edit Product"
                                    >
                                      <Edit size={14} />
                                    </button>
                                    <button
                                      id={`delete-product-btn-${p.id}`}
                                      onClick={() => setDeletingProduct(p)}
                                      className="p-1.5 text-gray-400 hover:text-red-500 transition border border-transparent hover:border-red-500/20 rounded"
                                      title="Delete Product"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination Bar */}
                    <div className="p-4 border-t border-gold-500/15 bg-gold-500/5 flex items-center justify-between font-sans text-xs">
                      <div className="text-gray-400">
                        Showing <strong className="text-gray-200">{startIdx + 1}</strong> to <strong className="text-gray-200">{Math.min(startIdx + itemsPerPage, total)}</strong> of <strong className="text-gray-200">{total}</strong> products
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          id="prev-page-btn"
                          disabled={prodPage === 1}
                          onClick={() => setProdPage(p => Math.max(1, p - 1))}
                          className="p-2 border border-gold-500/20 hover:bg-gold-500/5 text-gray-400 hover:text-gold-400 rounded transition disabled:opacity-30 disabled:pointer-events-none"
                        >
                          <ChevronLeft size={14} />
                        </button>
                        <span className="text-gray-300 px-2 font-mono">
                          Page <strong className="text-gold-400">{prodPage}</strong> of {totalPages}
                        </span>
                        <button
                          id="next-page-btn"
                          disabled={prodPage === totalPages}
                          onClick={() => setProdPage(p => Math.min(totalPages, p + 1))}
                          className="p-2 border border-gold-500/20 hover:bg-gold-500/5 text-gray-400 hover:text-gold-400 rounded transition disabled:opacity-30 disabled:pointer-events-none"
                        >
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </main>

      </div>

      {/* Editing/Adding product modal */}
      {(editingProduct || isAddingProduct) && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-[#0c0c0c] border border-gold-500/20 max-w-2xl w-full rounded shadow-2xl overflow-hidden font-sans max-h-[90vh] flex flex-col animate-slideUp">
            <div className="p-5 border-b border-gold-500/10 flex justify-between items-center bg-gold-500/5">
              <h3 className="font-serif text-lg font-bold text-gold-400">
                {isAddingProduct ? 'Add New Atelier Product' : 'Edit Atelier Product Details'}
              </h3>
              <button onClick={() => { setEditingProduct(null); setIsAddingProduct(false); }} className="text-gray-400 hover:text-gold-500 transition">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleProductSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Product Name</label>
                  <input 
                    type="text" 
                    required 
                    value={editName} 
                    onChange={e => setEditName(e.target.value)} 
                    className="w-full border border-gold-500/25 text-xs rounded px-3 py-2 text-gray-100 bg-[#121212] focus:outline-none focus:border-gold-500" 
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Category</label>
                  <input 
                    type="text" 
                    required 
                    value={editCategory} 
                    onChange={e => setEditCategory(e.target.value)} 
                    className="w-full border border-gold-500/25 text-xs rounded px-3 py-2 text-gray-100 bg-[#121212] focus:outline-none focus:border-gold-500" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Price (₹)</label>
                  <input 
                    type="number" 
                    required 
                    value={editPrice} 
                    onChange={e => setEditPrice(Number(e.target.value))} 
                    className="w-full border border-gold-500/25 text-xs rounded px-3 py-2 text-gray-100 bg-[#121212] focus:outline-none focus:border-gold-500" 
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Discounted Price (₹)</label>
                  <input 
                    type="number" 
                    value={editDiscountPrice || ''} 
                    onChange={e => setEditDiscountPrice(e.target.value ? Number(e.target.value) : undefined)} 
                    placeholder="No discount"
                    className="w-full border border-gold-500/25 text-xs rounded px-3 py-2 text-gray-100 bg-[#121212] focus:outline-none focus:border-gold-500" 
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Stock Quantity</label>
                  <input 
                    type="number" 
                    required 
                    value={editStock} 
                    onChange={e => setEditStock(Number(e.target.value))} 
                    className="w-full border border-gold-500/25 text-xs rounded px-3 py-2 text-gray-100 bg-[#121212] focus:outline-none focus:border-gold-500" 
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Description</label>
                <textarea 
                  required 
                  rows={3}
                  value={editDesc} 
                  onChange={e => setEditDesc(e.target.value)} 
                  className="w-full border border-gold-500/25 text-xs text-gray-100 rounded px-3 py-2 bg-[#121212] focus:outline-none focus:border-gold-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Metal Type (e.g. 18kt Gold)</label>
                  <input 
                    type="text" 
                    value={editMetalType} 
                    onChange={e => setEditMetalType(e.target.value)} 
                    placeholder="N/A"
                    className="w-full border border-gold-500/25 text-xs rounded px-3 py-2 text-gray-100 bg-[#121212] focus:outline-none focus:border-gold-500" 
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Purity (e.g. BIS Hallmark)</label>
                  <input 
                    type="text" 
                    value={editPurity} 
                    onChange={e => setEditPurity(e.target.value)} 
                    placeholder="N/A"
                    className="w-full border border-gold-500/25 text-xs rounded px-3 py-2 text-gray-100 bg-[#121212] focus:outline-none focus:border-gold-500" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Fabric</label>
                  <input 
                    type="text" 
                    value={editFabric} 
                    onChange={e => setEditFabric(e.target.value)} 
                    placeholder="N/A"
                    className="w-full border border-gold-500/25 text-xs rounded px-3 py-2 text-gray-100 bg-[#121212] focus:outline-none focus:border-gold-500" 
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Color</label>
                  <input 
                    type="text" 
                    value={editColor} 
                    onChange={e => setEditColor(e.target.value)} 
                    placeholder="N/A"
                    className="w-full border border-gold-500/25 text-xs rounded px-3 py-2 text-gray-100 bg-[#121212] focus:outline-none focus:border-gold-500" 
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Occasion</label>
                  <input 
                    type="text" 
                    value={editOccasion} 
                    onChange={e => setEditOccasion(e.target.value)} 
                    placeholder="N/A"
                    className="w-full border border-gold-500/25 text-xs rounded px-3 py-2 text-gray-100 bg-[#121212] focus:outline-none focus:border-gold-500" 
                  />
                </div>
              </div>

              {/* SECTION: MEDIA MANAGEMENT */}
              <div className="border border-gold-500/20 rounded p-4 bg-[#0a0a0a] space-y-4">
                <h4 className="font-serif text-sm font-bold text-gold-400 border-b border-gold-500/10 pb-1 uppercase tracking-wider">
                  Media Catalog
                </h4>

                {/* A. Product Images */}
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-gray-300 block">Product Images</label>
                  
                  {/* Drag and Drop Zone */}
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const files = Array.from(e.dataTransfer.files) as File[];
                      files.forEach(file => {
                        if (file.type.startsWith('image/')) {
                          const reader = new FileReader();
                          reader.onload = () => {
                            if (typeof reader.result === 'string') {
                              setEditImages(prev => [...prev, reader.result as string]);
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      });
                    }}
                    className="border border-dashed border-gold-500/25 hover:border-gold-500/50 rounded p-4 text-center cursor-pointer transition hover:bg-gold-500/5"
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.multiple = true;
                      input.accept = 'image/*';
                      input.onchange = (e) => {
                        const files = Array.from((e.target as HTMLInputElement).files || []);
                        files.forEach(file => {
                          const reader = new FileReader();
                          reader.onload = () => {
                            if (typeof reader.result === 'string') {
                              setEditImages(prev => [...prev, reader.result as string]);
                            }
                          };
                          reader.readAsDataURL(file);
                        });
                      };
                      input.click();
                    }}
                  >
                    <UploadCloud className="mx-auto text-gold-500 mb-2" size={24} />
                    <p className="text-[11px] text-gray-300">Drag & Drop product images here or click to browse</p>
                    <p className="text-[9px] text-gray-500 mt-1">Supports JPEG, PNG, WEBP, GIF</p>
                  </div>

                  {/* Manual URL entry */}
                  <div className="flex gap-2">
                    <input
                      id="image-url-manual-add"
                      type="text"
                      placeholder="Or paste an image URL..."
                      className="flex-1 bg-[#121212] border border-gold-500/20 rounded px-3 py-1.5 text-xs text-gray-100 placeholder-gray-500 focus:outline-none focus:border-gold-500"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const val = (e.target as HTMLInputElement).value.trim();
                          if (val) {
                            setEditImages(prev => [...prev, val]);
                            (e.target as HTMLInputElement).value = '';
                          }
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const el = document.getElementById('image-url-manual-add') as HTMLInputElement;
                        const val = el?.value.trim();
                        if (val) {
                          setEditImages(prev => [...prev, val]);
                          el.value = '';
                        }
                      }}
                      className="bg-gold-600 hover:bg-gold-500 text-black px-3 rounded text-[10px] font-bold uppercase transition"
                    >
                      Add
                    </button>
                  </div>

                  {/* Images Preview & Reorder & Delete */}
                  {editImages.length > 0 && (
                    <div className="grid grid-cols-4 gap-2 mt-2 max-h-48 overflow-y-auto p-1 border border-gold-500/5 rounded">
                      {editImages.map((img, idx) => (
                        <div key={idx} className="relative group border border-gold-500/10 rounded overflow-hidden aspect-square bg-black">
                          <img referrerPolicy="no-referrer" src={img} alt="" className="w-full h-full object-cover animate-fadeIn" />
                          <div className="absolute inset-0 bg-black/65 opacity-0 group-hover:opacity-100 transition flex flex-col justify-between p-1">
                            <div className="flex justify-between items-center">
                              <span className="text-[8px] font-mono bg-gold-600 text-black px-1 rounded">{idx + 1}</span>
                              <button
                                type="button"
                                onClick={() => setEditImages(prev => prev.filter((_, i) => i !== idx))}
                                className="text-red-500 hover:text-red-400 p-0.5 rounded bg-black/40"
                              >
                                <Trash2 size={10} />
                              </button>
                            </div>
                            <div className="flex justify-center space-x-1">
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={() => {
                                  const copy = [...editImages];
                                  const temp = copy[idx];
                                  copy[idx] = copy[idx - 1];
                                  copy[idx - 1] = temp;
                                  setEditImages(copy);
                                }}
                                className="text-white hover:text-gold-500 disabled:opacity-30 disabled:pointer-events-none"
                              >
                                <ChevronLeft size={12} />
                              </button>
                              <button
                                type="button"
                                disabled={idx === editImages.length - 1}
                                onClick={() => {
                                  const copy = [...editImages];
                                  const temp = copy[idx];
                                  copy[idx] = copy[idx + 1];
                                  copy[idx + 1] = temp;
                                  setEditImages(copy);
                                }}
                                className="text-white hover:text-gold-500 disabled:opacity-30 disabled:pointer-events-none"
                              >
                                <ChevronRight size={12} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* B. Product Videos */}
                <div className="space-y-2 pt-3 border-t border-gold-500/10">
                  <label className="text-[10px] uppercase font-bold text-gray-300 block">Product Videos</label>
                  
                  {/* Video Drop Zone */}
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const files = Array.from(e.dataTransfer.files) as File[];
                      files.forEach(file => {
                        if (file.type.startsWith('video/')) {
                          const reader = new FileReader();
                          reader.onload = () => {
                            if (typeof reader.result === 'string') {
                              setEditVideos(prev => [...prev, reader.result as string]);
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      });
                    }}
                    className="border border-dashed border-gold-500/25 hover:border-gold-500/50 rounded p-4 text-center cursor-pointer transition hover:bg-gold-500/5"
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.multiple = true;
                      input.accept = 'video/*';
                      input.onchange = (e) => {
                        const files = Array.from((e.target as HTMLInputElement).files || []);
                        files.forEach(file => {
                          const reader = new FileReader();
                          reader.onload = () => {
                            if (typeof reader.result === 'string') {
                              setEditVideos(prev => [...prev, reader.result as string]);
                            }
                          };
                          reader.readAsDataURL(file);
                        });
                      };
                      input.click();
                    }}
                  >
                    <Video className="mx-auto text-gold-500 mb-2" size={24} />
                    <p className="text-[11px] text-gray-300">Drag & Drop videos here or click to browse</p>
                    <p className="text-[9px] text-gray-500 mt-1">Supports MP4, WebM, MOV</p>
                  </div>

                  {/* Manual URL entry */}
                  <div className="flex gap-2">
                    <input
                      id="video-url-manual-add"
                      type="text"
                      placeholder="Or paste a video URL..."
                      className="flex-1 bg-[#121212] border border-gold-500/20 rounded px-3 py-1.5 text-xs text-gray-100 placeholder-gray-500 focus:outline-none focus:border-gold-500"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const val = (e.target as HTMLInputElement).value.trim();
                          if (val) {
                            setEditVideos(prev => [...prev, val]);
                            (e.target as HTMLInputElement).value = '';
                          }
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const el = document.getElementById('video-url-manual-add') as HTMLInputElement;
                        const val = el?.value.trim();
                        if (val) {
                          setEditVideos(prev => [...prev, val]);
                          el.value = '';
                        }
                      }}
                      className="bg-gold-600 hover:bg-gold-500 text-black px-3 rounded text-[10px] font-bold uppercase transition"
                    >
                      Add
                    </button>
                  </div>

                  {/* Videos Preview & Reorder & Delete */}
                  {editVideos.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mt-2 max-h-48 overflow-y-auto p-1 border border-gold-500/5 rounded">
                      {editVideos.map((videoUrl, idx) => (
                        <div key={idx} className="relative group border border-gold-500/10 rounded overflow-hidden aspect-video bg-black">
                          <video src={videoUrl} muted className="w-full h-full object-cover animate-fadeIn" />
                          <div className="absolute inset-0 bg-black/65 opacity-0 group-hover:opacity-100 transition flex flex-col justify-between p-1">
                            <div className="flex justify-between items-center">
                              <span className="text-[8px] font-mono bg-gold-600 text-black px-1 rounded">V{idx + 1}</span>
                              <button
                                type="button"
                                onClick={() => setEditVideos(prev => prev.filter((_, i) => i !== idx))}
                                className="text-red-500 hover:text-red-400 p-0.5 rounded bg-black/40"
                              >
                                <Trash2 size={10} />
                              </button>
                            </div>
                            <div className="flex justify-center space-x-1">
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={() => {
                                  const copy = [...editVideos];
                                  const temp = copy[idx];
                                  copy[idx] = copy[idx - 1];
                                  copy[idx - 1] = temp;
                                  setEditVideos(copy);
                                }}
                                className="text-white hover:text-gold-500 disabled:opacity-30 disabled:pointer-events-none"
                              >
                                <ChevronLeft size={12} />
                              </button>
                              <button
                                type="button"
                                disabled={idx === editVideos.length - 1}
                                onClick={() => {
                                  const copy = [...editVideos];
                                  const temp = copy[idx];
                                  copy[idx] = copy[idx + 1];
                                  copy[idx + 1] = temp;
                                  setEditVideos(copy);
                                }}
                                className="text-white hover:text-gold-500 disabled:opacity-30 disabled:pointer-events-none"
                              >
                                <ChevronRight size={12} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* C. Instagram Reels */}
                <div className="space-y-2 pt-3 border-t border-gold-500/10">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] uppercase font-bold text-gray-300 block">Instagram Reel / Post URL</label>
                    <span className="text-[8px] text-gray-500 font-sans">Accepts public Instagram post/reel link</span>
                  </div>
                  
                  <div className="flex gap-2">
                    <input
                      id="instagram-reel-manual-add"
                      type="text"
                      placeholder="e.g. https://www.instagram.com/reel/C7X3sD_JyV2/"
                      className="flex-1 bg-[#121212] border border-gold-500/20 rounded px-3 py-1.5 text-xs text-gray-100 placeholder-gray-500 focus:outline-none focus:border-gold-500"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const val = (e.target as HTMLInputElement).value.trim();
                          if (val) {
                            if (val.includes('instagram.com')) {
                              setEditInstagramReels(prev => [...prev, val]);
                              (e.target as HTMLInputElement).value = '';
                            } else {
                              showToast('Invalid Instagram URL. Must contain instagram.com', 'error');
                            }
                          }
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const el = document.getElementById('instagram-reel-manual-add') as HTMLInputElement;
                        const val = el?.value.trim();
                        if (val) {
                          if (val.includes('instagram.com')) {
                            setEditInstagramReels(prev => [...prev, val]);
                            el.value = '';
                          } else {
                            showToast('Invalid Instagram URL. Must contain instagram.com', 'error');
                          }
                        }
                      }}
                      className="bg-gold-600 hover:bg-gold-500 text-black px-3 rounded text-[10px] font-bold uppercase transition"
                    >
                      Add
                    </button>
                  </div>

                  {/* List of reels */}
                  {editInstagramReels.length > 0 && (
                    <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                      {editInstagramReels.map((url, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-[#121212] border border-gold-500/15 rounded p-2 text-xs">
                          <span className="truncate text-gray-300 pr-4 font-mono text-[10px]">{url}</span>
                          <div className="flex items-center space-x-1.5 shrink-0">
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={() => {
                                const copy = [...editInstagramReels];
                                const temp = copy[idx];
                                copy[idx] = copy[idx - 1];
                                copy[idx - 1] = temp;
                                setEditInstagramReels(copy);
                              }}
                              className="text-gray-400 hover:text-gold-500 disabled:opacity-30 disabled:pointer-events-none"
                            >
                              <ChevronLeft size={14} />
                            </button>
                            <button
                              type="button"
                              disabled={idx === editInstagramReels.length - 1}
                              onClick={() => {
                                const copy = [...editInstagramReels];
                                const temp = copy[idx];
                                copy[idx] = copy[idx + 1];
                                copy[idx + 1] = temp;
                                setEditInstagramReels(copy);
                              }}
                              className="text-gray-400 hover:text-gold-500 disabled:opacity-30 disabled:pointer-events-none"
                            >
                              <ChevronRight size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditInstagramReels(prev => prev.filter((_, i) => i !== idx))}
                              className="text-red-500 hover:text-red-400"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* D. YouTube Videos */}
                <div className="space-y-2 pt-3 border-t border-gold-500/10">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] uppercase font-bold text-gray-300 block">YouTube Video URL</label>
                    <span className="text-[8px] text-gray-500 font-sans">Accepts standard YouTube watch links & shorts</span>
                  </div>
                  
                  <div className="flex gap-2">
                    <input
                      id="youtube-video-manual-add"
                      type="text"
                      placeholder="e.g. https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                      className="flex-1 bg-[#121212] border border-gold-500/20 rounded px-3 py-1.5 text-xs text-gray-100 placeholder-gray-500 focus:outline-none focus:border-gold-500"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const val = (e.target as HTMLInputElement).value.trim();
                          if (val) {
                            if (val.includes('youtube.com') || val.includes('youtu.be')) {
                              setEditYoutubeVideos(prev => [...prev, val]);
                              (e.target as HTMLInputElement).value = '';
                            } else {
                              showToast('Invalid YouTube URL. Must contain youtube.com or youtu.be', 'error');
                            }
                          }
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const el = document.getElementById('youtube-video-manual-add') as HTMLInputElement;
                        const val = el?.value.trim();
                        if (val) {
                          if (val.includes('youtube.com') || val.includes('youtu.be')) {
                            setEditYoutubeVideos(prev => [...prev, val]);
                            el.value = '';
                          } else {
                            showToast('Invalid YouTube URL. Must contain youtube.com or youtu.be', 'error');
                          }
                        }
                      }}
                      className="bg-gold-600 hover:bg-gold-500 text-black px-3 rounded text-[10px] font-bold uppercase transition"
                    >
                      Add
                    </button>
                  </div>

                  {/* List of youtube videos */}
                  {editYoutubeVideos.length > 0 && (
                    <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                      {editYoutubeVideos.map((url, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-[#121212] border border-gold-500/15 rounded p-2 text-xs">
                          <span className="truncate text-gray-300 pr-4 font-mono text-[10px]">{url}</span>
                          <div className="flex items-center space-x-1.5 shrink-0">
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={() => {
                                const copy = [...editYoutubeVideos];
                                const temp = copy[idx];
                                copy[idx] = copy[idx - 1];
                                copy[idx - 1] = temp;
                                setEditYoutubeVideos(copy);
                              }}
                              className="text-gray-400 hover:text-gold-500 disabled:opacity-30 disabled:pointer-events-none"
                            >
                              <ChevronLeft size={14} />
                            </button>
                            <button
                              type="button"
                              disabled={idx === editYoutubeVideos.length - 1}
                              onClick={() => {
                                const copy = [...editYoutubeVideos];
                                const temp = copy[idx];
                                copy[idx] = copy[idx + 1];
                                copy[idx + 1] = temp;
                                setEditYoutubeVideos(copy);
                              }}
                              className="text-gray-400 hover:text-gold-500 disabled:opacity-30 disabled:pointer-events-none"
                            >
                              <ChevronRight size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditYoutubeVideos(prev => prev.filter((_, i) => i !== idx))}
                              className="text-red-500 hover:text-red-400"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-2 border-t border-gold-500/10">
                <input 
                  id="edit-draft-checkbox" 
                  type="checkbox" 
                  checked={editDraft} 
                  onChange={e => setEditDraft(e.target.checked)} 
                  className="rounded text-gold-600 focus:ring-gold-500 bg-[#121212] border-gold-500/20 cursor-pointer" 
                />
                <label htmlFor="edit-draft-checkbox" className="text-xs text-gray-300 cursor-pointer font-medium select-none">
                  Keep as Draft (Hidden from store collections)
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gold-500/10">
                <button 
                  type="button" 
                  onClick={() => { setEditingProduct(null); setIsAddingProduct(false); }} 
                  className="border border-gold-500/20 hover:bg-gold-500/5 text-gray-400 hover:text-gold-400 px-4 py-2 rounded text-xs uppercase tracking-wider font-bold transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="bg-gold-600 hover:bg-gold-500 text-black px-6 py-2 rounded text-xs uppercase tracking-wider font-bold transition shadow-lg shadow-gold-500/10 border border-gold-500/20"
                >
                  {isAddingProduct ? 'Create Product' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deleting single product confirm modal */}
      {deletingProduct && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#0c0c0c] border border-red-500/20 max-w-md w-full rounded shadow-2xl p-6 font-sans">
            <div className="flex items-center space-x-3 text-red-500 mb-4">
              <AlertCircle size={24} />
              <h3 className="font-serif text-lg font-bold text-red-400">Permanently Delete Product?</h3>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed mb-6">
              Are you absolutely sure you want to delete <strong className="text-gray-200">"{deletingProduct.name}"</strong>? 
              This will permanently remove it from the database catalog, lookbooks, search indexes, wishlists, and recommendations. This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button 
                onClick={() => setDeletingProduct(null)} 
                className="border border-gold-500/20 hover:bg-gold-500/5 text-gray-400 hover:text-gold-400 px-4 py-2 rounded text-xs uppercase tracking-wider font-bold transition"
              >
                Cancel
              </button>
              <button 
                id="delete-single-confirm-btn"
                onClick={handleDeleteProductConfirm} 
                className="bg-red-600 hover:bg-red-500 text-white px-5 py-2 rounded text-xs uppercase tracking-wider font-bold transition"
              >
                Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deleting bulk products confirm modal */}
      {showBulkDeleteConfirm && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#0c0c0c] border border-red-500/20 max-w-md w-full rounded shadow-2xl p-6 font-sans">
            <div className="flex items-center space-x-3 text-red-500 mb-4">
              <AlertCircle size={24} />
              <h3 className="font-serif text-lg font-bold text-red-400">Bulk Delete {selectedProductIds.length} Products?</h3>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed mb-6">
              Are you absolutely sure you want to permanently delete the <strong className="text-gray-200">{selectedProductIds.length}</strong> selected products?
              This action is irreversible and will remove them all from active inventories, lookbooks, search indexes, wishlists, and storefront lists instantly.
            </p>
            <div className="flex justify-end space-x-3">
              <button 
                onClick={() => setShowBulkDeleteConfirm(false)} 
                className="border border-gold-500/20 hover:bg-gold-500/5 text-gray-400 hover:text-gold-400 px-4 py-2 rounded text-xs uppercase tracking-wider font-bold transition"
              >
                Cancel
              </button>
              <button 
                id="delete-bulk-confirm-btn"
                onClick={handleBulkDeleteConfirm} 
                className="bg-red-600 hover:bg-red-500 text-white px-5 py-2 rounded text-xs uppercase tracking-wider font-bold transition"
              >
                Bulk Delete All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete order confirmation modal */}
      {orderToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fadeIn">
          <div 
            id="order-delete-modal"
            className="w-full max-w-md bg-luxury-black border border-gold-500/40 rounded shadow-2xl p-8 text-center space-y-6 relative overflow-hidden"
          >
            {/* Elegant gold corner accents */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-gold-500/30"></div>
            <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-gold-500/30"></div>
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-gold-500/30"></div>
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-gold-500/30"></div>

            <div className="mx-auto w-16 h-16 bg-red-950/40 border border-red-500/30 rounded-full flex items-center justify-center text-red-500">
              <AlertCircle size={28} />
            </div>

            <div className="space-y-2">
              <h3 className="font-serif text-lg font-bold tracking-widest text-gold-300 uppercase">
                Confirm Deletion
              </h3>
              <p className="text-xs text-gray-300 font-sans leading-relaxed">
                Are you absolutely sure you want to permanently delete order <strong className="text-white font-mono">#{orderToDelete.id}</strong> from the database? This action is irreversible, and its value of <strong className="text-gold-400 font-mono">₹{orderToDelete.total.toLocaleString()}</strong> will be permanently deducted from your Settled Sales metrics.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                id="cancel-delete-order-btn"
                onClick={() => setOrderToDelete(null)}
                disabled={deletingOrderSpinner}
                className="w-full bg-[#121212] hover:bg-[#1c1c1c] border border-gold-500/20 hover:border-gold-500/40 text-gold-300 font-bold text-[10px] uppercase tracking-widest py-3 rounded transition cursor-pointer disabled:opacity-50"
              >
                Cancel & Safe-keep
              </button>
              <button
                id="confirm-delete-order-btn"
                onClick={handleDeleteOrderConfirm}
                disabled={deletingOrderSpinner}
                className="w-full bg-red-600 hover:bg-red-500 text-white font-bold text-[10px] uppercase tracking-widest py-3 rounded transition shadow-lg hover:shadow-red-500/20 cursor-pointer disabled:opacity-50 flex items-center justify-center space-x-1"
              >
                {deletingOrderSpinner ? (
                  <>
                    <span className="animate-spin mr-1">⚜</span>
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={12} />
                    <span>Delete Permanently</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating toast alert notifications */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center space-x-2.5 px-4.5 py-3 rounded shadow-2xl border animate-slideUp font-sans bg-[#0c0c0c] text-xs font-semibold border-gold-500/20">
          <span className={`w-2.5 h-2.5 rounded-full ${toastMessage.type === 'success' ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-red-500 shadow-[0_0_8px_#ef4444]'}`} />
          <span className="text-gray-100">{toastMessage.text}</span>
        </div>
      )}

    </div>
  );
}
