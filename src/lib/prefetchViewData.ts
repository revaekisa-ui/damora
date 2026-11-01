import type { QueryClient } from '@tanstack/react-query';
import { ViewType } from '../types';
import { listClients } from '../services/clients';
import { listProjectsWithRelations } from '../services/projects';
import { listTeamMembers } from '../services/teamMembers';
import { listTransactions } from '../services/transactions';
import { listLeads } from '../services/leads';
import { listPockets } from '../services/pockets';
import { listPackages } from '../services/packages';
import { listAddOns } from '../services/addOns';
import { listAttire } from '../services/attire';
import { listCalendarEvents } from '../services/calendarEvents';

// Samakan dengan DEFAULT_LIMIT di hooks/queries.ts agar cache yang di-prefetch
// identik dengan yang nanti di-consume halaman tujuan.
const DEFAULT_LIMIT = 100;

const MINUTE = 60 * 1000;

/**
 * Prefetch data domain halaman tujuan ke React Query cache saat kursor menu
 * diarahkan (hover) atau elemen menu disentuh, sehingga saat navigasi data
 * sudah tersedia dan halaman tampil hampir instan. Query key & staleTime
 * disamakan dengan definisi di hooks/queries.ts.
 */
export function prefetchViewData(queryClient: QueryClient, view: ViewType): void {
  const prefetch = (
    key: string,
    queryFn: () => Promise<unknown>,
    staleTime: number,
  ) => {
    // Jangan ganggu cache yang masih segar; prefetchQuery otomatis skip bila fresh.
    void queryClient.prefetchQuery({ queryKey: [key], queryFn, staleTime });
  };

  switch (view) {
    case ViewType.DASHBOARD:
      prefetch('clients', () => listClients({ limit: DEFAULT_LIMIT }), MINUTE);
      prefetch('projects', () => listProjectsWithRelations({ limit: DEFAULT_LIMIT }), MINUTE);
      break;
    case ViewType['Calon Pengantin']:
      prefetch('leads', () => listLeads({ limit: DEFAULT_LIMIT }), MINUTE);
      prefetch('clients', () => listClients({ limit: DEFAULT_LIMIT }), MINUTE);
      break;
    case ViewType.BOOKING:
      prefetch('leads', () => listLeads({ limit: DEFAULT_LIMIT }), MINUTE);
      prefetch('projects', () => listProjectsWithRelations({ limit: DEFAULT_LIMIT }), MINUTE);
      prefetch('packages', () => listPackages(), 5 * MINUTE);
      break;
    case ViewType.CLIENTS:
      prefetch('clients', () => listClients({ limit: DEFAULT_LIMIT }), MINUTE);
      prefetch('projects', () => listProjectsWithRelations({ limit: DEFAULT_LIMIT }), MINUTE);
      break;
    case ViewType.TEAM:
      prefetch('teamMembers', () => listTeamMembers({ limit: DEFAULT_LIMIT }), MINUTE);
      break;
    case ViewType.FINANCE:
      prefetch('transactions', () => listTransactions({ limit: DEFAULT_LIMIT }), MINUTE);
      prefetch('pockets', () => listPockets(), MINUTE);
      break;
    case ViewType.PACKAGES:
      prefetch('packages', () => listPackages(), 5 * MINUTE);
      prefetch('addOns', () => listAddOns(), 5 * MINUTE);
      prefetch('attire', () => listAttire(), 5 * MINUTE);
      break;
    case ViewType.CALENDAR:
      prefetch('calendarEvents', () => listCalendarEvents(), 30 * 1000);
      break;
    default:
      break;
  }
}
