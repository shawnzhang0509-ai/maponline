import React, { useState, useEffect, useRef, useMemo } from 'react';
// 1. 引入刚才写的汉堡包按钮
import HamburgerButton from './components/HamburgerButton'; 
import { BrowserRouter, Routes, Route, useNavigate, useSearchParams } from 'react-router-dom';
import AgeVerificationModal from './components/AgeVerificationModal';
import TermsPage from './pages/TermsPage'; 
import AboutPage from './pages/AboutPage';
import Header from './components/Header';
import SidebarMenu from './components/SidebarMenu'; // 引入侧边栏
import MapComponent from './components/MapComponent';
import ShopCard from './components/ShopCard';
import AdminPanel from './components/AdminPanel';
import ShopDetailPage from './pages/ShopDetailPage';
import { Shop, UserLocation } from './types';
import { NZ_CENTER } from './constants';
import { calculateDistance } from './utils';
import LoginPanel from './components/LoginPanel';
import ImagePreviewModal from './components/ImagePreviewPanel';
import { Plus, Navigation, Filter, X, ChevronUp, ChevronDown, MapPin } from 'lucide-react';
import ShopStats from './pages/ShopStats'; // 👈 新增这一行
import AdminStats from './pages/Adminstats';
import MyAdsPage from './pages/MyAdsPage';
import AssignAdsPage from './pages/AssignAdsPage';
import BadgeFilterDropdown from './components/BadgeFilterDropdown';

const STORAGE_KEY = 'nz_massage_shops_v1';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

/** Align list payload with UI: picture URLs, and badge_text fallback from new_girls_last_15_days */
function normalizeShopFromApi(shop: any, apiBase: string): Shop {
  const pictures =
    shop.pictures?.map((pic: any) => ({
      ...pic,
      url: pic.url && pic.url.startsWith('/files/') ? `${apiBase}${pic.url}` : pic.url,
    })) || [];
  const rawBadge = shop.badge_text;
  const hasBadge = rawBadge != null && String(rawBadge).trim() !== '';
  const badge_text = hasBadge
    ? String(rawBadge).trim()
    : shop.new_girls_last_15_days
      ? 'New'
      : '';
  return { ...shop, pictures, badge_text };
}

