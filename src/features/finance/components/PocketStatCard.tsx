import React from 'react';
import { Wifi, ArrowUp, ArrowDown } from 'lucide-react';
import { FinancialPocket, PocketType } from '../../../types';
import { formatCurrency } from '../../../utils/currency';
import { PiggyBankIcon, LockIcon, UsersIcon, ClipboardListIcon, StarIcon, PencilIcon, Trash2Icon } from '../../../constants';

const pocketIcons: Record<string, React.ReactNode> = {
    'piggy-bank': <PiggyBankIcon className="w-4 h-4" />,
    'lock': <LockIcon className="w-4 h-4" />,
    'users': <UsersIcon className="w-4 h-4" />,
    'clipboard-list': <ClipboardListIcon className="w-4 h-4" />,
    'star': <StarIcon className="w-4 h-4" />
};

// Deterministic 16-digit card number derived from pocket ID or name
const formatPocketCardNumber = (id: string) => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
        hash = (hash << 5) - hash + id.charCodeAt(i);
        hash |= 0;
    }
    const abs = Math.abs(hash);
    const p1 = (4100 + (abs % 800)).toString();
    const p4 = (abs % 10000).toString().padStart(4, '0');
    return `${p1} •••• •••• ${p4}`;
};

// Realistic EMV Gold Smart Chip
const GoldChip: React.FC = () => (
    <div className="relative w-10 h-7 rounded-md bg-gradient-to-tr from-amber-400 via-yellow-200 to-amber-500 p-[1px] shadow-sm overflow-hidden flex-shrink-0">
        <div className="w-full h-full rounded-[5px] bg-gradient-to-br from-amber-300 via-amber-400 to-yellow-600 relative flex items-center justify-center border border-amber-600/30">
            <div className="absolute inset-x-0 h-[1px] bg-amber-800/40 top-1/2 -translate-y-1/2" />
            <div className="absolute inset-y-0 w-[1px] bg-amber-800/40 left-1/3" />
            <div className="absolute inset-y-0 w-[1px] bg-amber-800/40 right-1/3" />
            <div className="w-3.5 h-2.5 rounded-[2px] border border-amber-800/50 bg-amber-400/50 z-10 shadow-inner" />
        </div>
    </div>
);

// Contactless / NFC waves
const ContactlessIcon: React.FC = () => (
    <Wifi className="hidden w-4 h-4 text-white/80 opacity-80 rotate-90 sm:block" />
);

// Payment Network Emblem
const CardBrandLogo: React.FC = () => (
    <div className="flex items-center gap-1 bg-black/25 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/15 shadow-inner">
        <div className="flex -space-x-1.5">
            <div className="w-3.5 h-3.5 rounded-full bg-[#EB001B] opacity-90 shadow-xs" />
            <div className="w-3.5 h-3.5 rounded-full bg-[#F79E1B] opacity-90 shadow-xs" />
        </div>
        <span className="text-[8px] font-black tracking-widest text-white/95 uppercase">DEBIT</span>
    </div>
);

export interface PocketStatCardProps {
    pocket: FinancialPocket;
    amount: number;
    sourceCardName?: string | null;
    progressPercent: number;
    onClick: () => void;
    onWithdraw: () => void;
    onDeposit: () => void;
    onEdit?: () => void;
    onDelete?: () => void;
    headerActions?: React.ReactNode;
}

