import React from 'react';
import { CalendarDays, Umbrella } from 'lucide-react';
import WeatherIcon from './WeatherIcon';
import { getWeatherMeta } from '../services/weatherService';

export default function ForecastWidget({ dailyForecast }) {
  const days = dailyForecast && dailyForecast.length > 0 ? dailyForecast.slice(1, 6) : [];

  // Compute min & max across all 5 days to normalize temperature bars
  const allMins = days.map((d) => d.minTemp || 0);
  const allMaxs = days.map((d) => d.maxTemp || 25);
  const overallMin = allMins.length > 0 ? Math.min(...allMins) : 10;
  const overallMax = allMaxs.length > 0 ? Math.max(...allMaxs) : 30;
  const tempRange = Math.max(overallMax - overallMin, 1);

  return (
    <div className="bento-card p-5 sm:p-6 flex flex-col justify-between h-full relative group">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-sky-400" />
          <h3 className="text-xs sm:text-sm font-semibold tracking-wide text-zinc-200">
            Prévisions 5 jours
          </h3>
        </div>
        <span className="text-[11px] text-zinc-400 font-mono-numbers">Semaine</span>
      </div>

      {/* Days list */}
      <div className="flex flex-col justify-between flex-1 py-1 divide-y divide-white/[0.04]">
        {days.map((day, idx) => {
          const meta = getWeatherMeta(day.code, 1);

          // Calculate percentage width and offset for temperature range bar
          const leftPercent = Math.max(0, Math.min(75, ((day.minTemp - overallMin) / tempRange) * 100));
          const widthPercent = Math.max(25, Math.min(100 - leftPercent, ((day.maxTemp - day.minTemp) / tempRange) * 100));

          return (
            <div
              key={idx}
              className="py-2 flex items-center justify-between gap-2 hover:bg-white/[0.02] rounded-lg px-1 transition-colors"
            >
              {/* Day name */}
              <div className="w-12 sm:w-14 text-xs sm:text-sm font-medium text-zinc-300">
                {day.dayName}
              </div>

              {/* Weather icon & rain % */}
              <div className="flex items-center gap-1.5 w-16 justify-start">
                <div className={`${meta.dayColor} shrink-0`}>
                  <WeatherIcon name={meta.icon} className="w-4 h-4" />
                </div>
                {day.rainProb > 10 ? (
                  <span className="text-[10px] sm:text-xs font-mono-numbers text-sky-400 flex items-center gap-0.5">
                    <Umbrella className="w-2.5 h-2.5 inline" />
                    {day.rainProb}%
                  </span>
                ) : (
                  <span className="text-[10px] text-zinc-600">-</span>
                )}
              </div>

              {/* Visual Temperature Bar (Min -> Max) */}
              <div className="flex-1 flex items-center gap-1.5 min-w-[100px] max-w-[170px]">
                <span className="text-[11px] sm:text-xs font-mono-numbers text-zinc-400 w-5 text-right shrink-0">
                  {day.minTemp}°
                </span>

                <div className="flex-1 h-1.5 sm:h-2 bg-white/[0.08] rounded-full relative overflow-hidden">
                  <div
                    className="absolute top-0 bottom-0 rounded-full bg-gradient-to-r from-sky-400 via-amber-400 to-rose-400"
                    style={{
                      left: `${leftPercent}%`,
                      width: `${widthPercent}%`,
                    }}
                  />
                </div>

                <span className="text-[11px] sm:text-xs font-semibold font-mono-numbers text-zinc-100 w-5 text-left shrink-0">
                  {day.maxTemp}°
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
