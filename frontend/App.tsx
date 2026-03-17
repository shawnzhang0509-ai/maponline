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
import { Plus, Navigation, Filter, X, ChevronUp, ChevronDown, MapPin } from 'lucide-react';

const STORAGE_KEY = 'nz_massage_shops_v1';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const COLLAPSED_HEIGHT = 80; 
const EXPANDED_HEIGHT = 380; 
const CLICK_THRESHOLD = 5; 
const AUTO_SCROLL_SPEED = 0.8; // 滚动速度
const RESUME_DELAY = 2500; // 停止后多久恢复自动滚动

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

  const [previewShop, setPreviewShop] = useState<Shop | null>(null);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const [drawerHeight, setDrawerHeight] = useState(COLLAPSED_HEIGHT);
  const isExpanded = drawerHeight > COLLAPSED_HEIGHT + 50;

  // ==========================================
  // 2. 核心逻辑：标签提取
  // ==========================================
  const getShopTags = (shop: any): string[] => {
    const text = shop.badge_text;
    if (!text || typeof text !== 'string' || text.trim() === '') return [];
    let cleanText = text.trim();
    if (cleanText.startsWith('🆕')) cleanText = cleanText.replace('🆕', '').trim();
    if (cleanText.includes(',')) return cleanText.split(',').map(t => t.trim()).filter(Boolean);
    return [cleanText];
  };

  // ==========================================
  // 3. Memo: 筛选 & 排序
  // ==========================================
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    shops.forEach(shop => {
      getShopTags(shop).forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [shops]);

  const filteredShops = useMemo(() => {
    let result = [...shops];
    
    if (useNearbyFilter && userLocation) {
      result = result.filter(shop => {
        const dist = calculateDistance(userLocation, { lat: shop.lat, lng: shop.lng });
        return dist <= radiusKm;
      });
    }

    if (selectedTag) {
      const targetTag = selectedTag.toLowerCase();
      result = result.filter(shop => {
        return getShopTags(shop).some(tag => tag.toLowerCase() === targetTag); 
      });
    }

    // 排序：有定位则按距离，否则保持原序
    if (userLocation) {
      result.sort((a, b) => {
        const distA = calculateDistance(userLocation, { lat: a.lat, lng: a.lng });
        const distB = calculateDistance(userLocation, { lat: b.lat, lng: b.lng });
        return distA - distB;
      });
    }

    // 选中置顶
    if (selectedShop) {
      const others = result.filter(s => s.id !== selectedShop.id);
      result = [selectedShop, ...others];
    }

    return result;
  }, [shops, useNearbyFilter, userLocation, radiusKm, selectedTag, selectedShop]);

  // ==========================================
  // 4. 🚀 智能自动滚动逻辑 (核心修改)
  // ==========================================
  const scrollRef = useRef<HTMLDivElement>(null);
  const isDraggingList = useRef(false);
  const startX = useRef(0);
  const currentTranslateX = useRef(0); 
  const dragStartX = useRef(0); 
  
  const animationFrameId = useRef<number | null>(null);
  const resumeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isPausedByUser = useRef(false); // 用户是否手动暂停了

  // 开始自动滚动
  const startAutoScroll = () => {
    if (animationFrameId.current || !isExpanded || isPausedByUser.current) return;
    
    // 如果选中了店铺，不自动滚动，让用户安静看
    if (selectedShop) return;

    const run = () => {
      const container = scrollRef.current;
      if (!container) {
        animationFrameId.current = requestAnimationFrame(run);
        return;
      }

      const cardWidth = 260 + 16; // 260px width + 16px margin
      const totalContentWidth = filteredShops.length * cardWidth;
      const viewportWidth = window.innerWidth - 32; // px-4 * 2

      // 如果内容不够宽，不需要滚动（或者你可以强制让它滚，这里设为不滚）
      // 但为了效果，即使只有1个，我们也让它滚：总宽度 = 内容宽度 + 视口宽度 (制造空隙)
      // 这里的逻辑是：我们复制了一份数据在下面渲染吗？不，我们靠 translateX 走到负值再跳回 0
      
      // 为了实现“从另一端滚出来”，我们需要逻辑上的“双倍长度”或者“循环跳跃”
      // 简单做法：当 translateX 小于 -(totalContentWidth) 时，瞬间跳回 0
      // 但为了让它看起来是连续的，通常需要在 DOM 里放两份数据。
      // 👇 既然你要求店铺少也要滚，那我们在渲染层做手脚（见 JSX 部分），这里只负责移动
      
      currentTranslateX.current -= AUTO_SCROLL_SPEED;

      // 临界点判断：当滚动距离超过一份内容的总宽度时，重置为 0
      // 注意：这里假设 JSX 里渲染了两份数据 [...filteredShops, ...filteredShops]
      // 这样总长度就是 totalContentWidth * 2
      // 当滚动到 totalContentWidth 时，瞬间跳回 0，视觉上无缝衔接
      if (Math.abs(currentTranslateX.current) >= totalContentWidth) {
        currentTranslateX.current = 0;
      }

      container.style.transform = `translateX(${currentTranslateX.current}px)`;
      animationFrameId.current = requestAnimationFrame(run);
    };

    animationFrameId.current = requestAnimationFrame(run);
  };

  const stopAutoScroll = () => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
  };

  const scheduleResume = () => {
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = setTimeout(() => {
      if (!isDraggingList.current && isExpanded && !selectedShop) {
        isPausedByUser.current = false;
        startAutoScroll();
      }
    }, RESUME_DELAY);
  };

  // 监听数据变化和展开状态，自动启停
  useEffect(() => {
    stopAutoScroll();
    if (isExpanded && filteredShops.length > 0 && !selectedShop && !isPausedByUser.current) {
      const timer = setTimeout(() => {
        startAutoScroll();
      }, 500);
      return () => clearTimeout(timer);
    }
    return () => {
      stopAutoScroll();
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    };
  }, [isExpanded, filteredShops.length, selectedShop]); // 依赖项变化时重启

  // --- 列表拖拽事件 ---
  const handleListDragStart = (clientX: number) => {
    isDraggingList.current = true;
    isPausedByUser.current = true; // 用户动手了，标记为暂停
    startX.current = clientX;
    dragStartX.current = clientX;
    
    if (scrollRef.current) {
      scrollRef.current.style.cursor = 'grabbing';
      scrollRef.current.style.transition = 'none';
    }
    stopAutoScroll();
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);

    window.addEventListener('mousemove', handleListMouseMove);
    window.addEventListener('mouseup', handleListMouseUp);
    window.addEventListener('touchmove', handleListTouchMove, { passive: false }); 
    window.addEventListener('touchend', handleListMouseUp);
  };

  const handleListMouseMove = (e: MouseEvent) => {
    if (!isDraggingList.current || !scrollRef.current) return;
    const walk = e.clientX - startX.current;
    currentTranslateX.current += walk;
    scrollRef.current.style.transform = `translateX(${currentTranslateX.current}px)`;
    startX.current = e.clientX; 
  };

  const handleListTouchMove = (e: TouchEvent) => {
    if (!isDraggingList.current || !scrollRef.current) return;
    const walk = e.touches[0].clientX - startX.current;
    currentTranslateX.current += walk;
    scrollRef.current.style.transform = `translateX(${currentTranslateX.current}px)`;
    startX.current = e.touches[0].clientX;
  };

  const handleListMouseUp = () => {
    if (!isDraggingList.current) return;
    isDraggingList.current = false;
    
    if (scrollRef.current) {
      scrollRef.current.style.cursor = 'grab';
      scrollRef.current.style.transition = 'transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)';
      
      // 可选：边界修正，防止滚到空白处太多
      const cardWidth = 260 + 16;
      const totalContentWidth = filteredShops.length * cardWidth;
      
      // 如果滚出了左边界太远，修正一下（简单的回弹逻辑，非必须）
      // 这里为了保持循环流畅，不做硬性限制，靠自动滚动复位
    }
    
    window.removeEventListener('mousemove', handleListMouseMove);
    window.removeEventListener('mouseup', handleListMouseUp);
    window.removeEventListener('touchmove', handleListTouchMove);
    window.removeEventListener('touchend', handleListMouseUp);

    // 用户松手后，延迟恢复自动滚动
    scheduleResume();
  };

  const handleCardClick = (shop: Shop, currentEventClientX: number) => {
    const distance = Math.abs(currentEventClientX - dragStartX.current);
    if (distance > CLICK_THRESHOLD) return;
    handleSelectShop(shop);
  };

  // ==========================================
  // 5. 📱 抽屉上下滑动逻辑
  // ==========================================
  const drawerRef = useRef<HTMLDivElement>(null);
  const isDraggingDrawer = useRef(false);
  const startY = useRef(0);
  const startHeight = useRef(0);

  const handleDrawerTouchStart = (e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('.no-drag')) return;
    isDraggingDrawer.current = true;
    startY.current = e.touches[0].clientY;
    startHeight.current = drawerHeight;
    stopAutoScroll();
  };

  const handleDrawerTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingDrawer.current) return;
    const deltaY = startY.current - e.touches[0].clientY;
    let newHeight = startHeight.current + deltaY;
    if (newHeight < COLLAPSED_HEIGHT) newHeight = COLLAPSED_HEIGHT;
    if (newHeight > EXPANDED_HEIGHT) newHeight = EXPANDED_HEIGHT;
    setDrawerHeight(newHeight);
  };

  const handleDrawerTouchEnd = () => {
    if (!isDraggingDrawer.current) return;
    isDraggingDrawer.current = false;
    const threshold = (COLLAPSED_HEIGHT + EXPANDED_HEIGHT) / 2;
    const willExpand = drawerHeight > threshold;
    setDrawerHeight(willExpand ? EXPANDED_HEIGHT : COLLAPSED_HEIGHT);
    
    if (willExpand && !selectedShop) {
      resumeTimerRef.current = setTimeout(() => {
        if (!isDraggingList.current) startAutoScroll();
      }, 500);
    } else {
      stopAutoScroll();
    }
  };

  const handleDrawerMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('.no-drag')) return;
    isDraggingDrawer.current = true;
    startY.current = e.clientY;
    startHeight.current = drawerHeight;
    stopAutoScroll();
    window.addEventListener('mousemove', handleDrawerMouseMove);
    window.addEventListener('mouseup', handleDrawerMouseUp);
  };

  const handleDrawerMouseMove = (e: MouseEvent) => {
    if (!isDraggingDrawer.current) return;
    const deltaY = startY.current - e.clientY;
    let newHeight = startHeight.current + deltaY;
    if (newHeight < COLLAPSED_HEIGHT) newHeight = COLLAPSED_HEIGHT;
    if (newHeight > EXPANDED_HEIGHT) newHeight = EXPANDED_HEIGHT;
    setDrawerHeight(newHeight);
  };

  const handleDrawerMouseUp = () => {
    isDraggingDrawer.current = false;
    window.removeEventListener('mousemove', handleDrawerMouseMove);
    window.removeEventListener('mouseup', handleDrawerMouseUp);
    const threshold = (COLLAPSED_HEIGHT + EXPANDED_HEIGHT) / 2;
    const willExpand = drawerHeight > threshold;
    setDrawerHeight(willExpand ? EXPANDED_HEIGHT : COLLAPSED_HEIGHT);
    if (willExpand && !selectedShop) {
       resumeTimerRef.current = setTimeout(() => { if (!isDraggingList.current) startAutoScroll(); }, 500);
    } else {
      stopAutoScroll();
    }
  };

  const toggleDrawer = () => {
    const willExpand = !isExpanded;
    setDrawerHeight(willExpand ? EXPANDED_HEIGHT : COLLAPSED_HEIGHT);
    if (willExpand && !selectedShop) {
      resumeTimerRef.current = setTimeout(() => { if (!isDraggingList.current) startAutoScroll(); }, 500);
    } else {
      stopAutoScroll();
    }
  };

  // ==========================================
  // 6. 业务函数
  // ==========================================
  const fetchShops = async () => {
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
    } catch (error) {
      console.error('❌ 加载失败:', error);
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setShops(JSON.parse(saved));
    }
  };

  const handleSearch = async (keyword: string) => {
    setIsSearching(true);
    try {
      let url = `${API_BASE_URL}/shop/shops`;
      if (keyword) url += `?keyword=${encodeURIComponent(keyword)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Network response was not ok');
      setShops(await res.json());
    } catch (err) { alert("搜索失败"); } 
    finally { setIsSearching(false); }
  };

  const handleLoginSuccess = (u: string) => {
    setIsLoggedIn(true); setUsername(u);
    localStorage.setItem("admin_logged_in", "true");
    localStorage.setItem('admin_username', u);
  };
  const handleLogout = () => {
    setIsLoggedIn(false); setUsername(null);
    localStorage.removeItem("admin_logged_in");
    localStorage.removeItem('admin_username');
  };

  const handleSelectShop = (shop: Shop) => {
    if (isDraggingList.current || isDraggingDrawer.current) return;
    
    setSelectedShop(shop);
    setUserLocation({ lat: shop.lat, lng: shop.lng });
    if (!useNearbyFilter) setUseNearbyFilter(true);
    setRadiusKm(5);
    
    // 选中店铺后，停止自动滚动，并展开抽屉
    stopAutoScroll();
    if (!isExpanded) setDrawerHeight(EXPANDED_HEIGHT);
  };

  const requestLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          alert("定位成功！列表将按距离排序。");
        },
        () => alert("定位被拒绝")
      );
    } else { alert("浏览器不支持定位"); }
  };

  const handleAddShop = (newShop: Shop) => {
    if (shops.some(s => s.name.trim().toLowerCase() === newShop.name.trim().toLowerCase())) {
      alert(`店铺 "${newShop.name}" 已存在`); return;
    }
    setShops([...shops, newShop]); setShowAdmin(false); setSelectedShop(newShop);
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
      if (!res.ok || result.error) { alert(result.error || "删除失败"); return; }
      setShops(prev => prev.filter(s => s.id !== shop.id));
      if (selectedShop?.id === shop.id) setSelectedShop(null);
    } catch (err) { console.error(err); alert("网络错误"); } 
    finally { setDeletingId(null); }
  };

  useEffect(() => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(shops)); } catch (e) {} }, [shops]);
  useEffect(() => { fetchShops(); }, []);
  // 初始自动选中第一个（可选，如果不想自动选中可注释掉，这样更能触发自动滚动）
  // useEffect(() => { if (filteredShops.length > 0 && !selectedShop) setSelectedShop(filteredShops[0]); }, [filteredShops]);


  // ==========================================
  // 7. JSX Render
  // ==========================================
  return (
    <div className="relative h-screen w-full bg-gray-50 flex flex-col overflow-hidden">
      
      <Header isLoggedIn={isLoggedIn} username={username} onLogin={() => setShowLogin(true)} onLogout={handleLogout} onSearch={handleSearch} isSearching={isSearching} />

      {allTags.length > 0 && (
        <div className="absolute top-[70px] left-0 right-0 z-[998] px-4 pointer-events-none bg-white/90 backdrop-blur-sm border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto flex items-center gap-2 overflow-x-auto no-scrollbar py-3 pointer-events-auto">
            <span className="text-xs font-bold text-gray-400 mr-2 uppercase tracking-wider whitespace-nowrap">Badges:</span>
            {selectedTag && <button onClick={() => setSelectedTag(null)} className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 bg-gray-800 text-white text-xs font-bold rounded-full hover:bg-gray-700 transition-colors shadow-md">Clear <X size={12} /></button>}
            {allTags.map((tag) => {
              const lowerTag = tag.toLowerCase();
              const config = TAG_CONFIG[lowerTag] || TAG_CONFIG['default'];
              const displayText = config.text || (tag.charAt(0).toUpperCase() + tag.slice(1));
              return (
                <button key={tag} onClick={() => setSelectedTag(selectedTag === tag ? null : tag)} className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-black tracking-wide rounded-full transition-all shadow-md border whitespace-nowrap hover:scale-105 ${selectedTag === tag ? 'ring-2 ring-offset-1 ring-gray-400 brightness-90' : 'hover:brightness-110'} ${config.bg}`}>
                  {config.icon && <span className="text-sm leading-none filter drop-shadow-sm">{config.icon}</span>}
                  <span>{displayText}</span>
                </button>
              );
            })}
          </div> 
        </div> 
      )}

      <div className="flex-1 relative overflow-hidden">
        <MapComponent shops={filteredShops} center={userLocation || NZ_CENTER} selectedShop={selectedShop} userLocation={userLocation} onMarkerClick={handleSelectShop} radiusKm={useNearbyFilter && userLocation ? radiusKm : 0} />

        <div className="absolute top-4 right-4 z-[999] flex flex-col gap-3">
          <button onClick={requestLocation} className={`p-3 rounded-full shadow-lg ${userLocation ? 'bg-blue-500 text-white' : 'bg-white'}`}><Navigation className="w-6 h-6" /></button>
          <button onClick={() => isLoggedIn ? setShowAdmin(true) : setShowLogin(true)} className="p-3 bg-white text-rose-500 rounded-full shadow-lg"><Plus className="w-6 h-6" /></button>
          <button onClick={() => setUseNearbyFilter(!useNearbyFilter)} className={`p-3 rounded-full shadow-lg ${useNearbyFilter ? 'bg-green-500 text-white' : 'bg-white'}`}><Filter className="w-6 h-6" /></button>
        </div>

        {useNearbyFilter && userLocation && (
          <div className="absolute top-4 left-4 right-20 z-[999] bg-white/90 backdrop-blur-sm p-3 rounded-2xl shadow-xl flex items-center gap-4">
            <span className="text-xs font-bold text-gray-400">Range</span>
            <input type="range" min="1" max="20" value={radiusKm} onChange={(e) => setRadiusKm(parseInt(e.target.value))} className="flex-1 accent-rose-500" />
            <span className="text-sm font-bold text-rose-600">{radiusKm}km</span>
            <button onClick={() => { setUserLocation(null); setUseNearbyFilter(false); setSelectedShop(null); }} className="ml-2 text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 px-2 py-1 rounded-lg font-bold transition">✕ Reset</button>
          </div>
        )}

        {/* 👇 抽屉式底部菜单 */}
        <div 
          ref={drawerRef}
          className="absolute bottom-0 left-0 right-0 z-[999] flex flex-col"
          style={{
            height: `${drawerHeight}px`,
            transition: isDraggingDrawer.current ? 'none' : 'height 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
            borderTopLeftRadius: '24px',
            borderTopRightRadius: '24px',
            boxShadow: '0 -4px 20px rgba(0,0,0,0.1)',
            background: 'linear-gradient(to top, rgba(255, 150, 100, 0.85), rgba(255, 200, 100, 0.6), rgba(255, 255, 255, 0.4))',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
          }}
          onTouchStart={handleDrawerTouchStart}
          onTouchMove={handleDrawerTouchMove}
          onTouchEnd={handleDrawerTouchEnd}
          onMouseDown={handleDrawerMouseDown}
          onMouseMove={handleDrawerMouseMove}
          onMouseUp={handleDrawerMouseUp}
        >
          <div className="flex-1 relative overflow-hidden w-full" style={{ borderRadius: '24px 24px 0 0', paddingTop: '10px' }}>
            {isExpanded ? (
              <div className="h-full w-full pt-4 pb-4 px-4">
                 <div 
                  ref={scrollRef}
                  className="flex items-center h-full"
                  style={{ 
                    width: 'max-content', 
                    cursor: 'grab',
                    touchAction: 'none',
                    userSelect: 'none',
                    willChange: 'transform',
                    transform: `translateX(${currentTranslateX.current}px)`
                  }}
                  onMouseDown={(e) => handleListDragStart(e.clientX)}
                  onTouchStart={(e) => handleListDragStart(e.touches[0].clientX)}
                >
                  {filteredShops.length > 0 ? (
                    // 🔥 关键：渲染两份列表以实现无缝循环滚动
                    // 即使只有1个店铺，这里也会渲染2个，从而实现“从另一端滚出”的效果
                    [...filteredShops, ...filteredShops].map((shop, index) => {
                      const uniqueKey = `${shop.id}-copy${Math.floor(index / filteredShops.length)}`;
                      return (
                        <div 
                          key={uniqueKey} 
                          className="block flex-shrink-0 flex-grow-0 no-drag"
                          style={{ 
                            width: '260px', 
                            minWidth: '260px', 
                            maxWidth: '260px',
                            marginRight: '16px'
                          }} 
                          onClick={(e) => {
                            const clientX = 'touches' in e ? e.touches[0]?.clientX || 0 : e.clientX;
                            const finalX = 'changedTouches' in e && e.changedTouches.length > 0 ? e.changedTouches[0].clientX : clientX;
                            handleCardClick(shop, finalX);
                          }}
                        >
                          <ShopCard
                            shop={shop}
                            isSelected={selectedShop?.id === shop.id}
                            onClick={() => {}} 
                            onDelete={handleDeleteShop}
                            onSave={(updated) => {
                               const safeUpdated = {
                                ...updated,
                                pictures: updated.pictures ? [...updated.pictures] : [],
                                new_girls_last_15_days: !!updated.new_girls_last_15_days, 
                                badge_text: updated.badge_text || (updated.new_girls_last_15_days ? 'New' : '')
                              };
                              setShops(prev => prev.map(s => s.id === safeUpdated.id ? safeUpdated : s));
                              if (selectedShop?.id === safeUpdated.id) setSelectedShop(safeUpdated);
                            }}
                            deleting={deletingId === shop.id}
                            isLoggedIn={isLoggedIn}
                            onPreview={(s, i) => { setPreviewShop(s); setPreviewIndex(i); }}
                          />
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-white font-bold bg-black/40 backdrop-blur-md p-8 rounded-xl text-center min-w-[300px] shadow-lg">
                      {selectedTag ? `😕 没有店铺包含标签 "${selectedTag}"` : "No shops found nearby."}
                      <br/>
                      <span className="text-xs font-normal opacity-80">(Total: {shops.length})</span>
                    </div>
                  )}
                </div>
                
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-[1000]">
                  <button onClick={toggleDrawer} className="w-9 h-9 bg-slate-800 rounded-full flex items-center justify-center text-white hover:bg-slate-700 hover:scale-110 hover:shadow-2xl transition-all shadow-lg border border-slate-600">
                    <ChevronDown size={22} strokeWidth={3} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-full w-full flex items-center px-6 no-drag" onClick={toggleDrawer}>
                {selectedShop ? (
                  <div className="flex items-center gap-4 text-white w-full">
                    <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0 shadow-lg">
                      <MapPin size={24} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg truncate">{selectedShop.name}</h3>
                      <p className="text-xs text-white/80 truncate">{selectedShop.address || 'Click to see details'}</p>
                    </div>
                    <ChevronUp className="text-white/80 flex-shrink-0" size={24} />
                  </div>
                ) : (
                  <div className="text-white font-bold text-sm flex items-center gap-2">
                    <MapPin size={16} />
                    <span>Select a shop on the map</span>
                    <ChevronUp size={16} />
                  </div>
                )}
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-[1000]">
                  <button onClick={toggleDrawer} className="w-9 h-9 bg-slate-800 rounded-full flex items-center justify-center text-white hover:bg-slate-700 hover:scale-110 hover:shadow-2xl transition-all shadow-lg border border-slate-600">
                    <ChevronUp size={22} strokeWidth={3} />
                  </button>
                </div>
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