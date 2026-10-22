import { useState, useCallback } from 'react';
import {
    Project,
    Profile,
    TeamProjectPayment,
    Transaction,
    TransactionType,
    Card,
    FinancialPocket,
    PrintingItem
} from '../../../types';
import {
    deleteProject as deleteProjectInDb,
    updateProject as updateProjectInDb
} from '../../../services/projects';
import {
    createTransaction,
    updateCardBalance
} from '../../../services/transactions';
import { updatePocket } from '../../../services/pockets';
import { syncClientStatusFromProjects } from '../../../services/clients';
import { getProgressForStatus } from '../utils/projectHelpers';

const ensureOnlineOrNotify = (showNotification: (message: string) => void): boolean => {
    if (!navigator.onLine) {
        showNotification('Harus online untuk melakukan perubahan');
        return false;
    }
    return true;
};

interface UseProjectOperationsParams {
    projects: Project[];
    setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
    selectedProject: Project | null;
    formData: any;
    setFormData: React.Dispatch<React.SetStateAction<any>>;
    setTeamProjectPayments: React.Dispatch<React.SetStateAction<TeamProjectPayment[]>>;
    setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
    cards: Card[];
    setCards: React.Dispatch<React.SetStateAction<Card[]>>;
    pockets: FinancialPocket[];
    setPockets: React.Dispatch<React.SetStateAction<FinancialPocket[]>>;
    profile: Profile;
    showNotification: (msg: string) => void;
}

