import React, { useState, useEffect } from 'react';
import { WorkflowItem, Profile } from '../../../types';
import {
    List,
    X,
    Plus,
    Pencil,
    Trash2,
    Copy,
    Check,
    RotateCcw,
    Sparkles,
    Calendar,
    ArrowRight
} from 'lucide-react';

export const DEFAULT_WORKFLOWS: WorkflowItem[] = [
    {
        id: 'wf-wedding',
        title: 'Wedding Timeline',
        timeline: [
            'Konsep Acara Pernikahan / Awal → H-90',
            'Pemilihan Vendor / Detail → H-60',
            'Persiapan Final (Technical Meeting) → H-14',
            'Pelaksanaan Acara Pernikahan → Hari H',
            'Penyelesaian / Review Akhir → H+7',
            'Serah Terima Dokumentasi / Laporan → H+30'
        ]
    },
    {
        id: 'wf-small-event',
        title: 'Event / Acara Pernikahan Kecil Timeline',
        timeline: [
            'Konsep / Kesepakatan Awal → H-30',
            'Persiapan Final → H-7',
            'Pelaksanaan Acara Pernikahan → Hari H',
            'Penyelesaian Layanan / Laporan → H+14'
        ]
    }
];

interface WorkflowModalProps {
    isOpen: boolean;
    onClose: () => void;
    profile: Profile;
    onSaveWorkflows: (workflows: WorkflowItem[]) => Promise<void>;
    showNotification: (message: string) => void;
}

