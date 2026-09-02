import React, { useState, useEffect } from 'react';
import { Moon, Sunrise, ShieldCheck } from 'lucide-react';
import { usePixelShift } from '../hooks/usePixelShift';

export default function NightScheduleOverlay({
  isActive,
  onExit,
  weatherData,
}) {
  const [time, setTime] = useState(new Date());
  const pixelShift = usePixelShift(45000);

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
  const capitalizedDate = dateFormatted.charAt(0).toUpperCase() + dateFormatted.slice(1);

  const sunrise = weatherData?.sunrise || '07:15';
  const currentTemp = weatherData?.current?.temp;

  return (
    <div
      onClick={onExit}
      onTouchStart={onExit}
      className="fixed inset-0 z-50 bg-[#000000] cursor-pointer flex flex-col justify-between p-8 sm:p-12 md:p-16 select-none animate-in fade-in duration-1000 overflow-hidden"
    >
      {/* Haut : Indicateur Veille de Nuit */}
      <div className="flex items-center justify-between w-full opacity-40">
        <div className="flex items-center gap-2 text-amber-500/80 text-xs">
          <Moon className="w-4 h-4" />
          <span>Mode Nuit OLED • Écran au repos</span>
        </div>
        <div className="flex items-center gap-1 text-emerald-500/70 text-xs font-mono-numbers">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Pixel-Shift actif</span>
        </div>
      </div>

      {/* Centre : Horloge Ambre/Rouge anti-éblouissement avec Pixel-Shift */}
      <div
        style={pixelShift.style}
        className="my-auto flex flex-col items-center justify-center text-center space-y-3"
      >
        <div className="flex items-baseline font-clock text-8xl sm:text-9xl md:text-[10.5rem] font-bold text-amber-500/85 tracking-tight drop-shadow leading-none">
          <span>{hours}</span>
          <span className="text-amber-500/40 mx-2 animate-pulse font-light">:</span>
          <span>{minutes}</span>
        </div>

        <p className="text-lg sm:text-xl md:text-2xl text-amber-500/60 font-medium tracking-wide">
          {capitalizedDate}
        </p>

        {currentTemp !== undefined && (
          <div className="pt-2 flex items-center gap-4 text-sm font-mono-numbers text-amber-500/50">
            <span>Extérieur : {currentTemp}°C</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Sunrise className="w-3.5 h-3.5" />
              Lever : {sunrise}
            </span>
          </div>
        )}
      </div>

      {/* Bas : Consigne de réveil discrète */}
      <div className="text-center text-xs text-amber-500/30 tracking-wider uppercase animate-pulse">
        Toucher l'écran pour réveiller Tablo
      </div>
    </div>
  );
}
