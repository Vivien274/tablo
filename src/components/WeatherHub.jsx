import React from 'react';
import {
  Droplets,
  Wind,
  Sun,
  Umbrella,
  ShieldCheck,
} from 'lucide-react';
import WeatherIcon from './WeatherIcon';
import { getWeatherMeta } from '../services/weatherService';

function getWeatherBlobStyle(weatherData, meta) {
  const current = weatherData?.current;
  const temp = current?.temp ?? 20;
  const code = current?.code ?? current?.weatherCode ?? 1;
  const isDay = current?.isDay ?? 1;
  const precip = current?.precipitation ?? 0;

  // 1. Très chaud (temp >= 28°C) en journée -> Orange chaud / canicule
  if (temp >= 28 && isDay) {
    return {
      background: 'radial-gradient(circle at 0% 0%, rgba(249, 115, 22, 0.35) 0%, rgba(234, 88, 12, 0.12) 45%, transparent 75%)',
    };
  }

  // 2. Orage (codes 95, 96, 82) -> Violet / Pourpre
  if (code === 95 || code === 96 || code === 82) {
    return {
      background: 'radial-gradient(circle at 0% 0%, rgba(168, 85, 247, 0.35) 0%, rgba(126, 34, 206, 0.12) 45%, transparent 75%)',
    };
  }

  // 3. Pluie / Averses / Bruine -> Bleu pluie
  if ((code >= 51 && code <= 67) || code === 80 || code === 81 || precip > 0.5) {
    return {
      background: 'radial-gradient(circle at 0% 0%, rgba(59, 130, 246, 0.35) 0%, rgba(14, 165, 233, 0.12) 45%, transparent 75%)',
    };
  }

  // 4. Neige / Verglas / Grand froid (temp <= 0°C ou codes 71-77, 85, 86) -> Bleu glacier / Cyan
  if ((code >= 71 && code <= 77) || code === 85 || code === 86 || temp <= 0) {
    return {
      background: 'radial-gradient(circle at 0% 0%, rgba(186, 230, 253, 0.35) 0%, rgba(56, 189, 248, 0.12) 45%, transparent 75%)',
    };
  }

  // 5. Soleil / Ciel dégagé (codes 0, 1) en journée -> Jaune soleil
  if ((code === 0 || code === 1) && isDay) {
    if (temp >= 24) {
      // Tiède/chaud (24-27°C) : jaune orangé
      return {
        background: 'radial-gradient(circle at 0% 0%, rgba(251, 146, 60, 0.35) 0%, rgba(245, 158, 11, 0.12) 45%, transparent 75%)',
      };
    }
    // Jaune éclatant
    return {
      background: 'radial-gradient(circle at 0% 0%, rgba(250, 204, 21, 0.35) 0%, rgba(234, 179, 8, 0.12) 45%, transparent 75%)',
    };
  }

  // 6. Nuit dégagée -> Indigo / Nuit claire
  if (!isDay && (code === 0 || code === 1)) {
    return {
      background: 'radial-gradient(circle at 0% 0%, rgba(99, 102, 241, 0.30) 0%, rgba(79, 70, 229, 0.10) 45%, transparent 75%)',
    };
  }

  // 7. Nuageux avec éclaircies (code 2) -> Azur ciel
  if (code === 2) {
    return {
      background: 'radial-gradient(circle at 0% 0%, rgba(56, 189, 248, 0.30) 0%, rgba(250, 204, 21, 0.08) 45%, transparent 75%)',
    };
  }

  // Couvert / standard -> Ardoise doux
  return {
    background: 'radial-gradient(circle at 0% 0%, rgba(148, 163, 184, 0.25) 0%, rgba(56, 189, 248, 0.08) 45%, transparent 75%)',
  };
}

