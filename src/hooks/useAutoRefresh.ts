import { useEffect, useRef } from 'react';

// Custom event name for instant real-time synchronization across all components & tabs
export const HSE_AUTO_REFRESH_EVENT = 'HSE_AUTO_REFRESH_EVENT';

/**
 * Trigger an instant refresh signal across all open components and tabs.
 * Can be called manually from any refresh button or after data mutations.
 */
export function triggerGlobalDataRefresh(): void {
  try {
    window.dispatchEvent(new CustomEvent(HSE_AUTO_REFRESH_EVENT, { detail: { timestamp: Date.now() } }));
    // Also notify across different browser tabs/windows if applicable
    localStorage.setItem('HSE_LAST_GLOBAL_REFRESH', String(Date.now()));
  } catch (err) {
    console.debug('Error dispatching global refresh event:', err);
  }
}

interface AutoRefreshOptions {
  /**
   * Interval in milliseconds. Default: 60,000ms (1 minute).
   * Set to 0 to disable interval-based polling.
   */
  intervalMs?: number;
  /**
   * Whether to refresh when user returns to this browser tab (document.visibilityState === 'visible')
   * Default: true
   */
  refreshOnVisibility?: boolean;
  /**
   * Whether to refresh when window regains focus
   * Default: true
   */
  refreshOnFocus?: boolean;
  /**
   * Whether to listen to global refresh events dispatched across the app
   * Default: true
   */
  listenToGlobalEvent?: boolean;
}

/**
 * Reusable React Hook for automated live data polling & background synchronization.
 * Keeps every part of the app automatically updated with live data without freezing the UI.
 *
 * @param refreshCallback Async or sync function that re-fetches or refreshes data for the component
 * @param options AutoRefreshOptions configuration
 */
export function useAutoRefresh(
  refreshCallback: () => void | Promise<any>,
  options: AutoRefreshOptions = {}
): void {
  const {
    intervalMs = 60000, // 60 seconds default
    refreshOnVisibility = true,
    refreshOnFocus = true,
    listenToGlobalEvent = true,
  } = options;

  const callbackRef = useRef(refreshCallback);
  callbackRef.current = refreshCallback;

  // Track last refresh execution time to throttle overly rapid bursts (e.g. rapid alt-tabbing)
  const lastRunRef = useRef<number>(0);

  useEffect(() => {
    const executeRefresh = () => {
      const now = Date.now();
      // Throttle slightly so rapid focus/event changes within 3 seconds don't trigger repeated requests
      if (now - lastRunRef.current < 3000) {
        return;
      }
      lastRunRef.current = now;

      try {
        const result = callbackRef.current();
        if (result && typeof (result as any).catch === 'function') {
          (result as any).catch((err: any) => {
            console.debug('Auto-refresh callback error:', err);
          });
        }
      } catch (err) {
        console.debug('Auto-refresh synchronous error:', err);
      }
    };

    // 1. Periodic background timer interval
    let timerId: any = null;
    if (intervalMs > 0) {
      timerId = setInterval(() => {
        // Only run interval when document is visible to save battery/bandwidth
        if (typeof document === 'undefined' || document.visibilityState === 'visible') {
          executeRefresh();
        }
      }, intervalMs);
    }

    // 2. Refresh immediately when tab becomes visible (user switches back)
    const handleVisibilityChange = () => {
      if (refreshOnVisibility && document.visibilityState === 'visible') {
        executeRefresh();
      }
    };

    // 3. Refresh when window regains focus
    const handleFocus = () => {
      if (refreshOnFocus) {
        executeRefresh();
      }
    };

    // 4. Global broadcast event listener (e.g. from top refresh button or other pages)
    const handleGlobalRefresh = () => {
      if (listenToGlobalEvent) {
        executeRefresh();
      }
    };

    // 5. Cross-tab storage event
    const handleStorage = (e: StorageEvent) => {
      if (listenToGlobalEvent && e.key === 'HSE_LAST_GLOBAL_REFRESH') {
        executeRefresh();
      }
    };

    if (refreshOnVisibility) {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }
    if (refreshOnFocus) {
      window.addEventListener('focus', handleFocus);
    }
    if (listenToGlobalEvent) {
      window.addEventListener(HSE_AUTO_REFRESH_EVENT, handleGlobalRefresh);
      window.addEventListener('storage', handleStorage);
    }

    return () => {
      if (timerId) clearInterval(timerId);
      if (refreshOnVisibility) {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
      if (refreshOnFocus) {
        window.removeEventListener('focus', handleFocus);
      }
      if (listenToGlobalEvent) {
        window.removeEventListener(HSE_AUTO_REFRESH_EVENT, handleGlobalRefresh);
        window.removeEventListener('storage', handleStorage);
      }
    };
  }, [intervalMs, refreshOnVisibility, refreshOnFocus, listenToGlobalEvent]);
}
