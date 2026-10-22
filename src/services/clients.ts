import supabase from '../lib/supabaseClient';
import { compressImage } from './storage';
import { Client, ClientStatus, ClientType } from '../types';
import { publicNamePatternsFromSlug } from '../utils/publicRouting';

const TABLE = 'clients';

export async function syncClientStatusFromProjects(clientId: string): Promise<void> {
  // 1) Read current client status; do not override LEAD / LOST.
  const { data: clientRow, error: clientErr } = await supabase
    .from(TABLE)
    .select('status')
    .eq('id', clientId)
    .maybeSingle();
  if (clientErr) throw clientErr;
  if (!clientRow) return;

  const currentStatus = clientRow.status as ClientStatus;
  if (currentStatus === ClientStatus.LEAD || currentStatus === ClientStatus.LOST) return;

  // 2) Check whether client has ANY active project.
  // Active project = status not in ['Selesai', 'Dibatalkan'].
  const { data: projectRows, error: pErr } = await supabase
    .from('projects')
    .select('status')
    .eq('client_id', clientId);
  if (pErr) throw pErr;

  const hasActiveProject = (projectRows || []).some(
    (p: any) => p.status !== 'Selesai' && p.status !== 'Dibatalkan',
  );

  const nextStatus = hasActiveProject ? ClientStatus.ACTIVE : ClientStatus.INACTIVE;
  if (nextStatus === currentStatus) return;

  const { error: updErr } = await supabase
    .from(TABLE)
    .update({ status: nextStatus })
    .eq('id', clientId);
  if (updErr) throw updErr;
}

export async function listClients(options: { limit?: number; offset?: number } = {}): Promise<Client[]> {
  const limit = options.limit || 1000; // Default 1000, effectively all
  const offset = options.offset || 0

  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .order('since', { ascending: false })
    .order('id', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return (data || []).map(row => normalizeClient(row));
}

export async function listClientsPaginated(
  page: number = 1,
  limit: number = 20,
  searchQuery?: string,
  filters?: {
    status?: string;
    clientType?: string;
  }
): Promise<{
  clients: Client[];
  total: number;
  hasMore: boolean;
}> {
  const offset = (page - 1) * limit;

  // Build query with search and filters
  let query = supabase.from(TABLE).select('*', { count: 'exact' });
  let countQuery = supabase.from(TABLE).select('*', { count: 'exact', head: true });

  // Apply search
  if (searchQuery && searchQuery.trim()) {
    const searchTerm = `%${searchQuery.trim()}%`;
    query = query.or(`name.ilike.${searchTerm},email.ilike.${searchTerm},phone.ilike.${searchTerm}`);
    countQuery = countQuery.or(`name.ilike.${searchTerm},email.ilike.${searchTerm},phone.ilike.${searchTerm}`);
  }

  // Apply filters
  if (filters?.status) {
    query = query.eq('status', filters.status);
    countQuery = countQuery.eq('status', filters.status);
  }

  if (filters?.clientType) {
    query = query.eq('client_type', filters.clientType);
    countQuery = countQuery.eq('client_type', filters.clientType);
  }

  // Get total count
  const { count, error: countError } = await countQuery;
  if (countError) throw countError;

  // Get paginated data
  const { data, error } = await query
    .order('since', { ascending: false })
    .order('id', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;

  const clients = (data || []).map(row => normalizeClient(row));
  const total = count || 0;

  return {
    clients,
    total,
    hasMore: (page * limit) < total
  };
}

export async function getClient(id: string): Promise<Client | null> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('id', id)
    .single();
  if (error) {
    if ((error as any).code === 'PGRST116') return null; // not found
    throw error;
  }
  return data ? normalizeClient(data) : null;
}

export async function getClientByPortalAccessId(accessId: string): Promise<Client | null> {
  if (!accessId || !accessId.trim()) return null;
  const cleanId = accessId.trim();
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('portal_access_id', cleanId)
    .maybeSingle();
  if (data) return normalizeClient(data);
  if (error) console.warn('[getClientByPortalAccessId] error querying portal_access_id:', error);

  const { data: byId } = await supabase
    .from(TABLE)
    .select('*')
    .eq('id', cleanId)
    .maybeSingle();
  if (byId) return normalizeClient(byId);

  const patterns = publicNamePatternsFromSlug(cleanId);
  if (patterns === null) {
    const { data: byName, error: nameError } = await supabase
      .from(TABLE)
      .select('*')
      .eq('name', cleanId)
      .limit(2);
    return nameError || byName?.length !== 1 ? null : normalizeClient(byName[0]);
  }
  if (patterns.length === 0) return null;

  const matches = new Map<string, any>();
  for (const pattern of patterns) {
    const { data: candidates, error: patternError } = await supabase
      .from(TABLE)
      .select('*')
      .ilike('name', pattern)
      .limit(2);
    if (patternError) return null;
    for (const candidate of candidates || []) matches.set(candidate.id, candidate);
    if (matches.size > 1) return null;
  }
  return matches.size === 1 ? normalizeClient([...matches.values()][0]) : null;
}

export async function createClient(payload: Omit<Client, 'id'>): Promise<Client> {
  const safePayload: Omit<Client, 'id'> = {
    ...payload,
    name: payload.name || 'Pengantin Baru',
    email: (payload.email || '').trim(),
    phone: payload.phone || '',
    whatsapp: payload.whatsapp || payload.phone || '',
    instagram: payload.instagram || undefined,
    since: payload.since || new Date().toISOString(),
    status: payload.status || ClientStatus.ACTIVE,
    clientType: payload.clientType || ClientType.DIRECT,
    lastContact: payload.lastContact || payload.since || new Date().toISOString(),
    portalAccessId: payload.portalAccessId || crypto.randomUUID(),
    address: payload.address ?? undefined,
    createdAt: payload.createdAt || new Date().toISOString(),
    updatedAt: payload.updatedAt || new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from(TABLE)
    .insert([denormalizeClient(safePayload)])
    .select()
    .single();
  if (error) throw error;
  return normalizeClient(data);
}

export async function uploadClientAvatar(file: File): Promise<string> {
  const processedFile = await compressImage(file, 1000, 0.8, 200 * 1024);
  const extension = processedFile.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
  const path = `clients/avatars/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage
    .from('gallery-images')
    .upload(path, processedFile, { contentType: processedFile.type, upsert: false });

  if (error) throw error;

  const { data } = supabase.storage.from('gallery-images').getPublicUrl(path);
  return data.publicUrl;
}

export async function updateClient(id: string, patch: Partial<Client>): Promise<Client> {
  const safePatch: Partial<Client> = {
    ...patch,
    ...(patch.lastContact === undefined && patch.since ? { lastContact: patch.since } : {}),
    ...(patch.clientType === undefined && patch.status ? {} : {}),
  };

  const { data, error } = await supabase
    .from(TABLE)
    .update(denormalizeClient(safePatch))
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return normalizeClient(data);
}

export async function deleteClient(id: string): Promise<void> {
  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// Helpers to map between DB row and TS type (in case of snake_case in DB)
export function normalizeClient(row: any): Client {
  const sinceDate = row.since || row.created_at || new Date().toISOString();
  return {
    id: row.id,
    name: row.name,
    avatarUrl: row.avatar_url ?? undefined,
    email: row.email,
    phone: row.phone,
    whatsapp: row.whatsapp ?? undefined,
    since: sinceDate,
    instagram: row.instagram ?? undefined,
    status: row.status as ClientStatus,
    clientType: row.client_type as ClientType,
    lastContact: row.last_contact || sinceDate,
    portalAccessId: row.portal_access_id,
    address: row.address ?? undefined,
    homeAddress: row.home_address ?? undefined,
    createdAt: row.created_at || sinceDate,
    updatedAt: row.updated_at ?? undefined,
  };
}

function denormalizeClient(obj: Partial<Client>): any {
  return {
    ...(obj.id !== undefined ? { id: obj.id } : {}),
    ...(obj.name !== undefined ? { name: obj.name } : {}),
    ...(obj.avatarUrl !== undefined ? { avatar_url: obj.avatarUrl } : {}),
    ...(obj.email !== undefined ? { email: obj.email } : {}),
    ...(obj.phone !== undefined ? { phone: obj.phone } : {}),
    ...(obj.whatsapp !== undefined ? { whatsapp: obj.whatsapp } : {}),
    ...(obj.since !== undefined ? { since: obj.since } : { since: new Date().toISOString() }),
    ...(obj.instagram !== undefined ? { instagram: obj.instagram } : {}),
    ...(obj.status !== undefined ? { status: obj.status } : {}),
    ...(obj.clientType !== undefined ? { client_type: obj.clientType } : {}),
    ...(obj.lastContact !== undefined ? { last_contact: obj.lastContact } : {}),
    ...(obj.portalAccessId !== undefined ? { portal_access_id: obj.portalAccessId } : {}),
    ...(obj.address !== undefined ? { address: obj.address } : {}),
    ...(obj.homeAddress !== undefined ? { home_address: obj.homeAddress } : {}),
  };
}

export const clientService = {
  list: listClients,
  get: getClient,
  getByPortalAccessId: getClientByPortalAccessId,
  add: createClient,
  create: createClient,
  update: updateClient,
  delete: deleteClient,
  syncStatusFromProjects: syncClientStatusFromProjects,
};
