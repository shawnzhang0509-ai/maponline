// src/pages/ShopDetailPage.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Shop } from '../components/types';
import { ArrowLeft, MapPin, Phone, Star, ExternalLink, Share2, Info, DollarSign } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const ShopDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);

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
        <button className="p-2 -mr-2 hover:bg-gray-100 rounded-full transition">
          <Share2 size={20} className="text-gray-500" />
        </button>
      </div>

      {/* 2. Scrollable Content */}
      <div className="flex-1 overflow-y-auto pb-10">
        
        {/* Image */}
        <div className="relative w-full h-48 sm:h-56 bg-gray-200">
          {shop.pictures && shop.pictures.length > 0 ? (
            <img src={shop.pictures[0].url} alt={shop.name} className="w-full h-full object-cover" />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400 bg-gray-100">
              <MapPin size={40} className="opacity-20" />
            </div>
          )}
          {shop.badge_text && (
            <span className="absolute top-3 left-3 px-3 py-1 bg-rose-500 text-white text-xs font-bold rounded-full shadow-lg uppercase tracking-wide">
              {shop.badge_text}
            </span>
          )}
        </div>

        {/* Info Card */}
        <div className="bg-white -mt-6 relative rounded-t-3xl px-6 pt-8 pb-6 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">{shop.name}</h1>
          
          {/* Rating Placeholder */}
          <div className="flex items-center gap-1 mb-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star key={i} size={14} fill="#FBBF24" className="text-yellow-400" />
            ))}
            <span className="text-xs text-gray-400 ml-1 font-medium">Verified Listing</span>
          </div>

          {/* Grid: Address & Phone */}
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

          {/* 🔥 NEW: About Me Section */}
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

          {/* 🔥 NEW: Additional Price Section */}
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

          {/* Description (General) */}
          {shop.description && (
            <div className="mb-8">
              <h3 className="font-bold text-gray-900 mb-2 text-sm uppercase tracking-wide">Description</h3>
              <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
                {shop.description}
              </p>
            </div>
          )}

          {/* Action Button */}
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