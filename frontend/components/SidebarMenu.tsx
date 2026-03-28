// src/components/SidebarMenu.tsx
import React from 'react';

// 定义一个类型，用于接收父组件传来的 props
type SidebarMenuProps = {
  isOpen: boolean; // 控制菜单是否打开
  onClose: () => void; // 关闭菜单的函数
};

// SidebarMenu 组件
const SidebarMenu: React.FC<SidebarMenuProps> = ({ isOpen, onClose }) => {
  // 如果菜单没打开，就不渲染任何东西（或者渲染一个空的 div）
  if (!isOpen) return null;

  return (
    <>
      {/* 遮罩层：点击这个半透明的层可以关闭菜单 */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />

      {/* 侧边栏本身 */}
      <div className="fixed top-0 right-0 w-64 h-full bg-white z-50 shadow-lg transform transition-transform duration-300 ease-in-out">
        {/* 关闭按钮 */}
        <button
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
          onClick={onClose}
        >
          &times; {/* 这是一个简单的关闭图标，你也可以用图标库里的 X 图标 */}
        </button>

        {/* 菜单项列表 */}
        <nav className="mt-12 px-4">
          <ul>
            <li className="mb-2">
              <a href="#" className="block text-lg font-medium text-gray-800 hover:text-gray-600">
                首页
              </a>
            </li>
            <li className="mb-2">
              <a href="#" className="block text-lg font-medium text-gray-800 hover:text-gray-600">
                关于我们
              </a>
            </li>
            <li className="mb-2">
              <a href="#" className="block text-lg font-medium text-gray-800 hover:text-gray-600">
                联系我们
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </>
  );
};

export default SidebarMenu;