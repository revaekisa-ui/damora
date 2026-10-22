import React, { useState } from 'react';
import { ChevronDown, ChevronUp, SlidersHorizontal, BarChart3 } from 'lucide-react';

export interface MobileCollapsibleSectionProps {
    title: string;
    subtitle?: string;
    badge?: string | number;
    icon?: React.ReactNode;
    defaultOpen?: boolean;
    actionLabelOpen?: string;
    actionLabelClose?: string;
    variant?: 'filter' | 'stats' | 'section' | 'card';
    className?: string;
    children: React.ReactNode;
}

/**
 * Progressive Disclosure wrapper for Mobile (< 768px).
 * - On Desktop (`>= 768px` / `md:`): renders `children` directly without any extra wrapper UI.
 * - On Mobile (`< 768px`): collapses `children` behind a clean, scannable "Lihat / Tutup" bar.
 */
export const MobileCollapsibleSection: React.FC<MobileCollapsibleSectionProps> = ({
    title,
    subtitle,
    badge,
    icon,
    defaultOpen = false,
    actionLabelOpen = 'Lihat',
    actionLabelClose = 'Tutup',
    variant = 'section',
    className = '',
    children,
}) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    const defaultIcon =
        variant === 'filter' ? (
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#5D87FF]" />
        ) : variant === 'stats' ? (
            <BarChart3 className="w-3.5 h-3.5 text-[#5D87FF]" />
        ) : (
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#5D87FF]" />
        );

    return (
        <>
            {/* Desktop: 100% unchanged */}
            <div className={`hidden md:block ${className}`}>{children}</div>

            {/* Mobile: Progressive disclosure */}
            <div className={`md:hidden ${className}`}>
                <div className="bg-white rounded-xl border border-[#EAEFF4] px-3 py-2 shadow-[0_2px_8px_rgba(0,0,0,0.03)] flex items-center justify-between gap-2">
                    <button
                        type="button"
                        onClick={() => setIsOpen(prev => !prev)}
                        className="flex items-center gap-2 min-w-0 flex-1 text-left cursor-pointer"
                    >
                        <div className="w-6 h-6 rounded-lg grad-brand text-white flex items-center justify-center shrink-0">
                            {icon || defaultIcon}
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                                <span className="text-[11px] font-bold text-[#2A3547] truncate">
                                    {title}
                                </span>
                                {badge !== undefined && badge !== '' && badge !== 0 && (
                                    <span className="px-1.5 py-0.2 rounded-full bg-[#5D87FF]/15 text-[#5D87FF] text-[9px] font-bold shrink-0">
                                        {badge}
                                    </span>
                                )}
                            </div>
                            {subtitle && (
                                <p className="text-[9px] text-[#5A6A85] truncate leading-tight mt-0.5">
                                    {subtitle}
                                </p>
                            )}
                        </div>
                    </button>

                    <button
                        type="button"
                        onClick={() => setIsOpen(prev => !prev)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold inline-flex items-center gap-1 transition-all shrink-0 cursor-pointer ${
                            isOpen
                                ? 'bg-[#F4F6F9] text-[#5A6A85] border border-[#EAEFF4]'
                                : 'bg-brand-accent text-white hover:bg-brand-accent-hover'
                        }`}
                    >
                        <span>{isOpen ? actionLabelClose : actionLabelOpen}</span>
                        {isOpen ? (
                            <ChevronUp className="w-3 h-3" />
                        ) : (
                            <ChevronDown className="w-3 h-3" />
                        )}
                    </button>
                </div>

                {isOpen && (
                    <div className="mt-2 animate-fade-in">
                        {children}
                    </div>
                )}
            </div>
        </>
    );
};

export interface MobileExpandableExtraProps {
    labelOpen?: string;
    labelClose?: string;
    defaultOpen?: boolean;
    headerRight?: React.ReactNode;
    children: React.ReactNode;
}

/**
 * Compact disclosure for secondary details inside a mobile card.
 * Keeps the card clean (only primary info visible) until the user clicks "Lihat Detail".
 */
export const MobileExpandableExtra: React.FC<MobileExpandableExtraProps> = ({
    labelOpen = 'Lihat Detail',
    labelClose = 'Sembunyikan',
    defaultOpen = false,
    headerRight,
    children,
}) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="mt-1.5 pt-1 border-t border-[#EAEFF4]/80">
            <div className="flex items-center justify-between gap-2">
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsOpen(prev => !prev);
                    }}
                    className="inline-flex items-center gap-1 text-[10px] font-bold text-[#5D87FF] hover:text-[#4570EA] py-0.5 px-1 -ml-1 rounded-md hover:bg-[#ECF2FF]/60 transition-colors cursor-pointer leading-tight"
                >
                    <span>{isOpen ? labelClose : labelOpen}</span>
                    {isOpen ? (
                        <ChevronUp className="w-3 h-3" />
                    ) : (
                        <ChevronDown className="w-3 h-3" />
                    )}
                </button>
                {headerRight && (
                    <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                        {headerRight}
                    </div>
                )}
            </div>

            {isOpen && (
                <div className="mt-1.5 pt-1 border-t border-dashed border-[#EAEFF4] animate-fade-in">
                    {children}
                </div>
            )}
        </div>
    );
};
