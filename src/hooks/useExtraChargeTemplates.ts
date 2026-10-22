import { useState, useEffect } from 'react';

export interface ExtraChargeTemplate {
  id: string;
  name: string;
  category: string;
  defaultAmount: number;
  badge?: string;
  isPopular?: boolean;
}

const STORAGE_KEY = 'extra_charge_templates';

const DEFAULT_TEMPLATES: ExtraChargeTemplate[] = [
  { id: '1', name: 'Overtime Kru (1 Jam)', category: 'Overtime & Jam Tambahan', defaultAmount: 500000, isPopular: true },
  { id: '2', name: 'Drone Aerial 4K / Pilot Drone', category: 'Dokumentasi & Personil', defaultAmount: 1200000, isPopular: true },
  { id: '3', name: 'Same Day Edit (SDE) Video Teaser', category: 'Dokumentasi & Personil', defaultAmount: 1500000, isPopular: true },
  { id: '4', name: 'Upgrade Cetak Album 20x30 Exclusive & Box', category: 'Cetak & Album', defaultAmount: 600000, isPopular: true },
  { id: '5', name: 'Bonus Overtime 1 Jam (Free)', category: 'Bonus / Free (Rp 0)', defaultAmount: 0, badge: 'Rp 0', isPopular: true },
  { id: '6', name: 'Bonus Cetak Foto Mini Frame (Free)', category: 'Bonus / Free (Rp 0)', defaultAmount: 0, badge: 'Rp 0', isPopular: true },
];

export const useExtraChargeTemplates = () => {
  const [templates, setTemplates] = useState<ExtraChargeTemplate[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setTemplates(JSON.parse(saved));
    } else {
      setTemplates(DEFAULT_TEMPLATES);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_TEMPLATES));
    }
  }, []);

  const saveTemplates = (newTemplates: ExtraChargeTemplate[]) => {
    setTemplates(newTemplates);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newTemplates));
  };

  const addTemplate = (template: Omit<ExtraChargeTemplate, 'id'>) => {
    const newTemplate = { isPopular: true, ...template, id: `tpl-${Date.now()}` };
    saveTemplates([...templates, newTemplate]);
  };

  const updateTemplate = (id: string, updated: Omit<ExtraChargeTemplate, 'id'>) => {
    saveTemplates(templates.map(t => t.id === id ? { isPopular: true, ...updated, id } : t));
  };

  const deleteTemplate = (id: string) => {
    saveTemplates(templates.filter(t => t.id !== id));
  };

  return { templates, addTemplate, updateTemplate, deleteTemplate };
};
