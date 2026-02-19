import { useEffect, useRef } from 'react';

export const useWakeLock = () => {
  const sentinelRef = useRef(null);

  useEffect(() => {
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          sentinelRef.current = await navigator.wakeLock.request('screen');
          console.log('Wake Lock is active');
        }
      } catch (err) {
        console.warn('Wake Lock request failed:', err);
      }
    };

    requestWakeLock();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      if (sentinelRef.current) sentinelRef.current.release();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
};