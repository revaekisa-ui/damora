import { describe, expect, it } from 'vitest';
import type { Workbook, Worksheet } from 'exceljs';
import {
    BACKUP_DATASETS,
    FINANCE_CSV_HEADERS,
    buildBackupCsvRows,
    buildBackupReportWorkbook,
    buildFinanceCsvRows,
    buildFullBackupWorkbook,
    getBackupRecordAmount,
    isBackupExpense,
    isBackupIncome,
    type BackupDataset,
    type BackupRecord,
} from './backupExport';

const datasetByTable = (table: string): BackupDataset => {
    const dataset = BACKUP_DATASETS.find((item) => item.table === table);
    if (!dataset) throw new Error(`Dataset "${table}" tidak ditemukan`);
    return dataset;
};

const rec = (table: string, value: Record<string, unknown>): BackupRecord => ({
    dataset: datasetByTable(table),
    value,
});

const headerIndex = (sheet: Worksheet, header: string) => {
    const headers = (sheet.getRow(1).values as (string | undefined)[]) || [];
    return headers.indexOf(header);
};

const cellValue = (sheet: Worksheet, rowNumber: number, header: string) => {
    const index = headerIndex(sheet, header);
    if (index < 0) throw new Error(`Header "${header}" tidak ditemukan di sheet ${sheet.name}`);
    return sheet.getRow(rowNumber).getCell(index).value;
};

const summaryValue = (workbook: Workbook, item: string) => {
    const sheet = workbook.getWorksheet('Ringkasan Dashboard')!;
    for (let row = 5; row <= sheet.rowCount; row += 1) {
        if (sheet.getRow(row).getCell(2).value === item) {
            return sheet.getRow(row).getCell(3).value as number;
        }
    }
    return undefined;
};

const collectStrings = (workbook: Workbook) => {
    const strings: string[] = [];
    workbook.worksheets.forEach((sheet) => {
        sheet.eachRow((row) => {
            row.eachCell({ includeEmpty: false }, (cell) => {
                if (typeof cell.value === 'string') strings.push(cell.value);
            });
        });
    });
    return strings;
};

// ── Data contoh (mengikuti bentuk baris mentah / snake_case) ─────────────────

const buildRecords = (): BackupRecord[] => [
    rec('clients', { id: 'client-1', name: 'Rina', email: 'rina@example.com', phone: '0812345678', whatsapp: '0812345678', since: '2026-01-01', status: 'Aktif', home_address: 'Jl. Melati 1' }),
    rec('projects', {
        id: 'project-1',
        project_name: 'Wedding Rina & Budi',
        client_name: 'Rina',
        client_id: 'client-1',
        package_name: 'Paket Gold',
        duration_selection: '6 Jam',
        date: '2026-11-20',
        start_time: '09:00',
        location: 'Jakarta',
        address: 'Jl. Venue No. 1',
        progress: 25,
        status: 'Persiapan',
        total_cost: 10000000,
        amount_paid: 0,
        payment_status: 'DP Terbayar',
        custom_costs: [{ name: 'Dekorasi', amount: 500000 }],
    }),
    rec('contracts', { id: 'contract-1', client_id: 'client-1', project_id: 'project-1', client_name1: 'Rina', client_name2: 'Budi', signing_date: '2026-01-05' }),
    rec('cards', { id: 'card-1', bank_name: 'BCA', last_four_digits: '1234', balance: 2500000 }),
    rec('pockets', { id: 'pocket-1', name: 'Dana Darurat', balance: 1000000 }),
    rec('transactions', { id: 'tx-1', date: '2026-02-01', description: 'DP Pengantin', amount: 5000000, type: 'Pemasukan', category: 'DP Pengantin', method: 'Transfer', project_id: 'project-1' }),
    rec('transactions', { id: 'tx-2', date: '2026-03-01', description: 'Pelunasan', amount: 3000000, type: 'Pemasukan', category: 'Pelunasan', method: 'Transfer', project_id: 'project-1' }),
    rec('transactions', { id: 'tx-3', date: '2026-03-05', description: 'Refund sebagian', amount: -500000, type: 'Pemasukan', category: 'Refund', method: 'Transfer', project_id: 'project-1' }),
    rec('transactions', { id: 'tx-4', date: '2026-02-10', description: 'Sewa tempat', amount: 1500000, type: 'Pengeluaran', category: 'Sewa Tempat', method: 'Transfer', project_id: 'project-1', card_id: 'card-1', vendor_signature: 'sig' }),
    rec('transactions', { id: 'tx-5', date: '2026-02-11', description: 'Pembelian bunga (dibatalkan)', amount: 400000, type: 'Pengeluaran', category: 'Dekorasi', method: 'Tunai', project_id: 'project-1' }),
    rec('team_project_payments', { id: 'tp-1', project_id: 'project-1', team_member_name: 'Ayu', team_member_id: 'member-1', date: '2026-02-20', status: 'Paid', fee: 1000000 }),
];

