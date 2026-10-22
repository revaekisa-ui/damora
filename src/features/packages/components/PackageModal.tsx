import React, { useState } from 'react';
import Modal from '../../../shared/ui/Modal';
import RupiahInput from '../../../shared/form/RupiahInput';
import { PhysicalItem } from '../../../types';
import { 
    Info, 
    Clock, 
    CheckSquare, 
    Image as ImageIcon, 
    Plus, 
    Trash2, 
    ChevronDown, 
    Users, 
    MapPin, 
    Upload, 
    X, 
    Sparkles,
    Package as PackageIcon,
    Tag,
    DollarSign,
    Box
} from 'lucide-react';
import { customizeUiText, useUiTextOverrides } from '../../../utils/uiTextCustomization';

interface PackageModalProps {
    isOpen: boolean;
    onClose: () => void;
    formData: any;
    setFormData: React.Dispatch<React.SetStateAction<any>>;
    editMode: string | null;
    packageCategories: string[];
    unionRegions: { value: string; label: string }[];
    isSubmitting: boolean;
    onSubmit: (e: React.FormEvent) => Promise<void>;
    onCoverImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
}

export const PackageModal: React.FC<PackageModalProps> = ({
    isOpen,
    onClose,
    formData,
    setFormData,
    editMode,
    packageCategories,
    unionRegions,
    isSubmitting,
    onSubmit,
    onCoverImageUpload,
}) => {
    const uiTextOverrides = useUiTextOverrides();
    const text = (key: string, fallback: string) => customizeUiText(`packages.form.${key}`, fallback, uiTextOverrides);
    const [activeTab, setActiveTab] = useState<'basic' | 'deliverables' | 'cover'>('basic');



    // Digital Items
    const handleDigitalItemChange = (index: number, val: string) => {
        const list = [...formData.digitalItems];
        list[index] = val;
        setFormData((prev: any) => ({ ...prev, digitalItems: list }));
    };

    const addDigitalItem = (focusIndex?: number) => {
        setFormData((prev: any) => {
            const newList = [...prev.digitalItems, ''];
            // focus new item after state update
            setTimeout(() => {
                const inputs = document.querySelectorAll<HTMLInputElement>('.digital-item-input');
                const targetIdx = focusIndex !== undefined ? focusIndex + 1 : newList.length - 1;
                inputs[targetIdx]?.focus();
            }, 50);
            return { ...prev, digitalItems: newList };
        });
    };

    const handleDigitalItemKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, idx: number) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            // If last item, add new; otherwise focus next
            if (idx === formData.digitalItems.length - 1) {
                addDigitalItem(idx);
            } else {
                const inputs = document.querySelectorAll<HTMLInputElement>('.digital-item-input');
                inputs[idx + 1]?.focus();
            }
        }
        if (e.key === 'Backspace' && formData.digitalItems[idx] === '' && formData.digitalItems.length > 1) {
            e.preventDefault();
            removeDigitalItem(idx);
            setTimeout(() => {
                const inputs = document.querySelectorAll<HTMLInputElement>('.digital-item-input');
                inputs[Math.max(0, idx - 1)]?.focus();
            }, 50);
        }
    };

    const removeDigitalItem = (index: number) => {
        const list = [...formData.digitalItems];
        list.splice(index, 1);
        setFormData((prev: any) => ({ ...prev, digitalItems: list.length > 0 ? list : [''] }));
    };

    // Physical Items
    const handlePhysicalItemChange = (index: number, field: string, val: any) => {
        const list = [...formData.physicalItems];
        list[index] = { ...list[index], [field]: val };
        setFormData((prev: any) => ({ ...prev, physicalItems: list }));
    };

    const addPhysicalItem = () => {
        setFormData((prev: any) => ({ ...prev, physicalItems: [...prev.physicalItems, { name: '', price: '' }] }));
    };

    const removePhysicalItem = (index: number) => {
        const list = [...formData.physicalItems];
        list.splice(index, 1);
        setFormData((prev: any) => ({ ...prev, physicalItems: list.length > 0 ? list : [{ name: '', price: '' }] }));
    };



    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={editMode === 'new' ? text('title.create', 'Tambah Paket Baru') : text('title.edit', 'Edit Paket Layanan')}
            size="3xl"
        >
            <form onSubmit={onSubmit} className="space-y-4 sm:space-y-6">
                {/* ── Tabs Navigation ── */}
                <div className="flex border-b border-[#EAEFF4] gap-1 sm:gap-2 overflow-x-auto pb-1 scrollbar-none -mx-2 px-2 sm:mx-0 sm:px-0">
                    <button
                        type="button"
                        onClick={() => setActiveTab('basic')}
                        className={`min-h-[44px] flex-shrink-0 py-2 sm:py-2.5 px-3 sm:px-3.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 sm:gap-2 whitespace-nowrap touch-manipulation cursor-pointer ${
                            activeTab === 'basic'
                                ? 'bg-brand-accent text-white shadow-xs'
                                : 'text-[#5A6A85] hover:text-[#2A3547] hover:bg-[#F4F6F9]'
                        }`}
                    >
                        <Info className="w-4 h-4" />
                        <span>{text('tab.basic', 'Informasi & Harga')}</span>
                    </button>



                    <button
                        type="button"
                        onClick={() => setActiveTab('deliverables')}
                        className={`min-h-[44px] flex-shrink-0 py-2 sm:py-2.5 px-3 sm:px-3.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 sm:gap-2 whitespace-nowrap touch-manipulation cursor-pointer ${
                            activeTab === 'deliverables'
                                ? 'bg-brand-accent text-white shadow-xs'
                                : 'text-[#5A6A85] hover:text-[#2A3547] hover:bg-[#F4F6F9]'
                        }`}
                    >
                        <CheckSquare className="w-4 h-4" />
                        <span>{text('tab.deliverables', 'Deliverables & Item')}</span>
                        {formData.digitalItems?.filter((d: string) => d.trim()).length > 0 && (
                            <span className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full text-[10px] flex items-center justify-center font-bold ${
                                activeTab === 'deliverables' ? 'bg-white text-green-600' : 'bg-green-600 text-white'
                            }`}>
                                {formData.digitalItems.filter((d: string) => d.trim()).length}
                            </span>
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('cover')}
                        className={`min-h-[44px] flex-shrink-0 py-2 sm:py-2.5 px-3 sm:px-3.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 sm:gap-2 whitespace-nowrap touch-manipulation cursor-pointer ${
                            activeTab === 'cover'
                                ? 'bg-brand-accent text-white shadow-xs'
                                : 'text-[#5A6A85] hover:text-[#2A3547] hover:bg-[#F4F6F9]'
                        }`}
                    >
                        <ImageIcon className="w-4 h-4" />
                        <span>{text('tab.cover', 'Foto Sampul')}</span>
                        {formData.coverImage && (
                            <span className="w-2 h-2 rounded-full bg-green-500" />
                        )}
                    </button>
                </div>

                {/* ── TAB 1: INFORMASI DASAR ── */}
                {activeTab === 'basic' && (
                    <div className="space-y-4 animate-fade-in">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Package Name */}
                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-[#2A3547] mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                                    <PackageIcon className="w-3.5 h-3.5 text-brand-accent" />
                                    <span>{text('field.name', 'Nama Paket')}</span> <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData((p: any) => ({ ...p, name: e.target.value }))}
                                    placeholder="Contoh: Premium Wedding Documentation, Prewedding Gold..."
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAEFF4] bg-[#F4F6F9] focus:bg-white focus:border-brand-accent text-sm text-[#2A3547] outline-none transition-all placeholder:text-[#5A6A85]/50"
                                />
                            </div>

                            {/* Category */}
                            <div>
                                <label className="block text-xs font-bold text-[#2A3547] mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                                    <Tag className="w-3.5 h-3.5 text-brand-accent" />
                                    <span>{text('field.category', 'Kategori Layanan')}</span> <span className="text-rose-500">*</span>
                                </label>
                                <select
                                    required
                                    value={formData.category}
                                    onChange={e => setFormData((p: any) => ({ ...p, category: e.target.value }))}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAEFF4] bg-[#F4F6F9] focus:bg-white focus:border-brand-accent text-sm text-[#2A3547] outline-none cursor-pointer transition-all"
                                >
                                    <option value="">Pilih Kategori...</option>
                                    {(packageCategories || []).map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Base Price */}
                            <div>
                                <label className="block text-xs font-bold text-[#2A3547] mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                                    <DollarSign className="w-3.5 h-3.5 text-brand-accent" />
                                    <span>{text('field.price', 'Harga Paket (IDR)')}</span> <span className="text-rose-500">*</span>
                                </label>
                                <RupiahInput
                                    value={formData.price.toString()}
                                    onChange={raw => setFormData((p: any) => ({ ...p, price: raw }))}
                                    placeholder="Contoh: 12.500.000"
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAEFF4] bg-[#F4F6F9] focus:bg-white focus:border-brand-accent text-sm text-[#2A3547] outline-none font-semibold transition-all placeholder:text-[#5A6A85]/50"
                                />
                            </div>

                            {/* Team Composition */}
                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-[#2A3547] mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                                    <Users className="w-3.5 h-3.5 text-brand-accent" />
                                    {text('field.team', 'Keterangan')}
                                </label>
                                <input
                                    type="text"
                                    value={formData.photographers}
                                    onChange={e => setFormData((p: any) => ({ ...p, photographers: e.target.value }))}
                                    placeholder="Contoh: makeup attire pengantin akad resepsi, makeup attire orang tua dan pagar ayu"
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAEFF4] bg-[#F4F6F9] focus:bg-white focus:border-brand-accent text-sm text-[#2A3547] outline-none transition-all placeholder:text-[#5A6A85]/50"
                                />
                            </div>

                            {/* Region */}
                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-[#2A3547] mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                                    <MapPin className="w-3.5 h-3.5 text-brand-accent" />
                                    {text('field.region', 'Paket Kustom (paket daerah atau paket pribadi, opsional)')}
                                </label>
                                <input
                                    type="text"
                                    list="pkg-region-suggestions"
                                    value={formData.region}
                                    onChange={e => setFormData((p: any) => ({ ...p, region: e.target.value }))}
                                    placeholder="Kosongkan jika berlaku untuk semua grup paket"
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAEFF4] bg-[#F4F6F9] focus:bg-white focus:border-brand-accent text-sm text-[#2A3547] outline-none transition-all placeholder:text-[#5A6A85]/50"
                                />
                                <datalist id="pkg-region-suggestions">
                                    {unionRegions.map(region => (
                                        <option key={region.value} value={region.value}>{region.label}</option>
                                    ))}
                                </datalist>
                                <div className="mt-2 flex flex-wrap gap-1.5">
                                    {unionRegions.map(region => (
                                        <button
                                            type="button"
                                            key={region.value}
                                            onClick={() => setFormData((p: any) => ({ ...p, region: region.value }))}
                                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                                                formData.region.toLowerCase() === region.value.toLowerCase()
                                                    ? 'bg-brand-accent text-white border-brand-accent shadow-sm'
                                                    : 'bg-white border-[#EAEFF4] text-[#5A6A85] hover:border-brand-accent/50'
                                            }`}
                                        >
                                            {region.label}
                                        </button>
                                    ))}
                                    {formData.region && (
                                        <button
                                            type="button"
                                            onClick={() => setFormData((p: any) => ({ ...p, region: '' }))}
                                            className="px-2.5 py-1 rounded-lg text-xs font-medium border bg-red-600/10 border-red-600/20 text-red-600"
                                        >
                                            Kosongkan
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}



                {/* ── TAB 3: DELIVERABLES & VENDOR ── */}
                {activeTab === 'deliverables' && (
                    <div className="space-y-6 animate-fade-in max-h-[50vh] overflow-y-auto pr-1">
                        {/* Digital Deliverables */}
                        <div className="space-y-3">
                            <div>
                                    <h4 className="font-bold text-sm text-[#2A3547]">{text('deliverables.title', 'Deliverables & Layanan Digital')}</h4>
                                <p className="text-xs text-[#5A6A85] mt-0.5">
                                    Daftar file atau hasil akhir yang akan diterima pengantin.{' '}
                                    <span className="text-green-600 font-medium">Satu baris = satu item.</span>
                                </p>
                            </div>
                            <textarea
                                rows={6}
                                value={(formData.digitalItems || []).join('\n')}
                                onChange={e => {
                                    const lines = e.target.value.split('\n');
                                    setFormData((prev: any) => ({ ...prev, digitalItems: lines }));
                                }}
                                placeholder={`Semua file foto edit warna\nVideo Teaser 1 Menit\nVideo Full Highlight\nFlashdisk 64GB`}
                                className="w-full px-4 py-3 rounded-xl border border-[#EAEFF4] bg-[#F4F6F9] focus:bg-white focus:border-green-600 focus:shadow-[0_0_0_3px_rgba(22,163,74,0.12)] text-xs sm:text-sm text-[#2A3547] outline-none transition-all resize-none leading-relaxed"
                            />
                        </div>

                        {/* Physical / Vendor Items */}
                        <div className="pt-4 border-t border-[#EAEFF4] space-y-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="font-bold text-sm text-[#2A3547]">{text('physical.title', 'NOTE')}</h4>
                                    <p className="text-xs text-[#5A6A85]">Noted setiap paket</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={addPhysicalItem}
                                    className="py-1 px-3 rounded-lg bg-brand-accent/10 text-brand-accent hover:bg-brand-accent/20 font-semibold text-xs flex items-center gap-1 transition-colors"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>Tambah Vendor</span>
                                </button>
                            </div>

                            <div className="space-y-2">
                                {formData.physicalItems?.map((item: any, idx: number) => (
                                    <div key={idx} className="flex items-start gap-2">
                                        <div className="w-7 h-7 mt-1 rounded-lg bg-brand-accent/10 text-brand-accent flex items-center justify-center flex-shrink-0">
                                            <Box className="w-3.5 h-3.5" />
                                        </div>
                                        <textarea
                                            ref={element => {
                                                if (!element) return;
                                                element.style.height = 'auto';
                                                element.style.height = `${element.scrollHeight}px`;
                                            }}
                                            value={item.name}
                                            onChange={e => {
                                                e.currentTarget.style.height = 'auto';
                                                e.currentTarget.style.height = `${e.currentTarget.scrollHeight}px`;
                                                handlePhysicalItemChange(idx, 'name', e.target.value);
                                            }}
                                            placeholder="Contoh: Album Magazine 20x30, Cetak Canvas 40x60, Vendor MUA..."
                                            className="w-full min-w-0 flex-1 min-h-20 px-3.5 py-2 rounded-xl border border-[#EAEFF4] bg-[#F4F6F9] focus:bg-white focus:border-brand-accent text-xs sm:text-sm text-[#2A3547] outline-none transition-all resize-y leading-relaxed"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removePhysicalItem(idx)}
                                            className="p-2 rounded-xl text-red-500 hover:bg-red-600/10 transition-colors"
                                            title="Hapus"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* ── TAB 4: COVER IMAGE ── */}
                {activeTab === 'cover' && (
                    <div className="space-y-4 animate-fade-in">
                        <div className="border-2 border-dashed border-[#EAEFF4] rounded-2xl p-6 text-center bg-[#F4F6F9]/50 hover:bg-[#F4F6F9] transition-all relative">
                            {formData.coverImage ? (
                                <div className="space-y-3">
                                    <img
                                        src={formData.coverImage}
                                        alt="Cover preview"
                                        className="h-48 w-full max-w-md mx-auto object-cover rounded-xl shadow-md border border-white"
                                    />
                                    <div className="flex justify-center gap-2">
                                        <label className="cursor-pointer py-2 px-4 rounded-xl bg-brand-accent text-white font-semibold text-xs hover:bg-brand-accent-hover transition-colors shadow-sm inline-flex items-center gap-1.5">
                                            <Upload className="w-4 h-4" />
                                            <span>Ganti Foto Sampul</span>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={onCoverImageUpload}
                                                className="hidden"
                                            />
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => setFormData((p: any) => ({ ...p, coverImage: '' }))}
                                            className="py-2 px-4 rounded-xl border border-[#EAEFF4] bg-white text-red-600 font-semibold text-xs hover:bg-red-600/10 transition-colors inline-flex items-center gap-1.5"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            <span>Hapus Foto</span>
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-3 py-6">
                                    <div className="w-16 h-16 rounded-2xl bg-white border border-[#EAEFF4] shadow-sm flex items-center justify-center mx-auto text-brand-accent">
                                        <ImageIcon className="w-8 h-8" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm text-[#2A3547]">{text('cover.upload', 'Unggah Foto Sampul Paket')}</p>
                                        <p className="text-xs text-[#5A6A85] mt-1">
                                            Pilih gambar portrait/landscape menarik berukuran maksimal 2MB.
                                        </p>
                                    </div>
                                    <label className="cursor-pointer inline-flex items-center gap-2 py-2 px-4 rounded-xl bg-brand-accent hover:bg-brand-accent-hover text-white font-semibold text-xs transition-all shadow-brand-accent/25">
                                        <Upload className="w-4 h-4" />
                                        <span>Pilih File Gambar</span>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={onCoverImageUpload}
                                            className="hidden"
                                        />
                                    </label>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ── Modal Footer ── */}
                <div className="grid grid-cols-2 gap-2.5 pt-3 sm:flex sm:flex-row sm:items-center sm:justify-between sm:gap-2.5 sm:pt-4 border-t border-[#EAEFF4]">
                    <div className="contents sm:flex sm:items-center sm:gap-2">
                        {activeTab !== 'basic' && (
                            <button
                                type="button"
                                onClick={() => {
                                    if (activeTab === 'cover') setActiveTab('deliverables');
                                    else if (activeTab === 'deliverables') setActiveTab('basic');
                                }}
                                className={`${activeTab === 'cover' ? 'col-span-2' : 'col-span-1'} min-h-[38px] sm:min-h-[44px] flex-1 sm:flex-initial py-1.5 px-2 sm:px-3 rounded-xl border border-[#EAEFF4] text-xs font-semibold text-[#5A6A85] hover:bg-[#F4F6F9] touch-manipulation cursor-pointer text-center`}
                            >
                                Kembali
                            </button>
                        )}
                        {activeTab !== 'cover' && (
                            <button
                                type="button"
                                onClick={() => {
                                    if (activeTab === 'basic') setActiveTab('deliverables');
                                    else if (activeTab === 'deliverables') setActiveTab('cover');
                                }}
                                className={`${activeTab === 'basic' ? 'col-span-2' : 'col-span-1'} min-h-[38px] sm:min-h-[44px] flex-1 sm:flex-initial py-1.5 px-2 sm:px-3 rounded-xl bg-[#F4F6F9] text-xs font-semibold text-[#2A3547] hover:bg-[#EAEFF4] touch-manipulation cursor-pointer text-center`}
                            >
                                Selanjutnya
                            </button>
                        )}
                    </div>

                    <div className="col-span-2 flex items-center gap-2 sm:col-span-1 sm:ml-auto">
                        <button
                            type="button"
                            onClick={onClose}
                            className="min-h-[38px] sm:min-h-[44px] flex-1 sm:flex-initial py-2 px-3 sm:px-4 rounded-xl border border-[#EAEFF4] bg-white hover:bg-[#F4F6F9] text-[#5A6A85] font-semibold text-xs transition-colors touch-manipulation cursor-pointer text-center"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="min-h-[38px] sm:min-h-[44px] flex-1 sm:flex-initial py-2 px-3 sm:px-5 rounded-xl bg-brand-accent hover:bg-brand-accent-hover text-white font-semibold text-xs transition-all shadow-brand-accent/25 touch-manipulation cursor-pointer text-center disabled:opacity-60"
                        >
                            {isSubmitting ? 'Menyimpan...' : editMode === 'new' ? 'Simpan Paket' : 'Perbarui Paket'}
                        </button>
                    </div>
                </div>
            </form>
        </Modal>
    );
};
