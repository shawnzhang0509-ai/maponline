import React, { useState } from 'react';
import { X, Upload } from 'lucide-react';
import { ShopCreate, Shop } from '../types';

interface AdminPanelProps {
  onAddShop: (shop: Shop) => void;
  onClose: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onAddShop, onClose }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const [newShop, setNewShop] = useState<Partial<ShopCreate>>({
    name: '',
    address: '',
    phone: '',
    lat: -36.8485,
    lng: 174.7633,
    new_girls_last_15_days: false,
    badge_text: '',
    pictures: []
  });

  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShop.name || !newShop.address || !newShop.phone || !newShop.lat || !newShop.lng) return;

    setIsSubmitting(true); 

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
    const add_api_url = `${API_BASE_URL}/shop/add`;
    const formData = new FormData();
    
    formData.append("name", newShop.name!);
    formData.append("address", newShop.address!);
    formData.append("phone", newShop.phone!);
    formData.append("lat", String(newShop.lat));
    formData.append("lng", String(newShop.lng));
    
    const tagsString = tags.join(",");
    formData.append("badge_text", tagsString); 
    
    formData.append("new_girls_last_15_days", String(newShop.new_girls_last_15_days || false));

    (newShop.pictures as File[] | undefined)?.forEach(file => {
      if (file instanceof File) formData.append("pictures", file);
    });

    try {
      const res = await fetch(add_api_url, { method: "POST", body: formData });
      const result = await res.json();

      if (!res.ok) {
        setError(result.error || "Failed to add shop");
        setIsSubmitting(false);
        return;
      }

      onAddShop(result);

      setNewShop({
        name: '',
        address: '',
        phone: '',
        lat: -36.8485,
        lng: 174.7633,
        new_girls_last_15_days: false,
        badge_text: '',
        pictures: []
      });
      setTags([]);
      setTagInput("");
      onClose();

    } catch (err) {
      setError("Network error. Please try again.");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setNewShop(prev => ({ ...prev, pictures: [...prev.pictures, ...Array.from(files)] }));
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center">
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300 max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-gray-900">Add New Shop</h2>
          <button onClick={onClose} className="p-2 -mr-2 text-gray-400">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto no-scrollbar">
          <div className="space-y-4">
            {/* Shop Name */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Shop Name</label>
              <input
                required
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-rose-500 outline-none transition-all"
                value={newShop.name}
                onChange={e => setNewShop({ ...newShop, name: e.target.value })}
                placeholder="e.g. 268 Neilson Street"
              />
            </div>

            {/* Address */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Full Address</label>
              <input
                required
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-rose-500 outline-none transition-all"
                value={newShop.address}
                onChange={e => setNewShop({ ...newShop, address: e.target.value })}
                placeholder="For SMS template"
              />
            </div>

            {/* ✅ Tags: 内嵌式输入框 (像搜索框一样) */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                Tags / Badges
              </label>
              <div 
                className={`
                  flex flex-wrap items-center gap-2 
                  w-full px-3 py-2 
                  bg-gray-50 border-2 
                  rounded-xl 
                  transition-all outline-none
                  ${tagInput ? 'border-rose-500 ring-2 ring-rose-100' : 'border-transparent focus-within:border-rose-500 focus-within:ring-2 focus-within:ring-rose-100'}
                `}
              >
                {/* 已选择的标签列表 */}
                {tags.map((tag, idx) => (
                  <span 
                    key={idx} 
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-100 text-rose-700 text-xs font-bold animate-in fade-in zoom-in duration-200"
                  >
                    {tag}
                    <button 
                      type="button" 
                      onClick={() => setTags(tags.filter(t => t !== tag))}
                      className="hover:bg-rose-200 rounded-full p-0.5 transition-colors"
                    >
                      <X size={12} strokeWidth={3} />
                    </button>
                  </span>
                ))}

                {/* 实际输入的 Input，无边框，融入背景 */}
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const val = tagInput.trim();
                      if (val && !tags.includes(val)) {
                        setTags([...tags, val]);
                        setTagInput("");
                      }
                    } else if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
                      // 按退格键删除最后一个标签
                      setTags(tags.slice(0, -1));
                    }
                  }}
                  placeholder={tags.length === 0 ? "Type & Enter (e.g. 24h, Thai)" : ""}
                  className="flex-1 min-w-[120px] bg-transparent outline-none text-sm text-gray-700 placeholder-gray-400 py-1"
                />
              </div>
              <p className="text-[10px] text-gray-400 mt-1 ml-1">Press Enter to add, Backspace to remove last.</p>
            </div>

            {/* Coordinates */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                Coordinates (Paste from Google Maps)
              </label>
             <input
              type="text"
              placeholder="e.g. 36°55'33.2S 174°48'09.5E"
              className="w-full px-4 py-3 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-rose-500 outline-none transition-all font-mono text-sm"
              onChange={(e) => {
                const value = e.target.value;
                const parts = value.split(/\s+/).filter(p => p.trim());
                if (parts.length >= 2) {
                  const latDec = parseFloat(parts[0]);
                  const lngDec = parseFloat(parts[1]);
                  if (!isNaN(latDec) && !isNaN(lngDec)) {
                    setNewShop(prev => ({ ...prev, lat: latDec, lng: lngDec }));
                  }
                }
              }}
            />
              {newShop.lat && newShop.lng && (
                <p className="text-xs text-gray-500 mt-1">
                  Parsed: {newShop.lat.toFixed(6)}, {newShop.lng.toFixed(6)}
                </p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Phone Number</label>
              <input
                required
                type="tel"
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-rose-500 outline-none transition-all"
                value={newShop.phone}
                onChange={e => setNewShop({ ...newShop, phone: e.target.value })}
                placeholder="Mobile number for SMS"
              />
            </div>

            {/* New Badge Checkbox */}
            <label className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer">
              <input
                type="checkbox"
                className="w-5 h-5 accent-rose-500"
                checked={newShop.new_girls_last_15_days}
                onChange={e => setNewShop({ ...newShop, new_girls_last_15_days: e.target.checked })}
              />
              <span className="text-sm font-semibold text-gray-700">Display 🆕 New Badge</span>
            </label>

            {/* Photos */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Photos</label>
              <div className="flex gap-2 flex-wrap mb-2">
                {(newShop.pictures as File[] | undefined)?.map((file, i) => (
                  <img
                    key={i}
                    src={file instanceof File ? URL.createObjectURL(file) : typeof file === 'string' ? file : ''}
                    className="w-16 h-16 object-cover rounded-lg border border-gray-100"
                    alt="preview"
                  />
                ))}
              </div>
              <label className="flex items-center justify-center gap-2 w-full p-4 border-2 border-dashed border-gray-200 rounded-xl text-gray-500 hover:text-rose-500 hover:border-rose-500 transition-all cursor-pointer">
                <Upload className="w-5 h-5" />
                <span className="text-sm font-medium">Upload Image</span>
                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full bg-rose-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-rose-200 active:scale-95 transition-transform sticky bottom-0
              ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isSubmitting ? "Submitting..." : "Add Shop to Database"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminPanel;