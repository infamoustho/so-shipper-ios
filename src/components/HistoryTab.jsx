import React, { useState } from 'react';
import { 
  Calendar, 
  Package, 
  DollarSign, 
  Navigation, 
  Clock, 
  ChevronDown, 
  ChevronUp, 
  Share2, 
  FileSpreadsheet, 
  Trash2,
  Check
} from 'lucide-react';
import { 
  formatVND, 
  formatTime, 
  formatDate, 
  formatDuration, 
  generateShareSummary, 
  exportShiftToCSV, 
  deleteShiftFromHistory 
} from '../utils/storage';
import { formatDistance } from '../utils/geo';
import { sound } from '../utils/sound';

export default function HistoryTab({ history, onHistoryUpdate }) {
  const [expandedShiftId, setExpandedShiftId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  // Compute all-time stats
  const totalDays = history.length;
  const totalOrders = history.reduce((sum, s) => sum + (s.orders?.length || 0), 0);
  const totalEarnings = history.reduce(
    (sum, s) => sum + (s.orders || []).reduce((sub, o) => sub + (o.fee || 0), 0),
    0
  );
  const totalKm = history.reduce(
    (sum, s) => sum + (s.orders || []).reduce((sub, o) => sub + (o.distanceKm || 0), 0),
    0
  );

  const toggleExpand = (id) => {
    sound.playTap();
    setExpandedShiftId(expandedShiftId === id ? null : id);
  };

  const handleCopy = (shift) => {
    sound.playTap();
    const text = generateShareSummary(shift);
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(shift.id);
      setTimeout(() => setCopiedId(null), 2500);
    });
  };

  const handleDelete = (shiftId) => {
    if (confirm('Bạn có chắc muốn xóa bản ghi ca này?')) {
      sound.playTap();
      const updated = deleteShiftFromHistory(shiftId);
      onHistoryUpdate(updated);
    }
  };

  return (
    <div className="space-y-4">
      {/* All-time Summary Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 border border-slate-800 rounded-3xl p-4 shadow-xl">
        <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-3 flex items-center gap-1.5">
          <span>📊</span> Tổng quan tích lũy
        </h3>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
            <span className="text-[11px] text-slate-400 font-medium">Tổng thu nhập</span>
            <p className="text-2xl font-black text-emerald-400 mt-0.5 truncate">
              {formatVND(totalEarnings)}
            </p>
          </div>
          <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
            <span className="text-[11px] text-slate-400 font-medium">Tổng số đơn</span>
            <p className="text-2xl font-black text-white mt-0.5">
              {totalOrders} <span className="text-xs font-normal text-slate-400">đơn</span>
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 text-xs text-slate-300">
          <div className="flex items-center gap-1.5 bg-slate-950/40 px-2.5 py-1.5 rounded-xl border border-slate-800/60">
            <Calendar className="w-3.5 h-3.5 text-blue-400" />
            <span>Đã chạy: <strong className="text-white">{totalDays}</strong> ngày</span>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-950/40 px-2.5 py-1.5 rounded-xl border border-slate-800/60">
            <Navigation className="w-3.5 h-3.5 text-teal-400" />
            <span>Quãng đường: <strong className="text-white">{totalKm.toFixed(1)}</strong> km</span>
          </div>
        </div>
      </div>

      {/* Shifts History List */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Calendar className="w-4 h-4 text-emerald-400" />
          <span>Lịch sử các ngày làm việc</span>
        </h3>

        {history.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center text-slate-500">
            <div className="text-3xl mb-2">📋</div>
            <p className="text-sm font-medium">Chưa có ca nào được lưu.</p>
            <p className="text-xs text-slate-500 mt-1">
              Khi bạn kết thúc ca (Check-out), dữ liệu sẽ tự động lưu vào đây.
            </p>
          </div>
        ) : (
          history.map((shift) => {
            const isExpanded = expandedShiftId === shift.id;
            const orders = shift.orders || [];
            const shiftTotalFee = orders.reduce((sum, o) => sum + (o.fee || 0), 0);
            const shiftTotalKm = orders.reduce((sum, o) => sum + (o.distanceKm || 0), 0);
            const durationMs = shift.endTime ? shift.endTime - shift.startTime : 0;

            return (
              <div
                key={shift.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg transition"
              >
                {/* Header item */}
                <div
                  onClick={() => toggleExpand(shift.id)}
                  className="p-4 cursor-pointer hover:bg-slate-850 transition flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-white text-base">
                        {formatDate(shift.startTime)}
                      </h4>
                      <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        {orders.length} đơn
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {formatTime(shift.startTime)} – {shift.endTime ? formatTime(shift.endTime) : 'Chưa rõ'} ({formatDuration(durationMs)}) • {shiftTotalKm.toFixed(1)} km
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-base font-black text-emerald-400">
                      {formatVND(shiftTotalFee)}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t border-slate-800 bg-slate-950/70 p-4 space-y-3">
                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopy(shift)}
                        className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 ${
                          copiedId === shift.id
                            ? 'bg-blue-600 text-white border-blue-400'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                        }`}
                      >
                        {copiedId === shift.id ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5 text-blue-400" />}
                        {copiedId === shift.id ? 'Đã sao chép' : 'Gửi Zalo'}
                      </button>

                      <button
                        onClick={() => exportShiftToCSV(shift)}
                        className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                        Xuất Excel
                      </button>

                      <button
                        onClick={() => handleDelete(shift.id)}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-slate-700 transition"
                        title="Xóa ca này"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Orders list in this shift */}
                    <div className="divide-y divide-slate-850 pt-1">
                      {orders.map((o, idx) => (
                        <div key={idx} className="py-2 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-400">#{o.orderNumber || idx + 1}</span>
                            <span className="text-slate-300 font-semibold">{formatTime(o.pickupTime)} - {formatTime(o.deliveryTime)}</span>
                            {o.note && <span className="text-slate-500 italic">({o.note})</span>}
                          </div>
                          <div className="flex items-center gap-2">
                            {o.distanceKm > 0 && (
                              <span className="text-[11px] text-slate-400">
                                {formatDistance(o.distanceKm)}
                              </span>
                            )}
                            <span className="font-bold text-emerald-400">
                              {formatVND(o.fee)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
