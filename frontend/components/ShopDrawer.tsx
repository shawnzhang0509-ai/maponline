import React, { useState, useEffect } from 'react';
import { Drawer } from 'vaul';
import { Shop } from '../types';
import { TAG_CONFIG } from '../constants';
import { X, MapPin, Phone, Image as ImageIcon, Trash2, Save, Navigation } from 'lucide-react';

interface ShopDrawerProps {
  shop: Shop;
  onClose: () => void;
  onDelete: (shop: Shop) => void;
  onSave: (shop: Shop) => void;
  isLoggedIn: boolean;
  onPreview: (shop: Shop, index: number) => void;
  deleting: boolean;
}

export default function ShopDrawer({ 
  shop, 
  onClose, 
  onDelete, 
  onSave, 
  isLoggedIn, 
  onPreview,
  deleting 
}: ShopDrawerProps) {
  
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Shop>(shop);

  // 当 shop 变化时重置编辑状态和数据
  useEffect(() => {
    setEditData(shop);
    setIsEditing(false);
  }, [shop]);

  const handleSaveClick = () => {
    onSave(editData);
    setIsEditing(false);
  };

  // 提取标签用于显示
  const getDisplayTags = () => {
    const text = shop.badge_text;
    if (!text || !text.trim()) return [];
    let cleanText = text.trim();
    if (cleanText.startsWith('🆕')) cleanText = cleanText.replace('🆕', '').trim();
    if (cleanText.includes(',')) return cleanText.split(',').map(t => t.trim()).filter(Boolean);
    return [cleanText];
  };

  const tags = getDisplayTags();

  return (
    // 🔧 修改 1: 关闭 shouldScaleBackground，防止背景缩放干扰底层布局计算
    <Drawer.Root open={true} onClose={onClose} shouldScaleBackground={false}>
      <Drawer.Portal>
        {/* 遮罩层 */}
        <Drawer.Overlay className="fixed inset-0 bg-black/40 z-40" />
        
        {/* 
           🔧 修改 2: 
           1. 添加 w-full max-w-full 强制占满屏幕宽
           2. 添加 overflow-hidden 防止内部撑开
           3. 添加内联 style 双重保险
        */}
        <Drawer.Content 
          className="fixed bottom-0 left-0 right-0 w-full max-w-full z-50 bg-white rounded-t-[25px] max-h-[85vh] flex flex-col outline-none focus:outline-none overflow-hidden"
          style={{ width: '100%', maxWidth: '100%' }}
        >
          
          {/* 拖动手柄 (用户抓握的地方) */}
          <div className="w-full flex items-center justify-center py-4 bg-gray-50 rounded-t-[25px] cursor-grab active:cursor-grabbing touch-none">
            <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
          </div>

          {/* 内容滚动区 */}
          <div className="flex-1 overflow-y-auto p-6 pb-10">
            
            {/* 头部：标题 + 操作按钮 */}
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1 pr-4">
                {isEditing ? (
                  <input 
                    className="text-2xl font-bold w-full border-b border-gray-300 focus:outline-none focus:border-blue-500 bg-transparent"
                    value={editData.name}
                    onChange={(e) => setEditData({...editData, name: e.target.value})}
                  />
                ) : (
                  <h2 className="text-2xl font-bold text-gray-900">{shop.name}</h2>
                )}
                
                <div className="flex items-center text-gray-500 mt-1 text-sm">
                  <MapPin size={14} className="mr-1" />
                  {shop.address || `${shop.lat.toFixed(4)}, ${shop.lng.toFixed(4)}`}
                </div>
              </div>
              
              <div className="flex gap-2">
                 {isLoggedIn && (
                   <>
                    {!isEditing ? (
                      <button onClick={() => setIsEditing(true)} className="p-2 bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200 transition">
                        <Save size={20} />
                      </button>
                    ) : (
                      <button onClick={handleSaveClick} className="p-2 bg-green-100 text-green-600 rounded-full hover:bg-green-200 transition">
                        <Save size={20} />
                      </button>
                    )}
                    <button 
                      onClick={() => onDelete(shop)} 
                      disabled={deleting}
                      className="p-2 bg-red-100 text-red-600 rounded-full hover:bg-red-200 disabled:opacity-50 transition"
                    >
                      <Trash2 size={20} />
                    </button>
                   </>
                 )}
                 <button onClick={onClose} className="p-2 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition">
                   <X size={20} />
                 </button>
              </div>
            </div>

            {/* 标签展示 */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {tags.map((tag, i) => {
                  const lowerTag = tag.toLowerCase();
                  const config = TAG_CONFIG[lowerTag] || TAG_CONFIG['default'];
                  return (
                    <span key={i} className={`px-3 py-1 text-xs font-bold rounded-full ${config.bg} text-white shadow-sm`}>
                      {config.icon} {config.text || tag}
                    </span>
                  );
                })}
              </div>
            )}

            {/* 图片预览区 */}
            {shop.pictures && shop.pictures.length > 0 ? (
              <div className="mb-6">
                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                  {shop.pictures.map((pic, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => onPreview(shop, idx)}
                      className="flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden cursor-pointer relative group border border-gray-100"
                    >
                      <img src={pic.url} alt="Shop" className="w-full h-full object-cover" loading="lazy" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                      {idx === 0 && <div className="absolute top-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded-md backdrop-blur-sm">Cover</div>}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-32 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 mb-6 border border-dashed border-gray-300">
                <ImageIcon size={32} />
                <span className="ml-2 text-sm">No Images</span>
              </div>
            )}

            {/* 描述/备注 (可编辑) */}
            <div className="mb-6">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Details</h3>
              {isEditing ? (
                <textarea 
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 min-h-[100px] bg-white"
                  value={editData.description || ''}
                  onChange={(e) => setEditData({...editData, description: e.target.value})}
                  placeholder="Add description..."
                />
              ) : (
                <p className="text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-100">
                  {shop.description || "No description available."}
                </p>
              )}
            </div>

            {/* 底部操作按钮 */}
            <div className="grid grid-cols-2 gap-4 mt-8">
              <a 
                href={`https://www.google.com/maps/dir/?api=1&destination=${shop.lat},${shop.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-black text-white py-4 rounded-xl font-bold hover:bg-gray-800 transition shadow-lg"
              >
                <Navigation size={20} /> Navigate
              </a>
              {shop.phone ? (
                <a 
                  href={`tel:${shop.phone}`}
                  className="flex items-center justify-center gap-2 bg-gray-100 text-gray-900 py-4 rounded-xl font-bold hover:bg-gray-200 transition shadow-sm"
                >
                  <Phone size={20} /> Call
                </a>
              ) : (
                <div className="flex items-center justify-center gap-2 bg-gray-50 text-gray-400 py-4 rounded-xl font-bold border border-gray-100 cursor-not-allowed">
                  <Phone size={20} /> No Phone
                </div>
              )}
            </div>
            
            {/* 底部留白，防止内容被遮挡 */}
            <div className="h-10" />
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}