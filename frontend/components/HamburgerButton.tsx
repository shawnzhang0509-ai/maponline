import React from 'react';

interface HamburgerButtonProps {
  onClick: () => void;
}

const HamburgerButton: React.FC<HamburgerButtonProps> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      // 🔴 修改重点：z-50 改为 z-[9999]，并加上 pointer-events-auto
      className="fixed top-4 right-4 z-[9999] p-2 bg-white rounded-md shadow-md hover:bg-gray-100 transition-colors cursor-pointer pointer-events-auto"
      aria-label="打开菜单"
    >
      {/* 三条线图标 */}
      <div className="flex flex-col space-y-1.5">
        <span className="block w-6 h-0.5 bg-gray-600"></span>
        <span className="block w-6 h-0.5 bg-gray-600"></span>
        <span className="block w-6 h-0.5 bg-gray-600"></span>
      </div>
    </button>
  );
};

export default HamburgerButton;