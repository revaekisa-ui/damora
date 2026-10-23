import { useQuery } from '@tanstack/react-query';
import supabase from '../lib/supabaseClient';

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
 * Statistik dashboard diambil dengan query hitung (count) di sisi server,
 * bukan dengan menarik seluruh baris tabel lalu menghitung di klien.
 * `head: true` mengembalikan jumlah baris tanpa payload data, sehingga egress
 * hanya berupa angka — bukan seluruh kolom proyek/klien/leads.
 */
export const useDashboardStats = (options: { enabled?: boolean } = {}) => useQuery({
  queryKey: ['dashboardStats'],
  enabled: options.enabled !== false,
  queryFn: async (): Promise<DashboardStats> => {
    const countOf = async (table: string, apply?: (q: any) => any) => {
      let query = supabase.from(table).select('id', { count: 'exact', head: true });
      if (apply) query = apply(query);
      const { count, error } = await query;
      if (error) throw error;
      return count || 0;
    };

    const [
      projects,
      activeProjects,
      clients,
      activeClients,
      leads,
      discussionLeads,
      followUpLeads,
      teamMembers,
      tData,
      transactions,
    ] = await Promise.all([
      countOf('projects'),
      countOf('projects', q => q.not('status', 'in', '("Selesai","Dibatalkan")')),
      countOf('clients'),
      countOf('clients', q => q.eq('status', 'Aktif')),
      countOf('leads'),
      countOf('leads', q => q.in('status', ['Discussion', 'Sedang Diskusi'])),
      countOf('leads', q => q.in('status', ['Follow Up', 'Menunggu Follow Up'])),
      countOf('team_members'),
      supabase.from('transactions').select('type, amount'),
      countOf('transactions'),
    ]);

    if (tData.error) throw tData.error;

    let revenue = 0;
    let expense = 0;
    (tData.data || []).forEach(row => {
      if (row.type === 'Pemasukan') revenue += Number(row.amount || 0);
      else if (row.type === 'Pengeluaran') expense += Number(row.amount || 0);
    });

    return {
      projects,
      activeProjects,
      clients,
      activeClients,
      leads,
      discussionLeads,
      followUpLeads,
      teamMembers,
      transactions,
      revenue,
      expense,
    };
  },
  staleTime: 60 * 1000,
});
