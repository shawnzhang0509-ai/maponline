import React from 'react';

/** Minimal top bar for map home (title + search moved to map chrome). */
const Header: React.FC = () => {
  return (
    <header className="h-12 w-full shrink-0 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm z-50 sticky top-0" aria-hidden />
  );
};

export default Header;
