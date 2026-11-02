import React, { useState, useEffect } from 'react';
import { Check, X, MapPin, Navigation, DollarSign, Clock, AlertCircle } from 'lucide-react';
import { formatVND, formatTime, formatDuration } from '../utils/storage';
import { formatDistance } from '../utils/geo';
import { sound } from '../utils/sound';

const PRESET_FEES = [5, 10, 15, 20, 25, 30]; // Unit: nghìn đồng (5 = 5.000đ)

export default function CompleteOrderModal({
  order,
  deliveryCoords,
  distanceKm,
  gpsLoading,
  gpsError,
  onConfirm,
  onClose,
}) {
  const [selectedFeeUnits, setSelectedFeeUnits] = useState(20); // Default 20k
  const [customInput, setCustomInput] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [note, setNote] = useState('');
  const [manualDistance, setManualDistance] = useState(distanceKm || 0);

  useEffect(() => {
    if (distanceKm) {
      setManualDistance(distanceKm);
    }
  }, [distanceKm]);

  // Total amount in VND
  const currentFeeVND = isCustom 
    ? (parseFloat(customInput) || 0) * 1000 
    : selectedFeeUnits * 1000;

  const handleSelectPreset = (units) => {
    sound.playTap();
    setIsCustom(false);
    setSelectedFeeUnits(units);
    setCustomInput('');
  };

  const handleCustomChange = (e) => {
    const val = e.target.value.replace(/[^0-9.]/g, '');
    setCustomInput(val);
    setIsCustom(true);
    setSelectedFeeUnits(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (currentFeeVND <= 0) {
      alert('Vui lòng chọn hoặc nhập số tiền phí ship!');
      return;
    }
    sound.playCash();
    onConfirm({
      fee: currentFeeVND,
      distanceKm: parseFloat(manualDistance) || 0,
      note: note.trim(),
    });
  };

  const durationMs = Date.now() - (order.pickupTime || Date.now());

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-slate-900 border-t sm:border border-slate-700/80 rounded-t-3xl sm:rounded-3xl p-5 pb-8 sm:pb-5 shadow-2xl safe-bottom max-h-[92vh] overflow-y-auto no-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
              Trả đơn thành công
            </span>
            <h2 className="text-xl font-black text-white mt-1">
              Đơn #{order.orderNumber}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-full bg-slate-800 hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* GPS & Trip Metrics */}
        <div className="my-3.5 p-3.5 bg-slate-800/60 rounded-2xl border border-slate-700/60 grid grid-cols-2 gap-3 text-center">
          <div className="border-r border-slate-700/60 pr-2">
            <span className="text-xs text-slate-400 flex items-center justify-center gap-1 mb-1">
              <Navigation className="w-3.5 h-3.5 text-blue-400" />
              Quãng đường
            </span>
            {gpsLoading ? (
              <span className="text-xs text-amber-400 animate-pulse font-medium">Đang tính GPS...</span>
            ) : (
              <div className="flex items-center justify-center gap-1">
                <input
                  type="number"
                  step="0.1"
                  value={manualDistance}
                  onChange={(e) => setManualDistance(e.target.value)}
                  className="w-16 bg-slate-900/80 text-emerald-400 text-lg font-black text-center rounded-lg border border-slate-700 focus:border-emerald-500 outline-none py-0.5"
                />
                <span className="text-xs text-slate-400 font-semibold">km</span>
              </div>
            )}
            <p className="text-[10px] text-slate-500 mt-0.5">(chạm để sửa km nếu muốn)</p>
          </div>

          <div className="pl-2">
            <span className="text-xs text-slate-400 flex items-center justify-center gap-1 mb-1">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              Thời gian giao
            </span>
            <p className="text-lg font-black text-white">
              {formatDuration(durationMs)}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Từ {formatTime(order.pickupTime)}
            </p>
          </div>
        </div>

        {/* GPS Status note */}
        {gpsError && (
          <div className="mb-3 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-2 text-xs text-amber-300">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{gpsError} (bạn có thể tự điền km ở ô trên).</span>
          </div>
        )}

        {/* Amount Section */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              Tiền phí ship khách trả:
            </label>
            <span className="text-xl font-black text-emerald-400">
              {formatVND(currentFeeVND)}
            </span>
          </div>

          {/* Quick Preset Buttons (5, 10, 15, 20, 25, 30 nghìn đồng) */}
          <div className="grid grid-cols-3 gap-2.5 mb-3">
            {PRESET_FEES.map((units) => {
              const isSelected = !isCustom && selectedFeeUnits === units;
              return (
                <button
                  key={units}
                  type="button"
                  onClick={() => handleSelectPreset(units)}
                  className={`h-14 rounded-2xl font-black text-lg transition-all active:scale-95 flex flex-col items-center justify-center border ${
                    isSelected
                      ? 'bg-emerald-600 text-white border-emerald-400 shadow-lg shadow-emerald-700/50 scale-[1.02]'
                      : 'bg-slate-800/90 text-slate-200 border-slate-700 hover:bg-slate-750'
                  }`}
                >
                  <span className="leading-none text-xl">{units}k</span>
                  <span className="text-[10px] opacity-75 font-normal">
                    {units}.000 ₫
                  </span>
                </button>
              );
            })}
          </div>

          {/* Custom Input (Nghìn đồng) */}
          <div className="bg-slate-800/70 p-2.5 rounded-2xl border border-slate-700/80">
            <label className="block text-xs text-slate-400 font-medium mb-1.5">
              Hoặc nhập số tiền khác (đơn vị: <span className="text-emerald-400 font-bold">nghìn đồng</span>):
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder="Ví dụ: 35 (là 35.000 ₫)"
                  value={customInput}
                  onChange={handleCustomChange}
                  className={`w-full bg-slate-900 border text-white font-bold text-base px-3 py-2.5 rounded-xl outline-none transition ${
                    isCustom
                      ? 'border-emerald-500 ring-2 ring-emerald-500/30'
                      : 'border-slate-700'
                  }`}
                />
                <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-semibold">
                  nghìn đ
                </span>
              </div>
              {isCustom && customInput && (
                <span className="text-xs font-bold text-emerald-400 shrink-0">
                  = {formatVND(currentFeeVND)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Optional Note */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Ghi chú thêm (khách tip, tên khách... tùy chọn)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full bg-slate-800/50 border border-slate-700/60 text-slate-200 text-xs px-3 py-2 rounded-xl outline-none focus:border-slate-500"
          />
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          className="w-full py-4 rounded-2xl font-black text-lg bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-xl shadow-emerald-700/40 active:scale-[0.98] transition flex items-center justify-center gap-2"
        >
          <Check className="w-6 h-6 stroke-[3]" />
          LƯU ĐƠN (+{formatVND(currentFeeVND)})
        </button>
      </div>
    </div>
  );
}
