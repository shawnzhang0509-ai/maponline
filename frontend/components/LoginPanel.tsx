// components/LoginModal.tsx
import React, { useState } from 'react';
import { X, Lock } from 'lucide-react';

interface LoginModalProps {
  onLoginSuccess: (username: string) => void;
  onClose: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ onLoginSuccess, onClose }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // ✅ 从环境变量读取 API 基础 URL（HTTPS）
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

      if (!API_BASE_URL) {
        throw new Error('API base URL is not configured');
      }

      const params = new URLSearchParams({ uname: username, pwd: password });
      
      // ✅ 发送请求到正确的 HTTPS 地址
      const res = await fetch(`${API_BASE_URL}/login?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!res.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await res.json();

      if (data.success) {
        localStorage.setItem('admin_logged_in', 'true');
        localStorage.setItem('admin_username', username);
        onLoginSuccess(username);
        onClose();
      } else {
        setError('Invalid username or password');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Network error. Please check your connection.');
    }
  };

  return (
    <div className="fixed inset-0 z-[3000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Lock className="w-5 h-5 text-rose-500" />
              Admin Login
            </h2>
            <button onClick={onClose} className="hover:text-gray-500">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <input
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-500"
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-500"
              required
            />
            {error && <p className="text-rose-500 text-xs">{error}</p>}
            <button
              type="submit"
              className="w-full bg-rose-500 text-white py-3 rounded-xl font-bold hover:bg-rose-600 transition"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;