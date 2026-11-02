import React from 'react';
import { Volume2, VolumeX, Smartphone, Clock, Calendar } from 'lucide-react';
import { sound } from '../utils/sound';

export default function Header({ 
  activeTab, 
  setActiveTab, 
  soundEnabled, 
  setSoundEnabled, 
  onShowInstallGuide,
  activeShift 
}) {
  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    sound.enabled = next;
    if (next) sound.playTap();
  };

  const todayStr = new Date().toLocaleDateString('vi-VN', {
    weekday: 'short',
    day: 'numeric',
    month: 'numeric',
  });

  return (
    <header className="safe-top bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-30 px-4 pt-3 pb-3">
      <div className="flex items-center justify-between">
        {/* Logo & App Name */}
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white font-black text-xl">
            🛵
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-bold text-lg text-white tracking-tight">Sổ Shipper</h1>
              {activeShift && (
                activeShift.isOnBreak ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                    ☕ Tạm nghỉ
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    Đang chạy
                  </span>
                )
              )}
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-emerald-400" />
              {todayStr}
            </p>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1.5">
          {/* iOS Install Guide button */}
          <button
            onClick={onShowInstallGuide}
            aria-label="Cài vào iPhone"
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition active:scale-95 flex items-center gap-1 text-xs"
          >
            <Smartphone className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">iOS</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            aria-label="Bật tắt âm thanh"
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition active:scale-95"
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-500" />
            )}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-3 grid grid-cols-2 bg-slate-950/70 p-1 rounded-xl border border-slate-800/80">
        <button
          onClick={() => {
            sound.playTap();
            setActiveTab('today');
          }}
          className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
            activeTab === 'today'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Ca hôm nay
        </button>
        <button
          onClick={() => {
            sound.playTap();
            setActiveTab('history');
          }}
          className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
            activeTab === 'history'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Lịch sử & Thống kê
        </button>
      </div>
    </header>
  );
}
