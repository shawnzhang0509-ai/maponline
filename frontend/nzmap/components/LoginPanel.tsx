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
        const params = new URLSearchParams({ uname: username, pwd: password });
        
        const res = await fetch(`http://60.204.150.165:5793/user/login?${params.toString()}`,{ method: 'GET' });

        const data = await res.json();

        if (data.success) {
            localStorage.setItem('admin_logged_in', 'true');
            localStorage.setItem('admin_username', username);
            onLoginSuccess(username);
            onClose();
        } else {
            setError('Invalid username or password');
        }
    } catch {
        setError('Network error');
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
            <button onClick={onClose}>
              <X />
            </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <input
              placeholder="Username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border"
            />
            {error && <p className="text-rose-500 text-xs">{error}</p>}
            <button className="w-full bg-rose-500 text-white py-3 rounded-xl font-bold">
              Login
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
