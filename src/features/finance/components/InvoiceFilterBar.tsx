import React, { useState } from 'react';
import { FilterKind } from '../hooks/useInvoices';
import { SlidersHorizontal, ChevronDown, ChevronUp } from 'lucide-react';

interface ClientOption {
  id: string;
  name: string;
}

interface InvoiceFilterBarProps {
  searchTerm: string;
  onSearchChange: (v: string) => void;
  filterKind: FilterKind;
  onFilterKindChange: (v: FilterKind) => void;
  filterStatus: string;
  onFilterStatusChange: (v: string) => void;
  filterClientId: string;
  onFilterClientChange: (v: string) => void;
  filterMonth: string;
  onFilterMonthChange: (v: string) => void;
  clientOptions: ClientOption[];
}

const SearchIcon = () => (
  <svg className="w-4 h-4 text-brand-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const KIND_TABS: { value: FilterKind; label: string }[] = [
  { value: 'semua', label: 'Semua' },
  { value: 'invoice', label: 'Invoice' },
  { value: 'receipt', label: 'Tanda Terima' },
  { value: 'slip-gaji', label: 'Pembayaran tim' },
];

const STATUS_OPTIONS = [
  { value: 'semua', label: 'Semua Status' },
  { value: 'Lunas', label: 'Lunas' },
  { value: 'DP Terbayar', label: 'DP Terbayar' },
  { value: 'Belum Bayar', label: 'Belum Bayar' },
  { value: 'Pemasukan', label: 'Pemasukan' },
];

const InvoiceFilterBar: React.FC<InvoiceFilterBarProps> = ({
  searchTerm,
  onSearchChange,
  filterKind,
  onFilterKindChange,
  filterStatus,
  onFilterStatusChange,
  filterClientId,
  onFilterClientChange,
  filterMonth,
  onFilterMonthChange,
  clientOptions,
}) => {
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const activeFilterCount = [
    filterStatus !== 'semua' ? filterStatus : '',
    filterClientId !== 'semua' ? filterClientId : '',
    filterMonth,
  ].filter(Boolean).length;

  return (
    <div className="space-y-2.5 sm:space-y-3">
      {/* Kind tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-brand-bg/80 rounded-xl border border-brand-border/60 w-full sm:w-fit overflow-x-auto">
        {KIND_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => onFilterKindChange(tab.value)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap flex-1 sm:flex-none ${
              filterKind === tab.value
                ? 'bg-brand-accent text-white shadow-sm'
                : 'text-brand-text-secondary hover:text-brand-text-primary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Mobile: Search + Filter toggle button */}
      <div className="flex sm:hidden items-center gap-2">
        <div className="relative flex-1 min-w-0">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <SearchIcon />
          </span>
          <input
            id="invoice-mobile-search"
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Cari invoice, pengantin..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-brand-border bg-brand-bg/60 text-brand-text-primary placeholder:text-brand-text-secondary focus:outline-none"
          />
        </div>
        <button
          type="button"
          onClick={() => setMobileFiltersOpen(prev => !prev)}
          className={`px-2.5 py-2 rounded-xl border text-xs font-bold inline-flex items-center gap-1.5 shrink-0 transition-all ${
            mobileFiltersOpen || activeFilterCount > 0
              ? 'bg-brand-accent/10 border-brand-accent/30 text-brand-accent'
              : 'bg-brand-bg/60 border-brand-border text-brand-text-secondary'
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>{mobileFiltersOpen ? 'Tutup' : 'Filter'}</span>
          {activeFilterCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-brand-accent text-white text-[9px] font-bold">
              {activeFilterCount}
            </span>
          )}
          {mobileFiltersOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {/* Mobile Collapsible Extra Filters */}
      {mobileFiltersOpen && (
        <div className="sm:hidden grid grid-cols-2 gap-2 pt-2 border-t border-brand-border/60 animate-fade-in">
          <select
            value={filterStatus}
            onChange={(e) => onFilterStatusChange(e.target.value)}
            className="px-2.5 py-2 text-xs rounded-xl border border-brand-border bg-brand-bg/60 text-brand-text-primary w-full"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <select
            value={filterClientId}
            onChange={(e) => onFilterClientChange(e.target.value)}
            className="px-2.5 py-2 text-xs rounded-xl border border-brand-border bg-brand-bg/60 text-brand-text-primary w-full"
          >
            <option value="semua">Semua Pengantin</option>
            {clientOptions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <input
            type="month"
            value={filterMonth}
            onChange={(e) => onFilterMonthChange(e.target.value)}
            className="col-span-2 px-2.5 py-2 text-xs rounded-xl border border-brand-border bg-brand-bg/60 text-brand-text-primary w-full"
          />
        </div>
      )}

      {/* Desktop: Search + filters row (Unchanged) */}
      <div className="hidden sm:flex sm:flex-row gap-2">
        {/* Search */}
        <div className="relative flex-1 min-w-0">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <SearchIcon />
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Cari..."
            className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-brand-border bg-brand-bg/60 text-brand-text-primary placeholder:text-brand-text-secondary focus:outline-none focus:ring-2 focus:ring-blue-600/40 focus:border-blue-600/60 transition-all"
          />
        </div>

        <div className="grid grid-cols-2 sm:flex gap-2">
          {/* Status */}
          <select
            value={filterStatus}
            onChange={(e) => onFilterStatusChange(e.target.value)}
            className="px-3 py-2.5 text-sm rounded-xl border border-brand-border bg-brand-bg/60 text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-blue-600/40 transition-all w-full sm:min-w-[150px]"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>

          {/* Client */}
          <select
            value={filterClientId}
            onChange={(e) => onFilterClientChange(e.target.value)}
            className="px-3 py-2.5 text-sm rounded-xl border border-brand-border bg-brand-bg/60 text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-blue-600/40 transition-all w-full sm:min-w-[150px]"
          >
            <option value="semua">Semua Pengantin</option>
            {clientOptions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Month */}
          <input
            type="month"
            value={filterMonth}
            onChange={(e) => onFilterMonthChange(e.target.value)}
            className="px-3 py-2.5 text-sm rounded-xl border border-brand-border bg-brand-bg/60 text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-blue-600/40 transition-all w-full sm:min-w-[150px]"
          />
        </div>
      </div>
    </div>
  );
};

export default InvoiceFilterBar;
