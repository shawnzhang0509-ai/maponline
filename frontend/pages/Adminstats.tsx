import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

interface DailyShopStatItem {
  date: string;
  shop_id: string | number;
  shop_name?: string;
  sms: number;
  call: number;
  total: number;
}

const AdminStats: React.FC = () => {
  const [stats, setStats] = useState<DailyShopStatItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

  useEffect(() => {
    const fetchAllStats = async () => {
      try {
        const params = new URLSearchParams();
        if (startDate) params.set('start_date', startDate);
        if (endDate) params.set('end_date', endDate);
        const queryString = params.toString();
        const url = `${API_BASE_URL}/stats/daily-summary${queryString ? `?${queryString}` : ''}`;

        const res = await fetch(url);
        
        if (!res.ok) throw new Error('Failed to fetch daily summary stats');
        const data = await res.json();
        
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchAllStats();
  }, [API_BASE_URL, startDate, endDate]);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading daily summary...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Error: {error}</div>;

  const grandTotal = stats.reduce((sum, item) => sum + item.total, 0);
  const totalSms = stats.reduce((sum, item) => sum + item.sms, 0);
  const totalCall = stats.reduce((sum, item) => sum + item.call, 0);
  const uniqueShopCount = new Set(stats.map((item) => String(item.shop_id))).size;
  const uniqueDateCount = new Set(stats.map((item) => item.date)).size;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        📊 Daily Click Summary (All Shops)
      </h1>

      <div className="bg-white rounded-lg border p-4 mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full border rounded px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full border rounded px-3 py-2 text-sm"
          />
        </div>
        <div className="flex items-end">
          <button
            onClick={() => {
              setStartDate('');
              setEndDate('');
            }}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 rounded px-3 py-2 text-sm font-medium"
          >
            Clear Date Filters
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-blue-50 p-4 rounded-lg text-center border border-blue-200">
          <p className="text-blue-600 text-sm font-bold uppercase">Total SMS</p>
          <p className="text-3xl font-bold text-blue-800">{totalSms}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg text-center border border-green-200">
          <p className="text-green-600 text-sm font-bold uppercase">Total CALL</p>
          <p className="text-3xl font-bold text-green-800">{totalCall}</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg text-center border border-purple-200">
          <p className="text-purple-600 text-sm font-bold uppercase">Total Clicks</p>
          <p className="text-3xl font-bold text-purple-800">{grandTotal}</p>
        </div>
        <div className="bg-amber-50 p-4 rounded-lg text-center border border-amber-200">
          <p className="text-amber-700 text-sm font-bold uppercase">Shops</p>
          <p className="text-3xl font-bold text-amber-800">{uniqueShopCount}</p>
        </div>
        <div className="bg-slate-50 p-4 rounded-lg text-center border border-slate-200">
          <p className="text-slate-600 text-sm font-bold uppercase">Days</p>
          <p className="text-3xl font-bold text-slate-800">{uniqueDateCount}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shop</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SMS</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Call</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {stats.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">No data</td>
              </tr>
            ) : (
              stats.map((item) => (
                <tr key={`${item.date}-${item.shop_id}`} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {item.date}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    <div>{item.shop_name || 'Unknown Shop Name'}</div>
                    <div className="text-xs text-gray-400">ID: {item.shop_id}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.sms}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.call}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                    {item.total}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 hover:text-blue-900">
                    <Link to={`/stats/${item.shop_id}`}>View details →</Link>
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

export default AdminStats;