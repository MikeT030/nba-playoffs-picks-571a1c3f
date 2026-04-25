import { useEffect, useRef, useState, useCallback } from "react";

interface UsePullToRefreshOptions {
  /** Called when the user pulls past the threshold. Should return a promise. */
  onRefresh: () => Promise<unknown>;
  /** Pull distance (px) required to trigger refresh. Default: 70. */
  threshold?: number;
  /** Max visual pull distance (px) before resistance caps out. Default: 120. */
  maxPull?: number;
  /** Disable the gesture entirely. */
  disabled?: boolean;
}

/**
 * Pull-to-refresh gesture for mobile.
 *
 * Listens to touch events on `window` and only activates when the page is
 * already scrolled to the very top. Returns a `pullDistance` value (in px)
 * the consumer can use to render an indicator, plus an `isRefreshing` flag.
 */
export function usePullToRefresh({
  onRefresh,
  threshold = 70,
  maxPull = 120,
  disabled = false,
}: UsePullToRefreshOptions) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const startY = useRef<number | null>(null);
  const isTracking = useRef(false);
  const refreshingRef = useRef(false);

  const reset = useCallback(() => {
    startY.current = null;
    isTracking.current = false;
    setPullDistance(0);
  }, []);

  useEffect(() => {
    if (disabled) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (refreshingRef.current) return;
      // Only start tracking if the page is scrolled to the very top.
      if (window.scrollY > 0) return;
      startY.current = e.touches[0].clientY;
      isTracking.current = true;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isTracking.current || startY.current === null) return;
      const delta = e.touches[0].clientY - startY.current;
      if (delta <= 0) {
        // User is scrolling up — abandon the gesture.
        setPullDistance(0);
        return;
      }
      // Apply resistance so the pull feels "rubbery".
      const resisted = Math.min(maxPull, delta * 0.5);
      setPullDistance(resisted);
      // Prevent the browser's native overscroll bounce while pulling.
      if (e.cancelable) e.preventDefault();
    };

    const handleTouchEnd = async () => {
      if (!isTracking.current) return;
      const distance = pullDistance;
      isTracking.current = false;
      startY.current = null;

      if (distance >= threshold && !refreshingRef.current) {
        refreshingRef.current = true;
        setIsRefreshing(true);
        try {
          await onRefresh();
        } finally {
          refreshingRef.current = false;
          setIsRefreshing(false);
          setPullDistance(0);
        }
      } else {
        setPullDistance(0);
      }
    };

    // `passive: false` so we can preventDefault during the move.
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });
    window.addEventListener("touchcancel", reset, { passive: true });

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("touchcancel", reset);
    };
  }, [disabled, maxPull, threshold, onRefresh, pullDistance, reset]);

  return {
    pullDistance,
    isRefreshing,
    /** 0–1 progress toward the trigger threshold. */
    progress: Math.min(1, pullDistance / threshold),
  };
}
