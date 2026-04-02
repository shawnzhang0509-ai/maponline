import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

interface StatsData {
  shop_id: string;
  shop_name?: string;
  sms: number;
  call: number;
  total: number;
}

interface DailyStatsItem {
  date: string;
  sms: number;
  call: number;
  total: number;
}

const ShopStats: React.FC = () => {
  const { shopId } = useParams<{ shopId: string }>();
  
  const currentShopId = shopId || 'shop_123';

  const [stats, setStats] = useState<StatsData | null>(null);
  const [dailyStats, setDailyStats] = useState<DailyStatsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/stats/${currentShopId}`);
        
        if (!res.ok) throw new Error('Failed to fetch stats');
        const data = await res.json();
        
        setStats(data);

        const dailyRes = await fetch(`${API_BASE_URL}/stats/${currentShopId}/daily`);
        if (dailyRes.ok) {
          const dailyData = await dailyRes.json();
          setDailyStats(dailyData.daily || []);
        } else {
          setDailyStats([]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, [currentShopId, API_BASE_URL]);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading stats...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Error: {error}</div>;
  if (!stats) return <div className="p-8 text-center text-gray-500">No data found</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        📊 Shop Statistics
        <span className="text-base font-semibold text-gray-700">
          {stats.shop_name || 'Unknown Shop Name'}
        </span>
        <span className="text-sm font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
           ID: {currentShopId}
        </span>
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-rose-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium uppercase">SMS Clicks</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">{stats.sms}</p>
            </div>
            <div className="p-3 bg-rose-100 rounded-full">
               <span className="text-2xl">💬</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium uppercase">Call Clicks</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">{stats.call}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
               <span className="text-2xl">📞</span>
            </div>
          </div>
        </div>

      </div>

      <div className="mt-6 bg-gray-800 text-white p-6 rounded-lg shadow-lg text-center">
        <p className="text-gray-400 text-sm uppercase">Total Clicks</p>
        <p className="text-4xl font-bold mt-2">{stats.total}</p>
      </div>

      <div className="mt-8 bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50">
          <h2 className="font-semibold text-gray-800">Daily Breakdown</h2>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SMS</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CALL</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {dailyStats.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-gray-500">No daily data</td>
              </tr>
            ) : (
              dailyStats.map((item) => (
                <tr key={item.date} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{item.date}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{item.sms}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{item.call}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{item.total}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      <div className="mt-6 text-center text-xs text-gray-400">
        <p>⚠️ Note: Data is stored in PostgreSQL Database.</p>
      </div>
    </div>
  );
};

export default ShopStats;