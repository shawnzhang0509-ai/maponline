import React, { useEffect, useState } from 'react';

interface StatItem {
  shop_id: string;
  type: 'call' | 'sms';
  count: number;
}

const ShopStats: React.FC = () => {
  const [stats, setStats] = useState<StatItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Next.js 写法，注意环境变量名要改成 NEXT_PUBLIC_ 开头
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/shop/stats`);
        if (!res.ok) throw new Error('Failed to fetch stats');
        const data = await res.json();
        
        // 简单排序：按点击量从高到低
        const sortedData = data.sort((a: StatItem, b: StatItem) => b.count - a.count);
        setStats(sortedData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    
    // 可选：每 5 秒自动刷新一次数据
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, [API_BASE_URL]);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading stats...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Error: {error}</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        📊 Shop Click Statistics
        <span className="text-sm font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
          Live Memory Data (Resets on Restart)
        </span>
      </h1>

      {stats.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 p-4 rounded-lg">
          No clicks recorded yet. Try clicking SMS/Call buttons on the map!
        </div>
      ) : (
        <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="p-4 font-semibold text-gray-600">Shop ID</th>
                <th className="p-4 font-semibold text-gray-600">Action Type</th>
                <th className="p-4 font-semibold text-gray-600 text-right">Total Clicks</th>
                <th className="p-4 font-semibold text-gray-600 text-right">Visual Bar</th>
              </tr>
            </thead>
            <tbody>
              {stats.map((item, idx) => (
                <tr key={`${item.shop_id}-${item.type}`} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="p-4 font-mono text-sm text-gray-700">#{item.shop_id}</td>
                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                      item.type === 'sms' 
                        ? 'bg-rose-100 text-rose-700' 
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {item.type === 'sms' ? '💬 SMS' : '📞 Call'}
                    </span>
                  </td>
                  <td className="p-4 text-right font-bold text-gray-900 text-lg">{item.count}</td>
                  <td className="p-4 text-right">
                    <div className="w-32 h-2 bg-gray-100 rounded-full inline-block overflow-hidden align-middle">
                      <div 
                        className={`h-full rounded-full ${
                          item.type === 'sms' ? 'bg-rose-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${Math.min(item.count * 10, 100)}%` }} // 简单可视化：每个点击占 10%，最大 100%
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      <div className="mt-6 text-center text-xs text-gray-400">
        <p>⚠️ Note: Data is stored in server memory. It will be lost if the backend restarts.</p>
      </div>
    </div>
  );
};

export default ShopStats;