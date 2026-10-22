import React from 'react';
import { Card, FinancialPocket } from '../../../types';
import { PencilIcon, Trash2Icon } from '../../../constants';
import { formatCurrency } from '../../../utils/currency';

interface CardWidgetProps {
    card: Card;
    onEdit: () => void;
    onDelete: () => void;
    onClick: () => void;
    connectedPockets: FinancialPocket[];
}

export const CardWidget: React.FC<CardWidgetProps> = ({ card, onEdit, onDelete, onClick, connectedPockets }) => {
    const gradient = card.colorGradient || 'from-slate-200 to-slate-400';
    const isLight = gradient.includes('slate-100');
    const textColor = isLight ? 'text-gray-800' : 'text-white';

    const ChipIcon = () => (
        <svg className="w-10 h-8" viewBox="0 0 40 28" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="40" height="28" rx="4" fill="#D1D5DB" />
            <rect x="4" y="4" width="32" height="20" rx="2" fill="#FBBF24" />
            <path d="M4 14H18" stroke="#92400E" strokeWidth="2" />
            <path d="M22 14H36" stroke="#92400E" strokeWidth="2" />
            <path d="M20 4V12" stroke="#92400E" strokeWidth="2" />
            <path d="M20 16V24" stroke="#92400E" strokeWidth="2" />
        </svg>
    );
    
    const VisaLogo = () => <svg height="24px" viewBox="0 0 1000 310" className={`${isLight ? 'fill-black/70' : 'fill-white/90'}`}><path d="M783 310h101l-123-310H643l-89 220-22-220H414L291 310h103l23-60h100l15 60zM520 125l31 82 31-82h-62zM389 125l-63 158-20-44-41-114h-100l170 310h124L741 0H638l-49 125z" /></svg>;
    
    const MastercardLogo = () => (
        <svg className="w-12 h-8" viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="18" cy="16" r="10" fill="#EB001B" opacity="0.9" />
            <circle cx="30" cy="16" r="10" fill="#F79E1B" opacity="0.9" />
        </svg>
    );

    return (
        <div
            className="group relative w-full cursor-pointer"
            style={{ transformStyle: 'preserve-3d', perspective: '1000px' }}
            onClick={onClick}
        >
            <div className={`
                relative w-full h-full px-3 py-4 sm:px-5 sm:py-6 rounded-2xl sm:rounded-3xl ${textColor} shadow-xl hover:shadow-2xl border border-white/20 flex flex-col justify-between 
                bg-gradient-to-br ${gradient} 
                transition-all duration-300 group-hover:shadow-2xl group-hover:scale-[1.02]
                overflow-hidden
                aspect-[1.586] min-h-[190px] sm:aspect-auto sm:min-h-[250px]
            `}>
                {/* Decorative circles */}
                <div className="absolute -right-12 -top-12 w-40 h-40 rounded-full bg-white/10 blur-2xl pointer-events-none"></div>
                <div className="absolute -left-12 -bottom-12 w-40 h-40 rounded-full bg-black/15 blur-2xl pointer-events-none"></div>
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 pointer-events-none"></div>
                <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.05]" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <defs>
                        <pattern id={`card-pattern-${card.id}`} width="36" height="36" patternUnits="userSpaceOnUse">
                            <path d="M0 18 Q 9 4, 18 18 T 36 18" fill="none" stroke="#fff" strokeWidth="0.8" />
                            <circle cx="18" cy="18" r="12" fill="none" stroke="#fff" strokeWidth="0.5" strokeDasharray="2 2" />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill={`url(#card-pattern-${card.id})`} />
                </svg>

                {/* Card Top */}
                <div className="relative z-10 flex justify-between items-start gap-2 mb-3 sm:mb-6">
                    <div className="min-w-0">
                        <p className="font-bold text-sm sm:text-base mb-0.5 truncate">{card.bankName}</p>
                        <p className="text-[10px] sm:text-xs opacity-75 truncate">{card.cardType}</p>
                    </div>
                    <div className="relative flex items-center gap-2 flex-shrink-0">
                        {card.bankName.toUpperCase() === 'VISA' ? <VisaLogo /> :
                            card.bankName.toLowerCase().includes('master') ? <MastercardLogo /> :
                                <ChipIcon />}
                        <div className="relative flex items-center gap-1 non-printable sm:absolute sm:top-3 sm:right-3 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300 z-20">
                            <button type="button" title="Edit Kartu" aria-label="Edit Kartu" onClick={(e) => { e.stopPropagation(); onEdit(); }} className="rounded-full p-2 shadow-sm"><PencilIcon className="w-4 h-4" /></button>
                            <button type="button" title="Hapus Kartu" aria-label="Hapus Kartu" onClick={(e) => { e.stopPropagation(); if (window.confirm('Apakah Anda yakin ingin menghapus kartu ini?')) onDelete(); }} className="rounded-full p-2 shadow-sm"><Trash2Icon className="w-4 h-4" /></button>
                        </div>
                    </div>
                </div>

                {/* Card Middle - Card Number */}
                <div className="relative z-10 my-2 sm:my-3">
                    <p className="font-mono text-[10px] sm:text-sm tracking-[0.08em] sm:tracking-[0.2em] text-white/80 drop-shadow-sm mb-1.5 sm:mb-2">
                        {card.lastFourDigits.padStart(4, '0')} •••• •••• {card.lastFourDigits.padStart(4, '0')}
                    </p>
                    <span className="text-[9px] sm:text-[10px] uppercase tracking-widest text-white/70 font-semibold block">Saldo Kartu</span>
                    <p className="text-xl sm:text-3xl font-extrabold tracking-tight text-white drop-shadow-md">{formatCurrency(card.balance)}</p>
                </div>

                {/* Card Bottom */}
                <div className="relative z-10 flex justify-between items-end text-sm">
                    <div className="min-w-0 flex-1">
                        <p className="text-[8px] sm:text-xs uppercase tracking-wider opacity-60 mb-1">Card Holder</p>
                        <p className="font-semibold text-xs sm:text-sm truncate">{card.cardHolderName}</p>
                    </div>
                    {card.expiryDate && (
                        <div className="text-right flex-shrink-0">
                            <p className="text-[8px] sm:text-xs uppercase tracking-wider opacity-60 mb-1">Expiry</p>
                            <p className="font-semibold text-xs sm:text-sm">{card.expiryDate}</p>
                        </div>
                    )}
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
