import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import ActiveShift from './components/ActiveShift';
import CompleteOrderModal from './components/CompleteOrderModal';
import CheckoutModal from './components/CheckoutModal';
import HistoryTab from './components/HistoryTab';
import IosInstallGuideModal from './components/IosInstallGuideModal';
import { 
  loadCurrentShift, 
  saveCurrentShift, 
  loadShiftHistory, 
  saveShiftToHistory,
  loadSettings,
  saveSettings,
  formatVND,
  formatDate
} from './utils/storage';
import { getCurrentPosition, calculateHaversineDistance } from './utils/geo';
import { sound } from './utils/sound';
import { Play, Sparkles, MapPin, ShieldCheck, History, ArrowRight } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('today'); // 'today' | 'history'
  const [activeShift, setActiveShift] = useState(null);
  const [currentDeliveringOrder, setCurrentDeliveringOrder] = useState(null);
  const [history, setHistory] = useState([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  // Modals
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showInstallGuide, setShowInstallGuide] = useState(false);

  // GPS temporary state during order completion
  const [deliveryCoords, setDeliveryCoords] = useState(null);
  const [calculatedDistance, setCalculatedDistance] = useState(0);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState(null);

  // Initialize from LocalStorage
  useEffect(() => {
    const savedShift = loadCurrentShift();
    if (savedShift) {
      setActiveShift(savedShift);
      // Check if there is an in-progress delivering order
      if (savedShift.deliveringOrder) {
        setCurrentDeliveringOrder(savedShift.deliveringOrder);
      }
    }

    const savedHistory = loadShiftHistory();
    setHistory(savedHistory);

    const savedSettings = loadSettings();
    if (savedSettings && typeof savedSettings.soundEnabled === 'boolean') {
      setSoundEnabled(savedSettings.soundEnabled);
      sound.enabled = savedSettings.soundEnabled;
    }

    // Wake lock attempt for mobile riders
    if ('wakeLock' in navigator) {
      navigator.wakeLock.request('screen').catch(() => {});
    }
  }, []);

  // Save current shift state whenever it updates
  const updateActiveShift = (newShiftData) => {
    setActiveShift(newShiftData);
    saveCurrentShift(newShiftData);
  };

  // CHECK-IN (Bắt đầu ca)
  const handleCheckin = () => {
    sound.playTap();
    const newShift = {
      id: 'shift_' + Date.now(),
      startTime: Date.now(),
      endTime: null,
      orders: [],
      deliveringOrder: null,
    };
    updateActiveShift(newShift);
  };

  // NHẬN ĐƠN MỚI
  const handleAcceptOrder = async () => {
    sound.playAccept();
    setGpsLoading(true);
    
    // Acquire GPS position (non-blocking if slow)
    const nextOrderNumber = (activeShift?.orders?.length || 0) + 1;
    const pendingOrder = {
      id: 'ord_' + Date.now(),
      orderNumber: nextOrderNumber,
      pickupTime: Date.now(),
      pickupCoords: null,
    };

    // Fast state update
    const updatedShift = {
      ...activeShift,
      deliveringOrder: pendingOrder,
    };
    setCurrentDeliveringOrder(pendingOrder);
    updateActiveShift(updatedShift);

    // Try to get GPS in background
    try {
      const geoResult = await getCurrentPosition(6000);
      if (geoResult.success) {
        const orderWithGps = {
          ...pendingOrder,
          pickupCoords: geoResult.coords,
        };
        setCurrentDeliveringOrder(orderWithGps);
        updateActiveShift({
          ...activeShift,
          deliveringOrder: orderWithGps,
        });
      }
    } catch (e) {
      console.warn('GPS error on accept:', e);
    } finally {
      setGpsLoading(false);
    }
  };

  // BẤM "HOÀN THÀNH ĐƠN" (Lấy GPS trả đơn & mở Modal chọn tiền phí)
  const handleStartCompleteOrder = async () => {
    sound.playTap();
    setGpsLoading(true);
    setGpsError(null);
    setDeliveryCoords(null);
    setCalculatedDistance(0);
    setShowCompleteModal(true);

    try {
      const geoResult = await getCurrentPosition(7000);
      if (geoResult.success) {
        setDeliveryCoords(geoResult.coords);
        if (currentDeliveringOrder?.pickupCoords) {
          const dist = calculateHaversineDistance(
            currentDeliveringOrder.pickupCoords.lat,
            currentDeliveringOrder.pickupCoords.lng,
            geoResult.coords.lat,
            geoResult.coords.lng
          );
          setCalculatedDistance(dist);
        }
      } else {
        setGpsError(geoResult.error || 'Không lấy được định vị');
      }
    } catch (err) {
      setGpsError('Lỗi định vị GPS');
    } finally {
      setGpsLoading(false);
    }
  };

  // XÁC NHẬN LƯU ĐƠN (Sau khi chọn 5k, 10k, 15k... hoặc nhập số)
  const handleConfirmOrder = ({ fee, distanceKm, note }) => {
    if (!currentDeliveringOrder || !activeShift) return;

    const completedOrder = {
      ...currentDeliveringOrder,
      deliveryTime: Date.now(),
      deliveryCoords: deliveryCoords,
      distanceKm: distanceKm || 0,
      fee: fee,
      note: note || '',
    };

    const newOrders = [...(activeShift.orders || []), completedOrder];
    const updatedShift = {
      ...activeShift,
      orders: newOrders,
      deliveringOrder: null,
    };

    setCurrentDeliveringOrder(null);
    updateActiveShift(updatedShift);
    setShowCompleteModal(false);
  };

  // HỦY ĐƠN ĐANG GIAO
  const handleCancelDeliveringOrder = () => {
    if (confirm('Bạn có chắc muốn hủy đơn đang giao này không?')) {
      sound.playTap();
      setCurrentDeliveringOrder(null);
      updateActiveShift({
        ...activeShift,
        deliveringOrder: null,
      });
    }
  };

  // XÓA 1 ĐƠN ĐÃ GIAO TRONG CA
  const handleDeleteOrder = (orderId) => {
    if (confirm('Bạn có chắc muốn xóa đơn này khỏi danh sách ca hôm nay?')) {
      sound.playTap();
      const newOrders = (activeShift.orders || []).filter(o => o.id !== orderId);
      updateActiveShift({
        ...activeShift,
        orders: newOrders,
      });
    }
  };

  // YÊU CẦU CHECK-OUT (Mở modal tổng kết)
  const handleRequestCheckout = () => {
    if (currentDeliveringOrder) {
      alert('Bạn đang có đơn chưa hoàn thành! Vui lòng bấm "Hoàn thành đơn" hoặc "Hủy đơn" trước khi check-out.');
      return;
    }
    sound.playTap();
    setShowCheckoutModal(true);
  };

  // XÁC NHẬN KẾT THÚC CA (Lưu vào History)
  const handleConfirmCheckout = (endTime) => {
    const finalShift = {
      ...activeShift,
      endTime: endTime || Date.now(),
      deliveringOrder: null,
    };

    const newHistory = saveShiftToHistory(finalShift);
    setHistory(newHistory);
    updateActiveShift(null);
    setCurrentDeliveringOrder(null);
    setShowCheckoutModal(false);
    setActiveTab('history'); // Switch to history tab to view past summary
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        soundEnabled={soundEnabled}
        setSoundEnabled={(val) => {
          setSoundEnabled(val);
          saveSettings({ soundEnabled: val });
        }}
        onShowInstallGuide={() => setShowInstallGuide(true)}
        activeShift={activeShift}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-md w-full mx-auto p-4 safe-bottom">
        {activeTab === 'today' ? (
          activeShift ? (
            /* ACTIVE WORK SHIFT SCREEN */
            <ActiveShift
              shift={activeShift}
              currentDeliveringOrder={currentDeliveringOrder}
              onAcceptOrder={handleAcceptOrder}
              onStartCompleteOrder={handleStartCompleteOrder}
              onCancelDeliveringOrder={handleCancelDeliveringOrder}
              onDeleteOrder={handleDeleteOrder}
              onRequestCheckout={handleRequestCheckout}
              gpsLoading={gpsLoading}
            />
          ) : (
            /* NOT CHECKED IN SCREEN (WELCOME HERO) */
            <div className="pt-4 pb-8 space-y-5 text-center">
              {/* Graphic Icon */}
              <div className="relative inline-block my-4">
                <div className="w-28 h-28 rounded-3xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-emerald-400 mx-auto flex items-center justify-center text-5xl shadow-2xl shadow-emerald-500/30 transform hover:scale-105 transition">
                  🛵
                </div>
                <div className="absolute -bottom-2 -right-2 bg-amber-400 text-slate-950 p-2 rounded-2xl font-black text-xs shadow-lg">
                  💰 + ₫
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-black text-white tracking-tight">
                  Sẵn sàng ngày mới?
                </h2>
                <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                  Mở app và bấm <strong>Check-in</strong> để bắt đầu ghi nhận đơn hàng, tính tiền ship và đo quãng đường hôm nay!
                </p>
              </div>

              {/* Big Check-in Button */}
              <button
                onClick={handleCheckin}
                className="w-full py-5 rounded-2xl font-black text-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400 hover:from-emerald-400 hover:to-teal-300 text-white shadow-2xl shadow-emerald-600/40 active:scale-[0.98] transition flex items-center justify-center gap-3"
              >
                <Play className="w-7 h-7 fill-white stroke-none" />
                BẮT ĐẦU CA (CHECK-IN)
              </button>

              {/* Quick Features List */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 text-left space-y-3 mt-6 text-xs text-slate-300">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    ⚡
                  </div>
                  <span><strong>Chọn nhanh 1 chạm:</strong> 5k, 10k, 15k, 20k, 25k, 30k cực nhanh.</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <span><strong>Tự động lưu GPS:</strong> Đo chính xác quãng đường giao từng đơn.</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                    📊
                  </div>
                  <span><strong>Check-out cuối ngày:</strong> Tổng kết số đơn, tiền ship & tổng km.</span>
                </div>
              </div>

              {/* Button to view history */}
              {history.length > 0 && (
                <button
                  onClick={() => {
                    sound.playTap();
                    setActiveTab('history');
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white pt-2"
                >
                  <History className="w-4 h-4 text-emerald-400" />
                  Xem lịch sử các ca trước ({history.length} ngày)
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )
        ) : (
          /* HISTORY TAB */
          <HistoryTab
            history={history}
            onHistoryUpdate={(updated) => setHistory(updated)}
          />
        )}
      </main>

      {/* MODAL: Hoàn thành đơn (Chọn tiền phí ship & xác nhận GPS) */}
      {showCompleteModal && currentDeliveringOrder && (
        <CompleteOrderModal
          order={currentDeliveringOrder}
          deliveryCoords={deliveryCoords}
          distanceKm={calculatedDistance}
          gpsLoading={gpsLoading}
          gpsError={gpsError}
          onConfirm={handleConfirmOrder}
          onClose={() => setShowCompleteModal(false)}
        />
      )}

      {/* MODAL: Checkout tổng kết cuối ngày */}
      {showCheckoutModal && activeShift && (
        <CheckoutModal
          shift={activeShift}
          onConfirmCheckout={handleConfirmCheckout}
          onClose={() => setShowCheckoutModal(false)}
        />
      )}

      {/* MODAL: Hướng dẫn cài lên iPhone */}
      {showInstallGuide && (
        <IosInstallGuideModal onClose={() => setShowInstallGuide(false)} />
      )}
    </div>
  );
}
