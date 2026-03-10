
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
  // 尝试从 localStorage 读取数据，如果没有则默认为空数组
  const [shops, setShops] = useState<Shop[]>(() => {
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
    return localStorage.getItem("admin_logged_in") === "true";
  });
  const [username, setUsername] = useState<string | null>(
    localStorage.getItem('admin_username')
  );
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [previewShop, setPreviewShop] = useState<Shop | null>(null);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [isSearching, setIsSearching] = useState(false);


  // Save to localStorage whenever shops change
  //useEffect(() => {
    //if (shops.length > 0) {
      //localStorage.setItem(STORAGE_KEY, JSON.stringify(shops));
    //}
  //}, [shops]);

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
    setShops(data);
    if (useNearbyFilter && userLocation) {
      setSelectedShop(data[0] || null);
    }
    //localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error('Search failed:', err);
  } finally {
    setIsSearching(false);
  }
};

  const handleLoginSuccess = (username: string) => {
    setIsLoggedIn(true);
    setUsername(username);
  };

  const handleLogout = () =>  {
    setIsLoggedIn(false);
    setUsername(null);
    localStorage.removeItem("admin_logged_in");
  }
    // ✅ 补上缺失的 handleSelectShop 函数
  const handleSelectShop = (shop: Shop) => {
    setSelectedShop(shop);
  };
  // Request user location
  const requestLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserLocation(loc);
          setUseNearbyFilter(true);
        },
        () => {
          alert("Location access denied. Showing all shops.");
        }
      );
    }
  };

  // Compute filtered shops
  const filteredShops = useMemo(() => {
    if (useNearbyFilter && userLocation) {
      return shops.filter(shop => {
        const dist = calculateDistance(userLocation, { lat: shop.lat, lng: shop.lng });
        return dist <= radiusKm;
      });
    }
    return shops;
  }, [shops, useNearbyFilter, userLocation, radiusKm]);

  // ✅ 补上缺失的 fetchShops 函数
  const fetchShops = async () => {
    // 如果本地已经有数据了，我们通常不需要强制从后端拉取覆盖，除非是首次加载且本地为空
    // 但为了保险，我们只在本地为空时，才尝试用后端数据填充
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && JSON.parse(saved).length > 0) {
      // 本地有数据，优先显示本地的，不请求后端（或者请求了也不覆盖）
      // 这样即使后端挂了或数据旧了，用户看到的也是最新的本地数据
      return; 
    }

    try {
      const response = await fetch(`${API_BASE_URL}/shop/shops`);
      if (!response.ok) throw new Error('Failed to fetch shops');
      const data = await response.json();
      
      // 只有当本地真的没数据时，才存入后端返回的数据
      if (data && data.length > 0) {
        setShops(data);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      }
    } catch (error) {
      console.error('Error fetching shops:', error);
      // 出错就保持现状（空或者本地已有的数据）
    }
  };
  // Initial shop selection
  useEffect(() => {
    if (filteredShops.length > 0 && !selectedShop) {
      setSelectedShop(filteredShops[0]);
    }
  }, [filteredShops]);
   // ✅ 请在这里加上这段代码！
  useEffect(() => {
    fetchShops();
  }, []); 

    // ✅ 修复后的 handleAddShop
    // ✅ 适配后端 form-data 格式的 handleAddShop
  const handleAddShop = async (newShop: Shop) => {
    try {
      // 1. 创建 FormData 对象
      const formData = new FormData();
      
      // 2. 填入文本信息
      formData.append('name', newShop.name);
      formData.append('address', newShop.address);
      formData.append('lat', String(newShop.lat));
      formData.append('lng', String(newShop.lng));
      formData.append('phone', newShop.phone || '');
      
      if (newShop.badge_text) formData.append('badge_text', newShop.badge_text);
      if (newShop.new_girls_last_15_days) formData.append('new_girls_last_15_days', String(newShop.new_girls_last_15_days));

      // 3. 填入图片文件 (如果有)
      if (Array.isArray((newShop as any).imageFiles) && (newShop as any).imageFiles.length > 0) {
        (newShop as any).imageFiles.forEach((file: File) => {
          formData.append('pictures', file); 
        });
      } 

      // 4. 发送请求
      const response = await fetch(`${API_BASE_URL}/shop/add`, {
        method: 'POST',
        body: formData, 
        // 注意：这里不要手动设置 Content-Type，浏览器会自动处理
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '保存失败');
      }

      // 5. 【关键步骤】后端成功后，获取返回的新店铺数据
      const result = await response.json();
      
      // 6. 手动更新前端列表 和 本地存储
      // 我们把新店铺加到当前列表后面
      const updatedShops = [...shops, result];
      setShops(updatedShops);
      
      // 立即保存到 localStorage，防止刷新丢失
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedShops));

      // 7. 清理界面
      setShowAdmin(false);
      setSelectedShop(result);
      alert("✅ 保存成功！数据已写入数据库和本地缓存。");

    } catch (error) {
      console.error('添加店铺失败:', error);
      alert("❌ 保存失败：" + (error as Error).message + "\n(数据仍保留在本地列表中，未丢失)");
    }
  };
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

      // ✅ 关键：前端列表更新
      const newShops = shops.filter(s => s.id !== shop.id);
      setShops(newShops);
      
      // ✅ 关键：同步更新本地存储，防止刷新后“诈尸”
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newShops));

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
            className={`p-3 rounded-full shadow-lg transition-all  $ {userLocation ? 'bg-blue-500 text-white' : 'bg-white text-gray-600'}`}
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
            className={`p-3 rounded-full shadow-lg transition-all  $ {useNearbyFilter ? 'bg-green-500 text-white' : 'bg-white text-gray-600'}`}
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
                // 给每个卡片容器加固定宽度和防压缩属性
                <div key={shop.name} data-shop-name={shop.name} className="w-[280px] flex-shrink-0">
                  <ShopCard
                    shop={shop}
                    isSelected={selectedShop?.name === shop.name}
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