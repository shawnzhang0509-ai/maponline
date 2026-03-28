import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { MessageCircle, MapPin, Phone, Upload, X, Check } from 'lucide-react';
import { Shop, ShopEdit } from '../types';
import { getSMSLink } from '../utils';
import { dmsToDecimal } from '../utils/geoUtils';

interface ShopCardProps {
  shop: Shop;
  isSelected: boolean;
  onClick: () => void;
  onDelete: (shop: Shop) => void;
  onSave: (updatedShop: Shop) => void;
  onPreview?: (shop: Shop, index: number) => void;
  deleting?: boolean;
  isLoggedIn?: boolean;
}

// ==========================================
// 🎨 智能标签配置表
// ==========================================
const TAG_CONFIG: Record<string, { icon: string; bg: string; text?: string }> = {
  'diamond': { icon: '💎', bg: 'bg-gradient-to-r from-blue-400 to-blue-600 text-white shadow-blue-300', text: 'Diamond' },
  'vip':     { icon: '👑', bg: 'bg-gradient-to-r from-amber-300 to-amber-500 text-amber-900 shadow-amber-200', text: 'VIP' },
  'new':     { icon: '🆕', bg: 'bg-gradient-to-r from-rose-500 to-red-600 text-white shadow-rose-300', text: 'New' },
  'hot':     { icon: '🔥', bg: 'bg-gradient-to-r from-orange-400 to-red-500 text-white shadow-orange-300', text: 'Hot' },
  'fresh':   { icon: '✨', bg: 'bg-gradient-to-r from-emerald-400 to-teal-500 text-white shadow-teal-200', text: 'Fresh' },
  'nice':    { icon: '💖', bg: 'bg-gradient-to-r from-pink-400 to-rose-400 text-white shadow-pink-200', text: 'Nice' },
  'massage': { icon: '💆‍♀️', bg: 'bg-gradient-to-r from-purple-400 to-indigo-500 text-white shadow-purple-200', text: 'Massage' },
  'thai':    { icon: '🇹🇭', bg: 'bg-white text-gray-800 border border-gray-200 shadow-sm', text: 'Thai' },
  'chinese': { icon: '🇨🇳', bg: 'bg-white text-gray-800 border border-gray-200 shadow-sm', text: 'Chinese' },
  'japanese':{ icon: '🇯🇵', bg: 'bg-white text-gray-800 border border-gray-200 shadow-sm', text: 'Japanese' },
  'korean':  { icon: '🇰🇷', bg: 'bg-white text-gray-800 border border-gray-200 shadow-sm', text: 'Korean' },
  'default': { icon: '', bg: 'bg-gray-800/90 text-white backdrop-blur-md shadow-gray-400', text: '' }
};

  // ... 前面的 state 定义 ...


