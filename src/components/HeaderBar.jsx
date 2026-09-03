import React, { useState, useEffect } from 'react';
import {
  Maximize,
  Minimize,
  Moon,
  Sparkles,
  Image as ImageIcon,
} from 'lucide-react';

export default function HeaderBar({
  onTriggerScreenSaver,
  onToggleNightMode,
  onOpenCityModal,
  onOpenPhotoSettings,
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
            title="Changer le lieu"
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

        {/* 1. Bouton Écran de Veille Photos & Source Photos */}
        <div className="flex items-center rounded-xl bg-white/[0.04] border border-white/[0.08] p-0.5">
          <button
            onClick={onTriggerScreenSaver}
            className="px-2.5 py-1 rounded-lg hover:bg-sky-500/15 hover:text-sky-300 text-zinc-300 text-xs font-medium flex items-center gap-1.5 transition-all touch-press"
            title="Lancer l'économiseur d'écran (Photos + Heure + Météo + Tâches)"
          >
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">Veille Photos</span>
          </button>
          <div className="w-[1px] h-3.5 bg-white/10" />
          <button
            onClick={onOpenPhotoSettings}
            className="p-1.5 rounded-lg hover:bg-sky-500/15 hover:text-sky-300 text-zinc-400 transition-all touch-press"
            title="Configurer l'album Google Photos de l'écran de veille"
          >
            <ImageIcon className="w-3.5 h-3.5 text-sky-400/80" />
          </button>
        </div>

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
