import React, { useState } from 'react';
import Modal from '../../../shared/ui/Modal';
import { Package } from '../../../types';
import { Copy, MapPin, Check, Plus, Loader2 } from 'lucide-react';

interface DuplicatePackageModalProps {
    packageToCopy: Package | null;
    onClose: () => void;
    unionRegions: { value: string; label: string }[];
    onDuplicate: (targetRegion: string) => Promise<void>;
}

export const DuplicatePackageModal: React.FC<DuplicatePackageModalProps> = ({
    packageToCopy,
    onClose,
    unionRegions,
    onDuplicate,
}) => {
    const [targetRegion, setTargetRegion] = useState<string>('');
    const [customRegion, setCustomRegion] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!packageToCopy) return null;

    const handleConfirm = async () => {
        const finalRegion = (targetRegion === '__custom__' ? customRegion : targetRegion).trim().toLowerCase();
        if (!finalRegion) {
            alert('Silakan pilih atau masukkan nama grup paket tujuan.');
            return;
        }

        setIsSubmitting(true);
        try {
            await onDuplicate(finalRegion);
            onClose();
        } catch (err) {
            console.error(err);
            alert('Gagal menduplikasi paket ke database. Silakan coba lagi.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const effectiveRegion = targetRegion === '__custom__' ? customRegion : targetRegion;

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title="Duplikasi Paket ke Grup Lain"
            size="md"
        >
            <div className="space-y-5">
                {/* Source Package Info */}
                <div className="bg-[#F4F6F9] rounded-2xl p-4 border border-[#EAEFF4] space-y-1.5">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-[#5A6A85]">
                        Paket Sumber
                    </span>
                    <h4 className="font-bold text-base text-[#2A3547]">
                        {packageToCopy.name}
                    </h4>
                    <div className="flex items-center gap-2 pt-1">
                        <span className="text-xs text-[#5A6A85]">Grup saat ini:</span>
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-white border border-[#EAEFF4] text-[#2A3547]">
                            <MapPin className="w-3 h-3 text-brand-accent" />
                            {packageToCopy.region || 'Semua Grup'}
                        </span>
                    </div>
                </div>

                {/* Region Selection */}
                <div>
                    <label className="block text-xs font-bold text-[#2A3547] mb-2 uppercase tracking-wider">
                        Pilih Grup Paket Tujuan
                    </label>
                    <div className="flex flex-wrap gap-2 mb-3">
                        {unionRegions.map(r => (
                            <button
                                key={r.value}
                                type="button"
                                onClick={() => { setTargetRegion(r.value); setCustomRegion(''); }}
                                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                                    targetRegion === r.value
                                        ? 'bg-brand-accent text-white border-brand-accent shadow-sm'
                                        : 'bg-white text-[#5A6A85] hover:text-[#2A3547] hover:bg-[#F4F6F9] border-[#EAEFF4]'
                                }`}
                            >
                                {r.label}
                            </button>
                        ))}
                        <button
                            type="button"
                            onClick={() => setTargetRegion('__custom__')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border flex items-center gap-1 ${
                                targetRegion === '__custom__'
                                    ? 'bg-brand-accent text-white border-brand-accent shadow-sm'
                                    : 'bg-white text-[#5A6A85] hover:text-[#2A3547] hover:bg-[#F4F6F9] border-[#EAEFF4]'
                            }`}
                        >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Grup Baru</span>
                        </button>
                    </div>

                    {targetRegion === '__custom__' && (
                        <div className="animate-fade-in mt-2">
                            <input
                                type="text"
                                autoFocus
                                value={customRegion}
                                onChange={e => setCustomRegion(e.target.value)}
                                placeholder="Ketik nama grup (cth: Wedding Attire 2026)"
                                className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAEFF4] bg-[#F4F6F9] focus:bg-white focus:border-brand-accent text-sm text-[#2A3547] outline-none"
                            />
                        </div>
                    )}
                </div>

                {/* Preview Name */}
                {effectiveRegion && (
                    <div className="bg-brand-accent/5 border border-brand-accent/20 rounded-xl p-3 text-xs text-[#2A3547] space-y-1">
                        <span className="font-semibold text-brand-accent">Hasil Nama Paket Duplikasi:</span>
                        <p className="font-bold text-sm text-[#2A3547]">
                            "{packageToCopy.name} ({effectiveRegion.charAt(0).toUpperCase() + effectiveRegion.slice(1)})"
                        </p>
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-2.5 pt-2 border-t border-[#EAEFF4]">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 py-2.5 px-4 rounded-xl border border-[#EAEFF4] bg-white hover:bg-[#F4F6F9] text-[#5A6A85] font-semibold text-xs transition-colors"
                    >
                        Batal
                    </button>
                    <button
                        type="button"
                        disabled={isSubmitting || !effectiveRegion.trim()}
                        onClick={handleConfirm}
                        className="flex-[2] py-2.5 px-4 rounded-xl bg-brand-accent hover:bg-brand-accent-hover text-white font-semibold text-xs transition-all shadow-brand-accent/25 flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Menduplikasi...</span>
                            </>
                        ) : (
                            <>
                                <Copy className="w-4 h-4" />
                                <span>Duplikasi Sekarang</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </Modal>
    );
};
