import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shop } from '../types';

const MyAdsPage: React.FC = () => {
  const navigate = useNavigate();
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
  const username = localStorage.getItem('admin_username') || '';
  const token = localStorage.getItem('auth_token') || '';
  const isLoggedIn = localStorage.getItem('admin_logged_in') === 'true';

  useEffect(() => {
    if (!isLoggedIn || !token) {
      navigate('/');
      return;
    }

    const loadMine = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/shop/mine`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) throw new Error('Failed to load your ads');
        const data = await res.json();
        setShops(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    loadMine();
  }, [API_BASE_URL, isLoggedIn, navigate, token]);

  const total = useMemo(() => shops.length, [shops]);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading your ads...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Error: {error}</div>;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">📋 My Ads</h1>
          <p className="text-sm text-gray-500 mt-1">
            User: <span className="font-medium">{username || 'Unknown'}</span> · Total: {total}
          </p>
        </div>
        <Link
          to="/"
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700"
        >
          Back to Home
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shop</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {shops.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-5 text-center text-gray-500">
                  You don't have any ads yet. Add one from the home page after login.
                </td>
              </tr>
            ) : (
              shops.map((shop) => (
                <tr key={shop.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {shop.name}
                    <div className="text-xs text-gray-400">ID: {shop.id}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{shop.address}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{shop.phone}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <Link to={`/stats/${shop.id}`} className="text-blue-600 hover:text-blue-800 font-medium">
                      Stats →
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MyAdsPage;
