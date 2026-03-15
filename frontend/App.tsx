import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Plus, Navigation, Filter } from 'lucide-react';
import Header from './components/Header';
import MapComponent from './components/MapComponent';
import ShopCard from './components/ShopCard';
import AdminPanel from './components/AdminPanel';
import { Shop, UserLocation } from './types';
import { NZ_CENTER } from './constants';
import { calculateDistance } from './utils';
import LoginPanel from './components/LoginPanel';
import ImagePreviewModal from './components/ImagePreviewPanel';

const STORAGE_KEY = 'nz_massage_shops_v1';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

// ✅ 只有一个 App 组件定义
const App: React.FC = () => {
  // 1. 初始化状态
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

  // ✅ 控制滚动暂停的状态 (只定义一次)
  const [isScrollPaused, setIsScrollPaused] = useState(false);

  // 自动保存
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(shops));
      console.log('💾 自动保存成功:', shops.length);
    } catch (e) {
      console.error('保存失败:', e);
    }
  }, [shops]);

  // 搜索
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
    console.log(`📍 已切换中心点到: ${shop.name}`);
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

  // 筛选逻辑
  const filteredShops = useMemo(() => {
    if (useNearbyFilter && userLocation) {
      return shops.filter(shop => {
        const dist = calculateDistance(userLocation, { lat: shop.lat, lng: shop.lng });
        return dist <= radiusKm;
      });
    }
    return shops;
  }, [shops, useNearbyFilter, userLocation, radiusKm]);

  // 获取数据
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
      console.log('✅ 数据已更新');

    } catch (error) {
      console.error('❌ 网络请求失败:', error);
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        console.warn('⚠️ 降级读取本地缓存...');
        try {
          const parsedData = JSON.parse(saved);
          const fixedCachedData = parsedData.map((shop: any) => ({
            ...shop,
            pictures: shop.pictures?.map((pic: any) => ({
              ...pic,
              url: pic.url && pic.url.startsWith('/files/') 
                ? `${API_BASE_URL}${pic.url}` 
                : pic.url 
            })) || []
          }));
          setShops(fixedCachedData);
        } catch (e) {
          console.error('💥 本地缓存损坏', e);
        }
      } else {
        alert("无法加载数据");
      }
    }
  };

  useEffect(() => {
    fetchShops();
  }, []);

  useEffect(() => {
    if (filteredShops.length > 0 && !selectedShop) {
      setSelectedShop(filteredShops[0]);
    }
  }, [filteredShops]);

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

      <div className="flex-1 relative overflow-hidden">
        <MapComponent
          shops={filteredShops}
          center={userLocation || NZ_CENTER}
          selectedShop={selectedShop}
          userLocation={userLocation}
          onMarkerClick={handleSelectShop}
          radiusKm={useNearbyFilter && userLocation ? radiusKm : 0} 
        />

        {/* 右上角按钮 */}
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

        {/* 顶部筛选条 */}
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

        {/* ✅ 终极自包含版本：自动注入 CSS，无需修改 .css 文件 */}
        {/* ✅ 最终完美版：慢速 + 悬停暂停 + 无叠影干扰 */}
      <div 
        className="absolute bottom-0 left-0 right-0 z-[999] bg-gradient-to-t from-black/50 to-transparent pt-10 pb-4 rounded-t-3xl h-[380px] overflow-hidden pointer-events-none"
        // 注意：父容器 pointer-events-none 是为了让地图能点击，但内部我们会重新开启
      >
        <div 
          className="flex gap-4 min-w-max px-4"
          style={{
            // 🐢 关键：速度设为 80 秒一圈，非常慢，消除“飞车”感和叠影的不适感
            animation: 'scroll-injected 80s linear infinite', 
            animationPlayState: 'running',
            willChange: 'transform',
            // 内部元素必须开启指针事件，否则无法点击
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
          // 🖱️ 鼠标移入暂停，移出继续
          onMouseEnter={(e) => { e.currentTarget.style.animationPlayState = 'paused'; }}
          onMouseLeave={(e) => { e.currentTarget.style.animationPlayState = 'running'; }}
        >
          {filteredShops.length > 0 ? (
            // 数据双倍以实现无缝循环
            [...filteredShops, ...filteredShops].map((shop, index) => (
              <div 
                key={`${shop.id}-${index}`} 
                className="w-[300px] flex-shrink-0"
                // 每个卡片独立开启指针事件
                style={{ pointerEvents: 'auto' }}
              >
                <ShopCard
                  shop={shop}
                  isSelected={selectedShop?.id === shop.id}
                  onClick={() => handleSelectShop(shop)}
                  onDelete={handleDeleteShop}
                  onSave={(updated) => {
                    const fresh = { ...updated, pictures: updated.pictures ? [...updated.pictures] : [] };
                    setShops(prev => prev.map(s => s.id === fresh.id ? fresh : s));
                    if (selectedShop?.id === fresh.id) setSelectedShop(fresh);
                  }}
                  deleting={deletingId === shop.id}
                  isLoggedIn={isLoggedIn}
                  onPreview={(s, i) => { setPreviewShop(s); setPreviewIndex(i); }}
                />
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-white font-bold text-shadow">No shops found nearby.</div>
          )}
        </div>
      </div>
        
      </div> {/* 👈 【新增】关闭 flex-1 容器 (Line 283) */}

      {/* ✅ 模态框组件移到最外层，不要放在滚动列表里 */}
            {/* 模态框组件 */}
      {showAdmin && <AdminPanel onAddShop={handleAddShop} onClose={() => setShowAdmin(false)} />}
      {showLogin && <LoginPanel onLoginSuccess={(u) => { handleLoginSuccess(u); setShowLogin(false); }} onClose={() => setShowLogin(false)} />}
      {previewShop && <ImagePreviewModal shop={previewShop} index={previewIndex} onChangeIndex={setPreviewIndex} onClose={() => setPreviewShop(null)} />}
    </div>
  );
};

export default App;