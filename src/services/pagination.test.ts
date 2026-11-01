import { describe, expect, it } from 'vitest';
import { escapePostgrestSearch, getPageCount, normalizePageRequest } from './pagination';

describe('server pagination helpers', () => {
  it('defaults to page 1 with 10 rows', () => {
    expect(normalizePageRequest()).toEqual({ page: 1, pageSize: 10, offset: 0 });
  });

  it('accepts only supported sizes and calculates a stable offset', () => {
    expect(normalizePageRequest(3, 20)).toEqual({ page: 3, pageSize: 20, offset: 40 });
    expect(normalizePageRequest(0, 25)).toEqual({ page: 1, pageSize: 10, offset: 0 });
  });

  it('handles empty totals and exact page boundaries', () => {
    expect(getPageCount(0, 10)).toBe(1);
    expect(getPageCount(20, 10)).toBe(2);
    expect(getPageCount(21, 10)).toBe(3);
  });

  it('escapes PostgREST separators and LIKE wildcards', () => {
    expect(escapePostgrestSearch('a,b%(c)')).toBe('a,b\\%(c)');
    expect(escapePostgrestSearch('x"y\\z')).toBe('x\\"y\\\\z');
  });
});
