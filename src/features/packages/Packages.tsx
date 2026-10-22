import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
    Package,
    AddOn,
    Attire,
    Project,
    Profile,
    NavigationAction,
    REGIONS,
    Region,
    PhysicalItem,
    DurationOption,
    PackageTermItem,
    RegionPricelistPdf,
} from '../../types';
import {
    createPackage,
    updatePackage,
    deletePackage,
} from '../../services/packages';
import {
    createAddOn,
    updateAddOn,
    deleteAddOn,
} from '../../services/addOns';
import {
    createAttire,
    updateAttire,
    deleteAttire,
} from '../../services/attire';
import { upsertProfile } from '../../services/profile';
import { usePackagesQuery, useAddOnsQuery, useAttireQuery } from '../../hooks/queries';

import { PackageCard } from './components/PackageCard';
import { PackageModal } from './components/PackageModal';
import { DuplicatePackageModal } from './components/DuplicatePackageModal';
import { DuplicateAddOnModal } from './components/DuplicateAddOnModal';
import { DuplicateAttireModal } from './components/DuplicateAttireModal';
import { DuplicateCatalogGroupModal } from './components/DuplicateCatalogGroupModal';
import { SharePackageModal } from './components/SharePackageModal';
import { PackageTermsModal } from './components/PackageTermsModal';
import { RegionPricelistModal } from './components/RegionPricelistModal';
import { buildPublicShareUrl, getPackageShareIdentifier } from '../../utils/publicRouting';
import Modal from '../../shared/ui/Modal';

import {
    Package as PackageIcon,
    Plus,
    Share2,
    Search,
    LayoutGrid,
    List,
    Sparkles,
    Tag,
    DollarSign,
    Pencil,
    Copy,
    Trash2,
    MapPin,
    X,
    FileText,
    Download,
    Upload,
    Link as LinkIcon,
    ChevronUp,
    ChevronDown,
    GripVertical
} from 'lucide-react';
import RupiahInput from '../../shared/form/RupiahInput';
import { customizeUiText, useUiTextOverrides } from '../../utils/uiTextCustomization';

export interface PackagesProps {
    packages: Package[];
    setPackages: React.Dispatch<React.SetStateAction<Package[]>>;
    addOns: AddOn[];
    setAddOns: React.Dispatch<React.SetStateAction<AddOn[]>>;
    attire: Attire[];
    setAttire: React.Dispatch<React.SetStateAction<Attire[]>>;
    projects: Project[];
    profile: Profile;
    setProfile: React.Dispatch<React.SetStateAction<Profile>>;
    showNotification: (message: string) => void;
    initialAction: NavigationAction | null;
    setInitialAction: (action: NavigationAction | null) => void;
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { 
        style: 'currency', 
        currency: 'IDR', 
        minimumFractionDigits: 0 
    }).format(amount);
};

const emptyPackageForm = {
    name: '',
    price: '',
    category: '',
    region: '' as '' | Region,
    processingTime: '',
    photographers: '',
    videographers: '',
    physicalItems: [{ name: '', price: '' }],
    digitalItems: [''],
    coverImage: '',
    durationOptions: [
        { label: '4 Jam', price: '', default: true },
        { label: '8 Jam', price: '', default: false },
        { label: 'Full Day', price: '', default: false }
    ],
};

const toBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });

const titleCase = (s: string) =>
    s ? s.replace(/\b\w/g, c => c.toUpperCase()) : '';

const reorderVisibleIds = <T extends { id: string }>(
    savedOrder: string[],
    allItems: T[],
    visibleItems: T[],
    draggedId: string,
    targetId: string,
) => {
    const currentIds = new Set(allItems.map(item => item.id));
    const order = savedOrder.filter(id => currentIds.has(id));
    allItems.forEach(item => { if (!order.includes(item.id)) order.push(item.id); });

    const visibleOrder = visibleItems
        .map(item => item.id)
        .sort((left, right) => order.indexOf(left) - order.indexOf(right));
    const fromIndex = visibleOrder.indexOf(draggedId);
    const toIndex = visibleOrder.indexOf(targetId);
    if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return order;

    const visibleSlots = visibleOrder.map(id => order.indexOf(id)).sort((left, right) => left - right);
    const [movedId] = visibleOrder.splice(fromIndex, 1);
    visibleOrder.splice(toIndex, 0, movedId);
    visibleSlots.forEach((slot, index) => { order[slot] = visibleOrder[index]; });
    return order;
};

interface AddOnEditorModalProps {
    isOpen: boolean;
    addOn: AddOn | null;
    regionFilter: string;
    unionRegions: { value: string; label: string }[];
    onClose: () => void;
    onSave: (data: { id?: string; name: string; price: number; region?: string }) => Promise<void>;
}

const AddOnEditorModal: React.FC<AddOnEditorModalProps> = ({ isOpen, addOn, regionFilter, unionRegions, onClose, onSave }) => {
    const [formData, setFormData] = useState({ name: '', price: '', region: '' });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (!isOpen) return;
        setFormData(addOn
            ? { name: addOn.name, price: addOn.price.toString(), region: addOn.region || '' }
            : { name: '', price: '', region: regionFilter || '' });
    }, [isOpen, addOn, regionFilter]);

    if (!isOpen) return null;

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!formData.name.trim() || !formData.price) {
            alert('Nama Add-On dan Harga wajib diisi.');
            return;
        }

        setIsSaving(true);
        try {
            await onSave({
                id: addOn?.id,
                name: formData.name.trim(),
                price: Number(formData.price),
                region: formData.region.trim() ? formData.region.trim().toLowerCase() : undefined,
            });
            onClose();
        } catch (error) {
            console.error('Error saving add-on:', error);
            alert('Gagal menyimpan Add-On. Silakan coba lagi.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm animate-fade-in overflow-y-auto">
            <div className="bg-white rounded-2xl border border-[#EAEFF4] shadow-2xl max-w-md w-full p-5 sm:p-6 space-y-4 sm:space-y-5 animate-scale-up my-auto max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between pb-3 border-b border-[#EAEFF4]">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-brand-accent flex items-center justify-center text-white">
                            <Sparkles className="w-4 h-4" />
                        </div>
                        <h3 className="font-bold text-sm sm:text-base text-[#2A3547]">
                            {addOn ? 'Edit Layanan Add-On' : 'Tambah Add-On Baru'}
                        </h3>
                    </div>
                    <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-[#5A6A85] hover:text-[#2A3547] hover:bg-[#F4F6F9]">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3.5 sm:space-y-4 overflow-y-auto flex-1 pr-1">
                    <div>
                        <label className="block text-xs font-bold text-[#2A3547] mb-1.5 uppercase tracking-wider">Nama Layanan Add-On</label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={event => setFormData(prev => ({ ...prev, name: event.target.value }))}
                            placeholder="Contoh: Drone Pilot, Extra Jam, Live Streaming..."
                            className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAEFF4] bg-[#F4F6F9] focus:bg-white focus:border-brand-accent text-sm text-[#2A3547] outline-none transition-all placeholder:text-[#5A6A85]/50"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-[#2A3547] mb-1.5 uppercase tracking-wider">Harga (IDR)</label>
                        <RupiahInput
                            value={formData.price}
                            onChange={raw => setFormData(prev => ({ ...prev, price: raw }))}
                            placeholder="Contoh: 1.500.000"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAEFF4] bg-[#F4F6F9] focus:bg-white focus:border-brand-accent text-sm text-[#2A3547] outline-none transition-all placeholder:text-[#5A6A85]/50 font-semibold"
                        />
                    </div>
                    <div>
                                    <label className="block text-xs font-bold text-[#2A3547] mb-1.5 uppercase tracking-wider">Grup Paket Kustom (Daerah / Pribadi, Opsional)</label>
                        <input
                            type="text"
                            list="catalog-addon-regions"
                            value={formData.region}
                            onChange={event => setFormData(prev => ({ ...prev, region: event.target.value }))}
                                    placeholder="Kosongkan jika berlaku untuk semua grup paket"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAEFF4] bg-[#F4F6F9] focus:bg-white focus:border-brand-accent text-sm text-[#2A3547] outline-none transition-all placeholder:text-[#5A6A85]/50"
                        />
                        <datalist id="catalog-addon-regions">
                            {unionRegions.map(region => <option key={region.value} value={region.value}>{region.label}</option>)}
                        </datalist>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                            {unionRegions.map(region => (
                                <button
                                    key={region.value}
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, region: region.value }))}
                                    className={`px-2 py-0.5 rounded-lg text-[11px] font-medium border transition-colors ${formData.region.toLowerCase() === region.value.toLowerCase() ? 'bg-brand-accent text-white border-brand-accent' : 'bg-white border-[#EAEFF4] text-[#5A6A85] hover:border-brand-accent/50'}`}
                                >
                                    {region.label}
                                </button>
                            ))}
                            {formData.region && (
                                <button type="button" onClick={() => setFormData(prev => ({ ...prev, region: '' }))} className="px-2 py-0.5 rounded-lg text-[11px] font-medium border bg-red-600/10 border-red-600/20 text-red-600">
                                    Hapus Grup
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="flex gap-2.5 pt-3">
                        <button type="button" onClick={onClose} className="flex-1 py-2.5 px-4 rounded-xl border border-[#EAEFF4] bg-white hover:bg-[#F4F6F9] text-[#5A6A85] font-semibold text-xs transition-colors">Batal</button>
                        <button type="submit" disabled={isSaving} className="flex-1 py-2.5 px-4 rounded-xl bg-brand-accent hover:bg-brand-accent-hover text-white font-semibold text-xs transition-all shadow-brand-accent/25 disabled:opacity-50">
                            {isSaving ? 'Menyimpan...' : addOn ? 'Simpan Perubahan' : 'Tambahkan'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

interface AttireEditorModalProps {
    isOpen: boolean;
    attire: Attire | null;
    regionFilter: string;
    unionRegions: { value: string; label: string }[];
    onClose: () => void;
    onSave: (data: { id?: string; name: string; price: number; region?: string }) => Promise<void>;
}

const AttireEditorModal: React.FC<AttireEditorModalProps> = ({ isOpen, attire, regionFilter, unionRegions, onClose, onSave }) => {
    const [formData, setFormData] = useState({ name: '', price: '', region: '' });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (!isOpen) return;
        setFormData(attire
            ? { name: attire.name, price: attire.price.toString(), region: attire.region || '' }
            : { name: '', price: '', region: regionFilter || '' });
    }, [isOpen, attire, regionFilter]);

    if (!isOpen) return null;

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!formData.name.trim() || !formData.price) {
            alert('Nama Attire dan Harga wajib diisi.');
            return;
        }

        setIsSaving(true);
        try {
            await onSave({
                id: attire?.id,
                name: formData.name.trim(),
                price: Number(formData.price),
                region: formData.region.trim() ? formData.region.trim().toLowerCase() : undefined,
            });
            onClose();
        } catch (error) {
            console.error('Error saving attire:', error);
            alert('Gagal menyimpan Attire. Silakan coba lagi.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm animate-fade-in overflow-y-auto">
            <div className="bg-white rounded-2xl border border-[#EAEFF4] shadow-2xl max-w-md w-full p-5 sm:p-6 space-y-4 sm:space-y-5 animate-scale-up my-auto max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between pb-3 border-b border-[#EAEFF4]">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-brand-accent flex items-center justify-center text-white">
                            <Sparkles className="w-4 h-4" />
                        </div>
                        <h3 className="font-bold text-sm sm:text-base text-[#2A3547]">
                            {attire ? 'Edit Attire / Busana' : 'Tambah Attire Baru'}
                        </h3>
                    </div>
                    <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-[#5A6A85] hover:text-[#2A3547] hover:bg-[#F4F6F9]">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3.5 sm:space-y-4 overflow-y-auto flex-1 pr-1">
                    <div>
                        <label className="block text-xs font-bold text-[#2A3547] mb-1.5 uppercase tracking-wider">Nama Attire / Busana</label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={event => setFormData(prev => ({ ...prev, name: event.target.value }))}
                            placeholder="Contoh: Adat Jawa Hijab, Beskap Premium..."
                            className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAEFF4] bg-[#F4F6F9] focus:bg-white focus:border-brand-accent text-sm text-[#2A3547] outline-none transition-all placeholder:text-[#5A6A85]/50"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-[#2A3547] mb-1.5 uppercase tracking-wider">Harga (IDR)</label>
                        <RupiahInput
                            value={formData.price}
                            onChange={raw => setFormData(prev => ({ ...prev, price: raw }))}
                            placeholder="Contoh: 1.000.000"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAEFF4] bg-[#F4F6F9] focus:bg-white focus:border-brand-accent text-sm text-[#2A3547] outline-none transition-all placeholder:text-[#5A6A85]/50 font-semibold"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-[#2A3547] mb-1.5 uppercase tracking-wider">Grup Paket Kustom (Daerah / Pribadi, Opsional)</label>
                        <input
                            type="text"
                            list="catalog-attire-regions"
                            value={formData.region}
                            onChange={event => setFormData(prev => ({ ...prev, region: event.target.value }))}
                            placeholder="Kosongkan jika berlaku untuk semua grup paket"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAEFF4] bg-[#F4F6F9] focus:bg-white focus:border-brand-accent text-sm text-[#2A3547] outline-none transition-all placeholder:text-[#5A6A85]/50"
                        />
                        <datalist id="catalog-attire-regions">
                            {unionRegions.map(region => <option key={region.value} value={region.value}>{region.label}</option>)}
                        </datalist>
                    </div>
                    <div className="flex gap-2.5 pt-3">
                        <button type="button" onClick={onClose} className="flex-1 py-2.5 px-4 rounded-xl border border-[#EAEFF4] bg-white hover:bg-[#F4F6F9] text-[#5A6A85] font-semibold text-xs transition-colors">Batal</button>
                        <button type="submit" disabled={isSaving} className="flex-1 py-2.5 px-4 rounded-xl bg-brand-accent hover:bg-brand-accent-hover text-white font-semibold text-xs transition-all shadow-brand-accent/25 disabled:opacity-50">
                            {isSaving ? 'Menyimpan...' : attire ? 'Simpan Perubahan' : 'Tambahkan'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

interface CatalogItemCardProps {
    addOn: AddOn;
    onEdit: (addOn: AddOn) => void;
    onDuplicate: (addOn: AddOn) => void;
    onDelete: (id: string) => void;
    onMoveUp?: () => void;
    onMoveDown?: () => void;
    canMoveUp?: boolean;
    canMoveDown?: boolean;
    orderIndex?: number;
}

const CatalogItemCard: React.FC<CatalogItemCardProps> = ({
    addOn,
    onEdit,
    onDuplicate,
    onDelete,
    onMoveUp,
    onMoveDown,
    canMoveUp,
    canMoveDown,
    orderIndex
}) => (
    <article className="h-full min-h-[150px] bg-white rounded-xl sm:rounded-2xl border border-[#EAEFF4] shadow-[0_4px_16px_rgba(0,0,0,0.03)] hover:border-brand-accent/30 p-3.5 sm:p-4 flex flex-col justify-between gap-3 transition-all">
        <div>
            <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-1.5">
                    <span className="w-8 h-8 rounded-xl solid-cyan text-white flex items-center justify-center flex-shrink-0"><Sparkles className="w-4 h-4" /></span>
                    {(onMoveUp || onMoveDown) && (
                        <div className="inline-flex items-center gap-0.5 bg-[#F4F6F9] px-1 py-0.5 rounded-lg border border-[#EAEFF4]">
                            {orderIndex !== undefined && (
                                <span className="text-[9px] font-bold text-[#5A6A85] px-1">#{orderIndex + 1}</span>
                            )}
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); onMoveUp?.(); }}
                                disabled={!canMoveUp}
                                className="w-5 h-5 rounded-md bg-white hover:bg-cyan-600 text-[#5A6A85] hover:text-white flex items-center justify-center disabled:opacity-25 disabled:cursor-not-allowed transition-colors shadow-2xs"
                                title="Pindah ke Atas"
                                aria-label="Pindah ke Atas"
                            >
                                <ChevronUp className="w-3 h-3" />
                            </button>
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); onMoveDown?.(); }}
                                disabled={!canMoveDown}
                                className="w-5 h-5 rounded-md bg-white hover:bg-cyan-600 text-[#5A6A85] hover:text-white flex items-center justify-center disabled:opacity-25 disabled:cursor-not-allowed transition-colors shadow-2xs"
                                title="Pindah ke Bawah"
                                aria-label="Pindah ke Bawah"
                            >
                                <ChevronDown className="w-3 h-3" />
                            </button>
                        </div>
                    )}
                </div>
                <span className="text-[10px] font-medium text-[#5A6A85] bg-[#F4F6F9] px-2 py-0.5 rounded-md">{addOn.region || 'Semua Grup'}</span>
            </div>
            <p className="mb-1 text-[9px] font-bold uppercase tracking-wider text-cyan-600">Add-On</p>
            <h3 className="font-extrabold text-base sm:text-sm text-[#2A3547] leading-snug">{addOn.name}</h3>
        </div>
        <div className="pt-2 border-t border-[#EAEFF4] flex items-center justify-between gap-2">
            <p className="font-black text-base sm:text-sm text-brand-accent truncate">{formatCurrency(addOn.price)}</p>
            <div className="flex items-center gap-1 flex-shrink-0">
                <button type="button" onClick={() => onEdit(addOn)} className="w-8 h-8 rounded-lg text-[#5A6A85] hover:text-brand-accent hover:bg-brand-accent/10 flex items-center justify-center" title="Edit Add-On"><Pencil className="w-3.5 h-3.5" /></button>
                <button type="button" onClick={() => onDuplicate(addOn)} className="w-8 h-8 rounded-lg text-[#5A6A85] hover:text-brand-accent hover:bg-brand-accent/10 flex items-center justify-center" title="Duplikat Add-On"><Copy className="w-3.5 h-3.5" /></button>
                <button type="button" onClick={() => onDelete(addOn.id)} className="w-8 h-8 rounded-lg text-[#5A6A85] hover:text-red-600 hover:bg-red-600/10 flex items-center justify-center" title="Hapus Add-On"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
        </div>
    </article>
);

interface AttireItemCardProps {
    attire: Attire;
    onEdit: (attire: Attire) => void;
    onDuplicate: (attire: Attire) => void;
    onDelete: (id: string) => void;
    onMoveUp?: () => void;
    onMoveDown?: () => void;
    canMoveUp?: boolean;
    canMoveDown?: boolean;
    orderIndex?: number;
}

const AttireItemCard: React.FC<AttireItemCardProps> = ({
    attire,
    onEdit,
    onDuplicate,
    onDelete,
    onMoveUp,
    onMoveDown,
    canMoveUp,
    canMoveDown,
    orderIndex
}) => (
    <article className="h-full min-h-[150px] bg-white rounded-xl sm:rounded-2xl border border-[#EAEFF4] shadow-[0_4px_16px_rgba(0,0,0,0.03)] hover:border-brand-accent/30 p-3.5 sm:p-4 flex flex-col justify-between gap-3 transition-all">
        <div>
            <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-1.5">
                    <span className="w-8 h-8 rounded-xl solid-pink text-white flex items-center justify-center flex-shrink-0"><Sparkles className="w-4 h-4" /></span>
                    {(onMoveUp || onMoveDown) && (
                        <div className="inline-flex items-center gap-0.5 bg-[#F4F6F9] px-1 py-0.5 rounded-lg border border-[#EAEFF4]">
                            {orderIndex !== undefined && (
                                <span className="text-[9px] font-bold text-[#5A6A85] px-1">#{orderIndex + 1}</span>
                            )}
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); onMoveUp?.(); }}
                                disabled={!canMoveUp}
                                className="w-5 h-5 rounded-md bg-white hover:bg-pink-500 text-[#5A6A85] hover:text-white flex items-center justify-center disabled:opacity-25 disabled:cursor-not-allowed transition-colors shadow-2xs"
                                title="Pindah ke Atas"
                                aria-label="Pindah ke Atas"
                            >
                                <ChevronUp className="w-3 h-3" />
                            </button>
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); onMoveDown?.(); }}
                                disabled={!canMoveDown}
                                className="w-5 h-5 rounded-md bg-white hover:bg-pink-500 text-[#5A6A85] hover:text-white flex items-center justify-center disabled:opacity-25 disabled:cursor-not-allowed transition-colors shadow-2xs"
                                title="Pindah ke Bawah"
                                aria-label="Pindah ke Bawah"
                            >
                                <ChevronDown className="w-3 h-3" />
                            </button>
                        </div>
                    )}
                </div>
                <span className="text-[10px] font-medium text-[#5A6A85] bg-[#F4F6F9] px-2 py-0.5 rounded-md">{attire.region || 'Semua Grup'}</span>
            </div>
            <p className="mb-1 text-[9px] font-bold uppercase tracking-wider text-pink-600">Attire / Busana</p>
            <h3 className="font-extrabold text-base sm:text-sm text-[#2A3547] leading-snug">{attire.name}</h3>
        </div>
        <div className="pt-2 border-t border-[#EAEFF4] flex items-center justify-between gap-2">
            <p className="font-black text-base sm:text-sm text-brand-accent truncate">{formatCurrency(attire.price)}</p>
            <div className="flex items-center gap-1 flex-shrink-0">
                <button type="button" onClick={() => onEdit(attire)} className="w-8 h-8 rounded-lg text-[#5A6A85] hover:text-brand-accent hover:bg-brand-accent/10 flex items-center justify-center" title="Edit Attire"><Pencil className="w-3.5 h-3.5" /></button>
                <button type="button" onClick={() => onDuplicate(attire)} className="w-8 h-8 rounded-lg text-[#5A6A85] hover:text-brand-accent hover:bg-brand-accent/10 flex items-center justify-center" title="Duplikat Attire"><Copy className="w-3.5 h-3.5" /></button>
                <button type="button" onClick={() => onDelete(attire.id)} className="w-8 h-8 rounded-lg text-[#5A6A85] hover:text-red-600 hover:bg-red-600/10 flex items-center justify-center" title="Hapus Attire"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
        </div>
    </article>
);

export const Packages: React.FC<PackagesProps> = ({
    packages,
    setPackages,
    addOns,
    setAddOns,
    attire,
    setAttire,
    projects,
    profile,
    setProfile,
    showNotification,
    initialAction,
    setInitialAction,
}) => {
    const uiTextOverrides = useUiTextOverrides();
    const text = (key: string, fallback: string) => customizeUiText(`packages.catalog.${key}`, fallback, uiTextOverrides);
    // ── Main UI States ──
    const [viewMode, setViewMode] = useState<'cards' | 'table'>('table');
    const [activeTab, setActiveTab] = useState<'package' | 'addon' | 'attire'>('package');
    const [searchTerm, setSearchTerm] = useState('');
    const [regionFilter, setRegionFilter] = useState<string>('');
    const [draggedCatalogId, setDraggedCatalogId] = useState<string | null>(null);
    const [dropTargetCatalogId, setDropTargetCatalogId] = useState<string | null>(null);
    const [regionToRename, setRegionToRename] = useState<{ value: string; label: string } | null>(null);
    const [regionNameDraft, setRegionNameDraft] = useState('');
    const [isRenamingRegion, setIsRenamingRegion] = useState(false);
    const [categoryFilter, setCategoryFilter] = useState<string>('');
    const [packageOrder, setPackageOrder] = useState<string[]>(() => profile.publicPageConfig?.packageOrder || []);
    const [addOnOrder, setAddOnOrder] = useState<string[]>(() => profile.publicPageConfig?.addOnOrder || []);
    const [attireOrder, setAttireOrder] = useState<string[]>(() => profile.publicPageConfig?.attireOrder || []);
    const packageOrderRef = React.useRef(packageOrder);
    const addOnOrderRef = React.useRef(addOnOrder);
    const attireOrderRef = React.useRef(attireOrder);
    const packageOrderDirty = React.useRef(false);
    const addOnOrderDirty = React.useRef(false);
    const attireOrderDirty = React.useRef(false);
    const profileRef = React.useRef(profile);
    profileRef.current = profile;
    const catalogOrderSaveState = React.useRef({ isSaving: false, pending: false });

    const persistCatalogOrder = () => {
        catalogOrderSaveState.current.pending = true;
        if (catalogOrderSaveState.current.isSaving) return;

        catalogOrderSaveState.current.isSaving = true;
        void (async () => {
            let didSave = false;
            try {
                while (catalogOrderSaveState.current.pending) {
                    catalogOrderSaveState.current.pending = false;
                    const packageOrderToSave = [...packageOrderRef.current];
                    const addOnOrderToSave = [...addOnOrderRef.current];
                    const attireOrderToSave = [...attireOrderRef.current];
                    const currentProfile = profileRef.current;

                    await upsertProfile({
                        id: currentProfile.id,
                        publicPageConfig: {
                            ...currentProfile.publicPageConfig,
                            packageOrder: packageOrderToSave,
                            addOnOrder: addOnOrderToSave,
                            attireOrder: attireOrderToSave,
                        },
                    });
                    didSave = true;

                    if (
                        packageOrderToSave.join('\0') !== packageOrderRef.current.join('\0') ||
                        addOnOrderToSave.join('\0') !== addOnOrderRef.current.join('\0') ||
                        attireOrderToSave.join('\0') !== attireOrderRef.current.join('\0')
                    ) {
                        catalogOrderSaveState.current.pending = true;
                    }
                }
                if (didSave) showNotification('Urutan katalog berhasil diperbarui.');
            } catch (error) {
                console.error('[Packages.order] Failed to save catalog order:', error);
                catalogOrderSaveState.current.pending = false;
                showNotification('Gagal menyimpan urutan. Posisi tetap tampil, tetapi belum tersimpan ke server.');
            } finally {
                catalogOrderSaveState.current.isSaving = false;
            }
        })();
    };

    // ── Modal States ──
    const [packageEditMode, setPackageEditMode] = useState<string | null>(null);
    const [packageFormData, setPackageFormData] = useState<any>(emptyPackageForm);
    const [isSavingPackage, setIsSavingPackage] = useState(false);
    const isSavingPackageRef = React.useRef(false);
    const [copySourcePkg, setCopySourcePkg] = useState<Package | null>(null);
    const [copySourceAddOn, setCopySourceAddOn] = useState<AddOn | null>(null);
    const [copySourceAttire, setCopySourceAttire] = useState<Attire | null>(null);
    const [groupToCopy, setGroupToCopy] = useState<{ value: string; label: string } | null>(null);
    const [isAddOnFormOpen, setIsAddOnFormOpen] = useState(false);
    const [editingAddOn, setEditingAddOn] = useState<AddOn | null>(null);
    const [isAttireFormOpen, setIsAttireFormOpen] = useState(false);
    const [editingAttire, setEditingAttire] = useState<Attire | null>(null);
    const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
    const [isPricelistModalOpen, setIsPricelistModalOpen] = useState(false);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);

    // ── Attire CRUD Handlers ──
    // ... (rest of handlers)
    const handleSaveAttire = async (attireData: { id?: string; name: string; price: number; region?: string }) => {
        if (attireData.id) {
            const updated = await updateAttire(attireData.id, {
                name: attireData.name,
                price: attireData.price,
                region: attireData.region,
            });
            setAttire(prev => prev.map(a => a.id === attireData.id ? updated : a));
            showNotification('Attire berhasil diperbarui.');
        } else {
            const created = await createAttire({
                name: attireData.name,
                price: attireData.price,
                region: attireData.region,
            } as any);
            setAttire(prev => [...prev, created]);
            appendToOrder('attire', created.id);
            showNotification('Attire baru berhasil ditambahkan.');
        }
    };

    const handleDeleteAttire = async (attireId: string) => {
        const isAttireInUse = projects.some(p => p.attire && p.attire.some(a => a.id === attireId));
        if (isAttireInUse) {
            alert('Attire ini tidak dapat dihapus karena sedang dipilih pada salah satu Acara Pernikahan.');
            return;
        }

        if (!window.confirm('Hapus layanan attire ini?')) return;

        try {
            await deleteAttire(attireId);
            setAttire(prev => prev.filter(a => a.id !== attireId));
            removeFromOrder('attire', attireId);
            showNotification('Attire berhasil dihapus.');
        } catch (err) {
            console.error(err);
            alert('Gagal menghapus attire di database.');
        }
    };

    const handleOpenCreateAttire = () => {
        setEditingAttire(null);
        setIsAttireFormOpen(true);
    };

    const handleOpenEditAttire = (attire: Attire) => {
        setEditingAttire(attire);
        setIsAttireFormOpen(true);
    };

    const handleCloseAttireForm = () => {
        setIsAttireFormOpen(false);
        setEditingAttire(null);
    };

    // Initial action handler (e.g. redirected from dashboard with "add" action)
    useEffect(() => {
        if (initialAction?.type === 'add') {
            setPackageEditMode('new');
            setPackageFormData(emptyPackageForm);
            setInitialAction(null);
        }
    }, [initialAction, setInitialAction]);

    // Available Regions calculation
    const existingRegions = useMemo(() => {
        const set = new Set<string>();
        for (const p of packages) {
            if (p.region && String(p.region).trim() !== '') set.add(String(p.region));
        }
        for (const addOn of addOns) {
            if (addOn.region && String(addOn.region).trim() !== '') set.add(String(addOn.region));
        }
        for (const att of attire) {
            if (att.region && String(att.region).trim() !== '') set.add(String(att.region));
        }
        return Array.from(set).sort((a, b) => a.localeCompare(b));
    }, [packages, addOns, attire]);

    const unionRegions = useMemo(() => {
        const hiddenValues = new Set((profile.publicPageConfig?.hiddenPackageRegions || []).map(value => value.toLowerCase()));
        const baseRegions = REGIONS.filter(region => !hiddenValues.has(region.value.toLowerCase()));
        const baseValues = baseRegions.map(region => region.value.toLowerCase());
        const extra = existingRegions.filter(er => !baseValues.includes(er.toLowerCase()) && !hiddenValues.has(er.toLowerCase()));
        return [
            ...baseRegions.map(r => ({ value: r.value, label: r.label })),
            ...extra.map(er => ({ value: er, label: titleCase(er) })),
        ];
    }, [existingRegions, profile.publicPageConfig?.hiddenPackageRegions]);

    // Categories list
    const availableCategories = useMemo(() => {
        const cats = new Set<string>(profile.packageCategories || []);
        packages.forEach(p => {
            if (p.category) cats.add(p.category);
        });
        return Array.from(cats).filter(Boolean).sort();
    }, [packages, profile.packageCategories]);

    useEffect(() => {
        const savedPackageOrder = profile.publicPageConfig?.packageOrder || [];
        if (savedPackageOrder.join('\0') === packageOrderRef.current.join('\0')) {
            return;
        }
        if (packageOrderDirty.current || catalogOrderSaveState.current.isSaving || catalogOrderSaveState.current.pending) return;
        packageOrderRef.current = savedPackageOrder;
        setPackageOrder(savedPackageOrder);
    }, [profile.publicPageConfig?.packageOrder]);

    useEffect(() => {
        const savedAddOnOrder = profile.publicPageConfig?.addOnOrder || [];
        if (savedAddOnOrder.join('\0') === addOnOrderRef.current.join('\0')) {
            return;
        }
        if (addOnOrderDirty.current || catalogOrderSaveState.current.isSaving || catalogOrderSaveState.current.pending) return;
        addOnOrderRef.current = savedAddOnOrder;
        setAddOnOrder(savedAddOnOrder);
    }, [profile.publicPageConfig?.addOnOrder]);

    useEffect(() => {
        const savedAttireOrder = profile.publicPageConfig?.attireOrder || [];
        if (savedAttireOrder.join('\0') === attireOrderRef.current.join('\0')) {
            return;
        }
        if (attireOrderDirty.current || catalogOrderSaveState.current.isSaving || catalogOrderSaveState.current.pending) return;
        attireOrderRef.current = savedAttireOrder;
        setAttireOrder(savedAttireOrder);
    }, [profile.publicPageConfig?.attireOrder]);

    const appendToOrder = (kind: 'package' | 'addOn' | 'attire', id: string) => {
        const orderRef = kind === 'package' ? packageOrderRef : kind === 'addOn' ? addOnOrderRef : attireOrderRef;
        const items = kind === 'package' ? packages : kind === 'addOn' ? addOns : attire;
        const nextOrder = [...orderRef.current];
        items.forEach(item => {
            if (!nextOrder.includes(item.id)) nextOrder.push(item.id);
        });
        if (!nextOrder.includes(id)) nextOrder.push(id);
        orderRef.current = nextOrder;
        if (kind === 'package') {
            packageOrderDirty.current = true;
            setPackageOrder(nextOrder);
        } else if (kind === 'addOn') {
            addOnOrderDirty.current = true;
            setAddOnOrder(nextOrder);
        } else {
            attireOrderDirty.current = true;
            setAttireOrder(nextOrder);
        }
        setProfile(prev => ({
            ...prev,
            publicPageConfig: {
                ...prev.publicPageConfig,
                packageOrder: kind === 'package' ? nextOrder : packageOrderRef.current,
                addOnOrder: kind === 'addOn' ? nextOrder : addOnOrderRef.current,
                attireOrder: kind === 'attire' ? nextOrder : attireOrderRef.current,
            },
        }));
        persistCatalogOrder();
    };

    const removeFromOrder = (kind: 'package' | 'addOn' | 'attire', id: string) => {
        const orderRef = kind === 'package' ? packageOrderRef : kind === 'addOn' ? addOnOrderRef : attireOrderRef;
        const nextOrder = orderRef.current.filter(itemId => itemId !== id);
        orderRef.current = nextOrder;
        if (kind === 'package') {
            packageOrderDirty.current = true;
            setPackageOrder(nextOrder);
        } else if (kind === 'addOn') {
            addOnOrderDirty.current = true;
            setAddOnOrder(nextOrder);
        } else {
            attireOrderDirty.current = true;
            setAttireOrder(nextOrder);
        }
        setProfile(prev => ({
            ...prev,
            publicPageConfig: {
                ...prev.publicPageConfig,
                packageOrder: kind === 'package' ? nextOrder : packageOrderRef.current,
                addOnOrder: kind === 'addOn' ? nextOrder : addOnOrderRef.current,
                attireOrder: kind === 'attire' ? nextOrder : attireOrderRef.current,
            },
        }));
        persistCatalogOrder();
    };

    // Helper: sort items by saved order array
    const sortByOrder = <T extends { id: string; name?: string }>(items: T[], order: string[]): T[] => {
        if (!order || order.length === 0) return items;
        const orderMap = new Map(order.map((id, idx) => [id, idx]));
        return [...items].sort((a, b) => {
            const idxA = orderMap.has(a.id) ? orderMap.get(a.id)! : Infinity;
            const idxB = orderMap.has(b.id) ? orderMap.get(b.id)! : Infinity;
            if (idxA === Infinity && idxB === Infinity) {
                return (a.name || a.id).localeCompare(b.name || b.id);
            }
            return idxA - idxB;
        });
    };

    // Filtered Packages
    const filteredPackages = useMemo(() => {
        const filtered = packages.filter(pkg => {
            const matchesSearch = 
                pkg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (pkg.category && pkg.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (pkg.photographers && pkg.photographers.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (pkg.digitalItems && pkg.digitalItems.some(d => d.toLowerCase().includes(searchTerm.toLowerCase())));

            const matchesRegion = !regionFilter || (pkg.region && pkg.region.toLowerCase() === regionFilter.toLowerCase());
            const matchesCategory = !categoryFilter || pkg.category === categoryFilter;

            return matchesSearch && matchesRegion && matchesCategory;
        });
        return sortByOrder(filtered, packageOrder);
    }, [packages, searchTerm, regionFilter, categoryFilter, packageOrder]);

    const filteredAddOns = useMemo(() => {
        const filtered = addOns.filter(addOn => {
            const matchesSearch = addOn.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesRegion = !regionFilter || (addOn.region && addOn.region.toLowerCase() === regionFilter.toLowerCase());
            return matchesSearch && matchesRegion && !categoryFilter;
        });
        return sortByOrder(filtered, addOnOrder);
    }, [addOns, searchTerm, regionFilter, categoryFilter, addOnOrder]);

    const filteredAttire = useMemo(() => {
        const filtered = attire.filter(att => {
            const matchesSearch = att.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesRegion = !regionFilter || (att.region && att.region.toLowerCase() === regionFilter.toLowerCase());
            return matchesSearch && matchesRegion && !categoryFilter;
        });
        return sortByOrder(filtered, attireOrder);
    }, [attire, searchTerm, regionFilter, categoryFilter, attireOrder]);

    type CatalogEntry = { kind: 'package'; pkg: Package } | { kind: 'addon'; addOn: AddOn } | { kind: 'attire'; attire: Attire };
    // Indeks posisi baris katalog: tabel merender satu findIndex per baris, yang
    // pada katalog besar berubah menjadi O(n^2) setiap kali daftar berubah.
    const packageIndexById = useMemo(
        () => new Map(filteredPackages.map((pkg, index) => [pkg.id, index])),
        [filteredPackages],
    );
    const addOnIndexById = useMemo(
        () => new Map(filteredAddOns.map((addOn, index) => [addOn.id, index])),
        [filteredAddOns],
    );
    const attireIndexById = useMemo(
        () => new Map(filteredAttire.map((item, index) => [item.id, index])),
        [filteredAttire],
    );

    const catalogEntries = useMemo<CatalogEntry[]>(() => {
        if (activeTab === 'package') return filteredPackages.map(pkg => ({ kind: 'package' as const, pkg }));
        if (activeTab === 'addon') return filteredAddOns.map(addOn => ({ kind: 'addon' as const, addOn }));
        if (activeTab === 'attire') return filteredAttire.map(attire => ({ kind: 'attire' as const, attire }));
        return [];
    }, [filteredPackages, filteredAddOns, filteredAttire, activeTab]);

    const packageGroups = useMemo(() => {
        const groups = new Map<string, Package[]>();
        filteredPackages.forEach(pkg => {
            const key = (pkg.region || '').trim().toLowerCase();
            groups.set(key, [...(groups.get(key) || []), pkg]);
        });

        return Array.from(groups.entries())
            .map(([regionKey, items]) => ({
                regionKey,
                label: regionKey
                    ? unionRegions.find(region => region.value.toLowerCase() === regionKey)?.label || titleCase(regionKey)
                    : 'Semua Grup',
                items,
            }))
            .sort((a, b) => {
                if (!a.regionKey) return 1;
                if (!b.regionKey) return -1;
                return a.label.localeCompare(b.label);
            });
    }, [filteredPackages, unionRegions]);

    const addOnGroups = useMemo(() => {
        const groups = new Map<string, AddOn[]>();
        filteredAddOns.forEach(addOn => {
            const key = (addOn.region || '').trim().toLowerCase();
            groups.set(key, [...(groups.get(key) || []), addOn]);
        });

        return Array.from(groups.entries())
            .map(([regionKey, items]) => ({
                regionKey,
                label: regionKey
                    ? unionRegions.find(region => region.value.toLowerCase() === regionKey)?.label || titleCase(regionKey)
                    : 'Semua Grup',
                items,
            }))
            .sort((a, b) => {
                if (!a.regionKey) return 1;
                if (!b.regionKey) return -1;
                return a.label.localeCompare(b.label);
            });
    }, [filteredAddOns, unionRegions]);

    const attireGroups = useMemo(() => {
        const groups = new Map<string, Attire[]>();
        filteredAttire.forEach(att => {
            const key = (att.region || '').trim().toLowerCase();
            groups.set(key, [...(groups.get(key) || []), att]);
        });

        return Array.from(groups.entries())
            .map(([regionKey, items]) => ({
                regionKey,
                label: regionKey
                    ? unionRegions.find(region => region.value.toLowerCase() === regionKey)?.label || titleCase(regionKey)
                    : 'Semua Grup',
                items,
            }))
            .sort((a, b) => {
                if (!a.regionKey) return 1;
                if (!b.regionKey) return -1;
                return a.label.localeCompare(b.label);
            });
    }, [filteredAttire, unionRegions]);

    // Grouping by Category for Cards view
    const packagesByCategory = useMemo(() => {
        const grouped: Record<string, Package[]> = {};
        filteredPackages.forEach(pkg => {
            const cat = pkg.category || 'Tanpa Kategori';
            if (!grouped[cat]) grouped[cat] = [];
            grouped[cat].push(pkg);
        });
        return grouped;
    }, [filteredPackages]);

    // Stat / KPI Calculations
    const stats = useMemo(() => {
        const allPrices = filteredPackages.flatMap(p => 
            p.durationOptions && p.durationOptions.length > 0 
                ? p.durationOptions.map(o => o.price) 
                : [p.price]
        ).filter(price => price > 0);

        const minPrice = allPrices.length > 0 ? Math.min(...allPrices) : 0;
        const maxPrice = allPrices.length > 0 ? Math.max(...allPrices) : 0;

        return {
            totalPackages: filteredPackages.length,
            totalAddOns: addOns.length,
            totalCategories: Object.keys(packagesByCategory).length,
            minPrice,
            maxPrice,
        };
    }, [filteredPackages, addOns, packagesByCategory]);

    // ── Package CRUD Handlers ──
    // Sampul asli saat form dibuka; dipakai untuk mengenali apakah pengguna
    // benar-benar mengganti foto. Tanpa ini, setiap edit mengirim ulang base64
    // sampul (ratusan KB) yang tidak berubah.
    const packageCoverBaseline = useRef<string>('');

    const handleOpenCreatePackage = () => {
        setPackageEditMode('new');
        packageCoverBaseline.current = '';
        setPackageFormData({
            ...emptyPackageForm,
            category: availableCategories[0] || '',
            region: regionFilter || '',
        });
    };

    const handleOpenEditPackage = (pkg: Package) => {
        setPackageEditMode(pkg.id);
        packageCoverBaseline.current = pkg.coverImage || '';
        const defaultDurationPrice = pkg.durationOptions?.find(option => option.default)?.price
            ?? pkg.durationOptions?.[0]?.price;
        setPackageFormData({
            name: pkg.name,
            price: (defaultDurationPrice ?? pkg.price).toString(),
            category: pkg.category,
            region: (pkg.region || '') as any,
            processingTime: '',
            photographers: pkg.photographers && pkg.videographers
                ? `${pkg.photographers} & ${pkg.videographers}`
                : (pkg.photographers || pkg.videographers || ''),
            videographers: '',
            physicalItems: pkg.physicalItems && pkg.physicalItems.length > 0 
                ? pkg.physicalItems.map(item => ({ ...item, price: item.price.toString() })) 
                : [{ name: '', price: '' }],
            digitalItems: pkg.digitalItems && pkg.digitalItems.length > 0 ? pkg.digitalItems : [''],
            coverImage: pkg.coverImage || '',
            durationOptions: pkg.durationOptions && pkg.durationOptions.length > 0
                ? pkg.durationOptions.map(o => ({
                    label: o.label,
                    price: o.price.toString(),
                    default: o.default,
                    photographers: o.photographers || '',
                    digitalItems: o.digitalItems && o.digitalItems.length > 0 ? o.digitalItems : [''],
                    physicalItems: o.physicalItems && o.physicalItems.length > 0 
                        ? o.physicalItems.map((p: PhysicalItem) => ({ ...p, price: p.price })) 
                        : [{ name: '', price: 0 }],
                }))
                : [
                    { label: '4 Jam', price: '', default: true },
                    { label: '8 Jam', price: '', default: false },
                    { label: 'Full Day', price: '', default: false }
                ],
        });
    };

    const handleCoverImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.size > 2 * 1024 * 1024) {
                alert('Ukuran file foto tidak boleh melebihi 2MB.');
                e.target.value = '';
                return;
            }
            if (!file.type.match('image.*')) {
                alert('Hanya format file gambar yang diperbolehkan.');
                e.target.value = '';
                return;
            }
            try {
                const base64 = await toBase64(file);
                setPackageFormData((prev: any) => ({ ...prev, coverImage: base64 }));
            } catch (err) {
                console.error(err);
                alert('Gagal mengunggah gambar. Silakan coba lagi.');
            }
        }
    };

    const handleSubmitPackage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSavingPackageRef.current) return;
        const hasValidDurationOptions = Array.isArray(packageFormData.durationOptions) && 
            packageFormData.durationOptions.some((o: any) => String(o.label || '').trim() !== '' && String(o.price || '') !== '');

        if (!packageFormData.name.trim()) {
            alert('Nama Paket wajib diisi.');
            return;
        }

        if (!hasValidDurationOptions && !packageFormData.price) {
            alert('Silakan isi Harga Paket atau tambahkan Opsi Durasi & Harga.');
            return;
        }

        const durationOptions = hasValidDurationOptions
            ? packageFormData.durationOptions
                .filter((opt: any) => String(opt.label || '').trim() !== '' && Number(opt.price) >= 0)
                .map((opt: any): DurationOption => ({
                    label: String(opt.label).trim(),
                    price: Number(opt.price),
                    default: !!opt.default,
                    photographers: opt.photographers?.trim() || undefined,
                }))
            : undefined;
        const defaultOption = durationOptions
            ? (durationOptions.find(option => option.default) || durationOptions[0])
            : null;
        if (defaultOption) {
            defaultOption.price = Number(packageFormData.price || defaultOption.price || 0);
        }
        const computedBasePrice = defaultOption ? defaultOption.price : Number(packageFormData.price || 0);

        const packageData: Omit<Package, 'id'> = {
            name: packageFormData.name.trim(),
            price: computedBasePrice,
            category: packageFormData.category,
            region: packageFormData.region ? String(packageFormData.region).trim().toLowerCase() : undefined,
            processingTime: '',
            photographers: packageFormData.photographers?.trim() || undefined,
            videographers: '',
            physicalItems: packageFormData.physicalItems
                .filter((item: any) => typeof item.name === 'string' && item.name.trim() !== '')
                .map((item: any) => ({ name: item.name.trim(), price: Number(item.price || 0) })),
            digitalItems: packageFormData.digitalItems.filter((item: string) => typeof item === 'string' && item.trim() !== ''),
            coverImage: packageFormData.coverImage !== packageCoverBaseline.current
                ? (packageFormData.coverImage || undefined)
                : undefined,
            durationOptions,
        };

        isSavingPackageRef.current = true;
        setIsSavingPackage(true);
        try {
            if (packageEditMode !== 'new' && packageEditMode) {
                const updated = await updatePackage(packageEditMode, packageData);
                setPackages(prev => prev.map(p => p.id === packageEditMode ? updated : p));
                showNotification('Paket layanan berhasil diperbarui.');
            } else {
                const created = await createPackage(packageData as any);
                setPackages(prev => [...prev, created]);
                appendToOrder('package', created.id);
                showNotification('Paket layanan baru berhasil ditambahkan.');
            }
            setPackageEditMode(null);
            setPackageFormData(emptyPackageForm);
        } catch (err: any) {
            console.error('[Packages.save] error:', err);
            alert(`Gagal menyimpan paket ke database. ${err?.message || 'Silakan coba lagi.'}`);
        } finally {
            isSavingPackageRef.current = false;
            setIsSavingPackage(false);
        }
    };

    const handleDeletePackage = async (pkgId: string) => {
        const isPackageInUse = projects.some(p => p.packageId === pkgId);
        if (isPackageInUse) {
            alert('Paket ini tidak dapat dihapus karena masih digunakan pada satu atau lebih data Acara Pernikahan.');
            return;
        }

        if (!window.confirm('Apakah Anda yakin ingin menghapus paket layanan ini?')) return;

        try {
            await deletePackage(pkgId);
            setPackages(prev => prev.filter(p => p.id !== pkgId));
            removeFromOrder('package', pkgId);
            showNotification('Paket layanan berhasil dihapus.');
        } catch (err) {
            console.error(err);
            alert('Gagal menghapus paket di database. Silakan coba lagi.');
        }
    };

    const persistHiddenPackageRegion = async (regionValue: string) => {
        const hiddenPackageRegions = Array.from(new Set([
            ...(profile.publicPageConfig?.hiddenPackageRegions || []),
            regionValue.toLowerCase(),
        ]));
        const publicPageConfig = { ...profile.publicPageConfig, hiddenPackageRegions };
        await upsertProfile({ id: profile.id, publicPageConfig });
        setProfile(previous => ({ ...previous, publicPageConfig }));
    };

    const handleRenameCustomRegion = async (region: { value: string; label: string }, nextLabel: string) => {
        const nextRegion = nextLabel.trim().toLowerCase();
        if (!nextRegion) {
            alert('Nama grup paket tidak boleh kosong.');
            return;
        }
        if (unionRegions.some(item => item.value.toLowerCase() === nextRegion && item.value.toLowerCase() !== region.value.toLowerCase())) {
            alert('Grup paket dengan nama tersebut sudah tersedia.');
            return;
        }
        if (nextRegion === region.value.toLowerCase()) {
            setRegionToRename(null);
            return;
        }

        const matchesRegion = (value?: string) => value?.trim().toLowerCase() === region.value.toLowerCase();
        const matchingPackages = packages.filter(item => matchesRegion(item.region));
        const matchingAddOns = addOns.filter(item => matchesRegion(item.region));
        const matchingAttire = attire.filter(item => matchesRegion(item.region));

        setIsRenamingRegion(true);
        try {
            const [packageResults, addOnResults, attireResults] = await Promise.all([
                Promise.allSettled(matchingPackages.map(item => updatePackage(item.id, { region: nextRegion }))),
                Promise.allSettled(matchingAddOns.map(item => updateAddOn(item.id, { region: nextRegion }))),
                Promise.allSettled(matchingAttire.map(item => updateAttire(item.id, { region: nextRegion }))),
            ]);
            const successfulPackageIds = new Set(matchingPackages.filter((_, index) => packageResults[index].status === 'fulfilled').map(item => item.id));
            const successfulAddOnIds = new Set(matchingAddOns.filter((_, index) => addOnResults[index].status === 'fulfilled').map(item => item.id));
            const successfulAttireIds = new Set(matchingAttire.filter((_, index) => attireResults[index].status === 'fulfilled').map(item => item.id));
            setPackages(previous => previous.map(item => successfulPackageIds.has(item.id) ? { ...item, region: nextRegion } : item));
            setAddOns(previous => previous.map(item => successfulAddOnIds.has(item.id) ? { ...item, region: nextRegion } : item));
            setAttire(previous => previous.map(item => successfulAttireIds.has(item.id) ? { ...item, region: nextRegion } : item));
            const hasFailures = [...packageResults, ...addOnResults, ...attireResults].some(result => result.status === 'rejected');
            if (!hasFailures && REGIONS.some(item => item.value.toLowerCase() === region.value.toLowerCase())) {
                await persistHiddenPackageRegion(region.value);
            }
            if (!hasFailures) {
                if (regionFilter.toLowerCase() === region.value.toLowerCase()) setRegionFilter(nextRegion);
                showNotification('Nama grup paket berhasil diperbarui.');
            } else {
                alert('Sebagian item gagal diperbarui. Item yang berhasil sudah dipindahkan; periksa kembali item yang masih menggunakan grup lama.');
            }
            setRegionToRename(null);
        } catch (error) {
            console.error('[Packages.region] Failed to rename custom region:', error);
            alert('Gagal memperbarui nama grup paket. Silakan periksa kembali data katalog.');
        } finally {
            setIsRenamingRegion(false);
        }
    };

    const handleDeleteCustomRegion = async (region: { value: string; label: string }) => {
        const matchesRegion = (value?: string) => value?.trim().toLowerCase() === region.value.toLowerCase();
        const matchingPackages = packages.filter(item => matchesRegion(item.region));
        const matchingAddOns = addOns.filter(item => matchesRegion(item.region));
        const matchingAttire = attire.filter(item => matchesRegion(item.region));
        const itemCount = matchingPackages.length + matchingAddOns.length + matchingAttire.length;

        if (itemCount > 0) {
            alert(`Grup "${region.label}" masih digunakan oleh ${itemCount} item katalog. Pindahkan item tersebut ke grup lain terlebih dahulu agar paketnya tidak hilang dari katalog publik.`);
            return;
        }

        if (!window.confirm(`Hapus grup "${region.label}" dari daftar?`)) return;

        try {
            await persistHiddenPackageRegion(region.value);
            if (regionFilter.toLowerCase() === region.value.toLowerCase()) {
                setRegionFilter(unionRegions.find(item => item.value.toLowerCase() !== region.value.toLowerCase())?.value || '');
            }
            showNotification('Grup kosong berhasil dihapus dari daftar.');
        } catch (error) {
            console.error('[Packages.region] Failed to delete custom region:', error);
            alert('Gagal menghapus grup. Silakan periksa kembali data katalog.');
        }
    };

    const handleDuplicatePackage = async (targetRegion: string) => {
        if (!copySourcePkg) return;
        const { id, ...rest } = copySourcePkg;
        const newPkg: Omit<Package, 'id'> = {
            ...rest,
            name: `${copySourcePkg.name} (${titleCase(targetRegion)})`,
            region: targetRegion as any,
        };
        const created = await createPackage(newPkg as any);
        setPackages(prev => [...prev, created]);
        appendToOrder('package', created.id);
        showNotification(`Paket berhasil diduplikasi ke grup ${titleCase(targetRegion)}.`);
    };

    const handleDuplicateAddOn = async (targetRegion: string) => {
        if (!copySourceAddOn) return;
        const created = await createAddOn({
            name: `${copySourceAddOn.name} (${titleCase(targetRegion)})`,
            price: copySourceAddOn.price,
            region: targetRegion,
        } as any);
        setAddOns(prev => [...prev, created]);
        appendToOrder('addOn', created.id);
        showNotification(`Add-On berhasil diduplikasi ke grup ${titleCase(targetRegion)}.`);
    };

    const handleDuplicateAttire = async (targetRegion: string) => {
        if (!copySourceAttire) return;
        const created = await createAttire({
            name: `${copySourceAttire.name} (${titleCase(targetRegion)})`,
            price: copySourceAttire.price,
            region: targetRegion,
        } as any);
        setAttire(prev => [...prev, created]);
        appendToOrder('attire', created.id);
        showNotification(`Attire berhasil diduplikasi ke grup ${titleCase(targetRegion)}.`);
    };

    const handleDuplicateCatalogGroup = async (source: { value: string; label: string }, targetGroup: string) => {
        const matchesGroup = (value?: string) => value?.trim().toLowerCase() === source.value.toLowerCase();
        const sourcePackages = packages.filter(item => matchesGroup(item.region));
        const sourceAddOns = addOns.filter(item => matchesGroup(item.region));
        const sourceAttire = attire.filter(item => matchesGroup(item.region));

        const [packageResults, addOnResults, attireResults] = await Promise.all([
            Promise.allSettled(sourcePackages.map(item => {
                const { id, ...rest } = item;
                return createPackage({
                    ...rest,
                    name: `${item.name} (${titleCase(targetGroup)})`,
                    region: targetGroup as any,
                } as any);
            })),
            Promise.allSettled(sourceAddOns.map(item => {
                const { id, ...rest } = item;
                return createAddOn({ ...rest, name: `${item.name} (${titleCase(targetGroup)})`, region: targetGroup } as any);
            })),
            Promise.allSettled(sourceAttire.map(item => {
                const { id, ...rest } = item;
                return createAttire({ ...rest, name: `${item.name} (${titleCase(targetGroup)})`, region: targetGroup } as any);
            })),
        ]);

        const createdPackages = packageResults.flatMap(result => result.status === 'fulfilled' ? [result.value] : []);
        const createdAddOns = addOnResults.flatMap(result => result.status === 'fulfilled' ? [result.value] : []);
        const createdAttire = attireResults.flatMap(result => result.status === 'fulfilled' ? [result.value] : []);
        setPackages(previous => [...previous, ...createdPackages]);
        setAddOns(previous => [...previous, ...createdAddOns]);
        setAttire(previous => [...previous, ...createdAttire]);
        createdPackages.forEach(item => appendToOrder('package', item.id));
        createdAddOns.forEach(item => appendToOrder('addOn', item.id));
        createdAttire.forEach(item => appendToOrder('attire', item.id));

        const copiedCount = createdPackages.length + createdAddOns.length + createdAttire.length;
        const failedCount = sourcePackages.length + sourceAddOns.length + sourceAttire.length - copiedCount;
        if (failedCount) {
            showNotification(`${copiedCount} item disalin; ${failedCount} item gagal disalin.`);
            alert(`${failedCount} item gagal disalin. Item lainnya berhasil disalin ke grup ${titleCase(targetGroup)}.`);
        } else {
            showNotification(`${copiedCount} item berhasil disalin ke grup ${titleCase(targetGroup)}.`);
        }
    };

    const handleShareSinglePackage = async (pkg: Package) => {
        const shareUrl = buildPublicShareUrl('booking', undefined, {
            query: {
                ...(pkg.region ? { region: pkg.region } : {}),
                package: getPackageShareIdentifier(pkg, packages),
            },
        });

        if (navigator.share) {
            try {
                await navigator.share({
                    title: `${pkg.name} - ${profile?.companyName || 'Filda Makeup'}`,
                    text: `Lihat paket ${pkg.name} dari ${profile?.companyName || 'Filda Makeup'}`,
                    url: shareUrl,
                });
                showNotification(`Paket "${pkg.name}" berhasil dibagikan!`);
                return;
            } catch (err: any) {
                if (err?.name === 'AbortError') return;
            }
        }

        if (navigator.clipboard?.writeText) {
            try {
                await navigator.clipboard.writeText(shareUrl);
                showNotification(`Tautan paket "${pkg.name}" berhasil disalin ke clipboard!`);
                return;
            } catch {
                // fallback to modal
            }
        }

        setIsShareModalOpen(true);
    };

    // ── Add-On CRUD Handlers ──
    const handleSaveAddOn = async (addOnData: { id?: string; name: string; price: number; region?: string }) => {
        if (addOnData.id) {
            const updated = await updateAddOn(addOnData.id, {
                name: addOnData.name,
                price: addOnData.price,
                region: addOnData.region,
            });
            setAddOns(prev => prev.map(a => a.id === addOnData.id ? updated : a));
            showNotification('Add-on berhasil diperbarui.');
        } else {
            const created = await createAddOn({
                name: addOnData.name,
                price: addOnData.price,
                region: addOnData.region,
            } as any);
            setAddOns(prev => [...prev, created]);
            appendToOrder('addOn', created.id);
            showNotification('Add-on baru berhasil ditambahkan.');
        }
    };

    const handleDeleteAddOn = async (addOnId: string) => {
        const isAddOnInUse = projects.some(p => p.addOns && p.addOns.some(a => a.id === addOnId));
        if (isAddOnInUse) {
            alert('Add-on ini tidak dapat dihapus karena sedang dipilih pada salah satu Acara Pernikahan.');
            return;
        }

        if (!window.confirm('Hapus layanan add-on ini?')) return;

        try {
            await deleteAddOn(addOnId);
            setAddOns(prev => prev.filter(p => p.id !== addOnId));
            removeFromOrder('addOn', addOnId);
            showNotification('Add-on berhasil dihapus.');
        } catch (err) {
            console.error(err);
            alert('Gagal menghapus add-on di database.');
        }
    };

    const handleOpenCreateAddOn = () => {
        setEditingAddOn(null);
        setIsAddOnFormOpen(true);
    };

    const handleOpenEditAddOn = (addOn: AddOn) => {
        setEditingAddOn(addOn);
        setIsAddOnFormOpen(true);
    };

    const handleCloseAddOnForm = () => {
        setIsAddOnFormOpen(false);
        setEditingAddOn(null);
    };

    // ── Reorder Handlers ──
    const handleMovePackage = (pkgId: string, direction: 'up' | 'down', groupItems?: Package[]) => {
        // Build current order: use saved order as base, ensure all current package IDs are present
        const currentIds = packages.map(p => p.id);
        let order = [...packageOrderRef.current];
        // Add any missing IDs at the end
        currentIds.forEach(id => { if (!order.includes(id)) order.push(id); });
        // Remove IDs no longer in packages
        order = order.filter(id => currentIds.includes(id));

        const items = groupItems && groupItems.length > 0 ? groupItems : packages;
        const itemsInOrder = [...items].sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
        const currentItemIdx = itemsInOrder.findIndex(p => p.id === pkgId);
        if (currentItemIdx === -1) return;

        const targetItemIdx = direction === 'up' ? currentItemIdx - 1 : currentItemIdx + 1;
        if (targetItemIdx < 0 || targetItemIdx >= itemsInOrder.length) return;

        const targetPkg = itemsInOrder[targetItemIdx];
        const idxA = order.indexOf(pkgId);
        const idxB = order.indexOf(targetPkg.id);
        if (idxA === -1 || idxB === -1) return;

        [order[idxA], order[idxB]] = [order[idxB], order[idxA]];
        packageOrderRef.current = order;
        packageOrderDirty.current = true;
        setPackageOrder(order);
        setProfile(prev => ({
            ...prev,
            publicPageConfig: {
                ...prev.publicPageConfig,
                packageOrder: order,
                addOnOrder: addOnOrderRef.current,
            },
        }));
        persistCatalogOrder();
    };

    const handleMoveAddOn = (addOnId: string, direction: 'up' | 'down', groupItems?: AddOn[]) => {
        const currentIds = addOns.map(a => a.id);
        let order = [...addOnOrderRef.current];
        currentIds.forEach(id => { if (!order.includes(id)) order.push(id); });
        order = order.filter(id => currentIds.includes(id));

        const items = groupItems && groupItems.length > 0 ? groupItems : addOns;
        const itemsInOrder = [...items].sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
        const currentItemIdx = itemsInOrder.findIndex(a => a.id === addOnId);
        if (currentItemIdx === -1) return;

        const targetItemIdx = direction === 'up' ? currentItemIdx - 1 : currentItemIdx + 1;
        if (targetItemIdx < 0 || targetItemIdx >= itemsInOrder.length) return;

        const targetAddOn = itemsInOrder[targetItemIdx];
        const idxA = order.indexOf(addOnId);
        const idxB = order.indexOf(targetAddOn.id);
        if (idxA === -1 || idxB === -1) return;

        [order[idxA], order[idxB]] = [order[idxB], order[idxA]];
        addOnOrderRef.current = order;
        addOnOrderDirty.current = true;
        setAddOnOrder(order);
        setProfile(prev => ({
            ...prev,
            publicPageConfig: {
                ...prev.publicPageConfig,
                packageOrder: packageOrderRef.current,
                addOnOrder: order,
            },
        }));
        persistCatalogOrder();
    };

    const handleMoveAttire = (attireId: string, direction: 'up' | 'down', groupItems?: Attire[]) => {
        const currentIds = attire.map(a => a.id);
        let order = [...attireOrderRef.current];
        currentIds.forEach(id => { if (!order.includes(id)) order.push(id); });
        order = order.filter(id => currentIds.includes(id));

        const items = groupItems && groupItems.length > 0 ? groupItems : attire;
        const itemsInOrder = [...items].sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
        const currentItemIdx = itemsInOrder.findIndex(a => a.id === attireId);
        if (currentItemIdx === -1) return;

        const targetItemIdx = direction === 'up' ? currentItemIdx - 1 : currentItemIdx + 1;
        if (targetItemIdx < 0 || targetItemIdx >= itemsInOrder.length) return;

        const targetAttire = itemsInOrder[targetItemIdx];
        const idxA = order.indexOf(attireId);
        const idxB = order.indexOf(targetAttire.id);
        if (idxA === -1 || idxB === -1) return;

        [order[idxA], order[idxB]] = [order[idxB], order[idxA]];
        attireOrderRef.current = order;
        attireOrderDirty.current = true;
        setAttireOrder(order);
        setProfile(prev => ({
            ...prev,
            publicPageConfig: {
                ...prev.publicPageConfig,
                packageOrder: packageOrderRef.current,
                addOnOrder: addOnOrderRef.current,
                attireOrder: order,
            },
        }));
        persistCatalogOrder();
    };

    const handleDropReorderPackage = (draggedId: string, targetId: string) => {
        const order = reorderVisibleIds(packageOrderRef.current, packages, filteredPackages, draggedId, targetId);
        if (order.join('\0') === packageOrderRef.current.join('\0')) return;
        packageOrderRef.current = order;
        packageOrderDirty.current = true;
        setPackageOrder(order);
        setProfile(prev => ({
            ...prev,
            publicPageConfig: { ...prev.publicPageConfig, packageOrder: order, addOnOrder: addOnOrderRef.current },
        }));
        persistCatalogOrder();
    };

    const handleDropReorderAddOn = (draggedId: string, targetId: string) => {
        const order = reorderVisibleIds(addOnOrderRef.current, addOns, filteredAddOns, draggedId, targetId);
        if (order.join('\0') === addOnOrderRef.current.join('\0')) return;
        addOnOrderRef.current = order;
        addOnOrderDirty.current = true;
        setAddOnOrder(order);
        setProfile(prev => ({
            ...prev,
            publicPageConfig: { ...prev.publicPageConfig, packageOrder: packageOrderRef.current, addOnOrder: order },
        }));
        persistCatalogOrder();
    };

    const handleDropReorderAttire = (draggedId: string, targetId: string) => {
        const order = reorderVisibleIds(attireOrderRef.current, attire, filteredAttire, draggedId, targetId);
        if (order.join('\0') === attireOrderRef.current.join('\0')) return;
        attireOrderRef.current = order;
        attireOrderDirty.current = true;
        setAttireOrder(order);
        setProfile(prev => ({
            ...prev,
            publicPageConfig: {
                ...prev.publicPageConfig,
                packageOrder: packageOrderRef.current,
                addOnOrder: addOnOrderRef.current,
                attireOrder: order,
            },
        }));
        persistCatalogOrder();
    };

    // ── Package Terms & Conditions Handler (for Public Catalog) ──
    const handleSavePackageTerms = async (updatedTerms: PackageTermItem[]) => {
        try {
            const updated = await upsertProfile({
                id: profile.id,
                publicPageConfig: {
                    ...profile.publicPageConfig,
                    packageTerms: updatedTerms,
                },
            });
            setProfile(updated);
            showNotification('Syarat & ketentuan paket berhasil disimpan.');
        } catch (err) {
            console.error('Error saving package terms:', err);
            throw err;
        }
    };

    // ── Regional Pricelist PDF Handler ──
    const handleSaveRegionPricelists = async (updatedList: RegionPricelistPdf[]) => {
        try {
            const sanitizedList = updatedList.map(item => ({
                ...item,
                // Truncate base64 if it's excessively large (e.g., > 1MB) to prevent DB timeout
                pdfUrl: item.pdfUrl.length > 1024 * 1024 * 1 ? item.pdfUrl.substring(0, 1024 * 1024 * 1) + '...' : item.pdfUrl
            }));

            const updated = await upsertProfile({
                id: profile.id,
                publicPageConfig: {
                    ...profile.publicPageConfig,
                    regionPricelists: sanitizedList,
                    pricelistPdfUrl: sanitizedList.length > 0 ? sanitizedList[0].pdfUrl : undefined,
                },
            });
            setProfile(updated);
        } catch (err) {
            console.error('Error saving region pricelists:', err);
            throw err;
        }
    };


    return (
        <div className="space-y-4 sm:space-y-6 animate-fade-in pb-12">
            {/* ── Page Header ── */}
            <div className="flex flex-col sm:flex-row w-full items-stretch sm:items-center justify-between gap-3 sm:gap-4">
                <div>
                    <h2 className="text-lg sm:text-xl font-bold text-[#2A3547] tracking-tight flex items-center gap-2">
                        <PackageIcon className="w-5 h-5 text-brand-accent flex-shrink-0" />
                        <span>{text('title', 'Katalog Paket Makeup')}</span>
                    </h2>
                    <p className="text-[11px] sm:text-xs text-[#5A6A85] mt-0.5 line-clamp-2 sm:line-clamp-none">
                        {text('subtitle', 'Kelola paket dokumentasi, opsi durasi dinamis, add-on, dan portofolio penawaran harga pengantin')}
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto sm:max-w-full sm:justify-end">
                    <button
                        type="button"
                        onClick={() => setIsShareModalOpen(true)}
                        title="Kelola tautan booking & paket per grup kustom"
                        className="min-h-[44px] shrink-0 whitespace-nowrap px-3 py-2 rounded-xl bg-brand-accent/10 text-brand-accent text-xs font-semibold hover:bg-brand-accent/20 transition-all flex items-center justify-center gap-1.5"
                    >
                        <LinkIcon className="w-3.5 h-3.5" />
                        Tautan Booking Publik
                    </button>
                    <button
                        type="button"
                        onClick={() => setIsTermsModalOpen(true)}
                        className="shrink-0 whitespace-nowrap py-2 px-3 rounded-xl border border-[#EAEFF4] bg-white hover:bg-[#F4F6F9] text-[#5A6A85] font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 min-h-[44px] touch-manipulation cursor-pointer"
                        title="Kelola Syarat & Ketentuan Paket (Katalog Publik)"
                    >
                        <FileText className="w-4 h-4 text-[#5A6A85]" />
                        <span className="hidden xs:inline sm:inline">Syarat & Ketentuan</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setIsPricelistModalOpen(true)}
                        className="shrink-0 whitespace-nowrap py-2 px-3 rounded-xl border border-[#EAEFF4] bg-white hover:bg-[#F4F6F9] text-[#5A6A85] font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 min-h-[44px] touch-manipulation cursor-pointer"
                        title="Kelola Pricelist PDF"
                    >
                        <Upload className="w-4 h-4 text-[#5A6A85]" />
                        <span className="hidden xs:inline sm:inline">Pricelist</span>
                    </button>

                    <button
                        type="button"
                        onClick={handleOpenCreatePackage}
                        className="w-full sm:w-auto sm:flex-initial min-w-0 sm:min-w-[140px] flex-none whitespace-nowrap bg-brand-accent hover:bg-brand-accent-hover text-white font-bold px-3.5 sm:px-4 py-2 rounded-xl shadow-brand-accent/25 inline-flex items-center justify-center gap-1.5 sm:gap-2 text-xs transition-all min-h-[44px] touch-manipulation cursor-pointer"
                    >
                        <Plus className="w-4 h-4 flex-shrink-0" />
                        <span>Tambah Paket</span>
                    </button>
                </div>
            </div>

            {/* ── KPI Stat Highlights ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
                {/* Total Packages */}
                <div className="bg-white p-2.5 sm:p-4 rounded-xl sm:rounded-2xl shadow-[0_4px_16px_rgba(0,0,0,0.03)] border border-[#EAEFF4] flex items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl solid-blue text-white flex items-center justify-center flex-shrink-0">
                        <PackageIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[10px] sm:text-xs font-semibold text-[#5A6A85] truncate">{text('activeCount', 'Paket Aktif')}</p>
                        <p className="text-base sm:text-2xl font-bold text-[#2A3547] mt-0.5 leading-none">
                            {stats.totalPackages}
                        </p>
                    </div>
                </div>

                {/* Total Add-Ons */}
                <div className="bg-white p-2.5 sm:p-4 rounded-xl sm:rounded-2xl shadow-[0_4px_16px_rgba(0,0,0,0.03)] border border-[#EAEFF4] flex items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl solid-green text-white flex items-center justify-center flex-shrink-0">
                        <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[10px] sm:text-xs font-semibold text-[#5A6A85] truncate">{text('addOnsCount', 'Layanan Add-On')}</p>
                        <p className="text-base sm:text-2xl font-bold text-[#2A3547] mt-0.5 leading-none">
                            {stats.totalAddOns}
                        </p>
                    </div>
                </div>

                {/* Active Categories */}
                <div className="bg-white p-2.5 sm:p-4 rounded-xl sm:rounded-2xl shadow-[0_4px_16px_rgba(0,0,0,0.03)] border border-[#EAEFF4] flex items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl solid-orange text-white flex items-center justify-center flex-shrink-0">
                        <Tag className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[10px] sm:text-xs font-semibold text-[#5A6A85] truncate">{text('categoryCount', 'Kategori Layanan')}</p>
                        <p className="text-base sm:text-2xl font-bold text-[#2A3547] mt-0.5 leading-none">
                            {stats.totalCategories}
                        </p>
                    </div>
                </div>

                {/* Price Range */}
                <div className="bg-white p-2.5 sm:p-4 rounded-xl sm:rounded-2xl shadow-[0_4px_16px_rgba(0,0,0,0.03)] border border-[#EAEFF4] flex items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl solid-pink text-white flex items-center justify-center flex-shrink-0">
                        <DollarSign className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-[10px] sm:text-xs font-semibold text-[#5A6A85] truncate">Rentang Harga</p>
                        <p className="text-[10px] sm:text-sm font-bold text-[#2A3547] mt-1 truncate" title={stats.minPrice > 0 ? `${formatCurrency(stats.minPrice)} – ${formatCurrency(stats.maxPrice)}` : '—'}>
                            {stats.minPrice > 0
                                ? `${new Intl.NumberFormat('id-ID', { notation: 'compact', style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(stats.minPrice)} – ${new Intl.NumberFormat('id-ID', { notation: 'compact', style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(stats.maxPrice)}`
                                : '—'}
                        </p>
                    </div>
                </div>
            </div>

            {/* ── Unified Package & Add-On Catalog ── */}
            <section className="bg-white p-3 sm:p-4 rounded-2xl shadow-[0_4px_16px_rgba(0,0,0,0.03)] border border-[#EAEFF4] space-y-3">
                <div className="flex flex-col xl:flex-row xl:items-center gap-2.5">
                    <div className="relative min-w-0 flex-1">
                        <Search className="w-4 h-4 text-[#5A6A85] absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                            type="search"
                            value={searchTerm}
                            onChange={event => setSearchTerm(event.target.value)}
                            placeholder={text('search', `Cari ${activeTab === 'package' ? 'paket' : activeTab === 'addon' ? 'Add-On' : 'Attire'}...`)}
                            className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-[#EAEFF4] bg-[#F4F6F9] focus:bg-white focus:border-brand-accent text-xs sm:text-sm text-[#2A3547] placeholder-[#5A6A85] outline-none transition-all"
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <select
                            value={categoryFilter}
                            onChange={event => setCategoryFilter(event.target.value)}
                            className="min-w-0 flex-1 sm:flex-none sm:min-w-[180px] py-2.5 px-3 rounded-xl border border-[#EAEFF4] bg-[#F4F6F9] focus:bg-white focus:border-brand-accent text-xs font-semibold text-[#2A3547] outline-none cursor-pointer"
                            aria-label="Filter kategori paket"
                        >
                            <option value="">Semua Kategori Paket</option>
                            {availableCategories.map(category => <option key={category} value={category}>{category}</option>)}
                        </select>

                        <div className="flex items-center gap-1 bg-[#F4F6F9] p-1 rounded-xl border border-[#EAEFF4]">
                            <button type="button" onClick={() => setViewMode('cards')} className={`min-h-9 px-2.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 ${viewMode === 'cards' ? 'bg-white text-brand-accent shadow-xs' : 'text-[#5A6A85]'}`} title="Tampilan Kartu">
                                <LayoutGrid className="w-4 h-4" /><span>Kartu</span>
                            </button>
                            <button type="button" onClick={() => setViewMode('table')} className={`min-h-9 px-2.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 ${viewMode === 'table' ? 'bg-white text-brand-accent shadow-xs' : 'text-[#5A6A85]'}`} title="Tampilan Tabel">
                                <List className="w-4 h-4" /><span>Tabel</span>
                            </button>
                        </div>

                        <div className="flex w-full sm:w-auto gap-2">
                            {activeTab === 'package' && (
                                <button type="button" onClick={handleOpenCreatePackage} className="min-h-10 flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 rounded-xl bg-brand-accent text-white text-xs font-semibold hover:bg-brand-accent-hover">
                                    <Plus className="w-4 h-4" /><span>Tambah Paket</span>
                                </button>
                            )}
                            {activeTab === 'addon' && (
                                <button type="button" onClick={handleOpenCreateAddOn} className="min-h-10 flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 rounded-xl solid-cyan text-white text-xs font-semibold hover:bg-sky-500">
                                    <Sparkles className="w-4 h-4" /><span>Tambah Add-On</span>
                                </button>
                            )}
                            {activeTab === 'attire' && (
                                <button type="button" onClick={handleOpenCreateAttire} className="min-h-10 flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 rounded-xl solid-pink text-white text-xs font-semibold hover:bg-pink-500">
                                    <Sparkles className="w-4 h-4" /><span>Tambah Attire</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="border-t border-[#EAEFF4] pt-3">
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                        <p className="text-[10px] sm:text-xs font-semibold text-[#5A6A85]">PAKET KUSTOM</p>
                        {regionFilter && <span className="text-[10px] sm:text-xs text-[#5A6A85]">{catalogEntries.length} item</span>}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        {unionRegions.map(region => (
                            <div key={region.value} className="inline-flex max-w-full flex-wrap items-center gap-1.5 rounded-xl border border-[#EAEFF4] bg-[#F8FAFC] p-1.5">
                                <button type="button" onClick={() => setRegionFilter(current => current === region.value ? '' : region.value)} aria-pressed={regionFilter === region.value} className={`px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-semibold border whitespace-nowrap ${regionFilter === region.value ? 'bg-brand-accent text-white border-brand-accent' : 'bg-white border-[#EAEFF4] text-[#5A6A85] hover:bg-[#F4F6F9]'}`}>
                                    {region.label}
                                </button>
                                <button type="button" onClick={() => setGroupToCopy(region)} aria-label={`Salin grup ${region.label}`} aria-haspopup="dialog" aria-expanded={groupToCopy?.value === region.value} title={`Salin semua item grup ${region.label}`} className={`inline-flex h-7 items-center justify-center gap-1 rounded-lg border px-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/40 active:bg-brand-accent active:text-white ${groupToCopy?.value === region.value ? 'border-brand-accent bg-brand-accent text-white' : 'border-brand-accent/20 bg-brand-accent/5 text-brand-accent hover:bg-brand-accent/10'}`}>
                                    <Copy className="w-3.5 h-3.5" />
                                    <span className="text-[10px] font-semibold">Salin grup</span>
                                </button>
                                <button type="button" onClick={() => { setRegionNameDraft(region.label); setRegionToRename(region); }} aria-label={`Ubah nama grup ${region.label}`} title={`Ubah nama grup ${region.label}`} className="inline-flex h-7 items-center justify-center gap-1 rounded-lg px-1.5 text-[#5A6A85] hover:bg-brand-accent/10 hover:text-brand-accent">
                                    <Pencil className="w-3.5 h-3.5" />
                                    <span className="text-[10px] font-semibold">Ubah</span>
                                </button>
                                <button type="button" onClick={() => handleDeleteCustomRegion(region)} aria-label={`Hapus grup ${region.label}`} title={`Hapus grup ${region.label}`} className="inline-flex h-7 items-center justify-center gap-1 rounded-lg px-1.5 text-[#5A6A85] hover:bg-red-600/10 hover:text-red-600">
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span className="text-[10px] font-semibold">Hapus</span>
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Tabs for Catalog */}
                <div className="flex border-b border-[#EAEFF4]">
                    <button
                        onClick={() => setActiveTab('package')}
                        className={`px-4 py-2 text-xs font-semibold border-b-2 ${activeTab === 'package' ? 'border-brand-accent text-brand-accent' : 'border-transparent text-[#5A6A85]'}`}
                    >
                        Paket
                    </button>
                    <button
                        onClick={() => setActiveTab('addon')}
                        className={`px-4 py-2 text-xs font-semibold border-b-2 ${activeTab === 'addon' ? 'border-brand-accent text-brand-accent' : 'border-transparent text-[#5A6A85]'}`}
                    >
                        Add-On
                    </button>
                    <button
                        onClick={() => setActiveTab('attire')}
                        className={`px-4 py-2 text-xs font-semibold border-b-2 ${activeTab === 'attire' ? 'border-brand-accent text-brand-accent' : 'border-transparent text-[#5A6A85]'}`}
                    >
                        Attire / Busana
                    </button>
                </div>
            </section>

            <Modal
                isOpen={Boolean(regionToRename)}
                title="Edit Nama Grup Paket"
                onClose={() => { if (!isRenamingRegion) setRegionToRename(null); }}
                size="md"
            >
                <form
                    className="space-y-4"
                    onSubmit={event => {
                        event.preventDefault();
                        if (regionToRename) void handleRenameCustomRegion(regionToRename, regionNameDraft);
                    }}
                >
                    <div>
                        <label htmlFor="catalog-region-name" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#2A3547]">Nama grup paket</label>
                        <input
                            id="catalog-region-name"
                            autoFocus
                            value={regionNameDraft}
                            onChange={event => setRegionNameDraft(event.target.value)}
                            disabled={isRenamingRegion}
                            className="w-full rounded-xl border border-[#EAEFF4] bg-[#F4F6F9] px-3.5 py-2.5 text-sm text-[#2A3547] outline-none focus:border-brand-accent focus:bg-white disabled:opacity-60"
                        />
                    </div>
                    <div className="flex justify-end gap-2 border-t border-[#EAEFF4] pt-3">
                        <button
                            type="button"
                            onClick={() => setRegionToRename(null)}
                            disabled={isRenamingRegion}
                            className="rounded-xl border border-[#EAEFF4] px-4 py-2.5 text-xs font-semibold text-[#5A6A85] disabled:opacity-50"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={isRenamingRegion || !regionNameDraft.trim()}
                            className="rounded-xl bg-brand-accent px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-50"
                        >
                            {isRenamingRegion ? 'Menyimpan...' : 'Simpan Perubahan'}
                        </button>
                    </div>
                </form>
            </Modal>

            <DuplicateCatalogGroupModal
                group={groupToCopy}
                packageCount={packages.filter(item => item.region?.trim().toLowerCase() === groupToCopy?.value.toLowerCase()).length}
                addOnCount={addOns.filter(item => item.region?.trim().toLowerCase() === groupToCopy?.value.toLowerCase()).length}
                attireCount={attire.filter(item => item.region?.trim().toLowerCase() === groupToCopy?.value.toLowerCase()).length}
                takenGroupValues={[
                    ...unionRegions.map(item => item.value),
                    ...(profile.publicPageConfig?.hiddenPackageRegions || []),
                ]}
                onClose={() => setGroupToCopy(null)}
                onCopy={targetGroup => groupToCopy ? handleDuplicateCatalogGroup(groupToCopy, targetGroup) : Promise.resolve()}
            />

            {catalogEntries.length === 0 ? (
                <div className="py-12 sm:py-16 text-center bg-white rounded-2xl border border-[#EAEFF4] p-6 sm:p-8">
                    <div className="w-12 h-12 rounded-2xl grad-brand text-white flex items-center justify-center mx-auto mb-3"><PackageIcon className="w-6 h-6" /></div>
                    <h3 className="font-bold text-base text-[#2A3547]">Tidak ada item ditemukan</h3>
                    <p className="text-xs text-[#5A6A85] mt-1 max-w-sm mx-auto">Coba ubah pencarian, kategori paket, atau grup yang dipilih.</p>
                    <div className="mt-4 flex flex-wrap justify-center gap-2">
                        <button type="button" onClick={handleOpenCreatePackage} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-accent text-white text-xs font-semibold"><Plus className="w-3.5 h-3.5" />Tambah Paket</button>
                        <button type="button" onClick={handleOpenCreateAddOn} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl solid-cyan text-white text-xs font-semibold"><Sparkles className="w-3.5 h-3.5" />Tambah Add-On</button>
                        <button type="button" onClick={handleOpenCreateAttire} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl solid-pink text-white text-xs font-semibold"><Sparkles className="w-3.5 h-3.5" />Tambah Attire</button>
                    </div>
                </div>
            ) : viewMode === 'cards' ? (
                <div className="space-y-6">
                    {activeTab === 'package' && packageGroups.length > 0 && (
                        <section className="space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EAEFF4] pb-2">
                                <div className="flex items-center gap-2">
                                    <PackageIcon className="w-4 h-4 text-brand-accent" />
                                    <h3 className="font-bold text-sm sm:text-base text-[#2A3547]">Paket</h3>
                                    <span className="rounded-full bg-[#F4F6F9] border border-[#EAEFF4] px-2 py-0.5 text-[10px] font-semibold text-[#5A6A85]">{filteredPackages.length} item</span>
                                </div>
                            </div>
                            <div className="space-y-4">
                                {packageGroups.map(group => (
                                    <div key={group.regionKey || 'unassigned'} className="space-y-3">
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <div className="flex items-center gap-2">
                                                <MapPin className="w-4 h-4 text-brand-accent" />
                                                <h4 className="font-semibold text-xs sm:text-sm text-[#2A3547]">{group.label}</h4>
                                            </div>
                                            <span className="text-[10px] sm:text-xs text-[#5A6A85]">{group.items.length} paket</span>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 items-stretch">
                                            {group.items.map((pkg, idx) => (
                                                <PackageCard
                                                    key={`package-${pkg.id}`}
                                                    pkg={pkg}
                                                    onEdit={handleOpenEditPackage}
                                                    onDuplicate={setCopySourcePkg}
                                                    onShare={handleShareSinglePackage}
                                                    onDelete={handleDeletePackage}
                                                    onMoveUp={() => handleMovePackage(pkg.id, 'up', group.items)}
                                                    onMoveDown={() => handleMovePackage(pkg.id, 'down', group.items)}
                                                    canMoveUp={idx > 0}
                                                    canMoveDown={idx < group.items.length - 1}
                                                    orderIndex={idx}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {activeTab === 'addon' && addOnGroups.length > 0 && (
                        <section className="space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EAEFF4] pb-2">
                                <div className="flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-cyan-600" />
                                    <h3 className="font-bold text-sm sm:text-base text-[#2A3547]">Add-On</h3>
                                    <span className="rounded-full bg-[#F4F6F9] border border-[#EAEFF4] px-2 py-0.5 text-[10px] font-semibold text-[#5A6A85]">{filteredAddOns.length} item</span>
                                </div>
                            </div>
                            <div className="space-y-4">
                                {addOnGroups.map(group => (
                                    <div key={group.regionKey || 'unassigned'} className="space-y-3">
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <div className="flex items-center gap-2">
                                                <MapPin className="w-4 h-4 text-cyan-600" />
                                                <h4 className="font-semibold text-xs sm:text-sm text-[#2A3547]">{group.label}</h4>
                                            </div>
                                            <span className="text-[10px] sm:text-xs text-[#5A6A85]">{group.items.length} add-on</span>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 items-stretch">
                                            {group.items.map((addOn, idx) => (
                                                <CatalogItemCard
                                                    key={`addon-${addOn.id}`}
                                                    addOn={addOn}
                                                    onEdit={handleOpenEditAddOn}
                                                    onDuplicate={setCopySourceAddOn}
                                                    onDelete={handleDeleteAddOn}
                                                    onMoveUp={() => handleMoveAddOn(addOn.id, 'up', group.items)}
                                                    onMoveDown={() => handleMoveAddOn(addOn.id, 'down', group.items)}
                                                    canMoveUp={idx > 0}
                                                    canMoveDown={idx < group.items.length - 1}
                                                    orderIndex={idx}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {activeTab === 'attire' && attireGroups.length > 0 && (
                        <section className="space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EAEFF4] pb-2">
                                <div className="flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-pink-600" />
                                    <h3 className="font-bold text-sm sm:text-base text-[#2A3547]">Attire / Busana</h3>
                                    <span className="rounded-full bg-[#F4F6F9] border border-[#EAEFF4] px-2 py-0.5 text-[10px] font-semibold text-[#5A6A85]">{filteredAttire.length} item</span>
                                </div>
                            </div>
                            <div className="space-y-4">
                                {attireGroups.map(group => (
                                    <div key={group.regionKey || 'unassigned'} className="space-y-3">
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <div className="flex items-center gap-2">
                                                <MapPin className="w-4 h-4 text-pink-600" />
                                                <h4 className="font-semibold text-xs sm:text-sm text-[#2A3547]">{group.label}</h4>
                                            </div>
                                            <span className="text-[10px] sm:text-xs text-[#5A6A85]">{group.items.length} attire</span>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 items-stretch">
                                            {group.items.map((att, idx) => (
                                                <AttireItemCard
                                                    key={`attire-${att.id}`}
                                                    attire={att}
                                                    onEdit={handleOpenEditAttire}
                                                    onDuplicate={setCopySourceAttire}
                                                    onDelete={handleDeleteAttire}
                                                    onMoveUp={() => handleMoveAttire(att.id, 'up', group.items)}
                                                    onMoveDown={() => handleMoveAttire(att.id, 'down', group.items)}
                                                    canMoveUp={idx > 0}
                                                    canMoveDown={idx < group.items.length - 1}
                                                    orderIndex={idx}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            ) : (
                <div className="overflow-x-auto rounded-2xl border border-[#EAEFF4] bg-white shadow-[0_4px_16px_rgba(0,0,0,0.03)]">
                    <table className="w-full min-w-[760px] text-left text-xs">
                        <thead className="bg-[#F4F6F9] text-[10px] uppercase tracking-wider text-[#5A6A85]">
                            <tr>
                                <th className="px-3 py-3 w-28 text-center">Urutan</th>
                                <th className="px-4 py-3">Nama</th>
                                <th className="px-4 py-3">Jenis</th>
                                <th className="px-4 py-3">Kategori</th>
                                <th className="px-4 py-3">Grup Paket Kustom</th>
                                <th className="px-4 py-3 text-right">Harga</th>
                                <th className="px-4 py-3 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#EAEFF4]">
                            {catalogEntries.map(item => {
                                const isPackage = item.kind === 'package';
                                const isAddon = item.kind === 'addon';
                                const name = isPackage ? item.pkg.name : (isAddon ? item.addOn.name : item.attire.name);
                                const region = isPackage ? item.pkg.region : (isAddon ? item.addOn.region : item.attire.region);
                                const price = isPackage ? item.pkg.price : (isAddon ? item.addOn.price : item.attire.price);
                                const itemId = isPackage ? item.pkg.id : (isAddon ? item.addOn.id : item.attire.id);
                                const orderIndex = isPackage
                                    ? packageIndexById.get(itemId) ?? -1
                                    : (isAddon ? addOnIndexById.get(itemId) ?? -1 : attireIndexById.get(itemId) ?? -1);
                                const handleMoveRow = (direction: 'up' | 'down') => {
                                    if (isPackage) handleMovePackage(itemId, direction, filteredPackages);
                                    else if (isAddon) handleMoveAddOn(itemId, direction, filteredAddOns);
                                    else handleMoveAttire(itemId, direction, filteredAttire);
                                };
                                const handleDropRow = (event: React.DragEvent<HTMLTableRowElement>) => {
                                    event.preventDefault();
                                    const draggedId = event.dataTransfer.getData('text/plain') || draggedCatalogId;
                                    if (draggedId && draggedId !== itemId) {
                                        if (isPackage) handleDropReorderPackage(draggedId, itemId);
                                        else if (isAddon) handleDropReorderAddOn(draggedId, itemId);
                                        else handleDropReorderAttire(draggedId, itemId);
                                    }
                                    setDraggedCatalogId(null);
                                    setDropTargetCatalogId(null);
                                };
                                return (
                                    <tr
                                        key={`${item.kind}-${itemId}`}
                                        onDragOver={event => {
                                            event.preventDefault();
                                            event.dataTransfer.dropEffect = 'move';
                                            setDropTargetCatalogId(itemId);
                                        }}
                                        onDragLeave={() => setDropTargetCatalogId(current => current === itemId ? null : current)}
                                        onDrop={handleDropRow}
                                        className={`hover:bg-[#F8FAFC] ${dropTargetCatalogId === itemId ? 'bg-brand-accent/10 ring-1 ring-inset ring-brand-accent/40' : ''} ${draggedCatalogId === itemId ? 'opacity-50' : ''}`}
                                    >
                                        <td className="px-3 py-3 text-center">
                                            <div className="inline-flex items-center gap-1 bg-[#F4F6F9] px-2 py-1 rounded-lg border border-[#EAEFF4]">
                                                <button
                                                    type="button"
                                                    draggable
                                                    onDragStart={event => {
                                                        event.dataTransfer.effectAllowed = 'move';
                                                        event.dataTransfer.setData('text/plain', itemId);
                                                        setDraggedCatalogId(itemId);
                                                    }}
                                                    onDragEnd={() => { setDraggedCatalogId(null); setDropTargetCatalogId(null); }}
                                                    className="cursor-grab touch-manipulation p-1 text-[#5A6A85] hover:text-brand-accent active:cursor-grabbing"
                                                    title="Seret untuk mengurutkan"
                                                    aria-label={`Seret ${name} untuk mengurutkan`}
                                                >
                                                    <GripVertical className="w-3.5 h-3.5" />
                                                </button>
                                                <span className="text-[10px] font-bold text-[#5A6A85] w-5 text-center">#{orderIndex + 1}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleMoveRow('up')}
                                                    disabled={orderIndex <= 0}
                                                    className="p-1 rounded text-[#5A6A85] hover:text-brand-accent disabled:opacity-25 disabled:cursor-not-allowed"
                                                    title="Pindah ke Atas"
                                                    aria-label={`Pindah ${name} ke atas`}
                                                >
                                                    <ChevronUp className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleMoveRow('down')}
                                                    disabled={orderIndex === -1 || orderIndex >= catalogEntries.length - 1}
                                                    className="p-1 rounded text-[#5A6A85] hover:text-brand-accent disabled:opacity-25 disabled:cursor-not-allowed"
                                                    title="Pindah ke Bawah"
                                                    aria-label={`Pindah ${name} ke bawah`}
                                                >
                                                    <ChevronDown className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 font-semibold text-[#2A3547]">{name}</td>
                                        <td className="px-4 py-3 text-[#5A6A85]">{isPackage ? 'Paket' : (isAddon ? 'Add-On' : 'Attire')}</td>
                                        <td className="px-4 py-3 text-[#5A6A85]">{isPackage ? item.pkg.category || 'Umum' : '—'}</td>
                                        <td className="px-4 py-3 text-[#5A6A85]">{region ? unionRegions.find(option => option.value.toLowerCase() === region.toLowerCase())?.label || titleCase(region) : 'Semua Grup'}</td>
                                        <td className="px-4 py-3 text-right font-semibold text-[#2A3547]">{formatCurrency(price)}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex justify-end gap-1">
                                                {isPackage ? (
                                                    <>
                                                        <button type="button" onClick={() => handleOpenEditPackage(item.pkg)} className="p-2 rounded-lg text-[#5A6A85] hover:bg-brand-accent/10 hover:text-brand-accent" title="Edit Paket"><Pencil className="w-4 h-4" /></button>
                                                        <button type="button" onClick={() => setCopySourcePkg(item.pkg)} className="p-2 rounded-lg text-[#5A6A85] hover:bg-brand-accent/10 hover:text-brand-accent" title="Duplikat Paket"><Copy className="w-4 h-4" /></button>
                                                        <button type="button" onClick={() => handleShareSinglePackage(item.pkg)} className="p-2 rounded-lg text-[#5A6A85] hover:bg-brand-accent/10 hover:text-brand-accent" title="Bagikan Paket"><Share2 className="w-4 h-4" /></button>
                                                        <button type="button" onClick={() => handleDeletePackage(item.pkg.id)} className="p-2 rounded-lg text-[#5A6A85] hover:bg-red-600/10 hover:text-red-600" title="Hapus Paket"><Trash2 className="w-4 h-4" /></button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button type="button" onClick={() => isAddon ? handleOpenEditAddOn(item.addOn) : handleOpenEditAttire(item.attire)} className="p-2 rounded-lg text-[#5A6A85] hover:bg-brand-accent/10 hover:text-brand-accent" title={`Edit ${isAddon ? 'Add-On' : 'Attire'}`}><Pencil className="w-4 h-4" /></button>
                                                        <button type="button" onClick={() => isAddon ? setCopySourceAddOn(item.addOn) : setCopySourceAttire(item.attire)} className="p-2 rounded-lg text-[#5A6A85] hover:bg-brand-accent/10 hover:text-brand-accent" title={`Duplikat ${isAddon ? 'Add-On' : 'Attire'}`}><Copy className="w-4 h-4" /></button>
                                                        <button type="button" onClick={() => isAddon ? handleDeleteAddOn(item.addOn.id) : handleDeleteAttire(item.attire.id)} className="p-2 rounded-lg text-[#5A6A85] hover:bg-red-600/10 hover:text-red-600" title={`Hapus ${isAddon ? 'Add-On' : 'Attire'}`}><Trash2 className="w-4 h-4" /></button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ── Add-On & Attire Editors ── */}
            <AddOnEditorModal
                isOpen={isAddOnFormOpen}
                addOn={editingAddOn}
                regionFilter={regionFilter}
                unionRegions={unionRegions}
                onClose={handleCloseAddOnForm}
                onSave={handleSaveAddOn}
            />

            <AttireEditorModal
                isOpen={isAttireFormOpen}
                attire={editingAttire}
                regionFilter={regionFilter}
                unionRegions={unionRegions}
                onClose={handleCloseAttireForm}
                onSave={handleSaveAttire}
            />

            {/* ── Package Edit/Add Modal ── */}
            {packageEditMode && (
                <PackageModal
                    isOpen={true}
                    onClose={() => {
                        setPackageEditMode(null);
                        setPackageFormData(emptyPackageForm);
                    }}
                    formData={packageFormData}
                    setFormData={setPackageFormData}
                    editMode={packageEditMode}
                    packageCategories={availableCategories}
                    unionRegions={unionRegions}
                    isSubmitting={isSavingPackage}
                    onSubmit={handleSubmitPackage}
                    onCoverImageUpload={handleCoverImageUpload}
                />
            )}

            {/* ── Duplicate Modal ── */}
            {copySourcePkg && (
                <DuplicatePackageModal
                    packageToCopy={copySourcePkg}
                    onClose={() => setCopySourcePkg(null)}
                    unionRegions={unionRegions}
                    onDuplicate={handleDuplicatePackage}
                />
            )}

            {copySourceAddOn && (
                <DuplicateAddOnModal
                    addOn={copySourceAddOn}
                    onClose={() => setCopySourceAddOn(null)}
                    regions={unionRegions}
                    onDuplicate={handleDuplicateAddOn}
                />
            )}

            {copySourceAttire && (
                <DuplicateAttireModal
                    attire={copySourceAttire}
                    onClose={() => setCopySourceAttire(null)}
                    regions={unionRegions}
                    onDuplicate={handleDuplicateAttire}
                />
            )}

            {/* ── Share Modal ── */}
            <SharePackageModal
                isOpen={isShareModalOpen}
                onClose={() => setIsShareModalOpen(false)}
                unionRegions={unionRegions}
            />

            {/* ── Package Terms & Conditions Modal (CRUD) ── */}
            <PackageTermsModal
                isOpen={isTermsModalOpen}
                onClose={() => setIsTermsModalOpen(false)}
                profile={profile}
                regions={unionRegions}
                onSaveTerms={handleSavePackageTerms}
                showNotification={showNotification}
            />

            {/* ── Region Pricelist PDF Modal (CRUD) ── */}
            <RegionPricelistModal
                isOpen={isPricelistModalOpen}
                onClose={() => setIsPricelistModalOpen(false)}
                profile={profile}
                onSaveRegionPricelists={handleSaveRegionPricelists}
                showNotification={showNotification}
                availableRegions={unionRegions}
            />
        </div>
    );
};

export default Packages;
