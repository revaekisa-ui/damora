/** Public pages that fetch their own record(s) and do not need app-wide data. */
const LIGHTWEIGHT_PUBLIC_PREFIXES = [
  "/public-packages",
  "/public-booking",
  "/public-lead-form",
  "/feedback",
  "/suggestion-form",
  "/gallery/",
  "/portfolio/",
  "/invoice/",
  "/portal/invoice/",
  "/receipt/",
  "/portal/receipt/",
  "/checklist-portal/",
  "/project/",
  "/link/",
];
const LIGHTWEIGHT_PUBLIC_EXACT_ROUTES = new Set(["/", "/home", "/login", "/link", "/profile"]);
const CATALOG_PUBLIC_PREFIXES = ["/public-packages", "/public-booking"];
const PROFILE_CONTEXT_PUBLIC_PREFIXES = [...CATALOG_PUBLIC_PREFIXES, "/public-lead-form"];
const PROFILE_CONTEXT_PUBLIC_EXACT_ROUTES = new Set(["/", "/home", "/profile"]);

export function isLightweightPublicRoute(route: string): boolean {
  const r = (route.startsWith("#") ? route.slice(1) : route).split(/[?#]/)[0] || "/";
  return LIGHTWEIGHT_PUBLIC_EXACT_ROUTES.has(r) || LIGHTWEIGHT_PUBLIC_PREFIXES.some(prefix => r.startsWith(prefix));
}

/** Catalog and booking pages still need their small, explicit catalog queries. */
export function isCatalogPublicRoute(route: string): boolean {
  const r = (route.startsWith("#") ? route.slice(1) : route).split(/[?#]/)[0] || "/";
  return CATALOG_PUBLIC_PREFIXES.some(prefix => r.startsWith(prefix));
}

export function needsProfileContextOnPublicRoute(route: string): boolean {
  const r = (route.startsWith("#") ? route.slice(1) : route).split(/[?#]/)[0] || "/";
  return PROFILE_CONTEXT_PUBLIC_EXACT_ROUTES.has(r) || PROFILE_CONTEXT_PUBLIC_PREFIXES.some(prefix => r.startsWith(prefix));
}

/** Route publik ringan saat ini, dibaca langsung dari location.hash. */
export function isLightweightPublicRouteNow(): boolean {
  if (typeof window === "undefined") return false;
  return isLightweightPublicRoute(window.location.hash || "/");
}

export function isCatalogPublicRouteNow(): boolean {
  if (typeof window === "undefined") return false;
  return isCatalogPublicRoute(window.location.hash || "/");
}

export function needsProfileContextOnCurrentPublicRoute(): boolean {
  if (typeof window === "undefined") return false;
  return needsProfileContextOnPublicRoute(window.location.hash || "/");
}
