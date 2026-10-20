import supabase from '../lib/supabaseClient';
import { AttireRecord, AttireMeasurements } from '../types';

const TABLE = 'attire_records';
const LOCAL_STORAGE_KEY = 'filda_mua_attire_records';

function getLocalRecords(): AttireRecord[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveLocalRecords(records: AttireRecord[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(records));
  } catch (e) {
    console.error('Failed to save attire records to localStorage', e);
  }
}

export function normalizeAttireRecord(row: any): AttireRecord {
  return {
    id: row.id || `attire_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    clientId: row.client_id || row.clientId,
    personName: row.person_name || row.personName || 'Pengantin',
    personRole: row.person_role || row.personRole || 'Pengantin',
    mainCategory: row.main_category || row.mainCategory,
    subcategory: row.subcategory || row.sub_category,
    category: row.category || 'Gaun Pengantin Akad',
    itemName: row.item_name || row.itemName || '',
    model: row.model || '',
    color: row.color || '',
    size: row.size || '',
    priceType: row.price_type || row.priceType || 'Sewa',
    rentalPrice: Number(row.rental_price ?? row.rentalPrice ?? 0),
    selectionStatus: row.selection_status || row.selectionStatus || (row.status === 'Dipilih' ? 'Dipilih' : row.status === 'Cadangan' ? 'Cadangan' : 'Belum Dipilih'),
    status: row.status || 'Belum Dipilih',
    fittingNotes: row.fitting_notes || row.fittingNotes || '',
    photoUrl: row.photo_url || row.photoUrl || '',
    additionalPhotos: Array.isArray(row.additional_photos) ? row.additional_photos : Array.isArray(row.additionalPhotos) ? row.additionalPhotos : [],
    measurements: typeof row.measurements === 'string' ? JSON.parse(row.measurements) : (row.measurements || {}),
    createdAt: row.created_at || row.createdAt || new Date().toISOString(),
    updatedAt: row.updated_at || row.updatedAt || new Date().toISOString(),
  };
}

export async function listAllAttireRecords(): Promise<AttireRecord[]> {
  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return getLocalRecords();
    }
    return (data || []).map(normalizeAttireRecord);
  } catch (e) {
    return getLocalRecords();
  }
}

export async function listAttireRecords(clientId: string): Promise<AttireRecord[]> {
  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase listAttireRecords error, falling back to local storage:', error.message);
      const local = getLocalRecords().filter(r => r.clientId === clientId);
      return local;
    }
    return (data || []).map(normalizeAttireRecord);
  } catch (e) {
    console.warn('listAttireRecords exception, falling back to local storage:', e);
    const local = getLocalRecords().filter(r => r.clientId === clientId);
    return local;
  }
}

export async function createAttireRecord(record: Omit<AttireRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<AttireRecord> {
  const newId = `attire_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();
  const payload: AttireRecord = {
    id: newId,
    clientId: record.clientId,
    personName: record.personName,
    personRole: record.personRole,
    mainCategory: record.mainCategory,
    subcategory: record.subcategory,
    category: record.category,
    itemName: record.itemName,
    model: record.model || '',
    color: record.color || '',
    size: record.size || '',
    priceType: record.priceType || 'Sewa',
    rentalPrice: record.rentalPrice || 0,
    selectionStatus: record.selectionStatus || 'Dipilih',
    status: record.status || 'Dipilih',
    fittingNotes: record.fittingNotes || '',
    photoUrl: record.photoUrl || '',
    additionalPhotos: record.additionalPhotos || [],
    measurements: record.measurements || {},
    createdAt: now,
    updatedAt: now,
  };

  const dbRow = {
    id: payload.id,
    client_id: payload.clientId,
    person_name: payload.personName,
    person_role: payload.personRole,
    main_category: payload.mainCategory,
    subcategory: payload.subcategory,
    sub_category: payload.subcategory,
    category: payload.category,
    item_name: payload.itemName,
    model: payload.model || '',
    color: payload.color || '',
    size: payload.size || '',
    price_type: payload.priceType || 'Sewa',
    rental_price: payload.rentalPrice || 0,
    selection_status: payload.selectionStatus || 'Dipilih',
    status: payload.status || 'Dipilih',
    fitting_notes: payload.fittingNotes || '',
    photo_url: payload.photoUrl || '',
    additional_photos: payload.additionalPhotos || [],
    measurements: payload.measurements || {},
    created_at: now,
    updated_at: now,
  };

  try {
    const { data, error } = await supabase
      .from(TABLE)
      .insert([dbRow])
      .select('*')
      .single();

    if (error) {
      console.warn('Supabase createAttireRecord error, saving locally:', error.message);
      const all = getLocalRecords();
      all.unshift(payload);
      saveLocalRecords(all);
      return payload;
    }
    return normalizeAttireRecord(data);
  } catch (e) {
    console.warn('createAttireRecord exception, saving locally:', e);
    const all = getLocalRecords();
    all.unshift(payload);
    saveLocalRecords(all);
    return payload;
  }
}

export async function updateAttireRecord(id: string, patch: Partial<AttireRecord>): Promise<AttireRecord> {
  const now = new Date().toISOString();
  const dbPatch: any = { updated_at: now };
  if (patch.personName !== undefined) dbPatch.person_name = patch.personName;
  if (patch.personRole !== undefined) dbPatch.person_role = patch.personRole;
  if (patch.mainCategory !== undefined) dbPatch.main_category = patch.mainCategory;
  if (patch.subcategory !== undefined) {
    dbPatch.subcategory = patch.subcategory;
    dbPatch.sub_category = patch.subcategory;
  }
  if (patch.category !== undefined) dbPatch.category = patch.category;
  if (patch.itemName !== undefined) dbPatch.item_name = patch.itemName;
  if (patch.model !== undefined) dbPatch.model = patch.model;
  if (patch.color !== undefined) dbPatch.color = patch.color;
  if (patch.size !== undefined) dbPatch.size = patch.size;
  if (patch.priceType !== undefined) dbPatch.price_type = patch.priceType;
  if (patch.rentalPrice !== undefined) dbPatch.rental_price = patch.rentalPrice;
  if (patch.selectionStatus !== undefined) dbPatch.selection_status = patch.selectionStatus;
  if (patch.status !== undefined) dbPatch.status = patch.status;
  if (patch.fittingNotes !== undefined) dbPatch.fitting_notes = patch.fittingNotes;
  if (patch.photoUrl !== undefined) dbPatch.photo_url = patch.photoUrl;
  if (patch.additionalPhotos !== undefined) dbPatch.additional_photos = patch.additionalPhotos;
  if (patch.measurements !== undefined) dbPatch.measurements = patch.measurements;

  try {
    const { data, error } = await supabase
      .from(TABLE)
      .update(dbPatch)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      console.warn('Supabase updateAttireRecord error, updating locally:', error.message);
      const all = getLocalRecords();
      const idx = all.findIndex(r => r.id === id);
      if (idx !== -1) {
        all[idx] = { ...all[idx], ...patch, updatedAt: now };
        saveLocalRecords(all);
        return all[idx];
      }
      throw error;
    }
    return normalizeAttireRecord(data);
  } catch (e) {
    console.warn('updateAttireRecord exception, updating locally:', e);
    const all = getLocalRecords();
    const idx = all.findIndex(r => r.id === id);
    if (idx !== -1) {
      all[idx] = { ...all[idx], ...patch, updatedAt: now };
      saveLocalRecords(all);
      return all[idx];
    }
    throw e;
  }
}

export async function deleteAttireRecord(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from(TABLE)
      .delete()
      .eq('id', id);

    if (error) {
      console.warn('Supabase deleteAttireRecord error, removing locally:', error.message);
    }
  } catch (e) {
    console.warn('deleteAttireRecord exception:', e);
  }

  // Also remove from local storage
  const all = getLocalRecords().filter(r => r.id !== id);
  saveLocalRecords(all);
}
