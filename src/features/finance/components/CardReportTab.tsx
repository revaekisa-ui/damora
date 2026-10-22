import React, { useState, useMemo } from 'react';
import { Transaction, TransactionType, Card, Profile } from '../../../types';
import StatCard from '../../../shared/ui/StatCard';
import TransactionTable from './TransactionTable';
import { ArrowUpIcon, ArrowDownIcon, DollarSignIcon, PrinterIcon } from '../../../constants';
import { formatCurrency } from '../../../utils/currency';
import { MobileCollapsibleSection } from '../../../components/ui/MobileProgressiveDisclosure';
import CategoryBarChart from './CategoryBarChart';

interface CardReportTabProps {
    transactions: Transaction[];
    cards: Card[];
    profile: Profile;
    onEditTransaction?: (transaction: Transaction) => void;
    onDeleteTransaction?: (id: string) => void;
    onAddTransaction?: () => void;
}

const CardReportTab: React.FC<CardReportTabProps> = ({
    transactions,
    cards,
    onEditTransaction,
    onDeleteTransaction,
    onAddTransaction,
}) => {
    const [filters, setFilters] = useState({ cardId: 'all', dateFrom: '', dateTo: '' });

    const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const filteredTransactions = useMemo(() => {
        return transactions.filter(t => {
            const date = new Date(t.date);
            const from = filters.dateFrom ? new Date(filters.dateFrom) : null;
            const to = filters.dateTo ? new Date(filters.dateTo) : null;
            if (from) from.setHours(0, 0, 0, 0);
            if (to) to.setHours(23, 59, 59, 999);

            const dateMatch = (!from || date >= from) && (!to || date <= to);
            const cardMatch = filters.cardId === 'all' || t.cardId === filters.cardId;

            return dateMatch && cardMatch;
        });
    }, [transactions, filters]);

    const reportStats = useMemo(() => {
        const income = filteredTransactions.filter(t => t.type === TransactionType.INCOME).reduce((sum, t) => sum + t.amount, 0);
        const expense = filteredTransactions.filter(t => t.type === TransactionType.EXPENSE).reduce((sum, t) => sum + t.amount, 0);
        return { income, expense, net: income - expense };
    }, [filteredTransactions]);

    const expenseDonutData = useMemo(() => {
        const expenseByCategory = filteredTransactions
            .filter(t => t.type === TransactionType.EXPENSE)
            .reduce((acc, t) => {
                acc[t.category] = (acc[t.category] || 0) + t.amount;
                return acc;
            }, {} as Record<string, number>);

        const colors = ['#f87171', '#fb923c', '#facc15', '#a3e635', '#34d399', '#22d3ee', '#60a5fa', '#a78bfa', '#f472b6'];
        const entries = Object.entries(expenseByCategory as Record<string, number>) as [string, number][];
        return entries
            .sort(([, a], [, b]) => b - a)
            .map(([label, value], i) => ({ label, value, color: colors[i % colors.length] }));
    }, [filteredTransactions]);

    return (
        <div className="space-y-4 sm:space-y-6 printable-area widget-animate">
            <MobileCollapsibleSection
                title="Filter Laporan Kartu"
                subtitle={filters.cardId === 'all' ? 'Semua Kartu/Akun' : 'Kartu Terpilih'}
                variant="filter"
                actionLabelOpen="Filter"
                actionLabelClose="Tutup"
                className="non-printable"
            >
                <div className="bg-brand-surface p-3 sm:p-4 rounded-xl flex flex-col md:flex-row gap-3 items-stretch md:items-center non-printable border border-brand-border">
                    <h4 className="text-sm font-semibold text-brand-text-light whitespace-nowrap">Filter Laporan:</h4>
                    <select name="cardId" value={filters.cardId} onChange={handleFilterChange} className="input-field !rounded-lg !border p-2 text-sm w-full md:w-auto">
                        <option value="all">Semua Kartu/Akun</option>
                        {cards.map(c => <option key={c.id} value={c.id}>{c.bankName} {c.lastFourDigits !== 'CASH' ? `**** ${c.lastFourDigits}` : '(Tunai)'}</option>)}
                    </select>
                    <div className="grid grid-cols-2 gap-2 w-full md:w-auto">
                        <input type="date" name="dateFrom" value={filters.dateFrom} onChange={handleFilterChange} className="input-field !rounded-lg !border p-2 text-sm w-full" title="Dari Tanggal" />
                        <input type="date" name="dateTo" value={filters.dateTo} onChange={handleFilterChange} className="input-field !rounded-lg !border p-2 text-sm w-full" title="Sampai Tanggal" />
                    </div>
                    <button onClick={() => window.print()} className="w-auto self-end md:self-auto md:ml-auto button-primary inline-flex items-center justify-center gap-2 min-h-[44px] text-xs sm:text-sm font-semibold"><PrinterIcon className="w-4 h-4 flex-shrink-0" />Cetak</button>
                </div>
            </MobileCollapsibleSection>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 lg:gap-6 StatCard-container">
                <StatCard compactOnMobile icon={<ArrowUpIcon className="w-6 h-6" />} title="Total Pemasukan" value={formatCurrency(reportStats.income)} valueClassName="!text-[#166534]" iconBgColor="bg-brand-success/20" iconColor="text-brand-success" />
                <StatCard compactOnMobile icon={<ArrowDownIcon className="w-6 h-6" />} title="Total Pengeluaran" value={formatCurrency(reportStats.expense)} valueClassName="!text-[#DC2626]" iconBgColor="bg-brand-danger/20" iconColor="text-brand-danger" />
                <StatCard compactOnMobile icon={<DollarSignIcon className="w-6 h-6" />} title="Arus Kas Bersih" value={formatCurrency(reportStats.net)} valueClassName={reportStats.net >= 0 ? '!text-[#166534]' : '!text-[#DC2626]'} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6">
                <div className="lg:col-span-2">
                    <MobileCollapsibleSection
                        title="Grafik Pengeluaran per Kategori"
                        subtitle={`${expenseDonutData.length} kategori pengeluaran`}
                        variant="stats"
                        actionLabelOpen="Lihat Grafik"
                        actionLabelClose="Tutup"
                    >
                        <div className="bg-brand-surface p-3 sm:p-6 rounded-2xl shadow-lg border border-brand-border chart-wrapper">
                            <h3 className="text-lg font-bold text-gradient mb-4">Pengeluaran per Kategori</h3>
                            <CategoryBarChart data={expenseDonutData} />
                        </div>
                    </MobileCollapsibleSection>
                </div>
                <div className="lg:col-span-3 bg-brand-surface p-3 sm:p-6 rounded-2xl shadow-lg border border-brand-border">
                    <h3 className="text-lg font-bold text-gradient mb-4">Rincian Transaksi</h3>
                    <div className="overflow-x-auto max-h-[500px]">
                        <TransactionTable
                            transactions={filteredTransactions}
                            onEdit={onEditTransaction}
                            onDelete={onDeleteTransaction}
                            onAdd={onAddTransaction}
                            showAddButton={Boolean(onAddTransaction)}
                            showSearch={true}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CardReportTab;