// ── Cakupan dataset ──────────────────────────────────────────────────────────

describe('BACKUP_DATASETS', () => {
    it('memuat tepat 19 tabel operasional', () => {
        expect(BACKUP_DATASETS).toHaveLength(19);
        expect(new Set(BACKUP_DATASETS.map((dataset) => dataset.table)).size).toBe(19);
    });

    it('mengecualikan profil publik dan portofolio', () => {
        const tables = BACKUP_DATASETS.map((dataset) => dataset.table);
        expect(tables).not.toContain('vendor_profiles');
        expect(tables).not.toContain('vendor_portfolios');
    });
});

// ── B. Laporan Excel 5 sheet ─────────────────────────────────────────────────

describe('buildBackupReportWorkbook', () => {
    it('membuat 12 sheet dengan nama yang benar (5 operasional + 7 keuangan)', () => {
        const workbook = buildBackupReportWorkbook(buildRecords());
        expect(workbook.worksheets.map((sheet) => sheet.name)).toEqual([
            'Ringkasan Dashboard',
            'Pengantin & Acara Pernikahan',
            'Riwayat Pembayaran',
            'Pengeluaran Proyek',
            'Tim & Honor',
            'Dashboard Keuangan',
            'Rekap Pemasukan',
            'Rekap Pengeluaran',
            'Saldo Rekening & Kartu',
            'Kantong Keuangan',
            'Transfer Antar-Rekening',
            'Rekap Kategori Keuangan',
        ]);
    });

    it('menghitung ringkasan keuangan dari data aktual (sama dengan aturan halaman Keuangan)', () => {
        const workbook = buildBackupReportWorkbook(buildRecords());
        expect(summaryValue(workbook, 'Total pemasukan ledger')).toBe(7500000);
        expect(summaryValue(workbook, 'Total pengeluaran ledger')).toBe(1900000);
        expect(summaryValue(workbook, 'Saldo bersih ledger')).toBe(7500000 - 1900000);
        expect(summaryValue(workbook, 'Jumlah transaksi')).toBe(5);
    });

    it('memisahkan honor tim dari pemasukan klien dan menghitung tagihan', () => {
        const workbook = buildBackupReportWorkbook(buildRecords());
        expect(summaryValue(workbook, 'Total nilai kontrak')).toBe(10000000);
        expect(summaryValue(workbook, 'Total pembayaran masuk')).toBe(7500000);
        expect(summaryValue(workbook, 'Sisa tagihan')).toBe(2500000);
        expect(summaryValue(workbook, 'Total honor tim')).toBe(1000000);
    });

    it('tidak menggandakan transaksi pada sheet pembayaran/pengeluaran', () => {
        const workbook = buildBackupReportWorkbook(buildRecords());
        const payments = workbook.getWorksheet('Riwayat Pembayaran')!;
        const expenses = workbook.getWorksheet('Pengeluaran Proyek')!;
        expect(payments.rowCount - 1).toBe(3); // 3 transaksi pemasukan
        expect(expenses.rowCount - 1).toBe(2); // 2 transaksi pengeluaran
    });

    it('menyelesaikan relasi proyek, klien, kontrak, kartu, dan nomor urut', () => {
        const workbook = buildBackupReportWorkbook(buildRecords());
        const events = workbook.getWorksheet('Pengantin & Acara Pernikahan')!;
        const payments = workbook.getWorksheet('Riwayat Pembayaran')!;

        // Relasi kontrak → nama pengantin & pasangan.
        expect(cellValue(events, 2, 'Nama Pengantin')).toBe('Rina');
        expect(cellValue(events, 2, 'Nama Pasangan')).toBe('Budi');
        expect(cellValue(events, 2, 'Durasi Paket')).toBe('6 Jam');
        // ID asli dipertahankan (tidak diganti nama).
        expect(cellValue(events, 2, 'ID Pengantin')).toBe('client-1');
        // Nomor urut.
        expect(cellValue(events, 2, 'No')).toBe(1);

        // Relasi transaksi → proyek → klien.
        expect(cellValue(payments, 2, 'Nama Pengantin')).toBe('Rina');
        expect(cellValue(payments, 2, 'Acara')).toBe('Wedding Rina & Budi');

        // Relasi transaksi pengeluaran → kartu/rekening.
        const expenseSheet = workbook.getWorksheet('Pengeluaran Proyek')!;
        expect(String(cellValue(expenseSheet, 2, 'Kartu / Rekening'))).toContain('BCA');
    });

    it('menerapkan format Rupiah numerik, tanggal dd/mm/yyyy, freeze, dan auto filter', () => {
        const workbook = buildBackupReportWorkbook(buildRecords());
        const events = workbook.getWorksheet('Pengantin & Acara Pernikahan')!;
        const amountColumn = events.getColumn(headerIndex(events, 'Nilai Kontrak'));
        const dateColumn = events.getColumn(headerIndex(events, 'Tanggal Acara'));

        expect(String(amountColumn.numFmt)).toContain('Rp');
        expect(String(dateColumn.numFmt)).toBe('dd/mm/yyyy');
        expect(cellValue(events, 2, 'Nilai Kontrak')).toBe(10000000);
        expect(cellValue(events, 2, 'Tanggal Acara')).toBeInstanceOf(Date);
        expect(events.views?.[0]).toMatchObject({ state: 'frozen', ySplit: 1 });
        expect(events.autoFilter).toMatchObject({ from: { row: 1, column: 1 }, to: { row: 1, column: 22 } });
    });

    it('tetap aman saat tidak ada data', () => {
        const workbook = buildBackupReportWorkbook([]);
        expect(workbook.worksheets).toHaveLength(12);
        expect(summaryValue(workbook, 'Total pemasukan ledger')).toBe(0);
        expect(summaryValue(workbook, 'Total honor tim')).toBe(0);
    });
});

