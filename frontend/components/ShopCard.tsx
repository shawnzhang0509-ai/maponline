import React, { useState } from 'react';
import { MessageCircle, MapPin, Phone, Upload } from 'lucide-react';
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
  const [editData, setEditData] = useState<ShopEdit>({
    ...shop,
    name: shop.name || '',
    address: shop.address || '',
    phone: shop.phone || '',
    lat: typeof shop.lat === 'number' ? shop.lat : -36.8485,
    lng: typeof shop.lng === 'number' ? shop.lng : 174.7633,
    pictures: Array.isArray(shop.pictures) ? [...shop.pictures] : [],
    new_girls_last_15_days: !!shop.new_girls_last_15_days,
    badge_text: shop.badge_text || 'New',
    newPictures: [],
    removePictureIds: [],
  });

  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const defaultImg = 'https://picsum.photos/seed/massage/400/300';
  const mainImg = shop.pictures && shop.pictures.length > 0 ? shop.pictures[0] : defaultImg;

    const handleSave = async () => {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
    if (!API_BASE_URL) {
      alert('❌ 错误: API URL 未配置 (检查 .env 文件)');
      return;
    }

    // 1. 准备数据
    const formData = new FormData();
    formData.append('name', editData.name);
    formData.append('address', editData.address);
    formData.append('phone', editData.phone);
    formData.append('lat', String(editData.lat));
    formData.append('lng', String(editData.lng));
    formData.append('badge_text', editData.badge_text || '');
    formData.append(
      'new_girls_last_15_days',
      editData.new_girls_last_15_days ? '1' : '0'
    );
    formData.append('remove_picture_ids', editData.removePictureIds.join(','));

    editData.newPictures.forEach(file => {
      formData.append('pictures', file);
    });

    const shopIdentifier = encodeURIComponent(editData.name); 
    const url = `${API_BASE_URL}/shop/update/${shopIdentifier}`;
    console.log('🚀 正在请求:', url);

    try {
      const res = await fetch(url, {
        method: 'POST',
        body: formData,
      });

      const responseText = await res.text(); 
      console.log('📩 服务器原始响应:', responseText);

      if (!res.ok) {
        let errorMsg = `服务器拒绝请求 (Status: ${res.status})`;
        try {
          const jsonErr = JSON.parse(responseText);
          if (jsonErr.message) errorMsg += `\n详情: ${jsonErr.message}`;
          else if (jsonErr.error) errorMsg += `\n详情: ${jsonErr.error}`;
        } catch (e) {
          if (responseText) errorMsg += `\n详情: ${responseText.substring(0, 100)}`;
        }
        console.error('❌ 更新失败:', errorMsg);
        alert(`❌ 更新失败:\n${errorMsg}`);
        return;
      }

      let updatedShop;
      try {
        updatedShop = JSON.parse(responseText);
      } catch (e) {
        throw new Error('服务器返回的数据不是有效的 JSON');
      }

      console.log('🔍【调试】后端返回的原始数据:', updatedShop);

      // ✅【核心修复：拼接完整 URL】
      const fixedPictures = (updatedShop.pictures || []).map((pic: any) => {
        if (!pic.url) return pic;
        
        const fullUrl = pic.url.startsWith('http') 
          ? pic.url 
          : `${API_BASE_URL}${pic.url}`;
          
        return { ...pic, url: fullUrl };
      });

      console.log('✅ 图片 URL 已修复:', fixedPictures);

      // ✅【关键步骤：构造最终数据并通知父组件】
      const finalData = { ...updatedShop, pictures: fixedPictures };

      // 1. 通知父组件更新列表
      onSave(finalData);

      // 2. 更新本地 editData (确保再次编辑时图片也是对的)
      setEditData(prev => ({
        ...prev,
        pictures: fixedPictures,
        newPictures: [],
        removePictureIds: [],
      }));

      // 3. 退出编辑模式
      setIsEditing(false);
      
      // 4. 清理预览
      setPreviewImage(null);

      setTimeout(() => {
        alert('✅ 保存成功！');
      }, 100);

    } catch (error) {
      console.error('💥 保存过程发生异常:', error);
      alert(`❌ 发生错误: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };


  // ========== 编辑模式 ==========
  if (isEditing) {
    return (
      <div className="flex-shrink-0 w-[280px] bg-white rounded-2xl p-4 border-2 border-blue-500 shadow-lg">
        {/* Name */}
        <input
          value={editData.name || ''}
          onChange={(e) => setEditData({ ...editData, name: e.target.value })}
          placeholder="Name"
          className="w-full font-bold text-lg mb-2 p-1 border rounded"
          autoFocus
        />
        {/* Address */}
        <textarea
          value={editData.address || ''}
          onChange={(e) => setEditData({ ...editData, address: e.target.value })}
          placeholder="Address"
          className="w-full text-xs mb-2 p-1 border rounded"
          rows={2}
        />
        {/* Phone */}
        <input
          value={editData.phone || ''}
          onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
          placeholder="Phone"
          className="w-full text-xs mb-3 p-1 border rounded"
        />
        {/* Coordinates */}
        <div className="mb-3">
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Coordinates (Paste from Google Maps)
          </label>
          <input
            type="text"
            placeholder="e.g. 36°55'33.2S 174°48'09.5E"
            className="w-full px-2 py-1 text-sm border rounded font-mono"
            onChange={(e) => {
              const value = e.target.value.trim();
              // 尝试按逗号或空格分割
              const parts = value.split(/[,，\s]+/).filter(p => p !== '');

              if (parts.length >= 2) {
                // ✅ 先尝试解析为十进制数字
                const latNum = parseFloat(parts[0]);
                const lngNum = parseFloat(parts[1]);

                if (!isNaN(latNum) && !isNaN(lngNum)) {
                  // 十进制有效 → 直接使用
                  setEditData({ ...editData, lat: latNum, lng: lngNum });
                  return;
                }

                // ❌ 如果不是十进制，再尝试 DMS 格式
                const latDms = dmsToDecimal(parts[0]);
                const lngDms = dmsToDecimal(parts[1]);

                if (latDms !== null && lngDms !== null) {
                  setEditData({ ...editData, lat: latDms, lng: lngDms });
                }
              }
            }}
          />
          <p className="text-[10px] text-gray-500 mt-1">
            Current: {editData.lat?.toFixed(6)}, {editData.lng?.toFixed(6)}
          </p>
        </div>
       {/* Add Picture */}
      <div className="mb-3">
        <label className="flex items-center gap-1 text-xs bg-gray-100 px-2 py-1 rounded cursor-pointer w-fit">
          <Upload className="w-3 h-3" />
          <span>Add picture</span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                setEditData(prev => ({
                  ...prev,
                  newPictures: [...prev.newPictures, file],
                }));
              }
              e.target.value = '';
            }}
          />
        </label>
        <div className="mt-2 flex flex-wrap gap-1 max-h-20 overflow-y-auto">
          {/* 已存在的图片 */}
          {editData.pictures.map((pic, idx) => (
            <div key={`old-${idx}`} className="relative">
              <img
                src={pic.url}
                alt={`Old ${idx}`}
                className="w-12 h-12 object-cover rounded border"
              />
              <button
                type="button"
                onClick={() => {
                  setEditData(prev => ({
                    ...prev,
                    // 1️⃣ UI 中移除图片
                    pictures: prev.pictures.filter((_, i) => i !== idx),

                    // 2️⃣ 记录要删除的图片 ID（去重保险）
                    removePictureIds: prev.removePictureIds.includes(pic.id)
                      ? prev.removePictureIds
                      : [...prev.removePictureIds, pic.id],
                  }));
                }}
                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[8px]"
              >
                ×
              </button>
            </div>
          ))}

          {/* 新上传的图片 */}
          {editData.newPictures.map((file, idx) => (
            <div key={`new-${idx}`} className="relative">
              <img
                src={URL.createObjectURL(file)} // 仅用于预览
                alt={`New ${idx}`}
                className="w-12 h-12 object-cover rounded border"
              />
              <button
                type="button"
                onClick={() =>
                  setEditData({
                    ...editData,
                    newPictures: editData.newPictures.filter((_, i) => i !== idx),
                  })
                }
                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[8px]"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>
      {/* === New Badge Settings === */}
      <div className="mb-3">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={!!editData.new_girls_last_15_days}
            onChange={(e) =>
              setEditData({
                ...editData,
                new_girls_last_15_days: e.target.checked,
              })
            }
            className="w-4 h-4"
          />
          <span>Display New Badge</span>
        </label>

        {editData.new_girls_last_15_days && (
          <div className="mt-2">
            <label className="block text-xs text-gray-600 mb-1">Badge Text</label>
            <input
              type="text"
              value={editData.badge_text || ''}
              onChange={(e) =>
                setEditData({ ...editData, badge_text: e.target.value })
              }
              className="w-full px-2 py-1 text-sm border rounded"
              placeholder="e.g. Hot, New, Fresh"
              maxLength={12}
            />
          </div>
        )}
      </div>
        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className="flex-1 bg-green-500 hover:bg-green-600 text-white py-1.5 rounded-lg text-sm font-medium"
          >
            Save
          </button>
          <button
            onClick={() => setIsEditing(false)}
            className="flex-1 bg-gray-200 hover:bg-gray-300 py-1.5 rounded-lg text-sm font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // ========== 展示模式（原样保留 + 加编辑按钮） ==========
  return (
    <div
      onClick={onClick}
      className={`flex-shrink-0 w-[280px] bg-rose-50 rounded-2xl border-rose-500 ring-4 ring-rose-100 shadow-xl overflow-hidden border-2 transition-all duration-300 transform  ${
        isSelected
          ? 'border-8 border-red-600 bg-yellow-300 animate-pulse' 
          : 'border-2 border-gray-200'}
        transition-all duration-300
      }`}
    >
      {/* ✏️ Edit & × Delete buttons (only when logged in) */}
      {isLoggedIn && (
        <div className="absolute top-2 right-2 z-10 flex gap-1">
          {/* Edit button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
            }}
            className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs shadow-md hover:bg-blue-600"
          >
            ✏️
          </button>
          {/* Delete button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (!deleting && window.confirm(`Are you sure you want to delete "${shop.name}"?`)) {
                onDelete(shop);
              }
            }}
            disabled={deleting}
            className={`w-6 h-6 rounded-full flex items-center justify-center shadow-md text-xs ${
              deleting ? 'bg-gray-300 cursor-not-allowed' : 'bg-red-500 text-white hover:bg-red-600'
            }`}
          >
            {deleting ? '…' : '×'}
          </button>
        </div>
      )}

      {/* Image with badge */}
      {/* 图片横向滚动容器 */}
      <div
        className="relative h-32 overflow-x-auto overflow-y-hidden scroll-smooth no-scrollbar"
        onClick={(e) => {
          e.stopPropagation();
          if (shop.pictures && shop.pictures.length > 0) {
            onPreview?.(shop, 0);
          }
        }}
      >
        {/* 所有图片缩略图 */}
        <div className="flex gap-1 h-full">
          {shop.pictures?.map((pic, idx) => (
            <div key={idx} className="w-32 h-full flex-shrink-0 relative">
              <img
                // 🔥 1. 加上时间戳，强制浏览器重新请求，忽略缓存
                src={`${pic.url}${pic.url.includes('?') ? '&' : '?'}_t=${Date.now()}`}
                alt={`Preview ${idx}`}
                className="w-full h-full object-cover bg-gray-50"
                
                // 🔥 2. 加载失败时，在控制台打印详细错误
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  console.error(`❌ 图片加载失败!`);
                  console.error(`   尝试访问: ${target.src}`);
                  console.error(`   原始数据: ${pic.url}`);
                  console.error(`   👉 请复制上面的 "尝试访问" 链接到浏览器测试!`);
                  
                  // 视觉提示：变红
                  target.style.backgroundColor = '#fecaca';
                  target.style.opacity = '0.7';
                }}
                
                // 🔥 3. 加载成功时，在控制台确认
                onLoad={() => {
                  console.log(`✅ 图片加载成功: ${pic.url}`);
                }}
              />
              {/* Badge */}
              {shop.new_girls_last_15_days && idx === 0 && (
                <div className="absolute top-2 left-2 bg-rose-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-md flex items-center gap-1">
                  <span>🆕</span>
                  <span>{shop.badge_text}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-2">
        <h3 className="font-bold text-gray-900 truncate pr-2">{shop.name}</h3>
        <div className="flex items-start gap-1.5 text-gray-500 text-xs leading-tight h-8 overflow-hidden">
          <MapPin className="w-3 h-3 flex-shrink-0 mt-0.5 text-rose-400" />
          <p className="line-clamp-2">{shop.address}</p>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <a
            href={getSMSLink(shop.phone, shop.address)}
            className="flex-1 bg-rose-500 hover:bg-rose-600 active:bg-rose-700 text-white font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <MessageCircle className="w-4 h-4" />
            <span className="text-sm">Send SMS</span>
          </a>
          <a
            href={`tel:${shop.phone}`}
            className="bg-gray-100 hover:bg-gray-200 p-2.5 rounded-xl text-gray-600 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <Phone className="w-5 h-5" />
          </a>
        </div>
      </div>
    </div>
  );
};

export default ShopCard;