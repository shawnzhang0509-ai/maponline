
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
  const [shops, setShops] = useState<Shop[]>([]);
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
  useEffect(() => {
    if (shops.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(shops));
    }
  }, [shops]);

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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
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
    try {
      const response = await fetch(`${API_BASE_URL}/shop/shops`);
      if (!response.ok) throw new Error('Failed to fetch shops');
      const data = await response.json();
      setShops(data);
    } catch (error) {
      console.error('Error fetching shops:', error);
      // 可选：这里可以加一个 setError("加载店铺失败")
    }
  };
  // Initial shop selection
  useEffect(() => {
    if (filteredShops.length > 0 && !selectedShop) {
      setSelectedShop(filteredShops[0]);
    }
  }, [filteredShops]);

    // ✅ 修复后的 handleAddShop
    // ✅ 适配后端 form-data 格式的 handleAddShop
  const handleAddShop = async (newShop: Shop) => {
    try {
      // 1. 创建 FormData 对象
      const formData = new FormData();
      
      // 2. 将所有文本字段追加到 formData
      // 注意：key 必须和后端 service.add_shop 期待的字段名一致
      formData.append('name', newShop.name);
      formData.append('address', newShop.address);
      formData.append('lat', String(newShop.lat)); // 转为字符串
      formData.append('lng', String(newShop.lng));
      formData.append('phone', newShop.phone || '');
      
      // 如果有其他字段 (如 badge_text)，也在这里加上
      if (newShop.badge_text) formData.append('badge_text', newShop.badge_text);
      if (newShop.new_girls_last_15_days) formData.append('new_girls_last_15_days', String(newShop.new_girls_last_15_days));

      // 3. 处理图片 (关键步骤)
      // 假设 newShop.images 或 newShop.pictures 是一个 File[] (文件对象数组) 或者 string[] (URL)
      // 情况 A: 如果是用户选择的本地文件 (File 对象)
      if (Array.isArray((newShop as any).imageFiles) && (newShop as any).imageFiles.length > 0) {
        (newShop as any).imageFiles.forEach((file: File) => {
          formData.append('pictures', file); // 后端用的是 'pictures'
        });
      } 
      // 情况 B: 如果只是图片 URL 字符串，后端可能不需要 files，或者需要特殊处理
      // 如果后端 service.add_shop 能处理 URL 字符串，这里可以不用 append files
      // 但如果后端强制期待 files，而前端只传了 URL，可能会存不了图。
      // ⚠️ 暂时先假设你的 AdminPanel 传过来的是包含 File 对象的，或者后端能兼容空 files。

      // 4. 发送请求
      // ⚠️ 注意：使用 FormData 时，千万不要手动设置 'Content-Type': 'application/json'
      // 浏览器会自动设置为 'multipart/form-data; boundary=...'
      const response = await fetch(`${API_BASE_URL}/shop/add`, {
        method: 'POST',
        body: formData, 
        // headers: { ... } <--- ❌ 删掉 headers，让浏览器自动处理
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '保存失败');
      }

      const result = await response.json();
      
      // 5. 成功后刷新列表
      setShops(prev => [...prev, result]);

      setShowAdmin(false);
      setSelectedShop(result);
      alert("✅ 保存成功！数据已写入数据库。");

    } catch (error) {
      console.error('添加店铺失败:', error);
      alert("❌ 保存失败：" + (error as Error).message);
    }
  };
  const handleDeleteShop = async (shop: Shop) => {
  setDeletingId(shop.id);

  try {
    // ✅ 改成动态 API_BASE_URL + 正确路径
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
      alert(result.error || "Failed to delete shop");
      return;
    }

    setShops(prev => prev.filter(s => s.id !== shop.id));
    if (selectedShop?.id === shop.id) setSelectedShop(null);
  } catch (err) {
    console.error(err);
    alert("Network error, please try again.");
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
                <div key={shop.name} data-shop-name={shop.name}>
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