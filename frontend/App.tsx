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
// ⚠️ 注意：如果本地登录失败，请检查 .env 文件中的 VITE_API_BASE_URL
// 或者确认你的本地后端服务是否在 http://localhost:5000 运行
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
  
  // 登录状态初始化
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

  // ✅【核心修复】全局监听 shops 变化，自动保存到 localStorage
  // 修复了之前语法错误导致保存逻辑失效的问题
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(shops));
      console.log('💾 自动保存成功，当前店铺数:', shops.length);
    } catch (e) {
      console.error('保存失败:', e);
    }
  }, [shops]);

  // 2. 搜索功能
  const handleSearch = async (keyword: string) => {
    setIsSearching(true);
    try {
      let url = `${API_BASE_URL}/shop/shops`;
      if (keyword) {
        url += `?keyword=${encodeURIComponent(keyword)}`;
      }

      const res = await fetch(url);
      if (!res.ok) throw new Error('Network response was not ok');

      const data = await res.json();
      setShops(data); // 触发上面的 useEffect 自动保存
      
      if (useNearbyFilter && userLocation && data.length > 0) {
        setSelectedShop(data[0]);
      }
    } catch (err) {
      console.error('Search failed:', err);
      alert("搜索失败，请检查网络连接或后端服务");
    } finally {
      setIsSearching(false);
    }
  };

  // 3. 登录成功回调
  const handleLoginSuccess = (username: string) => {
    setIsLoggedIn(true);
    setUsername(username);
    localStorage.setItem("admin_logged_in", "true");
    localStorage.setItem('admin_username', username);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUsername(null);
    localStorage.removeItem("admin_logged_in");
    localStorage.removeItem('admin_username');
  };

  const handleSelectShop = (shop: Shop) => {
    setSelectedShop(shop);
  };

  // 4. 获取位置
  const requestLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserLocation(loc);
          setUseNearbyFilter(true);
        },
        (err) => {
          console.warn("Location access denied:", err);
          alert("定位被拒绝，将显示所有店铺。");
        }
      );
    } else {
      alert("浏览器不支持定位");
    }
  };

  // 5. 过滤逻辑
  const filteredShops = useMemo(() => {
    if (useNearbyFilter && userLocation) {
      return shops.filter(shop => {
        const dist = calculateDistance(userLocation, { lat: shop.lat, lng: shop.lng });
        return dist <= radiusKm;
      });
    }
    return shops;
  }, [shops, useNearbyFilter, userLocation, radiusKm]);

  // 6. 初始化加载数据
  const fetchShops = async () => {
    const saved = localStorage.getItem(STORAGE_KEY);
    // 如果本地有数据，优先显示本地（加快首屏速度）
    if (saved && JSON.parse(saved).length > 0) {
      // 可选：可以在后台静默更新，这里暂不处理
      return; 
    }

    try {
      const response = await fetch(`${API_BASE_URL}/shop/shops`);
      if (!response.ok) throw new Error('Failed to fetch shops');
      const data = await response.json();
      
      if (data && data.length > 0) {
        setShops(data); // 触发 useEffect 自动保存
      }
    } catch (error) {
      console.error('Error fetching shops:', error);
    }
  };

  useEffect(() => {
    fetchShops();
  }, []);

  // 自动选择第一个店铺
  useEffect(() => {
    if (filteredShops.length > 0 && !selectedShop) {
      setSelectedShop(filteredShops[0]);
    }
  }, [filteredShops]);

    // 7. 添加店铺 (修复版：不再重复发送请求)
  const handleAddShop = (newShop: Shop) => {
    // 🛡️ 检查：如果名字已经存在，直接报错
    const nameExists = shops.some(
      (s) => s.name.trim().toLowerCase() === newShop.name.trim().toLowerCase()
    );

    if (nameExists) {
      alert(`⚠️ 错误：店铺 "${newShop.name}" 已经存在了！\n请换个名字。`);
      return; 
    }

    // ✅ 仅更新本地列表 (AdminPanel 已经负责发送给后端了)
    setShops([...shops, newShop]);
    
    setShowAdmin(false);
    setSelectedShop(newShop);
    
    console.log("✅ 添加成功:", newShop.name);
  };

  // 8. 删除店铺
  const handleDeleteShop = async (shop: Shop) => {
    if (!confirm(`确定要删除 "${shop.name}" 吗？`)) return;
    
    setDeletingId(shop.id);

    try {
      const res = await fetch(`${API_BASE_URL}/shop/del`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: shop.id, 
          token: "my_super_secret_delete_token" 
        }),
      });

      const result = await res.json();
      if (!res.ok || result.error) {
        alert(result.error || "删除失败");
        return;
      }

      // 更新状态 -> 触发全局 useEffect 自动保存
      setShops(prev => prev.filter(s => s.id !== shop.id));

      if (selectedShop?.id === shop.id) setSelectedShop(null);
      
    } catch (err) {
      console.error(err);
      alert("网络错误，删除失败。");
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
        />

        {/* Floating Controls */}
        <div className="absolute top-4 right-4 z-[999] flex flex-col gap-3">
          <button
            onClick={requestLocation}
            className={`p-3 rounded-full shadow-lg transition-all ${userLocation ? 'bg-blue-500 text-white' : 'bg-white text-gray-600'}`}
          >
            <Navigation className="w-6 h-6" />
          </button>

          <button
            onClick={() => {
              if (!isLoggedIn) {
                setShowLogin(true);
              } else {
                setShowAdmin(true);
              }
            }}
            className="p-3 bg-white text-rose-500 rounded-full shadow-lg hover:bg-rose-50 transition-colors"
          >
            <Plus className="w-6 h-6" />
          </button>

          <button
            onClick={() => setUseNearbyFilter(!useNearbyFilter)}
            className={`p-3 rounded-full shadow-lg transition-all ${useNearbyFilter ? 'bg-green-500 text-white' : 'bg-white text-gray-600'}`}
          >
            <Filter className="w-6 h-6" />
          </button>
        </div>

        {/* Proximity Slider */}
        {useNearbyFilter && userLocation && (
          <div className="absolute top-4 left-4 right-20 z-[999]">
            <div className="bg-white/90 backdrop-blur-sm p-3 rounded-2xl shadow-xl flex items-center gap-4">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest min-w-[30px]">Range</span>
              <input
                type="range"
                min="1"
                max="50"
                value={radiusKm}
                onChange={(e) => setRadiusKm(parseInt(e.target.value))}
                className="flex-1 accent-rose-500"
              />
              <span className="text-sm font-bold text-rose-600 whitespace-nowrap">{radiusKm}km</span>
            </div>
          </div>
        )}

        {/* Bottom Horizontal Scrollable Card List */}
        <div 
          className="absolute bottom-0 left-0 right-0 z-[999] bg-transparent shadow-2xl rounded-t-3xl h-[360px] overflow-x-auto"
          ref={scrollContainerRef}
        >
          <div className="p-4 flex gap-4 min-w-max">
            {filteredShops.length > 0 ? (
              filteredShops.map((shop) => (
                <div key={shop.id || shop.name} data-shop-name={shop.name} className="w-[280px] flex-shrink-0">
                  <ShopCard
                    shop={shop}
                    isSelected={selectedShop?.id === shop.id || selectedShop?.name === shop.name}
                    onClick={() => handleSelectShop(shop)}
                    onDelete={handleDeleteShop}
                    onSave={(updatedShop) => {
                      setShops(prev => prev.map(s => s.id === updatedShop.id ? updatedShop : s));
                      if (selectedShop?.id === updatedShop.id) setSelectedShop(updatedShop);
                    }}
                    deleting={deletingId === shop.id}
                    isLoggedIn={isLoggedIn}
                    onPreview={(shop, index) => {
                      setPreviewShop(shop);
                      setPreviewIndex(index);
                    }}
                  />
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500 min-w-full">
                <p>No shops found in this area.</p>
                <button
                  onClick={() => setUseNearbyFilter(false)}
                  className="mt-2 text-rose-500 text-sm font-bold underline"
                >
                  Show all shops
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Modals */}
        {showAdmin && (
          <AdminPanel
            onAddShop={handleAddShop}
            onClose={() => setShowAdmin(false)}
          />
        )}

        {showLogin && (
          <LoginPanel
            onLoginSuccess={(username) => {
              handleLoginSuccess(username);
              setShowLogin(false);
            }}
            onClose={() => setShowLogin(false)}
          />
        )}

        {previewShop && (
          <ImagePreviewModal
            shop={previewShop}
            index={previewIndex}
            onChangeIndex={setPreviewIndex}
            onClose={() => setPreviewShop(null)}
          />
        )}
      </div>
    </div>
  );
};

export default App;