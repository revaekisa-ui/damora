import supabase from '../lib/supabaseClient';
import { TeamProjectPayment } from '../types';

const TABLE = 'team_project_payments';

function toRow(p: TeamProjectPayment) {
  const isUuid = (v?: string) => !!v && /^[0-9a-fA-F-]{36}$/.test(v);
  const paymentDate = p.date?.trim();
  if (!paymentDate || Number.isNaN(Date.parse(paymentDate))) {
    throw new Error('Tanggal acara wajib valid sebelum fee tim disimpan.');
  }
  const row: any = {
    project_id: p.projectId,
    team_member_name: p.teamMemberName,
    team_member_id: p.teamMemberId,
    date: paymentDate,
    status: p.status,
    fee: p.fee,

  };
  // Only pass id if it's a valid UUID; otherwise let DB generate it
  if (isUuid(p.id as any)) row.id = p.id;
  return row;
}

function fromRow(row: any): TeamProjectPayment {
  return {
    id: row.id,
    projectId: row.project_id,
    teamMemberName: row.team_member_name,
    teamMemberId: row.team_member_id,
    date: row.date,
    status: row.status,
    fee: Number(row.fee || 0),
    createdAt: row.created_at || row.date,
    updatedAt: row.updated_at ?? undefined,
  };
}

export async function listAllTeamPayments(): Promise<TeamProjectPayment[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .order('date', { ascending: false })
    .order('id', { ascending: false });
  if (error) throw error;
  return (data || []).map(fromRow);
}

export async function listTeamPaymentsByProject(projectId: string): Promise<TeamProjectPayment[]> {
  const { data, error } = await supabase.from(TABLE).select('*').eq('project_id', projectId);
  if (error) throw error;
  return (data || []).map(fromRow);
}

export async function upsertTeamPaymentsForProject(projectId: string, items: TeamProjectPayment[]): Promise<TeamProjectPayment[]> {
  const incoming = Array.isArray(items) ? items : [];

  const { data: existingData, error: existingErr } = await supabase
    .from(TABLE)
    .select('*')
    .eq('project_id', projectId);
  if (existingErr) throw existingErr;

  const existing = (existingData || []).map(fromRow);

  // 1. Deduplicate incoming by teamMemberId (one payment record per member per project)
  const seenMemberIds = new Set<string>();
  const uniqueIncoming: TeamProjectPayment[] = [];
  for (const p of incoming) {
    if (!p.teamMemberId) continue;
    if (!seenMemberIds.has(p.teamMemberId)) {
      seenMemberIds.add(p.teamMemberId);
      uniqueIncoming.push(p);
    }
  }

  // 2. Diffing strategy: match incoming against existing payments
  const remainingExisting = [...existing];
  const toSave: TeamProjectPayment[] = [];

  // Pass 1: Match by exact payment id
  const unmatchedPass1: TeamProjectPayment[] = [];
  for (const inc of uniqueIncoming) {
    if (inc.id) {
      const idx = remainingExisting.findIndex(e => e.id === inc.id);
      if (idx !== -1) {
        const found = remainingExisting.splice(idx, 1)[0];
        toSave.push({
          ...inc,
          id: found.id,
          // Preserve payment status if it was already marked Paid
          status: found.status === 'Paid' ? 'Paid' : inc.status,
        });
        continue;
      }
    }
    unmatchedPass1.push(inc);
  }

  // Pass 2: Match by teamMemberId (same team member already had a payment record)
  const unmatchedPass2: TeamProjectPayment[] = [];
  for (const inc of unmatchedPass1) {
    const idx = remainingExisting.findIndex(e => e.teamMemberId === inc.teamMemberId);
    if (idx !== -1) {
      const found = remainingExisting.splice(idx, 1)[0];
      toSave.push({
        ...inc,
        id: found.id,
        status: found.status === 'Paid' ? 'Paid' : inc.status,
      });
      continue;
    }
    unmatchedPass2.push(inc);
  }

  // Pass 3: Match replaced member slot (e.g. Andi replaced by Budi on this project)
  // If an existing payment slot is available from a removed freelance, reuse the record ID
  for (const inc of unmatchedPass2) {
    const reusableIndex = remainingExisting.findIndex(e => e.status !== 'Paid');
    if (reusableIndex !== -1) {
      const [found] = remainingExisting.splice(reusableIndex, 1);
      toSave.push({
        ...inc,
        id: found.id,
        status: inc.status,
      });
    } else {
      // Completely new freelance payment record
      toSave.push(inc);
    }
  }

  // Keep paid rows because payment slips reference their IDs as historical detail.
  const retainedPaid = remainingExisting.filter(e => e.status === 'Paid');
  const toDeleteIds = remainingExisting
    .filter(e => e.status !== 'Paid')
    .map(e => e.id)
    .filter(Boolean) as string[];
  if (toDeleteIds.length > 0) {
    const { error: delErr } = await supabase
      .from(TABLE)
      .delete()
      .eq('project_id', projectId)
      .in('id', toDeleteIds);
    if (delErr) {
      console.error('[teamProjectPayments] Delete error:', delErr);
      throw delErr;
    }
  }

  if (toSave.length === 0) return retainedPaid;
  const rows = toSave.map(toRow);
  const { data, error: upsertErr } = await supabase
    .from(TABLE)
    .upsert(rows, { onConflict: 'id' })
    .select();
  if (upsertErr) {
    console.error('[teamProjectPayments] Upsert error:', upsertErr);
    throw upsertErr;
  }
  return [...(data || []).map(fromRow), ...retainedPaid];
}

