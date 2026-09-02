// Synthétiseur audio Web Audio API autonome pour Tablo (Chimes & Notifications discrètes)

let audioCtx = null;

function getAudioContext() {
  if (!audioCtx && typeof window !== 'undefined') {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      audioCtx = new AudioContext();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// Bip doux / carillon de succès (pour todo cochée)
export function playSuccessChime() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, now); // C5
    osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.08); // E5
    osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.16); // G5
    osc.frequency.exponentialRampToValueAtTime(1046.50, now + 0.24); // C6

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.6);
  } catch (e) {
    console.error('Audio play error:', e);
  }
}

// Alerte de fin de minuteur cuisine (doux carillon répété 3 fois)
export function playTimerAlarm() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const playBell = (startTime, freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.2, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.8);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.8);
    };

    const now = ctx.currentTime;
    playBell(now, 880); // A5
    playBell(now + 0.2, 1108.73); // C#6
    playBell(now + 0.4, 1318.51); // E6
    playBell(now + 0.7, 1760); // A6
  } catch (e) {
    console.error('Audio play error:', e);
  }
}
