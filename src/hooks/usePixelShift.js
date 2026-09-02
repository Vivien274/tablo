import { useState, useEffect } from 'react';

// Positions de décalage subtil anti-marquage OLED / LCD (en pixels)
const DRIFT_OFFSETS = [
  { x: 0, y: 0 },
  { x: 3, y: 2 },
  { x: -3, y: 3 },
  { x: 4, y: -2 },
  { x: -2, y: -3 },
  { x: 2, y: -4 },
  { x: -4, y: 1 },
  { x: 1, y: 4 },
];

export function usePixelShift(intervalMs = 60000) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setStep((prev) => (prev + 1) % DRIFT_OFFSETS.length);
    }, intervalMs);

    return () => clearInterval(timer);
  }, [intervalMs]);

  const offset = DRIFT_OFFSETS[step];

  return {
    x: offset.x,
    y: offset.y,
    style: {
      transform: `translate3d(${offset.x}px, ${offset.y}px, 0)`,
      transition: 'transform 8s ease-in-out',
    },
  };
}
