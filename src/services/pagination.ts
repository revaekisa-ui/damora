export const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;
export type PageSize = (typeof PAGE_SIZE_OPTIONS)[number];

export interface PageRequest {
  page: number;
  pageSize: PageSize;
  offset: number;
}

export function normalizePageRequest(page?: number, pageSize?: number): PageRequest {
  const safePage = Number.isFinite(page) ? Math.max(1, Math.floor(page as number)) : 1;
  const safePageSize = PAGE_SIZE_OPTIONS.includes(pageSize as PageSize)
    ? (pageSize as PageSize)
    : 10;

  return {
    page: safePage,
    pageSize: safePageSize,
    offset: (safePage - 1) * safePageSize,
  };
}

export function getPageCount(total: number, pageSize: number): number {
  return Math.max(1, Math.ceil(Math.max(0, total) / pageSize));
}

/** Escape LIKE wildcards and quote a value embedded in a PostgREST `.or()` filter. */
export function escapePostgrestSearch(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/[%_]/g, '\\$&');
}
