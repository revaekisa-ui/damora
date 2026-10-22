import { lazy, ComponentType, LazyExoticComponent } from 'react';

/**
 * Wraps dynamic imports with automatic retries to prevent "Failed to fetch dynamically imported module"
 * errors caused by network glitches, server rebuilds, or chunk invalidation.
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>,
  retriesLeft = 2,
  intervalMs = 1000
): LazyExoticComponent<T> {
  return lazy(async () => {
    try {
      return await componentImport();
    } catch (error: any) {
      if (retriesLeft > 0) {
        await new Promise((resolve) => setTimeout(resolve, intervalMs));
        // Retry dynamically
        try {
          return await componentImport();
        } catch (retryError: any) {
          if (retriesLeft > 1) {
            await new Promise((resolve) => setTimeout(resolve, intervalMs * 1.5));
            return await componentImport();
          }
          throw retryError;
        }
      }

      // Check if this is a dynamic import or chunk loading error
      const isDynamicImportError =
        error instanceof Error &&
        (error.message.includes('Failed to fetch dynamically imported module') ||
          error.message.includes('Importing a module script failed') ||
          error.name === 'ChunkLoadError');

      if (isDynamicImportError && typeof window !== 'undefined') {
        const reloadKey = `retry_import_reload_${window.location.pathname}`;
        const lastReload = sessionStorage.getItem(reloadKey);
        const now = Date.now();

        // Allow at most 1 automatic reload per route within 15 seconds to avoid infinite loops
        if (!lastReload || now - parseInt(lastReload, 10) > 15000) {
          sessionStorage.setItem(reloadKey, now.toString());
          window.location.reload();
          // Return a pending promise while the page reloads
          return new Promise<{ default: T }>(() => {});
        }
      }

      throw error;
    }
  });
}
