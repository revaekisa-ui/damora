import React, { useCallback, useMemo, useState } from 'react';
import { AlertCircle, AlertTriangle, DatabaseBackup, Download, FileSpreadsheet, Inbox, LoaderCircle, RefreshCw } from 'lucide-react';
import supabase, { isSupabaseConfigured } from '../../../lib/supabaseClient';
import { formatCurrency } from '../../../utils/currency';
import {
    BACKUP_DATASETS,
    downloadBackupCsv,
    downloadFinanceCsv,
    exportBackupReportToExcel,
    exportFullBackupToExcel,
    getBackupRecordAmount,
    getBackupRecordDate,
    isBackupExpense,
    isBackupIncome,
    type BackupRecord,
} from '../../../features/backup/utils/backupExport';

const PAGE_SIZE = 1000;

interface TableLoadError {
    label: string;
    message: string;
}

const BackupDataPanel: React.FC = () => {
    const [records, setRecords] = useState<BackupRecord[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasLoaded, setHasLoaded] = useState(false);
    const [loadError, setLoadError] = useState('');
    const [tableErrors, setTableErrors] = useState<TableLoadError[]>([]);
    const [isExporting, setIsExporting] = useState(false);
    const [categoryFilter, setCategoryFilter] = useState('Semua kategori');
    const [tableFilter, setTableFilter] = useState('Semua tabel');
    const [search, setSearch] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    const loadBackupData = useCallback(async () => {
        if (!isSupabaseConfigured) {
            setLoadError('Koneksi database belum dikonfigurasi (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).');
            setHasLoaded(false);
            return;
        }
        setIsLoading(true);
        setLoadError('');
        try {
            // Isolasi error per tabel: kegagalan satu tabel tidak mengosongkan tabel lain.
            const results = await Promise.all(BACKUP_DATASETS.map(async (dataset) => {
                try {
                    const rows: Record<string, unknown>[] = [];
                    for (let offset = 0; ; offset += PAGE_SIZE) {
                        const { data, error } = await supabase
                            .from(dataset.table)
                            .select('*')
                            .range(offset, offset + PAGE_SIZE - 1);
                        if (error) throw new Error(error.message);
                        const page = (data ?? []) as Record<string, unknown>[];
                        rows.push(...page);
                        if (page.length < PAGE_SIZE) break;
                    }
                    return { dataset, rows, error: '' };
                } catch (error) {
                    return {
                        dataset,
                        rows: [] as Record<string, unknown>[],
                        error: error instanceof Error ? error.message : 'Gagal memuat data.',
                    };
                }
            }));

            setTableErrors(results.filter((result) => result.error).map((result) => ({
                label: result.dataset.label,
                message: result.error,
            })));
            setRecords(results.flatMap((result) => result.rows.map((value) => ({ dataset: result.dataset, value }))));
            setHasLoaded(true);
        } catch (error) {
            setLoadError(error instanceof Error ? error.message : 'Gagal mengambil data backup.');
            setRecords([]);
            setTableErrors([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const categories = useMemo(() => ['Semua kategori', ...new Set(BACKUP_DATASETS.map((dataset) => dataset.category))], []);
    const tables = useMemo(() => ['Semua tabel', ...BACKUP_DATASETS.map((dataset) => dataset.table)], []);

    const filteredRecords = useMemo(() => {
        const normalizedSearch = search.trim().toLocaleLowerCase('id-ID');
        return records.filter((record) => {
            if (categoryFilter !== 'Semua kategori' && record.dataset.category !== categoryFilter) return false;
            if (tableFilter !== 'Semua tabel' && record.dataset.table !== tableFilter) return false;
            const recordDate = getBackupRecordDate(record.value);
            if (dateFrom && (!recordDate || recordDate < dateFrom)) return false;
            if (dateTo && (!recordDate || recordDate > dateTo)) return false;
            if (normalizedSearch && !JSON.stringify(record.value).toLocaleLowerCase('id-ID').includes(normalizedSearch)) return false;
            return true;
        });
    }, [records, categoryFilter, tableFilter, search, dateFrom, dateTo]);

    // Ringkasan ledger dihitung dari SELURUH data aktual (tanpa filter) agar
    // konsisten dengan halaman Keuangan.
    const ledgerSummary = useMemo(() => records
        .filter((record) => record.dataset.table === 'transactions')
        .reduce((summary, record) => {
            const amount = getBackupRecordAmount(record);
            if (isBackupIncome(record.value)) summary.income += amount;
            else if (isBackupExpense(record.value)) summary.expense += amount;
            return summary;
        }, { income: 0, expense: 0 }), [records]);

    const datasetCounts = useMemo(() => BACKUP_DATASETS.map((dataset) => ({
        ...dataset,
        count: filteredRecords.filter((record) => record.dataset.table === dataset.table).length,
    })), [filteredRecords]);

    // Saldo rekening & kantong diambil dari data aktual (kolom balance/amount).
    const financeSummary = useMemo(() => {
        const cardBalance = records
            .filter((record) => record.dataset.table === 'cards')
            .reduce((sum, record) => sum + Number(record.value.balance || 0), 0);
        const pocketBalance = records
            .filter((record) => record.dataset.table === 'pockets')
            .reduce((sum, record) => sum + Number(record.value.amount || 0), 0);
        return { cardBalance, pocketBalance };
    }, [records]);

    const showEmptyState = hasLoaded && !isLoading && records.length === 0 && !loadError && tableErrors.length === 0;

    const handleDownloadAllCsv = () => {
        downloadBackupCsv(records, `backup-lengkap-vena-${new Date().toISOString().slice(0, 10)}.csv`, { label: 'Backup lengkap' });
    };

    const handleDownloadFilteredCsv = () => {
        downloadBackupCsv(filteredRecords, `backup-filter-vena-${new Date().toISOString().slice(0, 10)}.csv`, { label: 'Backup sesuai filter' });
    };

    const handleDownloadFinanceCsv = () => {
        downloadFinanceCsv(records, `laporan-keuangan-vena-${new Date().toISOString().slice(0, 10)}.csv`, { label: 'Laporan keuangan Vena' });
    };

    const runExcelExport = async (exporter: () => Promise<void>) => {
        setIsExporting(true);
        try {
            await exporter();
        } finally {
            setIsExporting(false);
        }
    };

    const exportDisabled = isLoading || isExporting || !records.length;

    return (
        <section className="space-y-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h3 className="flex items-center gap-2 text-base font-semibold text-brand-text-light">
                        <DatabaseBackup className="h-5 w-5 text-brand-accent" /> Backup Data
                    </h3>
                    <p className="mt-1 text-sm text-brand-text-secondary">
                        Ekspor {BACKUP_DATASETS.length} tabel operasional, tanpa profil publik dan portofolio.
                    </p>
                </div>
                <button type="button" onClick={() => void loadBackupData()} disabled={isLoading} className="button-secondary inline-flex items-center justify-center gap-2">
                    {isLoading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                    {hasLoaded ? 'Muat ulang data' : 'Muat data backup'}
                </button>
            </div>

            {loadError && (
                <div role="alert" className="flex items-start gap-2 rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span><strong>Gagal memuat data.</strong> {loadError}</span>
                </div>
            )}

            {!loadError && tableErrors.length > 0 && (
                <div role="alert" className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    <div className="space-y-1">
                        <p className="font-medium">{tableErrors.length} tabel gagal dimuat (tabel lain tetap ditampilkan):</p>
                        <ul className="list-disc space-y-0.5 pl-5">
                            {tableErrors.map((tableError) => (
                                <li key={tableError.label}>{tableError.label} — {tableError.message}</li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-md border border-brand-border bg-brand-bg p-3">
                    <p className="text-xs text-brand-text-secondary">Total data termuat</p>
                    <p className="mt-1 text-lg font-semibold text-brand-text-primary">
                        {isLoading && !hasLoaded ? 'Memuat…' : `${records.length.toLocaleString('id-ID')} baris`}
                    </p>
                    <p className="mt-0.5 text-xs text-brand-text-secondary">
                        {filteredRecords.length.toLocaleString('id-ID')} baris sesuai filter
                    </p>
                </div>
                <div className="rounded-md border-l-4 border border-brand-border border-l-emerald-500 bg-brand-bg p-3">
                    <p className="text-xs text-brand-text-secondary">Pemasukan ledger</p>
                    <p className="mt-1 text-lg font-semibold tabular-nums text-emerald-700">{formatCurrency(ledgerSummary.income)}</p>
                </div>
                <div className="rounded-md border-l-4 border border-brand-border border-l-rose-500 bg-brand-bg p-3">
                    <p className="text-xs text-brand-text-secondary">Pengeluaran ledger</p>
                    <p className="mt-1 text-lg font-semibold tabular-nums text-rose-700">{formatCurrency(ledgerSummary.expense)}</p>
                </div>
                <div className="rounded-md border-l-4 border border-brand-border border-l-brand-accent bg-brand-bg p-3">
                    <p className="text-xs text-brand-text-secondary">Saldo bersih ledger</p>
                    <p className={`mt-1 text-lg font-semibold tabular-nums ${ledgerSummary.income - ledgerSummary.expense < 0 ? 'text-rose-700' : 'text-brand-text-primary'}`}>
                        {formatCurrency(ledgerSummary.income - ledgerSummary.expense)}
                    </p>
                </div>
                <div className="rounded-md border-l-4 border border-brand-border border-l-sky-500 bg-brand-bg p-3">
                    <p className="text-xs text-brand-text-secondary">Saldo rekening &amp; kartu</p>
                    <p className="mt-1 text-lg font-semibold tabular-nums text-sky-700">{formatCurrency(financeSummary.cardBalance)}</p>
                </div>
                <div className="rounded-md border-l-4 border border-brand-border border-l-amber-500 bg-brand-bg p-3">
                    <p className="text-xs text-brand-text-secondary">Saldo kantong keuangan</p>
                    <p className="mt-1 text-lg font-semibold tabular-nums text-amber-700">{formatCurrency(financeSummary.pocketBalance)}</p>
                </div>
                <div className="rounded-md border-l-4 border border-brand-border border-l-brand-accent bg-brand-bg p-3">
                    <p className="text-xs text-brand-text-secondary">Total aset (rekening + kantong)</p>
                    <p className="mt-1 text-lg font-semibold tabular-nums text-brand-text-primary">{formatCurrency(financeSummary.cardBalance + financeSummary.pocketBalance)}</p>
                </div>
            </div>

            <div className="space-y-3 rounded-md border border-brand-border p-3 md:p-4">
                <h4 className="text-sm font-semibold text-brand-text-primary">Filter data</h4>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    <input aria-label="Cari data backup" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari nama, ID, kategori..." className="input-field" />
                    <select aria-label="Filter kategori data" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} className="input-field">
                        {categories.map((category) => <option key={category}>{category}</option>)}
                    </select>
                    <select aria-label="Filter tabel data" value={tableFilter} onChange={(event) => setTableFilter(event.target.value)} className="input-field">
                        {tables.map((table) => <option key={table}>{table}</option>)}
                    </select>
                    <label className="space-y-1 text-xs text-brand-text-secondary">Dari tanggal<input aria-label="Dari tanggal" type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} className="input-field" /></label>
                    <label className="space-y-1 text-xs text-brand-text-secondary">Sampai tanggal<input aria-label="Sampai tanggal" type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} className="input-field" /></label>
                    <p className="flex items-center text-sm text-brand-text-secondary">{filteredRecords.length.toLocaleString('id-ID')} baris sesuai filter</p>
                </div>
            </div>

            {!hasLoaded && !isLoading ? (
                <div className="flex flex-col items-center justify-center gap-2 rounded-md border border-dashed border-brand-border bg-brand-bg p-8 text-center text-sm text-brand-text-secondary">
                    <Inbox className="h-6 w-6" />
                    <p className="font-medium text-brand-text-primary">Data belum dimuat.</p>
                    <p>Klik tombol <strong>Muat data backup</strong> di kanan atas untuk menampilkan data.</p>
                </div>
            ) : isLoading && !hasLoaded ? (
                <div className="flex items-center justify-center gap-2 rounded-md border border-brand-border bg-brand-bg p-8 text-sm text-brand-text-secondary">
                    <LoaderCircle className="h-4 w-4 animate-spin" /> Memuat data operasional…
                </div>
            ) : showEmptyState ? (
                <div className="flex flex-col items-center justify-center gap-2 rounded-md border border-dashed border-brand-border bg-brand-bg p-8 text-center text-sm text-brand-text-secondary">
                    <Inbox className="h-6 w-6" />
                    <p className="font-medium text-brand-text-primary">Tidak ada data operasional untuk vendor ini.</p>
                    <p>Pemuatan berhasil, namun seluruh {BACKUP_DATASETS.length} tabel belum memiliki baris.</p>
                </div>
            ) : (
                <div className="overflow-x-auto rounded-md border border-brand-border">
                    <table className="w-full min-w-[560px] text-left text-sm">
                        <thead className="bg-brand-bg text-xs uppercase text-brand-text-secondary">
                            <tr>
                                <th className="px-3 py-2.5 font-semibold">Kategori</th>
                                <th className="px-3 py-2.5 font-semibold">Tabel</th>
                                <th className="px-3 py-2.5 text-right font-semibold">Jumlah baris</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-border">
                            {datasetCounts
                                .filter((dataset) => categoryFilter === 'Semua kategori' || dataset.category === categoryFilter)
                                .filter((dataset) => tableFilter === 'Semua tabel' || dataset.table === tableFilter)
                                .map((dataset, index) => (
                                    <tr key={dataset.table} className={index % 2 === 1 ? 'bg-brand-bg/40' : undefined}>
                                        <td className="px-3 py-2.5 text-brand-text-secondary">{dataset.category}</td>
                                        <td className="px-3 py-2.5 font-medium text-brand-text-primary">{dataset.label}</td>
                                        <td className="px-3 py-2.5 text-right tabular-nums text-brand-text-primary">{dataset.count.toLocaleString('id-ID')}</td>
                                    </tr>
                                ))}
                        </tbody>
                        <tfoot className="bg-brand-bg/70">
                            <tr>
                                <td className="px-3 py-2.5 font-semibold text-brand-text-primary" colSpan={2}>Total sesuai filter</td>
                                <td className="px-3 py-2.5 text-right font-semibold tabular-nums text-brand-text-primary">{filteredRecords.length.toLocaleString('id-ID')}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            )}

            <div className="flex flex-col gap-2 border-t border-brand-border pt-4 sm:flex-row sm:justify-end">
                <button type="button" disabled={exportDisabled} onClick={() => void runExcelExport(() => exportFullBackupToExcel(records, { companyName: 'Vena' }))} className="button-secondary inline-flex items-center justify-center gap-2">
                    {isExporting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />} Unduh Backup Lengkap (Excel)
                </button>
                <button type="button" disabled={exportDisabled} onClick={() => void runExcelExport(() => exportBackupReportToExcel(records, { companyName: 'Vena' }))} className="button-secondary inline-flex items-center justify-center gap-2">
                    {isExporting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />} Unduh Laporan Excel (12 Sheet)
                </button>
                <button type="button" disabled={exportDisabled} onClick={handleDownloadFinanceCsv} className="button-secondary inline-flex items-center justify-center gap-2">
                    <Download className="h-4 w-4" /> Unduh Laporan Keuangan (CSV)
                </button>
                <button type="button" disabled={exportDisabled} onClick={handleDownloadFilteredCsv} className="button-secondary inline-flex items-center justify-center gap-2">
                    <Download className="h-4 w-4" /> Unduh hasil filter (CSV)
                </button>
                <button type="button" disabled={exportDisabled} onClick={handleDownloadAllCsv} className="button-primary inline-flex items-center justify-center gap-2">
                    <Download className="h-4 w-4" /> Unduh semua data (CSV)
                </button>
            </div>

            <p className="text-xs text-brand-text-secondary">
                {records.length.toLocaleString('id-ID')} baris siap diekspor • Backup lengkap memuat seluruh kolom &amp; ID asli per tabel; laporan Excel memuat 12 sheet (operasional + keuangan) siap dibaca.
            </p>
        </section>
    );
};

export default BackupDataPanel;
