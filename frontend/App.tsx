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

    // ✅ 修改后的 handleSelectShop：点击店铺即设为“中心点”，激活附近筛选
  const handleSelectShop = (shop: Shop) => {
    // 1. 选中该店铺 (用于地图高亮和底部卡片展示)
    setSelectedShop(shop);

    // 2. 【核心技巧】将该店铺的坐标“伪装”成用户当前位置
    // 这样无需调用 navigator.geolocation，直接激活附近筛选逻辑
    const mockUserLocation = { lat: shop.lat, lng: shop.lng };
    setUserLocation(mockUserLocation);

    // 3. 自动开启“附近筛选”模式
    if (!useNearbyFilter) {
      setUseNearbyFilter(true);
    }

    // 4. (可选) 重置默认搜索半径为 5km，体验更好
    setRadiusKm(5);
    
    console.log(`📍 已切换中心点到: ${shop.name} (${shop.lat}, ${shop.lng})，自动开启附近筛选`);
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

  const filteredShops = useMemo(() => {
    if (useNearbyFilter && userLocation) {
      return shops.filter(shop => {
        const dist = calculateDistance(userLocation, { lat: shop.lat, lng: shop.lng });
        return dist <= radiusKm;
      });
    }
    return shops;
  }, [shops, useNearbyFilter, userLocation, radiusKm]);

  // ✅【核心修复】fetchShops 函数 - 已彻底清理重复代码
    // ✅【终极修复】强制优先从网络获取最新数据，不再被旧缓存拦截
  const fetchShops = async () => {
    console.log('🔄 开始加载 (强制网络优先模式)...');
    
    // 1. 无论有没有缓存，先尝试从网络获取最新数据
    try {
      const response = await fetch(`${API_BASE_URL}/shop/shops`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      let data = await response.json();
      console.log('🌐 网络数据获取成功，店铺数量:', data.length);

      // 2. 【关键】即使是网络数据，也执行一次路径修复 (防止后端返回相对路径)
      const fixedData = data.map((shop: any) => ({
        ...shop,
        pictures: shop.pictures?.map((pic: any) => ({
          ...pic,
          // 只要是 /files/ 开头，就补全域名
          url: pic.url && pic.url.startsWith('/files/') 
            ? `${API_BASE_URL}${pic.url}` 
            : pic.url 
        })) || []
      }));

      // 3. 更新状态 -> 这会触发 useEffect 自动保存到 localStorage
      // 这样 localStorage 里的旧坏数据就被新好数据覆盖掉了！
      setShops(fixedData);
      console.log('✅ 数据已更新并自动覆盖本地缓存');

    } catch (error) {
      console.error('❌ 网络请求失败:', error);
      
      // 4. 只有当网络彻底失败时，才降级使用本地缓存
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        console.warn('⚠️ 网络不可用，降级读取本地缓存...');
        try {
          const parsedData = JSON.parse(saved);
          // 缓存数据也要修复一下路径
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
          console.error('💥 本地缓存也损坏了', e);
        }
      } else {
        alert("无法加载数据：网络失败且无本地缓存。");
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
        // ✅ 新增：传递半径数据给地图组件，用于画圆
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
             {/* 👇 新增：清除伪定位按钮 */}
            <button 
              onClick={() => {
                setUserLocation(null);       // 清除位置
                setUseNearbyFilter(false);   // 关闭筛选
                setSelectedShop(null);       // 取消选中店铺
              }}
              className="ml-2 text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 px-2 py-1 rounded-lg font-bold transition"
              title="Reset to global view"
            >
              ✕ Reset
            </button>
          </div>
        )}
        {/* 👇 增加了 style={{ transform: 'translateY(40px)' }} 强行下沉，同时保留 pb-12 防止内容贴底 */}
          <div 
            className="absolute bottom-0 left-0 right-0 z-[999] bg-transparent shadow-2xl rounded-t-3xl h-[360px] overflow-x-auto pb-12" 
            style={{ transform: 'translateY(40px)' }}
            ref={scrollContainerRef}
          >
          <div className="p-4 flex gap-4 min-w-max">
            {filteredShops.length > 0 ? (
              filteredShops.map((shop) => (
                <div key={shop.id || shop.name} className="w-[280px] flex-shrink-0">
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
              <div className="text-center py-8 text-gray-500 min-w-full">No shops found.</div>
            )}
          </div>
        </div>

        {showAdmin && <AdminPanel onAddShop={handleAddShop} onClose={() => setShowAdmin(false)} />}
        {showLogin && <LoginPanel onLoginSuccess={(u) => { handleLoginSuccess(u); setShowLogin(false); }} onClose={() => setShowLogin(false)} />}
        {previewShop && <ImagePreviewModal shop={previewShop} index={previewIndex} onChangeIndex={setPreviewIndex} onClose={() => setPreviewShop(null)} />}
      </div>
    </div>
  );
};

export default App;