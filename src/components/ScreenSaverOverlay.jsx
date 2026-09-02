import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Circle,
  Droplets,
  Wind,
  Sun,
  ListTodo,
  ShieldCheck,
} from 'lucide-react';
import WeatherIcon from './WeatherIcon';
import { usePixelShift } from '../hooks/usePixelShift';

export default function ScreenSaverOverlay({
  isActive,
  onExit,
  photos,
  weatherData,
  todos,
  members,
}) {
  const [time, setTime] = useState(new Date());
  const [photoIndex, setPhotoIndex] = useState(0);
  const [isDimmed, setIsDimmed] = useState(false);
  const pixelShift = usePixelShift(60000);

  // Update clock every second
  useEffect(() => {
    if (!isActive) return;
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, [isActive]);

  // Slideshow transition every 15s in screensaver mode
  useEffect(() => {
    if (!isActive || !photos || photos.length <= 1) return;
    const interval = setInterval(() => {
      setPhotoIndex((prev) => (prev + 1) % photos.length);
    }, 15000);
    return () => clearInterval(interval);
  }, [isActive, photos]);

  // Auto-dimming after 5 min of screensaver to preserve iPad screen & battery
  useEffect(() => {
    if (!isActive) {
      setIsDimmed(false);
      return;
    }
    const dimTimer = setTimeout(() => {
      setIsDimmed(true);
    }, 5 * 60 * 1000);

    return () => clearTimeout(dimTimer);
  }, [isActive]);

  if (!isActive) return null;

  const currentPhoto = photos?.[photoIndex] || photos?.[0];
  const hours = String(time.getHours()).padStart(2, '0');
  const minutes = String(time.getMinutes()).padStart(2, '0');
  const seconds = String(time.getSeconds()).padStart(2, '0');

  const fullDateFormatted = time.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const capitalizedDate = fullDateFormatted.charAt(0).toUpperCase() + fullDateFormatted.slice(1);

  // Weather data
  const current = weatherData?.current;
  const meta = current?.meta || { label: 'Partiellement nuageux', icon: 'CloudSun', dayColor: 'text-sky-300' };

  // Pending Todos (Max 4 for clean glanceable display)
  const pendingTodos = (todos || []).filter((t) => !t.completed).slice(0, 4);

  const getMemberInfo = (id) => {
    return members?.find((m) => m.id === id) || { name: '', emoji: '🏠', dot: '#a1a1aa' };
  };

  return (
    <div
      onClick={onExit}
      onTouchStart={onExit}
      className={`fixed inset-0 z-50 bg-black cursor-pointer flex flex-col justify-between p-6 sm:p-8 md:p-12 select-none animate-in fade-in duration-700 overflow-hidden transition-all duration-1000 ${
        isDimmed ? 'brightness-75' : 'brightness-100'
      }`}
    >
      {/* 1. PHOTO DE FOND EN GRAND AVEC FONDU DOUX & ZOOM FLUIDE */}
      <div className="absolute inset-0 z-0 overflow-hidden bg-black pointer-events-none">
        {photos && photos.map((photo, idx) => (
          <img
            key={photo.id || idx}
            src={photo.url}
            alt={photo.title || 'Photo Économiseur'}
            referrerPolicy="no-referrer"
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1500 ease-in-out ${
              idx === photoIndex ? 'opacity-85 scale-100 animate-ken-burns' : 'opacity-0 scale-105'
            }`}
          />
        ))}

        {/* Voiles dégradés sombres pour une lisibilité parfaite des informations */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/75" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-black/50" />
      </div>

      {/* CONTENEUR GLOBAL AVEC PIXEL-SHIFT ANTI-MARQUAGE */}
      <div
        style={pixelShift.style}
        className="z-10 flex flex-col justify-between h-full w-full"
      >
        {/* 
          2. EN HAUT : DEUX COLONNES
          - Colonne 1 (Gauche) : Date et Heure
          - Colonne 2 (Droite) : Météo actuelle détaillée
        */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start w-full pt-2">
          {/* Colonne 1 : Date & Heure (Urbanist Minimal Grand Format) */}
          <div className="md:col-span-7 flex flex-col items-start">
            <div className="flex items-baseline tracking-tight">
              <span className="font-clock-urbanist text-7xl sm:text-8xl md:text-9xl lg:text-[11.5rem] xl:text-[13rem] font-light text-white tracking-tight drop-shadow-2xl leading-none">
                {hours}
              </span>
              <span className="font-clock-urbanist text-6xl sm:text-7xl md:text-8xl lg:text-[10rem] xl:text-[11.5rem] font-extralight text-sky-400/60 mx-1 sm:mx-2 animate-pulse-soft select-none">
                :
              </span>
              <span className="font-clock-urbanist text-7xl sm:text-8xl md:text-9xl lg:text-[11.5rem] xl:text-[13rem] font-light text-white tracking-tight drop-shadow-2xl leading-none">
                {minutes}
              </span>
              <span className="font-clock-urbanist text-2xl sm:text-3xl md:text-4xl text-zinc-400/80 font-light ml-3 sm:ml-4 self-end mb-3 sm:mb-7 opacity-75">
                {seconds}
              </span>
            </div>

            {/* Date complète */}
            <div className="flex items-center gap-2.5 mt-2 sm:mt-3 text-zinc-200 font-display">
              <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-sky-400 shrink-0 drop-shadow" />
              <span className="text-xl sm:text-2xl md:text-3xl font-medium tracking-wide text-white drop-shadow-md">
                {capitalizedDate}
              </span>
            </div>
          </div>

          {/* Colonne 2 : Météo Actuelle */}
          {current && (
            <div className="md:col-span-5 flex md:justify-end">
              <div className="p-4 sm:p-5 rounded-3xl bg-black/45 border border-white/15 backdrop-blur-xl shadow-2xl flex items-center gap-4 sm:gap-5">
                {/* Grande Icône météo */}
                <div className={`p-3 rounded-2xl bg-white/[0.05] border border-white/10 ${meta.dayColor} shrink-0`}>
                  <WeatherIcon name={meta.icon} className="w-9 h-9 sm:w-11 sm:h-11 stroke-[1.5]" />
                </div>

                {/* Température & Métriques */}
                <div className="space-y-1">
                  <div className="flex items-baseline gap-1">
                    <span className="font-mono-numbers text-4xl sm:text-5xl font-black text-white leading-none">
                      {current.temp}°
                    </span>
                    <span className="text-lg font-light text-zinc-400">C</span>
                  </div>

                  <div className="text-sm sm:text-base font-semibold text-zinc-100 leading-tight">
                    {meta.label}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-zinc-300 font-mono-numbers pt-1">
                    <span className="flex items-center gap-1">
                      <Droplets className="w-3.5 h-3.5 text-sky-400" />
                      {current.humidity}%
                    </span>
                    <span className="flex items-center gap-1">
                      <Wind className="w-3.5 h-3.5 text-teal-400" />
                      {current.windSpeed} km/h
                    </span>
                    <span className="flex items-center gap-1">
                      <Sun className="w-3.5 h-3.5 text-amber-400" />
                      UV {current.uvIndex ?? 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 
          3. EN BAS : TÂCHES DU JOUR (ALIGNÉE À GAUCHE)
        */}
        <div className="pb-2 space-y-2.5 max-w-lg">
          <div className="p-4 sm:p-5 rounded-3xl bg-black/45 border border-white/15 backdrop-blur-xl shadow-2xl space-y-3 w-full">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <ListTodo className="w-4 h-4 text-emerald-400" />
                <h4 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">
                  Tâches du jour ({pendingTodos.length})
                </h4>
              </div>
              <span className="text-[11px] text-zinc-400 font-mono-numbers">Restantes</span>
            </div>

            {pendingTodos.length === 0 ? (
              <div className="py-2 text-center text-xs text-emerald-400 font-medium">
                ✨ Toutes les tâches familiales sont faites !
              </div>
            ) : (
              <div className="space-y-2">
                {pendingTodos.map((todo) => {
                  const member = getMemberInfo(todo.assignee);
                  return (
                    <div
                      key={todo.id}
                      className="p-2.5 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-between gap-3 shadow-sm"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <Circle className="w-4 h-4 text-zinc-400 shrink-0" />
                        <span className="text-xs sm:text-sm font-medium text-zinc-100 truncate">
                          {todo.title}
                        </span>
                      </div>

                      <span
                        className="px-2 py-0.5 rounded-lg text-[11px] font-semibold flex items-center gap-1 shrink-0 border border-white/10"
                        style={{ backgroundColor: `${member.dot}25`, color: member.dot }}
                      >
                        <span>{member.emoji}</span>
                        {todo.assignee !== 'all' && <span>{member.name}</span>}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Indication tactile de sortie */}
          <div className="flex items-center justify-between text-xs text-zinc-400 pt-1 px-1">
            <span className="flex items-center gap-1.5 text-[11px] text-emerald-400/90 font-mono-numbers">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Anti-marquage actif</span>
            </span>
            <span className="text-[11px] text-zinc-400 animate-pulse">
              Toucher pour réveiller
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
