import React from 'react';
import { Card, FinancialPocket, PocketType } from '../../../types';
import { PocketStatCard } from './PocketStatCard';
import { ModernStatCard } from '../../../components/modernize/ModernStatCard';
import { formatCurrency } from '../../../utils/currency';
import { ClipboardListIcon, PlusIcon, PiggyBankIcon, LockIcon } from '../../../constants';

interface PocketsTabProps {
    pockets: FinancialPocket[];
    cards: Card[];
    summary: { pocketsTotal: number };
    onOpenModal: (type: 'pocket' | 'transfer', mode: 'add' | 'edit', data?: any) => void;
    onDeletePocket: (id: string) => void;
    onViewHistory: (pocket: FinancialPocket) => void;
}

const PocketsTab: React.FC<PocketsTabProps> = ({
    pockets,
    cards,
    summary,
    onOpenModal,
    onDeletePocket,
    onViewHistory
}) => {
    const savingPocketsCount = pockets.filter(p => p.type === PocketType.SAVING).length;
    const lockedPocketsCount = pockets.filter(p => p.type === PocketType.LOCKED).length;
    const [isCollapsed, setIsCollapsed] = React.useState(false);

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Header Section */}
            <div className="flex items-center justify-between gap-2">
                <div>
                    <h3 className="text-base sm:text-xl font-bold text-[#2A3547] flex items-center gap-1.5 sm:gap-2">
                        <PiggyBankIcon className="w-4 h-4 sm:w-5 sm:h-5 text-brand-accent" />
                        <span>Kantong Keuangan</span>
                    </h3>
                    <p className="hidden sm:block text-xs text-[#7C8FAC] mt-0.5">
                        Kelola alokasi tabungan, anggaran pengeluaran, dan kantong digital dalam bentuk kartu bank
                    </p>
                </div>
                <button
                    onClick={() => onOpenModal('pocket', 'add')}
                    aria-label="Buat Kantong"
                    title="Buat Kantong"
                    className="bg-brand-accent hover:bg-brand-accent/90 text-white font-bold rounded-xl px-2 sm:px-4 py-2 text-xs sm:text-sm shadow-md shadow-brand-accent/25 inline-flex items-center gap-1.5 transition-all flex-shrink-0"
                >
                    <PlusIcon className="w-4 h-4 flex-shrink-0" />
                    <span className="sm:hidden">Buat</span>
                    <span className="hidden sm:inline">Buat Kantong</span>
                </button>
            </div>

            {/* Bank Card Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-6">
                {pockets.map(p => {
                    const sourceCard = p.sourceCardId ? cards.find(c => c.id === p.sourceCardId) : null;
                    const amount = p.amount;
                    const progress = p.goalAmount ? Math.min((amount / (p.goalAmount || 1)) * 100, 100) : 0;

                    return (
                        <div key={p.id}>
                            <PocketStatCard
                                pocket={p}
                                amount={amount}
                                sourceCardName={sourceCard?.bankName || null}
                                progressPercent={progress}
                                onClick={() => onViewHistory(p)}
                                onWithdraw={() => onOpenModal('transfer', 'add', { ...p, transferType: 'withdraw' })}
                                onDeposit={() => onOpenModal('transfer', 'add', { ...p, transferType: 'deposit' })}
                                onEdit={() => onOpenModal('pocket', 'edit', p)}
                                onDelete={() => {
                                    if (window.confirm(`Apakah Anda yakin ingin menghapus kantong "${p.name}"?`)) {
                                        onDeletePocket(p.id);
                                    }
                                }}
                            />
                        </div>
                    );
                })}

                {/* Buat Kantong Baru placeholder styled to match bank card form */}
                <button
                    onClick={() => onOpenModal('pocket', 'add')}
                    className="finance-add-pocket-card group min-h-[240px] sm:min-h-[250px] border-2 border-dashed border-[#EAEFF4] hover:border-brand-accent bg-[#F4F6F9]/60 hover:bg-brand-accent/10 rounded-2xl sm:rounded-3xl flex flex-col items-center justify-center text-[#5A6A85] hover:text-brand-accent transition-all duration-300 shadow-xs p-4 sm:p-6"
                >
                    <div className="w-14 h-14 rounded-2xl bg-white border border-[#EAEFF4] group-hover:border-brand-accent/40 flex items-center justify-center transition-all shadow-xs group-hover:scale-110">
                        <PlusIcon className="w-7 h-7 text-brand-accent" />
                    </div>
                    <span className="mt-3 font-bold text-sm text-[#2A3547] group-hover:text-brand-accent transition-colors">
                        Buat Kantong Baru
                    </span>
                    <span className="text-xs text-[#7C8FAC] mt-1 text-center max-w-[200px]">
                        Alokasikan dana khusus untuk pos tabungan atau pengeluaran
                    </span>
                </button>
            </div>
        </div>
    );
};

export default PocketsTab;
