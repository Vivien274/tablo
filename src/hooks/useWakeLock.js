import { useEffect, useRef } from 'react';

/**
 * Hook pour maintenir l'écran de l'iPad/tablette allumé 24h/24
 * Utilise la Screen Wake Lock API standard (supportée par Safari iPadOS 16.4+ et navigateurs modernes)
 */
export function useWakeLock() {
  const wakeLockRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const requestWakeLock = async () => {
      if ('wakeLock' in navigator && document.visibilityState === 'visible') {
        try {
          wakeLockRef.current = await navigator.wakeLock.request('screen');
        } catch (err) {
          // Peut échouer si batterie critique ou non supporté
          console.debug('Wake Lock request:', err.message);
        }
      }
    };

    // 1. Demande initiale du verrou de veille
    requestWakeLock();

    // 2. Réactivation automatique si la page redevient visible (changement d'onglet ou réveil)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        requestWakeLock();
      }
    };

    // 3. Réactivation sur premier toucher (au cas où la politique du navigateur exige un geste utilisateur)
    const handleFirstTouch = () => {
      requestWakeLock();
      window.removeEventListener('touchstart', handleFirstTouch);
      window.removeEventListener('click', handleFirstTouch);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('touchstart', handleFirstTouch, { passive: true });
    window.addEventListener('click', handleFirstTouch, { passive: true });

    return () => {
      isMounted = false;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('touchstart', handleFirstTouch);
      window.removeEventListener('click', handleFirstTouch);
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
        wakeLockRef.current = null;
      }
    };
  }, []);
}
