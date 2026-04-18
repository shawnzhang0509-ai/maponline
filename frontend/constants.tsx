// src/constants.tsx

export const NZ_CENTER = { lat: -40.8485, lng: 174.7633 };

export type TagStyle = { icon: string; bg: string; text?: string };

// Keep this as the single source-of-truth for tag visuals.
export const TAG_CONFIG: Record<string, TagStyle> = {
  diamond: { icon: '💎', bg: 'bg-gradient-to-r from-blue-400 to-blue-600 text-white shadow-blue-300', text: 'Diamond' },
  vip: { icon: '👑', bg: 'bg-gradient-to-r from-amber-300 to-amber-500 text-amber-900 shadow-amber-200', text: 'VIP' },
  new: { icon: '🆕', bg: 'bg-gradient-to-r from-rose-500 to-red-600 text-white shadow-rose-300', text: 'New' },
  hot: { icon: '🔥', bg: 'bg-gradient-to-r from-orange-400 to-red-500 text-white shadow-orange-300', text: 'Hot' },
  fresh: { icon: '✨', bg: 'bg-gradient-to-r from-emerald-400 to-teal-500 text-white shadow-teal-200', text: 'Fresh' },
  nice: { icon: '💖', bg: 'bg-gradient-to-r from-pink-400 to-rose-400 text-white shadow-pink-200', text: 'Nice' },
  massage: { icon: '💆‍♀️', bg: 'bg-gradient-to-r from-purple-400 to-indigo-500 text-white shadow-purple-200', text: 'Massage' },
  thai: { icon: '🇹🇭', bg: 'bg-white text-gray-800 border border-gray-200 shadow-sm', text: 'Thai' },
  chinese: { icon: '🇨🇳', bg: 'bg-white text-gray-800 border border-gray-200 shadow-sm', text: 'Chinese' },
  japanese: { icon: '🇯🇵', bg: 'bg-white text-gray-800 border border-gray-200 shadow-sm', text: 'Japanese' },
  korean: { icon: '🇰🇷', bg: 'bg-white text-gray-800 border border-gray-200 shadow-sm', text: 'Korean' },
  promo: { icon: '🎁', bg: 'bg-gradient-to-r from-fuchsia-400 to-pink-500 text-white shadow-fuchsia-200', text: 'Promo' },
  spa: { icon: '🌿', bg: 'bg-gradient-to-r from-green-400 to-teal-500 text-white shadow-green-200', text: 'Spa' },
  // Sensual / adult retail — avoid teddy-bear (reads as kids’ toy)
  'adult doll seller': { icon: '💋', bg: 'bg-gradient-to-r from-rose-700 to-pink-700 text-white shadow-rose-400', text: 'Adult doll seller' },
  default: { icon: '', bg: 'bg-gray-800/90 text-white backdrop-blur-md shadow-gray-400', text: '' },
};

export const getTagStyle = (rawTag: string): TagStyle => {
  const tag = (rawTag || '').trim().toLowerCase();
  return TAG_CONFIG[tag] || TAG_CONFIG.default;
};