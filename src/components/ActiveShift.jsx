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
  TrendingUp,
  ClipboardPaste,
  HelpCircle,
  X
} from 'lucide-react';
import { formatVND, formatTime, formatDuration } from '../utils/storage';
import { 
  formatDistance, 
  getMapUrl, 
  openGoogleMapsNavigation, 
  openAppleMapsNavigation,
  parseLocationInput,
  isCoordinateString 
} from '../utils/geo';
import { sound } from '../utils/sound';

export default function ActiveShift({
  shift,
  deliveringOrders = [],
  onUpdateDeliveringOrder,
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
  const [showOfflineGuide, setShowOfflineGuide] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const orders = shift.orders || [];
  const totalOrders = orders.length;
  const totalFee = orders.reduce((sum, o) => sum + (o.fee || 0), 0);
  const totalCod = orders.reduce((sum, o) => sum + (o.codAmount || 0), 0);
  const totalDistance = orders.reduce((sum, o) => sum + (o.distanceKm || 0), 0);
  
  const shiftDurationMs = now - (shift.startTime || now);
  const currentBreakMs = shift.isOnBreak && shift.breakStartTime ? (now - shift.breakStartTime) : 0;
  const totalBreakMs = (shift.totalBreakDurationMs || 0) + currentBreakMs;
  const activeWorkDurationMs = Math.max(0, shiftDurationMs - totalBreakMs);
  
  const activeHours = activeWorkDurationMs / (1000 * 60 * 60);
  const avgPerHour = activeHours > 0 ? Math.round(totalFee / activeHours) : totalFee;

  // Handle changing address for a specific delivering order
  const handleUpdateAddress = (order, val) => {
    if (!order || !onUpdateDeliveringOrder) return;
    onUpdateDeliveringOrder({
      ...order,
      destinationAddress: val,
    });
  };

  // Handle changing COD amount (in thousands VND) for a specific delivering order
  const handleUpdateCod = (order, unitsStr) => {
    if (!order || !onUpdateDeliveringOrder) return;
    const cleaned = unitsStr.replace(/[^0-9.]/g, '');
    const codVND = (parseFloat(cleaned) || 0) * 1000;
    onUpdateDeliveringOrder({
      ...order,
      codAmount: codVND,
      _codInput: cleaned,
    });
  };

  // Handle paste address from clipboard for a specific order
  const handlePasteAddress = async (order) => {
    sound.playTap();
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text && text.trim()) {
          const parsed = parseLocationInput(text.trim());
          handleUpdateAddress(order, parsed);
          return;
        }
      }
      alert('Không có nội dung địa chỉ trong bộ nhớ tạm. Hãy sao chép địa chỉ hoặc link vị trí từ máy kia trước nhé!');
    } catch (err) {
      alert('Vui lòng cấp quyền dán hoặc giữ tay vào ô để dán trực tiếp!');
    }
  };

  // Trigger Google Maps Navigation
  const handleOpenGoogleMaps = (dest) => {
    sound.playTap();
    openGoogleMapsNavigation(dest);
  };

  // Trigger Apple Maps Navigation
  const handleOpenAppleMaps = (dest) => {
    sound.playTap();
    openAppleMapsNavigation(dest);
  };

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

        {/* COD (Tiền thu hộ) Pill if > 0 */}
        {totalCod > 0 && (
          <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs px-1">
            <span className="text-amber-300/90 text-[11px] font-medium">
              💵 Tiền thu hộ (COD đang giữ):
            </span>
            <span className="font-black text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">
              {formatVND(totalCod)}
            </span>
          </div>
        )}
      </div>

      {/* DELIVERY ACTION CENTER */}
      {deliveringOrders.length > 0 ? (
        /* Status: ĐANG GIAO HÀNG (1 hoặc nhiều đơn ghép) */
        <div className="space-y-3">
          {/* Header & Nút nhận thêm đơn ghép */}
          <div className="flex items-center justify-between gap-2 bg-slate-900/90 border border-amber-500/40 rounded-2xl p-3 shadow-lg">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
              <span className="text-xs font-black uppercase tracking-wider text-amber-400">
                Đang giữ {deliveringOrders.length} đơn
              </span>
            </div>
            <button
              type="button"
              onClick={onAcceptOrder}
              disabled={gpsLoading}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-black text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/30 active:scale-95 transition disabled:opacity-50"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>GHÉP THÊM ĐƠN</span>
            </button>
          </div>

          {deliveringOrders.map((order) => {
            const orderDurationMs = now - (order.pickupTime || now);
            return (
              <div
                key={order.id}
                className="bg-gradient-to-b from-amber-500/15 via-slate-900 to-slate-900 border-2 border-amber-500/50 rounded-3xl p-4 shadow-2xl relative overflow-hidden"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-black text-white tracking-tight">
                      Đơn #{order.orderNumber}
                    </h3>
                    {order.pickupCoords && (
                      <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-0.5">
                        <MapPin className="w-2.5 h-2.5" /> GPS
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-amber-300 bg-slate-950/80 px-2 py-0.5 rounded-lg border border-slate-800">
                      {formatDuration(orderDurationMs)}
                    </span>
                    <button
                      type="button"
                      onClick={() => onCancelDeliveringOrder(order)}
                      className="p-1 text-slate-400 hover:text-red-400 transition"
                      title={`Hủy Đơn #${order.orderNumber}`}
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 flex items-center gap-1 mb-3">
                  <Clock className="w-3 h-3 text-slate-400" />
                  Nhận lúc: <span className="text-slate-200 font-semibold">{formatTime(order.pickupTime)}</span>
                </p>

                {/* SECTION: TÌM ĐƯỜNG & CHỈ ĐƯỜNG GOOGLE MAPS */}
                <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3 mb-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-rose-400" />
                      Địa chỉ / Ngõ giao:
                    </label>
                    {order.destinationAddress && (
                      <button
                        type="button"
                        onClick={() => handleUpdateAddress(order, '')}
                        className="text-[10px] text-slate-400 hover:text-red-400 px-1"
                      >
                        Xóa
                      </button>
                    )}
                  </div>

                  {/* Address input + Quick Paste Button */}
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      placeholder="Nhập địa chỉ ngõ hoặc dán tọa độ..."
                      value={order.destinationAddress || ''}
                      onChange={(e) => handleUpdateAddress(order, e.target.value)}
                      onPaste={(e) => {
                        const pasted = e.clipboardData?.getData('text');
                        if (pasted && pasted.trim()) {
                          e.preventDefault();
                          handleUpdateAddress(order, parseLocationInput(pasted.trim()));
                        }
                      }}
                      className="flex-1 bg-slate-900 border border-slate-700/80 focus:border-blue-500 text-white text-xs px-3 py-2 rounded-xl outline-none placeholder:text-slate-500"
                    />
                    <button
                      type="button"
                      onClick={() => handlePasteAddress(order)}
                      title="Dán nhanh từ máy 1 (Universal Clipboard)"
                      className="px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1 shrink-0 active:scale-95 transition"
                    >
                      <span>📋 Dán</span>
                    </button>
                  </div>

                  {/* Coordinate tag if detected */}
                  {isCoordinateString(order.destinationAddress) && (
                    <div className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-xl border border-emerald-500/20 flex items-center gap-1">
                      <span>🎯 Tọa độ chuẩn:</span>
                      <span className="font-mono text-emerald-300">{order.destinationAddress}</span>
                    </div>
                  )}

                  {/* Quick COD input on active order */}
                  <div className="flex items-center gap-2 pt-0.5">
                    <span className="text-[11px] font-semibold text-amber-300 shrink-0">
                      💵 Thu hộ COD:
                    </span>
                    <div className="relative flex-1">
                      <input
                        type="number"
                        inputMode="numeric"
                        placeholder="0 (vd: 250 = 250k)"
                        value={
                          order._codInput !== undefined
                            ? order._codInput
                            : order.codAmount > 0
                            ? String(order.codAmount / 1000)
                            : ''
                        }
                        onChange={(e) => handleUpdateCod(order, e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700/80 focus:border-amber-400 text-amber-200 font-bold text-xs px-2.5 py-1.5 rounded-lg outline-none placeholder:text-slate-500 placeholder:font-normal"
                      />
                      <span className="absolute right-2.5 top-1.5 text-[10px] text-slate-400 font-semibold">
                        k
                      </span>
                    </div>
                    {order.codAmount > 0 && (
                      <span className="text-[11px] font-bold text-amber-300 shrink-0">
                        {formatVND(order.codAmount)}
                      </span>
                    )}
                  </div>

                  {/* Navigation Buttons */}
                  <div className="grid grid-cols-3 gap-2 pt-0.5">
                    <button
                      type="button"
                      onClick={() => handleOpenGoogleMaps(order.destinationAddress)}
                      className="col-span-2 py-2.5 px-3 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-blue-600/30 active:scale-[0.98] transition"
                    >
                      <Navigation className="w-4 h-4 fill-white text-white shrink-0" />
                      <span className="truncate">CHỈ ĐƯỜNG MAPS</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenAppleMaps(order.destinationAddress)}
                      title="Mở bằng Apple Maps"
                      className="col-span-1 py-2.5 px-2 rounded-xl bg-slate-850 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold flex items-center justify-center gap-1 active:scale-[0.98] transition truncate"
                    >
                      <span>🍎 Apple</span>
                    </button>
                  </div>
                </div>

                {/* Complete Order Button */}
                <button
                  onClick={() => onStartCompleteOrder(order)}
                  disabled={gpsLoading}
                  className="w-full py-3.5 rounded-2xl font-black text-base bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-xl shadow-emerald-600/30 active:scale-[0.98] transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {gpsLoading ? (
                    <span className="animate-spin text-xl">⏳</span>
                  ) : (
                    <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                  )}
                  HOÀN THÀNH ĐƠN #{order.orderNumber} ✅
                </button>
              </div>
            );
          })}

          {/* Offline Info link */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
            <span>💡 Dẫn đường <strong>Offline</strong> nếu đã tải Google Maps</span>
            <button
              type="button"
              onClick={() => setShowOfflineGuide(true)}
              className="text-blue-400 hover:text-blue-300 font-semibold underline flex items-center gap-0.5"
            >
              <HelpCircle className="w-3 h-3" /> Hướng dẫn
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
              Tự động lưu tọa độ nhận, có thể mở Google Maps tìm ngõ & chỉ đường
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
                    <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700/60 flex items-center justify-center text-xs font-black text-slate-300 shrink-0">
                      #{order.orderNumber}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-black text-emerald-400">
                          +{formatVND(order.fee)}
                        </span>
                        {order.codAmount > 0 && (
                          <span className="text-[10px] font-bold text-amber-300 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20">
                            COD {Math.round(order.codAmount / 1000)}k
                          </span>
                        )}
                        {order.distanceKm > 0 && (
                          <span className="text-[11px] font-semibold text-slate-400 bg-slate-800/80 px-1.5 py-0.2 rounded border border-slate-700/40">
                            {formatDistance(order.distanceKm)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5 flex-wrap">
                        <span>{formatTime(order.pickupTime)} – {formatTime(order.deliveryTime)}</span>
                        {order.destinationAddress && (
                          <span className="text-blue-300 font-medium">
                            📍 {order.destinationAddress}
                          </span>
                        )}
                        {order.note && <span className="text-slate-300">• {order.note}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {order.destinationAddress ? (
                      <button
                        onClick={() => handleOpenGoogleMaps(order.destinationAddress)}
                        className="p-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 transition"
                        title="Mở chỉ đường Google Maps"
                      >
                        <Navigation className="w-3.5 h-3.5" />
                      </button>
                    ) : mapUrl ? (
                      <a
                        href={mapUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-400 transition"
                        title="Xem lộ trình trên bản đồ"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    ) : null}
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

      {/* POPUP HƯỚNG DẪN TẢI GOOGLE MAPS OFFLINE */}
      {showOfflineGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-3xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <span>🗺️ Tải Maps Offline</span>
              </h3>
              <button
                onClick={() => setShowOfflineGuide(false)}
                className="p-1 rounded-full text-slate-400 hover:text-white bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Để Google Maps chỉ đường tìm ngõ <strong className="text-emerald-400">hoàn toàn không cần 4G</strong>, bạn làm theo 4 bước sau (chỉ làm 1 lần):
            </p>

            <ol className="text-xs text-slate-300 space-y-2 list-decimal list-inside bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
              <li>Mở app <strong className="text-white">Google Maps</strong> trên iPhone.</li>
              <li>Bấm vào <strong className="text-white">Ảnh đại diện (avatar)</strong> góc trên bên phải.</li>
              <li>Chọn mục <strong className="text-white">Bản đồ ngoại tuyến (Offline maps)</strong>.</li>
              <li>Chọn <strong className="text-blue-400">Chọn bản đồ riêng của bạn</strong>, căn khung vùng bạn hay chạy rồi bấm <strong className="text-emerald-400">Tải xuống</strong>.</li>
            </ol>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-3 text-[11px] text-slate-300 space-y-1">
              <p className="font-bold text-blue-300">📋 Mẹo bấm "Dán" 1 chạm không bị iPhone hỏi lại:</p>
              <p>
                Vào <strong className="text-white">Cài đặt iPhone</strong> ➔ <strong className="text-white">Sổ Shipper</strong> ➔ <strong className="text-white">Dán từ ứng dụng khác</strong> ➔ chọn <strong className="text-emerald-400">Cho phép</strong>.
              </p>
            </div>

            <p className="text-[11px] text-amber-300/90 italic">
              ✨ Xong! Sau khi tải, app Sổ Shipper sẽ gọi Google Maps chỉ đường & ngõ sâu mượt mà kể cả khi tắt mạng.
            </p>

            <button
              onClick={() => setShowOfflineGuide(false)}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-white text-xs transition"
            >
              Đã hiểu, quay lại app
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
