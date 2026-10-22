import { describe, expect, it } from 'vitest';
import { ViewType } from '../types';
import { resolveViewFromPath } from './routesConfig';

describe('resolveViewFromPath', () => {
  it('resolves renamed and legacy pengantin routes', () => {
    expect(resolveViewFromPath('Manajemen Pengantin')).toBe(ViewType.CLIENTS);
    expect(resolveViewFromPath('Manajemen Klien')).toBe(ViewType.CLIENTS);
  });

  it('resolves renamed and legacy event routes to pengantin management', () => {
    expect(resolveViewFromPath('Acara')).toBe(ViewType.CLIENTS);
    expect(resolveViewFromPath('Proyek')).toBe(ViewType.CLIENTS);
    expect(resolveViewFromPath('projects')).toBe(ViewType.CLIENTS);
  });

  it('resolves renamed and legacy pengantin report routes', () => {
    expect(resolveViewFromPath('Laporan Pengantin')).toBe(ViewType.CLIENT_REPORTS);
    expect(resolveViewFromPath('Laporan Klien')).toBe(ViewType.CLIENT_REPORTS);
  });

  it('resolves the public link management route', () => {
    expect(resolveViewFromPath('bio-links')).toBe(ViewType.BIO_LINKS);
    expect(resolveViewFromPath(ViewType.BIO_LINKS)).toBe(ViewType.BIO_LINKS);
  });
});
