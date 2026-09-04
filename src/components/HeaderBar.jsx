import React, { useState, useEffect } from 'react';
import {
  Maximize,
  Minimize,
  Moon,
  Sparkles,
  Settings,
} from 'lucide-react';

export default function HeaderBar({
  onTriggerScreenSaver,
  onToggleNightMode,
  onOpenCityModal,
  onOpenSettings,
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
      {/* Brand & City Tag */}
      <div>
        <div className="flex items-center gap-2.5">
          <h1 className="font-display font-bold text-lg sm:text-xl tracking-tight text-white">
            Tablo
          </h1>
          <button
            type="button"
            onClick={onOpenCityModal}
            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 transition-all touch-press cursor-pointer active:scale-95"
            title="Changer le lieu météo"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse" />
            <span>{currentCity?.name || 'Comines'}</span>
          </button>
        </div>
        <p className="text-[11px] text-zinc-400 hidden sm:block">
          Dashboard mural connecté
        </p>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2">
        {/* 1. Bouton Écran de Veille Photos */}
        <button
          onClick={onTriggerScreenSaver}
          className="px-2.5 py-1.5 rounded-xl bg-white/[0.04] hover:bg-sky-500/15 hover:text-sky-300 border border-white/[0.08] text-zinc-300 text-xs font-medium flex items-center gap-1.5 transition-all touch-press active:scale-95"
          title="Lancer l'écran de veille photos"
        >
          <Sparkles className="w-3.5 h-3.5 text-sky-400" />
          <span className="hidden sm:inline">Veille</span>
        </button>

        {/* 2. Bouton Mode Nuit OLED */}
        <button
          onClick={onToggleNightMode}
          className="p-2 rounded-xl bg-white/[0.04] hover:bg-amber-500/15 hover:text-amber-300 border border-white/[0.08] text-zinc-400 transition-all touch-press active:scale-95"
          title="Mode Nuit OLED"
        >
          <Moon className="w-4 h-4" />
        </button>

        {/* 3. Bouton Paramètres Réglages Globaux */}
        <button
          onClick={onOpenSettings}
          className="p-2 sm:px-2.5 sm:py-1.5 rounded-xl bg-white/[0.04] hover:bg-sky-500/15 hover:text-sky-300 border border-white/[0.08] text-zinc-300 transition-all touch-press active:scale-95 flex items-center gap-1.5"
          title="Paramètres de Tablo (Agendas, Photos, Synchronisation, Météo)"
        >
          <Settings className="w-4 h-4 text-sky-400" />
          <span className="hidden sm:inline text-xs font-medium">Réglages</span>
        </button>

        {/* 4. Fullscreen toggle */}
        <button
          onClick={toggleFullscreen}
          className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-white border border-white/[0.08] transition-all touch-press active:scale-95"
          title={isFullscreen ? 'Quitter plein écran' : 'Plein écran mural'}
        >
          {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
}