// ── B2. Sheet keuangan (Dashboard, Rekap, Saldo, Kantong, Transfer, Kategori) ─

const buildFinanceRecords = (): BackupRecord[] => [
    rec('cards', { id: 'card-1', bank_name: 'BCA', card_type: 'Debit', last_four_digits: '1234', balance: 2500000 }),
    rec('cards', { id: 'card-2', bank_name: 'Tunai', card_type: 'Tunai', last_four_digits: '', balance: 500000 }),
    rec('pockets', { id: 'pocket-1', name: 'Dana Darurat', type: 'Terkunci', amount: 1000000, goal_amount: 2000000 }),
    rec('transactions', { id: 'mt-1', date: '2026-01-01', description: 'Saldo Awal - BCA', amount: 1000000, type: 'Pemasukan', category: 'Modal', method: 'Sistem', card_id: 'card-1' }),
    rec('transactions', { id: 'in-1', date: '2026-02-01', description: 'DP Pengantin', amount: 5000000, type: 'Pemasukan', category: 'DP Pengantin', method: 'Transfer Bank', card_id: 'card-1' }),
    rec('transactions', { id: 'out-1', date: '2026-02-10', description: 'Sewa tempat', amount: 1500000, type: 'Pengeluaran', category: 'Sewa Tempat', method: 'Transfer Bank', card_id: 'card-1' }),
    rec('transactions', { id: 'tr-1', date: '2026-02-15', description: 'Transfer: ke Tunai', amount: 200000, type: 'Pengeluaran', category: 'Transfer Internal', method: 'Sistem', card_id: 'card-1' }),
];

const dashboardNominal = (workbook: Workbook, item: string) => {
    const sheet = workbook.getWorksheet('Dashboard Keuangan')!;
    for (let row = 2; row <= sheet.rowCount; row += 1) {
        if (sheet.getRow(row).getCell(2).value === item) {
            return sheet.getRow(row).getCell(3).value as number;
        }
    }
    return undefined;
};