export function useProjectOperations({
    projects,
    setProjects,
    selectedProject,
    formData,
    setFormData,
    setTeamProjectPayments,
    setTransactions,
    cards,
    setCards,
    pockets,
    setPockets,
    profile,
    showNotification
}: UseProjectOperationsParams) {
    const [draggedProjectId, setDraggedProjectId] = useState<string | null>(null);

    const handleProjectDelete = async (projectId: string) => {
        if (window.confirm("Apakah Anda yakin ingin menghapus Acara Pernikahan ini? Semua data terkait (termasuk tugas tim dan transaksi) akan dihapus.")) {
            if (!ensureOnlineOrNotify(showNotification)) return;
            try {
                await deleteProjectInDb(projectId);
            } catch (err) {
                console.warn('[Projects] Failed to delete project in Supabase:', err);
                showNotification(!navigator.onLine ? 'Harus online untuk melakukan perubahan' : 'Gagal menghapus Acara Pernikahan di server. Coba lagi.');
                return;
            }
            setProjects(prev => prev.filter(p => p.id !== projectId));
            setTeamProjectPayments(prev => prev.filter(fp => fp.projectId !== projectId));
            setTransactions(prev => prev.filter(t => t.projectId !== projectId));
        }
    };

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, projectId: string) => {
        e.dataTransfer.setData("projectId", projectId);
        setDraggedProjectId(projectId);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    };

    const handleDrop = async (e: React.DragEvent<HTMLDivElement>, newStatus: string) => {
        e.preventDefault();
        const projectId = e.dataTransfer.getData("projectId");
        const projectToUpdate = projects.find(p => p.id === projectId);

        if (projectToUpdate && projectToUpdate.status !== newStatus) {
            const nextProgress = getProgressForStatus(newStatus, profile.projectStatusConfig);
            try {
                const updated = {
                    ...projectToUpdate,
                    status: newStatus,
                    progress: nextProgress,
                    activeSubStatuses: [],
                } as Project;
                await updateProjectInDb(projectId, {
                    status: newStatus,
                    progress: nextProgress,
                    activeSubStatuses: [],
                } as any);

                setProjects(prev => prev.map(p => p.id === projectId ? updated : p));

                showNotification(`Status berhasil diubah ke "${newStatus}"`);
                void syncClientStatusFromProjects(projectToUpdate.clientId).catch(e => {
                    console.warn('[Projects] Failed to sync client status from projects:', e);
                });
            } catch (error) {
                console.error('Drag drop status update error:', error);
                showNotification('Gagal mengubah status');
            }
        }
        setDraggedProjectId(null);
    };

    const handlePayForPrintingItem = async (
        projectId: string,
        printingItemId: string,
        sourceCardId: string,
        sourcePocketId?: string
    ) => {
        const project = projects.find(p => p.id === projectId) || (selectedProject && selectedProject.id === projectId ? selectedProject : null);
        const formIsForThisProject = !!(formData?.id && formData.id === projectId);
        const currentItems: PrintingItem[] = (project?.printingDetails && project.printingDetails.length > 0)
            ? (project.printingDetails as PrintingItem[])
            : (formIsForThisProject && Array.isArray(formData.printingDetails) ? (formData.printingDetails as PrintingItem[]) : []);

        const printingItem = currentItems.find(item => item.id === printingItemId);

        const isFromPocket = !!sourcePocketId;
        const sourcePocket = isFromPocket ? pockets.find(p => p.id === sourcePocketId) : null;
        const sourceCard = !isFromPocket ? cards.find(c => c.id === sourceCardId) : null;

        if (!printingItem || (!sourcePocket && !sourceCard)) {
            showNotification("Error: Data tidak lengkap untuk memproses pembayaran.");
            return;
        }

        if (isFromPocket && sourcePocket) {
            if (sourcePocket.amount < printingItem.cost) {
                showNotification(`Error: Saldo di kantong ${sourcePocket.name} tidak mencukupi.`);
                return;
            }
        } else if (sourceCard) {
            if (sourceCard.balance < printingItem.cost) {
                showNotification(`Error: Saldo di ${sourceCard.bankName} tidak mencukupi.`);
                return;
            }
        }

        try {
            const created = await createTransaction({
                date: new Date().toISOString().split('T')[0],
                description: `Biaya Produksi Fisik: ${printingItem.customName || printingItem.type} - Acara Pernikahan ${project?.projectName || (formIsForThisProject ? formData.projectName : 'Acara Pernikahan')}`,
                amount: printingItem.cost,
                type: TransactionType.EXPENSE,
                projectId: projectId,
                category: 'Produksi Fisik',
                method: 'Sistem',
                cardId: isFromPocket ? undefined : sourceCardId,
                pocketId: isFromPocket ? sourcePocketId : undefined,
                printingItemId: printingItemId,
            } as any);

            if (isFromPocket && sourcePocketId) {
                await updatePocket(sourcePocketId, { amount: sourcePocket!.amount - printingItem.cost });
            } else if (sourceCardId) {
                await updateCardBalance(sourceCardId, -Math.abs(printingItem.cost));
            }

            const updatedPrintingDetails = (currentItems || []).map(item =>
                item.id === printingItemId ? { ...item, paymentStatus: 'Paid' as 'Paid' } : item
            );
            await updateProjectInDb(projectId, { printingDetails: updatedPrintingDetails } as any);

            setTransactions(prev => [created, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));

            if (isFromPocket && sourcePocketId) {
                setPockets(prev => prev.map(p => p.id === sourcePocketId ? { ...p, amount: p.amount - printingItem.cost } : p));
            } else if (sourceCardId) {
                setCards(prev => prev.map(c => c.id === sourceCardId ? { ...c, balance: c.balance - printingItem.cost } : c));
            }

            if (project) {
                setProjects(prevProjects => prevProjects.map(p => {
                    if (p.id === projectId) {
                        return { ...p, printingDetails: updatedPrintingDetails } as Project;
                    }
                    return p;
                }));
            }
            setFormData((prev: any) => {
                const updatedPrintingDetailsForm = (prev.printingDetails || []).map((item: PrintingItem) =>
                    item.id === printingItemId ? { ...item, paymentStatus: 'Paid' as 'Paid' } : item
                );
                return { ...prev, printingDetails: updatedPrintingDetailsForm };
            });

            const sourceName = isFromPocket ? sourcePocket!.name : sourceCard!.bankName;
            showNotification(`Pembayaran untuk "${printingItem.customName || printingItem.type}" berhasil dari ${sourceName}.`);
        } catch (err) {
            console.warn('[Projects] Failed to process printing payment:', err);
            showNotification('Gagal memproses pembayaran produksi fisik di server. Coba lagi.');
        }
    };

    const handleQuickStatusChange = async (projectId: string, newStatus: string, notifyClient: boolean) => {
        try {
            const project = projects.find(p => p.id === projectId);
            if (!project) return;

            const nextProgress = getProgressForStatus(newStatus, profile.projectStatusConfig);
            const updated = {
                ...project,
                status: newStatus,
                progress: nextProgress,
                activeSubStatuses: [],
            } as Project;

            await updateProjectInDb(projectId, {
                status: newStatus,
                progress: nextProgress,
                activeSubStatuses: [],
            } as any);

            setProjects(prev => prev.map(p => p.id === projectId ? updated : p));

            showNotification(`Status berhasil diubah ke "${newStatus}"`);
            void syncClientStatusFromProjects(project.clientId).catch(e => {
                console.warn('[Projects] Failed to sync client status from projects:', e);
            });

            if (notifyClient) {
                console.log('Notifying client about status change:', newStatus);
            }
        } catch (error) {
            console.error('Quick status change error:', error);
            showNotification('Gagal mengubah status');
        }
    };

    return {
        draggedProjectId,
        handleProjectDelete,
        handleDragStart,
        handleDragOver,
        handleDrop,
        handlePayForPrintingItem,
        handleQuickStatusChange
    };
}
