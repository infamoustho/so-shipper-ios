import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { 
  Trophy, 
  Package, 
  DollarSign, 
  Navigation, 
  Clock, 
  Copy, 
  FileSpreadsheet, 
  Check, 
  X,
  Share2
} from 'lucide-react';
import { formatVND, formatTime, formatDate, formatDuration, generateShareSummary, exportShiftToCSV } from '../utils/storage';
import { sound } from '../utils/sound';

export default function CheckoutModal({ shift, onConfirmCheckout, onClose }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    sound.playCheckout();
    // Fire confetti celebration
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (e) {
      console.warn(e);
    }
  }, []);

  const endTime = Date.now();
  const totalDurationMs = endTime - (shift.startTime || Date.now());
  const currentBreak = shift.isOnBreak && shift.breakStartTime ? (endTime - shift.breakStartTime) : 0;
  const breakDurationMs = (shift.totalBreakDurationMs || 0) + currentBreak;
  const activeWorkDurationMs = Math.max(0, totalDurationMs - breakDurationMs);

  const orders = shift.orders || [];
  const totalOrders = orders.length;
  const totalFee = orders.reduce((sum, o) => sum + (o.fee || 0), 0);
  const totalDistance = orders.reduce((sum, o) => sum + (o.distanceKm || 0), 0);
  const avgPerOrder = totalOrders > 0 ? Math.round(totalFee / totalOrders) : 0;
  
  const activeHours = activeWorkDurationMs / (1000 * 60 * 60);
  const avgPerHour = activeHours > 0 ? Math.round(totalFee / activeHours) : totalFee;

  const handleCopyZalo = () => {
    sound.playTap();
    const tempShift = { 
      ...shift, 
      endTime, 
      totalBreakDurationMs: breakDurationMs,
      isOnBreak: false 
    };
    const text = generateShareSummary(tempShift);
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handleExportCSV = () => {
    sound.playTap();
    const tempShift = { 
      ...shift, 
      endTime, 
      totalBreakDurationMs: breakDurationMs,
      isOnBreak: false 
    };
    exportShiftToCSV(tempShift);
  };

  const handleFinalConfirm = () => {
    sound.playTap();
    onConfirmCheckout(endTime);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-slate-900 border-t sm:border border-slate-700/80 rounded-t-3xl sm:rounded-3xl p-5 pb-8 sm:pb-5 shadow-2xl safe-bottom max-h-[94vh] overflow-y-auto no-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Celebration Header */}
        <div className="text-center pt-2 pb-4">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-500 to-yellow-300 mx-auto flex items-center justify-center shadow-lg shadow-amber-500/30 mb-3 text-3xl">
            🏆
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
            Tổng kết ca hôm nay
          </span>
          <h2 className="text-2xl font-black text-white mt-1.5">
            Chúc mừng bạn đã hoàn thành ca!
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {formatDate(shift.startTime)} • {formatTime(shift.startTime)} – {formatTime(endTime)} ({formatDuration(totalDurationMs)})
          </p>
          {breakDurationMs > 60000 && (
            <div className="flex items-center justify-center gap-2 mt-1.5 text-[11px]">
              <span className="text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                ☕ Đã nghỉ: {formatDuration(breakDurationMs)}
              </span>
              <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                ⏱️ Chạy thực: {formatDuration(activeWorkDurationMs)}
              </span>
            </div>
          )}
        </div>

        {/* Big Earnings Highlight Card */}
        <div className="bg-gradient-to-br from-emerald-600/30 via-slate-800 to-slate-900 border border-emerald-500/30 rounded-3xl p-5 text-center mb-4 shadow-xl">
          <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
            Tổng tiền phí ship thu được
          </p>
          <p className="text-4xl sm:text-5xl font-black text-white mt-1 tracking-tight">
            {formatVND(totalFee)}
          </p>
          <div className="flex items-center justify-center gap-4 mt-3 pt-3 border-t border-slate-700/60 text-xs text-slate-300">
            <span>TB/đơn: <strong className="text-emerald-400 font-bold">{formatVND(avgPerOrder)}</strong></span>
            <span>•</span>
            <span>TB/giờ chạy: <strong className="text-emerald-400 font-bold">{formatVND(avgPerHour)}/h</strong></span>
          </div>
          {breakDurationMs > 60000 && (
            <p className="text-[10px] text-slate-400 mt-1.5 italic">
              *(Đã tự động loại trừ {formatDuration(breakDurationMs)} tạm nghỉ để tính đúng thu nhập TB/h)*
            </p>
          )}
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-slate-800/70 border border-slate-700/60 p-3.5 rounded-2xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-slate-400 font-medium">Số đơn giao</p>
              <p className="text-2xl font-black text-white">{totalOrders} <span className="text-xs font-normal text-slate-400">đơn</span></p>
            </div>
          </div>

          <div className="bg-slate-800/70 border border-slate-700/60 p-3.5 rounded-2xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold">
              <Navigation className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-slate-400 font-medium">Tổng quãng đường</p>
              <p className="text-2xl font-black text-white">{totalDistance.toFixed(1)} <span className="text-xs font-normal text-slate-400">km</span></p>
            </div>
          </div>
        </div>

        {/* Quick Actions (Zalo & CSV) */}
        <div className="grid grid-cols-2 gap-2.5 mb-5">
          <button
            onClick={handleCopyZalo}
            className={`py-3 px-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition active:scale-95 ${
              copied
                ? 'bg-blue-600 text-white border-blue-400'
                : 'bg-slate-800 hover:bg-slate-750 text-slate-200 border-slate-700'
            }`}
          >
            {copied ? <Check className="w-4 h-4 text-white" /> : <Share2 className="w-4 h-4 text-blue-400" />}
            {copied ? 'Đã sao chép!' : 'Gửi tóm tắt Zalo'}
          </button>

          <button
            onClick={handleExportCSV}
            className="py-3 px-3 rounded-2xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-2 transition active:scale-95"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            Xuất file Excel
          </button>
        </div>

        {/* Final Check-out Button */}
        <div className="flex flex-col gap-2">
          <button
            onClick={handleFinalConfirm}
            className="w-full py-4 rounded-2xl font-black text-lg bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-xl shadow-red-900/40 active:scale-[0.98] transition flex items-center justify-center gap-2"
          >
            <Check className="w-6 h-6 stroke-[3]" />
            KẾT THÚC & LƯU CA LÀM VIỆC
          </button>

          <button
            onClick={onClose}
            className="w-full py-2.5 text-xs font-semibold text-slate-400 hover:text-white"
          >
            Quay lại (chưa muốn kết thúc ca)
          </button>
        </div>
      </div>
    </div>
  );
}
