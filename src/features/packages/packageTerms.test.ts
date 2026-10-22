import { describe, expect, it } from 'vitest';
import { DEFAULT_PACKAGE_TERMS, getPackageTerms } from './packageTerms';

describe('getPackageTerms', () => {
  it('uses shared defaults when no terms are configured', () => {
    expect(getPackageTerms()).toBe(DEFAULT_PACKAGE_TERMS);
    expect(getPackageTerms([])).toBe(DEFAULT_PACKAGE_TERMS);
  });

  it('returns configured terms when present', () => {
    const terms = [{ id: 'custom', title: 'Ketentuan khusus', items: ['Berlaku untuk paket ini.'] }];

    expect(getPackageTerms(terms)).toBe(terms);
  });

  it('returns global and matching region terms only', () => {
    const terms = [
      { id: 'global', title: 'Umum', items: ['Semua wilayah.'] },
      { id: 'banten', title: 'Banten', region: 'banten', items: ['Khusus Banten.'] },
      { id: 'vendor', title: 'Vendor', region: 'vendor', items: ['Khusus vendor.'] },
    ];

    expect(getPackageTerms(terms, ' BANTEN ').map(term => term.id)).toEqual(['global', 'banten']);
  });

  it('does not show defaults when configured terms do not match a region', () => {
    const terms = [{ id: 'banten', title: 'Banten', region: 'banten', items: ['Khusus Banten.'] }];

    expect(getPackageTerms(terms, 'jabodetabek')).toEqual([]);
  });

  it('shows only global terms when the package has no region', () => {
    const terms = [
      { id: 'global', title: 'Umum', items: ['Semua wilayah.'] },
      { id: 'banten', title: 'Banten', region: 'banten', items: ['Khusus Banten.'] },
    ];

    expect(getPackageTerms(terms).map(term => term.id)).toEqual(['global']);
  });
});
