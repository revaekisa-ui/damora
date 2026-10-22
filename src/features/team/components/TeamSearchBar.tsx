import React from 'react';

interface TeamSearchBarProps {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  resultCount: number;
  resultLabel?: string;
}

const SearchIcon = () => (
  <svg
    className="w-4 h-4 text-brand-text-secondary"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
    />
  </svg>
);

const TeamSearchBar: React.FC<TeamSearchBarProps> = ({
  placeholder,
  value,
  onChange,
  resultCount,
  resultLabel = 'anggota',
}) => {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 bg-white border border-slate-200 rounded-2xl shadow-[0_9px_17.5px_rgba(0,0,0,0.05)] px-3.5 sm:px-4 py-3">
      {/* Search input */}
      <div className="relative flex-1 min-w-0">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <SearchIcon />
        </span>
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-[#F8FAFC] text-[#2A3547] placeholder:text-[#5A6A85] focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent transition-all"
        />
      </div>

      {/* Count */}
      <div className="px-3 py-1.5 rounded-xl bg-[#F8FAFC] border border-slate-200 text-[11px] sm:text-xs text-[#5A6A85] shrink-0 text-center">
        Menampilkan{' '}
        <span className="font-bold text-[#2A3547]">{resultCount}</span>{' '}
        {resultLabel}
      </div>
    </div>
  );
};

export default TeamSearchBar;