const COLLAPSED_HEIGHT = 80; 
const EXPANDED_HEIGHT = 380; 
const CLICK_THRESHOLD = 5; 
const AUTO_SCROLL_SPEED = 0.8; 
const RESUME_DELAY = 2500; 

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [shops, setShops] = useState<Shop[]>(() => {
    if (typeof window === 'undefined') return [];
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return [];
    try {
      const parsed = JSON.parse(saved) as any[];
      return Array.isArray(parsed)
        ? parsed.map((s) => normalizeShopFromApi(s, API_BASE_URL))
        : [];
    } catch {
      return [];
    }
  });

  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [zoom, setZoom] = useState<number>(5.5); 
  const [center, setCenter] = useState<UserLocation>(NZ_CENTER); // 使用你导入的 NZ_CENTER 作为默认值
  

  // ✅ 新增：年龄验证状态
  const [isAgeVerified, setIsAgeVerified] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('age_verified') === 'true';
    }
    return false;
  });
  const [showAgeModal, setShowAgeModal] = useState(false);


  const [showCreateAd, setShowCreateAd] = useState(false);
  const [useNearbyFilter, setUseNearbyFilter] = useState(false);
  const [radiusKm, setRadiusKm] = useState(10);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  
  const [isLoggedIn, setIsLoggedIn] = useState(() => typeof window !== 'undefined' && localStorage.getItem("admin_logged_in") === "true");
  const [username, setUsername] = useState<string | null>(() => typeof window !== 'undefined' ? localStorage.getItem('admin_username') : null);
  const [isAdmin, setIsAdmin] = useState(() => typeof window !== 'undefined' && localStorage.getItem('is_admin') === 'true');

  const [previewShop, setPreviewShop] = useState<Shop | null>(null);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const [drawerHeight, setDrawerHeight] = useState(COLLAPSED_HEIGHT);
  const isExpanded = drawerHeight > COLLAPSED_HEIGHT + 50;

  // 1. 原有的 URL 处理逻辑 (保持不变)
  useEffect(() => {
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const focusId = searchParams.get('focus');
    
    if (lat && lng) {
      setUserLocation({ lat: parseFloat(lat), lng: parseFloat(lng) });
      setUseNearbyFilter(true);
      
      if (focusId) {
        const target = shops.find(s => s.id.toString() === focusId || s.id === parseInt(focusId));
        if (target) {
          setSelectedShop(target);
          setTimeout(() => setDrawerHeight(EXPANDED_HEIGHT), 100);
        }
      }
    }
  }, [searchParams, shops]);

  // 2. ✅ 新增：检查年龄验证 (独立的 useEffect)
  useEffect(() => {
    if (!isAgeVerified) {
      const timer = setTimeout(() => setShowAgeModal(true), 300);
      return () => clearTimeout(timer);
    }
  }, [isAgeVerified]);

  // 3. ✅ 新增：处理确认函数 (独立函数)
  const handleAgeConfirm = () => {
    localStorage.setItem('age_verified', 'true');
    setIsAgeVerified(true);
    setShowAgeModal(false);
  };

  // 4. ✅ 新增：处理拒绝函数 (独立函数)
  const handleAgeReject = () => {
    window.location.href = 'https://www.google.com';
  };

  const normalizeTag = (tag: string): string => {
    let clean = (tag || '').trim().toLowerCase();
    if (!clean) return '';
    clean = clean.replace(/^🆕\s*/, '');
    clean = clean.replace(/\s+/g, ' ');
    clean = clean
      .replace(/^[^a-z0-9\u4e00-\u9fa5]+/gi, '')
      .replace(/[^a-z0-9\u4e00-\u9fa5]+$/gi, '')
      .trim();

    const aliasMap: Record<string, string> = {
      'new girl': 'new',
      'new girls': 'new',
      'vip seller': 'vip',
      'diamond seller': 'diamond',
      'adultdollseller': 'adult doll seller',
    };
    return aliasMap[clean] || clean;
  };

  const getShopTags = (shop: Shop): string[] => {
    const text = shop.badge_text;
    const fromText =
      text && typeof text === 'string' && text.trim() !== ''
        ? text
            .split(/[,\n，|/]+/)
            .map((t) => normalizeTag(t))
            .filter(Boolean)
        : [];
    if (shop.new_girls_last_15_days && !fromText.includes('new')) {
      fromText.push('new');
    }
    return fromText;
  };

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    shops.forEach(shop => getShopTags(shop).forEach(tag => tagSet.add(tag)));
    return Array.from(tagSet).sort();
  }, [shops]);

  const filteredShops = useMemo(() => {
    let result = [...shops];
    // 1. 【核心】先执行距离过滤
    if (useNearbyFilter && userLocation) {
      result = result.filter(shop => {
        const dist = calculateDistance(userLocation, { lat: shop.lat, lng: shop.lng });
        return dist <= radiusKm;
      });
    }

    // 2. 执行标签过滤（多选：匹配任意一个）
    if (selectedTags.length > 0) {
      const targetTags = new Set(selectedTags.map((t) => normalizeTag(t)));
      result = result.filter((shop) =>
        getShopTags(shop).some((tag) => targetTags.has(tag))
      );
    }

    // 3. ✅ 新增：综合排序逻辑 (优先级 > 距离)
    // 定义优先级辅助函数
    const getPriority = (shop: Shop) => {
      const tags = getShopTags(shop);
      if (tags.includes('diamond')) return 3; // 最高优先级
      if (tags.includes('vip')) return 2;      // 次高优先级
      return 0;                                // 普通店铺
    };

    result.sort((a, b) => {
      const priorityA = getPriority(a);
      const priorityB = getPriority(b);

      // A. 先比优先级 (Diamond/VIP 排前面)
      if (priorityA !== priorityB) {
        return priorityB - priorityA; // 降序：3 -> 2 -> 0
      }

      // B. 优先级相同，再比距离 (近的排前面)
      if (userLocation) {
        const distA = calculateDistance(userLocation, { lat: a.lat, lng: a.lng });
        const distB = calculateDistance(userLocation, { lat: b.lat, lng: b.lng });
        return distA - distB; // 升序：近 -> 远
      }

      return 0;
    });

    // 4. 【修复】处理选中店铺的逻辑
    // 只有当 selectedShop 真的在过滤后的列表里，或者是为了高亮显示时才操作
    // 如果 selectedShop 超出了半径范围，且开启了附近过滤，我们暂时不强制把它加回来，以免误导用户
    if (selectedShop) {
      const isSelectedInList = result.some(s => s.id === selectedShop.id);
      
      // 只有在以下情况才把 selectedShop 置顶：
      // A. 它本来就在列表里 (在半径内) -> 只是调整顺序置顶
      // B. 没有开启附近过滤 (useNearbyFilter 为 false) -> 显示所有店，选中店置顶
      if (isSelectedInList || !useNearbyFilter) {
        const others = result.filter(s => s.id !== selectedShop.id);
        result = [selectedShop, ...others];
      } else {
        // 🔴 关键修复：如果开启了附近过滤，且选中的店不在范围内，就不强制显示它
        // 这样用户就能明确知道“这个店不在范围内”，而不是看到一个突兀的店出现在列表里
        console.log(`ℹ️ 选中的店铺 ${selectedShop.name} 超出 ${radiusKm}km 范围，已按规则隐藏。`);
      }
    }

    return result;
  }, [shops, useNearbyFilter, userLocation, radiusKm, selectedTags, selectedShop]);

  // Scrolling Logic
  const scrollRef = useRef<HTMLDivElement>(null);
  const isDraggingList = useRef(false);
  const startX = useRef(0);
  const currentTranslateX = useRef(0); 
  const dragStartX = useRef(0); 
  const animationFrameId = useRef<number | null>(null);
  const resumeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isPausedByUser = useRef(false);

  const startAutoScroll = () => {
    if (animationFrameId.current || !isExpanded || isPausedByUser.current || selectedShop) return;
    const run = () => {
      const container = scrollRef.current;
      if (!container) { animationFrameId.current = requestAnimationFrame(run); return; }
      const cardWidth = 260 + 16;
      const totalContentWidth = filteredShops.length * cardWidth;
      currentTranslateX.current -= AUTO_SCROLL_SPEED;
      if (Math.abs(currentTranslateX.current) >= totalContentWidth) currentTranslateX.current = 0;
      container.style.transform = `translateX(${currentTranslateX.current}px)`;
      animationFrameId.current = requestAnimationFrame(run);
    };
    animationFrameId.current = requestAnimationFrame(run);
  };

  const stopAutoScroll = () => {
    if (animationFrameId.current) { cancelAnimationFrame(animationFrameId.current); animationFrameId.current = null; }
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

  useEffect(() => {
    stopAutoScroll();
    if (isExpanded && filteredShops.length > 0 && !selectedShop && !isPausedByUser.current) {
      const timer = setTimeout(() => startAutoScroll(), 500);
      return () => clearTimeout(timer);
    }
    return () => { stopAutoScroll(); if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current); };
  }, [isExpanded, filteredShops.length, selectedShop]);

  const handleListDragStart = (clientX: number) => {
    isDraggingList.current = true;
    isPausedByUser.current = true;
    startX.current = clientX;
    dragStartX.current = clientX;
    if (scrollRef.current) { scrollRef.current.style.cursor = 'grabbing'; scrollRef.current.style.transition = 'none'; }
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
    if (scrollRef.current) { scrollRef.current.style.cursor = 'grab'; scrollRef.current.style.transition = 'transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)'; }
    window.removeEventListener('mousemove', handleListMouseMove);
    window.removeEventListener('mouseup', handleListMouseUp);
    window.removeEventListener('touchmove', handleListTouchMove);
    window.removeEventListener('touchend', handleListMouseUp);
    scheduleResume();
  };

  // Two-Step Click Logic
  const handleCardClick = (shop: Shop, currentEventClientX: number) => {
    const distance = Math.abs(currentEventClientX - dragStartX.current);
    if (distance > CLICK_THRESHOLD) return;

    if (selectedShop && selectedShop.id === shop.id) {
      const slug = shop.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      navigate(`/shop/${slug}`);
      return;
    }

    setSelectedShop(shop);
    if (!useNearbyFilter) {
      setUseNearbyFilter(true);
      setUserLocation({ lat: shop.lat, lng: shop.lng });
      setRadiusKm(5);
    }
    if (!isExpanded) setDrawerHeight(EXPANDED_HEIGHT);
    stopAutoScroll();
  };

  const handleMarkerClick = (shop: Shop) => {
     if (selectedShop && selectedShop.id === shop.id) {
       const slug = shop.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
       navigate(`/shop/${slug}`);
     } else {
       setSelectedShop(shop);
       if (!useNearbyFilter) {
          setUseNearbyFilter(true);
          setUserLocation({ lat: shop.lat, lng: shop.lng });
       }
       if (!isExpanded) setDrawerHeight(EXPANDED_HEIGHT);
       stopAutoScroll();
     }
  };

  // Drawer Logic
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
    if (willExpand && !selectedShop) resumeTimerRef.current = setTimeout(() => { if (!isDraggingList.current) startAutoScroll(); }, 500);
    else stopAutoScroll();
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
    if (willExpand && !selectedShop) resumeTimerRef.current = setTimeout(() => { if (!isDraggingList.current) startAutoScroll(); }, 500);
    else stopAutoScroll();
  };
  const toggleDrawer = () => {
    const willExpand = !isExpanded;
    setDrawerHeight(willExpand ? EXPANDED_HEIGHT : COLLAPSED_HEIGHT);
    if (willExpand && !selectedShop) resumeTimerRef.current = setTimeout(() => { if (!isDraggingList.current) startAutoScroll(); }, 500);
    else stopAutoScroll();
  };

  // Business Logic
  const fetchShops = async () => {
    try {
      console.log(API_BASE_URL);
      const token = localStorage.getItem('auth_token') || '';
      const response = await fetch(`${API_BASE_URL}/shops`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      const fixedData = data.map((shop: any) => normalizeShopFromApi(shop, API_BASE_URL));
      setShops(fixedData);
    } catch (error) {
      console.error('❌ Load failed:', error);
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setShops(JSON.parse(saved));
    }
  };

  const handleSearch = async (keyword: string) => {
    setIsSearching(true);
    try {
      let url = `${API_BASE_URL}/shop/shops`;
      if (keyword) url += `?keyword=${encodeURIComponent(keyword)}`;
      const token = localStorage.getItem('auth_token') || '';
      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!res.ok) throw new Error('Network response was not ok');
      const raw = await res.json();
      setShops(raw.map((shop: any) => normalizeShopFromApi(shop, API_BASE_URL)));
    } catch (err) { alert("Search failed"); } 
    finally { setIsSearching(false); }
  };

  const handleLoginSuccess = (payload: { username: string; token: string; isAdmin: boolean }) => {
    const { username: u, token, isAdmin: adminFlag } = payload;
    setIsLoggedIn(true);
    setUsername(u);
    setIsAdmin(adminFlag);
    localStorage.setItem("admin_logged_in", "true");
    localStorage.setItem('admin_username', u);
    localStorage.setItem('auth_token', token || '');
    localStorage.setItem('is_admin', adminFlag ? 'true' : 'false');
  };
  const handleLogout = () => {
    setIsLoggedIn(false);
    setUsername(null);
    setIsAdmin(false);
    localStorage.removeItem("admin_logged_in");
    localStorage.removeItem('admin_username');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('is_admin');
  };
  
  const requestLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser 😞");
      return;
    }

    // 先给个反馈，让用户知道正在定位
    // (可选) 如果你不想用 alert，可以做一个小的 Toast 提示
    // console.log("📍 Locating..."); 

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newLoc = { 
          lat: pos.coords.latitude, 
          lng: pos.coords.longitude 
        };

        // 1. 更新用户位置 (红点)
        setUserLocation(newLoc);
        
        // 2. 开启附近过滤
        setUseNearbyFilter(true); 
        
        // 3. 设置合理的默认半径 (比如 5km 更适合城市浏览)
        const DEFAULT_RADIUS = 5;
        setRadiusKm(DEFAULT_RADIUS); 

        // 🚀 关键修复：强制移动地图镜头！
        // 将地图中心移到用户位置
        setCenter(newLoc);
        
        // 将缩放级别调整为“街道/社区”级别 (13-14 比较合适)
        // 5.5 是国家级别，13 是城市级别，15 是街道级别
        setZoom(13.5); 

        // 4. 正确的提示语 (使用我们刚定义的常量)
        setTimeout(() => {
          alert(`📍 Filtering cute faces around ${DEFAULT_RADIUS}km… just for you 😎.`);
        }, 100);
      },
      (err) => {
        console.error(err);
        let msg = "Location access denied.";
        if (err.code === 1) msg = "You denied location access. Please enable it in browser settings to use 'Nearby' filter.";
        if (err.code === 2) msg = "Location unavailable. Check your GPS settings.";
        if (err.code === 3) msg = "Location request timed out.";
        alert(msg);
      },
      {
        enableHighAccuracy: true, // 尝试获取高精度 GPS
        timeout: 10000,           // 10秒超时
        maximumAge: 0             // 不使用缓存
      }
    );
  };

  const handleAddShop = (newShop: Shop) => {
    if (shops.some(s => s.name.trim().toLowerCase() === newShop.name.trim().toLowerCase())) { alert(`Shop "${newShop.name}" already exists`); return; }
    setShops([...shops, newShop]); setShowCreateAd(false);
    const slug = newShop.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    navigate(`/shop/${slug}`);
  };

  const handleDeleteShop = async (shop: Shop) => {
    if (!confirm(`Delete "${shop.name}"? This cannot be undone.`)) return;
    setDeletingId(shop.id);
    try {
      const token = localStorage.getItem('auth_token') || '';
      const res = await fetch(`${API_BASE_URL}/shop/del`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ id: shop.id, token: "my_super_secret_delete_token" }),
      });
      const result = await res.json();
      if (!res.ok || result.error) { alert(result.error || "Delete failed"); return; }
      setShops(prev => prev.filter(s => s.id !== shop.id));
      if (selectedShop?.id === shop.id) {
        setSelectedShop(null);
        navigate('/');
      }
    } catch (err) { console.error(err); alert("Network error"); } 
    finally { setDeletingId(null); }
  };

  useEffect(() => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(shops)); } catch (e) {} }, [shops]);
  useEffect(() => { fetchShops(); }, []);

  return (
    <div className="relative h-screen w-full bg-gray-50 flex flex-col overflow-hidden">
      {/* 👇 这是关键：将按钮放在最顶部，并使用 fixed 定位和高 z-index */}
      <Header isLoggedIn={isLoggedIn} username={username} onLogin={() => setShowLogin(true)} onLogout={handleLogout} onSearch={handleSearch} isSearching={isSearching} />
      
      {/* 👇 在这里插入汉堡包按钮 👇 */}
      {/* 注意：z-[1000] 是为了确保按钮浮在所有内容（包括标签栏）之上 */}
      {/* 👆 插入结束 👆 */}

      {allTags.length > 0 && (
        <div className="absolute top-[70px] left-0 right-[72px] sm:right-0 z-[996] px-2 sm:px-4 pointer-events-none bg-white/90 backdrop-blur-sm border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto py-2 pointer-events-auto">
            <BadgeFilterDropdown
              allTags={allTags}
              selectedTags={selectedTags}
              onChange={setSelectedTags}
            />
          </div>
        </div>
      )}

      <div className="flex-1 relative overflow-hidden">
        <MapComponent shops={filteredShops} center={userLocation || NZ_CENTER} zoom={zoom} selectedShop={selectedShop} userLocation={userLocation} onMarkerClick={handleMarkerClick} radiusKm={useNearbyFilter && userLocation ? radiusKm : 0} />

        <div className="absolute top-4 right-4 z-[999] flex flex-col gap-3">
          <button onClick={requestLocation} className={`p-3 rounded-full shadow-lg ${userLocation ? 'bg-blue-500 text-white' : 'bg-white'}`}><Navigation className="w-6 h-6" /></button>
          <button
            onClick={() => (isLoggedIn ? setShowCreateAd(true) : setShowLogin(true))}
            className="p-3 bg-white text-rose-500 rounded-full shadow-lg"
            title={isLoggedIn ? 'Add your ad' : 'Login to add ad'}
          >
            <Plus className="w-6 h-6" />
          </button>
          <button onClick={() => setUseNearbyFilter(!useNearbyFilter)} className={`p-3 rounded-full shadow-lg ${useNearbyFilter ? 'bg-green-500 text-white' : 'bg-white'}`}><Filter className="w-6 h-6" /></button>
        </div>

        {useNearbyFilter && userLocation && (
          <div className="absolute top-4 left-4 right-20 z-[999] bg-white/90 backdrop-blur-sm p-3 rounded-2xl shadow-xl flex items-center gap-4">
            <span className="text-xs font-bold text-gray-400 uppercase">Range</span>
            <input type="range" min="1" max="20" value={radiusKm} onChange={(e) => setRadiusKm(parseInt(e.target.value))} className="flex-1 accent-rose-500" />
            <span className="text-sm font-bold text-rose-600 w-10 text-right">{radiusKm}km</span>
            <button 
              onClick={() => {
                setUseNearbyFilter(false);
                setUserLocation(null);
                setSelectedShop(null);
                setCenter({ lat: -50.8485, lng: 174.7633 });
                setZoom(5.5);
              }} 
              className="ml-2 text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 px-2 py-1 rounded-lg font-bold transition"
            >
              ✕ Reset
            </button>
          </div>
        )}

        {/* Drawer */}
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
                  style={{ width: 'max-content', cursor: 'grab', touchAction: 'none', userSelect: 'none', willChange: 'transform', transform: `translateX(${currentTranslateX.current}px)` }}
                  onMouseDown={(e) => handleListDragStart(e.clientX)}
                  onTouchStart={(e) => handleListDragStart(e.touches[0].clientX)}
                >
                  {filteredShops.length > 0 ? (
                    [...filteredShops, ...filteredShops].map((shop, index) => {
                      const uniqueKey = `${shop.id}-copy${Math.floor(index / filteredShops.length)}`;
                      const slug = shop.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                      const isSelected = selectedShop?.id === shop.id;
                      
                      return (
                        <div
                          key={uniqueKey}
                          className="block flex-shrink-0 flex-grow-0 no-drag relative"
                          style={{ width: '260px', minWidth: '260px', maxWidth: '260px', marginRight: '16px', cursor: 'pointer' }}
                          onClick={(e) => {
                            const clientX = 'touches' in e ? (e as any).touches?.[0]?.clientX || 0 : e.clientX;
                            const finalX = 'changedTouches' in e && (e as any).changedTouches?.length > 0 ? (e as any).changedTouches[0].clientX : clientX;
                            e.stopPropagation(); 
                            handleCardClick(shop, finalX);
                          }}
                        >
                          <ShopCard
                            shop={shop}
                            isSelected={isSelected}
                            onClick={() => {}} 
                            onDelete={handleDeleteShop}
                            isAdmin={isAdmin}
                            canDelete={isAdmin}
                            onSave={(updated) => {
                              const safeUpdated = { ...updated, pictures: updated.pictures ? [...updated.pictures] : [], new_girls_last_15_days: !!updated.new_girls_last_15_days, badge_text: updated.badge_text || (updated.new_girls_last_15_days ? 'New' : '') };
                              setShops(prev => prev.map(s => s.id === safeUpdated.id ? safeUpdated : s));
                            }}
                            deleting={deletingId === shop.id}
                            isLoggedIn={isLoggedIn}
                            onPreview={(s, i) => { setPreviewShop(s); setPreviewIndex(i); }}
                          />
                          {isSelected && (
                            <div className="mt-2 text-center text-xs font-bold text-rose-700 bg-white/90 rounded py-1 shadow-sm border border-rose-100 animate-pulse">
                              Tap again for details
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-white font-bold bg-black/40 backdrop-blur-md p-8 rounded-xl text-center min-w-[300px] shadow-lg">
                      {selectedTags.length > 0 ? `No shops found with selected badges.` : "No shops found nearby."}
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
                    <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0 shadow-lg"><MapPin size={24} /></div>
                    <div className="flex-1 min-w-0"><h3 className="font-bold text-lg truncate">{selectedShop.name}</h3><p className="text-xs text-white/80 truncate">Tap again to view details</p></div>
                    <ChevronUp className="text-white/80 flex-shrink-0" size={24} />
                  </div>
                ) : (
                  <div className="text-white font-bold text-sm flex items-center gap-2"><MapPin size={16} /><span>Select a shop on the map</span><ChevronUp size={16} /></div>
                )}
                 <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-[1000]">
                  <button onClick={toggleDrawer} className="w-9 h-9 bg-slate-800 rounded-full flex items-center justify-center text-white hover:bg-slate-700 hover:scale-110 hover:shadow-2xl transition-all shadow-lg border border-slate-600"><ChevronUp size={22} strokeWidth={3} /></button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showCreateAd && <AdminPanel onAddShop={handleAddShop} onClose={() => setShowCreateAd(false)} />}
      {showLogin && <LoginPanel onLoginSuccess={(payload) => { handleLoginSuccess(payload); setShowLogin(false); }} onClose={() => setShowLogin(false)} />}
      {previewShop && <ImagePreviewModal shop={previewShop} index={previewIndex} onChangeIndex={setPreviewIndex} onClose={() => setPreviewShop(null)} />}
      
      {/* ✅ 新增：年龄验证弹窗 */}
      <AgeVerificationModal 
        isOpen={showAgeModal} 
        onConfirm={handleAgeConfirm} 
        onReject={handleAgeReject} 
      />
    </div>
  );
};

const App: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [authVersion, setAuthVersion] = useState(0);
  const [isAdmin, setIsAdmin] = useState(
    () => typeof window !== 'undefined' && localStorage.getItem('is_admin') === 'true'
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleStorage = () => {
      setIsAdmin(localStorage.getItem('is_admin') === 'true');
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);
  
  return (
    <BrowserRouter>
      <HamburgerButton 
        onClick={() => setIsMenuOpen(true)} 
        style={{ position: 'fixed', top: '16px', right: '16px', zIndex: 9999 }} 
      />
      
      <Routes>
        {/* 首页路由 */}
        <Route path="/" element={<HomePage key={`home-${authVersion}`} />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/terms" element={<TermsPage />} />
        
        {/* ✅ 新增：店铺详情页路由 (关键修复) */}
        {/* :slug 是一个动态参数，可以匹配 relax, massage, abc 等任意值 */}
        <Route path="/shop/:slug" element={<ShopDetailPage />} />

        {/* 统计页路由 */}
        <Route path="/stats/:shopId" element={<ShopStats />} />
        {/* 👇 新增：全站统计路由 */}
        <Route path="/admin/stats" element={<AdminStats />} />
        <Route path="/admin/assign-ads" element={<AssignAdsPage />} />
        <Route path="/my-ads" element={<MyAdsPage />} />
      </Routes>

      <SidebarMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onAuthChanged={() => {
          setAuthVersion((prev) => prev + 1);
          setIsAdmin(typeof window !== 'undefined' && localStorage.getItem('is_admin') === 'true');
        }}
        isAdmin={isAdmin}
      />
    </BrowserRouter>
  );
};

export default App;