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
    const scheduleRefresh = () => {
      if (timer !== undefined) window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        void Promise.resolve(refreshRef.current()).catch((error) => {
          console.warn(`[Realtime] Refresh failed for ${channelName}:`, error);
        });
      }, 150);
    };

    let channel = supabase.channel(channelName);
    for (const table of JSON.parse(tablesKey) as string[]) {
      channel = channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        scheduleRefresh,
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
    window.addEventListener('focus', scheduleRefresh);
    window.addEventListener('online', scheduleRefresh);
    document.addEventListener('visibilitychange', refreshWhenVisible);

    return () => {
      if (timer !== undefined) window.clearTimeout(timer);
      window.removeEventListener('focus', scheduleRefresh);
      window.removeEventListener('online', scheduleRefresh);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
      void supabase.removeChannel(channel);
    };
  }, [channelName, tablesKey]);
}