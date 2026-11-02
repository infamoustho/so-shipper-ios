import React from 'react';
import { X, Share, PlusSquare, Smartphone, CheckCircle, Wifi } from 'lucide-react';
import { sound } from '../utils/sound';

export default function IosInstallGuideModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-slate-900 border-t sm:border border-slate-700/80 rounded-t-3xl sm:rounded-3xl p-5 pb-8 sm:pb-5 shadow-2xl safe-bottom max-h-[92vh] overflow-y-auto no-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Smartphone className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-lg text-white">Cách cài lên iPhone (iOS)</h3>
          </div>
          <button
            onClick={() => {
              sound.playTap();
              onClose();
            }}
            className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Intro */}
        <div className="my-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-xs text-emerald-300">
          ✨ Ứng dụng là <strong>Progressive Web App (PWA)</strong> chuẩn iOS: Cài trực tiếp không cần App Store, không cần jailbreak, mở toàn màn hình không có thanh web, lưu dữ liệu offline 100%!
        </div>

        {/* 3 Steps */}
        <div className="space-y-3.5 my-4">
          {/* Step 1 */}
          <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-800/70 border border-slate-700/60">
            <div className="w-7 h-7 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-black text-sm shrink-0">
              1
            </div>
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                Mở link bằng trình duyệt Safari
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Mở trình duyệt <strong>Safari</strong> mặc định trên iPhone và truy cập địa chỉ ứng dụng này (khi máy tính và iPhone cùng kết nối một mạng Wi-Fi hoặc qua link deploy online).
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-800/70 border border-slate-700/60">
            <div className="w-7 h-7 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-black text-sm shrink-0">
              2
            </div>
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                Bấm nút Chia sẻ (Share) 
                <span className="p-1 rounded bg-slate-700 inline-flex items-center justify-center">
                  <Share className="w-3.5 h-3.5 text-blue-400" />
                </span>
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Ở thanh công cụ phía dưới cùng của Safari, bấm vào biểu tượng <strong>hình vuông có mũi tên hướng lên</strong>.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-800/70 border border-slate-700/60">
            <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black text-sm shrink-0">
              3
            </div>
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                Chọn "Thêm vào MH chính"
                <span className="p-1 rounded bg-slate-700 inline-flex items-center justify-center">
                  <PlusSquare className="w-3.5 h-3.5 text-emerald-400" />
                </span>
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Cuộn xuống trong menu chia sẻ, bấm chọn <strong>"Thêm vào Màn hình chính" (Add to Home Screen)</strong> và ấn nút <strong>"Thêm" (Add)</strong> ở góc trên bên phải.
              </p>
            </div>
          </div>
        </div>

        {/* Finished badge */}
        <div className="p-3 bg-slate-800/90 rounded-2xl border border-slate-700 flex items-center gap-2.5 text-xs text-slate-300">
          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>Biểu tượng <strong>"Sổ Shipper 🛵"</strong> sẽ xuất hiện trên màn hình chính iPhone của bạn, chạm mở ra chạy như app gốc!</span>
        </div>

        <button
          onClick={() => {
            sound.playTap();
            onClose();
          }}
          className="w-full mt-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition"
        >
          Đã hiểu, quay lại ứng dụng
        </button>
      </div>
    </div>
  );
}
