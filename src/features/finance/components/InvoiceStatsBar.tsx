import React from 'react';
import { FileText, CheckCircle2, Clock, Receipt } from 'lucide-react';

interface InvoiceStats {
  totalInvoice: number;
  totalReceipt: number;
  totalInvoiceValue: number;
  totalPaid: number;
  totalUnpaid: number;
  lunas: number;
  pending: number;
  totalReceipts: number;
}

interface InvoiceStatsBarProps {
  stats: InvoiceStats;
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

const StatCard: React.FC<{
  label: string;
  value: string | number;
  sub?: string;
  accent?: string; // tailwind text color class
  icon: React.ReactNode;
}> = ({ label, value, sub, accent = 'text-brand-text-primary', icon }) => (
  <div className="flex items-center gap-3 bg-brand-surface border border-brand-border rounded-2xl px-4 py-3.5 min-w-0 flex-1">
    <div className="w-10 h-10 rounded-xl bg-brand-bg flex items-center justify-center shrink-0">
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-[10px] font-bold uppercase tracking-widest text-brand-text-secondary truncate">
        {label}
      </p>
      <p className={`text-lg font-black leading-tight ${accent} truncate`}>{value}</p>
      {sub && <p className="text-[10px] text-brand-text-secondary mt-0.5 truncate">{sub}</p>}
    </div>
  </div>
);

const InvoiceStatsBar: React.FC<InvoiceStatsBarProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <StatCard
        label="Total Invoice"
        value={stats.totalInvoice}
        sub={`${stats.lunas} lunas · ${stats.pending} pending`}
        accent="text-blue-400"
        icon={<FileText className="w-5 h-5 text-blue-400" />}
      />
      <StatCard
        label="Sudah Terbayar"
        value={formatCurrency(stats.totalPaid)}
        sub={`dari ${formatCurrency(stats.totalInvoiceValue)}`}
        accent="text-[#166534]"
        icon={<CheckCircle2 className="w-5 h-5 text-green-400" />}
      />
      <StatCard
        label="Sisa Pembayaran"
        value={formatCurrency(stats.totalUnpaid)}
        sub={`${stats.pending} invoice belum lunas`}
        accent="text-[#DC2626]"
        icon={<Clock className="w-5 h-5 text-orange-400" />}
      />
      <StatCard
        label="Tanda Terima"
        value={stats.totalReceipt}
        sub={formatCurrency(stats.totalReceipts)}
        accent="text-purple-400"
        icon={<Receipt className="w-5 h-5 text-purple-400" />}
      />
    </div>
  );
};

export default InvoiceStatsBar;
