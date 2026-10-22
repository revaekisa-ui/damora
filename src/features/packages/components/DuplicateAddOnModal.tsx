import { useState } from 'react';
import Modal from '../../../shared/ui/Modal';
import { AddOn } from '../../../types';
import { Copy, Loader2, MapPin, Plus } from 'lucide-react';

interface DuplicateAddOnModalProps {
    addOn: AddOn | null;
    onClose: () => void;
    regions: { value: string; label: string }[];
    onDuplicate: (targetRegion: string) => Promise<void>;
}

export const DuplicateAddOnModal: React.FC<DuplicateAddOnModalProps> = ({
    addOn,
    onClose,
    regions,
    onDuplicate,
}) => {
    const [targetRegion, setTargetRegion] = useState('');
    const [customRegion, setCustomRegion] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!addOn) return null;

    const region = targetRegion === '__custom__' ? customRegion : targetRegion;
    const displayRegion = region.trim();
    const handleConfirm = async () => {
        if (!displayRegion) return;
        setIsSubmitting(true);
        try {
            await onDuplicate(displayRegion.toLowerCase());
            onClose();
        } catch (error) {
            console.error('[AddOns.duplicate] Failed to duplicate add-on:', error);
            alert('Gagal menduplikasi Add-On ke database. Silakan coba lagi.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal isOpen title="Duplikasi Add-On ke Grup Lain" onClose={onClose} size="md">
            <div className="space-y-5">
                <div className="rounded-2xl border border-[#EAEFF4] bg-[#F4F6F9] p-4">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#5A6A85]">Add-On Sumber</p>
                    <h4 className="mt-1 font-bold text-base text-[#2A3547]">{addOn.name}</h4>
                    <p className="mt-1 flex items-center gap-1 text-xs text-[#5A6A85]">
                        <MapPin className="h-3 w-3 text-brand-accent" />
                        Grup saat ini: {addOn.region || 'Semua Grup'}
                    </p>
                </div>

                <div>
                    <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[#2A3547]">Pilih Grup Paket Tujuan</p>
                    <div className="flex flex-wrap gap-2">
                        {regions.map(item => (
                            <button
                                key={item.value}
                                type="button"
                                onClick={() => { setTargetRegion(item.value); setCustomRegion(''); }}
                                className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all ${
                                    targetRegion === item.value
                                        ? 'border-brand-accent bg-brand-accent text-white'
                                        : 'border-[#EAEFF4] bg-white text-[#5A6A85] hover:bg-[#F4F6F9]'
                                }`}
                            >
                                {item.label}
                            </button>
                        ))}
                        <button
                            type="button"
                            onClick={() => setTargetRegion('__custom__')}
                            className={`flex items-center gap-1 rounded-xl border px-3 py-1.5 text-xs font-semibold ${
                                targetRegion === '__custom__'
                                    ? 'border-brand-accent bg-brand-accent text-white'
                                    : 'border-[#EAEFF4] bg-white text-[#5A6A85]'
                            }`}
                        >
                            <Plus className="h-3.5 w-3.5" />
                            Grup Baru
                        </button>
                    </div>
                    {targetRegion === '__custom__' && (
                        <input
                            autoFocus
                            value={customRegion}
                            onChange={event => setCustomRegion(event.target.value)}
                            placeholder="Nama grup tujuan"
                            className="mt-3 w-full rounded-xl border border-[#EAEFF4] bg-[#F4F6F9] px-3.5 py-2.5 text-sm outline-none focus:border-brand-accent focus:bg-white"
                        />
                    )}
                </div>

                {displayRegion && (
                    <div className="rounded-xl border border-brand-accent/20 bg-brand-accent/5 p-3 text-xs text-[#2A3547]">
                        Nama salinan: <strong>{addOn.name} ({displayRegion.charAt(0).toUpperCase() + displayRegion.slice(1)})</strong>
                    </div>
                )}

                <div className="flex gap-2 border-t border-[#EAEFF4] pt-3">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="flex-1 rounded-xl border border-[#EAEFF4] px-4 py-2.5 text-xs font-semibold text-[#5A6A85]"
                    >
                        Batal
                    </button>
                    <button
                        type="button"
                        onClick={() => void handleConfirm()}
                        disabled={isSubmitting || !displayRegion}
                        className="flex-[2] inline-flex items-center justify-center gap-1.5 rounded-xl bg-brand-accent px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-50"
                    >
                        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Copy className="h-4 w-4" />}
                        {isSubmitting ? 'Menduplikasi...' : 'Duplikasi Sekarang'}
                    </button>
                </div>
            </div>
        </Modal>
    );
};
