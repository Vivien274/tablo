import React, { useState, useEffect } from 'react';
import { Moon, Sparkles } from 'lucide-react';

export default function NightModeOverlay({ isActive, onExit }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    if (!isActive) return;
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, [isActive]);

  if (!isActive) return null;

  const hours = String(time.getHours()).padStart(2, '0');
  const minutes = String(time.getMinutes()).padStart(2, '0');
  const dateFormatted = time.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <div
      onClick={onExit}
      className="fixed inset-0 z-50 bg-[#040507] cursor-pointer flex flex-col items-center justify-center p-6 select-none animate-in fade-in duration-700"
    >
      {/* Soft minimal red/amber OLED clock */}
      <div className="flex flex-col items-center justify-center space-y-4 text-center opacity-85 hover:opacity-100 transition-opacity">
        <div className="p-3 rounded-full bg-red-950/30 border border-red-900/30 text-amber-500/80 mb-2">
          <Moon className="w-8 h-8" />
        </div>

        <div className="flex items-baseline font-mono-numbers text-7xl sm:text-8xl md:text-9xl font-black text-amber-500/90 tracking-tighter drop-shadow">
          <span>{hours}</span>
          <span className="text-amber-500/50 mx-2 animate-pulse">:</span>
          <span>{minutes}</span>
        </div>

        <p className="text-base sm:text-lg text-amber-500/60 font-medium capitalize">
          {dateFormatted}
        </p>

        <div className="pt-8 text-xs text-zinc-600 font-normal tracking-wider uppercase animate-pulse">
          Toucher l'écran pour réveiller Tablo
        </div>
      </div>
    </div>
  );
}
