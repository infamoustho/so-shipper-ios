// Storage & Formatting utilities

const CURRENT_SHIFT_KEY = 'shipper_current_shift_v1';
const HISTORY_KEY = 'shipper_shift_history_v1';
const SETTINGS_KEY = 'shipper_settings_v1';

export function formatVND(amount) {
  if (amount == null || isNaN(amount)) return '0 ₫';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatVNDShort(amount) {
  if (!amount) return '0k';
  const thousands = Math.round(amount / 1000);
  return `${thousands}k`;
}

export function formatTime(timestamp) {
  if (!timestamp) return '--:--';
  const date = new Date(timestamp);
  return date.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDate(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleDateString('vi-VN', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatDuration(durationMs) {
  if (!durationMs || durationMs <= 0) return '0 phút';
  const totalMinutes = Math.floor(durationMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  
  if (hours === 0) {
    return `${minutes} phút`;
  }
  return `${hours} giờ ${minutes > 0 ? `${minutes}p` : ''}`;
}

// Local Storage operations
export function loadCurrentShift() {
  try {
    const data = localStorage.getItem(CURRENT_SHIFT_KEY);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    console.error('Error loading current shift:', e);
    return null;
  }
}

export function saveCurrentShift(shift) {
  try {
    if (shift) {
      localStorage.setItem(CURRENT_SHIFT_KEY, JSON.stringify(shift));
    } else {
      localStorage.removeItem(CURRENT_SHIFT_KEY);
    }
  } catch (e) {
    console.error('Error saving current shift:', e);
  }
}

export function loadShiftHistory() {
  try {
    const data = localStorage.getItem(HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Error loading history:', e);
    return [];
  }
}

export function saveShiftToHistory(shift) {
  try {
    const history = loadShiftHistory();
    // Add to beginning of array
    history.unshift(shift);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    return history;
  } catch (e) {
    console.error('Error saving to history:', e);
    return [];
  }
}

export function deleteShiftFromHistory(shiftId) {
  try {
    const history = loadShiftHistory().filter(s => s.id !== shiftId);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    return history;
  } catch (e) {
    console.error('Error deleting shift:', e);
    return [];
  }
}

export function loadSettings() {
  try {
    const data = localStorage.getItem(SETTINGS_KEY);
    return data ? JSON.parse(data) : { soundEnabled: true, keepAwake: false };
  } catch (e) {
    return { soundEnabled: true, keepAwake: false };
  }
}

export function saveSettings(settings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Error saving settings:', e);
  }
}

// Generate shareable Zalo text
export function generateShareSummary(shift) {
  const endTime = shift.endTime || Date.now();
  const totalDurationMs = endTime - (shift.startTime || endTime);
  const breakDurationMs = (shift.totalBreakDurationMs || 0) + (shift.isOnBreak && shift.breakStartTime ? (endTime - shift.breakStartTime) : 0);
  const activeDurationMs = Math.max(0, totalDurationMs - breakDurationMs);
  
  const totalFee = (shift.orders || []).reduce((sum, o) => sum + (o.fee || 0), 0);
  const totalDistance = (shift.orders || []).reduce((sum, o) => sum + (o.distanceKm || 0), 0);
  const orderCount = (shift.orders || []).length;
  const avgPerOrder = orderCount > 0 ? Math.round(totalFee / orderCount) : 0;
  
  const activeHours = activeDurationMs / (1000 * 60 * 60);
  const avgPerHour = activeHours > 0 ? Math.round(totalFee / activeHours) : totalFee;

  const timeBreakdown = breakDurationMs > 60000 
    ? `(${formatDuration(totalDurationMs)} • Nghỉ ${formatDuration(breakDurationMs)} • Chạy thực: ${formatDuration(activeDurationMs)})`
    : `(${formatDuration(totalDurationMs)})`;

  return `🛵 TỔNG KẾT CA CHẠY SHIPPER
📅 Ngày: ${formatDate(shift.startTime)}
⏰ Thời gian: ${formatTime(shift.startTime)} - ${shift.endTime ? formatTime(shift.endTime) : 'Hiện tại'} ${timeBreakdown}
━━━━━━━━━━━━━━━━━━
📦 Số đơn hoàn thành: ${orderCount} đơn
💰 Tổng tiền ship: ${formatVND(totalFee)}
📍 Tổng quãng đường: ${totalDistance.toFixed(1)} km
⭐ Thu nhập TB/giờ chạy: ${formatVND(avgPerHour)}/h
⭐ Thu nhập TB/đơn: ${formatVND(avgPerOrder)}
━━━━━━━━━━━━━━━━━━
Ghi chú từ Sổ Shipper 🛵`;
}

// Export Shift to CSV
export function exportShiftToCSV(shift) {
  const headers = ['STT', 'Mã đơn', 'Giờ nhận', 'Giờ trả', 'Quãng đường (km)', 'Tiền ship (VND)', 'Ghi chú'];
  const rows = (shift.orders || []).map((o, idx) => [
    idx + 1,
    `Đơn #${o.orderNumber || idx + 1}`,
    formatTime(o.pickupTime),
    formatTime(o.deliveryTime),
    (o.distanceKm || 0).toFixed(1),
    o.fee || 0,
    `"${(o.note || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `bao-cao-shipper-${new Date(shift.startTime).toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
