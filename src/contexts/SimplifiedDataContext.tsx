import React, { createContext, useContext, useEffect, useCallback, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { normalizeTransaction } from '../services/transactions';
import { normalizeClient } from '../services/clients';
import { normalizeProject } from '../services/projects';
import { normalizeLead } from '../services/leads';
import { debounce } from '../utils/debounce';
import {
  useClientsQuery,
  useProjectsQuery,
  useTeamMembersQuery,
  useTransactionsQuery,
  useLeadsQuery,
  useCardsQuery,
  usePocketsQuery,
  usePackagesQuery,
  useAddOnsQuery,
  useAttireQuery,
  useCalendarEventsQuery,
} from '../hooks/queries';
import { useDashboardStats } from '../hooks/useDashboardStats';
import { useClientFeedback } from '../hooks/useClientFeedback';
import { useIsLightweightPublicRoute } from '../hooks/useIsLightweightPublicRoute';
import {
  Client,
  Project,
  TeamMember,
  Transaction,
  Lead,
  Card,
  FinancialPocket,
  Package,
  AddOn,
  Attire,
  ClientFeedback,
  CalendarEvent,
  Profile,
} from '../types';

interface SimplifiedDataContextType {
  // Domain data — single source of truth: React Query cache (server state from Supabase)
  clients: Client[] | undefined;
  projects: Project[] | undefined;
  teamMembers: TeamMember[] | undefined;
  transactions: Transaction[] | undefined;
  leads: Lead[] | undefined;
  cards: Card[] | undefined;
  pockets: FinancialPocket[] | undefined;
  packages: Package[] | undefined;
  addOns: AddOn[] | undefined;
  attire: Attire[] | undefined;
  clientFeedback: ClientFeedback[] | undefined;
  calendarEvents: CalendarEvent[] | undefined;
  totals: ReturnType<typeof useDashboardStats>['data'];

  isLoading: boolean;
  loading: {
    clients: boolean;
    projects: boolean;
    teamMembers: boolean;
    transactions: boolean;
    clientFeedback: boolean;
    totals: boolean;
  };
  isError: boolean;
  error: Error | null;

  refetchAll: () => Promise<void>;
  refetchClients: () => Promise<void>;
  refetchProjects: () => Promise<void>;
  refetchTeamMembers: () => Promise<void>;
  refetchTransactions: () => Promise<void>;
  refetchClientFeedback: () => Promise<void>;
  refetchDashboardStats: () => Promise<void>;

  // Cache writers — exposed as React.Dispatch<SetStateAction<T[]>> so the
  // existing 525 call-sites that perform optimistic updates keep working.
  // Internally these write directly to the React Query cache (the only state
  // container). No duplicate local state.
  setClients: React.Dispatch<React.SetStateAction<Client[]>>;
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  setTeamMembers: React.Dispatch<React.SetStateAction<TeamMember[]>>;
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  setLeads: React.Dispatch<React.SetStateAction<Lead[]>>;
  setCards: React.Dispatch<React.SetStateAction<Card[]>>;
  setPockets: React.Dispatch<React.SetStateAction<FinancialPocket[]>>;
  setPackages: React.Dispatch<React.SetStateAction<Package[]>>;
  setAddOns: React.Dispatch<React.SetStateAction<AddOn[]>>;
  setAttire: React.Dispatch<React.SetStateAction<Attire[]>>;
  setClientFeedback: React.Dispatch<React.SetStateAction<ClientFeedback[]>>;
}

const SimplifiedDataContext = createContext<SimplifiedDataContextType | undefined>(undefined);

/**
 * Build a setter that applies React.SetStateAction<T[]> directly to the
 * React Query cache for the given key. This is the bridge that lets legacy
 * call-sites (e.g. setClients(prev => [...prev, created])) keep working
 * while making React Query the single source of truth.
 */
function makeCacheSetter<T>(
  queryClient: ReturnType<typeof useQueryClient>,
  queryKey: string,
  invalidateAfterWrite = false,
): React.Dispatch<React.SetStateAction<T[]>> {
  return (action: React.SetStateAction<T[]>) => {
    queryClient.setQueryData<T[]>([queryKey], (old) => {
      const prev = old ?? [];
      return typeof action === 'function'
        ? (action as (p: T[]) => T[])(prev)
        : action;
    });
    if (invalidateAfterWrite) {
      void queryClient.invalidateQueries({ queryKey: [queryKey], refetchType: 'none' });
    }
  };
}

export const SimplifiedDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();

  // Halaman publik ringan (Public Packages / Public Booking) hanya memakai
  // profile, packages, addOns, leads, cards, promoCodes. Dataset vendor (termasuk
  // seluruh kolom + relasi proyek) tidak dikirim; lencana "Paling Populer" memakai
  // useProjectPackageIdsQuery yang hanya mengambil package_id.
  const isLightPublic = useIsLightweightPublicRoute();
  const vendorOnly = { enabled: !isLightPublic };

  // ─── Domain queries (single source of truth) ────────────────────────────
  const { data: clients, isLoading: loadingClients, error: errorClients } = useClientsQuery(vendorOnly);
  const { data: projects, isLoading: loadingProjects, error: errorProjects } = useProjectsQuery(vendorOnly);
  const { data: teamMembers, isLoading: loadingTeamMembers, error: errorTeamMembers } = useTeamMembersQuery(vendorOnly);
  const { data: transactions, isLoading: loadingTransactions, error: errorTransactions } = useTransactionsQuery(vendorOnly);
  const { data: leads, isLoading: loadingLeads, error: errorLeads } = useLeadsQuery();
  const { data: cards, isLoading: loadingCards, error: errorCards } = useCardsQuery();
  const { data: pockets, isLoading: loadingPockets, error: errorPockets } = usePocketsQuery(vendorOnly);
  const { data: packages, isLoading: loadingPackages, error: errorPackages } = usePackagesQuery();
  const { data: addOns, isLoading: loadingAddOns, error: errorAddOns } = useAddOnsQuery();
  const { data: attire, isLoading: loadingAttire, error: errorAttire } = useAttireQuery();
  const { data: calendarEvents, isLoading: loadingCalendarEvents, error: errorCalendarEvents } = useCalendarEventsQuery(vendorOnly);
  const { data: clientFeedback, isLoading: loadingClientFeedback, error: errorClientFeedback } = useClientFeedback({ enabled: !isLightPublic });
  const { data: totals, isLoading: loadingTotals, error: errorTotals } = useDashboardStats({ enabled: !isLightPublic });

  const isLoading =
    loadingClients || loadingProjects || loadingTeamMembers ||
    loadingTransactions || loadingLeads || loadingCards ||
    loadingPockets || loadingPackages || loadingAddOns || loadingAttire ||
    loadingCalendarEvents || loadingClientFeedback || loadingTotals;

  const error =
    errorClients || errorProjects || errorTeamMembers ||
    errorTransactions || errorLeads || errorCards ||
    errorPockets || errorPackages || errorAddOns || errorAttire ||
    errorCalendarEvents || errorClientFeedback || errorTotals;

  const isError = !!error;

  // ─── Cache setters (functional; replace previous stub no-ops) ──────────
  const setClients = useCallback(makeCacheSetter<Client>(queryClient, 'clients', isLightPublic), [queryClient, isLightPublic]);
  const setProjects = useCallback(makeCacheSetter<Project>(queryClient, 'projects', isLightPublic), [queryClient, isLightPublic]);
  const setTeamMembers = useCallback(makeCacheSetter<TeamMember>(queryClient, 'teamMembers'), [queryClient]);
  const setTransactions = useCallback(makeCacheSetter<Transaction>(queryClient, 'transactions'), [queryClient]);
  const setLeads = useCallback(makeCacheSetter<Lead>(queryClient, 'leads'), [queryClient]);
  const setCards = useCallback(makeCacheSetter<Card>(queryClient, 'cards'), [queryClient]);
  const setPockets = useCallback(makeCacheSetter<FinancialPocket>(queryClient, 'pockets'), [queryClient]);
  const setPackages = useCallback(makeCacheSetter<Package>(queryClient, 'packages'), [queryClient]);
  const setAddOns = useCallback(makeCacheSetter<AddOn>(queryClient, 'addOns'), [queryClient]);
  const setAttire = useCallback(makeCacheSetter<Attire>(queryClient, 'attire'), [queryClient]);
  const setClientFeedback = useCallback(makeCacheSetter<ClientFeedback>(queryClient, 'clientFeedback'), [queryClient]);

  const refetchClients = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['clients'] });
  }, [queryClient]);
  const refetchProjects = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['projects'] });
  }, [queryClient]);
  const refetchTeamMembers = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['teamMembers'] });
  }, [queryClient]);
  const refetchTransactions = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['transactions'] });
  }, [queryClient]);
  const refetchClientFeedback = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['clientFeedback'] });
  }, [queryClient]);
  const refetchDashboardStats = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
  }, [queryClient]);

  const refetchAll = useCallback(async () => {
    await Promise.all([
      refetchClients(),
      refetchProjects(),
      refetchTeamMembers(),
      refetchTransactions(),
      queryClient.invalidateQueries({ queryKey: ['leads'] }),
      queryClient.invalidateQueries({ queryKey: ['cards'] }),
      queryClient.invalidateQueries({ queryKey: ['pockets'] }),
      queryClient.invalidateQueries({ queryKey: ['packages'] }),
      queryClient.invalidateQueries({ queryKey: ['addOns'] }),
      queryClient.invalidateQueries({ queryKey: ['attire'] }),
      queryClient.invalidateQueries({ queryKey: ['calendarEvents'] }),
      refetchClientFeedback(),
      refetchDashboardStats(),
      queryClient.invalidateQueries({ queryKey: ['promoCodes'] }),
      queryClient.invalidateQueries({ queryKey: ['profile'] }),
      queryClient.invalidateQueries({ queryKey: ['teamProjectPayments'] }),
      queryClient.invalidateQueries({ queryKey: ['teamPaymentRecords'] }),
      queryClient.invalidateQueries({ queryKey: ['notifications'] }),
    ]);
  }, [queryClient, refetchClients, refetchProjects, refetchTeamMembers, refetchTransactions, refetchClientFeedback, refetchDashboardStats]);

  // ─── Realtime: Supabase → React Query cache (Optimized: Selective & Idle Disconnect) ──
  useEffect(() => {
    if (!isSupabaseConfigured || isLightPublic) {
      return;
    }

    let channel: any = null;
    let isConnected = false;
    let idleTimer: any = null;
    const IDLE_TIMEOUT_MS = 5 * 60 * 1000; // 5 menit tidak ada aktivitas

    // Debounce invalidasi untuk mencegah badai request saat terjadi perubahan beruntun
    const debouncedInvalidate = debounce((key: string) => {
      void queryClient.invalidateQueries({ queryKey: [key] });
    }, 1000);

    const makeHandler = <T extends { id: string }>(
      queryKey: string,
      normalize: (row: any) => T,
      options: { sortByDateDesc?: boolean; tempIdPrefixes?: string[]; amountMatchField?: keyof T; invalidateQueryKeys?: string[] } = {},
    ) => (payload: any) => {
      options.invalidateQueryKeys?.forEach((key) => {
        debouncedInvalidate(key);
      });
      if (!queryClient.getQueryData<T[]>([queryKey])) {
        debouncedInvalidate(queryKey);
        return;
      }

      queryClient.setQueryData<T[]>([queryKey], (old) => {
        if (!old) return old;
        const ev = payload.eventType;

        if (ev === 'INSERT' || ev === 'UPDATE') {
          const next = normalize(payload.new);
          const idx = old.findIndex((it) => it.id === next.id);
          if (idx !== -1) {
            const copy = old.slice();
            // Gabungkan dengan data lama agar relasi yang tidak ada di payload realtime tidak hilang
            copy[idx] = { ...copy[idx], ...next };
            return copy;
          }
          if (options.tempIdPrefixes && options.amountMatchField) {
            const tempIdx = old.findIndex((t: any) =>
              options.tempIdPrefixes!.some((p) => String(t.id).startsWith(p)) &&
              t.projectId === (next as any).projectId &&
              Math.abs(Number(t[options.amountMatchField!]) - Number((next as any)[options.amountMatchField!])) < 0.01,
            );
            if (tempIdx !== -1) {
              const copy = old.slice();
              copy[tempIdx] = next;
              return copy;
            }
          }
          const merged = [next, ...old];
          if (options.sortByDateDesc) {
            merged.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
          }
          return merged;
        }
        if (ev === 'DELETE') {
          const deletedId = payload.old?.id;
          return old.filter((it) => it.id !== deletedId);
        }
        return old;
      });
    };

    // Handler khusus proyek untuk menggabungkan relasi lama dengan data baru
    const projectsRealtimeHandler = makeHandler<Project>('projects', (row) => ({
      ...normalizeProject(row),
    }), { invalidateQueryKeys: ['dashboardStats'] });

    const connectRealtime = () => {
      if (isConnected || document.visibilityState === 'hidden') return;

      channel = supabase.channel('selective-realtime-channel');

      // Selective subscription: hanya subscribe ke 5 tabel kritis operasional live
      channel
        .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' },
          makeHandler<Transaction>('transactions', normalizeTransaction, {
            sortByDateDesc: true,
            tempIdPrefixes: ['TRN-PAY-', 'TRN-DP-'],
            amountMatchField: 'amount' as keyof Transaction,
            invalidateQueryKeys: ['dashboardStats'],
          }))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'clients' },
          makeHandler<Client>('clients', normalizeClient, { invalidateQueryKeys: ['dashboardStats'] }))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, (payload: any) => {
          projectsRealtimeHandler(payload);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' },
          makeHandler<Lead>('leads', normalizeLead, { invalidateQueryKeys: ['dashboardStats'] }))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => {
          debouncedInvalidate('notifications');
        })
        .subscribe((status: string, subscribeError: any) => {
          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            console.warn('[Realtime] Subscription unavailable; continuing without live sync.', { status, subscribeError });
          }
        });

      isConnected = true;
    };

    const disconnectRealtime = () => {
      if (!isConnected || !channel) return;
      supabase.removeChannel(channel);
      channel = null;
      isConnected = false;
    };

    const resetIdleTimer = () => {
      if (idleTimer) clearTimeout(idleTimer);

      if (document.visibilityState === 'visible') {
        if (!isConnected) {
          connectRealtime();
          // Segarkan query utama saat reconnect setelah idle/tab hidden
          debouncedInvalidate('transactions');
          debouncedInvalidate('projects');
          debouncedInvalidate('clients');
          debouncedInvalidate('leads');
          debouncedInvalidate('dashboardStats');
        }

        idleTimer = setTimeout(() => {
          disconnectRealtime();
        }, IDLE_TIMEOUT_MS);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        if (idleTimer) clearTimeout(idleTimer);
        disconnectRealtime();
      } else {
        resetIdleTimer();
      }
    };

    // User activity listeners untuk mendeteksi keaktifan user
    const activityEvents = ['mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    activityEvents.forEach((event) => {
      window.addEventListener(event, resetIdleTimer, { passive: true });
    });
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Initial connection saat mount
    resetIdleTimer();

    return () => {
      if (idleTimer) clearTimeout(idleTimer);
      activityEvents.forEach((event) => {
        window.removeEventListener(event, resetIdleTimer);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      disconnectRealtime();
    };
  }, [queryClient, isLightPublic]);

  const value = useMemo<SimplifiedDataContextType>(() => ({
    clients,
    projects,
    teamMembers,
    transactions,
    leads,
    cards,
    pockets,
    packages,
    addOns,
    attire,
    clientFeedback,
    calendarEvents,
    totals,
    isLoading,
    loading: {
      clients: loadingClients,
      projects: loadingProjects,
      teamMembers: loadingTeamMembers,
      transactions: loadingTransactions,
      clientFeedback: loadingClientFeedback,
      totals: loadingTotals,
    },
    isError,
    error,
    refetchAll,
    refetchClients,
    refetchProjects,
    refetchTeamMembers,
    refetchTransactions,
    refetchClientFeedback,
    refetchDashboardStats,
    setClients,
    setProjects,
    setTeamMembers,
    setTransactions,
    setLeads,
    setCards,
    setPockets,
    setPackages,
    setAddOns,
    setAttire,
    setClientFeedback,
  }), [
    clients, projects, teamMembers, transactions, leads, cards, pockets,
    packages, addOns, attire, clientFeedback, calendarEvents, totals,
    isLoading, loadingClients, loadingProjects, loadingTeamMembers, loadingTransactions,
    loadingClientFeedback, loadingTotals, isError, error, refetchAll,
    refetchClients, refetchProjects, refetchTeamMembers, refetchTransactions,
    refetchClientFeedback, refetchDashboardStats,
    setClients, setProjects, setTeamMembers, setTransactions, setLeads,
    setCards, setPockets, setPackages, setAddOns, setAttire, setClientFeedback,
  ]);

  return (
    <SimplifiedDataContext.Provider value={value}>
      {children}
    </SimplifiedDataContext.Provider>
  );
};

export const useSimplifiedData = () => {
  const ctx = useContext(SimplifiedDataContext);
  if (ctx === undefined) {
    throw new Error('useSimplifiedData must be used within a SimplifiedDataProvider');
  }
  return ctx;
};
