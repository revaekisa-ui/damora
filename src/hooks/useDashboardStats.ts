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

export const useDashboardStats = (options: { enabled?: boolean } = {}) => useQuery({
  queryKey: ['dashboardStats'],
  enabled: options.enabled !== false,
  queryFn: async (): Promise<DashboardStats> => {
    const [
      { data: pData, error: pErr },
      { data: cData, error: cErr },
      { data: lData, error: lErr },
      { count: tmCount, error: tmErr },
      { data: tData, count: tCount, error: tErr }
    ] = await Promise.all([
      supabase.from('projects').select('status'),
      supabase.from('clients').select('status'),
      supabase.from('leads').select('status'),
      supabase.from('team_members').select('*', { count: 'exact', head: true }),
      supabase.from('transactions').select('type, amount', { count: 'exact' })
    ]);

    if (pErr || cErr || lErr || tmErr || tErr) throw (pErr || cErr || lErr || tmErr || tErr);

    const activeProjects = (pData || []).filter(p => p.status !== 'Selesai' && p.status !== 'Dibatalkan').length;
    const activeClients = (cData || []).filter(c => c.status === 'Aktif').length;
    const discussionLeads = (lData || []).filter(l => l.status === 'Discussion' || l.status === 'Sedang Diskusi').length;
    const followUpLeads = (lData || []).filter(l => l.status === 'Follow Up' || l.status === 'Menunggu Follow Up').length;

    let rev = 0;
    let exp = 0;
    (tData || []).forEach(row => {
      if (row.type === 'Pemasukan') rev += Number(row.amount || 0);
      else if (row.type === 'Pengeluaran') exp += Number(row.amount || 0);
    });

    return {
      projects: pData?.length || 0,
      activeProjects,
      clients: cData?.length || 0,
      activeClients,
      leads: lData?.length || 0,
      discussionLeads,
      followUpLeads,
      teamMembers: tmCount || 0,
      transactions: tCount || 0,
      revenue: rev,
      expense: exp,
    };
  },
  staleTime: 30 * 1000,
  refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
});
