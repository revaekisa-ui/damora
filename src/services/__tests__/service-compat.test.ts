import { describe, it, expect } from 'vitest';
import { clientService } from '../clients';
import { transactionService } from '../transactions';
import { teamMemberService } from '../teamMembers';
import { teamProjectPaymentService } from '../teamProjectPayments';
import { projectService } from '../projects';
import { parseClientsFromSheet, parseTransactionsFromSheet, parseTeamPaymentsFromSheet } from '../../features/migration/excelMigrationUtils';

describe('service compatibility exports', () => {
  it('exposes singleton service objects used by migration screens', () => {
    expect(clientService).toBeTruthy();
    expect(typeof clientService.add).toBe('function');

    expect(transactionService).toBeTruthy();
    expect(typeof transactionService.add).toBe('function');

    expect(teamMemberService).toBeTruthy();
    expect(typeof teamMemberService.add).toBe('function');

    expect(teamProjectPaymentService).toBeTruthy();
    expect(typeof teamProjectPaymentService.add).toBe('function');

    expect(projectService).toBeTruthy();
    expect(typeof projectService.add).toBe('function');
  });

  it('parses the migration template rows into the current data shape', () => {
    const clients = parseClientsFromSheet([{ 'Nama Klien (Wajib)': 'Rian & Maya', 'Nomor HP / WhatsApp (Wajib)': '081234567890', 'Email': 'rian.maya@gmail.com', 'Tanggal Acara (YYYY-MM-DD)': '2026-11-20', 'Lokasi Acara': 'Hotel Aston', 'Kota / Wilayah': 'Serang', 'Status (Active/Completed/Cancelled/Lead)': 'Active' }]);
    const tx = parseTransactionsFromSheet([{ 'Keterangan / Deskripsi (Wajib)': 'DP client', 'Tipe (Pemasukan / Pengeluaran) (Wajib)': 'Pemasukan', 'Nominal (IDR) (Wajib)': 5000000, 'Tanggal (YYYY-MM-DD)': '2026-09-01' }]);
    const team = parseTeamPaymentsFromSheet([{ 'Nama Anggota Tim / Freelancer (Wajib)': 'Andi', 'Honor / Fee (IDR) (Wajib)': 1200000, 'Status Bayar (Paid / Unpaid)': 'Unpaid', 'Tanggal Tugas (YYYY-MM-DD)': '2026-11-20' }]);

    expect(clients.valid.length).toBe(1);
    expect(clients.valid[0].name).toBe('Rian & Maya');
    expect(clients.valid[0].status).toBe('Aktif');

    expect(tx.valid.length).toBe(1);
    expect(tx.valid[0].type).toBe('Pemasukan');

    expect(team.valid.length).toBe(1);
    expect(team.valid[0].teamMemberName).toBe('Andi');
    expect(team.valid[0].status).toBe('Unpaid');
  });

  it('accepts booking-form style columns for easier import validation', () => {
    const clients = parseClientsFromSheet([
      {
        'Nama Pengantin (Wajib)': 'Ayu & Bima',
        'Nomor WhatsApp / Telepon (Wajib)': '081299900011',
        'Email': 'ayu@email.com',
        'Jenis Pengantin': 'Langsung',
        'Nama Acara Pernikahan': 'Wedding Ayu & Bima',
        'Jenis Acara': 'Wedding',
        'Tanggal Acara': '2026-12-20',
        'Lokasi (Kota)': 'Bandung',
        'Alamat Lengkap': 'Jl. Asia Afrika No. 10',
        'Nama Paket': 'Paket Premium',
        'Total Tagihan (IDR)': 18000000,
        'DP (IDR)': 5000000,
        'Status Pembayaran': 'DP Terbayar',
        'Catatan': 'Acara di hotel'
      }
    ]);

    expect(clients.valid.length).toBe(1);
    expect(clients.valid[0].name).toBe('Ayu & Bima');
    expect(clients.valid[0].clientType).toBe('Langsung');
    expect(clients.valid[0].status).toBe('Aktif');
    expect(clients.valid[0].address).toContain('Bandung');
    expect((clients.valid[0] as any).projectName).toBe('Wedding Ayu & Bima');
    expect((clients.valid[0] as any).projectType).toBe('Wedding');
  });
});
