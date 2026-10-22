import React, { useState } from 'react';
import { AddOn, REGIONS, Region } from '../../../types';
import RupiahInput from '../../../shared/form/RupiahInput';
import { 
    Plus, 
    Pencil, 
    Trash2, 
    Sparkles, 
    Search, 
    MapPin, 
    Tag, 
    Check, 
    X 
} from 'lucide-react';

interface AddOnSectionProps {
    addOns: AddOn[];
    regionFilter: '' | Region;
    unionRegions: { value: string; label: string }[];
    onSaveAddOn: (addOnData: { id?: string; name: string; price: number; region?: string }) => Promise<void>;
    onDeleteAddOn: (addOnId: string) => Promise<void>;
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { 
        style: 'currency', 
        currency: 'IDR', 
        minimumFractionDigits: 0 
    }).format(amount);
};

export const AddOnSection: React.FC<AddOnSectionProps> = ({
    addOns,
    regionFilter,
    unionRegions,
    onSaveAddOn,
    onDeleteAddOn,
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingAddOn, setEditingAddOn] = useState<AddOn | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        region: '',
    });
    const [isSaving, setIsSaving] = useState(false);

    // Filter add-ons
    const filteredAddOns = addOns.filter(a => {
        const matchSearch = a.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchRegion = !regionFilter || (a.region && a.region.toLowerCase() === regionFilter.toLowerCase());
        return matchSearch && matchRegion;
    });

    const handleOpenCreate = () => {
        setEditingAddOn(null);
        setFormData({ name: '', price: '', region: regionFilter || '' });
        setIsFormOpen(true);
    };

    const handleOpenEdit = (item: AddOn) => {
        setEditingAddOn(item);
        setFormData({
            name: item.name,
            price: item.price.toString(),
            region: item.region || '',
        });
        setIsFormOpen(true);
    };

    const handleCloseForm = () => {
        setIsFormOpen(false);
        setEditingAddOn(null);
        setFormData({ name: '', price: '', region: '' });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim() || !formData.price) {
            alert('Nama Add-On dan Harga wajib diisi.');
            return;
        }

        setIsSaving(true);
        try {
            await onSaveAddOn({
                id: editingAddOn?.id,
                name: formData.name.trim(),
                price: Number(formData.price),
                region: formData.region ? formData.region.trim().toLowerCase() : undefined,
            });
            handleCloseForm();
        } catch (err: any) {
            console.error('Error saving add-on:', err);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-4 sm:space-y-5">
            {/* Header & Controls Bar */}
            <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-[#EAEFF4] shadow-[0_4px_16px_rgba(0,0,0,0.03)] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3">
                <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2.5">
                    {/* Search bar */}
                    <div className="relative flex-1 min-w-[180px]">
                        <Search className="w-4 h-4 text-[#5A6A85] absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                            type="search"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            placeholder="Cari item add-on..."
                            className="w-full pl-9 pr-3.5 py-2 sm:py-2 rounded-xl border border-[#EAEFF4] bg-[#F4F6F9] focus:bg-white focus:border-brand-accent text-xs sm:text-sm text-[#2A3547] placeholder-[#5A6A85] outline-none transition-all"
                        />
                    </div>

                </div>

                {/* Add New Button */}
                <button
                    type="button"
                    onClick={handleOpenCreate}
                    className="py-2 sm:py-2.5 px-4 rounded-xl bg-brand-accent hover:bg-brand-accent-hover text-white font-semibold text-xs transition-all shadow-brand-accent/25 flex items-center justify-center gap-1.5 whitespace-nowrap min-h-[44px] touch-manipulation cursor-pointer"
                >
                    <Plus className="w-4 h-4" />
                    <span>Tambah Add-On Baru</span>
                </button>
            </div>

            {/* Add/Edit Modal or Drawer */}
            {isFormOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm animate-fade-in overflow-y-auto">
                    <div className="bg-white rounded-2xl border border-[#EAEFF4] shadow-2xl max-w-md w-full p-5 sm:p-6 space-y-4 sm:space-y-5 animate-scale-up my-auto max-h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between pb-3 border-b border-[#EAEFF4]">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-xl bg-brand-accent/10 flex items-center justify-center text-brand-accent">
                                    <Sparkles className="w-4 h-4" />
                                </div>
                                <h3 className="font-bold text-sm sm:text-base text-[#2A3547]">
                                    {editingAddOn ? 'Edit Layanan Add-On' : 'Tambah Add-On Baru'}
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={handleCloseForm}
                                className="p-1.5 rounded-lg text-[#5A6A85] hover:text-[#2A3547] hover:bg-[#F4F6F9] touch-manipulation cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-3.5 sm:space-y-4 overflow-y-auto flex-1 pr-1">
                            <div>
                                <label className="block text-xs font-bold text-[#2A3547] mb-1.5 uppercase tracking-wider">
                                    Nama Layanan Add-On
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="Contoh: Drone Pilot, Extra Jam, Live Streaming..."
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAEFF4] bg-[#F4F6F9] focus:bg-white focus:border-brand-accent text-sm text-[#2A3547] outline-none transition-all placeholder:text-[#5A6A85]/50"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-[#2A3547] mb-1.5 uppercase tracking-wider">
                                    Harga (IDR)
                                </label>
                                <RupiahInput
                                    value={formData.price}
                                    onChange={raw => setFormData(prev => ({ ...prev, price: raw }))}
                                    placeholder="Contoh: 1.500.000"
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAEFF4] bg-[#F4F6F9] focus:bg-white focus:border-brand-accent text-sm text-[#2A3547] outline-none transition-all placeholder:text-[#5A6A85]/50 font-semibold"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-[#2A3547] mb-1.5 uppercase tracking-wider">
                                    Grup Paket Kustom (Daerah / Pribadi, Opsional)
                                </label>
                                <input
                                    type="text"
                                    list="addon-regions"
                                    value={formData.region}
                                    onChange={e => setFormData(prev => ({ ...prev, region: e.target.value }))}
                                    placeholder="Kosongkan jika berlaku untuk semua grup paket"
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAEFF4] bg-[#F4F6F9] focus:bg-white focus:border-brand-accent text-sm text-[#2A3547] outline-none transition-all placeholder:text-[#5A6A85]/50"
                                />
                                <datalist id="addon-regions">
                                    {REGIONS.map(r => (
                                        <option key={r.value} value={r.value}>{r.label}</option>
                                    ))}
                                </datalist>
                                <div className="mt-2 flex flex-wrap gap-1.5">
                                    {unionRegions.map(r => (
                                        <button
                                            key={r.value}
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, region: r.value }))}
                                            className={`px-2 py-0.5 rounded-lg text-[11px] font-medium border transition-colors ${
                                                formData.region.toLowerCase() === r.value.toLowerCase()
                                                    ? 'bg-brand-accent text-white border-brand-accent'
                                                    : 'bg-white border-[#EAEFF4] text-[#5A6A85] hover:border-brand-accent/50'
                                            }`}
                                        >
                                            {r.label}
                                        </button>
                                    ))}
                                    {formData.region && (
                                        <button
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, region: '' }))}
                                            className="px-2 py-0.5 rounded-lg text-[11px] font-medium border bg-red-600/10 border-red-600/20 text-red-600"
                                        >
                                            Hapus Grup
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-2.5 pt-3">
                                <button
                                    type="button"
                                    onClick={handleCloseForm}
                                    className="flex-1 py-2.5 px-4 rounded-xl border border-[#EAEFF4] bg-white hover:bg-[#F4F6F9] text-[#5A6A85] font-semibold text-xs transition-colors"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="flex-1 py-2.5 px-4 rounded-xl bg-brand-accent hover:bg-brand-accent-hover text-white font-semibold text-xs transition-all shadow-brand-accent/25 disabled:opacity-50"
                                >
                                    {isSaving ? 'Menyimpan...' : editingAddOn ? 'Simpan Perubahan' : 'Tambahkan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add-On Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {filteredAddOns.length === 0 ? (
                    <div className="col-span-full py-12 sm:py-16 text-center bg-white rounded-2xl border border-[#EAEFF4] p-6">
                        <div className="w-12 h-12 rounded-2xl bg-brand-accent/10 text-brand-accent flex items-center justify-center mx-auto mb-3">
                            <Sparkles className="w-6 h-6" />
                        </div>
                        <p className="font-bold text-sm text-[#2A3547]">Belum ada layanan Add-On</p>
                        <p className="text-xs text-[#5A6A85] mt-1 max-w-sm mx-auto">
                            Tambahkan layanan pelengkap seperti drone, extra hours, atau cetak canvas untuk dipilih calon pengantin.
                        </p>
                        <button
                            type="button"
                            onClick={handleOpenCreate}
                            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-accent text-white text-xs font-semibold shadow-sm hover:bg-brand-accent-hover touch-manipulation cursor-pointer"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            Tambah Add-On
                        </button>
                    </div>
                ) : (
                    filteredAddOns.map(addon => (
                        <div 
                            key={addon.id} 
                            className="bg-white rounded-2xl border border-[#EAEFF4] shadow-[0_4px_16px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] hover:border-brand-accent/30 p-3.5 sm:p-4 flex flex-col justify-between gap-2.5 sm:gap-3 transition-all group"
                        >
                            <div>
                                <div className="flex items-start justify-between gap-2 mb-2">
                                    <span className="w-8 h-8 rounded-xl solid-cyan text-white flex items-center justify-center flex-shrink-0">
                                        <Sparkles className="w-4 h-4" />
                                    </span>
                                    {addon.region ? (
                                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#F4F6F9] border border-[#EAEFF4] text-[#5A6A85] uppercase tracking-wider">
                                            <MapPin className="w-2.5 h-2.5 text-brand-accent" />
                                            {addon.region}
                                        </span>
                                    ) : (
                                        <span className="text-[10px] font-medium text-[#5A6A85] bg-[#F4F6F9] px-2 py-0.5 rounded-md">
                                            Semua Grup
                                        </span>
                                    )}
                                </div>
                                <h4 className="font-bold text-sm text-[#2A3547] leading-snug group-hover:text-brand-accent transition-colors">
                                    {addon.name}
                                </h4>
                            </div>

                            <div className="pt-2 border-t border-[#EAEFF4] flex items-center justify-between gap-2">
                                <p className="font-bold text-sm text-brand-accent truncate">
                                    {formatCurrency(addon.price)}
                                </p>
                                <div className="flex items-center gap-1 flex-shrink-0">
                                    <button
                                        type="button"
                                        onClick={() => handleOpenEdit(addon)}
                                        className="w-8 h-8 rounded-lg text-[#5A6A85] hover:text-brand-accent hover:bg-brand-accent/10 transition-colors flex items-center justify-center touch-manipulation cursor-pointer"
                                        title="Edit Add-On"
                                    >
                                        <Pencil className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => onDeleteAddOn(addon.id)}
                                        className="w-8 h-8 rounded-lg text-[#5A6A85] hover:text-red-600 hover:bg-red-600/10 transition-colors flex items-center justify-center touch-manipulation cursor-pointer"
                                        title="Hapus Add-On"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