const ShopCard: React.FC<ShopCardProps> = ({
  shop,
  isSelected,
  onClick,
  onDelete,
  onSave,
  onPreview,
  deleting,
  isLoggedIn,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showConfirmSave, setShowConfirmSave] = useState(false);

  // ✅ 关键修正：字段名与后端 shop.py 严格对应 (about_me, additional_price)
  const [editData, setEditData] = useState<ShopEdit>({
    ...shop,
    name: shop.name || '',
    address: shop.address || '',
    phone: shop.phone || '',
    lat: typeof shop.lat === 'number' ? shop.lat : -36.8485,
    lng: typeof shop.lng === 'number' ? shop.lng : 174.7633,
    pictures: Array.isArray(shop.pictures) ? [...shop.pictures] : [],
    new_girls_last_15_days: !!shop.new_girls_last_15_days,
    badge_text: shop.badge_text || '',
    
    // 👇 这里必须用 about_me 和 additional_price
    about_me: shop.about_me || '', 
    additional_price: shop.additional_price || '',
    
    newPictures: [],
    removePictureIds: [],
  });
  const handleActionClick = async (type: 'sms' | 'call', e: React.MouseEvent) => {
    // 1. 阻止默认行为（防止页面跳转或链接打开）
    e.preventDefault();
    e.stopPropagation();

    const phone = shop.phone || '';
    if (!phone) {
      alert('No phone number available');
      return;
    }

    try {
      // 2. 发送统计请求
      const apiUrl = import.meta.env.VITE_API_BASE_URL;
      if (!apiUrl) throw new Error('API URL not configured');

      const response = await fetch(`${apiUrl}/shop/track/action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shop_id: `shop_${shop.id}`, // ✅ 统一 ID 格式
          type: type,
          phone: phone,
          address: shop.address || '',
          timestamp: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        console.log('✅ Tracking event sent successfully');
      } else {
        console.error('❌ Failed to send tracking event');
      }
    } catch (error) {
      console.warn('⚠️ Stats failed (non-critical):', error);
    }

    // 3. 执行跳转逻辑（无论统计成功与否都执行）
    if (type === 'sms') {
      const bodyText = encodeURIComponent('Hi, is there any availability today?');
      window.location.href = `sms:${phone}?body=${bodyText}`;
    } else if (type === 'call') {
      window.location.href = `tel:${phone}`;
    }
  };

    try {
      const apiUrl = import.meta.env.VITE_API_BASE_URL;
      if (!apiUrl) throw new Error('API URL not configured');

      await fetch(`${apiUrl}/shop/track/action`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json' // ✅ 1. 保持这个 Header
        },
        // mode: 'no-cors', // ❌ 2. 【关键】删除这一行！不要使用 no-cors
        body: JSON.stringify({
          shop_id: `shop_${shop.id}`, // ✅ 修改这一行
          type: type,
          phone: phone,
          address: shop.address || '',
          timestamp: new Date().toISOString()
        }),
      });
      
      console.log(`✅ Stats sent for ${type}`);
    } catch (error) {
      // 即使统计失败，也不影响用户跳转，只打印警告
      console.warn('⚠️ Stats failed (non-critical):', error);
    }

    // 执行跳转逻辑 (无论统计成功与否都执行)
    if (type === 'sms') {
      const bodyText = encodeURIComponent('Hi, is there any availability today?');
      window.location.href = `sms:${phone}?body=${bodyText}`;
    } else if (type === 'call') {
      window.location.href = `tel:${phone}`;
    }
  };
     // ... 原有的 handleSave 代码 ...
  const handleSave = async () => {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
    if (!API_BASE_URL) {
      alert('❌ 错误：API URL 未配置');
      return;
    }

    const formData = new FormData();
    formData.append('name', editData.name);
    formData.append('address', editData.address);
    formData.append('phone', editData.phone);
    formData.append('lat', String(editData.lat));
    formData.append('lng', String(editData.lng));
    
    // ✅ 关键修正：发送的 key 必须与后端 Flask request.form.get() 的 key 一致
    formData.append('about_me', editData.about_me || '');
    formData.append('additional_price', editData.additional_price || '');

    formData.append('badge_text', editData.badge_text || '');
    formData.append('new_girls_last_15_days', editData.new_girls_last_15_days ? '1' : '0');
    formData.append('remove_picture_ids', editData.removePictureIds.join(','));

    editData.newPictures.forEach(file => {
      formData.append('pictures', file);
    });

    const url = `${API_BASE_URL}/shop/update/${shop.id}`;
    
    try {
      const res = await fetch(url, { method: 'POST', body: formData });
      const responseText = await res.text();

      if (!res.ok) {
        let errorMsg = `服务器拒绝请求 (Status: ${res.status})`;
        try {
          const jsonErr = JSON.parse(responseText);
          if (jsonErr.message) errorMsg += `\n详情：${jsonErr.message}`;
        } catch (e) {}
        alert(`❌ 更新失败:\n${errorMsg}`);
        return;
      }

      let updatedShop;
      try {
        updatedShop = JSON.parse(responseText);
      } catch (e) {
        throw new Error('服务器返回的数据不是有效的 JSON');
      }

      const fixedPictures = (updatedShop.pictures || []).map((pic: any) => {
        if (!pic.url) return pic;
        const fullUrl = pic.url.startsWith('http') ? pic.url : `${API_BASE_URL}${pic.url}`;
        return { ...pic, url: fullUrl };
      });

      const finalData = {
        ...updatedShop,
        pictures: fixedPictures,
        new_girls_last_15_days: editData.new_girls_last_15_days, 
        badge_text: editData.badge_text || '',
        // 确保返回数据也包含正确的字段名
        about_me: editData.about_me,
        additional_price: editData.additional_price,
      };

      onSave(finalData);
      setEditData(prev => ({ 
        ...prev, 
        pictures: fixedPictures, 
        newPictures: [], 
        removePictureIds: [],
        about_me: editData.about_me,
        additional_price: editData.additional_price
      }));
      setIsEditing(false);
      setShowConfirmSave(false);
      
      setTimeout(() => alert('✅ 保存成功！'), 100);

    } catch (error) {
      console.error('💥 保存过程发生异常:', error);
      alert(`❌ 发生错误：${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  // ==========================================
  // ✅ 编辑模式 (Portal)
  // ==========================================
  if (isEditing && typeof document !== 'undefined') {
    const modalContent = (
      <>
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99998]" 
          onClick={() => {
            setIsEditing(false);
            setShowConfirmSave(false);
          }}
        />
        
        <div 
          className="fixed z-[99999] bg-white rounded-2xl shadow-2xl flex flex-col max-h-[85vh]"
          style={{
            top: '50%',
            left: '50%',
            width: '90%',
            maxWidth: '400px',
            transform: 'translate(-50%, -50%)',
            maxHeight: '85vh',
            overflow: 'hidden',
          }}
          onClick={(e) => e.stopPropagation()} // 👈 【重要】防止点击弹窗白色区域本身触发冒泡
        >
          <div className="flex items-center justify-between p-4 border-b bg-gray-50 rounded-t-2xl">
            <h3 className="font-bold text-lg text-gray-800">Edit Shop</h3>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setIsEditing(false);
                setShowConfirmSave(false);
              }}
              className="p-2 hover:bg-gray-200 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="p-4 overflow-y-auto flex-1 space-y-4 custom-scrollbar">
            {/* NAME */}
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">NAME</label>
              <input
                value={editData.name || ''}
                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                onClick={(e) => e.stopPropagation()} // 👈 已补全
                className="w-full font-bold text-lg p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                autoFocus
              />
            </div>

            {/* ADDRESS */}
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">ADDRESS</label>
              <textarea
                value={editData.address || ''}
                onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                onClick={(e) => e.stopPropagation()} // 👈 已补全
                className="w-full text-sm p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                rows={2}
              />
            </div>

            {/* PHONE */}
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">PHONE</label>
              <input
                value={editData.phone || ''}
                onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                onClick={(e) => e.stopPropagation()}
                className="w-full text-sm p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            {/* ABOUT ME */}
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">ABOUT ME</label>
              <textarea
                value={editData.about_me || ''}
                onChange={(e) => setEditData({ ...editData, about_me: e.target.value })}
                onClick={(e) => e.stopPropagation()}
                placeholder="Tell customers about your shop..."
                className="w-full text-sm p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                rows={3}
              />
            </div>

            {/* ADDITIONAL PRICE INFO */}
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">ADDITIONAL PRICE INFO</label>
              <input
                type="text"
                value={editData.additional_price || ''}
                onChange={(e) => setEditData({ ...editData, additional_price: e.target.value })}
                onClick={(e) => e.stopPropagation()}
                placeholder="e.g. $80/1hr, $150/2hrs"
                className="w-full text-sm p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            {/* COORDINATES */}
            <div className="bg-gray-50 p-3 rounded-lg border">
              <label className="block text-xs font-bold text-gray-500 mb-1">COORDINATES</label>
              <input
                type="text"
                placeholder="Paste from Google Maps..."
                className="w-full px-3 py-2 text-sm border rounded-lg font-mono bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => {
                  const value = e.target.value.trim();
                  const parts = value.split(/[,，\s]+/).filter(p => p !== '');
                  if (parts.length >= 2) {
                    const latNum = parseFloat(parts[0]);
                    const lngNum = parseFloat(parts[1]);
                    if (!isNaN(latNum) && !isNaN(lngNum)) {
                      setEditData({ ...editData, lat: latNum, lng: lngNum });
                      return;
                    }
                    const latDms = dmsToDecimal(parts[0]);
                    const lngDms = dmsToDecimal(parts[1]);
                    if (latDms !== null && lngDms !== null) {
                      setEditData({ ...editData, lat: latDms, lng: lngDms });
                    }
                  }
                }}
              />
              <p className="text-[10px] text-gray-400 mt-1 text-right">
                {editData.lat?.toFixed(4)}, {editData.lng?.toFixed(4)}
              </p>
            </div>

            {/* IMAGES */}
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-2">IMAGES</label>
              <label 
                className="flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <Upload className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-500 font-medium">Add Picture</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setEditData(prev => ({ ...prev, newPictures: [...prev.newPictures, file] }));
                    }
                    e.target.value = '';
                  }}
                />
              </label>
              
              <div className="mt-3 grid grid-cols-4 gap-2 max-h-32 overflow-y-auto">
                {editData.pictures.map((pic, idx) => (
                  <div key={`old-${idx}`} className="relative aspect-square">
                    <img src={pic.url} alt="" className="w-full h-full object-cover rounded-lg border" />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditData(prev => ({
                          ...prev,
                          pictures: prev.pictures.filter((_, i) => i !== idx),
                          removePictureIds: [...prev.removePictureIds, pic.id],
                        }));
                      }}
                      className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shadow-sm hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                ))}
                {editData.newPictures.map((file, idx) => (
                  <div key={`new-${idx}`} className="relative aspect-square">
                    <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover rounded-lg border border-blue-400" />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditData({ ...editData, newPictures: editData.newPictures.filter((_, i) => i !== idx) })
                      }}
                      className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shadow-sm hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* TAGS */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">TAGS (Auto-Style)</label>
              <input
                type="text"
                value={editData.badge_text || ''}
                onChange={(e) => setEditData({ ...editData, badge_text: e.target.value })}
                onClick={(e) => e.stopPropagation()}
                placeholder="e.g. Diamond, VIP, New, Thai"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
              />
              <p className="text-[10px] text-gray-500 mt-1">
                Separate with commas. Keywords like "Diamond", "VIP", "New" get special icons.
              </p>

              {editData.badge_text && editData.badge_text.trim() !== '' && (
                <div className="mt-3 flex flex-wrap gap-2 p-2 bg-gray-50 rounded-lg border border-gray-100">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider self-center mr-1">Preview:</span>
                  {editData.badge_text.split(',').map((tag, idx) => {
                    const t = tag.trim();
                    if (!t) return null;
                    const lower = t.toLowerCase();
                    const config = TAG_CONFIG[lower] || TAG_CONFIG['default'];
                    const display = config.text || (t.charAt(0).toUpperCase() + t.slice(1));
                    
                    return (
                      <span 
                        key={idx} 
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black tracking-wide shadow-md ${config.bg}`}
                      >
                        {config.icon && <span className="text-base leading-none shrink-0 filter drop-shadow-sm">{config.icon}</span>}
                        <span className="whitespace-nowrap">{display}</span>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Bottom Buttons */}
          <div className="p-4 border-t bg-gray-50 rounded-b-2xl flex gap-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsEditing(false);
                setShowConfirmSave(false);
              }}
              className="flex-1 py-3 bg-white border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation(); // 👈 【重要】之前漏了这个
                setShowConfirmSave(true);
              }}
              className="flex-1 py-3 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600 shadow-lg shadow-green-200 transition-all active:scale-95"
            >
              Save Changes
            </button>
          </div>
        </div>

        {/* Confirm Modal */}
        {showConfirmSave && (
          <>
            <div 
              className="fixed inset-0 bg-black/70 z-[100000]" 
              onClick={(e) => {
                e.stopPropagation();
                setShowConfirmSave(false);
              }} 
            />
            <div 
              className="fixed z-[100001] bg-white rounded-2xl p-6 w-[90%] max-w-sm shadow-2xl"
              style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <h4 className="text-lg font-bold text-gray-800 mb-2">Confirm Save?</h4>
              <p className="text-sm text-gray-600 mb-4">
                Are you sure you want to save changes to "<strong>{editData.name}</strong>"?
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowConfirmSave(false);
                  }} 
                  className="flex-1 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSave();
                  }} 
                  className="flex-1 py-2 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" /> Confirm
                </button>
              </div>
            </div>
          </>
        )}
      </>
    );

    return createPortal(modalContent, document.body);
  }

  // ==========================================
  // ✅ 展示模式
  // ==========================================
  return (
    <div
      onClick={onClick}
      className={`
        flex-shrink-0 w-[260px] bg-white rounded-2xl shadow-lg border overflow-hidden 
        transition-all duration-300 transform cursor-pointer relative group
        ${isSelected 
          ? 'border-rose-500 ring-4 ring-rose-200 bg-yellow-50 scale-[1.02]' 
          : 'border-gray-200 hover:shadow-xl hover:-translate-y-1'}
      `}
    >
      {/* 操作按钮 */}
      {isLoggedIn && (
        <div className="absolute top-2 right-2 z-50 flex gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
            className="w-7 h-7 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm shadow-md hover:bg-blue-600 transition-colors"
          >
            ✏️
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (!deleting && window.confirm(`Delete "${shop.name}"?`)) onDelete(shop);
            }}
            disabled={deleting}
            className={`w-7 h-7 rounded-full flex items-center justify-center shadow-md text-sm transition-colors ${
              deleting ? 'bg-gray-300 cursor-not-allowed' : 'bg-red-500 text-white hover:bg-red-600'
            }`}
          >
            {deleting ? '…' : '×'}
          </button>
        </div>
      )}

      {/* 标签层 */}
      {shop.badge_text && shop.badge_text.trim() !== '' && (
        <div className="absolute top-3 left-3 z-40 flex flex-wrap gap-2 max-w-[85%] pointer-events-none">
          {shop.badge_text.split(',').map((tagStr, tIdx) => {
            const rawTag = tagStr.trim();
            if (!rawTag) return null;
            const lowerTag = rawTag.toLowerCase();
            const config = TAG_CONFIG[lowerTag] || TAG_CONFIG['default'];
            const displayText = config.text || (rawTag.charAt(0).toUpperCase() + rawTag.slice(1));

            return (
              <span 
                key={tIdx} 
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black tracking-wide shadow-lg backdrop-blur-sm ${config.bg}`}
              >
                {config.icon && <span className="text-lg leading-none shrink-0 filter drop-shadow-md">{config.icon}</span>}
                <span className="whitespace-nowrap">{displayText}</span>
              </span>
            );
          })}
        </div>
      )}

      {/* 图片区域 */}
      <div
        className="relative h-24 overflow-hidden bg-gray-100 select-none"
        style={{ 
          touchAction: 'pan-y', 
          WebkitOverflowScrolling: 'touch' 
        }}
        onClick={(e) => {
          if (shop.pictures && shop.pictures.length > 0) {
            onPreview?.(shop, 0);
          }
        }}
        onWheel={(e) => e.preventDefault()} 
      >
        <div className="flex gap-1 h-full p-1 w-full overflow-hidden pointer-events-none"> 
                    {shop.pictures && shop.pictures.length > 0 ? (
            shop.pictures.map((pic, idx) => {
              const rawUrl = pic.url;
              // 🔍 调试：打印原始 URL
              console.log(`[ShopCard] Raw URL ${idx}:`, rawUrl);

              let optimizedUrl = rawUrl;

              // 1️⃣ 如果是 http 开头，直接使用（可能是 CDN 链接）
              if (rawUrl && rawUrl.startsWith('http')) {
                optimizedUrl = rawUrl;
              } 
              // 2️⃣ 如果是 Cloudinary 相对路径 (/upload/...)
              else if (rawUrl && rawUrl.includes('/upload/')) {
                const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
                if (cloudName) {
                  const baseUrl = `https://res.cloudinary.com/${cloudName}`;
                  const pathAfterUpload = rawUrl.startsWith('/') ? rawUrl.slice(1) : rawUrl;
                  const transformParams = 'f_auto,q_auto,w_200,c_fill';
                  optimizedUrl = `${baseUrl}/image/upload/${transformParams}/${pathAfterUpload}`;
                } else {
                  console.warn('[ShopCard] Missing VITE_CLOUDINARY_CLOUD_NAME, falling back to API');
                  // 如果没配 Cloudinary，掉落到下面的 API 拼接逻辑
                  optimizedUrl = rawUrl; 
                }
              }
              
              // 3️⃣ 【核心修复】其他所有相对路径，强制拼接 API_BASE_URL
              if (!optimizedUrl.startsWith('http')) {
                const apiBase = import.meta.env.VITE_API_BASE_URL || '';
                
                // ✅ 绝对防御：确保 base 有结尾斜杠，path 有开头斜杠（只保留一个）
                const base = apiBase.endsWith('/') ? apiBase : `${apiBase}/`;
                const path = optimizedUrl.startsWith('/') ? optimizedUrl.slice(1) : optimizedUrl;
                
                optimizedUrl = `${base}uploads/${path}`;
              }

              // 4️⃣ 添加时间戳防止缓存
              const separator = optimizedUrl.includes('?') ? '&' : '?';
              const finalUrl = `${optimizedUrl}${separator}_t=${Date.now()}`;

              console.log(`[ShopCard] ✅ Final URL ${idx}:`, finalUrl);

              return (
                <div key={idx} className="w-24 h-full flex-shrink-0 relative rounded-lg overflow-hidden bg-gray-100">
                  <img
                    src={finalUrl}
                    alt={shop.name}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover pointer-events-auto transition-opacity duration-300 opacity-0"
                    onLoad={(e) => {
                      console.log(`[ShopCard] ✅ Loaded:`, finalUrl);
                      (e.target as HTMLImageElement).classList.remove('opacity-0');
                    }}
                    onError={(e) => {
                      console.error(`[ShopCard] ❌ Failed:`, finalUrl);
                      const target = e.target as HTMLImageElement;
                      // 显示简单的文字占位，方便调试
                      target.style.background = '#e5e7eb';
                      target.style.display = 'flex';
                      target.style.alignItems = 'center';
                      target.style.justifyContent = 'center';
                      target.style.fontSize = '10px';
                      target.style.color = '#6b7280';
                      target.src = ''; 
                      target.innerText = 'IMG ERR'; 
                      target.classList.remove('opacity-0');
                    }}
                  />
                </div>
              );
            })
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs font-medium bg-gray-50 pointer-events-none">
              No Image
            </div>
          )} 
      </div>
    </div>

      {/* 底部信息区 */}
      <div className="p-3 space-y-2">
        <h3 className="font-bold text-gray-900 text-base truncate pr-6">{shop.name}</h3>
        <div className="flex items-start gap-1.5 text-gray-500 text-xs leading-tight h-8 overflow-hidden">
          <MapPin className="w-3 h-3 flex-shrink-0 mt-0.5 text-rose-400" />
          <p className="line-clamp-2">{shop.address}</p>
        </div>
        <div className="flex items-center gap-2 pt-1">
          {/* ✅ 新的 SMS 按钮 */}
          <button
            onClick={(e) => handleActionClick('sms', e)}
            className="flex-1 bg-rose-500 hover:bg-rose-600 active:bg-rose-700 text-white font-semibold py-2 px-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            <span className="text-sm">SMS</span>
          </button>

          {/* ✅ 新的 Phone 按钮 */}
          <button
            onClick={(e) => handleActionClick('call', e)}
            className="bg-gray-100 hover:bg-gray-200 p-2 rounded-xl text-gray-600 transition-colors"
          >
            <Phone className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShopCard;