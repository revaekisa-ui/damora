import supabase from '../lib/supabaseClient';
import { TeamPaymentRecord } from '../types';
import { uploadDataUrlAsset } from './storage';

const TABLE = 'team_payment_records';

/**
 * Tanda tangan slip pembayaran disimpan sebagai URL Storage, bukan base64, agar
 * kolom vendor_signature tidak ikut terunduh di setiap query daftar.
 */
async function resolveSignature(value: string | null | undefined): Promise<string | null | undefined> {
  if (typeof value === 'string' && value.startsWith('data:')) {
    try {
      return await uploadDataUrlAsset(value, 'team-payments/signatures');
    } catch (e) {
      console.warn('[teamPaymentRecords] Gagal mengunggah tanda tangan ke Storage, memakai nilai inline:', e);
    }
  }
  return value;
}

function fromRow(row: any): TeamPaymentRecord {
  return {
    id: row.id,
    recordNumber: row.record_number,
    teamMemberId: row.team_member_id,
    date: row.date,
    projectPaymentIds: Array.isArray(row.project_payment_ids) ? row.project_payment_ids : [],
    totalAmount: Number(row.total_amount || 0),
    vendorSignature: row.vendor_signature || undefined,
    createdAt: row.created_at || row.date,
    updatedAt: row.updated_at ?? undefined,
  };
}

function toRow(input: Partial<TeamPaymentRecord>): any {
  return {
    ...(input.recordNumber !== undefined ? { record_number: input.recordNumber } : {}),
    ...(input.teamMemberId !== undefined ? { team_member_id: input.teamMemberId } : {}),
    ...(input.date !== undefined ? { date: input.date } : {}),
    ...(input.projectPaymentIds !== undefined ? { project_payment_ids: input.projectPaymentIds } : {}),
    ...(input.totalAmount !== undefined ? { total_amount: input.totalAmount } : {}),
    ...(input.vendorSignature !== undefined ? { vendor_signature: input.vendorSignature } : {}),
  };
}

export async function listTeamPaymentRecords(): Promise<TeamPaymentRecord[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .order('date', { ascending: false })
    .order('id', { ascending: false });
  if (error) throw error;
  return (data || []).map(fromRow);
}

export async function createTeamPaymentRecord(payload: Omit<TeamPaymentRecord, 'id'>): Promise<TeamPaymentRecord> {
  const row = toRow(payload);
  if (payload.vendorSignature !== undefined) {
    row.vendor_signature = await resolveSignature(payload.vendorSignature);
  }
  const { data, error } = await supabase
    .from(TABLE)
    .insert(row)
    .select('*')
    .single();
  if (error) throw error;
  return fromRow(data);
}

export async function updateTeamPaymentRecord(id: string, patch: Partial<TeamPaymentRecord>): Promise<TeamPaymentRecord> {
  const row = toRow(patch);
  if (patch.vendorSignature !== undefined) {
    row.vendor_signature = await resolveSignature(patch.vendorSignature);
  }
  const { data, error } = await supabase
    .from(TABLE)
    .update(row)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return fromRow(data);
}

export async function deleteTeamPaymentRecord(id: string): Promise<void> {
  const { error } = await supabase.from(TABLE).delete().eq('id', id);
  if (error) throw error;
}