export const PocketStatCard: React.FC<PocketStatCardProps> = ({
    pocket,
    amount,
    sourceCardName,
    progressPercent,
    onClick,
    onWithdraw,
    onDeposit,
    onEdit,
    onDelete,
    headerActions
}) => {
    // Luxury bank-card color themes based on pocket type
    const gradientByType: Record<string, string> = {
        [PocketType.SAVING]: 'from-[#064e3b] via-[#065f46] to-[#047857]', // Emerald Wealth
        [PocketType.EXPENSE]: 'from-[#881337] via-[#9f1239] to-[#be123c]', // Ruby Crimson
        [PocketType.LOCKED]: 'from-[#0f172a] via-[#1e3a8a] to-[#1d4ed8]', // Midnight Sapphire
        [PocketType.SHARED]: 'from-[#3b0764] via-[#581c87] to-[#7c3aed]', // Royal Amethyst
    };

    const gradient = gradientByType[pocket.type] || 'from-[#1e293b] via-[#334155] to-[#475569]';
    const progress = Math.max(0, Math.min(progressPercent, 100));
    const cardNumber = formatPocketCardNumber(pocket.id || pocket.name);

    return (
        <div
            className="group relative w-full cursor-pointer select-none transition-transform duration-300 hover:scale-[1.015]"
            onClick={onClick}
        >
            {/* Bank Card Body */}
            <div
                className={`
                    relative w-full rounded-2xl p-3 text-white shadow-xl hover:shadow-2xl sm:rounded-3xl sm:p-5
                    border border-white/20 bg-gradient-to-br ${gradient}
                    overflow-hidden transition-all duration-300 flex flex-col justify-between
                    min-h-[240px] sm:min-h-[250px]
                `}
            >
                {/* Hologram / Specular shine overlays */}
                <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-white/10 blur-2xl pointer-events-none" />
                <div className="absolute -left-12 -bottom-12 w-48 h-48 rounded-full bg-black/20 blur-2xl pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 pointer-events-none" />

                {/* Subtle bank card security pattern */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-5" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <pattern id={`pkt-pat-${pocket.id}`} width="36" height="36" patternUnits="userSpaceOnUse">
                            <path d="M0 18 Q 9 4, 18 18 T 36 18" fill="none" stroke="#fff" strokeWidth="0.8" />
                            <circle cx="18" cy="18" r="12" fill="none" stroke="#fff" strokeWidth="0.5" strokeDasharray="2 2" />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill={`url(#pkt-pat-${pocket.id})`} />
                </svg>

                {/* 1. Card Top Row: Chip, Contactless, Badge & Actions */}
                <div className="relative z-10 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                        <GoldChip />
                        <ContactlessIcon />
                        {/* Pocket Icon Pill */}
                        <div className="hidden w-7 h-7 rounded-xl bg-white/15 backdrop-blur-md items-center justify-center text-white/90 border border-white/15 shadow-inner sm:flex" title={pocket.name}>
                            {pocketIcons[pocket.icon] || <PiggyBankIcon className="w-4 h-4" />}
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                        {/* Pocket Type Tag */}
                        <span className="text-[8px] sm:text-[10px] font-bold tracking-wider uppercase px-1.5 sm:px-2.5 py-0.5 rounded-full bg-black/25 backdrop-blur-md border border-white/15 text-white/90 shadow-inner">
                            {pocket.type}
                        </span>

                        {/* Edit & Delete Action Buttons */}
                        {headerActions ? (
                            headerActions
                        ) : (
                            <div className="flex items-center gap-1 non-printable">
                                {onEdit && (
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); onEdit(); }}
                                        title="Edit Kantong"
                                        aria-label="Edit Kantong"
                                        className="p-1.5 rounded-lg shadow-sm transition-all active:scale-95"
                                    >
                                        <PencilIcon className="w-3.5 h-3.5" />
                                    </button>
                                )}
                                {onDelete && (
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); onDelete(); }}
                                        title="Hapus Kantong"
                                        aria-label="Hapus Kantong"
                                        className="p-1.5 rounded-lg shadow-sm transition-all active:scale-95"
                                    >
                                        <Trash2Icon className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* 2. Card Middle: Virtual Account Number & Balance */}
                <div className="relative z-10 my-1 sm:my-3">
                    {/* Bank Card Monospace Number */}
                    <p className="font-mono text-xs sm:text-sm tracking-[0.1em] sm:tracking-[0.25em] text-white/80 drop-shadow-sm mb-1">
                        {cardNumber}
                    </p>

                    <div className="flex items-baseline justify-between gap-2">
                        <div>
                            <span className="text-[10px] uppercase tracking-widest text-white/70 font-semibold block">
                                Saldo Kantong
                            </span>
                            <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white drop-shadow-md">
                                {formatCurrency(amount)}
                            </p>
                        </div>
                    </div>

                    {/* Goal Progress Bar if set */}
                    {pocket.goalAmount ? (
                        <div className="mt-1 sm:mt-2.5">
                            <div className="flex items-center justify-between text-[10px] text-white/85 font-medium mb-1">
                                <span>Target: {formatCurrency(pocket.goalAmount)}</span>
                                <span className="font-bold">{Math.round(progress)}%</span>
                            </div>
                            <div className="w-full bg-black/25 backdrop-blur-sm rounded-full h-1.5 overflow-hidden p-[1px] border border-white/10">
                                <div
                                    className="bg-white rounded-full h-full transition-all duration-500 shadow-sm"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </div>
                    ) : null}
                </div>

                {/* 3. Card Bottom: Holder Name, Linked Source & Network Logo */}
                <div className="relative z-10 flex items-end justify-between gap-2 mb-1 sm:mb-3">
                    <div className="min-w-0 flex-1">
                        <span className="text-[8px] uppercase tracking-wider text-white/60 font-semibold block">
                            Pocket Name
                        </span>
                        <p className="font-bold text-sm text-white tracking-wide uppercase truncate drop-shadow-sm">
                            {pocket.name}
                        </p>
                        {sourceCardName ? (
                            <p className="text-[10px] text-white/80 truncate flex items-center gap-1 mt-0.5">
                                <span className="opacity-70">Terhubung:</span>
                                <span className="font-medium underline decoration-white/30">{sourceCardName}</span>
                            </p>
                        ) : null}
                    </div>

                    <div className="flex flex-col items-end flex-shrink-0">
                        {pocket.lockEndDate ? (
                            <span className="text-[9px] font-mono text-amber-300 font-semibold mb-1">
                                Kunci: {pocket.lockEndDate}
                            </span>
                        ) : (
                            <span className="text-[8px] font-mono tracking-wider text-white/60 mb-1">
                                VALID THRU: 12/29
                            </span>
                        )}
                        <CardBrandLogo />
                    </div>
                </div>

                {/* 4. Action Dock: Tarik Dana & Setor Dana */}
                <div className="relative z-10 flex gap-2 pt-1 sm:pt-2.5 border-t border-white/15 non-printable">
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onWithdraw(); }}
                        className="flex-1 rounded-xl bg-white/15 hover:bg-white/25 active:scale-[0.98] text-xs font-bold py-2 transition-all flex items-center justify-center gap-1.5 backdrop-blur-sm border border-white/10 shadow-xs"
                    >
                        <ArrowUp className="w-3.5 h-3.5" />
                        <span>Tarik Dana</span>
                    </button>
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onDeposit(); }}
                        className="flex-1 rounded-xl bg-white text-slate-900 hover:bg-white/90 active:scale-[0.98] text-xs font-bold py-2 transition-all flex items-center justify-center gap-1.5 shadow-md"
                    >
                        <ArrowDown className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Setor Dana</span>
                    </button>
                </div>
            </div>
        </div>
    );
};
