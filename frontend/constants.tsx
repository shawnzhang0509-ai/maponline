// src/constants.tsx

// 1. 奥克兰中心坐标
export const NZ_CENTER = { lat: -40.8485, lng: 174.7633 }; 

// 2. 标签配置表 (已简化类型定义，避免编译错误)
export const TAG_CONFIG = {
  new: { 
    icon: '🆕', 
    text: 'New', 
    bg: 'bg-gradient-to-r from-red-500 to-pink-600 text-white border-red-400' 
  },
  diamond: { 
    icon: '💎', 
    text: 'Diamond', 
    bg: 'bg-gradient-to-r from-blue-400 to-indigo-600 text-white border-blue-300' 
  },
  vip: { 
    icon: '👑', 
    text: 'VIP', 
    bg: 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-yellow-300' 
  },
  hot: {
    icon: '🔥',
    text: 'Hot',
    bg: 'bg-gradient-to-r from-orange-500 to-red-600 text-white border-orange-400'
  },
  thai: {
    icon: '🇹🇭',
    text: 'Thai',
    bg: 'bg-gradient-to-r from-purple-400 to-pink-500 text-white border-purple-300'
  },
  chinese: {
    icon: '🇨🇳',
    text: 'Chinese',
    bg: 'bg-gradient-to-r from-red-600 to-yellow-500 text-white border-red-400'
  },
  spa: {
    icon: '🌿',
    text: 'Spa',
    bg: 'bg-gradient-to-r from-green-400 to-teal-500 text-white border-green-300'
  },
  default: { 
    icon: '🏷️', 
    text: '', 
    bg: 'bg-gray-200 text-gray-700 border-gray-300' 
  }
};