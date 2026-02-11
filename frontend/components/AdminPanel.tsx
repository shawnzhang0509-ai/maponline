
import React, { useState } from 'react';
import { X, Plus, Upload, Lock } from 'lucide-react';
import { ShopCreate, Shop } from '../types';

// const dmsToDecimal = (dms: string): number | null => {
//   const regex = /(\d+)°\s*(\d+)'?\s*([\d.]+)?"?\s*([NSEW])/i;
//   const match = dms.trim().match(regex);
//   if (!match) return null;
//   const [, deg, min, sec, dir] = match;
//   let decimal = parseFloat(deg) + parseFloat(min) / 60 + parseFloat(sec) / 3600;
//   if (['S', 'W'].includes(dir.toUpperCase())) decimal = -decimal;
//   return parseFloat(decimal.toFixed(6));
// };
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
    formData.append("badge_text", String(newShop.badge_text));
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

      onClose();

    } catch (err) {
      setError("Network error. Please try again.");
      console.error(err);
    } finally {
      setIsSubmitting(false); // 结束提交
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
                  if (latDec !== null && lngDec !== null) {
                    setNewShop(prev => ({
                      ...prev,
                      lat: latDec,
                      lng: lngDec,
                    }));
                  }
                }
              }}
            />
              {/* 可选：显示解析结果（帮助调试） */}
              {newShop.lat && newShop.lng && (
                <p className="text-xs text-gray-500 mt-1">
                  Parsed: {newShop.lat.toFixed(6)}, {newShop.lng.toFixed(6)}
                </p>
              )}
            </div>

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

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Badge Text</label>
              <input
                type="text"
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-rose-500 outline-none transition-all"
                placeholder="e.g. New Arrival, Hot, Promo"
                value={newShop.badge_text}
                onChange={e => setNewShop({ ...newShop, badge_text: e.target.value })}
              />
            </div>

            <label className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer">
              <input
                type="checkbox"
                className="w-5 h-5 accent-rose-500"
                checked={newShop.new_girls_last_15_days}
                onChange={e => setNewShop({ ...newShop, new_girls_last_15_days: e.target.checked })}
              />
              <span className="text-sm font-semibold text-gray-700">Display 🆕 New Badge</span>
            </label>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Photos</label>
              <div className="flex gap-2 flex-wrap mb-2">
                {(newShop.pictures as File[] | undefined)?.map((file, i) => (
                  <img
                    key={i}
                    src={file instanceof File ? URL.createObjectURL(file) : file}
                    className="w-16 h-16 object-cover rounded-lg border border-gray-100"
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
