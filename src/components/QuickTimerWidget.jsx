import React, { useState, useEffect } from 'react';
import { Timer, Play, Pause, RotateCcw, Plus } from 'lucide-react';
import { playTimerAlarm } from '../utils/audio';

const PRESETS = [
  { label: '3m', seconds: 180, name: 'Œuf' },
  { label: '5m', seconds: 300, name: 'Thé' },
  { label: '10m', seconds: 600, name: 'Pâtes' },
  { label: '15m', seconds: 900, name: 'Cuisson' },
];

export default function QuickTimerWidget({ className = '' }) {
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [currentLabel, setCurrentLabel] = useState('');
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    let interval = null;
    if (isActive && remainingSeconds > 0) {
      interval = setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            setIsActive(false);
            setIsFinished(true);
            playTimerAlarm();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, remainingSeconds]);

  const startPreset = (preset) => {
    setTotalSeconds(preset.seconds);
    setRemainingSeconds(preset.seconds);
    setCurrentLabel(preset.name);
    setIsActive(true);
    setIsFinished(false);
  };

  const toggleTimer = () => {
    if (remainingSeconds === 0 && totalSeconds > 0) {
      setRemainingSeconds(totalSeconds);
      setIsActive(true);
      setIsFinished(false);
      return;
    }
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    setRemainingSeconds(0);
    setTotalSeconds(0);
    setCurrentLabel('');
    setIsFinished(false);
  };

  const addOneMinute = () => {
    setRemainingSeconds((prev) => prev + 60);
    setTotalSeconds((prev) => Math.max(prev, remainingSeconds + 60));
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const progress = totalSeconds > 0 ? ((totalSeconds - remainingSeconds) / totalSeconds) * 100 : 0;

  return (
    <div
      className={`bento-card p-4 sm:p-5 flex flex-col justify-between h-full relative overflow-hidden transition-all duration-300 ${
        isFinished ? 'border-amber-500/50 bg-amber-950/20 shadow-lg shadow-amber-500/10' : ''
      } ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
        <div className="flex items-center gap-1.5">
          <Timer className={`w-3.5 h-3.5 ${isFinished ? 'text-amber-400 animate-bounce' : 'text-amber-400'}`} />
          <h3 className="text-xs font-semibold tracking-wide text-zinc-200">
            Minuteur Express
          </h3>
        </div>
        {currentLabel && (
          <span className="text-[11px] text-amber-400 font-medium truncate max-w-[100px]">
            {currentLabel}
          </span>
        )}
      </div>

      {/* Main Content */}
      <div className="my-auto py-1 flex flex-col items-center justify-center">
        {totalSeconds > 0 ? (
          <div className="w-full flex flex-col items-center">
            <div
              className={`font-mono-numbers text-3xl sm:text-4xl font-black tracking-tight ${
                isFinished ? 'text-amber-400 animate-pulse' : 'text-white'
              }`}
            >
              {formatTime(remainingSeconds)}
            </div>

            {/* Progress line */}
            <div className="w-full max-w-[180px] bg-white/10 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-amber-400 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={toggleTimer}
                className="px-3 py-1 rounded-lg bg-amber-500 text-zinc-950 font-bold text-xs flex items-center gap-1 hover:bg-amber-400 transition-colors touch-press"
              >
                {isActive ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                <span>{isActive ? 'Pause' : 'Reprendre'}</span>
              </button>

              <button
                onClick={addOneMinute}
                className="px-2 py-1 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-zinc-200 text-xs font-mono-numbers transition-colors touch-press"
                title="Ajouter 1 min"
              >
                +1m
              </button>

              <button
                onClick={resetTimer}
                className="p-1.5 rounded-lg bg-white/[0.06] hover:bg-rose-500/20 hover:text-rose-300 text-zinc-400 transition-colors touch-press"
                title="Arrêter"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-1.5 w-full">
            {PRESETS.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => startPreset(preset)}
                className="sub-card py-2 px-1 flex flex-col items-center justify-center hover:border-amber-500/30 hover:bg-amber-500/10 transition-all group/preset touch-press"
              >
                <span className="text-xs font-bold font-mono-numbers text-zinc-100 group-hover/preset:text-amber-400">
                  {preset.label}
                </span>
                <span className="text-[10px] text-zinc-400 truncate mt-0.5">
                  {preset.name}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {isFinished && (
        <div className="text-center text-[11px] font-semibold text-amber-400 animate-pulse">
          🔔 Terminé !
        </div>
      )}
    </div>
  );
}
