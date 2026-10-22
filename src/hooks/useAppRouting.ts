import React, { useState, useEffect, useCallback } from "react";
import { NavigationAction, ViewType } from "../types";
import { LAST_ROUTE_STORAGE_KEY, ROUTE_TO_VIEW_MAP } from "../routes/routesConfig";

const LEGACY_VIEW_ALIASES: Record<string, ViewType> = {
  "manajemen klien": ViewType.CLIENTS,
  "laporan klien": ViewType.CLIENT_REPORTS,
  proyek: ViewType.CLIENTS,
  acara: ViewType.CLIENTS,
};

function decodeRoutePath(path: string): string {
  return path
    .split("/")
    .map(segment => {
      try {
        return decodeURIComponent(segment);
      } catch {
        return segment;
      }
    })
    .join("/");
}

export function resolveAuthenticatedViewFromHash(hash: string): ViewType | null {
  const rawRoute = hash.startsWith("#") ? hash.slice(1) : hash;
  const path = rawRoute.split("?")[0].replace(/^\/+/, "");
  if (!path) return null;

  const decodedPath = decodeRoutePath(path);
  const firstSegment = decodedPath.split("/")[0];
  if (firstSegment.toLowerCase() === "gallery" && decodedPath.includes("/")) return null;

  const routeView = ROUTE_TO_VIEW_MAP[firstSegment.toLowerCase()];
  if (routeView && routeView !== ViewType.HOMEPAGE) return routeView;
  const aliasedView = LEGACY_VIEW_ALIASES[firstSegment.toLowerCase()];
  if (aliasedView) return aliasedView;

  if (
    firstSegment.toLowerCase() === "projects" ||
    firstSegment === ViewType.PROJECTS
  ) {
    return ViewType.CLIENTS;
  }

  return Object.values(ViewType).find(view =>
    view.toLowerCase() === firstSegment.toLowerCase() ||
    view.toLowerCase().replace(/ /g, "-") === firstSegment.toLowerCase()
  ) ?? null;
}

function getInitialActiveView(isAuthenticated: boolean): ViewType {
  const routeView = resolveAuthenticatedViewFromHash(window.location.hash);
  if (routeView) return routeView;

  if (isAuthenticated) {
    try {
      const lastRoute = window.localStorage.getItem(LAST_ROUTE_STORAGE_KEY);
      if (lastRoute) {
        const storedView = resolveAuthenticatedViewFromHash(lastRoute);
        if (storedView) return storedView;
      }
    } catch (error) {
      console.warn("[Routing] Failed to read last route:", error);
    }
  }

  return ViewType.DASHBOARD;
}

export interface UseAppRoutingProps {
  isAuthenticated: boolean;
  profile: any;
  teamPaymentsLoaded: boolean;
  setTeamProjectPayments: React.Dispatch<React.SetStateAction<any[]>>;
  setTeamPaymentsLoaded: React.Dispatch<React.SetStateAction<boolean>>;
  onMarkNotificationRead: (id: string) => void;
  appDataLoader: {
    loadTotals: () => Promise<void>;
    loadClientFeedback: () => Promise<void>;
  };
}

export interface UseAppRoutingReturn {
  route: string;
  activeView: ViewType;
  setActiveView: React.Dispatch<React.SetStateAction<ViewType>>;
  isSidebarOpen: boolean;
  setIsSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isSearchOpen: boolean;
  setIsSearchOpen: React.Dispatch<React.SetStateAction<boolean>>;
  initialAction: NavigationAction | null;
  setInitialAction: React.Dispatch<React.SetStateAction<NavigationAction | null>>;
  handleNavigation: (view: ViewType, action?: NavigationAction, notificationId?: string) => void;
}

export function useAppRouting({
  isAuthenticated,
  profile,
  teamPaymentsLoaded,
  setTeamProjectPayments,
  setTeamPaymentsLoaded,
  onMarkNotificationRead,
  appDataLoader,
}: UseAppRoutingProps): UseAppRoutingReturn {
  const [activeView, setActiveView] = useState<ViewType>(() => getInitialActiveView(isAuthenticated));
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [initialAction, setInitialAction] = useState<NavigationAction | null>(null);
  // Route sebagai reactive state agar App re-render saat hash berubah
  const [route, setRoute] = useState<string>(
    () => window.location.hash.slice(1) || "/"
  );

  // Sync route hash with active view
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1); // Remove #
      if (hash) {
        const [pathAndQuery, queryString] = hash.split("?");
        const resolvedView = resolveAuthenticatedViewFromHash(pathAndQuery);
        if (resolvedView) {
          setActiveView(resolvedView);
          setRoute(`/${resolvedView}`);

          if (queryString) {
            const params = new URLSearchParams(queryString);
            const actionType = params.get('action');
            const id = params.get('id');
            const tab = params.get('tab') as any;
            const notifId = params.get('notifId');

            if (actionType || id) {
              setInitialAction({
                type: actionType || 'VIEW',
                id: id || undefined,
                tab: tab || undefined,
              });
            }
            if (notifId && onMarkNotificationRead) {
              onMarkNotificationRead(notifId);
            }
          }
        } else {
          setRoute(hash);
        }
      } else {
        setRoute("/");
      }
    };

    window.addEventListener("hashchange", handleHashChange);
    handleHashChange(); // Initial check

    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, [onMarkNotificationRead]);

  // Persist last route for post-login redirect
  useEffect(() => {
    if (isAuthenticated) {
      try {
        window.localStorage.setItem(LAST_ROUTE_STORAGE_KEY, `#/${encodeURIComponent(activeView)}`);
      } catch (e) {
        console.warn("[Routing] Failed to persist last route:", e);
      }
    }
  }, [isAuthenticated, activeView]);

  // Handle navigation with optional action and notificationId for deep linking
  const handleNavigation = useCallback(
    (view: ViewType, action?: NavigationAction, notificationId?: string) => {
      const resolvedView = view === ViewType.PROJECTS ? ViewType.CLIENTS : view;
      setActiveView(resolvedView);
      if (action) {
        setInitialAction(action);
      }
      if (notificationId && onMarkNotificationRead) {
        onMarkNotificationRead(notificationId);
      }
      const queryParts = [];
      if (action?.type) queryParts.push(`action=${encodeURIComponent(action.type)}`);
      if (action?.id) queryParts.push(`id=${encodeURIComponent(action.id)}`);
      if (action?.tab) queryParts.push(`tab=${encodeURIComponent(action.tab)}`);
      if (notificationId) queryParts.push(`notifId=${encodeURIComponent(notificationId)}`);

      const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
      window.location.hash = `/${encodeURIComponent(resolvedView)}${queryString}`;
      setIsSidebarOpen(false);
      setIsSearchOpen(false);
    },
    [onMarkNotificationRead],
  );

  return {
    route,
    activeView,
    setActiveView,
    isSidebarOpen,
    setIsSidebarOpen,
    isSearchOpen,
    setIsSearchOpen,
    initialAction,
    setInitialAction,
    handleNavigation,
  };
}

export default useAppRouting;
