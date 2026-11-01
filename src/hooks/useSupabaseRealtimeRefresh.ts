import { useEffect, useRef } from 'react';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';

export function useSupabaseRealtimeRefresh(
  channelName: string,
  tables: readonly string[],
  refresh: () => void | Promise<void>,
) {
  const refreshRef = useRef(refresh);
  const tablesKey = JSON.stringify(tables);
  refreshRef.current = refresh;

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    let timer: number | undefined;
    const MIN_PASSIVE_REFRESH_INTERVAL_MS = 60_000;
    let lastRefreshAt = Date.now();
    const scheduleRefresh = (fromRealtime = false) => {
      if (timer !== undefined) window.clearTimeout(timer);
      const waitForFreshness = fromRealtime
        ? 0
        : Math.max(0, MIN_PASSIVE_REFRESH_INTERVAL_MS - (Date.now() - lastRefreshAt));
      timer = window.setTimeout(() => {
        lastRefreshAt = Date.now();
        void Promise.resolve(refreshRef.current()).catch((error) => {
          console.warn(`[Realtime] Refresh failed for ${channelName}:`, error);
        });
      }, fromRealtime ? 150 : Math.max(150, waitForFreshness));
    };

    let channel = supabase.channel(channelName);
    for (const table of JSON.parse(tablesKey) as string[]) {
      channel = channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        () => scheduleRefresh(true),
      );
    }

    channel.subscribe((status, error) => {
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        console.warn(`[Realtime] Subscription unavailable for ${channelName}:`, error);
      }
    });

    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') scheduleRefresh();
    };
    const refreshOnFocusOrOnline = () => scheduleRefresh();
    window.addEventListener('focus', refreshOnFocusOrOnline);
    window.addEventListener('online', refreshOnFocusOrOnline);
    document.addEventListener('visibilitychange', refreshWhenVisible);

    return () => {
      if (timer !== undefined) window.clearTimeout(timer);
      window.removeEventListener('focus', refreshOnFocusOrOnline);
      window.removeEventListener('online', refreshOnFocusOrOnline);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
      void supabase.removeChannel(channel);
    };
  }, [channelName, tablesKey]);
}
