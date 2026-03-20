import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface Picture {
  url: string;
}

interface ImageGalleryProps {
  pictures: Picture[];
  baseUrl?: string;
  altText?: string;
  badgeText?: string;
}

const ImageGallery: React.FC<ImageGalleryProps> = ({ 
  pictures, 
  baseUrl = '', 
  altText = 'Shop Image',
  badgeText 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

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
      {/* --- 1. 缩略图展示区 (主页面显示的部分) --- */}
      <div 
        className="relative w-full max-w-[300px] mx-auto bg-gray-100 overflow-hidden group cursor-pointer" 
        onClick={() => openGallery(0)}
      >
        <img 
          src={firstImageUrl} 
          alt={altText} 
          className="w-full h-64 md:h-80 object-cover min-h-0 block transition-transform duration-300 group-hover:scale-105"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            if(target.parentElement) {
              target.parentElement.innerHTML = `<div class="w-full h-64 md:h-80 flex items-center justify-center text-gray-400 bg-gray-100">图片加载失败</div>`;
            }
          }}
        />
        
        {/* Badge 标签 */}
        {badgeText && (
          <span className="absolute top-4 left-4 px-3 py-1 bg-rose-500 text-white text-xs font-bold rounded-full shadow-lg uppercase tracking-wide z-10">
            {badgeText}
          </span>
        )}

        {/* 👇 修复版：缩略图底部的小圆点 (增加了对比度) 👇 */}
        {pictures.length > 1 && (
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5 z-10 pointer-events-none">
            {pictures.map((_, idx) => (
              <div
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-300 shadow-md ${
                  idx === 0 
                    ? 'w-6 bg-rose-600/40 hover:bg-black/60 shadow-black/80'       // 选中：半透明黑色 + 明显黑阴影
                    : 'w-1.5 bg-black/40 hover:bg-black/60' // 未选中：半透明黑色 (在浅色背景上可见)
                }`}
              />
            ))}
          </div>
        )}
        {/* 👆 修复结束 👆 */}

        {/* 悬停提示图标 */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/10">
           <div className="bg-white/90 p-2 rounded-full shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform">
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-gray-800">
               <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
             </svg>
           </div>
        </div>
      </div>

      {/* --- 2. 全屏画廊模态框 (点击后显示) --- */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center selection:none"
          onClick={() => setIsOpen(false)}
        >
          {/* 关闭按钮 */}
          <button 
            onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all hover:scale-110 z-50"
            aria-label="Close gallery"
          >
            <X size={24} />
          </button>

          {/* 左侧切换箭头 */}
          {pictures.length > 1 && (
            <button 
              onClick={(e) => { e.stopPropagation(); prevImage(); }}
              className="absolute left-4 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all hover:scale-110 z-50 hidden md:block"
              aria-label="Previous image"
            >
              <ChevronLeft size={32} />
            </button>
          )}

          {/* 图片容器 */}
          <div 
            className="relative w-full h-full flex items-center justify-center p-4 md:p-10"
            onClick={(e) => e.stopPropagation()} 
          >
            <img 
              src={getImageUrl(pictures[currentIndex].url)} 
              alt={`${altText} ${currentIndex + 1}`}
              className="max-w-full max-h-full object-contain shadow-2xl rounded-sm select-none pointer-events-none"
              draggable={false}
            />
          </div>

          {/* 右侧切换箭头 */}
          {pictures.length > 1 && (
            <button 
              onClick={(e) => { e.stopPropagation(); nextImage(); }}
              className="absolute right-4 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all hover:scale-110 z-50 hidden md:block"
              aria-label="Next image"
            >
              <ChevronRight size={32} />
            </button>
          )}
          
          {/* 弹窗底部的小圆点指示器 (保持原样，因为背景是黑的，白色可见) */}
          {pictures.length > 1 && (
            <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-2 z-50">
              {pictures.map((_, idx) => (
                <button
                  key={idx}
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    setCurrentIndex(idx); 
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
          
          {/* 移动端左右侧隐形点击区 */}
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