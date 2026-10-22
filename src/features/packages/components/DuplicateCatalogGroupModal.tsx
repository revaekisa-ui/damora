import React, { useEffect, useState } from 'react';
import Modal from '../../../shared/ui/Modal';
import { Copy, Loader2 } from 'lucide-react';

interface DuplicateCatalogGroupModalProps {
    group: { value: string; label: string } | null;
    packageCount: number;
    addOnCount: number;
    attireCount: number;
    takenGroupValues: string[];
    onClose: () => void;
    onCopy: (targetGroup: string) => Promise<void>;
}

export const DuplicateCatalogGroupModal: React.FC<DuplicateCatalogGroupModalProps> = ({
    group,
    packageCount,
    addOnCount,
    attireCount,
    takenGroupValues,
    onClose,
    onCopy,
}) => {
    const [targetName, setTargetName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (group) setTargetName(`${group.label} Salinan`);
    }, [group]);

    const targetGroup = targetName.trim().toLowerCase();
    const sourceGroup = group?.value.trim().toLowerCase() || '';
    const isTaken = takenGroupValues.some(value => value.trim().toLowerCase() === targetGroup);
    const totalCount = packageCount + addOnCount + attireCount;

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!group || !targetGroup || isTaken || totalCount === 0) return;

        setIsSubmitting(true);
        try {
            await onCopy(targetGroup);
            onClose();
        } catch (error) {
            console.error('[Packages.group-copy] Failed to copy catalog group:', error);
            alert('Gagal menyalin grup paket. Silakan coba lagi.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal
            isOpen={Boolean(group)}
            title="Salin Grup Paket"
            onClose={() => { if (!isSubmitting) onClose(); }}
            size="md"
        >
            <form onSubmit={event => void handleSubmit(event)} className="space-y-4">
                <div className="rounded-xl border border-[#EAEFF4] bg-[#F4F6F9] p-3.5">
                    <p className="text-xs text-[#5A6A85]">Grup sumber</p>
                    <p className="mt-0.5 font-bold text-sm text-[#2A3547]">{group?.label}</p>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                        <div><p className="font-bold text-sm text-[#2A3547]">{packageCount}</p><p className="text-[10px] text-[#5A6A85]">Paket</p></div>
                        <div><p className="font-bold text-sm text-[#2A3547]">{addOnCount}</p><p className="text-[10px] text-[#5A6A85]">Add-On</p></div>
                        <div><p className="font-bold text-sm text-[#2A3547]">{attireCount}</p><p className="text-[10px] text-[#5A6A85]">Attire</p></div>
                    </div>
                </div>

                <div>
                    <label htmlFor="catalog-group-copy-name" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#2A3547]">
                        Nama grup salinan
                    </label>
                    <input
                        id="catalog-group-copy-name"
                        autoFocus
                        value={targetName}
                        onChange={event => setTargetName(event.target.value)}
                        disabled={isSubmitting}
                        className="w-full rounded-xl border border-[#EAEFF4] bg-white px-3.5 py-2.5 text-sm text-[#2A3547] outline-none focus:border-brand-accent disabled:opacity-60"
                    />
                    {targetGroup && (targetGroup === sourceGroup || isTaken) && (
                        <p className="mt-1.5 text-xs text-red-600">Nama grup ini sudah digunakan. Pilih nama lain.</p>
                    )}
                    {totalCount === 0 && (
                        <p className="mt-1.5 text-xs text-[#5A6A85]">Grup ini belum memiliki item untuk disalin.</p>
                    )}
                </div>

                <div className="flex justify-end gap-2 border-t border-[#EAEFF4] pt-3">
                    <button type="button" onClick={onClose} disabled={isSubmitting} className="rounded-xl border border-[#EAEFF4] px-4 py-2.5 text-xs font-semibold text-[#5A6A85] disabled:opacity-50">
                        Batal
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting || !targetGroup || targetGroup === sourceGroup || isTaken || totalCount === 0}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-brand-accent px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-50"
                    >
                        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Copy className="h-4 w-4" />}
                        {isSubmitting ? 'Menyalin...' : `Salin ${totalCount} Item`}
                    </button>
                </div>
            </form>
        </Modal>
    );
};