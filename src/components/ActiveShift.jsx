import React, { useState, useEffect } from 'react';
import { 
  Package, 
  DollarSign, 
  Navigation, 
  Clock, 
  Plus, 
  CheckCircle2, 
  LogOut, 
  MapPin, 
  XCircle,
  ExternalLink,
  ChevronRight,
  Trash2,
  Coffee,
  Play,
  TrendingUp
} from 'lucide-react';
import { formatVND, formatTime, formatDuration } from '../utils/storage';
import { formatDistance, getMapUrl } from '../utils/geo';
import { sound } from '../utils/sound';

export default function ActiveShift({
  shift,
  currentDeliveringOrder,
  onAcceptOrder,
  onStartCompleteOrder,
  onCancelDeliveringOrder,
  onDeleteOrder,
  onRequestCheckout,
  onToggleBreak,
  gpsLoading,
}) {
  // Live elapsed timer for shift
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const orders = shift.orders || [];
  const totalOrders = orders.length;
  const totalFee = orders.reduce((sum, o) => sum + (o.fee || 0), 0);
  const totalDistance = orders.reduce((sum, o) => sum + (o.distanceKm || 0), 0);
  
  const shiftDurationMs = now - (shift.startTime || now);
  const currentBreakMs = shift.isOnBreak && shift.breakStartTime ? (now - shift.breakStartTime) : 0;
  const totalBreakMs = (shift.totalBreakDurationMs || 0) + currentBreakMs;
  const activeWorkDurationMs = Math.max(0, shiftDurationMs - totalBreakMs);
  
  const activeHours = activeWorkDurationMs / (1000 * 60 * 60);
  const avgPerHour = activeHours > 0 ? Math.round(totalFee / activeHours) : totalFee;

  const deliveringDurationMs = currentDeliveringOrder 
    ? now - (currentDeliveringOrder.pickupTime || now) 
    : 0;

  return (
    <div className="space-y-4">
      {/* Shift Overview Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Bắt đầu: <strong className="text-white">{formatTime(shift.startTime)}</strong></span>
          </div>

          <div className="flex items-center gap-1.5">
            {totalBreakMs > 60000 && (
              <span className="text-[11px] font-semibold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                ☕ Nghỉ: {formatDuration(totalBreakMs)}
              </span>
            )}
            <div className="flex items-center gap-1 font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 text-xs">
              <span>⏱️ Chạy thực:</span>
              <span>{formatDuration(activeWorkDurationMs)}</span>
            </div>
          </div>
        </div>

        {/* 3 Main Metrics */}
        <div className="grid grid-cols-3 gap-2 pt-3 text-center">
          <div className="bg-slate-950/60 p-2.5 rounded-2xl border border-slate-800/80">
            <span className="text-[10px] font-medium text-slate-400 flex items-center justify-center gap-1">
              <Package className="w-3 h-3 text-blue-400" /> Đơn xong
            </span>
            <p className="text-xl font-black text-white mt-0.5">
              {totalOrders}
            </p>
          </div>

          <div className="bg-slate-950/60 p-2.5 rounded-2xl border border-slate-800/80">
            <span className="text-[10px] font-medium text-slate-400 flex items-center justify-center gap-1">
              <DollarSign className="w-3 h-3 text-emerald-400" /> Tiền ship
            </span>
            <p className="text-lg font-black text-emerald-400 mt-0.5 truncate">
              {formatVND(totalFee)}
            </p>
          </div>

          <div className="bg-slate-950/60 p-2.5 rounded-2xl border border-slate-800/80">
            <span className="text-[10px] font-medium text-slate-400 flex items-center justify-center gap-1">
              <Navigation className="w-3 h-3 text-teal-400" /> Quãng đường
            </span>
            <p className="text-xl font-black text-teal-300 mt-0.5">
              {totalDistance.toFixed(1)} <span className="text-[10px] font-normal text-slate-400">km</span>
            </p>
          </div>
        </div>

        {/* Real-time Hourly Earnings Efficiency Pill */}
        <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs px-1 text-slate-300">
          <span className="flex items-center gap-1 text-slate-400 text-[11px]">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            Thu nhập trung bình mỗi giờ chạy:
          </span>
          <span className="font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">
            {formatVND(avgPerHour)}/h
          </span>
        </div>
      </div>

      {/* DELIVERY ACTION CENTER */}
      {currentDeliveringOrder ? (
        /* Status: ĐANG GIAO HÀNG */
        <div className="bg-gradient-to-b from-amber-500/15 via-slate-900 to-slate-900 border-2 border-amber-500/50 rounded-3xl p-5 shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-400 animate-ping" />
              <span className="text-xs font-black uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                Đang giao hàng
              </span>
            </div>
            <span className="font-mono text-xs font-bold text-amber-300 bg-slate-950/80 px-2 py-0.5 rounded-lg border border-slate-800">
              {formatDuration(deliveringDurationMs)}
            </span>
          </div>

          <h3 className="text-2xl font-black text-white tracking-tight mb-1">
            Đơn hàng #{currentDeliveringOrder.orderNumber}
          </h3>
          <p className="text-xs text-slate-400 flex items-center gap-1 mb-4">
            <Clock className="w-3 h-3 text-slate-400" />
            Nhận đơn lúc: <span className="text-slate-200 font-semibold">{formatTime(currentDeliveringOrder.pickupTime)}</span>
            {currentDeliveringOrder.pickupCoords && (
              <span className="text-emerald-400 ml-1.5 flex items-center gap-0.5">
                <MapPin className="w-3 h-3" /> Đã lưu GPS
              </span>
            )}
          </p>

          {/* Big Complete Order Button */}
          <button
            onClick={onStartCompleteOrder}
            disabled={gpsLoading}
            className="w-full py-5 rounded-2xl font-black text-xl bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-2xl shadow-emerald-600/40 active:scale-[0.98] transition flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {gpsLoading ? (
              <span className="animate-spin text-2xl">⏳</span>
            ) : (
              <CheckCircle2 className="w-7 h-7 stroke-[2.5]" />
            )}
            HOÀN THÀNH ĐƠN ✅
          </button>

          {/* Cancel Order */}
          <div className="text-center mt-3">
            <button
              onClick={onCancelDeliveringOrder}
              className="text-xs font-medium text-slate-400 hover:text-red-400 transition inline-flex items-center gap-1 py-1 px-2"
            >
              <XCircle className="w-3.5 h-3.5" />
              Hủy đơn này (nếu khách hủy / bấm nhầm)
            </button>
          </div>
        </div>
      ) : shift.isOnBreak ? (
        /* Status: ĐANG TẠM NGHỈ */
        <div className="bg-gradient-to-b from-amber-500/20 via-slate-900 to-slate-900 border-2 border-amber-500/60 rounded-3xl p-5 shadow-2xl text-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-300 mx-auto flex items-center justify-center text-2xl mb-2">
            ☕
          </div>
          <span className="text-xs font-black uppercase tracking-wider text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
            Đang tạm nghỉ
          </span>
          <h3 className="text-xl font-black text-white mt-2">
            Đã nghỉ: {formatDuration(currentBreakMs)}
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto mb-4">
            Thời gian nghỉ được trừ ra, <strong>không làm giảm</strong> tiền trung bình mỗi giờ (TB/h) của bạn.
          </p>
          <button
            onClick={onToggleBreak}
            className="w-full py-4.5 rounded-2xl font-black text-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400 hover:from-emerald-400 hover:to-teal-300 text-white shadow-xl shadow-emerald-600/30 active:scale-[0.98] transition flex items-center justify-center gap-2.5"
          >
            <Play className="w-6 h-6 fill-white stroke-none" />
            TIẾP TỤC CHẠY 🛵
          </button>
        </div>
      ) : (
        /* Status: RẢNH / CHỜ NHẬN ĐƠN */
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl text-center space-y-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Sẵn sàng nhận đơn mới
            </p>
            <button
              onClick={onAcceptOrder}
              disabled={gpsLoading}
              className="w-full py-5 rounded-2xl font-black text-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white shadow-2xl shadow-emerald-500/30 active:scale-[0.98] transition flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {gpsLoading ? (
                <span className="animate-spin text-2xl">⏳</span>
              ) : (
                <span className="text-3xl">🛵</span>
              )}
              NHẬN ĐƠN MỚI
            </button>
            <p className="text-[11px] text-slate-400 mt-2 flex items-center justify-center gap-1">
              <MapPin className="w-3 h-3 text-emerald-400" />
              Tự động lưu tọa độ nhận & đo quãng đường khi giao xong
            </p>
          </div>

          {/* NÚT TẠM NGHỈ */}
          <button
            onClick={onToggleBreak}
            className="w-full py-3 rounded-2xl bg-slate-800/90 hover:bg-slate-750 border border-slate-700/80 text-amber-300 hover:text-amber-200 font-bold text-sm transition active:scale-[0.98] flex items-center justify-center gap-2 shadow-md"
          >
            <Coffee className="w-4 h-4 text-amber-400" />
            TẠM NGHỈ (Ăn cơm / Uống nước / Đợi đơn)
          </button>
        </div>
      )}

      {/* TODAY'S COMPLETED ORDERS LIST */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <span>📦 Các đơn đã giao hôm nay</span>
            <span className="text-xs font-black bg-slate-800 text-emerald-400 px-2 py-0.5 rounded-full border border-slate-700">
              {totalOrders}
            </span>
          </h3>
          <span className="text-xs font-black text-emerald-400">
            {formatVND(totalFee)}
          </span>
        </div>

        {orders.length === 0 ? (
          <div className="py-8 text-center text-slate-400">
            <div className="text-3xl mb-1 opacity-60">🛵💨</div>
            <p className="text-xs font-medium">Chưa có đơn nào trong ca này.</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Bấm "Nhận đơn mới" để bắt đầu chuyến đầu tiên!</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80 max-h-72 overflow-y-auto no-scrollbar">
            {orders.slice().reverse().map((order) => {
              const mapUrl = getMapUrl(order.pickupCoords, order.deliveryCoords);
              return (
                <div key={order.id} className="py-3 flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700/60 flex items-center justify-center text-xs font-black text-slate-300">
                      #{order.orderNumber}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-emerald-400">
                          +{formatVND(order.fee)}
                        </span>
                        {order.distanceKm > 0 && (
                          <span className="text-[11px] font-semibold text-slate-400 bg-slate-800/80 px-1.5 py-0.2 rounded border border-slate-700/40">
                            {formatDistance(order.distanceKm)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                        <span>{formatTime(order.pickupTime)} – {formatTime(order.deliveryTime)}</span>
                        {order.note && <span className="text-slate-300">• {order.note}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {mapUrl && (
                      <a
                        href={mapUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-400 transition"
                        title="Xem lộ trình trên bản đồ"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <button
                      onClick={() => onDeleteOrder(order.id)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition"
                      title="Xóa đơn này"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CHECK-OUT BUTTON (KẾT THÚC CA) */}
      <div className="pt-2">
        <button
          onClick={onRequestCheckout}
          className="w-full py-4 rounded-2xl font-black text-base bg-slate-800/90 hover:bg-rose-950/40 text-slate-300 hover:text-rose-300 border border-slate-700/80 hover:border-rose-700/40 transition active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg"
        >
          <LogOut className="w-4 h-4 text-rose-400" />
          KẾT THÚC CA LÀM VIỆC (CHECK-OUT)
        </button>
      </div>
    </div>
  );
}