describe('sheet keuangan', () => {
    it('Dashboard Keuangan menghitung saldo, arus kas, dan aset dari data aktual', () => {
        const workbook = buildBackupReportWorkbook(buildFinanceRecords());
        expect(dashboardNominal(workbook, 'Total saldo seluruh rekening/kartu')).toBe(3000000);
        expect(dashboardNominal(workbook, 'Total saldo kantong keuangan')).toBe(1000000);
        expect(dashboardNominal(workbook, 'Total aset (rekening + kantong)')).toBe(4000000);
        expect(dashboardNominal(workbook, 'Total pemasukan')).toBe(6000000);
        expect(dashboardNominal(workbook, 'Total pengeluaran')).toBe(1700000);
        expect(dashboardNominal(workbook, 'Saldo bersih')).toBe(6000000 - 1700000);
    });

    it('Saldo Rekening & Kartu memuat saldo awal, arus, saldo akhir, dan total', () => {
        const workbook = buildBackupReportWorkbook(buildFinanceRecords());
        const sheet = workbook.getWorksheet('Saldo Rekening & Kartu')!;
        expect(cellValue(sheet, 2, 'Nama Rekening / Kartu')).toBe('BCA');
        expect(cellValue(sheet, 2, 'Saldo Awal')).toBe(1000000);
        expect(cellValue(sheet, 2, 'Total Pemasukan')).toBe(6000000);
        expect(cellValue(sheet, 2, 'Total Pengeluaran')).toBe(1700000);
        expect(cellValue(sheet, 2, 'Saldo Akhir')).toBe(2500000);
        // Identitas kartu dimasker (hanya 4 digit terakhir).
        expect(String(cellValue(sheet, 2, 'Identitas'))).toContain('1234');
        // Baris TOTAL.
        expect(cellValue(sheet, 4, 'Nama Rekening / Kartu')).toBe('TOTAL');
        expect(cellValue(sheet, 4, 'Saldo Akhir')).toBe(3000000);
    });

    it('Kantong Keuangan memuat saldo, target, dan progres', () => {
        const workbook = buildBackupReportWorkbook(buildFinanceRecords());
        const sheet = workbook.getWorksheet('Kantong Keuangan')!;
        expect(cellValue(sheet, 2, 'Nama Kantong')).toBe('Dana Darurat');
        expect(cellValue(sheet, 2, 'Saldo')).toBe(1000000);
        expect(cellValue(sheet, 2, 'Target')).toBe(2000000);
        expect(cellValue(sheet, 2, 'Progres (%)')).toBe(50);
    });

    it('Transfer Antar-Rekening memuat transaksi Transfer Internal', () => {
        const workbook = buildBackupReportWorkbook(buildFinanceRecords());
        const sheet = workbook.getWorksheet('Transfer Antar-Rekening')!;
        expect(sheet.rowCount - 1).toBe(2); // 1 transaksi + 1 baris TOTAL
        expect(cellValue(sheet, 2, 'Rekening Asal')).toBe('BCA ••••1234');
        expect(cellValue(sheet, 2, 'Nominal')).toBe(200000);
    });

    it('Rekap Kategori Keuangan menjumlahkan per kategori & jenis', () => {
        const workbook = buildBackupReportWorkbook(buildFinanceRecords());
        const sheet = workbook.getWorksheet('Rekap Kategori Keuangan')!;
        const categories: string[] = [];
        for (let row = 2; row <= sheet.rowCount; row += 1) {
            categories.push(String(sheet.getRow(row).getCell(headerIndex(sheet, 'Kategori')).value));
        }
        expect(categories).toContain('Modal');
        expect(categories).toContain('Transfer Internal');
    });

    it('Rekap Pemasukan & Pengeluaran memisahkan jenis transaksi', () => {
        const workbook = buildBackupReportWorkbook(buildFinanceRecords());
        const incomeSheet = workbook.getWorksheet('Rekap Pemasukan')!;
        const expenseSheet = workbook.getWorksheet('Rekap Pengeluaran')!;
        expect(incomeSheet.rowCount - 1).toBe(3); // 2 pemasukan + TOTAL
        expect(expenseSheet.rowCount - 1).toBe(3); // 2 pengeluaran + TOTAL
        expect(cellValue(incomeSheet, incomeSheet.rowCount, 'Nominal')).toBe(6000000);
        expect(cellValue(expenseSheet, expenseSheet.rowCount, 'Nominal')).toBe(1700000);
    });
});

// ── A. Backup lengkap ────────────────────────────────────────────────────────

