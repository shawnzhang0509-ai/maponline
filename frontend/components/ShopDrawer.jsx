import { Drawer } from 'vaul';

export default function ShopDrawer({ selectedShop, onClose }) {
  // If no selected shop, do not render.
  if (!selectedShop) return null;

  return (
    <Drawer.Root open={!!selectedShop} onClose={onClose}>
      <Drawer.Portal>
        {/* 1. Backdrop (click to close) */}
        <Drawer.Overlay className="fixed inset-0 bg-black/40 z-40" />
        
        {/* 2. Bottom drawer content */}
        <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl max-h-[85vh] flex flex-col outline-none">
          
          {/* Drag handle */}
          <div className="w-full flex items-center justify-center py-4 bg-gray-50 cursor-grab active:cursor-grabbing rounded-t-2xl">
            <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
          </div>

          {/* 3. Main content area */}
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
              {selectedShop.description || "No detailed description available."}
            </p>

            {/* Example action buttons */}
            <div className="mt-6 grid grid-cols-2 gap-4">
              <button className="bg-black text-white py-3 rounded-lg font-medium">
                📍 Navigate
              </button>
              <button className="bg-gray-100 text-gray-900 py-3 rounded-lg font-medium">
                📞 Call
              </button>
            </div>
            
            {/* Placeholder area */}
            <div className="h-40 mt-6 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400">
              More photos/reviews...
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}