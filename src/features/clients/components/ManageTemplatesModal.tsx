import React, { useState } from 'react';
import { Plus, Trash2, Pencil, X, Sparkles, Zap, Gift } from 'lucide-react';
import { useExtraChargeTemplates, ExtraChargeTemplate } from '../../../hooks/useExtraChargeTemplates';
import { formatCurrency } from '../../../utils/currency';

interface ManageTemplatesModalProps {
  onClose: () => void;
}

const CATEGORY_SUGGESTIONS = [
  'Bonus / Free (Rp 0)',
  'Overtime & Jam Tambahan',
  'Dokumentasi & Personil',
  'Cetak & Album',
  'Transport & Akomodasi',
];

const ManageTemplatesModal: React.FC<ManageTemplatesModalProps> = ({ onClose }) => {
  const { templates, addTemplate, updateTemplate, deleteTemplate } = useExtraChargeTemplates();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', category: 'Bonus / Free (Rp 0)', defaultAmount: 0 });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    if (editingId) {
      updateTemplate(editingId, {
        name: formData.name.trim(),
        category: formData.category.trim() || 'Lainnya',
        defaultAmount: Number(formData.defaultAmount) || 0,
      });
      setEditingId(null);
    } else {
      addTemplate({
        name: formData.name.trim(),
        category: formData.category.trim() || 'Lainnya',
        defaultAmount: Number(formData.defaultAmount) || 0,
      });
    }
    setFormData({ name: '', category: 'Bonus / Free (Rp 0)', defaultAmount: 0 });
  };

  const startEdit = (t: ExtraChargeTemplate) => {
    setEditingId(t.id);
    setFormData({ name: t.name, category: t.category, defaultAmount: t.defaultAmount });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({ name: '', category: 'Bonus / Free (Rp 0)', defaultAmount: 0 });
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-lg p-6 max-h-[85vh] overflow-y-auto shadow-2xl border border-slate-100">
        <div className="flex justify-between items-center pb-4 mb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl solid-orange text-white flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Kelola Template Biaya</h2>
              <p className="text-xs text-slate-500">Atur template biaya tambahan & bonus otomatis</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mb-6 bg-slate-50 border border-slate-200/80 p-4 rounded-xl space-y-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
              Nama Biaya / Bonus
            </label>
            <input
              type="text"
              placeholder="Contoh: Bonus Overtime 1 Jam (Free)"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-accent/40"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
              Kategori
            </label>
            <input
              type="text"
              placeholder="Kategori Biaya"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-accent/40 mb-1.5"
              value={formData.category}
              onChange={e => setFormData({ ...formData, category: e.target.value })}
              required
            />
            {/* Category presets */}
            <div className="flex flex-wrap gap-1">
              {CATEGORY_SUGGESTIONS.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setFormData({
                    ...formData,
                    category: cat,
                    defaultAmount: cat.includes('Free') || cat.includes('Rp 0') ? 0 : formData.defaultAmount,
                  })}
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border transition-all ${
                    formData.category === cat
                      ? 'bg-brand-accent text-white border-brand-accent'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                Jumlah Default (Rp)
              </label>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, defaultAmount: 0 })}
                className="text-[10px] font-bold text-teal-600 hover:text-teal-700 bg-teal-600/10 hover:bg-teal-600/20 px-2 py-0.5 rounded border border-teal-600/20 transition-colors flex items-center gap-1"
              >
                <Gift className="w-3 h-3" /> Set Rp 0 (Free / Bonus)
              </button>
            </div>
            <input
              type="number"
              min="0"
              placeholder="0"
              className="w-full px-3 py-2 text-xs font-mono font-bold border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-accent/40"
              value={formData.defaultAmount}
              onChange={e => setFormData({ ...formData, defaultAmount: Math.max(0, Number(e.target.value) || 0) })}
              required
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              className="flex-1 bg-brand-accent hover:bg-brand-accent-hover text-white py-2 px-3 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5"
            >
              {editingId ? <Pencil className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
              <span>{editingId ? 'Simpan Perubahan' : 'Tambah Template'}</span>
            </button>
            {editingId && (
              <button
                type="button"
                onClick={cancelEdit}
                className="px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 bg-slate-200 hover:bg-slate-300 transition-colors"
              >
                Batal
              </button>
            )}
          </div>
        </form>

        <div className="space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Daftar Template Tersedia</p>
          {templates.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">Belum ada template. Tambahkan sekarang.</p>
          ) : (
            templates.map(t => (
              <div
                key={t.id}
                className={`flex justify-between items-center p-3 border rounded-xl transition-all ${
                  t.defaultAmount === 0 ? 'bg-teal-600/5 border-teal-600/20' : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="min-w-0 pr-2">
                  <p className="font-semibold text-xs text-slate-800 truncate">{t.name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                      {t.category}
                    </span>
                    <span className={`text-[11px] font-bold ${t.defaultAmount === 0 ? 'text-teal-700' : 'text-brand-accent'}`}>
                      • {t.defaultAmount === 0 ? 'Rp 0 (Free)' : formatCurrency(t.defaultAmount)}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button
                    onClick={() => startEdit(t)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-brand-accent hover:bg-brand-accent/10 transition-colors"
                    title="Edit Template"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => deleteTemplate(t.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-600/10 transition-colors"
                    title="Hapus Template"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageTemplatesModal;
