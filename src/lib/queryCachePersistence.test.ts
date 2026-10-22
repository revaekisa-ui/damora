import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { dehydrate, QueryClient } from '@tanstack/react-query';

const { cacheDataMock, getCachedDataMock } = vi.hoisted(() => ({
  cacheDataMock: vi.fn(),
  getCachedDataMock: vi.fn(),
}));

vi.mock('../services/offlineStorage', () => ({
  offlineStorage: {
    cacheData: cacheDataMock,
    getCachedData: getCachedDataMock,
  },
}));

import {
  getCurrentCacheScope,
  persistQueryCache,
  restoreQueryCache,
} from './queryCachePersistence';

describe('query cache persistence', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient();
    cacheDataMock.mockReset().mockResolvedValue(undefined);
    getCachedDataMock.mockReset().mockResolvedValue(null);
    window.localStorage.clear();
  });

  afterEach(() => {
    queryClient.clear();
    vi.useRealTimers();
  });

  it('scopes persisted data to the authenticated local user', () => {
    window.localStorage.setItem('weddfin-isAuthenticated', 'true');
    window.localStorage.setItem('weddfin-currentUser', JSON.stringify({ id: 'user-1' }));
    expect(getCurrentCacheScope()).toBe('user-1');

    window.localStorage.setItem('weddfin-isAuthenticated', 'false');
    expect(getCurrentCacheScope()).toBeNull();
  });

  it('restores cached query data', async () => {
    const sourceClient = new QueryClient();
    sourceClient.setQueryData(['clients'], [{ id: 'client-1' }]);
    getCachedDataMock.mockResolvedValue({
      version: 1,
      cache: dehydrate(sourceClient),
    });

    await expect(restoreQueryCache(queryClient, 'user-1')).resolves.toBe(true);
    expect(queryClient.getQueryData(['clients'])).toEqual([{ id: 'client-1' }]);
    expect(getCachedDataMock).toHaveBeenCalledWith('react-query-cache:user-1');
    sourceClient.clear();
  });

  it('persists successful domain queries while excluding unrelated query data', async () => {
    vi.useFakeTimers();
    const stopPersistence = persistQueryCache(queryClient, 'user-1');
    queryClient.setQueryData(['clients'], [{ id: 'client-1' }]);
    queryClient.setQueryData(['private-other'], ['do-not-persist']);

    vi.advanceTimersByTime(500);
    await Promise.resolve();
    await Promise.resolve();

    const saved = cacheDataMock.mock.calls[0]?.[1];
    expect(cacheDataMock).toHaveBeenCalledWith(
      'react-query-cache:user-1',
      expect.objectContaining({ version: 1 }),
      12 * 60,
    );
    expect(saved.cache.queries.map((query: { queryKey: unknown[] }) => query.queryKey))
      .toEqual([['clients']]);
    stopPersistence();
  });
});
