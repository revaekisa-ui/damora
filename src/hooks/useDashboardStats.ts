import { useQuery } from '@tanstack/react-query';
import supabase from '../lib/supabaseClient';
import { fetchWithTimeout } from '../lib/queryTimeout';

interface DashboardStats {
  projects: number;
  activeProjects: number;
  clients: number;
  activeClients: number;
  leads: number;
  discussionLeads: number;
  followUpLeads: number;
  teamMembers: number;
  transactions: number;
  revenue: number;
  expense: number;
}

/**
 * Memanggil RPC agregasi `get_dashboard_stats` secara langsung. Sebelumnya
 * statistik diambil lewat Edge Function `dashboard-stats`, tetapi function
 * tersebut tidak ter-deploy (hanya `send-web-push` yang aktif) sehingga
 * seluruh nilai statistik jatuh ke 0. Memanggil RPC langsung juga menghapus
 * satu hop jaringan tanpa mengunduh seluruh baris transaksi.
 */
export const useDashboardStats = (options: { enabled?: boolean } = {}) => useQuery({
  queryKey: ['dashboardStats'],
  enabled: options.enabled !== false,
  queryFn: () => fetchWithTimeout('statistik dashboard', async (): Promise<DashboardStats> => {
    const { data, error } = await supabase.rpc('get_dashboard_stats');
    if (error) throw error;

    // Toleran terhadap RPC yang mengembalikan array satu baris, dengan bentuk
    // objek yang tetap sama seperti yang dikonsumsi dasbor dan analitik.
    const stats = Array.isArray(data) ? data[0] : data;
    if (!stats) throw new Error('Dashboard statistics response was empty.');
    return stats as DashboardStats;
  }),
  staleTime: 60 * 1000,
});
