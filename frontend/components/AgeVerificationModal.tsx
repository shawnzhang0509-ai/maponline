import React, { useEffect } from 'react';
import { ShieldAlert, CheckCircle, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

interface AgeVerificationModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onReject: () => void;
}

const AgeVerificationModal: React.FC<AgeVerificationModalProps> = ({ isOpen, onConfirm, onReject }) => {
  if (!isOpen) return null;

  // 防止背景滚动
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* Header Image / Icon Area */}
        <div className="bg-gradient-to-br from-rose-500 to-orange-400 p-8 text-white text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          <ShieldAlert className="w-16 h-16 mx-auto mb-4 relative z-10 drop-shadow-lg" />
          <h2 className="text-2xl font-black relative z-10">Age Verification</h2>
          <p className="text-rose-100 mt-2 font-medium relative z-10">Restricted Content (18+)</p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div className="space-y-3">
            <p className="text-gray-700 leading-relaxed text-center">
              This website contains information about massage and spa services intended for adults only.
            </p>
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
              <p className="text-sm text-yellow-800 font-bold">
                ⚠️ You must be at least <span className="underline">18 years old</span> to enter.
              </p>
            </div>
          </div>

          <div className="text-center text-xs text-gray-400">
            By clicking "I am 18+", you agree to our{' '}
            <Link to="/terms" className="text-rose-600 hover:underline font-bold flex items-center justify-center gap-1 mt-1">
              Terms & Conditions <ExternalLink size={12} />
            </Link>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            <button
              onClick={onReject}
              className="py-3.5 px-4 rounded-xl border-2 border-gray-200 text-gray-500 font-bold hover:bg-gray-50 hover:border-gray-300 transition-all"
            >
              Exit
            </button>
            <button
              onClick={onConfirm}
              className="py-3.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-orange-500 text-white font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <CheckCircle size={20} />
              I am 18+
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgeVerificationModal;