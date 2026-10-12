import React, { useState, useEffect } from 'react';
import { RegionPricelistPdf, Profile, REGIONS } from '../../../types';
import {
    FileText,
    X,
    Plus,
    Pencil,
    Trash2,
    Download,
    Upload,
    MapPin,
    AlertCircle,
    Check,
    RotateCcw
} from 'lucide-react';

interface RegionPricelistModalProps {
    isOpen: boolean;
    onClose: () => void;
    profile: Profile;
    onSaveRegionPricelists: (updated: RegionPricelistPdf[]) => Promise<void>;
    showNotification: (msg: string) => void;
    availableRegions?: { value: string; label: string }[];
}

export const RegionPricelistModal: React.FC<RegionPricelistModalProps> = ({
    isOpen,
    onClose,
    profile,
    onSaveRegionPricelists,
    showNotification,
    availableRegions,
}) => {
    const [pricelists, setPricelists] = useState<RegionPricelistPdf[]>([]);
    const [editingItem, setEditingItem] = useState<RegionPricelistPdf | null>(null);
    const [isCreatingNew, setIsCreatingNew] = useState(false);

    // Form state
    const [formRegion, setFormRegion] = useState('banten');
    const [formCustomRegion, setFormCustomRegion] = useState('');
    const [formTitle, setFormTitle] = useState('');
    const [formFile, setFormFile] = useState<File | null>(null);
    const [formBase64, setFormBase64] = useState<string>('');
    const [isSaving, setIsSaving] = useState(false);

    // Merge default REGIONS with available regions
    const regionOptions = React.useMemo(() => {
        const map = new Map<string, string>();
        REGIONS.forEach(r => map.set(r.value.toLowerCase(), r.label));
        if (availableRegions) {
            availableRegions.forEach(r => map.set(r.value.toLowerCase(), r.label));
        }
        return Array.from(map.entries()).map(([value, label]) => ({ value, label }));
    }, [availableRegions]);

    // Initialize list from profile
    useEffect(() => {
        if (!isOpen) return;

        const existing = profile.publicPageConfig?.regionPricelists;
        if (existing && existing.length > 0) {
            setPricelists(existing);
        } else if (profile.publicPageConfig?.pricelistPdfUrl) {
            // Backward-compatibility: wrap legacy single PDF into a regional pricelist
            setPricelists([
                {
                    id: 'pricelist-legacy',
                    region: 'semua',
                    regionLabel: 'Semua Wilayah',
                    title: 'Pricelist Umum (Semua Wilayah)',
                    pdfUrl: profile.publicPageConfig.pricelistPdfUrl,
                    fileName: 'pricelist.pdf',
                    updatedAt: new Date().toISOString()
                }
            ]);
        } else {
            setPricelists([]);
        }

        setEditingItem(null);
        setIsCreatingNew(false);
        resetForm();
    }, [isOpen, profile]);

    const resetForm = () => {
        setFormRegion('banten');
        setFormCustomRegion('');
        setFormTitle('');
        setFormFile(null);
        setFormBase64('');
    };

    if (!isOpen) return null;

    const handleStartCreate = () => {
        setEditingItem(null);
        setIsCreatingNew(true);
        resetForm();
        setFormTitle('Pricelist Banten');
    };

    const handleStartEdit = (item: RegionPricelistPdf) => {
        setIsCreatingNew(false);
        setEditingItem(item);
        const isPredefined = regionOptions.some(r => r.value === item.region.toLowerCase());
        if (isPredefined) {
            setFormRegion(item.region.toLowerCase());
            setFormCustomRegion('');
        } else {
            setFormRegion('custom');
            setFormCustomRegion(item.region);
        }
        setFormTitle(item.title);
        setFormFile(null);
        setFormBase64(item.pdfUrl);
    };

    const handleCancelForm = () => {
        setIsCreatingNew(false);
        setEditingItem(null);
        resetForm();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 10 * 1024 * 1024) {
            alert('Ukuran file PDF tidak boleh melebihi 10MB.');
            e.target.value = '';
            return;
        }

        setFormFile(file);

        // Convert to Base64
        const reader = new FileReader();
        reader.onloadend = () => {
            const result = reader.result as string;
            setFormBase64(result);
            if (!formTitle && !editingItem) {
                const cleanName = file.name.replace(/\.[^/.]+$/, '');
                setFormTitle(`Pricelist ${cleanName}`);
            }
        };
        reader.readAsDataURL(file);
    };

    const handleRegionChange = (val: string) => {
        setFormRegion(val);
        if (val !== 'custom') {
            const rLabel = regionOptions.find(r => r.value === val)?.label || val;
            if (!editingItem) {
                setFormTitle(`Pricelist ${rLabel}`);
            }
        }
    };

    const handleSaveForm = async (e: React.FormEvent) => {
        e.preventDefault();

        const activeRegionValue = formRegion === 'custom'
            ? formCustomRegion.trim().toLowerCase()
            : formRegion.trim().toLowerCase();

        if (!activeRegionValue) {
            alert('Silakan tentukan wilayah untuk pricelist ini.');
            return;
        }

        if (!formTitle.trim()) {
            alert('Silakan masukkan judul pricelist.');
            return;
        }

        const effectivePdfUrl = formBase64 || editingItem?.pdfUrl;
        if (!effectivePdfUrl) {
            alert('Silakan pilih file PDF yang ingin diupload.');
            return;
        }

        const regionMatch = regionOptions.find(r => r.value === activeRegionValue);
        const resolvedRegionLabel = regionMatch ? regionMatch.label : activeRegionValue.toUpperCase();

        const formatSize = (bytes: number) => {
            if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
            return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
        };

        let updatedList: RegionPricelistPdf[];

        if (editingItem) {
            // Update existing
            updatedList = pricelists.map(item => {
                if (item.id === editingItem.id) {
                    return {
                        ...item,
                        region: activeRegionValue,
                        regionLabel: resolvedRegionLabel,
                        title: formTitle.trim(),
                        pdfUrl: effectivePdfUrl,
                        fileName: formFile ? formFile.name : item.fileName,
                        fileSize: formFile ? formatSize(formFile.size) : item.fileSize,
                        updatedAt: new Date().toISOString()
                    };
                }
                return item;
            });
        } else {
            // Add new
            const newItem: RegionPricelistPdf = {
                id: `pr-${Date.now()}`,
                region: activeRegionValue,
                regionLabel: resolvedRegionLabel,
                title: formTitle.trim(),
                pdfUrl: effectivePdfUrl,
                fileName: formFile?.name || 'pricelist.pdf',
                fileSize: formFile ? formatSize(formFile.size) : 'File PDF',
                updatedAt: new Date().toISOString()
            };
            updatedList = [newItem, ...pricelists];
        }

        setIsSaving(true);
        try {
            await onSaveRegionPricelists(updatedList);
            setPricelists(updatedList);
            showNotification(editingItem ? 'Pricelist berhasil diperbarui.' : 'Pricelist wilayah berhasil ditambahkan.');
            handleCancelForm();
        } catch (err) {
            console.error('Failed to save region pricelist:', err);
            alert('Gagal menyimpan pricelist. Silakan coba lagi.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteItem = async (id: string, title: string) => {
        if (!window.confirm(`Apakah Anda yakin ingin menghapus "${title}"?`)) return;

        const updated = pricelists.filter(p => p.id !== id);
        setIsSaving(true);
        try {
            await onSaveRegionPricelists(updated);
            setPricelists(updated);
            showNotification(`Pricelist "${title}" berhasil dihapus.`);
            if (editingItem?.id === id) {
                handleCancelForm();
            }
        } catch (err) {
            console.error('Failed to delete region pricelist:', err);
            alert('Gagal menghapus pricelist. Silakan coba lagi.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDownload = (item: RegionPricelistPdf) => {
        const link = document.createElement('a');
        link.href = item.pdfUrl;
        link.download = item.fileName || `${item.title.replace(/\s+/g, '_')}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
            <div className="bg-white rounded-2xl border border-[#EAEFF4] shadow-2xl max-w-2xl w-full p-4 sm:p-6 space-y-4 animate-scale-up my-auto max-h-[92vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-[#EAEFF4]">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-[#49BEFF]/15 flex items-center justify-center text-[#49BEFF]">
                            <FileText className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-base sm:text-lg text-[#2A3547]">
                                Kelola Pricelist PDF per Wilayah
                            </h3>
                            <p className="text-xs text-[#5A6A85]">
                                Upload & kelola dokumen PDF pricelist yang disesuaikan per daerah
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-[#5A6A85] hover:text-[#2A3547] hover:bg-[#F4F6F9] transition-colors cursor-pointer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Info Alert */}
                <div className="p-3 bg-sky-50/70 border border-sky-100 rounded-xl flex items-start gap-2.5 text-xs text-sky-800">
                    <AlertCircle className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                    <div>
                        <strong className="font-semibold">Muncul Otomatis Sesuai Wilayah Link:</strong>
                        <p className="mt-0.5 text-sky-700 leading-relaxed">
                            Ketika calon klien membuka tautan publik dengan parameter wilayah (contoh: <code className="bg-sky-100/70 px-1 py-0.5 rounded text-[11px] font-mono">?region=banten</code>), tombol download pada halaman akan langsung mengunduh PDF khusus untuk wilayah tersebut.
                        </p>
                    </div>
                </div>

                {/* Content body */}
                <div className="space-y-4 overflow-y-auto flex-1 pr-1">
                    {/* Form for Create / Edit */}
                    {(isCreatingNew || editingItem) ? (
                        <form onSubmit={handleSaveForm} className="p-4 sm:p-5 bg-[#F8FAFC] border-2 border-[#5D87FF]/30 rounded-2xl space-y-4">
                            <div className="flex items-center justify-between pb-2 border-b border-[#EAEFF4]">
                                <h4 className="font-bold text-sm text-[#2A3547] flex items-center gap-2">
                                    {editingItem ? <Pencil className="w-4 h-4 text-[#5D87FF]" /> : <Plus className="w-4 h-4 text-[#5D87FF]" />}
                                    <span>{editingItem ? 'Edit Pricelist Wilayah' : 'Upload Pricelist Wilayah Baru'}</span>
                                </h4>
                                <button
                                    type="button"
                                    onClick={handleCancelForm}
                                    className="text-xs text-[#5A6A85] hover:text-[#2A3547] font-semibold"
                                >
                                    Batal
                                </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {/* Region Selector */}
                                <div>
                                    <label className="block text-xs font-bold text-[#2A3547] mb-1.5 uppercase tracking-wider">
                                        Pilih Wilayah / Daerah <span className="text-rose-500">*</span>
                                    </label>
                                    <select
                                        value={formRegion}
                                        onChange={(e) => handleRegionChange(e.target.value)}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAEFF4] bg-white focus:border-[#5D87FF] text-xs font-semibold text-[#2A3547] outline-none"
                                        required
                                    >
                                        <option value="semua">Semua Wilayah (Umum)</option>
                                        {regionOptions.map(r => (
                                            <option key={r.value} value={r.value}>
                                                {r.label}
                                            </option>
                                        ))}
                                        <option value="custom">+ Tentukan Wilayah Lainnya...</option>
                                    </select>
                                </div>

                                {formRegion === 'custom' && (
                                    <div>
                                        <label className="block text-xs font-bold text-[#2A3547] mb-1.5 uppercase tracking-wider">
                                            Nama Wilayah Kustom <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={formCustomRegion}
                                            onChange={(e) => setFormCustomRegion(e.target.value)}
                                            placeholder="contoh: jogja, surabaya"
                                            className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAEFF4] bg-white focus:border-[#5D87FF] text-xs text-[#2A3547] outline-none"
                                            required
                                        />
                                    </div>
                                )}

                                {/* Title */}
                                <div className={formRegion === 'custom' ? 'sm:col-span-2' : ''}>
                                    <label className="block text-xs font-bold text-[#2A3547] mb-1.5 uppercase tracking-wider">
                                        Judul Pricelist <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formTitle}
                                        onChange={(e) => setFormTitle(e.target.value)}
                                        placeholder="contoh: Pricelist Wilayah Banten 2025"
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAEFF4] bg-white focus:border-[#5D87FF] text-xs text-[#2A3547] outline-none"
                                        required
                                    />
                                </div>
                            </div>

                            {/* PDF File Input */}
                            <div>
                                <label className="block text-xs font-bold text-[#2A3547] mb-1.5 uppercase tracking-wider">
                                    {editingItem ? 'Ganti File PDF (Kosongkan jika tidak diganti)' : 'File PDF Pricelist'} <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="file"
                                    accept=".pdf"
                                    onChange={handleFileChange}
                                    className="w-full px-3 py-2 rounded-xl border border-[#EAEFF4] bg-white focus:border-[#5D87FF] text-xs text-[#2A3547] outline-none"
                                    required={!editingItem}
                                />
                                <div className="flex justify-between items-center mt-1 text-[11px] text-[#5A6A85]">
                                    <span>Maksimal ukuran file: 10MB. Format: PDF.</span>
                                    {formFile && (
                                        <span className="text-[#5D87FF] font-semibold">
                                            {formFile.name} ({(formFile.size / 1024).toFixed(0)} KB)
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={handleCancelForm}
                                    className="px-4 py-2 rounded-xl border border-[#EAEFF4] bg-white hover:bg-[#F4F6F9] text-[#5A6A85] text-xs font-semibold cursor-pointer"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="px-4 py-2 rounded-xl bg-[#5D87FF] hover:bg-[#4871e3] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                                >
                                    <Check className="w-3.5 h-3.5" />
                                    <span>{isSaving ? 'Menyimpan...' : (editingItem ? 'Simpan Perubahan' : 'Upload & Simpan')}</span>
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-[#2A3547] uppercase tracking-wider">
                                Daftar Pricelist Daerah ({pricelists.length})
                            </span>
                            <button
                                type="button"
                                onClick={handleStartCreate}
                                className="px-3 py-1.5 rounded-xl bg-[#5D87FF] hover:bg-[#4871e3] text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Upload Pricelist Baru</span>
                            </button>
                        </div>
                    )}

                    {/* List of Pricelists */}
                    <div className="space-y-2.5">
                        {pricelists.length === 0 ? (
                            <div className="text-center py-10 px-4 bg-[#F8FAFC] rounded-2xl border border-dashed border-[#EAEFF4]">
                                <FileText className="w-10 h-10 text-[#5A6A85]/40 mx-auto mb-2" />
                                <p className="text-xs font-semibold text-[#2A3547]">Belum ada Pricelist PDF wilayah</p>
                                <p className="text-[11px] text-[#5A6A85] mt-1">
                                    Klik tombol "Upload Pricelist Baru" untuk menambahkan PDF pricelist sesuai daerah Anda.
                                </p>
                            </div>
                        ) : (
                            pricelists.map((item) => {
                                const isCurrentEditing = editingItem?.id === item.id;
                                const regionLabel = item.regionLabel || item.region.toUpperCase();

                                return (
                                    <div
                                        key={item.id}
                                        className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                                            isCurrentEditing
                                                ? 'border-[#5D87FF] bg-[#5D87FF]/5'
                                                : 'border-[#EAEFF4] bg-white hover:border-[#5D87FF]/40'
                                        }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 mt-0.5">
                                                <FileText className="w-4 h-4" />
                                            </div>
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="px-2 py-0.5 rounded-md bg-[#5D87FF]/10 text-[#5D87FF] text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                                                        <MapPin className="w-2.5 h-2.5" />
                                                        {regionLabel}
                                                    </span>
                                                    <h5 className="font-bold text-xs sm:text-sm text-[#2A3547]">
                                                        {item.title}
                                                    </h5>
                                                </div>
                                                <div className="flex items-center gap-3 text-[11px] text-[#5A6A85]">
                                                    <span>{item.fileName || 'pricelist.pdf'}</span>
                                                    {item.fileSize && <span>• {item.fileSize}</span>}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1.5 self-end sm:self-center">
                                            <button
                                                type="button"
                                                onClick={() => handleDownload(item)}
                                                className="p-2 rounded-lg bg-[#F4F6F9] hover:bg-[#EAEFF4] text-[#5A6A85] hover:text-[#2A3547] transition-colors cursor-pointer"
                                                title="Download / Lihat PDF"
                                            >
                                                <Download className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleStartEdit(item)}
                                                className="p-2 rounded-lg bg-[#5D87FF]/10 hover:bg-[#5D87FF]/20 text-[#5D87FF] transition-colors cursor-pointer"
                                                title="Edit Pricelist"
                                            >
                                                <Pencil className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteItem(item.id, item.title)}
                                                className="p-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                                                title="Hapus Pricelist"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="pt-3 border-t border-[#EAEFF4] flex justify-end">
                    <button
                        type="button"
                        onClick={onClose}
                        className="py-2.5 px-5 rounded-xl border border-[#EAEFF4] bg-white hover:bg-[#F4F6F9] text-[#5A6A85] font-semibold text-xs transition-colors cursor-pointer"
                    >
                        Tutup
                    </button>
                </div>
            </div>
        </div>
    );
};
