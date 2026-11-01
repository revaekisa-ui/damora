import React, { useMemo } from 'react';
import { PAGE_SIZE_OPTIONS, PageSize } from '../../services/pagination';

interface PaginationControlsProps {
  page: number;
  pageSize: PageSize;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: PageSize) => void;
  itemLabel?: string;
  className?: string;
}

const PaginationControls: React.FC<PaginationControlsProps> = ({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  itemLabel = 'data',
  className = '',
}) => {
  const pageCount = Math.max(1, Math.ceil(Math.max(total, 0) / pageSize));
  const currentPage = Math.min(Math.max(1, page), pageCount);
  const first = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const last = Math.min(currentPage * pageSize, total);
  const pages = useMemo(() => {
    const start = Math.max(1, Math.min(currentPage - 2, pageCount - 4));
    return Array.from({ length: Math.min(5, pageCount) }, (_, index) => start + index);
  }, [currentPage, pageCount]);

  return (
    <div className={`flex flex-col gap-3 border-t border-[#EAEFF4] px-3 py-3 sm:flex-row sm:items-center sm:justify-between ${className}`}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-[#5A6A85]">
        <span>Menampilkan {first}–{last} dari {total} {itemLabel}</span>
        <label className="inline-flex items-center gap-1.5">
          <span>Baris:</span>
          <select
            value={pageSize}
            onChange={(event) => onPageSizeChange(Number(event.target.value) as PageSize)}
            className="rounded-lg border border-[#EAEFF4] bg-white px-2 py-1 text-xs text-[#2A3547]"
            aria-label="Jumlah data per halaman"
          >
            {PAGE_SIZE_OPTIONS.map((size) => <option key={size} value={size}>{size}</option>)}
          </select>
        </label>
        <span>Halaman {currentPage} dari {pageCount}</span>
      </div>

      <nav className="flex items-center gap-1" aria-label="Navigasi halaman">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="rounded-lg border border-[#EAEFF4] px-2.5 py-1.5 text-xs text-[#5A6A85] disabled:cursor-not-allowed disabled:opacity-40"
        >Sebelumnya</button>
        {pages.map((number) => (
          <button
            key={number}
            type="button"
            onClick={() => onPageChange(number)}
            aria-current={number === currentPage ? 'page' : undefined}
            className={`h-8 min-w-8 rounded-lg border px-2 text-xs ${number === currentPage ? 'border-brand-accent bg-brand-accent text-white' : 'border-[#EAEFF4] text-[#5A6A85]'}`}
          >{number}</button>
        ))}
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= pageCount}
          className="rounded-lg border border-[#EAEFF4] px-2.5 py-1.5 text-xs text-[#5A6A85] disabled:cursor-not-allowed disabled:opacity-40"
        >Berikutnya</button>
      </nav>
    </div>
  );
};

export default PaginationControls;
