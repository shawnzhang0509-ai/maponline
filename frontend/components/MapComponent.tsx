import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Shop, UserLocation } from '../types';

interface MapComponentProps {
  shops: Shop[];
  center: UserLocation;
  selectedShop: Shop | null;
  onMarkerClick: (shop: Shop) => void;
  userLocation: UserLocation | null;
  radiusKm?: number; // ✅ 1. 新增：接收半径参数
}

// ... (createShopIcon 函数保持不变，无需修改) ...
const createShopIcon = (shop: Shop, isSelected: boolean): L.DivIcon => {
  const iconDiv = document.createElement('div');
  iconDiv.className = 'custom-div-icon';
  iconDiv.style.width = '32px';
  iconDiv.style.height = '32px';
  iconDiv.style.display = 'flex';
  iconDiv.style.alignItems = 'center';
  iconDiv.style.justifyContent = 'center';
  iconDiv.style.position = 'relative';

  const circle = document.createElement('div');
  circle.style.width = '32px';
  circle.style.height = '32px';
  circle.style.borderRadius = '50%';
  circle.style.border = '2px solid white';
  circle.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)';
  circle.style.overflow = 'hidden';
  circle.style.backgroundColor = isSelected ? '#e11d48' : '#f43f5e';
  if (isSelected) {
    circle.style.transform = 'scale(1.25)';
    circle.style.transition = 'transform 0.2s ease';
  }

  // --- 🔧 修改开始：提取并修复图片 URL ---
  const getRawPictureUrl = (pic: any): string | null => {
    if (!pic) return null;
    if (typeof pic === 'string') return pic;
    if (typeof pic === 'object' && typeof pic.url === 'string') return pic.url;
    return null;
  };

  const rawUrl = getRawPictureUrl(shop.pictures?.[0]);
  
  let finalImageUrl: string | null = null;

  if (rawUrl) {
    if (rawUrl.startsWith('http')) {
      // 如果是完整链接，直接使用
      finalImageUrl = rawUrl;
    } else {
      // 如果是相对路径，拼接后端地址 + /uploads/
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5000';
      const cleanPath = rawUrl.startsWith('/') ? rawUrl.slice(1) : rawUrl;
      finalImageUrl = `${baseUrl}/uploads/${cleanPath}`;
    }
  }
  // --- 🔧 修改结束 ---

  if (finalImageUrl) {
    const img = document.createElement('img');
    img.src = finalImageUrl; // 👈 使用修复后的 URL
    img.alt = shop.name || 'SPA';
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'cover';
    img.style.objectPosition = 'top';
    
    img.onerror = () => {
      // 图片加载失败时，移除 img 并显示文字
      if (img.parentNode) {
        img.remove();
      }
      // 防止重复添加文字
      if (!circle.querySelector('span')) {
        const span = document.createElement('span');
        span.textContent = 'SPA';
        span.style.color = 'white';
        span.style.fontSize = '10px';
        span.style.fontWeight = 'bold';
        span.style.display = 'flex';
        span.style.alignItems = 'center';
        span.style.justifyContent = 'center';
        span.style.height = '100%';
        circle.appendChild(span);
      }
    };
    circle.appendChild(img);
  } else {
    // 没有图片数据，直接显示文字
    if (!circle.querySelector('span')) {
      const span = document.createElement('span');
      span.textContent = 'SPA';
      span.style.color = 'white';
      span.style.fontSize = '10px';
      span.style.fontWeight = 'bold';
      span.style.display = 'flex';
      span.style.alignItems = 'center';
      span.style.justifyContent = 'center';
      span.style.height = '100%';
      circle.appendChild(span);
    }
  }

  iconDiv.appendChild(circle);

  if (isSelected) {
    const triangle = document.createElement('div');
    triangle.style.position = 'absolute';
    triangle.style.bottom = '-4px';
    triangle.style.left = '50%';
    triangle.style.transform = 'translateX(-50%) rotate(45deg)';
    triangle.style.width = '8px';
    triangle.style.height = '8px';
    triangle.style.backgroundColor = '#e11d48';
    triangle.style.zIndex = '10';
    iconDiv.appendChild(triangle);
  }

  return L.divIcon({
    html: iconDiv,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    className: '',
  });
};

