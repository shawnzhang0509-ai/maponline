import React, { useState, useEffect } from 'react';
import { FiMessageCircle, FiX } from 'react-icons/fi'; // 需要安装 react-icons

interface FloatingContactButtonProps {
  onContactClick: () => void;
}

const FloatingContactButton: React.FC<FloatingContactButtonProps> = ({ onContactClick }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // 页面加载3秒后显示按钮
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <button
      onClick={onContactClick}
      className="fixed bottom-6 right-6 bg-green-600 text-white p-3 rounded-full shadow-lg hover:bg-green-700 transition-all duration-300"
      style={{ zIndex: 1000 }}
    >
      <FiMessageCircle size={24} />
    </button>
  );
};

export default FloatingContactButton;