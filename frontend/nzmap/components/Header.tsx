import React from 'react';

interface HeaderProps {
  isSearching?: boolean;
  isLoggedIn: boolean;
  username?: string | null;
  onLogin: () => void;
  onLogout: () => void;
  onSearch?: (keyword: string) => void;
}

const Header: React.FC<HeaderProps> = ({ isSearching, isLoggedIn, username, onLogin, onLogout, onSearch }) => {
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
    <header className="w-full flex flex-col sm:flex-row justify-between items-center px-6 py-4 bg-white shadow-md z-50 sticky top-0 gap-2">
      <div className="flex items-center gap-4 w-full sm:w-auto">
        <h1 className="text-xl font-bold text-gray-900">Massage Shops NZ</h1>

        {/* 搜索框 + 图标 + 清空按钮 */}
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="Search by shop name..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={handleKeyPress}
            className="border border-gray-300 rounded-xl px-10 py-1 w-full focus:outline-none focus:ring-2 focus:ring-rose-400"
          />

          {/* 搜索按钮图标 */}
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

          {/* 清空按钮 */}
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

      {!isLoggedIn ? (
        <button
          onClick={onLogin}
          className="bg-rose-500 text-white font-semibold px-4 py-2 rounded-xl shadow hover:bg-rose-600 transition-colors"
        >
          Login
        </button>
      ) : (
        <button
          onClick={onLogout}
          className="bg-rose-500 text-white px-4 py-2 rounded-xl shadow hover:bg-rose-600 transition-colors"
        >
          Logout
        </button>
      )}
    </header>
  );
};

export default Header;
