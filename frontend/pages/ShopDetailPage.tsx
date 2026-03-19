// src/pages/ShopDetailPage.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Shop } from '../components/types';
import { ArrowLeft, MapPin, Phone, Star, ExternalLink, Share2, Info, DollarSign } from 'lucide-react';
// ✅ 已移除 sonner 导入，避免报错

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const ShopDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);

  // ✅ 修复后的分享函数 (使用 alert 替代 toast)
  const handleShare = async () => {
    const currentUrl = window.location.href;
    const shopName = shop?.name || 'This Shop';

    // 1. 优先尝试原生分享 (手机端)
    if (navigator.share) {
      try {
        await navigator.share({
          title: shopName,
          text: `Check out ${shopName} on NZ Massage Map!`,
          url: currentUrl,
        });
        return; 
      } catch (err) {
        console.log('Share canceled or failed', err);
      }
    }

    // 2. 备用方案：复制到剪贴板
    try {
      await navigator.clipboard.writeText(currentUrl);
      alert('✅ Link copied to clipboard!');
    } catch (err) {
      // 3. 终极兼容方案
      const textarea = document.createElement('textarea');
      textarea.value = currentUrl;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      
      alert('✅ Link copied!');
    }
  };

  useEffect(() => {
    const fetchShop = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/shop/shops`);
        const data = await res.json();
        
        const found = data.find((s: any) => {
          const generatedSlug = s.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
          return generatedSlug === slug || s.id.toString() === slug;
        });
        
        setShop(found || null);
      } catch (e) {
        console.error("Fetch error:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchShop();
  }, [slug]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-rose-500 font-bold text-lg animate-pulse">Loading details...</div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gray-50 p-6 text-center">
        <h2 className="text-xl font-bold text-gray-800 mb-2">Shop Not Found</h2>
        <p className="text-gray-500 mb-4">The shop you are looking for doesn't exist or has been removed.</p>
        <button onClick={() => navigate('/')} className="mt-4 px-6 py-2 bg-rose-500 text-white rounded-full font-bold text-sm hover:bg-rose-600 transition">Back to Map</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* 1. Header */}
      <div className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm">
        <button onClick={() => navigate('/')} className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition">
          <ArrowLeft size={22} className="text-gray-700" />
        </button>
        <span className="font-bold text-gray-800 truncate max-w-[60%]">{shop.name}</span>
        
        {/* ✅ 绑定分享按钮 */}
        <button 
          onClick={handleShare} 
          className="p-2 -mr-2 hover:bg-gray-100 rounded-full transition active:scale-95"
          aria-label="Share this shop"
        >
          <Share2 size={20} className="text-gray-500" />
        </button>
      </div>

      {/* 2. Scrollable Content */}
      <div className="flex-1 overflow-y-auto pb-10">
        
        {/* Image Section */}
        <div className="relative w-full max-w-[300px] mx-auto bg-gray-100 overflow-hidden">
          {shop.pictures && shop.pictures.length > 0 ? (
            (() => {
              const rawUrl = shop.pictures[0].url;
              const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
              
              let finalUrl = rawUrl;
              if (rawUrl && !rawUrl.startsWith('http://') && !rawUrl.startsWith('https://')) {
                const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
                const pathPrefix = rawUrl.startsWith('/') ? '' : '/uploads/'; 
                finalUrl = `${cleanBase}${pathPrefix}${rawUrl}`;
              }

              return (
                <>
                  <img 
                    src={finalUrl} 
                    alt={shop.name} 
                    className="w-full h-64 md:h-80 object-cover min-h-0 block"
                    onError={(e) => {
                      console.error("图片加载失败:", finalUrl);
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      if(target.parentElement) {
                        target.parentElement.innerHTML = `
                          <div class="w-full h-64 md:h-80 flex items-center justify-center text-gray-400 bg-gray-100">
                            图片加载失败
                          </div>
                        `;
                      }
                    }}
                  />
                  
                  {shop.badge_text && (
                    <span className="absolute top-4 left-4 px-3 py-1 bg-rose-500 text-white text-xs font-bold rounded-full shadow-lg uppercase tracking-wide z-10">
                      {shop.badge_text}
                    </span>
                  )}
                </>
              );
            })()
          ) : (
            <div className="w-full h-64 md:h-80 flex items-center justify-center text-gray-400 bg-gray-100">
              <MapPin size={40} className="opacity-20" />
            </div>
          )}
        </div>

        {/* Info Card */}
        <div className="bg-white -mt-6 relative rounded-t-3xl px-6 pt-8 pb-6 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">{shop.name}</h1>
          
          <div className="flex items-center gap-1 mb-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star key={i} size={14} fill="#FBBF24" className="text-yellow-400" />
            ))}
            <span className="text-xs text-gray-400 ml-1 font-medium">Verified Listing</span>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-2xl flex flex-col items-center justify-center text-center gap-2">
              <div className="p-2 bg-white rounded-full shadow-sm text-rose-500">
                <MapPin size={20} />
              </div>
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Location</span>
              <p className="text-sm text-gray-700 line-clamp-2 leading-tight font-medium">{shop.address || 'Address not available'}</p>
            </div>
            
            {shop.phone && (
              <div className="bg-gray-50 p-4 rounded-2xl flex flex-col items-center justify-center text-center gap-2">
                <a href={`tel:${shop.phone}`} className="p-2 bg-white rounded-full shadow-sm text-rose-500 w-fit">
                  <Phone size={20} />
                </a>
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Call Us</span>
                <p className="text-sm text-gray-700 font-bold">{shop.phone}</p>
              </div>
            )}
          </div>

          {shop.about_me && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <Info size={18} className="text-rose-500" />
                <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wide">About Me</h3>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line bg-rose-50/50 p-4 rounded-2xl border border-rose-100">
                {shop.about_me}
              </p>
            </div>
          )}

          {shop.additional_price && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign size={18} className="text-green-600" />
                <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wide">Price Info</h3>
              </div>
              <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line bg-green-50/50 p-4 rounded-2xl border border-green-100 font-medium">
                {shop.additional_price}
              </p>
            </div>
          )}

          {shop.description && (
            <div className="mb-8">
              <h3 className="font-bold text-gray-900 mb-2 text-sm uppercase tracking-wide">Description</h3>
              <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
                {shop.description}
              </p>
            </div>
          )}

          <button 
            onClick={() => navigate(`/?lat=${shop.lat}&lng=${shop.lng}&focus=${shop.id}`)}
            className="w-full py-4 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition shadow-lg flex items-center justify-center gap-2 active:scale-95 transform duration-100 text-sm uppercase tracking-wide"
          >
            <MapPin size={18} />
            <span>View on Map</span>
            <ExternalLink size={16} className="opacity-70" />
          </button>
          
          <div className="mt-4 text-center">
             <button onClick={() => navigate('/')} className="text-xs text-gray-400 hover:text-gray-600 font-medium underline">
               Back to Browse
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopDetailPage;