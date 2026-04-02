import React from 'react';

interface HeaderProps {
  isSearching?: boolean;
  onSearch?: (keyword: string) => void;
}

const Header: React.FC<HeaderProps> = ({ isSearching, onSearch }) => {
  const [keyword, setKeyword] = React.useState('');

  const handleSearch = () => {
    const trimmed = keyword.trim();
    onSearch?.(trimmed);
  };

  const handleClear = () => {
    setKeyword('');
    onSearch?.('');
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSearch();
  };

  return (
    <header className="w-full flex items-center gap-2 sm:gap-4 px-4 sm:px-6 py-4 bg-white shadow-md z-50 sticky top-0">
      <h1 className="text-xl font-bold text-gray-900 leading-tight min-w-[130px]">Massage Shops NZ</h1>

      <div className="flex-1 min-w-0 mr-[68px] sm:mr-0">
        <div className="relative w-full">
          <input
            type="text"
            placeholder="Search by shop name..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={handleKeyPress}
            className="border border-gray-300 rounded-xl px-10 py-1 w-full focus:outline-none focus:ring-2 focus:ring-rose-400"
          />
          <button
            onClick={handleSearch}
            className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 flex items-center justify-center w-5 h-5"
            disabled={isSearching}
          >
            {isSearching ? (
              <span className="animate-spin inline-block w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full"></span>
            ) : (
              '🔍'
            )}
          </button>
          {keyword && (
            <button
              onClick={handleClear}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
