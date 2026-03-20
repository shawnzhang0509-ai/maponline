import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface Picture {
  url: string;
}

interface ImageGalleryProps {
  pictures: Picture[];
  baseUrl?: string;
  altText?: string;
  badgeText?: string;
  autoPlay?: boolean;
}

const ImageGallery: React.FC<ImageGalleryProps> = ({ 
  pictures, 
  baseUrl = '', 
  altText = 'Shop Image',
  badgeText,
  autoPlay = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // --- 状态：控制自动播放是否暂停 ---
  const [isAutoPlayPaused, setIsAutoPlayPaused] = useState(false);

  // --- Refs ---
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const isSwiping = useRef<boolean>(false);
  const thumbContainerRef = useRef<HTMLDivElement>(null);

  // 处理图片 URL 逻辑
  const getImageUrl = (rawUrl: string) => {
    if (!rawUrl) return '';
    if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) return rawUrl;
    
    const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const pathPrefix = rawUrl.startsWith('/') ? '' : '/uploads/';
    return `${cleanBase}${pathPrefix}${rawUrl}`;
  };

  // 打开画廊
  const openGallery = (index: number) => {
    setCurrentIndex(index);
    setIsOpen(true);
    // 打开全屏时暂停自动播放
    setIsAutoPlayPaused(true);
  };

  // 切换图片逻辑
  const nextImage = (e?: React.MouseEvent | React.KeyboardEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % pictures.length);
  };

  const prevImage = (e?: React.MouseEvent | React.KeyboardEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + pictures.length) % pictures.length);
  };

  // --- 自动播放核心逻辑 ---
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;

    // 只有满足以下条件才启动定时器
    if (autoPlay && !isOpen && !isAutoPlayPaused && pictures.length > 1) {
      timer = setInterval(() => {
        setCurrentIndex((prev) => {
          const next = (prev + 1) % pictures.length;
          
          // 同步滚动缩略图容器
          if (thumbContainerRef.current) {
            const container = thumbContainerRef.current;
            // 只有当容器存在且宽度有效时才滚动
            if (container.clientWidth > 0) {
              container.scrollTo({
                left: next * container.clientWidth,
                behavior: 'smooth'
              });
            }
          }
          
          return next;
        });
      }, 3000); // 3秒切换
    }

    // 清理函数：组件卸载或依赖变化时清除定时器
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [autoPlay, isOpen, isAutoPlayPaused, pictures.length]);

  // --- 同步 currentIndex 到 缩略图容器滚动位置 ---
  // 这个 effect 专门负责：当 currentIndex 变化（无论是自动还是手动），确保容器滚动到位
  useEffect(() => {
    if (thumbContainerRef.current && !isOpen) {
      const container = thumbContainerRef.current;
      const targetScroll = currentIndex * container.clientWidth;
      
      // 避免微小抖动：只有当距离超过一定阈值才滚动
      if (Math.abs(container.scrollLeft - targetScroll) > 5) {
        container.scrollTo({
          left: targetScroll,
          behavior: 'smooth'
        });
      }
    }
  }, [currentIndex, isOpen]);

  // --- 触摸事件处理 ---
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
    isSwiping.current = true;
    // 用户开始触摸，暂停自动播放
    setIsAutoPlayPaused(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping.current) return;
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!isSwiping.current) return;
    isSwiping.current = false;

    const distance = touchStartX.current - touchEndX.current;
    const threshold = 50; 

    if (distance > threshold) {
      nextImage();
    } else if (distance < -threshold) {
      prevImage();
    }
    
    touchStartX.current = 0;
    touchEndX.current = 0;
    
    // 注意：这里我们选择不自动恢复自动播放，以提升用户体验
    // 如果希望松手后继续播放，取消下面这行的注释
    // setIsAutoPlayPaused(false);
  };

  // 键盘控制
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') setIsOpen(false);
      if (e.key === 'ArrowRight') nextImage();
      if (e.key === 'ArrowLeft') prevImage();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // 防止背景滚动
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [isOpen]);

  if (!pictures || pictures.length === 0) return null;

  const firstImageUrl = getImageUrl(pictures[0].url);

  return (
    <>
      {/* --- 1. 缩略图展示区 --- */}
      <div 
        className="relative w-full max-w-[300px] mx-auto bg-gray-100 overflow-hidden group" 
        onClick={() => openGallery(currentIndex)}
        // 鼠标悬停暂停
        onMouseEnter={() => setIsAutoPlayPaused(true)}
        onMouseLeave={() => setIsAutoPlayPaused(false)}
      >
        {/* 可滑动的内部容器 */}
        <div 
          ref={thumbContainerRef}
          className="w-full h-64 md:h-80 flex overflow-x-auto snap-x snap-mandatory scrollbar-hide"
          onScroll={() => {
             // 手动滚动时更新 currentIndex
             if (!thumbContainerRef.current) return;
             const container = thumbContainerRef.current;
             const index = Math.round(container.scrollLeft / container.clientWidth);
             if (index !== currentIndex && index >= 0 && index < pictures.length) {
               setCurrentIndex(index);
               // 手动滚动也暂停自动播放
               setIsAutoPlayPaused(true);
             }
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{ 
            WebkitOverflowScrolling: 'touch',
            scrollBehavior: 'smooth' 
          }}
        >
          {pictures.map((pic, idx) => (
            <div 
              key={idx} 
              className="w-full h-full flex-shrink-0 snap-center relative"
            >
              <img 
                src={getImageUrl(pic.url)} 
                alt={`${altText} ${idx + 1}`}
                className="w-full h-full object-cover min-h-0 block select-none pointer-events-none"
                draggable={false}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  if(target.parentElement && idx === 0) {
                     target.parentElement.innerHTML = `<div class="w-full h-full flex items-center justify-center text-gray-400 bg-gray-200">Image ${idx+1}</div>`;
                  }
                }}
              />
              
              {idx === 0 && badgeText && (
                <span className="absolute top-4 left-4 px-3 py-1 bg-rose-500 text-white text-xs font-bold rounded-full shadow-lg uppercase tracking-wide z-10">
                  {badgeText}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* 底部小圆点 */}
        {pictures.length > 1 && (
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5 z-10 pointer-events-auto">
            {pictures.map((_, idx) => (
              <button
                key={idx}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(idx);
                  setIsAutoPlayPaused(true); // 点击暂停
                  if (thumbContainerRef.current) {
                    thumbContainerRef.current.scrollTo({
                      left: idx * thumbContainerRef.current.clientWidth,
                      behavior: 'smooth'
                    });
                  }
                }}
                className={`h-1.5 rounded-full transition-all duration-300 shadow-md ${
                  idx === currentIndex 
                    ? 'w-6 bg-rose-600/80 shadow-black/50'
                    : 'w-1.5 bg-black/40 hover:bg-black/60'
                }`}
                aria-label={`View image ${idx + 1}`}
              />
            ))}
          </div>
        )}

        {/* 悬停提示图标 */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/10 pointer-events-none">
           <div className="bg-white/90 p-2 rounded-full shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform">
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-gray-800">
               <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
             </svg>
           </div>
        </div>
        
        <style>{`
          .scrollbar-hide::-webkit-scrollbar { display: none; }
          .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        `}</style>
      </div>

      {/* --- 2. 全屏画廊模态框 --- */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center selection:none"
          onClick={() => setIsOpen(false)}
        >
          <button 
            onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all hover:scale-110 z-50"
            aria-label="Close gallery"
          >
            <X size={24} />
          </button>

          {pictures.length > 1 && (
            <button 
              onClick={(e) => { e.stopPropagation(); prevImage(); }}
              className="absolute left-4 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all hover:scale-110 z-50 hidden md:block"
              aria-label="Previous image"
            >
              <ChevronLeft size={32} />
            </button>
          )}

          <div 
            className="relative w-full h-full flex items-center justify-center p-4 md:p-10"
            onClick={(e) => e.stopPropagation()} 
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <img 
              src={getImageUrl(pictures[currentIndex].url)} 
              alt={`${altText} ${currentIndex + 1}`}
              className="max-w-full max-h-full object-contain shadow-2xl rounded-sm select-none pointer-events-none"
              draggable={false}
            />
          </div>

          {pictures.length > 1 && (
            <button 
              onClick={(e) => { e.stopPropagation(); nextImage(); }}
              className="absolute right-4 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all hover:scale-110 z-50 hidden md:block"
              aria-label="Next image"
            >
              <ChevronRight size={32} />
            </button>
          )}
          
          {pictures.length > 1 && (
            <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-2 z-50">
              {pictures.map((_, idx) => (
                <button
                  key={idx}
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    setCurrentIndex(idx); 
                    setIsAutoPlayPaused(true);
                  }}
                  className={`h-2 rounded-full transition-all duration-300 focus:outline-none ${
                    idx === currentIndex 
                      ? 'w-8 bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]'
                      : 'w-2 bg-white/40 hover:bg-white/70 hover:w-3'
                  }`}
                  aria-label={`View image ${idx + 1}`}
                />
              ))}
            </div>
          )}
          
          {pictures.length > 1 && (
            <>
              <div 
                className="absolute inset-y-0 left-0 w-1/4 z-40 cursor-w-resize" 
                onClick={(e) => { e.stopPropagation(); prevImage(); }} 
              />
              <div 
                className="absolute inset-y-0 right-0 w-1/4 z-40 cursor-e-resize" 
                onClick={(e) => { e.stopPropagation(); nextImage(); }} 
              />
            </>
          )}
        </div>
      )}
    </>
  );
};

export default ImageGallery;