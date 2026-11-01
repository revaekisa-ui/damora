import { useEffect, useState } from 'react';
import { ViewType } from '../types';
import { resolveAuthenticatedViewFromHash } from './useAppRouting';
import { LAST_ROUTE_STORAGE_KEY } from '../routes/routesConfig';

function getCurrentView(): ViewType {
  const hashView = resolveAuthenticatedViewFromHash(window.location.hash);
  if (hashView) return hashView;
  try {
    const savedRoute = window.localStorage.getItem(LAST_ROUTE_STORAGE_KEY);
    if (savedRoute) {
      const savedView = resolveAuthenticatedViewFromHash(savedRoute);
      if (savedView) return savedView;
    }
  } catch {
    // Route selection can still fall back safely if browser storage is blocked.
  }
  return ViewType.DASHBOARD;
}

/** Tracks the active hash route so the shared data provider can defer unrelated queries. */
export function useCurrentAuthenticatedView(): ViewType {
  const [view, setView] = useState<ViewType>(getCurrentView);

  useEffect(() => {
    const sync = () => setView(getCurrentView());
    window.addEventListener('hashchange', sync);
    sync();
    return () => window.removeEventListener('hashchange', sync);
  }, []);

  return view;
}
