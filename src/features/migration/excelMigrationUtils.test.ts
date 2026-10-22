import { describe, expect, it } from 'vitest';
import { parseClientsFromSheet, parseRawDate, parseRawNumber, parseTeamPaymentsFromSheet } from './excelMigrationUtils';

describe('Excel migration terminology', () => {
  it('imports the renamed bride and event columns', () => {
    const result = parseClientsFromSheet([{
      'Nama Pengantin (Wajib)': 'Rian & Maya',
      'Nama Acara': 'Pernikahan Rian & Maya',
      'Status Pengantin': 'Aktif',
    }]);

    expect(result.errors).toHaveLength(0);
    expect(result.valid[0]).toMatchObject({
      name: 'Rian & Maya',
      projectName: 'Pernikahan Rian & Maya',
    });
  });

  it('continues to import legacy column headings', () => {
    const result = parseClientsFromSheet([{
      'Nama Pengantin / Klien (Wajib)': 'Rian & Maya',
      'Nama Acara Pernikahan': 'Pernikahan Rian & Maya',
    }]);

    expect(result.errors).toHaveLength(0);
    expect(result.valid[0]).toMatchObject({
      name: 'Rian & Maya',
      projectName: 'Pernikahan Rian & Maya',
    });
  });

  it('imports the renamed event column for team fees', () => {
    const result = parseTeamPaymentsFromSheet([{
      'Nama Anggota Tim / Freelancer (Wajib)': 'Andi',
      'Nama Acara': 'Pernikahan Rian & Maya',
      'Honor / Fee (IDR) (Wajib)': 1200000,
    }]);

    expect(result.errors).toHaveLength(0);
    expect(result.valid[0]).toMatchObject({
      teamMemberName: 'Andi',
      projectName: 'Pernikahan Rian & Maya',
    });
  });

  it('parses Indonesian currency strings with thousand separators correctly', () => {
    expect(parseRawNumber('Rp 1.200.000')).toBe(1200000);
    expect(parseRawNumber('1.200.000')).toBe(1200000);
    expect(parseRawNumber('1,200,000')).toBe(1200000);
    expect(parseRawNumber('Rp 1.200,50')).toBe(1200.5);
    expect(parseRawNumber('-Rp 1.200.000')).toBe(-1200000);
  });

  it('normalizes common Indonesian date formats before saving rows', () => {
    expect(parseRawDate('27/12/2026')).toBe('2026-12-27');
    expect(parseRawDate('27-12-2026')).toBe('2026-12-27');
    expect(parseRawDate('27.12.2026')).toBe('2026-12-27');
  });
});
