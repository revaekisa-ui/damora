/**
 * TeamAnalyticsTab
 *
 * Tab 4: Analitik & Performa
 * Three widgets: Komposisi, Performa Kerja, Tren Pembayaran.
 * Identical markup and inline calculation logic to original.
 */

import React from 'react';
import { TeamMember, TeamPaymentRecord } from '../../../types';
import { formatCurrency } from '../utils/teamUtils';
import { UsersIcon, HistoryIcon, DollarSignIcon, StarIcon } from '../../../constants';

interface OverallStats {
    totalPayout: string;
    totalProjectsHandled: number;
    avgRating: string;
}

interface TeamAnalyticsTabProps {
    teamMembers: TeamMember[];
    teamPaymentRecords: TeamPaymentRecord[];
    teamStats: OverallStats;
}

const TeamAnalyticsTab: React.FC<TeamAnalyticsTabProps> = ({
    teamMembers,
    teamPaymentRecords,
    teamStats,
}) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
            {/* Widget 1: Komposisi */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-[0_9px_17.5px_rgba(0,0,0,0.05)] border border-slate-200 flex flex-col justify-between">
                <div>
                    <h3 className="text-xs sm:text-sm font-bold text-[#2A3547] pb-3 mb-4 border-b border-slate-200 flex items-center gap-2">
                        <UsersIcon className="w-4 h-4 sm:w-5 sm:h-5 text-brand-accent" /> Komposisi Tim & Vendor
                    </h3>
                    <div className="space-y-4">
                        {(() => {
                            const timCount = teamMembers.filter(m => m.category !== 'Vendor').length;
                            const vendorCount = teamMembers.filter(m => m.category === 'Vendor').length;
                            const total = timCount + vendorCount || 1;
                            return (
                                <>
                                    <div className="p-3 rounded-xl bg-[#F8FAFC] border border-slate-200 space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[#5A6A85] text-xs font-bold uppercase tracking-wider">
                                                Tim Internal
                                            </span>
                                            <span className="text-base sm:text-lg font-black text-brand-accent">{timCount}</span>
                                        </div>
                                        <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                                            <div
                                                className="h-full rounded-full"
                                                style={{
                                                    width: `${(timCount / total) * 100}%`,
                                                    backgroundColor: '#2563EB',
                                                }}
                                            />
                                        </div>
                                    </div>
                                    <div className="p-3 rounded-xl bg-[#F8FAFC] border border-slate-200 space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[#5A6A85] text-xs font-bold uppercase tracking-wider">
                                                Vendor Eksternal
                                            </span>
                                            <span className="text-base sm:text-lg font-black text-[#EA580C]">{vendorCount}</span>
                                        </div>
                                        <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                                            <div
                                                className="h-full rounded-full"
                                                style={{
                                                    width: `${(vendorCount / total) * 100}%`,
                                                    backgroundColor: '#EA580C',
                                                }}
                                            />
                                        </div>
                                    </div>
                                </>
                            );
                        })()}
                    </div>
                </div>
            </div>

            {/* Widget 2: Performa Kerja */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-[0_9px_17.5px_rgba(0,0,0,0.05)] border border-slate-200">
                <h3 className="text-xs sm:text-sm font-bold text-[#2A3547] pb-3 mb-4 border-b border-slate-200 flex items-center gap-2">
                    <HistoryIcon className="w-4 h-4 sm:w-5 sm:h-5 text-brand-accent" /> Ringkasan Performa
                </h3>
                <div className="space-y-3">
                    <div className="p-3 bg-[#F8FAFC] rounded-xl border border-slate-200 flex justify-between items-center">
                        <div>
                            <p className="text-[10px] text-[#5A6A85] font-bold uppercase tracking-wider">
                                Total Payout
                            </p>
                            <p className="text-base sm:text-lg font-black text-[#2A3547] mt-0.5">
                                {teamStats.totalPayout}
                            </p>
                        </div>
                        <DollarSignIcon className="w-5 h-5 sm:w-6 sm:h-6 text-brand-accent" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-[#F8FAFC] rounded-xl border border-slate-200">
                            <p className="text-[10px] text-[#5A6A85] font-bold uppercase tracking-wider">
                                Acara
                            </p>
                            <p className="text-base sm:text-lg font-black text-[#2A3547] mt-0.5">
                                {teamStats.totalProjectsHandled}
                            </p>
                        </div>
                        <div className="p-3 bg-[#F8FAFC] rounded-xl border border-slate-200">
                            <p className="text-[10px] text-[#5A6A85] font-bold uppercase tracking-wider">
                                Rating
                            </p>
                            <div className="flex items-center gap-1 mt-0.5">
                                <p className="text-base sm:text-lg font-black text-amber-700">{teamStats.avgRating}</p>
                                <StarIcon className="w-3.5 h-3.5 text-amber-500 fill-current" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Widget 3: Tren Pembayaran */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-[0_9px_17.5px_rgba(0,0,0,0.05)] border border-slate-200 md:col-span-2 xl:col-span-1">
                <div className="flex justify-between items-start pb-3 mb-4 border-b border-slate-200 gap-2">
                    <h3 className="text-xs sm:text-sm font-bold text-[#2A3547] flex items-center gap-2">
                        <DollarSignIcon className="w-4 h-4 sm:w-5 sm:h-5 text-brand-accent" /> Tren Pembayaran
                    </h3>
                    <div className="text-right">
                        <p className="text-[10px] text-[#5A6A85] font-bold uppercase">
                            6 bulan terakhir
                        </p>
                        <p className="text-xs sm:text-sm font-black text-brand-accent">
                            {(() => {
                                const now = new Date();
                                const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
                                const total = teamPaymentRecords
                                    .filter(r => new Date(r.date) >= sixMonthsAgo)
                                    .reduce((sum, r) => sum + r.totalAmount, 0);
                                return formatCurrency(total);
                            })()}
                        </p>
                    </div>
                </div>
                <div className="h-24 sm:h-28 flex items-end gap-2 p-3 rounded-xl bg-[#F8FAFC] border border-slate-200">
                    {(() => {
                        const now = new Date();
                        const months: {
                            name: string;
                            year: number;
                            month: number;
                            total: number;
                        }[] = [];
                        for (let i = 5; i >= 0; i--) {
                            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                            months.push({
                                name: d.toLocaleString('id-ID', { month: 'short' }),
                                year: d.getFullYear(),
                                month: d.getMonth(),
                                total: 0,
                            });
                        }
                        teamPaymentRecords.forEach(r => {
                            const rd = new Date(r.date);
                            const m = months.find(
                                mo => mo.month === rd.getMonth() && mo.year === rd.getFullYear(),
                            );
                            if (m) m.total += r.totalAmount;
                        });
                        const maxVal = Math.max(...months.map(m => m.total), 1);
                        return months.map((m, idx) => (
                            <div key={idx} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                                <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity bg-[#2A3547] text-white text-[9px] py-1 px-2 rounded-lg shadow-md z-20 whitespace-nowrap font-bold">
                                    {formatCurrency(m.total)}
                                </div>
                                <div
                                    className="w-full rounded-t-md transition-all duration-300"
                                    style={{
                                        height: `${Math.max((m.total / maxVal) * 100, 8)}%`,
                                        background:
                                            m.total > 0
                                                ? 'linear-gradient(to top, #2563EB, #818cf8)'
                                                : '#CBD5E1',
                                    }}
                                />
                                <span className="text-[9px] font-bold text-[#5A6A85] mt-1.5">
                                    {m.name}
                                </span>
                            </div>
                        ));
                    })()}
                </div>
            </div>
        </div>
    );
};

export default TeamAnalyticsTab;
