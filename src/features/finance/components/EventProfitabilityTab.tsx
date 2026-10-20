import React from 'react';
import { Profile, Project } from '../../../types';
import StatCard from '../../../shared/ui/StatCard';
import { formatCurrency } from '../../../utils/currency';
import {
    DollarSignIcon,
    UsersIcon,
    TrendingUpIcon,
    TargetIcon,
    DownloadIcon,
    PrinterIcon
} from '../../../constants';
import { MobileCollapsibleSection } from '../../../components/ui/MobileProgressiveDisclosure';

interface ProfitReportFilters {
    year: number;
    month: number;
}

interface ProfitReportMetrics {
    totalProfit: number;
    avgProfit: number;
    mostProfitableClient: string;
    profitableProjectsCount: number;
}

interface EventProfitabilityTabProps {
    profitReportFilters: ProfitReportFilters;
    setProfitReportFilters: React.Dispatch<React.SetStateAction<ProfitReportFilters>>;
    profitReportMetrics: ProfitReportMetrics;
    projectProfitabilityData: any[];
    projects: Project[];
    profile: Profile;
    handleDownloadProfitReportCSV: () => void;
    handleDownloadProfitReportExcel: () => void;
}

const EventProfitabilityTab: React.FC<EventProfitabilityTabProps> = ({
    profitReportFilters,
    setProfitReportFilters,
    profitReportMetrics,
    projectProfitabilityData,
    projects,
    profile,
    handleDownloadProfitReportCSV,
    handleDownloadProfitReportExcel
}) => {
    const monthOptions = Array.from({ length: 12 }, (_, i) => ({
        value: i,
        name: new Date(0, i).toLocaleString('id-ID', { month: 'long' })
    }));

    const yearOptions: number[] = Array.from(
        new Set<number>(projects.map(p => new Date(p.date).getFullYear()))
    ).sort((a: number, b: number) => b - a);

    const currentMonthName = monthOptions.find(m => m.value === profitReportFilters.month)?.name;

    return (
        <div className="space-y-4 sm:space-y-6 printable-area widget-animate">
            <MobileCollapsibleSection
                title="Filter Periode Laba"
                subtitle={`${currentMonthName} ${profitReportFilters.year}`}
                variant="filter"
                actionLabelOpen="Filter"
                actionLabelClose="Tutup"
                className="non-printable"
            >
                <div className="bg-brand-surface p-3 md:p-4 rounded-xl grid grid-cols-2 md:flex gap-2 md:gap-4 items-center non-printable border border-brand-border">
                    <h4 className="col-span-2 md:col-span-1 text-sm font-semibold text-gradient md:whitespace-nowrap">Filter Laporan Laba:</h4>
                    <select
                        name="year"
                        value={profitReportFilters.year}
                        onChange={e => setProfitReportFilters(p => ({ ...p, year: Number(e.target.value) }))}
                        className="input-field !rounded-lg !border p-2 text-sm w-full min-w-0 md:w-auto"
                    >
                        {yearOptions.map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                    <select
                        name="month"
                        value={profitReportFilters.month}
                        onChange={e => setProfitReportFilters(p => ({ ...p, month: Number(e.target.value) }))}
                        className="input-field !rounded-lg !border p-2 text-sm w-full min-w-0 md:w-auto"
                    >
                        {monthOptions.map(m => (
                            <option key={m.value} value={m.value}>{m.name}</option>
                        ))}
                    </select>
                    <div className="col-span-2 flex items-center gap-2 md:ml-auto">
                        <button
                            onClick={handleDownloadProfitReportCSV}
                            className="button-secondary inline-flex flex-1 items-center justify-center gap-1.5 px-2 md:flex-none md:gap-2"
                        >
                            <DownloadIcon className="w-4 h-4 flex-shrink-0" />Unduh CSV
                        </button>
                        <button
                            onClick={handleDownloadProfitReportExcel}
                            className="button-secondary inline-flex flex-1 items-center justify-center gap-1.5 px-2 md:flex-none md:gap-2"
                        >
                            <DownloadIcon className="w-4 h-4 flex-shrink-0" />Unduh Excel
                        </button>
                        <button
                            onClick={() => window.print()}
                            className="button-primary inline-flex flex-1 items-center justify-center gap-1.5 px-2 md:flex-none md:gap-2"
                        >
                            <PrinterIcon className="w-4 h-4 flex-shrink-0" />Cetak PDF
                        </button>
                    </div>
                </div>
            </MobileCollapsibleSection>

            {/* Mobile summary + list */}
            <div className="md:hidden space-y-3">
                <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-2xl bg-white/5 border border-brand-border p-3">
                        <p className="text-[11px] text-brand-text-secondary">Total Laba</p>
                        <p className={`font-semibold ${profitReportMetrics.totalProfit >= 0 ? 'text-[#166534]' : 'text-[#DC2626]'}`}>{formatCurrency(profitReportMetrics.totalProfit)}</p>
                    </div>
                    <div className="rounded-2xl bg-white/5 border border-brand-border p-3">
                        <p className="text-[11px] text-brand-text-secondary">Avg/Acara</p>
                        <p className={`font-semibold ${profitReportMetrics.avgProfit >= 0 ? 'text-[#166534]' : 'text-[#DC2626]'}`}>{formatCurrency(profitReportMetrics.avgProfit)}</p>
                    </div>
                </div>
                <div className="rounded-xl bg-brand-surface border border-brand-border overflow-hidden">
                    <h4 className="px-3 py-2 font-semibold border-b border-brand-border">Laba per Klien</h4>
                    <div className="overflow-x-auto">
                        <table className="w-full table-fixed border-collapse text-left">
                            <thead className="bg-brand-bg/70 text-brand-text-secondary">
                                <tr>
                                    <th className="border-r border-brand-border !px-2 !py-2 text-[10px]">Klien / Rincian</th>
                                    <th className="w-[104px] !px-2 !py-2 text-right text-[10px]">Laba</th>
                                </tr>
                            </thead>
                            <tbody>
                                {projectProfitabilityData.map(d => (
                                    <tr key={d!.clientId} className="border-t border-brand-border">
                                        <td className="border-r border-brand-border !px-2 !py-2 align-top">
                                            <p className="text-[11px] font-medium text-brand-text-primary break-words">{d!.clientName}</p>
                                            <p className="text-[10px] text-brand-text-secondary break-words">
                                                <span className="text-[#166534]">Income {formatCurrency(d!.totalIncome)}</span> • <span className="text-[#DC2626]">Biaya {formatCurrency(d!.totalCost)}</span>
                                            </p>
                                        </td>
                                        <td className={`!px-2 !py-2 align-top text-right whitespace-nowrap text-[10px] font-semibold ${d!.profit >= 0 ? 'text-[#166534]' : 'text-[#DC2626]'}`}>
                                            {formatCurrency(d!.profit)}
                                        </td>
                                    </tr>
                                ))}
                                {projectProfitabilityData.length === 0 && (
                                    <tr>
                                        <td colSpan={2} className="!px-3 !py-5 text-center text-xs text-brand-text-secondary">Tidak ada data untuk periode ini.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Desktop summary + printable */}
            <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 gap-4 non-printable">
                <StatCard
                    icon={<DollarSignIcon className="w-6 h-6" />}
                    title="Total Laba Periode Ini"
                    value={formatCurrency(profitReportMetrics.totalProfit)}
                    valueClassName={profitReportMetrics.totalProfit >= 0 ? '!text-[#166534]' : '!text-[#DC2626]'}
                    colorVariant="blue"
                />
                <StatCard
                    icon={<UsersIcon className="w-6 h-6" />}
                    title="Klien Paling Profit"
                    value={profitReportMetrics.mostProfitableClient}
                    colorVariant="green"
                />
                <StatCard
                    icon={<TrendingUpIcon className="w-6 h-6" />}
                    title="Jumlah Acara Profit"
                    value={`${profitReportMetrics.profitableProjectsCount} dari ${projectProfitabilityData.length}`}
                    colorVariant="orange"
                />
                <StatCard
                    icon={<TargetIcon className="w-6 h-6" />}
                    title="Rata-rata Laba/Acara"
                    value={formatCurrency(profitReportMetrics.avgProfit)}
                    valueClassName={profitReportMetrics.avgProfit >= 0 ? '!text-[#166534]' : '!text-[#DC2626]'}
                    colorVariant="purple"
                />
            </div>

            <div className="printable-report hidden md:block">
                <div className="hidden print:block text-black mb-6">
                    <h1 className="text-xl font-bold">{profile.companyName}</h1>
                    <p className="text-sm">{profile.address}</p>
                    <div className="mt-4 pt-4 border-t-2 border-black">
                        <h2>Laporan Laba per Klien</h2>
                        <p>Periode: {currentMonthName} {profitReportFilters.year}</p>
                    </div>
                </div>
                <div className="bg-brand-surface p-6 rounded-2xl shadow-lg mt-6 border border-brand-border print:shadow-none print:border-none print:p-0 print:mt-0">
                    <div className="print:hidden">
                        <h3 className="text-lg font-bold mb-2 text-gradient">Laporan Laba per Klien</h3>
                        <p className="text-sm text-brand-text-primary mb-4">
                            Menampilkan profitabilitas untuk Acara yang dieksekusi pada <strong>{currentMonthName} {profitReportFilters.year}</strong>.
                        </p>
                    </div>
                    <div className="overflow-x-auto max-h-[500px] print:max-h-none print:overflow-visible">
                        <table className="w-full text-sm">
                            <thead className="text-xs uppercase print-bg-slate bg-brand-input">
                                <tr className="print-text-black">
                                    <th className="p-3 text-center w-12">No</th>
                                    <th className="p-3 text-left">Pelanggan</th>
                                    <th className="p-3 text-right">Harga Package</th>
                                    <th className="p-3 text-right">Biaya Tambahan</th>
                                    <th className="p-3 text-right">Transport</th>
                                    <th className="p-3 text-right">Total Pembayaran</th>
                                    <th className="p-3 text-right">Total Terbayar</th>
                                    <th className="p-3 text-right">Biaya Produksi</th>
                                    <th className="p-3 text-right">Laba Bersih</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-brand-border">
                                {projectProfitabilityData.map((data, index) => {
                                    const totalTagihan = (data as any).totalPackageRevenue + (data as any).totalCustomCosts + (data as any).totalTransportCosts;
                                    return (
                                        <tr key={data!.clientId}>
                                            <td className="p-3 text-center text-brand-text-secondary font-medium">{index + 1}</td>
                                            <td className="p-3">
                                                <p className="font-semibold text-brand-text-light">{data!.clientName}</p>
                                                <p className="text-[10px] text-brand-text-secondary font-mono">
                                                    {(data as any).projects.map((p: any) => p.packageName).join(', ')}
                                                </p>
                                            </td>
                                            <td className="p-3 text-right text-brand-text-secondary">
                                                {formatCurrency((data as any).totalPackageRevenue)}
                                            </td>
                                            <td className="p-3 text-right text-orange-800 font-medium">
                                                +{formatCurrency((data as any).totalCustomCosts)}
                                            </td>
                                            <td className="p-3 text-right text-brand-text-secondary">
                                                {formatCurrency((data as any).totalTransportCosts)}
                                            </td>
                                            <td className="p-3 text-right font-bold text-brand-text-primary">
                                                {formatCurrency(totalTagihan)}
                                            </td>
                                            <td className="p-3 text-right text-[#166534] font-semibold">
                                                {formatCurrency(data!.totalIncome)}
                                            </td>
                                            <td className="p-3 text-right text-[#DC2626]">
                                                {formatCurrency(data!.totalCost)}
                                            </td>
                                            <td className={`p-3 text-right font-black ${data!.profit >= 0 ? 'text-[#166534]' : 'text-[#DC2626]'}`}>
                                                {formatCurrency(data!.profit)}
                                            </td>
                                        </tr>
                                    );
                                })}
                                {projectProfitabilityData.length === 0 && (
                                    <tr>
                                        <td colSpan={9} className="text-center p-8 text-brand-text-secondary">
                                            Tidak ada data Acara Pernikahan untuk periode ini.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EventProfitabilityTab;
