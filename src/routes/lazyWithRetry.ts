import { lazy, ComponentType, LazyExoticComponent } from 'react';

/**
 * Enhanced React.lazy with automatic retry mechanism for code-split chunks.
 * Handles transient network dropouts and browser chunk caching issues gracefully.
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>,
  retries = 2,
  interval = 800
): LazyExoticComponent<T> {
  return lazy(() =>
    new Promise<{ default: T }>((resolve, reject) => {
      const attempt = (remaining: number) => {
        componentImport()
          .then(resolve)
          .catch((error) => {
            const isChunkOrNetworkError =
              error?.message?.includes('dynamically imported module') ||
              error?.message?.includes('Importing a module script failed') ||
              error?.message?.includes('Failed to fetch') ||
              error?.name === 'ChunkLoadError';

            if (remaining > 0 && isChunkOrNetworkError) {
              setTimeout(() => {
                attempt(remaining - 1);
              }, interval);
            } else {
              reject(error);
            }
          });
      };
      attempt(retries);
    })
  );
}