export const WorkflowModal: React.FC<WorkflowModalProps> = ({
    isOpen,
    onClose,
    profile,
    onSaveWorkflows,
    showNotification,
}) => {
    const [workflows, setWorkflows] = useState<WorkflowItem[]>([]);
    const [editingWorkflowId, setEditingWorkflowId] = useState<string | null>(null);
    const [formTitle, setFormTitle] = useState('');
    const [formTimelineText, setFormTimelineText] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    // Initialize workflows from profile or defaults
    useEffect(() => {
        if (!isOpen) return;

        if (profile.publicPageConfig?.workflows && profile.publicPageConfig.workflows.length > 0) {
            setWorkflows(profile.publicPageConfig.workflows);
        } else {
            const list: WorkflowItem[] = [];
            if (profile.publicPageConfig?.weddingWorkflow?.title) {
                list.push({
                    id: 'wf-wedding',
                    title: profile.publicPageConfig.weddingWorkflow.title,
                    timeline: profile.publicPageConfig.weddingWorkflow.timeline || []
                });
            }
            if (profile.publicPageConfig?.smallEventWorkflow?.title) {
                list.push({
                    id: 'wf-small-event',
                    title: profile.publicPageConfig.smallEventWorkflow.title,
                    timeline: profile.publicPageConfig.smallEventWorkflow.timeline || []
                });
            }
            setWorkflows(list.length > 0 ? list : DEFAULT_WORKFLOWS);
        }

        setEditingWorkflowId(null);
        setErrorMsg('');
    }, [isOpen, profile.publicPageConfig]);

    if (!isOpen) return null;

    const handleStartAdd = () => {
        setEditingWorkflowId('new');
        setFormTitle('');
        setFormTimelineText('');
        setErrorMsg('');
    };

    const handleStartEdit = (wf: WorkflowItem) => {
        setEditingWorkflowId(wf.id);
        setFormTitle(wf.title);
        setFormTimelineText(wf.timeline.join('\n'));
        setErrorMsg('');
    };

    const handleDuplicate = (wf: WorkflowItem) => {
        const newWf: WorkflowItem = {
            id: `wf-${Date.now()}`,
            title: `${wf.title} (Salinan)`,
            timeline: [...wf.timeline]
        };
        setWorkflows(prev => [...prev, newWf]);
        showNotification(`Workflow "${newWf.title}" berhasil diduplikasi.`);
    };

    const handleDelete = (wfId: string, title: string) => {
        if (workflows.length <= 1) {
            alert('Minimal harus memiliki 1 workflow template.');
            return;
        }
        if (window.confirm(`Hapus workflow "${title}"?`)) {
            setWorkflows(prev => prev.filter(w => w.id !== wfId));
            if (editingWorkflowId === wfId) {
                setEditingWorkflowId(null);
            }
            showNotification(`Workflow "${title}" berhasil dihapus.`);
        }
    };

    const handleSaveFormItem = () => {
        if (!formTitle.trim()) {
            setErrorMsg('Judul workflow tidak boleh kosong.');
            return;
        }

        const lines = formTimelineText
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);

        if (lines.length === 0) {
            setErrorMsg('Minimal masukkan 1 tahapan / langkah timeline.');
            return;
        }

        if (editingWorkflowId === 'new') {
            const newWorkflow: WorkflowItem = {
                id: `wf-${Date.now()}`,
                title: formTitle.trim(),
                timeline: lines
            };
            setWorkflows(prev => [...prev, newWorkflow]);
            showNotification(`Workflow "${newWorkflow.title}" berhasil ditambahkan.`);
        } else if (editingWorkflowId) {
            setWorkflows(prev =>
                prev.map(w =>
                    w.id === editingWorkflowId
                        ? { ...w, title: formTitle.trim(), timeline: lines }
                        : w
                )
            );
            showNotification(`Workflow "${formTitle.trim()}" berhasil diperbarui.`);
        }

        setEditingWorkflowId(null);
        setErrorMsg('');
    };

    const handleCancelFormItem = () => {
        setEditingWorkflowId(null);
        setErrorMsg('');
    };

    const handleResetDefaults = () => {
        if (window.confirm('Kembalikan workflow ke template standar bawaan? Perubahan kustom yang belum disimpan akan digantikan.')) {
            setWorkflows(DEFAULT_WORKFLOWS);
            setEditingWorkflowId(null);
            showNotification('Workflow di-reset ke template standar.');
        }
    };

    const handleSaveAll = async () => {
        if (workflows.length === 0) {
            alert('Minimal harus ada 1 workflow.');
            return;
        }

        setIsSaving(true);
        try {
            await onSaveWorkflows(workflows);
            showNotification('Seluruh template workflow berhasil disimpan.');
            onClose();
        } catch (err) {
            console.error('Error saving workflows:', err);
            alert('Gagal menyimpan workflow. Silakan coba lagi.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
            <div className="bg-white rounded-2xl border border-[#EAEFF4] shadow-2xl max-w-2xl w-full p-4 sm:p-6 space-y-4 animate-scale-up my-auto max-h-[92vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-[#EAEFF4]">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-[#FFAE1F]/15 flex items-center justify-center text-[#FFAE1F]">
                            <List className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-bold text-base sm:text-lg text-[#2A3547]">
                                    Kelola Workflow & Timeline
                                </h3>
                                <span className="text-[11px] font-bold bg-[#FFAE1F]/10 text-[#d48e14] px-2 py-0.5 rounded-full">
                                    {workflows.length} Template
                                </span>
                            </div>
                            <p className="text-xs text-[#5A6A85] mt-0.5">
                                Atur judul dan tahapan timeline alur kerja yang tampil di halaman katalog publik.
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

                {/* Content Body */}
                <div className="space-y-4 overflow-y-auto flex-1 pr-1">
                    {/* If editing or adding an item */}
                    {editingWorkflowId !== null ? (
                        <div className="bg-[#FAFBFD] p-4 sm:p-5 rounded-2xl border-2 border-[#5D87FF]/30 space-y-4 animate-fade-in">
                            <div className="flex items-center justify-between border-b border-[#EAEFF4] pb-2.5">
                                <span className="text-xs font-bold text-[#2A3547] uppercase tracking-wider flex items-center gap-1.5">
                                    <Sparkles className="w-3.5 h-3.5 text-[#5D87FF]" />
                                    {editingWorkflowId === 'new' ? 'Tambah Workflow Baru' : 'Edit Template Workflow'}
                                </span>
                                <button
                                    type="button"
                                    onClick={handleCancelFormItem}
                                    className="text-xs font-semibold text-[#5A6A85] hover:text-rose-600 transition-colors"
                                >
                                    Batal
                                </button>
                            </div>

                            {errorMsg && (
                                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                                    {errorMsg}
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-[#2A3547] mb-1.5 uppercase tracking-wider">
                                    Judul Workflow / Layanan <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formTitle}
                                    onChange={(e) => setFormTitle(e.target.value)}
                                    placeholder="Contoh: Wedding Timeline, Lamaran & Sangjit Timeline, Acara Resepsi..."
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAEFF4] bg-white focus:border-[#5D87FF] text-sm text-[#2A3547] font-medium outline-none transition-all placeholder:text-[#5A6A85]/50"
                                />
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="block text-xs font-bold text-[#2A3547] uppercase tracking-wider">
                                        Tahapan Timeline (1 baris per langkah) <span className="text-rose-500">*</span>
                                    </label>
                                    <span className="text-[10px] text-[#5A6A85]">
                                        Pisahkan dengan tombol Enter
                                    </span>
                                </div>
                                <textarea
                                    value={formTimelineText}
                                    onChange={(e) => setFormTimelineText(e.target.value)}
                                    rows={7}
                                    placeholder={"Konsep Acara Pernikahan / Awal → H-90\nPemilihan Vendor / Detail → H-60\nPersiapan Final (Technical Meeting) → H-14\nPelaksanaan Acara Pernikahan → Hari H\nPenyelesaian / Review Akhir → H+7\nSerah Terima Dokumentasi / Laporan → H+30"}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAEFF4] bg-white focus:border-[#5D87FF] text-xs sm:text-sm font-mono text-[#2A3547] outline-none transition-all resize-y leading-relaxed"
                                />
                                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                                    <span className="text-[10px] font-semibold text-[#5A6A85]">Contoh cepat:</span>
                                    <button
                                        type="button"
                                        onClick={() => setFormTimelineText("Konsep & Konsultasi Awal → H-60\nSurvey Lokasi & Rundown → H-30\nTechnical Meeting Tim → H-7\nPelaksanaan Acara → Hari H\nSerah Terima Hasil → H+14")}
                                        className="text-[10px] px-2 py-0.5 rounded-md bg-[#5D87FF]/10 text-[#5D87FF] hover:bg-[#5D87FF]/20 font-medium transition-colors"
                                    >
                                        + Format H-Minus Standar
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#EAEFF4]">
                                <button
                                    type="button"
                                    onClick={handleCancelFormItem}
                                    className="px-4 py-2 rounded-xl border border-[#EAEFF4] bg-white hover:bg-[#F4F6F9] text-[#5A6A85] font-semibold text-xs transition-colors cursor-pointer"
                                >
                                    Batal
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSaveFormItem}
                                    className="px-4 py-2 rounded-xl bg-[#5D87FF] hover:bg-[#4871e3] text-white font-semibold text-xs transition-all shadow-[0_4px_12px_rgba(93,135,255,0.25)] flex items-center gap-1.5 cursor-pointer"
                                >
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Simpan Template Ini</span>
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-[#5A6A85] uppercase tracking-wider">
                                    Daftar Workflow Aktif ({workflows.length})
                                </span>
                                <button
                                    type="button"
                                    onClick={handleStartAdd}
                                    className="px-3 py-1.5 rounded-xl bg-[#5D87FF] hover:bg-[#4871e3] text-white font-semibold text-xs transition-all flex items-center gap-1.5 shadow-[0_2px_8px_rgba(93,135,255,0.2)] cursor-pointer"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>Tambah Workflow Baru</span>
                                </button>
                            </div>

                            {/* Workflow Cards List */}
                            <div className="space-y-3">
                                {workflows.map((wf, idx) => (
                                    <div
                                        key={wf.id || idx}
                                        className="bg-white rounded-xl border border-[#EAEFF4] hover:border-[#FFAE1F]/50 p-3.5 sm:p-4 transition-all shadow-sm group"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="space-y-1 min-w-0 flex-1">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="w-5 h-5 rounded-md bg-[#FFAE1F]/15 text-[#FFAE1F] font-bold text-xs flex items-center justify-center flex-shrink-0">
                                                        {idx + 1}
                                                    </span>
                                                    <h4 className="font-bold text-sm text-[#2A3547] truncate">
                                                        {wf.title}
                                                    </h4>
                                                    <span className="text-[10px] font-semibold bg-[#F4F6F9] text-[#5A6A85] px-2 py-0.5 rounded-full border border-[#EAEFF4]">
                                                        {wf.timeline.length} Langkah
                                                    </span>
                                                </div>

                                                {/* Steps Preview */}
                                                <div className="pt-2 pl-7 space-y-1">
                                                    {wf.timeline.slice(0, 3).map((step, sIdx) => (
                                                        <div key={sIdx} className="text-xs text-[#5A6A85] flex items-center gap-1.5 truncate">
                                                            <ArrowRight className="w-3 h-3 text-[#FFAE1F] flex-shrink-0" />
                                                            <span className="truncate">{step}</span>
                                                        </div>
                                                    ))}
                                                    {wf.timeline.length > 3 && (
                                                        <p className="text-[10px] font-medium text-[#5D87FF] pl-4">
                                                            + {wf.timeline.length - 3} langkah lainnya
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex items-center gap-1 flex-shrink-0">
                                                <button
                                                    type="button"
                                                    onClick={() => handleStartEdit(wf)}
                                                    className="p-1.5 rounded-lg text-[#5A6A85] hover:text-[#5D87FF] hover:bg-[#5D87FF]/10 transition-colors"
                                                    title="Edit workflow"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDuplicate(wf)}
                                                    className="p-1.5 rounded-lg text-[#5A6A85] hover:text-[#13DEB9] hover:bg-[#13DEB9]/10 transition-colors"
                                                    title="Duplikasi workflow"
                                                >
                                                    <Copy className="w-4 h-4" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDelete(wf.id, wf.title)}
                                                    className="p-1.5 rounded-lg text-[#5A6A85] hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                                    title="Hapus workflow"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-3 border-t border-[#EAEFF4]">
                    <button
                        type="button"
                        onClick={handleResetDefaults}
                        className="text-xs text-[#5A6A85] hover:text-[#2A3547] flex items-center justify-center gap-1.5 font-medium transition-colors py-1 cursor-pointer"
                    >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Kembalikan Template Default</span>
                    </button>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 sm:flex-initial py-2.5 px-4 rounded-xl border border-[#EAEFF4] bg-white hover:bg-[#F4F6F9] text-[#5A6A85] font-semibold text-xs transition-colors cursor-pointer"
                        >
                            Batal
                        </button>
                        <button
                            type="button"
                            onClick={handleSaveAll}
                            disabled={isSaving}
                            className="flex-1 sm:flex-initial py-2.5 px-5 rounded-xl bg-[#FFAE1F] hover:bg-[#e5a31d] text-white font-semibold text-xs transition-all shadow-[0_4px_12px_rgba(255,174,31,0.25)] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                        >
                            {isSaving ? (
                                <span>Menyimpan...</span>
                            ) : (
                                <>
                                    <Check className="w-4 h-4" />
                                    <span>Simpan Semua Workflow</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