const MapComponent: React.FC<MapComponentProps> = ({ 
  shops, 
  center, 
  selectedShop, 
  onMarkerClick,
  userLocation,
  radiusKm = 0 // ✅ 2. 设置默认值
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});
  const rangeCircleRef = useRef<L.Circle | null>(null); // ✅ 3. 创建引用存储圆圈

  useEffect(() => {
    if (!mapContainerRef.current) return;

    mapRef.current = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false
    }).setView([center.lat, center.lng], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(mapRef.current);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
      }
    };
  }, []);

  // Update center when it changes
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setView([center.lat, center.lng]);
    }
  }, [center]);

  // ✅ 4. 处理圆圈 (Range Circle) 的绘制与更新
  useEffect(() => {
    if (!mapRef.current) return;

    // 如果之前有圆圈，先移除
    if (rangeCircleRef.current) {
      mapRef.current.removeLayer(rangeCircleRef.current);
      rangeCircleRef.current = null;
    }

    // 如果有有效的半径和用户位置，绘制新圆圈
    if (radiusKm > 0 && userLocation) {
      const circle = L.circle([userLocation.lat, userLocation.lng], {
        radius: radiusKm * 1000, // 单位转换为米
        color: '#f43f5e',        // 边框颜色 (rose-500)
        fillColor: '#f43f5e',    // 填充颜色
        fillOpacity: 0.15,       // ✅ 关键：半透明
        weight: 1                // 边框宽度
      }).addTo(mapRef.current);
      
      // 将圆圈置于底层，以免遮挡标记
      circle.bringToBack();
      
      rangeCircleRef.current = circle;
    }
  }, [radiusKm, userLocation]); // 依赖项：半径或位置变化时重绘

  // Handle markers
  useEffect(() => {
    if (!mapRef.current) return;

    // Clear old markers
    Object.values(markersRef.current).forEach(m => m.remove());
    markersRef.current = {};

    // Add new markers
    shops.forEach(shop => {
      // 使用 id 作为 key 更安全，如果没有 id 则用 name+lat
      const key = shop.id ? String(shop.id) : `${shop.name}-${shop.lat}`;
      const isSelected = selectedShop?.id === shop.id || (selectedShop?.name === shop.name && selectedShop?.lat === shop.lat);
      
      const icon = createShopIcon(shop, isSelected);

      const marker = L.marker([shop.lat, shop.lng], { icon })
        .addTo(mapRef.current!)
        .on('click', () => onMarkerClick(shop));

      markersRef.current[key] = marker;
    });

    // Add user location marker (蓝点)
    // 注意：如果已经在画圆圈了，这个蓝点就在圆心，可以选择隐藏或保留
    if (userLocation && mapRef.current) {
      // 只有当没有开启半径模式，或者你想明确显示中心点时才添加
      // 这里我们保留它，因为它能明确指示“当前中心”
      const userIcon = L.divIcon({
        className: 'user-icon',
        html: `<div class="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-md animate-pulse"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });
      L.marker([userLocation.lat, userLocation.lng], { icon: userIcon, zIndexOffset: 1000 }).addTo(mapRef.current);
    }
  }, [shops, selectedShop, userLocation]);

  // Pan to selected shop
  useEffect(() => {
    if (selectedShop && mapRef.current) {
      mapRef.current.flyTo([selectedShop.lat, selectedShop.lng], 15);
    }
  }, [selectedShop]);

    return (
    <div 
      ref={mapContainerRef} 
      className="w-full h-full overflow-hidden" // ✅ 1. 添加 overflow-hidden
      style={{ 
        maxWidth: '100%',   // ✅ 2. 禁止超过父级
        width: '100%',      // ✅ 3. 强制全宽
        boxSizing: 'border-box',
        // ✅ 4. 【核弹】防止 Leaflet 内部样式覆盖
        position: 'relative', 
        zIndex: 0 
      }} 
    />
  );
}; // <--- 补上这个！

export default MapComponent;