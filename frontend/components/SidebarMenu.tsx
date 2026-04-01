// src/components/SidebarMenu.tsx
import React from 'react';
import { Link } from 'react-router-dom';

// 定义一个类型，用于接收父组件传来的 props
type SidebarMenuProps = {
  isOpen: boolean; // 控制菜单是否打开
  onClose: () => void; // 关闭菜单的函数
  onAuthChanged?: () => void;
};

// SidebarMenu 组件
const SidebarMenu: React.FC<SidebarMenuProps> = ({ isOpen, onClose, onAuthChanged }) => {
  // 如果菜单没打开，就不渲染任何东西（或者渲染一个空的 div）
  if (!isOpen) return null;

  const isLoggedIn = localStorage.getItem('admin_logged_in') === 'true';
  const username = localStorage.getItem('admin_username') || '';

  const handleLogout = () => {
    localStorage.removeItem('admin_logged_in');
    localStorage.removeItem('admin_username');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('is_admin');
    onAuthChanged?.();
    onClose();
  };

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
              <Link to="/" onClick={onClose} className="block text-lg font-medium text-gray-800 hover:text-gray-600">
                首页
              </Link>
            </li>
            <li className="mb-2">
              <Link to="/my-ads" onClick={onClose} className="block text-lg font-medium text-gray-800 hover:text-gray-600">
                我的广告
              </Link>
            </li>
            <li className="mb-2">
              <Link to="/admin/stats" onClick={onClose} className="block text-lg font-medium text-gray-800 hover:text-gray-600">
                统计总览
              </Link>
            </li>
          </ul>

          <div className="mt-6 pt-4 border-t border-gray-200">
            {isLoggedIn ? (
              <div className="space-y-2">
                <p className="text-xs text-gray-500">
                  已登录：<span className="font-semibold text-gray-700">{username || 'Unknown'}</span>
                </p>
                <button
                  onClick={handleLogout}
                  className="w-full py-2 px-3 rounded-lg bg-rose-500 text-white text-sm font-semibold hover:bg-rose-600"
                >
                  Logout
                </button>
              </div>
            ) : (
              <p className="text-xs text-gray-400">请在首页顶部点击 Login 登录后管理广告。</p>
            )}
          </div>
        </nav>
      </div>
    </>
  );
};

export default SidebarMenu;