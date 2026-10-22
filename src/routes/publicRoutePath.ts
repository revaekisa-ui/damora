/**
 * Halaman publik "ringan": hanya menampilkan katalog paket/formulir booking dan
 * membaca satu lead lewat `lid`. Kedua halaman ini tidak memakai dataset vendor
 * (clients, transactions, team, kalender, laporan, notifikasi), sehingga query
 * global tersebut tidak perlu dikirim untuk pengunjung anonim.
 *
 * Route publik lain (portal klien, checklist, invoice, contract) tetap memakai
 * dataset global dan TIDAK boleh masuk daftar ini.
 */
const LIGHTWEIGHT_PUBLIC_PREFIXES = ["/public-packages", "/public-booking"];

export function isLightweightPublicRoute(route: string): boolean {
  const r = route.startsWith("#") ? route.slice(1) : route;
  return LIGHTWEIGHT_PUBLIC_PREFIXES.some(prefix => r.startsWith(prefix));
}

/** Route publik ringan saat ini, dibaca langsung dari location.hash. */
export function isLightweightPublicRouteNow(): boolean {
  if (typeof window === "undefined") return false;
  return isLightweightPublicRoute(window.location.hash || "/");
}
