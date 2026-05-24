import { useCallback, useEffect, useRef, useState } from 'react';

interface UseNestedScrollDragLockOptions {
  reenableDelayMs?: number;
}

/**
 * Parent ScrollView scroll'unu sürükle-bırak sırasında kapatır;
 * bırakıldıktan sonra kısa gecikmeyle tekrar açar (nested scroll çakışmasını önler).
 */
export function useNestedScrollDragLock(
  options: UseNestedScrollDragLockOptions = {},
) {
  const { reenableDelayMs = 1000 } = options;
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const reenableTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearReenableTimer = useCallback(() => {
    if (reenableTimerRef.current) {
      clearTimeout(reenableTimerRef.current);
      reenableTimerRef.current = null;
    }
  }, []);

  const setDragInteractionActive = useCallback(
    (isActive: boolean) => {
      if (isActive) {
        clearReenableTimer();
        setScrollEnabled(false);

        return;
      }

      if (reenableDelayMs <= 0) {
        setScrollEnabled(true);

        return;
      }

      clearReenableTimer();
      reenableTimerRef.current = setTimeout(() => {
        setScrollEnabled(true);
        reenableTimerRef.current = null;
      }, reenableDelayMs);
    },
    [clearReenableTimer, reenableDelayMs],
  );

  useEffect(() => {
    return () => {
      clearReenableTimer();
    };
  }, [clearReenableTimer]);

  return {
    scrollEnabled,
    setDragInteractionActive,
  };
}
