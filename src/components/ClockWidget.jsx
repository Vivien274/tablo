import React, { useState, useEffect } from 'react';
import { Sunrise, Sunset, Calendar, Sparkles } from 'lucide-react';

const SAINTS_CALENDAR = {
  '01-01': 'Jour de l\'An',
  '01-09': 'St Gilles',
  '02-09': 'Ste Ingrid',
  '03-09': 'St Grégoire',
  '04-09': 'Ste Rosalie',
  '05-09': 'Ste Raïssa',
  '06-09': 'St Bertrand',
  '07-09': 'Ste Reine',
  '08-09': 'Nativité de Marie',
  '09-09': 'St Alain',
  '10-09': 'Ste Inès',
  '11-09': 'St Adelphe',
  '12-09': 'St Apollinaire',
  '13-09': 'St Aimé',
  '14-09': 'La Sainte Croix',
  '15-09': 'St Roland',
  '16-09': 'Ste Édith',
  '17-09': 'St Renaud',
  '18-09': 'Ste Nadège',
  '19-09': 'Ste Émilie',
  '20-09': 'St Davy',
  '21-09': 'St Matthieu',
  '22-09': 'St Maurice',
  '23-09': 'St Constant',
  '24-09': 'Ste Thècle',
  '25-09': 'St Hermann',
  '26-09': 'St Côme',
  '27-09': 'St Vincent de Paul',
  '28-09': 'St Venceslas',
  '29-09': 'St Michel',
  '30-09': 'St Jérôme',
};

function getSaint(date) {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const key = `${day}-${month}`;
  return SAINTS_CALENDAR[key] || 'Bonne fête';
}

function getGreeting(hour) {
  if (hour >= 5 && hour < 12) return { text: 'Bonjour la maison', icon: '☀️' };
  if (hour >= 12 && hour < 14) return { text: 'Bon appétit', icon: '🍽️' };
  if (hour >= 14 && hour < 18) return { text: 'Bel après-midi', icon: '🌿' };
  if (hour >= 18 && hour < 22) return { text: 'Bonne soirée', icon: '✨' };
  return { text: 'Bonne nuit', icon: '🌙' };
}

function getWeekNumber(d) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
}

export default function ClockWidget({ weatherData }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

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

  const weekNum = getWeekNumber(time);
  const greeting = getGreeting(time.getHours());
  const saintName = getSaint(time);

  const sunrise = weatherData?.sunrise || '07:15';
  const sunset = weatherData?.sunset || '20:30';

  return (
    <div className="bento-card p-4 sm:p-5 flex flex-col justify-between h-full relative group overflow-hidden w-full">
      {/* Ambient Glow : Dégradé radial doux épousant l'arrondi sans débordement carré */}
      <div
        className="absolute top-0 left-0 w-80 h-80 pointer-events-none rounded-tl-3xl"
        style={{
          background: 'radial-gradient(circle at 0% 0%, rgba(56, 189, 248, 0.16) 0%, rgba(56, 189, 248, 0.04) 50%, transparent 75%)',
        }}
      />

      {/* Barre supérieure compacte */}
      <div className="flex items-center justify-between z-10 w-full">
        <div className="inline-flex items-center gap-1.5 text-zinc-300">
          <span className="text-xs">{greeting.icon}</span>
          <span className="text-xs font-medium tracking-wide text-zinc-300">
            {greeting.text}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-mono-numbers text-[11px] text-zinc-400">
            Semaine {weekNum}
          </span>
        </div>
      </div>

      {/* CENTRE : HEURE & DATE PARFAITEMENT CENTRÉES */}
      <div className="my-auto z-10 flex flex-col items-center justify-center text-center w-full">
        <div className="flex items-baseline tracking-tight justify-center w-full">
          <span className="font-mono-numbers text-6xl sm:text-7xl md:text-8xl lg:text-[6.5rem] font-black text-white tracking-tighter drop-shadow-2xl leading-none">
            {hours}
          </span>
          <span className="font-mono-numbers text-5xl sm:text-6xl md:text-7xl lg:text-[5.5rem] font-extralight text-sky-400/90 mx-1 animate-pulse-soft select-none">
            :
          </span>
          <span className="font-mono-numbers text-6xl sm:text-7xl md:text-8xl lg:text-[6.5rem] font-black text-white tracking-tighter drop-shadow-2xl leading-none">
            {minutes}
          </span>
          <span className="font-mono-numbers text-xl sm:text-2xl text-zinc-500 font-medium ml-2 opacity-80 self-end mb-1">
            {seconds}
          </span>
        </div>

        {/* Date complète centrée */}
        <div className="flex items-center justify-center gap-2 mt-1.5 text-zinc-300 font-display">
          <Calendar className="w-4 h-4 text-sky-400 shrink-0" />
          <span className="text-base sm:text-lg md:text-xl font-semibold tracking-wide text-zinc-100 truncate">
            {capitalizedDate}
          </span>
        </div>
      </div>

      {/* Ligne inférieure compacte */}
      <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-zinc-400 z-10 w-full">
        <div className="flex items-center gap-1.5 truncate">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="truncate text-zinc-300 font-medium">
            {saintName}
          </span>
        </div>

        <div className="flex items-center gap-3 text-zinc-400 shrink-0 font-mono-numbers">
          <div className="flex items-center gap-1" title="Lever">
            <Sunrise className="w-3.5 h-3.5 text-amber-300" />
            <span className="text-zinc-300">{sunrise}</span>
          </div>
          <div className="flex items-center gap-1" title="Coucher">
            <Sunset className="w-3.5 h-3.5 text-orange-400" />
            <span className="text-zinc-300">{sunset}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
