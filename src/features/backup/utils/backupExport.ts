import ExcelJS from 'exceljs';
import { downloadCSV } from '../../../utils/export';

// ─────────────────────────────────────────────────────────────────────────────
// Konfigurasi cakupan backup (19 tabel operasional).
// Profil publik & portofolio sengaja TIDAK dimasukkan.
// ─────────────────────────────────────────────────────────────────────────────

export interface BackupDataset {
    table: string;
    label: string;
    category: string;
    amountFields?: string[];
}

export interface BackupRecord {
    dataset: BackupDataset;
    value: Record<string, unknown>;
}

export interface BackupExportContext {
    companyName?: string;
    generatedAt?: Date;
}

export const BACKUP_DATASETS: BackupDataset[] = [
    { table: 'clients', label: 'Klien', category: 'Klien' },
    { table: 'leads', label: 'Calon klien', category: 'Klien' },
    { table: 'client_feedback', label: 'Umpan balik klien', category: 'Klien' },
    { table: 'projects', label: 'Proyek', category: 'Proyek', amountFields: ['total_cost', 'amount_paid'] },
    { table: 'project_add_ons', label: 'Add-on proyek', category: 'Proyek' },
    { table: 'project_team_assignments', label: 'Penugasan tim proyek', category: 'Proyek' },
    { table: 'wedding_day_checklists', label: 'Checklist hari acara', category: 'Proyek' },
    { table: 'calendar_events', label: 'Agenda kalender', category: 'Proyek' },
    { table: 'contracts', label: 'Kontrak', category: 'Proyek' },
    { table: 'transactions', label: 'Transaksi ledger', category: 'Keuangan', amountFields: ['amount'] },
    { table: 'cards', label: 'Kartu/rekening', category: 'Keuangan', amountFields: ['balance'] },
    { table: 'pockets', label: 'Kantong keuangan', category: 'Keuangan', amountFields: ['amount', 'goal_amount'] },
    { table: 'team_members', label: 'Anggota tim', category: 'Tim' },
    { table: 'team_project_payments', label: 'Pembayaran tim per proyek', category: 'Tim', amountFields: ['fee', 'amount'] },
    { table: 'team_payment_records', label: 'Catatan pembayaran tim', category: 'Tim', amountFields: ['amount', 'fee'] },
    { table: 'packages', label: 'Paket', category: 'Paket', amountFields: ['price'] },
    { table: 'add_ons', label: 'Add-on paket', category: 'Paket', amountFields: ['price'] },
    { table: 'promo_codes', label: 'Kode promo', category: 'Paket', amountFields: ['discount_amount'] },
    { table: 'notifications', label: 'Notifikasi', category: 'Lainnya' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Tipe umum
// ─────────────────────────────────────────────────────────────────────────────

type CellValue = string | number | boolean | Date | null | undefined;
type ExportRow = Record<string, CellValue>;
type ColumnType = 'text' | 'number' | 'currency' | 'date' | 'datetime' | 'status';
type CellFormat = 'currency' | 'number';

interface ColumnDefinition {
    header: string;
    key: string;
    type?: ColumnType;
    wrap?: boolean;
    align?: 'left' | 'center' | 'right';
    minWidth?: number;
    maxWidth?: number;
}

interface SheetDefinition {
    name: string;
    columns: ColumnDefinition[];
    rows: ExportRow[];
    emptyMessage?: string;
}

interface SummaryRow {
    section: string;
    item: string;
    value: number;
    note: string;
    format: CellFormat;
}

// ─────────────────────────────────────────────────────────────────────────────
// Format angka & tanggal (standar Indonesia) — konsisten dengan modul export lain
// ─────────────────────────────────────────────────────────────────────────────

const currencyFormat = '"Rp" #,##0;[Red]("Rp" #,##0);-';
const numberFormat = '#,##0';
const dateFormat = 'dd/mm/yyyy';
const dateTimeFormat = 'dd/mm/yyyy hh:mm';

const headerFill = 'FF1E3A8A';
const headerBorder = 'FFBFDBFE';
const zebraFill = 'FFF8FAFC';
const borderColor = 'FFE2E8F0';
const titleFill = 'FF1E3A8A';
const infoColor = 'FF5A6A85';

const SECTION_FILL: Record<string, string> = {
    'Ringkasan Keuangan': 'FFECFDF5',
    'Nilai Kontrak': 'FFEFF6FF',
    'Pembayaran & Tagihan': 'FFF5F3FF',
    'Honor Tim': 'FFFFF7ED',
    'Data Backup': 'FFF1F5F9',
};

const pad = (value: number) => String(value).padStart(2, '0');

const getExportDateStamp = (date: Date = new Date()) =>
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

/** Excel melarang karakter * ? : \ / [ ] pada nama sheet; ganti dengan tanda hubung. */
const sanitizeSheetName = (name: string) =>
    name.replace(/[*?:\\/[\]]/g, '-').slice(0, 31);

const toNumber = (value: unknown) => {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : 0;
};

const parseDateValue = (value?: string | null): Date | null => {
    if (!value) return null;
    const trimmed = String(value).trim();
    if (!trimmed) return null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
        const [year, month, day] = trimmed.split('-').map(Number);
        return new Date(year, month - 1, day);
    }
    const parsed = new Date(trimmed);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatDateForCsv = (value?: string | null) => {
    const date = parseDateValue(value);
    if (!date) return '';
    return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
};

const formatDateTimeDisplay = (date: Date) =>
    `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;

// ─────────────────────────────────────────────────────────────────────────────
// Pembacaan nilai dari baris mentah (mendukung beberapa alias kolom)
// ─────────────────────────────────────────────────────────────────────────────

const MONEY_KEY = /(amount|price|cost|fee|balance|total|discount|paid|revenue|profit|honor|salary|gaji|nominal|subtotal)/i;

const humanize = (key: string): string => {
    if (key === 'id') return 'ID';
    if (key.endsWith('_id')) return `${humanize(key.slice(0, -3))} ID`;
    return key.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
};

const pickText = (row: Record<string, unknown>, keys: string[]): string => {
    for (const key of keys) {
        const value = row[key];
        if (value !== null && value !== undefined && value !== '') return String(value);
    }
    return '';
};

const pickNumber = (row: Record<string, unknown>, keys: string[]): number => {
    for (const key of keys) {
        const value = row[key];
        if (value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value))) {
            return Number(value);
        }
    }
    return 0;
};

const getAmountValue = (dataset: BackupDataset, row: Record<string, unknown>): number => {
    for (const field of dataset.amountFields ?? []) {
        const value = row[field];
        if (value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value))) {
            return Number(value);
        }
    }
    return 0;
};

const getRecordDate = (row: Record<string, unknown>): string =>
    pickText(row, ['date', 'event_date', 'wedding_date', 'payment_date', 'created_at', 'timestamp']);

const getRecordLabel = (row: Record<string, unknown>): string =>
    pickText(row, ['name', 'full_name', 'project_name', 'team_member_name', 'description', 'title', 'client_name', 'code']);

// ─────────────────────────────────────────────────────────────────────────────
// Aturan keuangan (mengikuti konvensi modul Keuangan & export Pengantin)
// ─────────────────────────────────────────────────────────────────────────────

const cancelledKeywords = /(batal|dibatalkan|ditolak|gagal)/i;
const refundKeywords = /(refund|pengembalian|koreksi)/i;

const isIncomeRow = (row: Record<string, unknown>) => {
    const type = String(row.type ?? '').toLowerCase();
    return type.includes('pemasukan') || type === 'income';
};

const isExpenseRow = (row: Record<string, unknown>) => {
    const type = String(row.type ?? '').toLowerCase();
    return type.includes('pengeluaran') || type === 'expense';
};

const inferPaymentKind = (row: Record<string, unknown>) => {
    const haystack = `${pickText(row, ['category'])} ${pickText(row, ['description'])}`.toLowerCase();
    if (refundKeywords.test(haystack) || toNumber(row.amount) < 0) return 'Refund / Koreksi';
    if (/(^|\W)(dp|uang muka)(\W|$)|booking fee/i.test(haystack)) return 'DP';
    if (/pelunasan|lunas/i.test(haystack)) return 'Pelunasan';
    if (/termin|angsuran/i.test(haystack)) return 'Termin';
    return 'Pembayaran';
};

const inferPaymentRowStatus = (row: Record<string, unknown>) => {
    const haystack = `${pickText(row, ['category'])} ${pickText(row, ['description'])}`.toLowerCase();
    if (cancelledKeywords.test(haystack)) return 'Batal / Ditolak';
    if (refundKeywords.test(haystack) || toNumber(row.amount) < 0) return 'Refund / Koreksi';
    return 'Diterima';
};

const inferExpenseRowStatus = (row: Record<string, unknown>) => {
    const haystack = `${pickText(row, ['category'])} ${pickText(row, ['description'])}`.toLowerCase();
    if (cancelledKeywords.test(haystack)) return 'Batal / Ditolak';
    if (refundKeywords.test(haystack) || toNumber(row.amount) < 0) return 'Refund / Koreksi';
    return 'Dikeluarkan';
};

const isTransferInternal = (row: Record<string, unknown>) =>
    /transfer internal/i.test(pickText(row, ['category'])) || /transfer/i.test(pickText(row, ['description']));

/** Masker identitas kartu — hanya 4 digit terakhir yang ditampilkan. */
const maskCardIdentity = (card: Record<string, unknown>) => {
    const digits = pickText(card, ['last_four_digits', 'last4', 'last_four']);
    return digits ? `•••• ${digits}` : '—';
};

/**
 * Kontribusi transaksi terhadap pembayaran bersih proyek.
 * - Hanya pemasukan yang dihitung.
 * - Batal / ditolak tidak dihitung.
 * - Refund / koreksi bernilai negatif otomatis mengurangi total.
 */
const getPaymentContribution = (row: Record<string, unknown>) => {
    if (!isIncomeRow(row)) return 0;
    const haystack = `${pickText(row, ['category'])} ${pickText(row, ['description'])}`.toLowerCase();
    if (cancelledKeywords.test(haystack)) return 0;
    return toNumber(row.amount);
};

// ─────────────────────────────────────────────────────────────────────────────
// Styling Excel (header tegas, zebra, border tipis, wrap, freeze, auto filter)
// ─────────────────────────────────────────────────────────────────────────────

const statusColor = (value: string) => {
    const normalized = value.toLowerCase();
    if (normalized.includes('lunas') || normalized.includes('selesai') || normalized === 'paid' || normalized.includes('diterima')) {
        return { fill: 'FFDCFCE7', font: 'FF166534' };
    }
    if (normalized.includes('batal') || normalized.includes('ditolak') || normalized.includes('refund') || normalized.includes('gagal') || normalized.includes('cancelled')) {
        return { fill: 'FFFEE2E2', font: 'FFB91C1C' };
    }
    if (normalized.includes('belum') || normalized === 'unpaid' || normalized.includes('pending') || normalized.includes('menunggu')) {
        return { fill: 'FFFEF3C7', font: 'FF92400E' };
    }
    if (
        normalized.includes('dp') || normalized.includes('sebagian') || normalized.includes('proses') ||
        normalized.includes('aktif') || normalized.includes('dikonfirmasi') || normalized.includes('persiapan') ||
        normalized.includes('terbayar') || normalized.includes('pemasukan')
    ) {
        return { fill: 'FFDBEAFE', font: 'FF1D4ED8' };
    }
    if (normalized.includes('pengeluaran')) {
        return { fill: 'FFFEE2E2', font: 'FFB91C1C' };
    }
    return null;
};

const formatCellForWidth = (value: CellValue, columnType?: ColumnType) => {
    if (value === null || value === undefined) return '';
    if (value instanceof Date) {
        if (columnType === 'datetime') return formatDateTimeDisplay(value);
        return `${pad(value.getDate())}/${pad(value.getMonth() + 1)}/${value.getFullYear()}`;
    }
    if (typeof value === 'number') return value.toLocaleString('id-ID');
    if (typeof value === 'boolean') return value ? 'Ya' : 'Tidak';
    return String(value);
};

const autoFitColumns = (worksheet: ExcelJS.Worksheet, columns: ColumnDefinition[]) => {
    columns.forEach((columnDefinition, index) => {
        const column = worksheet.getColumn(index + 1);
        const minWidth = columnDefinition.minWidth ?? 14;
        const maxWidth = columnDefinition.maxWidth ?? (columnDefinition.wrap ? 36 : 26);
        let width = Math.max(minWidth, columnDefinition.header.length + 2);

        column.eachCell({ includeEmpty: true }, (cell) => {
            const value = formatCellForWidth(cell.value as CellValue, columnDefinition.type);
            const longestLine = value
                .split('\n')
                .reduce((longest, line) => Math.max(longest, line.length), 0);
            width = Math.max(width, longestLine + 2);
        });

        column.width = Math.min(maxWidth, width);
    });
};

const applyCellBorder = (cell: ExcelJS.Cell, color: string = borderColor) => {
    cell.border = {
        top: { style: 'thin', color: { argb: color } },
        left: { style: 'thin', color: { argb: color } },
        bottom: { style: 'thin', color: { argb: color } },
        right: { style: 'thin', color: { argb: color } },
    };
};

const styleHeaderRow = (row: ExcelJS.Row, columnCount: number) => {
    row.height = 28;
    for (let index = 1; index <= columnCount; index += 1) {
        const cell = row.getCell(index);
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: headerFill } };
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        applyCellBorder(cell, headerBorder);
    }
};

const getAlignment = (columnDefinition: ColumnDefinition): 'left' | 'center' | 'right' => {
    if (columnDefinition.align) return columnDefinition.align;
    if (columnDefinition.type === 'currency' || columnDefinition.type === 'number') return 'right';
    if (columnDefinition.type === 'date' || columnDefinition.type === 'datetime') return 'center';
    return 'left';
};

const applyWorksheetStyles = (worksheet: ExcelJS.Worksheet, columns: ColumnDefinition[]) => {
    worksheet.views = [{ state: 'frozen', ySplit: 1, topLeftCell: 'A2', showGridLines: false }];
    worksheet.autoFilter = {
        from: { row: 1, column: 1 },
        to: { row: 1, column: columns.length },
    };

    styleHeaderRow(worksheet.getRow(1), columns.length);

    worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;
        row.eachCell({ includeEmpty: true }, (cell, columnNumber) => {
            const columnDefinition = columns[columnNumber - 1];
            if (!columnDefinition) return;
            cell.alignment = {
                vertical: 'top',
                horizontal: getAlignment(columnDefinition),
                wrapText: Boolean(columnDefinition.wrap),
            };
            applyCellBorder(cell);
            if (rowNumber % 2 === 0) {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: zebraFill } };
            }
        });
    });
};

const applyColumnFormats = (worksheet: ExcelJS.Worksheet, columns: ColumnDefinition[]) => {
    columns.forEach((columnDefinition, index) => {
        const column = worksheet.getColumn(index + 1);
        switch (columnDefinition.type) {
            case 'currency':
                column.numFmt = currencyFormat;
                break;
            case 'number':
                column.numFmt = numberFormat;
                break;
            case 'date':
                column.numFmt = dateFormat;
                break;
            case 'datetime':
                column.numFmt = dateTimeFormat;
                break;
            default:
                break;
        }
    });
};

const applyStatusCellStyling = (worksheet: ExcelJS.Worksheet, columns: ColumnDefinition[]) => {
    const statusColumnIndexes = columns
        .map((column, index) => ({ column, index: index + 1 }))
        .filter(({ column }) => column.type === 'status')
        .map(({ index }) => index);

    statusColumnIndexes.forEach((columnIndex) => {
        worksheet.getColumn(columnIndex).eachCell({ includeEmpty: false }, (cell, rowNumber) => {
            if (rowNumber === 1 || typeof cell.value !== 'string' || !cell.value) return;
            const color = statusColor(cell.value);
            if (!color) return;
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: color.fill } };
            cell.font = { bold: true, color: { argb: color.font } };
            cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        });
    });
};

const createDataWorksheet = (workbook: ExcelJS.Workbook, sheet: SheetDefinition) => {
    const worksheet = workbook.addWorksheet(sanitizeSheetName(sheet.name));
    worksheet.columns = sheet.columns.map((column) => ({
        header: column.header,
        key: column.key,
        width: column.minWidth ?? 14,
    }));

    sheet.rows.forEach((row) => {
        worksheet.addRow(row);
    });

    if (sheet.rows.length === 0 && sheet.emptyMessage) {
        const lastColumn = Math.max(1, sheet.columns.length);
        if (lastColumn > 1) {
            worksheet.mergeCells(2, 1, 2, lastColumn);
        }
        const infoCell = worksheet.getCell(2, 1);
        infoCell.value = sheet.emptyMessage;
        infoCell.font = { italic: true, color: { argb: infoColor } };
        infoCell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
        worksheet.getRow(2).height = 24;
        applyCellBorder(infoCell);
    }

    applyWorksheetStyles(worksheet, sheet.columns);
    applyColumnFormats(worksheet, sheet.columns);
    applyStatusCellStyling(worksheet, sheet.columns);
    autoFitColumns(worksheet, sheet.columns);

    return worksheet;
};

const createSummaryWorksheet = (
    workbook: ExcelJS.Workbook,
    sheetName: string,
    title: string,
    subtitle: string,
    summary: SummaryRow[],
) => {
    const worksheet = workbook.addWorksheet(sanitizeSheetName(sheetName));
    [22, 42, 20, 54].forEach((width, index) => {
        worksheet.getColumn(index + 1).width = width;
    });

    worksheet.mergeCells('A1:D1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = title;
    titleCell.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: titleFill } };
    titleCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    worksheet.getRow(1).height = 32;

    worksheet.mergeCells('A2:D2');
    const subtitleCell = worksheet.getCell('A2');
    subtitleCell.value = subtitle;
    subtitleCell.font = { italic: true, size: 10, color: { argb: infoColor } };
    subtitleCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    worksheet.getRow(2).height = 20;

    const headerRowNumber = 4;
    const headerLabels = ['Bagian', 'Item', 'Nilai', 'Catatan'];
    const headerRow = worksheet.getRow(headerRowNumber);
    headerLabels.forEach((label, index) => {
        headerRow.getCell(index + 1).value = label;
    });
    styleHeaderRow(headerRow, headerLabels.length);

    let previousSection = '';
    summary.forEach((row, index) => {
        const targetRow = worksheet.getRow(headerRowNumber + 1 + index);
        const isNewSection = row.section !== previousSection;
        previousSection = row.section;

        targetRow.getCell(1).value = isNewSection ? row.section : '';
        targetRow.getCell(2).value = row.item;
        targetRow.getCell(3).value = row.value;
        targetRow.getCell(4).value = row.note;

        const sectionFill = SECTION_FILL[row.section] || zebraFill;
        targetRow.eachCell({ includeEmpty: true }, (cell, columnNumber) => {
            if (columnNumber > headerLabels.length) return;
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: sectionFill } };
            applyCellBorder(cell);
            cell.alignment = {
                vertical: 'top',
                horizontal: columnNumber === 3 ? 'right' : 'left',
                wrapText: columnNumber === 2 || columnNumber === 4,
            };
            if (columnNumber === 3) {
                cell.numFmt = row.format === 'currency' ? currencyFormat : numberFormat;
                cell.font = { bold: true };
            }
            if (columnNumber === 1 && isNewSection) {
                cell.font = { bold: true, color: { argb: 'FF1E3A8A' } };
            }
        });
    });

    worksheet.views = [{ state: 'frozen', ySplit: headerRowNumber, showGridLines: false }];
    worksheet.autoFilter = {
        from: { row: headerRowNumber, column: 1 },
        to: { row: headerRowNumber, column: headerLabels.length },
    };

    return worksheet;
};

const createWorkbook = (context: BackupExportContext) => {
    const generatedAt = context.generatedAt ?? new Date();
    const companyName = context.companyName || 'Vena';
    const workbook = new ExcelJS.Workbook();
    workbook.creator = companyName;
    workbook.created = generatedAt;
    return { workbook, companyName, generatedAt };
};

const downloadWorkbook = async (workbook: ExcelJS.Workbook, filename: string) => {
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer as BlobPart], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
};

// ─────────────────────────────────────────────────────────────────────────────
// Kelompokkan record per tabel (mempertahankan urutan definisi dataset)
// ─────────────────────────────────────────────────────────────────────────────

const groupRecordsByTable = (records: BackupRecord[]) => {
    const map = new Map<string, Record<string, unknown>[]>();
    records.forEach((record) => {
        const list = map.get(record.dataset.table) || [];
        list.push(record.value);
        map.set(record.dataset.table, list);
    });
    return map;
};

// ─────────────────────────────────────────────────────────────────────────────
// A. BACKUP LENGKAP — satu sheet per tabel, seluruh kolom asli dipertahankan
// ─────────────────────────────────────────────────────────────────────────────

const inferColumnType = (dataset: BackupDataset, key: string): ColumnType => {
    if ((dataset.amountFields || []).includes(key) || MONEY_KEY.test(key)) return 'currency';
    if (/_at$/i.test(key)) return 'datetime';
    if (/(^|_)(date|tanggal)/i.test(key)) return 'date';
    if (/(^|_)(status)/i.test(key)) return 'status';
    return 'text';
};

const buildDynamicColumns = (dataset: BackupDataset, rows: Record<string, unknown>[]): ColumnDefinition[] => {
    const keys: string[] = [];
    rows.forEach((row) => {
        Object.keys(row).forEach((key) => {
            if (!keys.includes(key)) keys.push(key);
        });
    });

    if (keys.length === 0) {
        return [{ header: 'Keterangan', key: '__empty', type: 'text', wrap: true, minWidth: 40, maxWidth: 60 }];
    }

    return keys.map((key) => {
        // Nilai kompleks (objek/array/JSON) diperlakukan sebagai teks agar tidak
        // salah diformat sebagai mata uang (mis. kolom custom_costs).
        const hasComplexValue = rows.some((row) => row[key] !== null && typeof row[key] === 'object');
        const type = hasComplexValue ? 'text' : inferColumnType(dataset, key);
        if (type === 'currency') return { header: humanize(key), key, type, minWidth: 16 };
        if (type === 'datetime') return { header: humanize(key), key, type, minWidth: 18 };
        if (type === 'date') return { header: humanize(key), key, type, minWidth: 14 };
        if (type === 'status') return { header: humanize(key), key, type, minWidth: 14 };
        return { header: humanize(key), key, type, wrap: true, minWidth: 16, maxWidth: 44 };
    });
};

const normalizeFullValue = (raw: unknown, type: ColumnType): CellValue => {
    if (raw === null || raw === undefined) return null;
    if (typeof raw === 'object') return JSON.stringify(raw);
    if (type === 'date' || type === 'datetime') {
        const parsed = parseDateValue(String(raw));
        return parsed ?? String(raw);
    }
    if (typeof raw === 'string' || typeof raw === 'number' || typeof raw === 'boolean') return raw;
    return String(raw);
};

export const buildFullBackupWorkbook = (
    records: BackupRecord[],
    context: BackupExportContext = {},
): ExcelJS.Workbook => {
    const { workbook, companyName, generatedAt } = createWorkbook(context);
    const rowsByTable = groupRecordsByTable(records);

    // Sheet ringkasan isi backup
    const summary = [
        ...BACKUP_DATASETS.map((dataset) => ({
            section: dataset.category,
            item: dataset.label,
            value: (rowsByTable.get(dataset.table) || []).length,
            note: dataset.table,
            format: 'number' as CellFormat,
        })),
        { section: 'Total', item: 'Total baris data', value: records.length, note: 'Seluruh tabel operasional', format: 'number' as CellFormat },
    ];
    createSummaryWorksheet(
        workbook,
        'Ringkasan Backup',
        `BACKUP LENGKAP DATA OPERASIONAL — ${companyName}`,
        `Seluruh tabel operasional, semua kolom & ID dipertahankan • Dibuat: ${formatDateTimeDisplay(generatedAt)}`,
        summary,
    );

    BACKUP_DATASETS.forEach((dataset) => {
        const rows = rowsByTable.get(dataset.table) || [];
        const columns = buildDynamicColumns(dataset, rows);
        createDataWorksheet(workbook, {
            name: dataset.label,
            columns,
            rows: rows.map((row) => columns.reduce<ExportRow>((accumulator, column) => {
                accumulator[column.key] = normalizeFullValue(row[column.key], column.type || 'text');
                return accumulator;
            }, {})),
            emptyMessage: `Tidak ada data pada tabel "${dataset.label}" (${dataset.table}).`,
        });
    });

    return workbook;
};

export const exportFullBackupToExcel = async (
    records: BackupRecord[],
    context: BackupExportContext = {},
): Promise<void> => {
    const workbook = buildFullBackupWorkbook(records, context);
    await downloadWorkbook(workbook, `backup-lengkap-vena-${getExportDateStamp()}.xlsx`);
};

// ─────────────────────────────────────────────────────────────────────────────
// B. LAPORAN EXCEL — 5 sheet (Ringkasan, Pengantin & Acara, Pembayaran,
//    Pengeluaran Proyek, Tim & Honor)
// ─────────────────────────────────────────────────────────────────────────────

const buildReportData = (records: BackupRecord[], context: BackupExportContext) => {
    const { workbook, companyName, generatedAt } = createWorkbook(context);
    const rowsByTable = groupRecordsByTable(records);

    const clients = rowsByTable.get('clients') || [];
    const projects = rowsByTable.get('projects') || [];
    const contracts = rowsByTable.get('contracts') || [];
    const transactions = rowsByTable.get('transactions') || [];
    const teamPayments = rowsByTable.get('team_project_payments') || [];
    const cards = rowsByTable.get('cards') || [];
    const pockets = rowsByTable.get('pockets') || [];

    const clientById = new Map(clients.map((row) => [String(row.id), row]));
    const projectById = new Map(projects.map((row) => [String(row.id), row]));
    const cardById = new Map(cards.map((row) => [String(row.id), row]));
    const pocketById = new Map(pockets.map((row) => [String(row.id), row]));

    const contractsByProjectId = new Map<string, Record<string, unknown>>();
    const contractsByClientId = new Map<string, Record<string, unknown>[]>();
    contracts.forEach((contract) => {
        const projectId = pickText(contract, ['project_id']);
        if (projectId && !contractsByProjectId.has(projectId)) contractsByProjectId.set(projectId, contract);
        const clientId = pickText(contract, ['client_id']);
        if (!clientId) return;
        const list = contractsByClientId.get(clientId) || [];
        list.push(contract);
        contractsByClientId.set(clientId, list);
    });

    const incomeByProjectId = new Map<string, Record<string, unknown>[]>();
    transactions.filter(isIncomeRow).forEach((transaction) => {
        const projectId = pickText(transaction, ['project_id']);
        if (!projectId) return;
        const list = incomeByProjectId.get(projectId) || [];
        list.push(transaction);
        incomeByProjectId.set(projectId, list);
    });

    const describeAccount = (transaction: Record<string, unknown>) => {
        const cardId = pickText(transaction, ['card_id']);
        const card = cardId ? cardById.get(cardId) : undefined;
        if (card) {
            const digits = pickText(card, ['last_four_digits', 'last4', 'last_four']);
            return `${pickText(card, ['bank_name'])}${digits ? ` ••••${digits}` : ''}`.trim();
        }
        const pocketId = pickText(transaction, ['pocket_id']);
        const pocket = pocketId ? pocketById.get(pocketId) : undefined;
        if (pocket) return `Kantong: ${pickText(pocket, ['name'])}`;
        return '';
    };

    const describeProject = (project: Record<string, unknown> | undefined) => ({
        projectName: project ? pickText(project, ['project_name']) : '',
        clientName: project ? pickText(project, ['client_name']) : '',
    });

    const byDateAsc = (left: Record<string, unknown>, right: Record<string, unknown>) =>
        (parseDateValue(getRecordDate(left))?.getTime() || 0) - (parseDateValue(getRecordDate(right))?.getTime() || 0);

    // ── Sheet: Pengantin & Acara Pernikahan ────────────────────────────────
    const eventRows: ExportRow[] = projects.map((project, index) => {
        const clientId = pickText(project, ['client_id']);
        const client = clientById.get(clientId);
        const contract = contractsByProjectId.get(String(project.id)) || (contractsByClientId.get(clientId) || [])[0];
        const totalCost = pickNumber(project, ['total_cost', 'totalCost']);
        const projectIncome = incomeByProjectId.get(String(project.id)) || [];
        const paid = projectIncome.length
            ? projectIncome.reduce((sum, transaction) => sum + getPaymentContribution(transaction), 0)
            : pickNumber(project, ['amount_paid', 'amountPaid']);

        return {
            no: index + 1,
            clientId,
            clientName: contract?.client_name1 ? String(contract.client_name1) : (client ? pickText(client, ['name']) : pickText(project, ['client_name'])),
            brideName: contract?.client_name2 ? String(contract.client_name2) : '',
            whatsapp: client ? pickText(client, ['whatsapp', 'phone']) : '',
            email: client ? pickText(client, ['email']) : '',
            address: client ? pickText(client, ['home_address', 'address']) : '',
            registeredAt: client ? parseDateValue(pickText(client, ['since', 'created_at'])) : null,
            clientStatus: client ? pickText(client, ['status']) : '',
            projectName: pickText(project, ['project_name']),
            eventDate: parseDateValue(pickText(project, ['date'])),
            eventTime: pickText(project, ['start_time']),
            location: pickText(project, ['location']),
            venueAddress: pickText(project, ['address']),
            packageName: pickText(project, ['package_name']),
            packageDuration: pickText(project, ['duration_selection']),
            totalCost,
            paid,
            remaining: Math.max(0, totalCost - paid),
            paymentStatus: pickText(project, ['payment_status']),
            progress: pickNumber(project, ['progress']),
            status: pickText(project, ['status']),
        };
    });

    // ── Sheet: Riwayat Pembayaran (transaksi pemasukan) ────────────────────
    const paymentRows: ExportRow[] = transactions
        .filter(isIncomeRow)
        .sort(byDateAsc)
        .map((transaction, index) => {
            const { projectName, clientName } = describeProject(projectById.get(pickText(transaction, ['project_id'])));
            return {
                no: index + 1,
                date: parseDateValue(pickText(transaction, ['date'])),
                transactionId: String(transaction.id ?? ''),
                clientName,
                projectName,
                description: pickText(transaction, ['description']),
                category: pickText(transaction, ['category']),
                kind: inferPaymentKind(transaction),
                amount: pickNumber(transaction, ['amount']),
                method: pickText(transaction, ['method']),
                account: describeAccount(transaction),
                status: inferPaymentRowStatus(transaction),
            };
        });

    // ── Sheet: Pengeluaran Proyek (transaksi pengeluaran) ──────────────────
    const expenseRows: ExportRow[] = transactions
        .filter(isExpenseRow)
        .sort(byDateAsc)
        .map((transaction, index) => {
            const { projectName, clientName } = describeProject(projectById.get(pickText(transaction, ['project_id'])));
            const proof = [
                pickText(transaction, ['vendor_signature']) ? 'Tanda tangan vendor tersedia' : '',
                pickText(transaction, ['printing_item_id']) ? `Item cetak: ${pickText(transaction, ['printing_item_id'])}` : '',
            ].filter(Boolean);
            return {
                no: index + 1,
                date: parseDateValue(pickText(transaction, ['date'])),
                transactionId: String(transaction.id ?? ''),
                projectName,
                clientName,
                description: pickText(transaction, ['description']),
                category: pickText(transaction, ['category']),
                amount: pickNumber(transaction, ['amount']),
                method: pickText(transaction, ['method']),
                account: describeAccount(transaction),
                proof: proof.join(' | '),
            };
        });

    // ── Sheet: Tim & Honor ─────────────────────────────────────────────────
    const teamRows: ExportRow[] = teamPayments.map((payment, index) => {
        const { projectName, clientName } = describeProject(projectById.get(pickText(payment, ['project_id'])));
        return {
            no: index + 1,
            paymentId: String(payment.id ?? ''),
            memberName: pickText(payment, ['team_member_name', 'name']),
            memberId: pickText(payment, ['team_member_id']),
            projectName,
            clientName,
            date: parseDateValue(pickText(payment, ['date'])),
            fee: pickNumber(payment, ['fee', 'amount']),
            status: pickText(payment, ['status']),
        };
    });

    // ── Ringkasan Dashboard (dihitung dari data aktual) ────────────────────
    const income = transactions.filter(isIncomeRow).reduce((sum, row) => sum + pickNumber(row, ['amount']), 0);
    const expense = transactions.filter(isExpenseRow).reduce((sum, row) => sum + pickNumber(row, ['amount']), 0);
    const totalContract = projects.reduce((sum, row) => sum + pickNumber(row, ['total_cost', 'totalCost']), 0);
    const totalPaid = projects.reduce((sum, project) => {
        const projectIncome = incomeByProjectId.get(String(project.id)) || [];
        return sum + (projectIncome.length
            ? projectIncome.reduce((acc, transaction) => acc + getPaymentContribution(transaction), 0)
            : pickNumber(project, ['amount_paid', 'amountPaid']));
    }, 0);
    const remaining = projects.reduce((sum, project) => {
        const totalCost = pickNumber(project, ['total_cost', 'totalCost']);
        const projectIncome = incomeByProjectId.get(String(project.id)) || [];
        const paid = projectIncome.length
            ? projectIncome.reduce((acc, transaction) => acc + getPaymentContribution(transaction), 0)
            : pickNumber(project, ['amount_paid', 'amountPaid']);
        return sum + Math.max(0, totalCost - paid);
    }, 0);
    const totalHonor = teamPayments.reduce((sum, row) => sum + pickNumber(row, ['fee', 'amount']), 0);

    // ── Data keuangan turunan (Dashboard, Saldo, Kantong, Transfer, Kategori) ──
    // Semua nominal memakai aturan yang sama dengan halaman Keuangan:
    // pemasukan = Σ tipe Pemasukan, pengeluaran = Σ tipe Pengeluaran (termasuk
    // "Transfer Internal" sesuai implementasi existing, sehingga tidak digandakan).
    const cardTotalsById = new Map<string, { income: number; expense: number; opening: number }>();
    cards.forEach((card) => cardTotalsById.set(String(card.id), { income: 0, expense: 0, opening: 0 }));

    const monthlyTotals = new Map<string, { income: number; expense: number }>();
    transactions.forEach((transaction) => {
        const amount = pickNumber(transaction, ['amount']);
        const incomeRow = isIncomeRow(transaction);
        const expenseRow = isExpenseRow(transaction);

        const cardId = pickText(transaction, ['card_id']);
        const cardEntry = cardId ? cardTotalsById.get(cardId) : undefined;
        if (cardEntry) {
            if (incomeRow) {
                cardEntry.income += amount;
                // Saldo awal tersimpan sebagai transaksi kategori "Modal".
                if (/modal/i.test(pickText(transaction, ['category']))) cardEntry.opening += amount;
            } else if (expenseRow) {
                cardEntry.expense += amount;
            }
        }

        const monthKey = getRecordDate(transaction).slice(0, 7);
        if (/^\d{4}-\d{2}$/.test(monthKey)) {
            const monthEntry = monthlyTotals.get(monthKey) || { income: 0, expense: 0 };
            if (incomeRow) monthEntry.income += amount;
            else if (expenseRow) monthEntry.expense += amount;
            monthlyTotals.set(monthKey, monthEntry);
        }
    });

    const totalCardBalance = cards.reduce((sum, card) => sum + pickNumber(card, ['balance']), 0);
    const totalPocketBalance = pockets.reduce((sum, pocket) => sum + pickNumber(pocket, ['amount']), 0);

    // Sheet A: Dashboard Keuangan
    const dashboardRows: ExportRow[] = [];
    const addDashboardRow = (section: string, item: string, nominal: number | null, count: number | null, note: string) => {
        dashboardRows.push({ section, item, nominal, count, note });
    };
    addDashboardRow('Ringkasan Saldo', 'Total saldo seluruh rekening/kartu', totalCardBalance, null, `Σ saldo ${cards.length} rekening/kartu`);
    addDashboardRow('Ringkasan Saldo', 'Total saldo kantong keuangan', totalPocketBalance, null, `Σ saldo ${pockets.length} kantong keuangan`);
    addDashboardRow('Ringkasan Saldo', 'Total aset (rekening + kantong)', totalCardBalance + totalPocketBalance, null, 'Rekening + kantong keuangan');
    addDashboardRow('Arus Kas', 'Total pemasukan', income, null, 'Σ transaksi Pemasukan — sama dengan halaman Keuangan');
    addDashboardRow('Arus Kas', 'Total pengeluaran', expense, null, 'Σ transaksi Pengeluaran — sama dengan halaman Keuangan');
    addDashboardRow('Arus Kas', 'Saldo bersih', income - expense, null, 'Pemasukan - pengeluaran');
    addDashboardRow('Arus Kas', 'Jumlah transaksi', null, transactions.length, 'Seluruh baris tabel transactions');
    cards.forEach((card) => {
        addDashboardRow('Saldo per Rekening/Kartu', `${pickText(card, ['bank_name'])} ${maskCardIdentity(card)}`.trim(), pickNumber(card, ['balance']), null, pickText(card, ['card_type']));
    });
    pockets.forEach((pocket) => {
        addDashboardRow('Saldo per Kantong Keuangan', pickText(pocket, ['name']), pickNumber(pocket, ['amount']), null, pickText(pocket, ['type']));
    });
    [...monthlyTotals.entries()].sort(([a], [b]) => a.localeCompare(b)).forEach(([month, totals]) => {
        addDashboardRow('Rekap per Periode', `Pemasukan ${month}`, totals.income, null, '');
        addDashboardRow('Rekap per Periode', `Pengeluaran ${month}`, totals.expense, null, '');
        addDashboardRow('Rekap per Periode', `Saldo bersih ${month}`, totals.income - totals.expense, null, '');
    });
    addDashboardRow('Catatan', 'Grafik pemasukan & pengeluaran', null, null, 'Grafik Excel tidak didukung pustaka export; rekap disajikan sebagai tabel per periode.');

    // Sheet B: Rekap Pemasukan
    const incomeRows: ExportRow[] = transactions.filter(isIncomeRow).sort(byDateAsc).map((transaction, index) => {
        const { projectName, clientName } = describeProject(projectById.get(pickText(transaction, ['project_id'])));
        return {
            no: index + 1,
            date: parseDateValue(pickText(transaction, ['date'])),
            description: pickText(transaction, ['description']),
            category: pickText(transaction, ['category']),
            source: pickText(transaction, ['method']),
            projectLabel: [projectName, clientName].filter(Boolean).join(' • '),
            account: describeAccount(transaction),
            amount: pickNumber(transaction, ['amount']),
            status: inferPaymentRowStatus(transaction),
        };
    });
    if (incomeRows.length) {
        incomeRows.push({ no: null, date: null, description: 'TOTAL PEMASUKAN', category: null, source: null, projectLabel: null, account: null, amount: income, status: null });
    }

    // Sheet C: Rekap Pengeluaran
    const incomeExpenseRows: ExportRow[] = transactions.filter(isExpenseRow).sort(byDateAsc).map((transaction, index) => {
        const { projectName, clientName } = describeProject(projectById.get(pickText(transaction, ['project_id'])));
        return {
            no: index + 1,
            date: parseDateValue(pickText(transaction, ['date'])),
            description: pickText(transaction, ['description']),
            category: pickText(transaction, ['category']),
            projectLabel: [projectName, clientName].filter(Boolean).join(' • '),
            account: describeAccount(transaction),
            amount: pickNumber(transaction, ['amount']),
            status: inferExpenseRowStatus(transaction),
        };
    });
    if (incomeExpenseRows.length) {
        incomeExpenseRows.push({ no: null, date: null, description: 'TOTAL PENGELUARAN', category: null, projectLabel: null, account: null, amount: expense, status: null });
    }

    // Sheet D: Saldo Rekening & Kartu
    const accountRows: ExportRow[] = cards.map((card) => {
        const totals = cardTotalsById.get(String(card.id)) || { income: 0, expense: 0, opening: 0 };
        return {
            name: pickText(card, ['bank_name']),
            type: pickText(card, ['card_type']),
            identity: maskCardIdentity(card),
            opening: totals.opening,
            income: totals.income,
            expense: totals.expense,
            balance: pickNumber(card, ['balance']),
        };
    });
    if (accountRows.length) {
        accountRows.push({
            name: 'TOTAL',
            type: null,
            identity: null,
            opening: cards.reduce((sum, card) => sum + (cardTotalsById.get(String(card.id))?.opening || 0), 0),
            income: cards.reduce((sum, card) => sum + (cardTotalsById.get(String(card.id))?.income || 0), 0),
            expense: cards.reduce((sum, card) => sum + (cardTotalsById.get(String(card.id))?.expense || 0), 0),
            balance: totalCardBalance,
        });
    }

    // Sheet E: Kantong Keuangan
    const pocketRows: ExportRow[] = pockets.map((pocket) => {
        const amount = pickNumber(pocket, ['amount']);
        const goal = pickNumber(pocket, ['goal_amount', 'goalAmount']);
        return {
            name: pickText(pocket, ['name']),
            purpose: pickText(pocket, ['description']) || pickText(pocket, ['type']),
            amount,
            goal: goal || null,
            progress: goal > 0 ? Math.round((amount / goal) * 100) : null,
        };
    });
    if (pocketRows.length) {
        pocketRows.push({
            name: 'TOTAL',
            purpose: null,
            amount: totalPocketBalance,
            goal: pockets.reduce((sum, pocket) => sum + pickNumber(pocket, ['goal_amount', 'goalAmount']), 0),
            progress: null,
        });
    }

    // Sheet F: Transfer Antar-Rekening (kategori "Transfer Internal")
    const transferSource = transactions.filter(isTransferInternal).sort(byDateAsc);
    const transferRows: ExportRow[] = transferSource.map((transaction, index) => ({
        no: index + 1,
        date: parseDateValue(pickText(transaction, ['date'])),
        description: pickText(transaction, ['description']),
        kind: pickText(transaction, ['type']),
        account: describeAccount(transaction),
        amount: pickNumber(transaction, ['amount']),
        status: inferPaymentRowStatus(transaction) || '',
        note: 'Rekening tujuan tidak tersimpan pada transaksi',
    }));
    if (transferRows.length) {
        transferRows.push({
            no: null, date: null, description: 'TOTAL TRANSFER INTERNAL', kind: null, account: null,
            amount: transferSource.reduce((sum, transaction) => sum + pickNumber(transaction, ['amount']), 0),
            status: null, note: null,
        });
    }

    // Sheet G: Rekap Kategori Keuangan
    const categoryRows: ExportRow[] = [
        ...Object.entries(
            transactions.filter(isIncomeRow).reduce<Record<string, number>>((acc, transaction) => {
                const key = pickText(transaction, ['category']) || '(Tanpa kategori)';
                acc[key] = (acc[key] || 0) + pickNumber(transaction, ['amount']);
                return acc;
            }, {}),
        ).map(([category, total]) => ({
            kind: 'Pemasukan',
            category,
            count: transactions.filter((transaction) => isIncomeRow(transaction) && (pickText(transaction, ['category']) || '(Tanpa kategori)') === category).length,
            total,
        })),
        ...Object.entries(
            transactions.filter(isExpenseRow).reduce<Record<string, number>>((acc, transaction) => {
                const key = pickText(transaction, ['category']) || '(Tanpa kategori)';
                acc[key] = (acc[key] || 0) + pickNumber(transaction, ['amount']);
                return acc;
            }, {}),
        ).map(([category, total]) => ({
            kind: 'Pengeluaran',
            category,
            count: transactions.filter((transaction) => isExpenseRow(transaction) && (pickText(transaction, ['category']) || '(Tanpa kategori)') === category).length,
            total,
        })),
    ].sort((left, right) => String(left.kind).localeCompare(String(right.kind)) || Number(right.total) - Number(left.total));
    if (categoryRows.length) {
        categoryRows.push({ kind: 'TOTAL', category: null, count: transactions.length, total: income + expense });
    }

    const financeSheets: SheetDefinition[] = [
        {
            name: 'Dashboard Keuangan',
            columns: [
                { header: 'Bagian', key: 'section', type: 'text', wrap: true, minWidth: 20, maxWidth: 26 },
                { header: 'Item', key: 'item', type: 'text', wrap: true, minWidth: 30, maxWidth: 42 },
                { header: 'Nominal', key: 'nominal', type: 'currency', minWidth: 18 },
                { header: 'Jumlah', key: 'count', type: 'number', minWidth: 10, align: 'right' },
                { header: 'Catatan', key: 'note', type: 'text', wrap: true, minWidth: 32, maxWidth: 52 },
            ],
            rows: dashboardRows,
            emptyMessage: 'Belum ada data keuangan.',
        },
        {
            name: 'Rekap Pemasukan',
            columns: [
                { header: 'No', key: 'no', type: 'number', minWidth: 6, align: 'center' },
                { header: 'Tanggal', key: 'date', type: 'date', minWidth: 14 },
                { header: 'Keterangan', key: 'description', type: 'text', wrap: true, minWidth: 26, maxWidth: 46 },
                { header: 'Kategori', key: 'category', type: 'text', minWidth: 18 },
                { header: 'Sumber Pemasukan', key: 'source', type: 'text', minWidth: 16 },
                { header: 'Proyek / Klien', key: 'projectLabel', type: 'text', wrap: true, minWidth: 22, maxWidth: 36 },
                { header: 'Rekening Tujuan', key: 'account', type: 'text', minWidth: 20 },
                { header: 'Nominal', key: 'amount', type: 'currency', minWidth: 18 },
                { header: 'Status Transaksi', key: 'status', type: 'status', minWidth: 16 },
            ],
            rows: incomeRows,
            emptyMessage: 'Belum ada transaksi pemasukan.',
        },
        {
            name: 'Rekap Pengeluaran',
            columns: [
                { header: 'No', key: 'no', type: 'number', minWidth: 6, align: 'center' },
                { header: 'Tanggal', key: 'date', type: 'date', minWidth: 14 },
                { header: 'Keterangan', key: 'description', type: 'text', wrap: true, minWidth: 26, maxWidth: 46 },
                { header: 'Kategori', key: 'category', type: 'text', minWidth: 18 },
                { header: 'Proyek / Klien', key: 'projectLabel', type: 'text', wrap: true, minWidth: 22, maxWidth: 36 },
                { header: 'Rekening Sumber', key: 'account', type: 'text', minWidth: 20 },
                { header: 'Nominal', key: 'amount', type: 'currency', minWidth: 18 },
                { header: 'Status Transaksi', key: 'status', type: 'status', minWidth: 16 },
            ],
            rows: incomeExpenseRows,
            emptyMessage: 'Belum ada transaksi pengeluaran.',
        },
        {
            name: 'Saldo Rekening & Kartu',
            columns: [
                { header: 'Nama Rekening / Kartu', key: 'name', type: 'text', wrap: true, minWidth: 24, maxWidth: 36 },
                { header: 'Jenis', key: 'type', type: 'text', minWidth: 12 },
                { header: 'Identitas', key: 'identity', type: 'text', minWidth: 14, align: 'center' },
                { header: 'Saldo Awal', key: 'opening', type: 'currency', minWidth: 18 },
                { header: 'Total Pemasukan', key: 'income', type: 'currency', minWidth: 18 },
                { header: 'Total Pengeluaran', key: 'expense', type: 'currency', minWidth: 18 },
                { header: 'Saldo Akhir', key: 'balance', type: 'currency', minWidth: 18 },
            ],
            rows: accountRows,
            emptyMessage: 'Belum ada rekening/kartu.',
        },
        {
            name: 'Kantong Keuangan',
            columns: [
                { header: 'Nama Kantong', key: 'name', type: 'text', wrap: true, minWidth: 24, maxWidth: 36 },
                { header: 'Tujuan', key: 'purpose', type: 'text', wrap: true, minWidth: 24, maxWidth: 40 },
                { header: 'Saldo', key: 'amount', type: 'currency', minWidth: 18 },
                { header: 'Target', key: 'goal', type: 'currency', minWidth: 18 },
                { header: 'Progres (%)', key: 'progress', type: 'number', minWidth: 12, align: 'center' },
            ],
            rows: pocketRows,
            emptyMessage: 'Belum ada kantong keuangan.',
        },
        {
            name: 'Transfer Antar-Rekening',
            columns: [
                { header: 'No', key: 'no', type: 'number', minWidth: 6, align: 'center' },
                { header: 'Tanggal', key: 'date', type: 'date', minWidth: 14 },
                { header: 'Keterangan', key: 'description', type: 'text', wrap: true, minWidth: 26, maxWidth: 46 },
                { header: 'Jenis', key: 'kind', type: 'status', minWidth: 14 },
                { header: 'Rekening Asal', key: 'account', type: 'text', minWidth: 20 },
                { header: 'Nominal', key: 'amount', type: 'currency', minWidth: 18 },
                { header: 'Status', key: 'status', type: 'status', minWidth: 16 },
                { header: 'Catatan', key: 'note', type: 'text', wrap: true, minWidth: 28, maxWidth: 44 },
            ],
            rows: transferRows,
            emptyMessage: 'Belum ada transfer antar-rekening.',
        },
        {
            name: 'Rekap Kategori Keuangan',
            columns: [
                { header: 'Jenis', key: 'kind', type: 'status', minWidth: 14 },
                { header: 'Kategori', key: 'category', type: 'text', wrap: true, minWidth: 22, maxWidth: 36 },
                { header: 'Jumlah Transaksi', key: 'count', type: 'number', minWidth: 14, align: 'right' },
                { header: 'Total', key: 'total', type: 'currency', minWidth: 18 },
            ],
            rows: categoryRows,
            emptyMessage: 'Belum ada data kategori.',
        },
    ];

    const summary: SummaryRow[] = [
        { section: 'Ringkasan Keuangan', item: 'Total pemasukan ledger', value: income, note: 'Σ transaksi pemasukan (tanpa filter status) — sama dengan halaman Keuangan', format: 'currency' },
        { section: 'Ringkasan Keuangan', item: 'Total pengeluaran ledger', value: expense, note: 'Σ transaksi pengeluaran (tanpa filter status) — sama dengan halaman Keuangan', format: 'currency' },
        { section: 'Ringkasan Keuangan', item: 'Saldo bersih ledger', value: income - expense, note: 'Pemasukan - pengeluaran — sama dengan halaman Keuangan', format: 'currency' },
        { section: 'Ringkasan Keuangan', item: 'Jumlah transaksi', value: transactions.length, note: 'Seluruh baris tabel transactions', format: 'number' },
        { section: 'Nilai Kontrak', item: 'Total nilai kontrak', value: totalContract, note: 'Σ total_cost seluruh proyek', format: 'currency' },
        { section: 'Nilai Kontrak', item: 'Jumlah proyek', value: projects.length, note: 'Seluruh baris tabel projects', format: 'number' },
        { section: 'Pembayaran & Tagihan', item: 'Total pembayaran masuk', value: totalPaid, note: 'Transaksi pemasukan per proyek; batal/ditolak tidak dihitung', format: 'currency' },
        { section: 'Pembayaran & Tagihan', item: 'Sisa tagihan', value: remaining, note: 'Nilai kontrak - pembayaran bersih per proyek', format: 'currency' },
        { section: 'Pembayaran & Tagihan', item: 'Jumlah klien', value: clients.length, note: 'Seluruh baris tabel clients', format: 'number' },
        { section: 'Honor Tim', item: 'Total honor tim', value: totalHonor, note: 'Σ fee pembayaran tim (terpisah dari pemasukan klien)', format: 'currency' },
        { section: 'Honor Tim', item: 'Jumlah pembayaran tim', value: teamPayments.length, note: 'Seluruh baris tabel team_project_payments', format: 'number' },
        { section: 'Data Backup', item: 'Jumlah tabel terisi', value: [...rowsByTable.keys()].length, note: 'Tabel operasional yang memiliki baris', format: 'number' },
        { section: 'Data Backup', item: 'Total baris data', value: records.length, note: 'Seluruh tabel operasional', format: 'number' },
    ];

    const sheets: SheetDefinition[] = [
        {
            name: 'Pengantin & Acara Pernikahan',
            columns: [
                { header: 'No', key: 'no', type: 'number', minWidth: 6, align: 'center' },
                { header: 'ID Pengantin', key: 'clientId', type: 'text', minWidth: 20 },
                { header: 'Nama Pengantin', key: 'clientName', type: 'text', wrap: true, minWidth: 22, maxWidth: 34 },
                { header: 'Nama Pasangan', key: 'brideName', type: 'text', minWidth: 18 },
                { header: 'WhatsApp', key: 'whatsapp', type: 'text', minWidth: 16 },
                { header: 'Email', key: 'email', type: 'text', minWidth: 22 },
                { header: 'Alamat', key: 'address', type: 'text', wrap: true, minWidth: 22, maxWidth: 36 },
                { header: 'Tanggal Daftar', key: 'registeredAt', type: 'date', minWidth: 14 },
                { header: 'Status Klien', key: 'clientStatus', type: 'status', minWidth: 14 },
                { header: 'Nama Acara', key: 'projectName', type: 'text', wrap: true, minWidth: 24, maxWidth: 36 },
                { header: 'Tanggal Acara', key: 'eventDate', type: 'date', minWidth: 14 },
                { header: 'Waktu', key: 'eventTime', type: 'text', minWidth: 10, align: 'center' },
                { header: 'Lokasi', key: 'location', type: 'text', minWidth: 18 },
                { header: 'Alamat Venue', key: 'venueAddress', type: 'text', wrap: true, minWidth: 22, maxWidth: 36 },
                { header: 'Paket', key: 'packageName', type: 'text', minWidth: 18 },
                { header: 'Durasi Paket', key: 'packageDuration', type: 'text', minWidth: 14, align: 'center' },
                { header: 'Nilai Kontrak', key: 'totalCost', type: 'currency', minWidth: 18 },
                { header: 'Total Pembayaran', key: 'paid', type: 'currency', minWidth: 18 },
                { header: 'Sisa Tagihan', key: 'remaining', type: 'currency', minWidth: 18 },
                { header: 'Status Pembayaran', key: 'paymentStatus', type: 'status', minWidth: 16 },
                { header: 'Progress (%)', key: 'progress', type: 'number', minWidth: 12, align: 'center' },
                { header: 'Status Acara', key: 'status', type: 'status', minWidth: 14 },
            ],
            rows: eventRows,
            emptyMessage: 'Belum ada data proyek/acara pernikahan.',
        },
        {
            name: 'Riwayat Pembayaran',
            columns: [
                { header: 'No', key: 'no', type: 'number', minWidth: 6, align: 'center' },
                { header: 'Tanggal', key: 'date', type: 'date', minWidth: 14 },
                { header: 'ID Transaksi', key: 'transactionId', type: 'text', minWidth: 20 },
                { header: 'Nama Pengantin', key: 'clientName', type: 'text', wrap: true, minWidth: 22, maxWidth: 34 },
                { header: 'Acara', key: 'projectName', type: 'text', wrap: true, minWidth: 24, maxWidth: 34 },
                { header: 'Keterangan', key: 'description', type: 'text', wrap: true, minWidth: 26, maxWidth: 44 },
                { header: 'Kategori', key: 'category', type: 'text', minWidth: 18 },
                { header: 'Jenis Pembayaran', key: 'kind', type: 'status', minWidth: 16 },
                { header: 'Nominal', key: 'amount', type: 'currency', minWidth: 18 },
                { header: 'Metode Pembayaran', key: 'method', type: 'text', minWidth: 18 },
                { header: 'Kartu / Rekening', key: 'account', type: 'text', minWidth: 20 },
                { header: 'Status', key: 'status', type: 'status', minWidth: 16 },
            ],
            rows: paymentRows,
            emptyMessage: 'Belum ada transaksi pemasukan.',
        },
        {
            name: 'Pengeluaran Proyek',
            columns: [
                { header: 'No', key: 'no', type: 'number', minWidth: 6, align: 'center' },
                { header: 'Tanggal', key: 'date', type: 'date', minWidth: 14 },
                { header: 'ID Transaksi', key: 'transactionId', type: 'text', minWidth: 20 },
                { header: 'Acara', key: 'projectName', type: 'text', wrap: true, minWidth: 24, maxWidth: 36 },
                { header: 'Nama Pengantin', key: 'clientName', type: 'text', wrap: true, minWidth: 20, maxWidth: 32 },
                { header: 'Keterangan', key: 'description', type: 'text', wrap: true, minWidth: 26, maxWidth: 44 },
                { header: 'Kategori', key: 'category', type: 'text', minWidth: 18 },
                { header: 'Nominal', key: 'amount', type: 'currency', minWidth: 18 },
                { header: 'Metode Pembayaran', key: 'method', type: 'text', minWidth: 18 },
                { header: 'Kartu / Rekening', key: 'account', type: 'text', minWidth: 20 },
                { header: 'Catatan / Bukti', key: 'proof', type: 'text', wrap: true, minWidth: 22, maxWidth: 38 },
            ],
            rows: expenseRows,
            emptyMessage: 'Belum ada transaksi pengeluaran.',
        },
        {
            name: 'Tim & Honor',
            columns: [
                { header: 'No', key: 'no', type: 'number', minWidth: 6, align: 'center' },
                { header: 'ID Pembayaran', key: 'paymentId', type: 'text', minWidth: 20 },
                { header: 'Nama Anggota', key: 'memberName', type: 'text', wrap: true, minWidth: 22, maxWidth: 34 },
                { header: 'ID Anggota', key: 'memberId', type: 'text', minWidth: 20 },
                { header: 'Acara', key: 'projectName', type: 'text', wrap: true, minWidth: 24, maxWidth: 36 },
                { header: 'Nama Pengantin', key: 'clientName', type: 'text', wrap: true, minWidth: 20, maxWidth: 32 },
                { header: 'Tanggal', key: 'date', type: 'date', minWidth: 14 },
                { header: 'Honor', key: 'fee', type: 'currency', minWidth: 18 },
                { header: 'Status', key: 'status', type: 'status', minWidth: 14 },
            ],
            rows: teamRows,
            emptyMessage: 'Belum ada pembayaran tim.',
        },
        ...financeSheets,
    ];

    return { workbook, companyName, generatedAt, summary, sheets };
};

export const buildBackupReportWorkbook = (
    records: BackupRecord[],
    context: BackupExportContext = {},
): ExcelJS.Workbook => {
    const { workbook, companyName, generatedAt, summary, sheets } = buildReportData(records, context);

    createSummaryWorksheet(
        workbook,
        'Ringkasan Dashboard',
        `LAPORAN KEUANGAN & OPERASIONAL — ${companyName}`,
        `Ringkasan dashboard, pengantin & acara, pembayaran, pengeluaran, dan tim • Dibuat: ${formatDateTimeDisplay(generatedAt)}`,
        summary,
    );

    sheets.forEach((sheet) => createDataWorksheet(workbook, sheet));

    return workbook;
};

export const exportBackupReportToExcel = async (
    records: BackupRecord[],
    context: BackupExportContext = {},
): Promise<void> => {
    const workbook = buildBackupReportWorkbook(records, context);
    await downloadWorkbook(workbook, `laporan-vena-${getExportDateStamp()}.xlsx`);
};

// ─────────────────────────────────────────────────────────────────────────────
// C. CSV — backup datar (UTF-8 BOM, escaping, nominal angka murni)
// ─────────────────────────────────────────────────────────────────────────────

export const BACKUP_CSV_HEADERS = [
    'Kategori',
    'Tabel',
    'ID',
    'Tanggal',
    'Nama/Deskripsi',
    'Kategori/Jenis/Status',
    'Nilai',
    'Data Lengkap (JSON)',
];

export const buildBackupCsvRows = (records: BackupRecord[]): (string | number)[][] =>
    records.map(({ dataset, value }) => [
        dataset.category,
        dataset.label,
        String(value.id ?? ''),
        formatDateForCsv(getRecordDate(value)),
        getRecordLabel(value),
        pickText(value, ['category', 'type', 'status']),
        getAmountValue(dataset, value),
        JSON.stringify(value),
    ]);

export const downloadBackupCsv = (
    records: BackupRecord[],
    filename: string,
    meta: { label: string; companyName?: string } = { label: 'Ringkasan backup' },
) => {
    const totalValue = records.reduce((sum, record) => sum + getAmountValue(record.dataset, record.value), 0);
    downloadCSV(
        BACKUP_CSV_HEADERS,
        buildBackupCsvRows(records),
        filename,
        [
            [meta.label, new Date().toLocaleString('id-ID')],
            ['Perusahaan', meta.companyName || 'Vena'],
            ['Jumlah baris', records.length],
            ['Total nilai kolom Rupiah', totalValue],
        ],
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// D. CSV KEUANGAN — ringkasan, pemasukan, pengeluaran, rekening, kantong, transfer
// ─────────────────────────────────────────────────────────────────────────────

export const FINANCE_CSV_HEADERS = [
    'Bagian',
    'No',
    'Tanggal',
    'Keterangan',
    'Kategori',
    'Sumber / Tujuan',
    'Rekening / Akun',
    'Proyek / Klien',
    'Nominal',
    'Status',
];

export const buildFinanceCsvRows = (records: BackupRecord[]): (string | number)[][] => {
    const rowsByTable = groupRecordsByTable(records);
    const transactions = rowsByTable.get('transactions') || [];
    const cards = rowsByTable.get('cards') || [];
    const pockets = rowsByTable.get('pockets') || [];
    const projects = rowsByTable.get('projects') || [];

    const cardById = new Map(cards.map((row) => [String(row.id), row]));
    const pocketById = new Map(pockets.map((row) => [String(row.id), row]));
    const projectById = new Map(projects.map((row) => [String(row.id), row]));

    const describeAccount = (transaction: Record<string, unknown>) => {
        const card = cardById.get(pickText(transaction, ['card_id']));
        if (card) {
            const digits = pickText(card, ['last_four_digits']);
            return `${pickText(card, ['bank_name'])}${digits ? ` ••••${digits}` : ''}`.trim();
        }
        const pocket = pocketById.get(pickText(transaction, ['pocket_id']));
        if (pocket) return `Kantong: ${pickText(pocket, ['name'])}`;
        return '';
    };
    const describeProjectLabel = (transaction: Record<string, unknown>) => {
        const project = projectById.get(pickText(transaction, ['project_id']));
        if (!project) return '';
        return [pickText(project, ['project_name']), pickText(project, ['client_name'])].filter(Boolean).join(' • ');
    };

    const income = transactions.filter(isIncomeRow).reduce((sum, row) => sum + pickNumber(row, ['amount']), 0);
    const expense = transactions.filter(isExpenseRow).reduce((sum, row) => sum + pickNumber(row, ['amount']), 0);
    const totalCardBalance = cards.reduce((sum, row) => sum + pickNumber(row, ['balance']), 0);
    const totalPocketBalance = pockets.reduce((sum, row) => sum + pickNumber(row, ['amount']), 0);

    const rows: (string | number)[][] = [];
    const push = (
        bagian: string, no: string | number, tanggal: string, keterangan: string,
        kategori: string, sumber: string, akun: string, proyek: string, nominal: number, status: string,
    ) => rows.push([bagian, no, tanggal, keterangan, kategori, sumber, akun, proyek, nominal, status]);

    // Ringkasan keuangan
    push('Ringkasan Keuangan', '', '', 'Total saldo seluruh rekening/kartu', '', '', '', '', totalCardBalance, '');
    push('Ringkasan Keuangan', '', '', 'Total saldo kantong keuangan', '', '', '', '', totalPocketBalance, '');
    push('Ringkasan Keuangan', '', '', 'Total aset (rekening + kantong)', '', '', '', '', totalCardBalance + totalPocketBalance, '');
    push('Ringkasan Keuangan', '', '', 'Total pemasukan', '', '', '', '', income, '');
    push('Ringkasan Keuangan', '', '', 'Total pengeluaran', '', '', '', '', expense, '');
    push('Ringkasan Keuangan', '', '', 'Saldo bersih', '', '', '', '', income - expense, '');
    push('Ringkasan Keuangan', '', '', 'Jumlah transaksi', '', '', '', '', transactions.length, '');

    // Pemasukan & pengeluaran
    transactions.filter(isIncomeRow).sort((a, b) => (parseDateValue(getRecordDate(a))?.getTime() || 0) - (parseDateValue(getRecordDate(b))?.getTime() || 0))
        .forEach((transaction, index) => push(
            'Pemasukan', index + 1, formatDateForCsv(getRecordDate(transaction)), pickText(transaction, ['description']),
            pickText(transaction, ['category']), pickText(transaction, ['method']), describeAccount(transaction),
            describeProjectLabel(transaction), pickNumber(transaction, ['amount']), inferPaymentRowStatus(transaction),
        ));
    transactions.filter(isExpenseRow).sort((a, b) => (parseDateValue(getRecordDate(a))?.getTime() || 0) - (parseDateValue(getRecordDate(b))?.getTime() || 0))
        .forEach((transaction, index) => push(
            'Pengeluaran', index + 1, formatDateForCsv(getRecordDate(transaction)), pickText(transaction, ['description']),
            pickText(transaction, ['category']), pickText(transaction, ['method']), describeAccount(transaction),
            describeProjectLabel(transaction), pickNumber(transaction, ['amount']), inferExpenseRowStatus(transaction),
        ));

    // Rekening & kartu
    cards.forEach((card) => push(
        'Rekening & Kartu', '', '', pickText(card, ['bank_name']), pickText(card, ['card_type']), '',
        maskCardIdentity(card), '', pickNumber(card, ['balance']), '',
    ));

    // Kantong keuangan
    pockets.forEach((pocket) => push(
        'Kantong Keuangan', '', '', pickText(pocket, ['name']), pickText(pocket, ['type']),
        pickText(pocket, ['description']), '', '', pickNumber(pocket, ['amount']),
        pickNumber(pocket, ['goal_amount', 'goalAmount']) ? `Target ${pickNumber(pocket, ['goal_amount', 'goalAmount'])}` : '',
    ));

    // Transfer antar-rekening
    transactions.filter(isTransferInternal).sort((a, b) => (parseDateValue(getRecordDate(a))?.getTime() || 0) - (parseDateValue(getRecordDate(b))?.getTime() || 0))
        .forEach((transaction, index) => push(
            'Transfer Antar-Rekening', index + 1, formatDateForCsv(getRecordDate(transaction)), pickText(transaction, ['description']),
            pickText(transaction, ['category']), pickText(transaction, ['type']), describeAccount(transaction), '',
            pickNumber(transaction, ['amount']), inferPaymentRowStatus(transaction),
        ));

    // Rekap kategori
    const categoryTotals = transactions.reduce((acc, transaction) => {
        const kind = isIncomeRow(transaction) ? 'Pemasukan' : 'Pengeluaran';
        const key = `${kind}::${pickText(transaction, ['category']) || '(Tanpa kategori)'}`;
        acc.set(key, (acc.get(key) || 0) + pickNumber(transaction, ['amount']));
        return acc;
    }, new Map<string, number>());
    [...categoryTotals.entries()].sort(([a], [b]) => a.localeCompare(b)).forEach(([key, total]) => {
        const [kind, category] = key.split('::');
        push('Rekap Kategori', '', '', category, kind, '', '', '', total, '');
    });

    return rows;
};

export const downloadFinanceCsv = (
    records: BackupRecord[],
    filename: string,
    meta: { label: string; companyName?: string } = { label: 'Laporan keuangan' },
) => {
    downloadCSV(
        FINANCE_CSV_HEADERS,
        buildFinanceCsvRows(records),
        filename,
        [
            [meta.label, new Date().toLocaleString('id-ID')],
            ['Perusahaan', meta.companyName || 'Vena'],
            ['Jumlah baris transaksi', records.filter((record) => record.dataset.table === 'transactions').length],
            ['Catatan', 'Nominal berupa angka murni (tanpa "Rp"). Tanggal dd/mm/yyyy.'],
        ],
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// Util bersama untuk panel
// ─────────────────────────────────────────────────────────────────────────────

export const getBackupRecordDate = getRecordDate;
export const getBackupRecordAmount = (record: BackupRecord) => getAmountValue(record.dataset, record.value);
export const getBackupRecordLabel = getRecordLabel;
export const isBackupIncome = isIncomeRow;
export const isBackupExpense = isExpenseRow;
