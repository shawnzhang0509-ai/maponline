import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { Shop } from '../types';

interface Props {
  shop: Shop;
  index: number;
  onChangeIndex: (i: number) => void;
  onClose: () => void;
}

const getImageUrl = (picture: any): string => {
  if (typeof picture === 'string') {
    // 如果是字符串，则直接返回
    return picture;
  }
  if (typeof picture === 'object' && typeof picture.url === 'string') {
    // 如果是对象且有 url 字段，则返回 url 字段
    return picture.url;
  }
  // 默认返回一个占位图
  return 'https://via.placeholder.com/400x300.png?text=No+Image';
};

const ImagePreviewModal: React.FC<Props> = ({
  shop,
  index,
  onChangeIndex,
  onClose,
}) => {
  const images = shop.pictures ?? [];

  // ESC 关闭
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (images.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[2000] bg-black/70 flex items-center justify-center">
      {/* 点击遮罩关闭 */}
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-4 overflow-hidden">
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 bg-black/60 text-white rounded-full p-2 hover:bg-black"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 主图 */}
        <div className="w-full aspect-video bg-black flex items-center justify-center">
          <img src={getImageUrl(images[index])} className="max-h-full max-w-full object-contain"/>
        </div>

        {/* 缩略图 */}
        <div className="flex gap-2 p-4 overflow-x-auto border-t">
          {images.map((img, i) => (
            <img
              key={i}
              src={getImageUrl(img)}
              onClick={() => onChangeIndex(i)}
              className={`h-16 w-24 object-cover rounded-lg cursor-pointer border-2 transition ${
                i === index
                  ? 'border-rose-500'
                  : 'border-transparent opacity-70 hover:opacity-100'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ImagePreviewModal;