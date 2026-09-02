import React from 'react';
import {
  MapPin,
  Droplets,
  Wind,
  Sun,
  Umbrella,
  ArrowUp,
  ArrowDown,
  RefreshCw,
} from 'lucide-react';
import WeatherIcon from './WeatherIcon';

export default function WeatherWidget({ weatherData, currentCity, onOpenCityModal, isLoading, onRefresh }) {
  const current = weatherData?.current;
  const meta = current?.meta || { label: 'Partiellement nuageux', icon: 'CloudSun', dayColor: 'text-sky-300' };
  const hourly = weatherData?.hourly || [];

  return (
    <div className="bento-card p-5 sm:p-6 flex flex-col justify-between h-full relative overflow-hidden group w-full">
      {/* Background ambient lighting */}
      <div
        className="absolute -right-16 -top-16 w-48 h-48 rounded-full blur-3xl pointer-events-none opacity-40 transition-all duration-700"
        style={{ background: meta.bgGlow || 'rgba(56, 189, 248, 0.15)' }}
      />

      {/* Top Header: City & Refresh */}
      <div className="flex items-center justify-between z-10">
        <button
          onClick={onOpenCityModal}
          className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] hover:border-white/[0.15] transition-all text-xs text-zinc-200 group/btn touch-press"
          title="Changer de ville"
        >
          <MapPin className="w-3.5 h-3.5 text-sky-400 group-hover/btn:scale-110 transition-transform" />
          <span className="font-medium tracking-wide truncate max-w-[110px]">{currentCity?.name || 'Paris'}</span>
          <span className="text-[10px] text-zinc-400 hidden sm:inline">Modifier</span>
        </button>

        <div className="flex items-center gap-1.5">
          {isLoading && (
            <RefreshCw className="w-3 h-3 text-sky-400 animate-spin" />
          )}
          <span className="text-[10px] text-zinc-400 font-mono-numbers">
            {weatherData?.lastUpdated ? `MàJ ${weatherData.lastUpdated}` : ''}
          </span>
        </div>
      </div>

      {/* Current Weather Main Banner */}
      <div className="my-auto py-1 grid grid-cols-12 gap-2 items-center z-10">
        {/* Left side: Temp & condition */}
        <div className="col-span-8 flex flex-col">
          <div className="flex items-baseline gap-1">
            <span className="font-mono-numbers text-5xl sm:text-6xl font-extrabold text-white tracking-tighter leading-none">
              {current?.temp ?? '--'}
            </span>
            <span className="text-2xl font-light text-zinc-400 leading-none">°C</span>
          </div>

          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs sm:text-sm font-medium text-zinc-200 truncate">
              {meta.label}
            </span>
          </div>

          <div className="flex items-center gap-2.5 mt-0.5 text-[11px] text-zinc-400">
            <span>Ressenti {current?.apparentTemp ?? current?.temp ?? '--'}°</span>
            <span className="flex items-center text-emerald-400 font-mono-numbers">
              <ArrowUp className="w-2.5 h-2.5 inline mr-0.5" />{weatherData?.todayMax ?? '--'}°
            </span>
            <span className="flex items-center text-sky-400 font-mono-numbers">
              <ArrowDown className="w-2.5 h-2.5 inline mr-0.5" />{weatherData?.todayMin ?? '--'}°
            </span>
          </div>
        </div>

        {/* Right side: Icon */}
        <div className="col-span-4 flex flex-col items-center justify-center">
          <div className={`p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-md ${meta.dayColor} shadow-inner`}>
            <WeatherIcon name={meta.icon} className="w-10 h-10 sm:w-12 sm:h-12 stroke-[1.5]" />
          </div>
        </div>
      </div>

      {/* Stats Quick Pills */}
      <div className="grid grid-cols-4 gap-1.5 my-1 z-10">
        <div className="sub-card p-1.5 flex flex-col items-center justify-center text-center">
          <Droplets className="w-3.5 h-3.5 text-sky-400 mb-0.5" />
          <span className="text-[9px] text-zinc-400 uppercase tracking-wider">Humidité</span>
          <span className="text-xs font-semibold font-mono-numbers text-zinc-100">
            {current?.humidity ?? '--'}%
          </span>
        </div>

        <div className="sub-card p-1.5 flex flex-col items-center justify-center text-center">
          <Wind className="w-3.5 h-3.5 text-teal-400 mb-0.5" />
          <span className="text-[9px] text-zinc-400 uppercase tracking-wider">Vent</span>
          <span className="text-xs font-semibold font-mono-numbers text-zinc-100">
            {current?.windSpeed ?? '--'} <span className="text-[9px] font-normal text-zinc-400">km/h</span>
          </span>
        </div>

        <div className="sub-card p-1.5 flex flex-col items-center justify-center text-center">
          <Sun className="w-3.5 h-3.5 text-amber-400 mb-0.5" />
          <span className="text-[9px] text-zinc-400 uppercase tracking-wider">UV</span>
          <span className="text-xs font-semibold font-mono-numbers text-zinc-100">
            {current?.uvIndex ?? 0}
          </span>
        </div>

        <div className="sub-card p-1.5 flex flex-col items-center justify-center text-center">
          <Umbrella className="w-3.5 h-3.5 text-indigo-400 mb-0.5" />
          <span className="text-[9px] text-zinc-400 uppercase tracking-wider">Pluie</span>
          <span className="text-xs font-semibold font-mono-numbers text-zinc-100">
            {current?.precipitation ?? 0} <span className="text-[9px] font-normal text-zinc-400">mm</span>
          </span>
        </div>
      </div>

      {/* Hourly forecast ribbon */}
      {hourly.length > 0 && (
        <div className="pt-2 border-t border-white/[0.06] z-10">
          <div className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold mb-1 flex items-center justify-between">
            <span>Prochaines heures</span>
            <span className="text-zinc-500 font-normal">Aujourd'hui</span>
          </div>
          <div className="grid grid-cols-6 gap-1 overflow-hidden">
            {hourly.slice(0, 6).map((item, idx) => (
              <div
                key={idx}
                className="sub-card py-1.5 px-0.5 flex flex-col items-center justify-between transition-colors"
              >
                <span className="text-[10px] font-mono-numbers text-zinc-400">{item.time}</span>
                <div className="my-0.5 text-sky-300">
                  <WeatherIcon name={item.isDay ? 'SunMedium' : 'Moon'} className="w-3.5 h-3.5" />
                </div>
                <span className="text-[11px] font-semibold font-mono-numbers text-zinc-100">
                  {item.temp}°
                </span>
                {item.rainProb > 0 ? (
                  <span className="text-[8px] text-sky-400 font-mono-numbers">
                    {item.rainProb}%
                  </span>
                ) : (
                  <span className="text-[8px] text-zinc-600">-</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
