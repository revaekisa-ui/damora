import React from 'react';
import { Card, CardType, FinancialPocket } from '../../../types';
import { CardWidget } from './CardWidget';
import { CashWidget } from './CashWidget';
import { ModernStatCard } from '../../../components/modernize/ModernStatCard';
import { formatCurrency } from '../../../utils/currency';
import { CreditCardIcon, PlusIcon, DollarSignIcon, TrendingUpIcon, CashIcon, DownloadIcon } from '../../../constants';

interface CardStats {
    creditDebt: number;
    debitAndCashAssets: number;
    mostUsedCardName: string;
    mostUsedCardTxCount: number;
    cashBalance: number;
}

interface CardsTabProps {
    cards: Card[];
    pockets: FinancialPocket[];
    cardStats: CardStats;
    onOpenModal: (type: 'card' | 'topup-cash', mode: 'add' | 'edit', data?: any) => void;
    onDeleteCard: (id: string) => void;
    onViewHistory: (card: Card) => void;
    handleDownloadCardsExcel: () => void;
}

const CardsTab: React.FC<CardsTabProps> = ({
    cards,
    pockets,
    cardStats,
    onOpenModal,
    onDeleteCard,
    onViewHistory,
    handleDownloadCardsExcel
}) => {
    return (
        <div className="space-y-4 sm:space-y-6">
            <div className="flex items-center justify-between gap-2">
                <h3 className="text-base sm:text-xl font-bold text-[#2A3547] flex items-center gap-1.5 sm:gap-2">
                    <CreditCardIcon className="w-4 h-4 sm:w-5 sm:h-5 text-brand-accent" /> Kartu Saya
                </h3>
                <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                        onClick={handleDownloadCardsExcel}
                        aria-label="Unduh Excel"
                        title="Unduh Excel"
                        className="bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl px-2 sm:px-3.5 py-2 text-xs sm:text-sm inline-flex items-center gap-1.5 transition-all"
                    >
                        <DownloadIcon className="w-4 h-4 flex-shrink-0" />
                        <span className="hidden sm:inline">Unduh Excel</span>
                    </button>
                    <button
                        onClick={() => onOpenModal('card', 'add')}
                        aria-label="Tambah Kartu"
                        title="Tambah Kartu"
                        className="bg-brand-accent hover:bg-brand-accent/90 text-white font-bold rounded-xl px-2 sm:px-4 py-2 text-xs sm:text-sm shadow-md shadow-brand-accent/25 inline-flex items-center gap-1.5 transition-all flex-shrink-0"
                    >
                        <PlusIcon className="w-4 h-4 flex-shrink-0" />
                        <span className="sm:hidden">Tambah</span>
                        <span className="hidden sm:inline">Tambah Kartu</span>
                    </button>
                </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-5">
                {cards.map(card => {
                    const connectedPockets = pockets.filter(p => p.sourceCardId === card.id);
                    return (
                        <div key={card.id}>
                            {card.cardType === CardType.TUNAI ? (
                                <CashWidget
                                    card={card}
                                    onClick={() => onViewHistory(card)}
                                    onTopUp={() => onOpenModal('topup-cash', 'add')}
                                    onEdit={() => onOpenModal('card', 'edit', card)}
                                    connectedPockets={connectedPockets}
                                />
                            ) : (
                                <CardWidget
                                    card={card}
                                    onEdit={() => onOpenModal('card', 'edit', card)}
                                    onDelete={() => onDeleteCard(card.id)}
                                    onClick={() => onViewHistory(card)}
                                    connectedPockets={connectedPockets}
                                />
                            )}
                        </div>
                    );
                })}
                <button
                    onClick={() => onOpenModal('card', 'add')}
                    className="finance-add-account-card group aspect-[1.586] border-2 border-dashed border-[#EAEFF4] hover:border-brand-accent bg-[#F4F6F9]/60 hover:bg-brand-accent/10 rounded-2xl flex flex-col items-center justify-center text-[#5A6A85] hover:text-brand-accent transition-all duration-300 shadow-xs"
                >
                    <div className="w-14 h-14 rounded-2xl bg-white border border-[#EAEFF4] group-hover:border-brand-accent/40 flex items-center justify-center transition-all shadow-xs">
                        <PlusIcon className="w-7 h-7 text-brand-accent transition-transform group-hover:scale-110" />
                    </div>
                    <span className="mt-3 font-bold text-sm text-[#2A3547] group-hover:text-brand-accent transition-colors">Tambah Kartu / Akun</span>
                </button>
            </div>
        </div>
    );
};

export default CardsTab;
