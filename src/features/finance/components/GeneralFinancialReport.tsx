import React from 'react';
import { Transaction, Profile } from '../../../types';
import StatCard from '../../../shared/ui/StatCard';
import { AnalyticsChartCard } from '../../../shared/ui/AnalyticsChartCard';
import TransactionTable from './TransactionTable';
import { ArrowUpIcon, ArrowDownIcon, DollarSignIcon } from '../../../constants';
import { formatCurrency } from '../../../utils/currency';
import CategoryBarChart from './CategoryBarChart';

export interface GeneralFinancialReportMetrics {
    reportIncome: number;
    reportExpense: number;
    incomeDonut: { label: string; value: number; color: string }[];
    expenseDonut: { label: string; value: number; color: string }[];
}

interface GeneralFinancialReportProps {
    metrics: GeneralFinancialReportMetrics;
    transactions: Transaction[];
    periodText: string;
    profile: Profile;
    onEditTransaction?: (transaction: Transaction) => void;
    onDeleteTransaction?: (id: string) => void;
    onAddTransaction?: () => void;
}

const CategoryAnalysisContent: React.FC<{ data: { label: string; value: number; color: string }[] }> = ({ data }) => (
    <CategoryBarChart data={data} />
);

const GeneralFinancialReport: React.FC<GeneralFinancialReportProps> = ({
    metrics,
    transactions,
    periodText,
    profile,
    onEditTransaction,
    onDeleteTransaction,
    onAddTransaction
}) => (
    <div className="printable-report space-y-6">
        {/* ... (Print and Screen Header) */}
        <div className="hidden print:block text-black mb-6">
            <h1 className="text-xl font-bold">{profile.companyName}</h1>
            <p className="text-sm">{profile.address}</p>
            <div className="mt-4 pt-4 border-t-2 border-black">
                <h2>Laporan Keuangan Umum</h2>
                <p>Periode: {periodText}</p>
            </div>
        </div>
        <div className="print:hidden">
            <h2 className="text-2xl font-bold mb-2 text-gradient">Laporan Keuangan Umum</h2>
            <p className="mb-6 text-brand-text-primary">Periode: {periodText}</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 StatCard-container">
            <StatCard icon={<ArrowUpIcon className="w-6 h-6" />} title="Total Pemasukan" value={formatCurrency(metrics.reportIncome)} valueClassName="!text-[#166534]" subtitle="Pemasukan periode ini" colorVariant="green" />
            <StatCard icon={<ArrowDownIcon className="w-6 h-6" />} title="Total Pengeluaran" value={formatCurrency(metrics.reportExpense)} valueClassName="!text-[#DC2626]" subtitle="Pengeluaran periode ini" colorVariant="pink" />
            <StatCard icon={<DollarSignIcon className="w-6 h-6" />} title="Laba / Rugi Bersih" value={formatCurrency(metrics.reportIncome - metrics.reportExpense)} valueClassName={metrics.reportIncome >= metrics.reportExpense ? '!text-[#166534]' : '!text-[#DC2626]'} subtitle="Selisih pemasukan & pengeluaran" colorVariant="blue" />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <AnalyticsChartCard title="Analisis Pemasukan" description="Distribusi pemasukan berdasarkan kategori">
                <CategoryAnalysisContent data={metrics.incomeDonut} />
            </AnalyticsChartCard>
            <AnalyticsChartCard title="Analisis Pengeluaran" description="Distribusi pengeluaran berdasarkan kategori">
                <CategoryAnalysisContent data={metrics.expenseDonut} />
            </AnalyticsChartCard>
        </div>
        
        <div className="bg-brand-surface p-6 rounded-2xl shadow-lg mt-6 border border-brand-border">
            <TransactionTable
                transactions={transactions}
                title="Rincian Semua Transaksi"
                subtitle="Daftar transaksi yang tercatat dalam periode laporan ini"
                onEdit={onEditTransaction}
                onDelete={onDeleteTransaction}
                onAdd={onAddTransaction}
                showAddButton={Boolean(onAddTransaction)}
                showSearch={true}
            />
        </div>
    </div>
);

export default GeneralFinancialReport;