describe('buildFullBackupWorkbook', () => {
    it('membuat satu sheet per tabel + ringkasan backup', () => {
        const workbook = buildFullBackupWorkbook(buildRecords());
        expect(workbook.worksheets[0].name).toBe('Ringkasan Backup');
        expect(workbook.worksheets).toHaveLength(BACKUP_DATASETS.length + 1);
    });

    it('mempertahankan seluruh kolom asli, ID, foreign key, dan data JSON', () => {
        const workbook = buildFullBackupWorkbook(buildRecords());
        const transactions = workbook.getWorksheet('Transaksi ledger')!;
        expect(headerIndex(transactions, 'ID')).toBeGreaterThan(0);
        expect(headerIndex(transactions, 'Project ID')).toBeGreaterThan(0);
        expect(headerIndex(transactions, 'Card ID')).toBeGreaterThan(0);
        expect(headerIndex(transactions, 'Amount')).toBeGreaterThan(0);
        expect(cellValue(transactions, 2, 'ID')).toBe('tx-1');

        // Kolom JSON (custom_costs) tidak boleh hilang — diwakili sebagai string JSON.
        const projects = workbook.getWorksheet('Proyek')!;
        const jsonColumn = headerIndex(projects, 'Custom Costs');
        expect(jsonColumn).toBeGreaterThan(0);
        const payload = projects.getRow(2).getCell(jsonColumn).value as string;
        expect(typeof payload).toBe('string');
        expect(payload).toContain('"amount":500000');
    });

    it('memberi pesan pada tabel kosong tanpa crash', () => {
        const workbook = buildFullBackupWorkbook([]);
        const clientsSheet = workbook.getWorksheet('Klien')!;
        expect(String(clientsSheet.getCell(2, 1).value)).toContain('Tidak ada data');
    });
});

// ── CSV ──────────────────────────────────────────────────────────────────────

describe('buildBackupCsvRows', () => {
    it('menyajikan nominal sebagai angka murni dan tanggal dd/mm/yyyy', () => {
        const rows = buildBackupCsvRows([rec('transactions', { id: 'tx-1', date: '2026-02-01', description: 'DP', amount: 5000000, type: 'Pemasukan', category: 'DP' })]);
        const row = rows[0];
        expect(typeof row[6]).toBe('number');
        expect(row[6]).toBe(5000000);
        expect(row[3]).toBe('01/02/2026');
        expect(String(row[6])).not.toContain('Rp');
        expect(row).toHaveLength(8);
    });
});

// ── Konsistensi & isolasi ────────────────────────────────────────────────────

describe('buildFinanceCsvRows', () => {
    it('memuat ringkasan, pemasukan/pengeluaran, rekening, kantong, transfer, dan kategori', () => {
        const rows = buildFinanceCsvRows(buildFinanceRecords());
        expect(FINANCE_CSV_HEADERS).toHaveLength(10);
        rows.forEach((row) => expect(row).toHaveLength(10));

        const sections = new Set(rows.map((row) => String(row[0])));
        expect(sections).toContain('Ringkasan Keuangan');
        expect(sections).toContain('Pemasukan');
        expect(sections).toContain('Pengeluaran');
        expect(sections).toContain('Rekening & Kartu');
        expect(sections).toContain('Kantong Keuangan');
        expect(sections).toContain('Transfer Antar-Rekening');
        expect(sections).toContain('Rekap Kategori');

        const summaryRow = rows.find((row) => row[3] === 'Total pemasukan')!;
        expect(typeof summaryRow[8]).toBe('number');
        expect(summaryRow[8]).toBe(6000000);
    });
});

describe('konsistensi dan isolasi', () => {
    it('klasifikasi pemasukan/pengeluaran mengikuti tipe transaksi', () => {
        expect(isBackupIncome({ type: 'Pemasukan' })).toBe(true);
        expect(isBackupIncome({ type: 'Pengeluaran' })).toBe(false);
        expect(isBackupExpense({ type: 'Pengeluaran' })).toBe(true);
    });

    it('hanya memakai data yang diberikan (tanpa query lintas vendor)', () => {
        const vendorA = buildRecords();
        const vendorB = [
            rec('projects', { id: 'VENDOR_B_PROJECT', project_name: 'VENDOR_B_NAME', client_name: 'VENDOR_B_CLIENT', date: '2027-01-01', total_cost: 1000000 }),
        ];
        const workbook = buildBackupReportWorkbook(vendorA);
        const strings = collectStrings(workbook);
        expect(strings.some((value) => value.includes('VENDOR_B'))).toBe(false);
        // Vendor B tetap terisolasi pada input-nya sendiri.
        const otherWorkbook = buildBackupReportWorkbook(vendorB);
        expect(collectStrings(otherWorkbook).some((value) => value.includes('VENDOR_B_NAME'))).toBe(true);
    });

    it('getBackupRecordAmount membaca kolom nominal sesuai dataset', () => {
        expect(getBackupRecordAmount(rec('projects', { id: 'p1', total_cost: 10000000 }))).toBe(10000000);
        expect(getBackupRecordAmount(rec('team_project_payments', { id: 'tp1', fee: 750000 }))).toBe(750000);
        expect(getBackupRecordAmount(rec('clients', { id: 'c1', name: 'Rina' }))).toBe(0);
    });
});
