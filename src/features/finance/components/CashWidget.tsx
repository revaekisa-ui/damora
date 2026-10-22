import React from 'react';
import { Card, FinancialPocket } from '../../../types';
import { formatCurrency } from '../../../utils/currency';
import { CashIcon, ArrowUpIcon, PencilIcon } from '../../../constants';

interface CashWidgetProps {
    card: Card;
    onTopUp: () => void;
    onEdit: () => void;
    onClick: () => void;
    connectedPockets: FinancialPocket[];
}

export const CashWidget: React.FC<CashWidgetProps> = ({ card, onTopUp, onEdit, onClick, connectedPockets }) => {
    return (
        <div
            className="group relative w-full cursor-pointer"
            style={{ transformStyle: 'preserve-3d', perspective: '1000px' }}
            onClick={onClick}
        >
            <div className={`
                relative w-full h-full px-5 py-6 rounded-3xl text-white shadow-xl flex flex-col justify-between 
                grad-orange
                transition-all duration-300 group-hover:shadow-2xl group-hover:scale-[1.02]
                overflow-hidden
                min-h-[200px]
            `}>
                {/* Decorative circles - warm tone for cash */}
                <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/20 blur-2xl"></div>
                <div className="absolute -right-4 top-12 w-24 h-24 rounded-full bg-white/10"></div>
                <div className="absolute right-8 top-20 w-16 h-16 rounded-full bg-white/10"></div>

                {/* Top */}
                <div className="relative z-10 flex justify-between items-start mb-6">
                    <div>
                        <p className="font-bold text-base text-white mb-0.5">{card.bankName}</p>
                        <p className="text-xs text-white/70">Cash Account</p>
                    </div>
                    <div className="bg-white/20 p-2 rounded-full">
                        <CashIcon className="w-6 h-6 text-white" />
                    </div>
                </div>

                {/* Middle */}
                <div className="relative z-10 mb-4">
                    <p className="text-sm text-white/80 mb-2">Available Balance</p>
                    <p className="text-3xl font-bold tracking-tight text-white">{formatCurrency(card.balance)}</p>
                </div>

                {/* Bottom */}
                <div className="relative z-10 text-sm">
                    <p className="text-xs text-white/70 mb-1">Account Holder</p>
                    <p className="font-semibold text-sm text-white">{card.cardHolderName}</p>
                </div>

                {/* Actions on hover */}
                <div className="absolute top-3 right-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 non-printable z-20">
                    <button onClick={(e) => { e.stopPropagation(); onTopUp(); }} className="bg-white/20 hover:bg-white/30 text-white rounded-full p-2 backdrop-blur-sm" title="Top-up Tunai"><ArrowUpIcon className="w-4 h-4" /></button>
                    <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="bg-white/20 hover:bg-white/30 text-white rounded-full p-2 backdrop-blur-sm" title="Edit"><PencilIcon className="w-4 h-4" /></button>
                </div>
            </div>

            {connectedPockets.length > 0 && (
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-[90%] bg-brand-input p-2 rounded-lg text-xs shadow-md opacity-0 group-hover:opacity-100 group-hover:-bottom-5 transition-all duration-300">
                    <p className="font-semibold text-brand-text-secondary text-center">Terhubung ke: {connectedPockets.map(p => p.name).join(', ')}</p>
                </div>
            )}
        </div>
    );
};
