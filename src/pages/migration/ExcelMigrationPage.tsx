import React, { useState, useRef } from 'react';
import { 
  FileSpreadsheet, 
  Download, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  Users, 
  DollarSign, 
  UserCheck, 
  RefreshCw 
} from 'lucide-react';
import Breadcrumb from '../../components/modernize/Breadcrumb';
import { 
  generateExcelTemplate, 
  readExcelFile, 
  parseClientsFromSheet, 
  parseTransactionsFromSheet, 
  parseTeamPaymentsFromSheet,
  parsePackagesFromSheet,
  MigrationDataType,
  ParsedTeamPaymentItem
} from '../../features/migration/excelMigrationUtils';
import { Client, ClientStatus, ClientType, Transaction, TransactionType, TeamMember, Project, TeamProjectPayment, Package } from '../../types';
import { clientService } from '../../services/clients';
import { transactionService } from '../../services/transactions';
import { teamMemberService } from '../../services/teamMembers';
import { teamProjectPaymentService } from '../../services/teamProjectPayments';
import { projectService } from '../../services/projects';
import { createPackage } from '../../services/packages';

interface ExcelMigrationPageProps {
  clients?: Client[];
  teamMembers?: TeamMember[];
  projects?: Project[];
  setClients?: (clients: Client[] | ((prev: Client[]) => Client[])) => void;
  setTransactions?: (tx: Transaction[] | ((prev: Transaction[]) => Transaction[])) => void;
  setTeamMembers?: (members: TeamMember[] | ((prev: TeamMember[]) => TeamMember[])) => void;
  showNotification?: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

export const ExcelMigrationPage: React.FC<ExcelMigrationPageProps> = ({
  clients = [],
  teamMembers = [],
  projects = [],
  setClients,
  setTransactions,
  setTeamMembers,
  showNotification
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<MigrationDataType>('all');
  const [isProcessing, setIsProcessing] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [parsedClients, setParsedClients] = useState<Partial<Client>[]>([]);
  const [parsedTransactions, setParsedTransactions] = useState<Partial<Transaction>[]>([]);
  const [parsedTeamPayments, setParsedTeamPayments] = useState<ParsedTeamPaymentItem[]>([]);
  const [parsedPackages, setParsedPackages] = useState<Partial<Package>[]>([]);
  const [validationErrors, setValidationErrors] = useState<{ row: number; reason: string; sheet: string }[]>([]);

  const [importClients, setImportClients] = useState(true);
  const [importTransactions, setImportTransactions] = useState(true);
  const [importTeamPayments, setImportTeamPayments] = useState(true);
  const [importPackages, setImportPackages] = useState(true);

  const [importCompleted, setImportCompleted] = useState(false);
  const [importStats, setImportStats] = useState({ clients: 0, transactions: 0, teamPayments: 0, packages: 0 });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownload = (type: MigrationDataType) => {
    try {
      generateExcelTemplate(type);
      if (showNotification) showNotification('Template Excel berhasil diunduh.', 'success');
    } catch {
      setError('Gagal mengunduh template Excel.');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setIsProcessing(true);
    setError(null);
    setValidationErrors([]);
    setImportCompleted(false);

    try {
      const sheets = await readExcelFile(uploadedFile);
      const sheetNames = Object.keys(sheets);

      if (sheetNames.length === 0) throw new Error('File Excel tidak memiliki data.');

      let allErrors: { row: number; reason: string; sheet: string }[] = [];
      let cList: Partial<Client>[] = [];
      let tList: Partial<Transaction>[] = [];
      let tpList: ParsedTeamPaymentItem[] = [];
      let pList: Partial<Package>[] = [];

      const clientSheetName = sheetNames.find(n => /pengantin|klien|client/i.test(n));
      const txSheetName = sheetNames.find(n => /transaksi|keuangan|transaction/i.test(n));
      const teamSheetName = sheetNames.find(n => /tim|team|honor/i.test(n));
      const pkgSheetName = sheetNames.find(n => /paket|package/i.test(n));

      if (clientSheetName && sheets[clientSheetName]) {
        const res = parseClientsFromSheet(sheets[clientSheetName]);
        cList = res.valid;
        res.errors.forEach(err => allErrors.push({ ...err, sheet: clientSheetName }));
      }
      if (txSheetName && sheets[txSheetName]) {
        const res = parseTransactionsFromSheet(sheets[txSheetName]);
        tList = res.valid;
        res.errors.forEach(err => allErrors.push({ ...err, sheet: txSheetName }));
      }
      if (teamSheetName && sheets[teamSheetName]) {
        const res = parseTeamPaymentsFromSheet(sheets[teamSheetName]);
        tpList = res.valid;
        res.errors.forEach(err => allErrors.push({ ...err, sheet: teamSheetName }));
      }
      if (pkgSheetName && sheets[pkgSheetName]) {
        const res = parsePackagesFromSheet(sheets[pkgSheetName]);
        pList = res.valid;
        res.errors.forEach(err => allErrors.push({ ...err, sheet: pkgSheetName }));
      }

      if (!clientSheetName && !txSheetName && !teamSheetName && !pkgSheetName) {
        const firstSheet = sheets[sheetNames[0]];
        const cRes = parseClientsFromSheet(firstSheet);
        if (cRes.valid.length > 0) {
          cList = cRes.valid;
        } else {
          tList = parseTransactionsFromSheet(firstSheet).valid;
        }
      }

      setParsedClients(cList);
      setParsedTransactions(tList);
      setParsedTeamPayments(tpList);
      setParsedPackages(pList);
      setValidationErrors(allErrors);

      if (cList.length === 0 && tList.length === 0 && tpList.length === 0 && pList.length === 0) {
        setError('Tidak ada data yang cocok. Pastikan menggunakan format template resmi.');
      } else if (showNotification) {
        showNotification(`File terbaca: ${cList.length} pengantin, ${tList.length} transaksi, ${tpList.length} honor tim, ${pList.length} paket.`, 'info');
      }
    } catch (err: any) {
      setError(err.message || 'Gagal membaca file Excel.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExecuteImport = async () => {
    setIsProcessing(true);
    setError(null);

    let countClients = 0;
    let countTx = 0;
    let countTeam = 0;

    try {
      if (importClients && parsedClients.length > 0) {
        const newClients: Client[] = [];
        for (const c of parsedClients) {
          const item: Client = {
            id: c.id || crypto.randomUUID(),
            name: c.name || 'Pengantin Tanpa Nama',
            email: c.email || '',
            phone: c.phone || '',
            whatsapp: c.whatsapp || c.phone || '',
            since: c.since || new Date().toISOString(),
            instagram: c.instagram || undefined,
            status: c.status || ClientStatus.ACTIVE,
            clientType: c.clientType || ClientType.DIRECT,
            lastContact: c.lastContact || c.since || new Date().toISOString(),
            portalAccessId: c.portalAccessId || crypto.randomUUID(),
            address: c.address || undefined,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          try {
            const savedClient = await clientService.add(item);
            if ((c as any).projectName || (c as any).projectType || (c as any).date || (c as any).location || (c as any).packageName) {
              await projectService.create({
                projectName: (c as any).projectName || `${savedClient.name} Wedding`,
                clientName: savedClient.name,
                clientId: savedClient.id,
                projectType: (c as any).projectType || 'Wedding',
                packageName: (c as any).packageName || 'Custom Package',
                date: (c as any).date || savedClient.since || new Date().toISOString().split('T')[0],
                location: (c as any).location || savedClient.address || '',
                status: 'Dikonfirmasi',
                totalCost: Number((c as any).totalCost || 0),
                amountPaid: Number((c as any).amountPaid || 0),
                paymentStatus: (c as any).paymentStatus || (Number((c as any).amountPaid || 0) > 0 ? 'DP Terbayar' : 'Belum Bayar'),
                durationSelection: (c as any).durationSelection || undefined,
                unitPrice: (c as any).unitPrice ? Number((c as any).unitPrice) : undefined,
                address: savedClient.address || undefined,
                addOns: [],
              } as any);
            }
          } catch (err) { console.warn('Gagal simpan client dari import:', err); }
          newClients.push(item);
          countClients++;
        }
        if (setClients) setClients(prev => [...newClients, ...prev]);
      }

      if (importTransactions && parsedTransactions.length > 0) {
        const newTx: Transaction[] = [];
        for (const t of parsedTransactions) {
          const item: Transaction = {
            id: t.id || crypto.randomUUID(),
            date: t.date || new Date().toISOString().split('T')[0],
            description: t.description || 'Transaksi',
            amount: t.amount || 0,
            type: t.type || TransactionType.INCOME,
            category: t.category || 'Operasional',
            method: t.method || 'Transfer Bank',
            createdAt: new Date().toISOString()
          };
          try { await transactionService.add(item); } catch {}
          newTx.push(item);
          countTx++;
        }
        if (setTransactions) setTransactions(prev => [...newTx, ...prev]);
      }

      if (importTeamPayments && parsedTeamPayments.length > 0) {
        const currentMembers = [...teamMembers];
        const newMembers: TeamMember[] = [];

        for (const item of parsedTeamPayments) {
          let member = currentMembers.find(m => m.name.toLowerCase() === item.teamMemberName.toLowerCase());
          if (!member) {
            const newM: TeamMember = {
              id: crypto.randomUUID(),
              name: item.teamMemberName,
              role: item.role || 'Photographer',
              phone: item.phone || '',
              email: '',
              noRek: item.bankAccount || undefined,
              standardFee: 0,
              rating: 0,
              performanceNotes: [],
              portalAccessId: crypto.randomUUID(),
              category: 'Tim',
              createdAt: new Date().toISOString()
            };
            try { await teamMemberService.add(newM); } catch {}
            currentMembers.push(newM);
            newMembers.push(newM);
            member = newM;
          }

          const project = projects.find(
            (candidate) => candidate.projectName.toLowerCase() === item.projectName?.trim().toLowerCase(),
          );
          if (!project) {
            showNotification?.(
              `Pembayaran ${item.teamMemberName} dilewati karena acara "${item.projectName || '(tidak disebutkan)'}" tidak ditemukan.`,
              'error',
            );
            continue;
          }

          const pay: TeamProjectPayment = {
            id: crypto.randomUUID(),
            projectId: project.id,
            teamMemberId: member.id,
            teamMemberName: member.name,
            role: item.role,
            fee: item.amount,
            status: item.status,
            date: item.eventDate || new Date().toISOString().split('T')[0],
            createdAt: new Date().toISOString()
          };
          try { await teamProjectPaymentService.add(pay); } catch (error) {
            console.error('[ExcelMigration] Failed to import team payment:', error);
            throw error;
          }
          countTeam++;
        }

        if (newMembers.length > 0 && setTeamMembers) {
          setTeamMembers(prev => [...newMembers, ...prev]);
        }
      }

      if (importPackages && parsedPackages.length > 0) {
        for (const pkg of parsedPackages) {
          try { await createPackage(pkg as any); } catch (err) { console.warn('Gagal simpan paket dari import:', err); }
        }
      }

      setImportStats({ clients: countClients, transactions: countTx, teamPayments: countTeam, packages: parsedPackages.length });
      setImportCompleted(true);
      if (showNotification) {
        showNotification(`Sukses mengimport ${countClients + countTx + countTeam + parsedPackages.length} baris data!`, 'success');
      }
    } catch (e: any) {
      setError(e.message || 'Terjadi kesalahan saat menyimpan data.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Breadcrumb
            title="Migrasi & Import Data Excel"
            items={[{ title: 'Dasbor', to: '#/dashboard' }, { title: 'Import Data Excel' }]}
          />
          <h1 className="text-2xl font-black text-slate-800 tracking-tight mt-1 flex items-center gap-2">
            <FileSpreadsheet className="w-7 h-7 text-emerald-600" />
            Migrasi & Import Data Excel
          </h1>
          <p className="text-sm text-slate-500">
            Unduh template Excel tabel, isi data pengantin/keuangan/tim, lalu unggah untuk migrasi otomatis.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* STEP 1: Download Templates */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 font-bold text-sm flex items-center justify-center">
            1
          </div>
          <div>
            <h2 className="font-bold text-slate-800 text-base">Unduh Template Tabel Excel Resmi</h2>
            <p className="text-xs text-slate-500">Pilih jenis data dan klik tombol Download untuk mendapatkan file template .xlsx</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          <div className="p-4 border-2 border-emerald-500 bg-emerald-50/40 rounded-xl flex flex-col justify-between">
            <div>
              <span className="font-bold text-slate-800 text-sm flex items-center gap-2 mb-1">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                Semua Data (Lengkap)
              </span>
              <p className="text-xs text-slate-500 mb-3">3 Sheet: Pengantin, Transaksi Kas, dan Honor Tim.</p>
            </div>
            <button
              type="button"
              onClick={() => handleDownload('all')}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              Download Template Lengkap
            </button>
          </div>

          <div className="p-4 border border-slate-200 hover:border-slate-300 rounded-xl flex flex-col justify-between">
            <div>
              <span className="font-bold text-slate-800 text-sm flex items-center gap-2 mb-1">
                <Users className="w-4 h-4 text-blue-600" />
                Data Pengantin
              </span>
              <p className="text-xs text-slate-500 mb-3">Nama pengantin, no HP/WA, tanggal acara, paket, biaya.</p>
            </div>
            <button
              type="button"
              onClick={() => handleDownload('clients')}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              Download Template Pengantin
            </button>
          </div>

          <div className="p-4 border border-slate-200 hover:border-slate-300 rounded-xl flex flex-col justify-between">
            <div>
              <span className="font-bold text-slate-800 text-sm flex items-center gap-2 mb-1">
                <DollarSign className="w-4 h-4 text-amber-600" />
                Data Transaksi Keuangan
              </span>
              <p className="text-xs text-slate-500 mb-3">Catatan arus kas, nominal, jenis pemasukan/pengeluaran.</p>
            </div>
            <button
              type="button"
              onClick={() => handleDownload('transactions')}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              Download Template Kas
            </button>
          </div>

          <div className="p-4 border border-slate-200 hover:border-slate-300 rounded-xl flex flex-col justify-between">
            <div>
              <span className="font-bold text-slate-800 text-sm flex items-center gap-2 mb-1">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                Data Paket
              </span>
              <p className="text-xs text-slate-500 mb-3">Nama paket, harga, wilayah, fotografer, videografer.</p>
            </div>
            <button
              type="button"
              onClick={() => handleDownload('packages')}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              Download Template Paket
            </button>
          </div>
          <div className="p-4 border border-slate-200 hover:border-slate-300 rounded-xl flex flex-col justify-between">
            <div>
              <span className="font-bold text-slate-800 text-sm flex items-center gap-2 mb-1">
                <UserCheck className="w-4 h-4 text-indigo-600" />
                Honor & Pembayaran Tim
              </span>
              <p className="text-xs text-slate-500 mb-3">Honor fotografer, videografer, asisten, nomor rekening.</p>
            </div>
            <button
              type="button"
              onClick={() => handleDownload('team_payments')}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              Download Template Tim
            </button>
          </div>
        </div>
      </div>

      {/* STEP 2: Upload */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 font-bold text-sm flex items-center justify-center">
            2
          </div>
          <div>
            <h2 className="font-bold text-slate-800 text-base">Unggah File Excel yang Telah Diisi</h2>
            <p className="text-xs text-slate-500">Unggah file (.xlsx, .xls, .csv) yang sudah Anda isi sesuai template</p>
          </div>
        </div>

        <input ref={fileInputRef} type="file" accept=".xlsx, .xls, .csv" onChange={handleFileChange} className="hidden" />

        <div
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
            file ? 'border-emerald-400 bg-emerald-50/20' : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'
          }`}
        >
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-2">
            {isProcessing ? <RefreshCw className="w-6 h-6 animate-spin" /> : <Upload className="w-6 h-6" />}
          </div>
          <h3 className="font-bold text-slate-800 text-sm mb-1">{file ? file.name : 'Klik untuk Memilih File Excel'}</h3>
          <p className="text-xs text-slate-500 mb-3">Mendukung format .xlsx, .xls, dan .csv</p>
          <button type="button" className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-700 shadow-sm">
            Pilih File dari Komputer
          </button>
        </div>
      </div>

      {/* STEP 3: Preview & Execute */}
      {(parsedClients.length > 0 || parsedTransactions.length > 0 || parsedTeamPayments.length > 0) && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 font-bold text-sm flex items-center justify-center">
                3
              </div>
              <div>
                <h2 className="font-bold text-slate-800 text-base">Pratinjau & Simpan ke Database</h2>
                <p className="text-xs text-slate-500">Pilih kategori yang ingin dimasukkan ke dalam sistem</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setFile(null);
                setParsedClients([]);
                setParsedTransactions([]);
                setParsedTeamPayments([]);
                setImportCompleted(false);
              }}
              className="text-xs text-slate-500 hover:text-rose-600 underline"
            >
              Reset File
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div 
              onClick={() => parsedClients.length > 0 && setImportClients(!importClients)}
              className={`p-3 rounded-xl border-2 cursor-pointer ${importClients && parsedClients.length > 0 ? 'border-emerald-500 bg-emerald-50/40' : 'border-slate-200 opacity-60'}`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold text-slate-700">Data Pengantin</span>
                <input type="checkbox" checked={importClients && parsedClients.length > 0} onChange={() => {}} className="rounded text-emerald-600" />
              </div>
              <div className="text-xl font-black text-slate-800">{parsedClients.length}</div>
              <div className="text-[11px] text-slate-500">Baris siap diimpor</div>
            </div>

            <div 
              onClick={() => parsedTransactions.length > 0 && setImportTransactions(!importTransactions)}
              className={`p-3 rounded-xl border-2 cursor-pointer ${importTransactions && parsedTransactions.length > 0 ? 'border-amber-500 bg-amber-50/40' : 'border-slate-200 opacity-60'}`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold text-slate-700">Transaksi Kas</span>
                <input type="checkbox" checked={importTransactions && parsedTransactions.length > 0} onChange={() => {}} className="rounded text-amber-600" />
              </div>
              <div className="text-xl font-black text-slate-800">{parsedTransactions.length}</div>
              <div className="text-[11px] text-slate-500">Baris siap diimpor</div>
            </div>

            <div 
              onClick={() => parsedTeamPayments.length > 0 && setImportTeamPayments(!importTeamPayments)}
              className={`p-3 rounded-xl border-2 cursor-pointer ${importTeamPayments && parsedTeamPayments.length > 0 ? 'border-indigo-500 bg-indigo-50/40' : 'border-slate-200 opacity-60'}`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold text-slate-700">Honor Tim</span>
                <input type="checkbox" checked={importTeamPayments && parsedTeamPayments.length > 0} onChange={() => {}} className="rounded text-indigo-600" />
              </div>
              <div className="text-xl font-black text-slate-800">{parsedTeamPayments.length}</div>
              <div className="text-[11px] text-slate-500">Baris siap diimpor</div>
            </div>
          </div>

          {!importCompleted ? (
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                disabled={isProcessing || (!importClients && !importTransactions && !importTeamPayments)}
                onClick={handleExecuteImport}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-bold text-sm flex items-center gap-2 shadow-md transition-all"
              >
                {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                {isProcessing ? 'Menyimpan ke Database...' : 'Import Semua Data Sekarang'}
              </button>
            </div>
          ) : (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-1" />
              <h4 className="font-bold text-emerald-900 text-sm">Import Data Berhasil!</h4>
              <p className="text-xs text-emerald-700">
                {importStats.clients} Pengantin, {importStats.transactions} Transaksi, dan {importStats.teamPayments} Honor Tim sukses disimpan.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