export default function WeatherHub({ weatherData }) {
  const current = weatherData?.current;
  const meta = current?.meta || { label: 'Partiellement nuageux', icon: 'CloudSun', dayColor: 'text-sky-300' };
  const daily = weatherData?.daily || [];
  const nextDays = daily.length > 0 ? daily.slice(1, 6) : [];

  return (
    <div className="bento-card p-4 sm:p-5 flex flex-col justify-between h-full relative overflow-hidden group w-full">
      {/* Blob météo dynamique : dégradé radial doux épousant l'arrondi sans débordement carré */}
      <div
        className="absolute top-0 left-0 w-80 h-80 pointer-events-none rounded-tl-3xl transition-all duration-1000"
        style={getWeatherBlobStyle(weatherData, meta)}
      />

      {/* 
        1. PARTIE SUPÉRIEURE (Répartition 40% / 60%) :
        - Colonne Gauche (40%) : Picto + Température + Ressenti centrés sur l'axe
        - Colonne Droite (60%) : Titre condition (Couvert) + Grille 2x2 des métriques (💧, 💨, ☀️, 🍃)
      */}
      <div className="grid grid-cols-12 gap-2 sm:gap-4 items-center z-10 my-auto h-full">
        {/* Colonne Gauche : 40% de la largeur (col-span-5) */}
        <div className="col-span-5 flex flex-col justify-center items-center pr-1">
          {/* Picto météo centré */}
          <div className={`${meta.dayColor} mb-1 flex items-center justify-center`}>
            <WeatherIcon name={meta.icon} className="w-10 h-10 sm:w-12 sm:h-12 stroke-[1.5]" />
          </div>

          {/* Température centrée */}
          <div className="flex items-baseline leading-none justify-center">
            <span className="font-mono-numbers text-5xl sm:text-6xl font-black text-white tracking-tighter">
              {current?.temp ?? '--'}
            </span>
            <span className="text-2xl sm:text-3xl font-light text-zinc-400 ml-0.5">°</span>
          </div>

          {/* Ressenti centré */}
          <span className="text-xs sm:text-sm text-zinc-400 font-medium mt-1 text-center">
            Ressenti {current?.apparentTemp ?? current?.temp ?? '--'}°c
          </span>
        </div>

        {/* Colonne Droite : 60% de la largeur (col-span-7) */}
        <div className="col-span-7 flex flex-col justify-center pl-2 sm:pl-4 border-l border-white/[0.04]">
          {/* Titre Condition (ex: Couvert) */}
          <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight capitalize mb-2.5">
            {meta.label}
          </h3>

          {/* Grille 2x2 des métriques */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs sm:text-sm font-mono-numbers text-zinc-200">
            {/* Humidité */}
            <div className="flex items-center gap-2">
              <Droplets className="w-4 h-4 text-sky-400 shrink-0" />
              <span>{current?.humidity ?? '--'}%</span>
            </div>

            {/* Vent */}
            <div className="flex items-center gap-2">
              <Wind className="w-4 h-4 text-teal-400 shrink-0" />
              <span>{current?.windSpeed ?? '--'} <span className="text-xs text-zinc-400">km/h</span></span>
            </div>

            {/* Indice UV */}
            <div className="flex items-center gap-2">
              <Sun className="w-4 h-4 text-amber-400 shrink-0" />
              <span>UV {current?.uvIndex ?? 0}</span>
            </div>

            {/* Qualité d'air */}
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-xs text-emerald-300 font-sans">Air bon</span>
            </div>
          </div>
        </div>
      </div>

      {/* LIGNE DE SÉPARATION */}
      <div className="border-t border-white/[0.08] my-2 z-10 w-full" />

      {/* 
        2. PARTIE INFÉRIEURE : 5 JOURS
        - Colonnes : Mer | Jeu | Ven | Sam | Dim
      */}
      <div className="grid grid-cols-5 gap-2 z-10 w-full text-center">
        {nextDays.map((day, idx) => {
          const dayMeta = getWeatherMeta(day.code, 1);
          return (
            <div
              key={idx}
              className="flex flex-col items-center justify-between gap-1 py-1 px-1 rounded-lg hover:bg-white/[0.03] transition-colors"
            >
              {/* Nom du jour */}
              <span className="text-xs sm:text-sm font-semibold text-zinc-200 capitalize">
                {day.dayName.slice(0, 3)}
              </span>

              {/* Icône météo */}
              <div className={`my-0.5 ${dayMeta.dayColor}`}>
                <WeatherIcon name={dayMeta.icon} className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>

              {/* Températures Max / Min */}
              <div className="text-xs sm:text-sm font-mono-numbers text-zinc-100 font-medium">
                <span>{day.maxTemp}°</span>
                <span className="text-zinc-500 mx-0.5">/</span>
                <span className="text-zinc-400">{day.minTemp}°</span>
              </div>

              {/* Probabilité de pluie */}
              <div className="text-[11px] font-mono-numbers text-sky-400 flex items-center gap-0.5">
                {day.rainProb > 10 ? (
                  <>
                    <Umbrella className="w-3 h-3 inline" />
                    <span>{day.rainProb}%</span>
                  </>
                ) : (
                  <span className="text-zinc-600">-</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
