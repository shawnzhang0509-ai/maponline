import { Drawer } from 'vaul';

export default function ShopDrawer({ selectedShop, onClose }) {
  // 如果没有选中的店铺，就不渲染
  if (!selectedShop) return null;

  return (
    <Drawer.Root open={!!selectedShop} onClose={onClose}>
      <Drawer.Portal>
        {/* 1. 背景遮罩 (点击这里关闭) */}
        <Drawer.Overlay className="fixed inset-0 bg-black/40 z-40" />
        
        {/* 2. 底部卡片主体 */}
        <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl max-h-[85vh] flex flex-col outline-none">
          
          {/* 拖动手柄 (那个小灰条，提示用户可以拖动) */}
          <div className="w-full flex items-center justify-center py-4 bg-gray-50 cursor-grab active:cursor-grabbing rounded-t-2xl">
            <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
          </div>

          {/* 3. 内容区域 (这里放你的店铺信息) */}
          <div className="p-6 overflow-y-auto flex-1">
            <h2 className="text-2xl font-bold text-gray-900">{selectedShop.name}</h2>
            
            <div className="mt-2 flex gap-2">
              {selectedShop.tags?.map((tag, i) => (
                <span key={i} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-md">
                  {tag}
                </span>
              ))}
            </div>

            <p className="mt-4 text-gray-600 leading-relaxed">
              {selectedShop.description || "暂无详细描述"}
            </p>

            {/* 示例按钮 */}
            <div className="mt-6 grid grid-cols-2 gap-4">
              <button className="bg-black text-white py-3 rounded-lg font-medium">
                📍 导航
              </button>
              <button className="bg-gray-100 text-gray-900 py-3 rounded-lg font-medium">
                📞 电话
              </button>
            </div>
            
            {/* 占位高度，测试滚动效果 */}
            <div className="h-40 mt-6 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400">
              更多图片/评论区域...
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}