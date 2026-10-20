import supabase from '../lib/supabaseClient';
import { WeddingDayChecklist } from '../types';

const TABLE_NAME = 'wedding_day_checklists';

export function normalizeChecklist(row: any): WeddingDayChecklist {
  return {
    id: row.id,
    projectId: row.project_id,
    category: row.category,
    itemName: row.item_name,
    isCompleted: row.is_completed,
    assignedTo: row.assigned_to || undefined,
    notes: row.notes || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listChecklistByProject(projectId: string): Promise<WeddingDayChecklist[]> {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data || []).map(normalizeChecklist);
}

export async function setChecklistItemCompleted(id: string, isCompleted: boolean): Promise<WeddingDayChecklist> {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .update({
      is_completed: isCompleted,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw error;
  return normalizeChecklist(data);
}

export async function updateChecklistItemText(
  id: string,
  fields: { itemName?: string; category?: string },
): Promise<WeddingDayChecklist> {
  const payload: Record<string, unknown> = {
    ...(fields.itemName !== undefined ? { item_name: fields.itemName } : {}),
    ...(fields.category !== undefined ? { category: fields.category } : {}),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .update(payload)
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw error;
  return normalizeChecklist(data);
}

export async function updateChecklistItemFields(
  id: string,
  fields: { itemName?: string; notes?: string | null; assignedTo?: string | null },
): Promise<WeddingDayChecklist> {
  const payload: Record<string, unknown> = {
    ...(fields.itemName !== undefined ? { item_name: fields.itemName } : {}),
    ...(fields.notes !== undefined ? { notes: fields.notes } : {}),
    ...(fields.assignedTo !== undefined ? { assigned_to: fields.assignedTo } : {}),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .update(payload)
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw error;
  return normalizeChecklist(data);
}

export async function upsertChecklistItems(items: Partial<WeddingDayChecklist>[]): Promise<WeddingDayChecklist[]> {
  const toUpsert = items.map(item => ({
    ...(item.id ? { id: item.id } : {}),
    project_id: item.projectId,
    category: item.category,
    item_name: item.itemName,
    is_completed: item.isCompleted ?? false,
    assigned_to: item.assignedTo || null,
    notes: item.notes || null,
    updated_at: new Date().toISOString(),
  }));

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .upsert(toUpsert)
    .select('*');

  if (error) throw error;
  return (data || []).map(normalizeChecklist);
}

export async function deleteChecklistItem(id: string): Promise<void> {
  const { error } = await supabase
    .from(TABLE_NAME)
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function deleteChecklistItemsByProjectAndCategory(projectId: string, category: string): Promise<void> {
  const { error } = await supabase
    .from(TABLE_NAME)
    .delete()
    .eq('project_id', projectId)
    .eq('category', category);

  if (error) throw error;
}

export async function renameChecklistCategory(projectId: string, oldCategory: string, newCategory: string): Promise<void> {
  const { error } = await supabase
    .from(TABLE_NAME)
    .update({
      category: newCategory,
      updated_at: new Date().toISOString(),
    })
    .eq('project_id', projectId)
    .eq('category', oldCategory);

  if (error) throw error;
}

export const DEFAULT_CHECKLIST_TEMPLATES = [
  { category: 'Persiapan Rias & Alat', items: ['Cek koper & perlengkapan makeup', 'Cek ring light & cermin', 'Cek aksesoris & mahkota', 'Cek ronce melati segar'] },
  { category: 'Mempelai Wanita', items: ['Skin preparation (cleansing & hydrating)', 'Proses makeup & foundation', 'Hijab / Hairdo styling', 'Pemasangan gaun & aksesoris', 'Touch-up sebelum temu pengantin'] },
  { category: 'Mempelai Pria & Keluarga', items: ['Grooming & bedak tipis mempelai pria', 'Makeup & hairdo ibu mempelai wanita', 'Makeup & hairdo ibu mempelai pria', 'Rias pagar ayu / bridesmaid'] },
  { category: 'Sesi Acara & Resepsi', items: ['Standby saat akad / pemberkatan', 'Ganti busana & riasan resepsi', 'Retouch makeup resepsi', 'Pelepasan busana & aksesoris'] },
];

export async function initializeDefaultChecklist(projectId: string, customTemplates?: { category: string; items: string[] }[]): Promise<WeddingDayChecklist[]> {
  // Cek apakah sudah ada checklist untuk project ini
  const existing = await listChecklistByProject(projectId);
  if (existing.length > 0) {
    console.warn('Checklist already exists for this project, skipping initialization');
    return existing;
  }

  const templates = customTemplates && customTemplates.length > 0 ? customTemplates : DEFAULT_CHECKLIST_TEMPLATES;

  const items: Partial<WeddingDayChecklist>[] = [];
  templates.forEach(template => {
    template.items.forEach(itemName => {
      items.push({
        projectId,
        category: template.category,
        itemName,
        isCompleted: false,
      });
    });
  });

  return upsertChecklistItems(items);
}
