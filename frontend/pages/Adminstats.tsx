import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

// 定义单个店铺数据的类型
interface ShopStatItem {
  shop_id: string;
  shop_name?: string; // 如果后端能返回名字最好，没有也没事
  sms: number;
  call: number;
  total: number;
}

const AdminStats: React.FC = () => {
  const [stats, setStats] = useState<ShopStatItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

  useEffect(() => {
    const fetchAllStats = async () => {
      try {
        // 👇 注意：这里调用的是 /stats/all (或者 /stats)，而不是 /stats/:id
        const res = await fetch(`${API_BASE_URL}/stats/all`);
        
        if (!res.ok) throw new Error('Failed to fetch global stats');
        const data = await res.json();
        
        setStats(data); // 后端应该返回一个数组
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchAllStats();
  }, [API_BASE_URL]);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading global stats...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Error: {error}</div>;

  // 计算全站总数
  const grandTotal = stats.reduce((sum, item) => sum + item.total, 0);
  const totalSms = stats.reduce((sum, item) => sum + item.sms, 0);
  const totalCall = stats.reduce((sum, item) => sum + item.call, 0);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        📊 全站点击统计总览
      </h1>

      {/* 顶部汇总卡片 */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-blue-50 p-4 rounded-lg text-center border border-blue-200">
          <p className="text-blue-600 text-sm font-bold uppercase">总短信点击</p>
          <p className="text-3xl font-bold text-blue-800">{totalSms}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg text-center border border-green-200">
          <p className="text-green-600 text-sm font-bold uppercase">总电话点击</p>
          <p className="text-3xl font-bold text-green-800">{totalCall}</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg text-center border border-purple-200">
          <p className="text-purple-600 text-sm font-bold uppercase">全站总点击</p>
          <p className="text-3xl font-bold text-purple-800">{grandTotal}</p>
        </div>
      </div>

      {/* 数据表格 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">店铺 ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">短信 (SMS)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">电话 (Call)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">总点击</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {stats.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">暂无数据</td>
              </tr>
            ) : (
              stats.map((item) => (
                <tr key={item.shop_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {item.shop_name || item.shop_id}
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
                    {/* 点击这里跳转回刚才写的单个店铺详情页 */}
                    <Link to={`/stats/${item.shop_id}`}>查看详情 →</Link>
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