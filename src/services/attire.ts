import supabase from '../lib/supabaseClient';
import { Attire } from '../types';

const TABLE = 'attire';

export const DEFAULT_ATTIRE_ITEMS: Attire[] = [
  { id: 'attire-1', name: 'Attire pengantin sepasang', price: 1500000 },
  { id: 'attire-2', name: 'Kebaya ibu/besan/sister Premium', price: 500000 },
  { id: 'attire-3', name: 'Kebaya ibu/besan/sister Biasa', price: 250000 },
  { id: 'attire-4', name: 'Beskap Premium', price: 400000 },
  { id: 'attire-5', name: 'Beskap Biasa', price: 250000 },
  { id: 'attire-6', name: 'Jas', price: 300000 },
];

export function normalizeAttire(row: any): Attire {
  return normalize(row);
}

function normalize(row: any): Attire {
  return {
    id: String(row.id),
    name: row.name,
    price: Number(row.price || 0),
    region: row.region ?? undefined,
  } as Attire;
}

function denormalize(obj: Partial<Attire>): any {
  return {
    ...(obj.name !== undefined ? { name: obj.name } : {}),
    ...(obj.price !== undefined ? { price: obj.price } : {}),
    ...(obj.region !== undefined ? { region: obj.region } : {}),
  };
}

export async function listAttire(): Promise<Attire[]> {
  try {
    const { data, error } = await supabase.from(TABLE).select('*').order('name');
    if (error) {
      console.warn('[listAttire] Supabase error or table missing, using default attire items:', error.message);
      return DEFAULT_ATTIRE_ITEMS;
    }
    if (!data || data.length === 0) {
      return DEFAULT_ATTIRE_ITEMS;
    }
    return data.map(normalize);
  } catch (err) {
    console.warn('[listAttire] Failed to fetch from Supabase, fallback to default:', err);
    return DEFAULT_ATTIRE_ITEMS;
  }
}

export async function createAttire(payload: Omit<Attire, 'id' | 'createdAt'>): Promise<Attire> {
  try {
    const { data, error } = await supabase
      .from(TABLE)
      .insert([denormalize(payload)])
      .select('*')
      .single();
    if (error) throw error;
    return normalize(data);
  } catch (err) {
    console.warn('[createAttire] Local fallback creation:', err);
    return {
      id: `attire-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: payload.name,
      price: payload.price,
      region: payload.region,
    };
  }
}

export async function updateAttire(id: string, patch: Partial<Attire>): Promise<Attire> {
  try {
    const { data, error } = await supabase
      .from(TABLE)
      .update(denormalize(patch))
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return normalize(data);
  } catch (err) {
    console.warn('[updateAttire] Local fallback update:', err);
    return {
      id,
      name: patch.name || '',
      price: patch.price || 0,
      region: patch.region,
    };
  }
}

export async function deleteAttire(id: string): Promise<void> {
  try {
    const { error } = await supabase.from(TABLE).delete().eq('id', id);
    if (error) throw error;
  } catch (err) {
    console.warn('[deleteAttire] Local fallback deletion:', err);
  }
}