export async function markTeamPaymentStatus(id: string, status: 'Paid' | 'Unpaid'): Promise<void> {
  const { error } = await supabase.from(TABLE).update({ status }).eq('id', id);
  if (error) throw error;
}

export async function updateTeamPaymentFee(id: string, fee: number, status: 'Paid' | 'Unpaid'): Promise<void> {
  const { error } = await supabase.from(TABLE).update({ fee, status }).eq('id', id);
  if (error) throw error;
}

export async function updateTeamProjectPayments(items: TeamProjectPayment[]): Promise<TeamProjectPayment[]> {
  const rows = items.map(toRow);
  const { data, error } = await supabase
    .from(TABLE)
    .upsert(rows, { onConflict: 'id' })
    .select();

  if (error) throw error;
  return (data || []).map(fromRow);
}

export async function deleteTeamPaymentsByProject(projectId: string): Promise<void> {
  const { error } = await supabase.from(TABLE).delete().eq('project_id', projectId);
  if (error) throw error;
}

export const teamProjectPaymentService = {
  list: listAllTeamPayments,
  listByProject: listTeamPaymentsByProject,
  add: async (payment: TeamProjectPayment) => {
    if (!payment?.projectId) {
      throw new Error('projectId is required to add a team project payment');
    }
    const saved = await updateTeamProjectPayments([payment]);
    return saved[0] ?? payment;
  },
  create: async (payment: TeamProjectPayment) => {
    if (!payment?.projectId) {
      throw new Error('projectId is required to create a team project payment');
    }
    const saved = await updateTeamProjectPayments([payment]);
    return saved[0] ?? payment;
  },
  update: async (id: string, patch: Partial<TeamProjectPayment>) => {
    const current = await supabase.from(TABLE).select('*').eq('id', id).maybeSingle();
    if (current.error) throw current.error;
    const merged = { ...(current.data ? fromRow(current.data) : {}), ...patch, id } as TeamProjectPayment;
    const saved = await updateTeamProjectPayments([merged]);
    return saved[0] ?? merged;
  },
  delete: async (projectId: string) => {
    await deleteTeamPaymentsByProject(projectId);
  },
};
