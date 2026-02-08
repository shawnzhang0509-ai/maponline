import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Shop, UserLocation } from '../types';

interface MapComponentProps {
  shops: Shop[];
  center: UserLocation;
  selectedShop: Shop | null;
  onMarkerClick: (shop: Shop) => void;
  userLocation: UserLocation | null;
}

// 创建自定义图标（安全方式：不拼接 HTML 字符串）
const createShopIcon = (shop: Shop, isSelected: boolean): L.DivIcon => {
  // 创建一个 div 作为图标容器
  const iconDiv = document.createElement('div');
  iconDiv.className = 'custom-div-icon';
  iconDiv.style.width = '32px';
  iconDiv.style.height = '32px';
  iconDiv.style.display = 'flex';
  iconDiv.style.alignItems = 'center';
  iconDiv.style.justifyContent = 'center';
  iconDiv.style.position = 'relative';

  // 外层圆圈（带边框和阴影）
  const circle = document.createElement('div');
  circle.style.width = '32px';
  circle.style.height = '32px';
  circle.style.borderRadius = '50%';
  circle.style.border = '2px solid white';
  circle.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)';
  circle.style.overflow = 'hidden';
  circle.style.backgroundColor = isSelected ? '#e11d48' : '#f43f5e'; // rose-600 / rose-400
  if (isSelected) {
    circle.style.transform = 'scale(1.25)';
    circle.style.transition = 'transform 0.2s ease';
  }

  // 图片或 fallback 文字
  const imageUrl = shop.pictures?.[0];
  if (imageUrl) {
    const img = document.createElement('img');
    img.src = imageUrl;
    img.alt = shop.name || 'SPA';
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'cover';
    img.style.objectPosition = 'top'; // 优先显示上半身
    img.onerror = () => {
      // 图片加载失败 → 显示 SPA
      img.remove();
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
    };
    circle.appendChild(img);
  } else {
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

  iconDiv.appendChild(circle);

  // 如果选中，添加底部小三角
  if (isSelected) {
    const triangle = document.createElement('div');
    triangle.style.position = 'absolute';
    triangle.style.bottom = '-4px';
    triangle.style.left = '50%';
    triangle.style.transform = 'translateX(-50%) rotate(45deg)';
    triangle.style.width = '8px';
    triangle.style.height = '8px';
    triangle.style.backgroundColor = '#e11d48'; // rose-600
    triangle.style.zIndex = '10';
    iconDiv.appendChild(triangle);
  }

  return L.divIcon({
    html: iconDiv,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    className: '', // 防止 leaflet 默认样式干扰
  });
};

const MapComponent: React.FC<MapComponentProps> = ({ 
  shops, 
  center, 
  selectedShop, 
  onMarkerClick,
  userLocation
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});

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

  // Handle markers
  useEffect(() => {
    if (!mapRef.current) return;

    // Clear old markers
    Object.values(markersRef.current).forEach(m => m.remove());
    markersRef.current = {};

    // Add new markers
    shops.forEach(shop => {
      const isSelected = selectedShop?.name === shop.name && selectedShop?.lat === shop.lat;
      const icon = createShopIcon(shop, isSelected);

      const marker = L.marker([shop.lat, shop.lng], { icon })
        .addTo(mapRef.current!)
        .on('click', () => onMarkerClick(shop));

      markersRef.current[shop.name] = marker;
    });

    // Add user location marker
    if (userLocation && mapRef.current) {
      const userIcon = L.divIcon({
        className: 'user-icon',
        html: `<div class="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-md pulse"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });
      L.marker([userLocation.lat, userLocation.lng], { icon: userIcon }).addTo(mapRef.current);
    }
  }, [shops, selectedShop, userLocation]);

  // Pan to selected shop
  useEffect(() => {
    if (selectedShop && mapRef.current) {
      mapRef.current.flyTo([selectedShop.lat, selectedShop.lng], 15);
    }
  }, [selectedShop]);

  return <div ref={mapContainerRef} className="w-full h-full" />;
};

export default MapComponent;