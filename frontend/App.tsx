import React, { useState, useEffect, useRef, useMemo } from 'react';
import Header from './components/Header';
import MapComponent from './components/MapComponent';
import ShopCard from './components/ShopCard';
import AdminPanel from './components/AdminPanel';
import { Shop, UserLocation } from './types';
import { NZ_CENTER, TAG_CONFIG } from './constants';
import { calculateDistance } from './utils';
import LoginPanel from './components/LoginPanel';
import ImagePreviewModal from './components/ImagePreviewPanel';
import { Plus, Navigation, Filter, X } from 'lucide-react';

const STORAGE_KEY = 'nz_massage_shops_v1';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const App: React.FC = () => {
  // ==========================================
  // 1. State 定义
  // ==========================================
  const [shops, setShops] = useState<Shop[]>(() => {
    if (typeof window === 'undefined') return [];
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [showAdmin, setShowAdmin] = useState(false);
  const [useNearbyFilter, setUseNearbyFilter] = useState(false);
  const [radiusKm, setRadiusKm] = useState(10);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem("admin_logged_in") === "true";
  });
  
  const [username, setUsername] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('admin_username');
  });

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [previewShop, setPreviewShop] = useState<Shop | null>(null);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [isScrollPaused, setIsScrollPaused] = useState(false);

  // Tag 筛选状态
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // ==========================================
  // 2. 核心逻辑：完全模拟 ShopCard 的显示逻辑
  // ==========================================
  
    /**
   * ✅ 新版标签提取逻辑
   * 规则：只要有 badge_text 且不为空，就提取标签。
   * 完全忽略 new_girls_last_15_days 字段。
   * 支持逗号分隔： "Thai, New" -> ["Thai", "New"]
   */
  const getShopTags = (shop: any): string[] => {
    const text = shop.badge_text;
    
    // 如果没有文字，直接返回空数组（无论开关是什么）
    if (!text || typeof text !== 'string' || text.trim() === '') {
      return [];
    }

    let cleanText = text.trim();
    
    // 可选：如果你还想自动去掉开头的 "🆕 " 或 "New " 这种冗余前缀，保留这里
    // 如果不想处理，可以直接注释掉下面这几行，原样显示
    if (cleanText.startsWith('🆕')) {
      cleanText = cleanText.replace('🆕', '').trim();
    }
    // 注意：这里不再强制去掉 "New" 单词，因为 "New" 本身可能就是一个有效标签

    // 按逗号分割，清理空格，过滤空项
    if (cleanText.includes(',')) {
      return cleanText.split(',').map(t => t.trim()).filter(Boolean);
    }

    return [cleanText];
  };

  // ==========================================
  // 3. Memo: 提取 Tags 和 筛选逻辑
  // ==========================================

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    shops.forEach(shop => {
      const tags = getShopTags(shop);
      tags.forEach(tag => tagSet.add(tag));
    });
    const result = Array.from(tagSet).sort();
    // 调试日志：确认提取到了什么
    if (result.length > 0) {
      console.log('🏷️ [TAGS] 提取到的有效标签:', result);
    }
    return result;
  }, [shops]);

  const filteredShops = useMemo(() => {
    let result = shops;

    // 1. 距离筛选
    if (useNearbyFilter && userLocation) {
      result = result.filter(shop => {
        const dist = calculateDistance(userLocation, { lat: shop.lat, lng: shop.lng });
        return dist <= radiusKm;
      });
    }

    // 找到这部分代码并替换
    if (selectedTag) {
      const beforeCount = result.length;
      const targetTag = selectedTag.toLowerCase(); // <--- 新增
      
      result = result.filter(shop => {
        const shopTags = getShopTags(shop);
        // 使用 some + toLowerCase 确保匹配
        return shopTags.some(tag => tag.toLowerCase() === targetTag); 
      });
      console.log(`✅ [FILTER] 选中 "${selectedTag}": ${beforeCount} -> ${result.length}`);
    }

    return result;
  }, [shops, useNearbyFilter, userLocation, radiusKm, selectedTag]);

  // ==========================================
  // 4. 普通函数
  // ==========================================

  const fetchShops = async () => {
    console.log('🔄 开始加载...');
    try {
      const response = await fetch(`${API_BASE_URL}/shop/shops`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      let data = await response.json();
      const fixedData = data.map((shop: any) => ({
        ...shop,
        pictures: shop.pictures?.map((pic: any) => ({
          ...pic,
          url: pic.url && pic.url.startsWith('/files/') 
            ? `${API_BASE_URL}${pic.url}` 
            : pic.url 
        })) || []
      }));

      setShops(fixedData);
      console.log('✅ 数据已更新，总数:', fixedData.length);
      
      // 调试：打印第一个有标签的店铺数据结构
      const sampleWithTag = fixedData.find(s => s.new_girls_last_15_days && s.badge_text);
      if (sampleWithTag) {
        console.log('🔍 [DEBUG] 样本数据 (有标签):', {
          name: sampleWithTag.name,
          new_girls_last_15_days: sampleWithTag.new_girls_last_15_days,
          badge_text: sampleWithTag.badge_text,
          extracted: getShopTags(sampleWithTag)
        });
      }

    } catch (error) {
      console.error('❌ 网络请求失败:', error);
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        console.warn('⚠️ 降级读取本地缓存...');
        try {
          const parsedData = JSON.parse(saved);
          setShops(parsedData);
        } catch (e) {
          console.error('💥 本地缓存损坏', e);
        }
      } else {
        alert("无法加载数据");
      }
    }
  };

  const handleSearch = async (keyword: string) => {
    setIsSearching(true);
    try {
      let url = `${API_BASE_URL}/shop/shops`;
      if (keyword) url += `?keyword=${encodeURIComponent(keyword)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Network response was not ok');
      const data = await res.json();
      setShops(data);
      if (useNearbyFilter && userLocation && data.length > 0) setSelectedShop(data[0]);
    } catch (err) {
      console.error('Search failed:', err);
      alert("搜索失败");
    } finally {
      setIsSearching(false);
    }
  };

  const handleLoginSuccess = (u: string) => {
    setIsLoggedIn(true);
    setUsername(u);
    localStorage.setItem("admin_logged_in", "true");
    localStorage.setItem('admin_username', u);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUsername(null);
    localStorage.removeItem("admin_logged_in");
    localStorage.removeItem('admin_username');
  };

  const handleSelectShop = (shop: Shop) => {
    setSelectedShop(shop);
    const mockUserLocation = { lat: shop.lat, lng: shop.lng };
    setUserLocation(mockUserLocation);
    if (!useNearbyFilter) {
      setUseNearbyFilter(true);
    }
    setRadiusKm(5);
  };

  const requestLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setUseNearbyFilter(true);
        },
        () => alert("定位被拒绝")
      );
    } else {
      alert("浏览器不支持定位");
    }
  };

  const handleAddShop = (newShop: Shop) => {
    if (shops.some(s => s.name.trim().toLowerCase() === newShop.name.trim().toLowerCase())) {
      alert(`店铺 "${newShop.name}" 已存在`);
      return;
    }
    setShops([...shops, newShop]);
    setShowAdmin(false);
    setSelectedShop(newShop);
  };

  const handleDeleteShop = async (shop: Shop) => {
    if (!confirm(`删除 "${shop.name}"?`)) return;
    setDeletingId(shop.id);
    try {
      const res = await fetch(`${API_BASE_URL}/shop/del`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: shop.id, token: "my_super_secret_delete_token" }),
      });
      const result = await res.json();
      if (!res.ok || result.error) {
        alert(result.error || "删除失败");
        return;
      }
      setShops(prev => prev.filter(s => s.id !== shop.id));
      if (selectedShop?.id === shop.id) setSelectedShop(null);
    } catch (err) {
      console.error(err);
      alert("网络错误");
    } finally {
      setDeletingId(null);
    }
  };

  // ==========================================
  // 5. Effects
  // ==========================================

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(shops));
    } catch (e) {
      console.error('保存失败:', e);
    }
  }, [shops]);

  useEffect(() => {
    fetchShops();
  }, []);

  useEffect(() => {
    if (filteredShops.length > 0 && !selectedShop) {
      setSelectedShop(filteredShops[0]);
    }
  }, [filteredShops]);

  // ==========================================
  // 6. JSX Render
  // ==========================================
  return (
    <div className="relative h-screen w-full bg-gray-50 flex flex-col overflow-hidden">
      <Header
        isLoggedIn={isLoggedIn}
        username={username}
        onLogin={() => setShowLogin(true)}
        onLogout={handleLogout}
        onSearch={handleSearch}
        isSearching={isSearching}
      />

            {/* ✅ Tag 筛选栏 (使用 && 而不是 ? :) */}
      {allTags.length > 0 && (
        <div className="absolute top-[70px] left-0 right-0 z-[998] px-4 pointer-events-none bg-white/90 backdrop-blur-sm border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto flex items-center gap-2 overflow-x-auto no-scrollbar py-3 pointer-events-auto">
            <span className="text-xs font-bold text-gray-400 mr-2 uppercase tracking-wider whitespace-nowrap">Badges:</span>
            
            {selectedTag && (
              <button
                onClick={() => setSelectedTag(null)}
                className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 bg-gray-800 text-white text-xs font-bold rounded-full hover:bg-gray-700 transition-colors shadow-md"
              >
                Clear <X size={12} />
              </button>
            )}

            {allTags.map((tag) => {
              const lowerTag = tag.toLowerCase();
              const config = TAG_CONFIG[lowerTag] || TAG_CONFIG['default'];
              const displayText = config.text || (tag.charAt(0).toUpperCase() + tag.slice(1));

              return (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                  className={`
                    flex-shrink-0 inline-flex items-center gap-1.5
                    px-3 py-1.5 text-xs font-black tracking-wide rounded-full 
                    transition-all shadow-md border whitespace-nowrap hover:scale-105
                    ${selectedTag === tag 
                      ? 'ring-2 ring-offset-1 ring-gray-400 brightness-90' 
                      : 'hover:brightness-110'} 
                    ${config.bg}
                  `}
                >
                  {config.icon && (
                    <span className="text-sm leading-none filter drop-shadow-sm">
                      {config.icon}
                    </span>
                  )}
                  <span>{displayText}</span>
                </button>
              );
            })}
          </div> 
        </div> 
      )} {/* ✅ 这里只关闭 && 的括号 */}

      {/* 地图区域 (始终渲染) */}
      <div className="flex-1 relative overflow-hidden">
        <MapComponent
          shops={filteredShops}
          center={userLocation || NZ_CENTER}
          selectedShop={selectedShop}
          userLocation={userLocation}
          onMarkerClick={handleSelectShop}
          radiusKm={useNearbyFilter && userLocation ? radiusKm : 0} 
        />

        <div className="absolute top-4 right-4 z-[999] flex flex-col gap-3">
          <button onClick={requestLocation} className={`p-3 rounded-full shadow-lg ${userLocation ? 'bg-blue-500 text-white' : 'bg-white'}`}>
            <Navigation className="w-6 h-6" />
          </button>
          <button onClick={() => isLoggedIn ? setShowAdmin(true) : setShowLogin(true)} className="p-3 bg-white text-rose-500 rounded-full shadow-lg">
            <Plus className="w-6 h-6" />
          </button>
          <button onClick={() => setUseNearbyFilter(!useNearbyFilter)} className={`p-3 rounded-full shadow-lg ${useNearbyFilter ? 'bg-green-500 text-white' : 'bg-white'}`}>
            <Filter className="w-6 h-6" />
          </button>
        </div>

        {useNearbyFilter && userLocation && (
          <div className="absolute top-4 left-4 right-20 z-[999] bg-white/90 backdrop-blur-sm p-3 rounded-2xl shadow-xl flex items-center gap-4">
            <span className="text-xs font-bold text-gray-400">Range</span>
            <input type="range" min="1" max="20" value={radiusKm} onChange={(e) => setRadiusKm(parseInt(e.target.value))} className="flex-1 accent-rose-500" />
            <span className="text-sm font-bold text-rose-600">{radiusKm}km</span>
            <button 
              onClick={() => {
                setUserLocation(null);
                setUseNearbyFilter(false);
                setSelectedShop(null);
              }}
              className="ml-2 text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 px-2 py-1 rounded-lg font-bold transition"
            >
              ✕ Reset
            </button>
          </div>
        )}

        <div 
          className="absolute bottom-0 left-0 right-0 z-[999] bg-gradient-to-t from-black/50 to-transparent pt-10 pb-4 rounded-t-3xl h-[380px] overflow-hidden pointer-events-none"
        >
          <div 
            className="flex gap-4 min-w-max px-4"
            style={{
              animation: 'scroll-injected 80s linear infinite', 
              animationPlayState: 'running',
              willChange: 'transform',
              pointerEvents: 'auto' 
            }}
            ref={(node) => {
              if (node && !document.getElementById('injected-scroll-styles')) {
                const style = document.createElement('style');
                style.id = 'injected-scroll-styles';
                style.innerHTML = `
                  @keyframes scroll-injected {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                  }
                `;
                document.head.appendChild(style);
              }
            }}
            onMouseEnter={(e) => { e.currentTarget.style.animationPlayState = 'paused'; }}
            onMouseLeave={(e) => { e.currentTarget.style.animationPlayState = 'running'; }}
          >
            {filteredShops.length > 0 ? (
              [...filteredShops, ...filteredShops].map((shop, index) => (
                <div 
                  key={`${shop.id}-${index}`} 
                  className="w-[260px] flex-shrink-0"
                  style={{ pointerEvents: 'auto' }}
                >
                  <ShopCard
                    shop={shop}
                    isSelected={selectedShop?.id === shop.id}
                    onClick={() => handleSelectShop(shop)}
                    onDelete={handleDeleteShop}
                    onSave={(updated) => {
                      // 🔍 调试：打印接收到的数据
                      console.log('💾 App.tsx 收到更新:', updated);

                      // 🛡️ 防御性处理：确保关键标签字段不丢失
                      // 如果后端返回的数据里 missing 了这些字段，我们保留原店铺的值（或者强制使用 updated 里的值）
                      // 这里我们假设 updated 来自 ShopCard 的 handleSave，应该是最新的
                      
                      const safeUpdated = {
                        ...updated,
                        // 确保图片数组是新的引用，防止 React 不重新渲染
                        pictures: updated.pictures ? [...updated.pictures] : [],
                        // 🔥 关键：显式确保这两个字段存在且类型正确
                        new_girls_last_15_days: !!updated.new_girls_last_15_days, 
                        badge_text: updated.badge_text || (updated.new_girls_last_15_days ? 'New' : '')
                      };

                      console.log('🛡️ 处理后的安全数据:', safeUpdated);

                      setShops(prev => {
                        const newShops = prev.map(s => s.id === safeUpdated.id ? safeUpdated : s);
                        console.log('✅ 状态已更新，新数组长度:', newShops.length);
                        return newShops;
                      });

                      // 同步更新选中的店铺，防止详情面板显示旧数据
                      if (selectedShop?.id === safeUpdated.id) {
                        setSelectedShop(safeUpdated);
                      }
                    }}
                    deleting={deletingId === shop.id}
                    isLoggedIn={isLoggedIn}
                    onPreview={(s, i) => { setPreviewShop(s); setPreviewIndex(i); }}
                  />
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-white font-bold text-shadow bg-black/20 rounded-lg mx-4 backdrop-blur-sm">
                {selectedTag 
                  ? `😕 没有店铺包含标签 "${selectedTag}"` 
                  : "No shops found nearby."}
              </div>
            )}
          </div>
        </div>
        
      </div>

      {showAdmin && <AdminPanel onAddShop={handleAddShop} onClose={() => setShowAdmin(false)} />}
      {showLogin && <LoginPanel onLoginSuccess={(u) => { handleLoginSuccess(u); setShowLogin(false); }} onClose={() => setShowLogin(false)} />}
      {previewShop && <ImagePreviewModal shop={previewShop} index={previewIndex} onChangeIndex={setPreviewIndex} onClose={() => setPreviewShop(null)} />}
    </div>
  );
};

export default App;