import React, { useState, useEffect } from 'react';
import {
  Maximize,
  Minimize,
  Moon,
  Sparkles,
  MapPin,
  Tv,
} from 'lucide-react';

export default function HeaderBar({
  onTriggerScreenSaver,
  onToggleNightMode,
  onOpenCityModal,
  currentCity,
}) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.warn('Fullscreen error:', err);
      });
    } else {
      document.exitFullscreen().catch((err) => {
        console.warn('Exit fullscreen error:', err);
      });
    }
  };

  return (
    <header className="w-full flex items-center justify-between py-2 sm:py-3 px-1 shrink-0">
      {/* Brand logo */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-br from-sky-400 via-indigo-500 to-purple-600 p-[1px] shadow-lg shadow-sky-500/20">
          <div className="w-full h-full bg-zinc-950 rounded-[15px] flex items-center justify-center">
            <span className="font-display font-extrabold text-base sm:text-lg bg-gradient-to-r from-sky-400 to-indigo-300 bg-clip-text text-transparent">
              T
            </span>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display font-bold text-lg sm:text-xl tracking-tight text-white">
              Tablo
            </h1>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1 animate-pulse" />
              Maison
            </span>
          </div>
          <p className="text-[11px] text-zinc-400 hidden sm:block">
            Dashboard mural connecté
          </p>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2">
        {/* City button */}
        <button
          onClick={onOpenCityModal}
          className="px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-medium text-zinc-300 flex items-center gap-1.5 transition-all touch-press"
          title="Changer la ville"
        >
          <MapPin className="w-3.5 h-3.5 text-sky-400" />
          <span className="max-w-[90px] sm:max-w-[140px] truncate">{currentCity?.name || 'Paris'}</span>
        </button>

        {/* 1. Bouton Écran de Veille Photos */}
        <button
          onClick={onTriggerScreenSaver}
          className="px-2.5 py-1.5 rounded-xl bg-white/[0.04] hover:bg-sky-500/15 hover:text-sky-300 border border-white/[0.08] text-zinc-300 text-xs font-medium flex items-center gap-1.5 transition-all touch-press"
          title="Lancer l'économiseur d'écran (Photos + Heure + Météo + Tâches)"
        >
          <Sparkles className="w-3.5 h-3.5 text-sky-400" />
          <span className="hidden sm:inline">Veille Photos</span>
        </button>

        {/* 2. Bouton Mode Nuit OLED */}
        <button
          onClick={onToggleNightMode}
          className="p-2 rounded-xl bg-white/[0.04] hover:bg-amber-500/15 hover:text-amber-300 border border-white/[0.08] text-zinc-400 transition-all touch-press"
          title="Mode Nuit OLED (Sommeil profond)"
        >
          <Moon className="w-4 h-4" />
        </button>

        {/* 3. Fullscreen toggle */}
        <button
          onClick={toggleFullscreen}
          className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-white border border-white/[0.08] transition-all touch-press"
          title={isFullscreen ? 'Quitter plein écran' : 'Plein écran mural'}
        >
          {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
}
