import { useSyncExternalStore } from 'react';
import { isLightweightPublicRouteNow } from '../routes/publicRoutePath';

function subscribe(callback: () => void) {
  window.addEventListener('hashchange', callback);
  window.addEventListener('popstate', callback);
  return () => {
    window.removeEventListener('hashchange', callback);
    window.removeEventListener('popstate', callback);
  };
}

/** `true` saat pengunjung berada di Public Packages / Public Booking. */
export function useIsLightweightPublicRoute(): boolean {
  return useSyncExternalStore(subscribe, isLightweightPublicRouteNow, () => false);
}
