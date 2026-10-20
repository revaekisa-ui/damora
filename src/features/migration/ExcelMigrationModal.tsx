import React, { useState, useRef } from 'react';
import { 
  X, 
  FileSpreadsheet, 
  Download, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  Users, 
  DollarSign, 
  UserCheck, 
  ArrowRight,
  RefreshCw,
  Info,
  Check
} from 'lucide-react';
import { 
  generateExcelTemplate, 
  readExcelFile, 
  parseClientsFromSheet, 
  parseTransactionsFromSheet, 
  parseTeamPaymentsFromSheet,
  MigrationDataType,
  ParsedTeamPaymentItem
} from './excelMigrationUtils';
import { AddOn, Client, ClientStatus, ClientType, Transaction, TransactionType, TeamMember, Project, TeamProjectPayment } from '../../types';
import { clientService } from '../../services/clients';
import { transactionService } from '../../services/transactions';
import { teamMemberService } from '../../services/teamMembers';
import { teamProjectPaymentService } from '../../services/teamProjectPayments';
import { projectService } from '../../services/projects';

interface ExcelMigrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: MigrationDataType;
  onSuccess?: (type: string, count: number) => void;
  // Current data from context for matching and updates
  clients?: Client[];
  teamMembers?: TeamMember[];
  projects?: Project[];
  setClients?: (clients: Client[] | ((prev: Client[]) => Client[])) => void;
  setTransactions?: (tx: Transaction[] | ((prev: Transaction[]) => Transaction[])) => void;
  setTeamMembers?: (members: TeamMember[] | ((prev: TeamMember[]) => TeamMember[])) => void;
  setProjects?: (projects: Project[] | ((prev: Project[]) => Project[])) => void;
}

export const ExcelMigrationModal: React.FC<ExcelMigrationModalProps> = ({
  isOpen,
  onClose,
  defaultType = 'all',
  onSuccess,
  clients = [],
  teamMembers = [],
  projects = [],
  setClients,
  setTransactions,
  setTeamMembers,
  setProjects
}) => {
  const [activeTab, setActiveTab] = useState<'download' | 'upload' | 'preview' | 'success'>('download');
  const [selectedType, setSelectedType] = useState<MigrationDataType>(defaultType);
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Parsed state preview
  const [parsedClients, setParsedClients] = useState<Partial<Client>[]>([]);
  const [parsedTransactions, setParsedTransactions] = useState<Partial<Transaction>[]>([]);
  const [parsedTeamPayments, setParsedTeamPayments] = useState<ParsedTeamPaymentItem[]>([]);
  const [validationErrors, setValidationErrors] = useState<{ row: number; reason: string; sheet: string }[]>([]);

  // Selected for import checkboxes
  const [importClients, setImportClients] = useState(true);
  const [importTransactions, setImportTransactions] = useState(true);
  const [importTeamPayments, setImportTeamPayments] = useState(true);

  // Results summary
  const [importResult, setImportResult] = useState<{
    clientsCount: number;
    transactionsCount: number;
    teamPaymentsCount: number;
    newTeamMembersCount: number;
  }>({ clientsCount: 0, transactionsCount: 0, teamPaymentsCount: 0, newTeamMembersCount: 0 });

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDownloadTemplate = (type: MigrationDataType) => {
    try {
      generateExcelTemplate(type);
    } catch (err) {
      setError('Gagal men-download template. Pastikan browser mengizinkan download.');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setIsLoading(true);
    setError(null);
    setValidationErrors([]);

    try {
      const sheets = await readExcelFile(uploadedFile);
      const sheetNames = Object.keys(sheets);

      if (sheetNames.length === 0) {
        throw new Error('File Excel kosong atau format tidak didukung.');
      }

      let allErrors: { row: number; reason: string; sheet: string }[] = [];
      let cList: Partial<Client>[] = [];
      let tList: Partial<Transaction>[] = [];
      let tpList: ParsedTeamPaymentItem[] = [];

      // Find sheets by flexible name matching
      const clientSheetName = sheetNames.find(n => /pengantin|klien|client/i.test(n));
      const txSheetName = sheetNames.find(n => /transaksi|keuangan|transaction|income|expense/i.test(n));
      const teamSheetName = sheetNames.find(n => /tim|team|honor|freelancer/i.test(n));

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

      // If no named sheets matched, fallback to first sheet based on selectedType
      if (!clientSheetName && !txSheetName && !teamSheetName) {
        const firstSheet = sheets[sheetNames[0]];
        if (selectedType === 'clients') {
          const res = parseClientsFromSheet(firstSheet);
          cList = res.valid;
          res.errors.forEach(err => allErrors.push({ ...err, sheet: sheetNames[0] }));
        } else if (selectedType === 'transactions') {
          const res = parseTransactionsFromSheet(firstSheet);
          tList = res.valid;
          res.errors.forEach(err => allErrors.push({ ...err, sheet: sheetNames[0] }));
        } else if (selectedType === 'team_payments') {
          const res = parseTeamPaymentsFromSheet(firstSheet);
          tpList = res.valid;
          res.errors.forEach(err => allErrors.push({ ...err, sheet: sheetNames[0] }));
        } else {
          // Try parsing as client first
          const res = parseClientsFromSheet(firstSheet);
          if (res.valid.length > 0) {
            cList = res.valid;
          } else {
            const txRes = parseTransactionsFromSheet(firstSheet);
            tList = txRes.valid;
          }
        }
      }

      setParsedClients(cList);
      setParsedTransactions(tList);
      setParsedTeamPayments(tpList);
      setValidationErrors(allErrors);

      if (cList.length === 0 && tList.length === 0 && tpList.length === 0) {
        setError('Tidak ada data yang cocok ditemukan di file Excel. Pastikan menggunakan format template yang disediakan.');
      } else {
        setActiveTab('preview');
      }
    } catch (err: any) {
      setError(err.message || 'Gagal memproses file Excel.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExecuteImport = async () => {
    setIsLoading(true);
    setError(null);

    let savedClients = 0;
    let savedTransactions = 0;
    let savedTeamPayments = 0;
    let newTeamCount = 0;

    try {
      // 1. Import Clients
      if (importClients && parsedClients.length > 0) {
        const newClientObjs: Client[] = [];
        for (const c of parsedClients) {
          const clientData: Client = {
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
            createdAt: c.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          try {
            const savedClient = await clientService.add(clientData);
            if ((c as any).projectName || (c as any).projectType || (c as any).date || (c as any).location || (c as any).packageName) {
              const projectPayload = {
                projectName: (c as any).projectName || `${savedClient.name} Wedding Makeup`,
                clientName: savedClient.name,
                clientId: savedClient.id,
                projectType: (c as any).projectType || 'Wedding Makeup',
                packageName: (c as any).packageName || 'Custom Package',
                date: (c as any).date || savedClient.since || new Date().toISOString().split('T')[0],
                location: (c as any).location || savedClient.address || '',
                status: 'Dikonfirmasi',
                totalCost: Number((c as any).totalCost || 0),
                amountPaid: Number((c as any).amountPaid || 0),
                paymentStatus: (c as any).paymentStatus || (Number((c as any).amountPaid || 0) > 0 ? 'DP Terbayar' : 'Belum Bayar'),
                durationSelection: (c as any).durationSelection || undefined,
                unitPrice: (c as any).unitPrice !== undefined ? Number((c as any).unitPrice) : undefined,
                notes: (c as any).notes || undefined,
                address: savedClient.address || undefined,
                addOns: [] as AddOn[],
              };
              const createdProject = await projectService.create(projectPayload as any);
              if (setProjects) {
                setProjects(prev => [createdProject, ...prev]);
              }
            }
          } catch (e) {
            console.warn('Failed to sync client to remote, local will be preserved', e);
          }
          newClientObjs.push(clientData);
          savedClients++;
        }

        if (setClients) {
          setClients(prev => [...newClientObjs, ...prev]);
        }
      }

      // 2. Import Transactions
      if (importTransactions && parsedTransactions.length > 0) {
        const newTxObjs: Transaction[] = [];
        for (const t of parsedTransactions) {
          const txData: Transaction = {
            id: t.id || crypto.randomUUID(),
            date: t.date || new Date().toISOString().split('T')[0],
            description: t.description || 'Transaksi',
            amount: t.amount || 0,
            type: t.type || TransactionType.INCOME,
            category: t.category || 'Operasional',
            method: t.method || 'Transfer Bank',
            vendorSignature: (t as any).vendorSignature || (t as any).notes || '',
            createdAt: t.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };

          try {
            await transactionService.add(txData);
          } catch (e) {
            console.warn('Failed to sync transaction to remote, local will be preserved', e);
          }
          newTxObjs.push(txData);
          savedTransactions++;
        }

        if (setTransactions) {
          setTransactions(prev => [...newTxObjs, ...prev]);
        }
      }

      // 3. Import Team Payments & Auto-Register Team Members if not exist
      if (importTeamPayments && parsedTeamPayments.length > 0) {
        const currentMembers = [...teamMembers];
        const newMembersList: TeamMember[] = [];

        for (const item of parsedTeamPayments) {
          // Check if team member exists by name
          let member = currentMembers.find(m => m.name.toLowerCase() === item.teamMemberName.toLowerCase());
          
          if (!member) {
            // Auto register new team member
            const newMember: TeamMember = {
              id: crypto.randomUUID(),
              name: item.teamMemberName,
              role: item.role || 'Photographer',
              email: `${item.teamMemberName.toLowerCase().replace(/\s+/g, '.')}@import.local`,
              phone: item.phone || '',
              standardFee: item.amount,
              noRek: item.bankAccount || undefined,
              bankName: item.bankAccount || undefined,
              rating: 0,
              performanceNotes: [],
              portalAccessId: crypto.randomUUID(),
              category: 'Tim',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };

            try {
              await teamMemberService.add(newMember);
            } catch (e) {
              console.warn('Sync team member warning', e);
            }
            currentMembers.push(newMember);
            newMembersList.push(newMember);
            newTeamCount++;
            member = newMember;
          }

          // Create payment record
          const paymentRecord: Partial<TeamProjectPayment> = {
            id: crypto.randomUUID(),
            teamMemberId: member.id,
            teamMemberName: member.name,
            role: item.role,
            date: item.eventDate || new Date().toISOString().split('T')[0],
            status: item.status,
            fee: item.amount,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          try {
            await teamProjectPaymentService.add(paymentRecord as TeamProjectPayment);
          } catch (e) {
            console.warn('Sync team payment warning', e);
          }
          savedTeamPayments++;
        }

        if (newMembersList.length > 0 && setTeamMembers) {
          setTeamMembers(prev => [...newMembersList, ...prev]);
        }
      }

      setImportResult({
        clientsCount: savedClients,
        transactionsCount: savedTransactions,
        teamPaymentsCount: savedTeamPayments,
        newTeamMembersCount: newTeamCount
      });

      setActiveTab('success');
      if (onSuccess) {
        onSuccess(selectedType, savedClients + savedTransactions + savedTeamPayments);
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat menyimpan data import.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetImport = () => {
    setFile(null);
    setParsedClients([]);
    setParsedTransactions([]);
    setParsedTeamPayments([]);
    setValidationErrors([]);
    setError(null);
    setActiveTab('download');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl solid-teal text-white flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Migrasi & Import Data Excel</h2>
              <p className="text-xs text-slate-500">Pindahkan data pengantin, transaksi keuangan, dan tim secara instan</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Steps Navigation */}
        <div className="grid grid-cols-3 border-b border-slate-200 bg-white text-xs font-semibold">
          <button
            onClick={() => setActiveTab('download')}
            className={`py-3 px-4 flex items-center justify-center gap-2 border-b-2 transition-colors ${
              activeTab === 'download' 
                ? 'border-brand-accent text-brand-accent bg-brand-accent/5' 
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[11px]">1</span>
            Download Template
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`py-3 px-4 flex items-center justify-center gap-2 border-b-2 transition-colors ${
              activeTab === 'upload' 
                ? 'border-brand-accent text-brand-accent bg-brand-accent/5' 
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[11px]">2</span>
            Upload File Excel
          </button>
          <button
            disabled={parsedClients.length === 0 && parsedTransactions.length === 0 && parsedTeamPayments.length === 0}
            onClick={() => setActiveTab('preview')}
            className={`py-3 px-4 flex items-center justify-center gap-2 border-b-2 transition-colors ${
              activeTab === 'preview' || activeTab === 'success'
                ? 'border-brand-accent text-brand-accent bg-brand-accent/5' 
                : 'border-transparent text-slate-400 cursor-not-allowed'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[11px]">3</span>
            Verifikasi & Simpan
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {error && (
            <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-700 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="flex-1">{error}</div>
            </div>
          )}

          {/* TAB 1: DOWNLOAD TEMPLATE */}
          {activeTab === 'download' && (
            <div className="space-y-6">
              <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-100 flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-slate-700">
                  <p className="font-semibold text-slate-800 mb-1">Cara Mudah Memindahkan Data dari Excel:</p>
                  <ol className="list-decimal ml-4 space-y-1 text-xs text-slate-600">
                    <li>Pilih template yang Anda perlukan di bawah ini dan klik <strong>Download Template</strong>.</li>
                    <li>Buka file Excel tersebut, isi atau copy-paste data Anda sesuai judul kolom.</li>
                    <li>Kembali ke sini, klik tombol <strong>Lanjut ke Upload</strong>, lalu unggah file yang telah diisi.</li>
                  </ol>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                  Pilih Kategori Data yang Ingin Dimigrasikan:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div 
                    onClick={() => setSelectedType('all')}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedType === 'all' 
                        ? 'border-brand-accent bg-brand-accent/5 shadow-sm' 
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-slate-800 flex items-center gap-2">
                        <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                        Paket Lengkap (Semua Data)
                      </span>
                      {selectedType === 'all' && <Check className="w-4 h-4 text-blue-600" />}
                    </div>
                    <p className="text-xs text-slate-500">
                      Berisi 3 sheet sekaligus: Pengantin, Transaksi Keuangan, dan Honor Tim dalam 1 file.
                    </p>
                  </div>

                  <div 
                    onClick={() => setSelectedType('clients')}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedType === 'clients' 
                        ? 'border-brand-accent bg-brand-accent/5 shadow-sm' 
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-slate-800 flex items-center gap-2">
                        <Users className="w-4 h-4 text-emerald-600" />
                        Data Pengantin & Acara
                      </span>
                      {selectedType === 'clients' && <Check className="w-4 h-4 text-blue-600" />}
                    </div>
                    <p className="text-xs text-slate-500">
                      Nama pengantin, no HP/WhatsApp, tanggal acara, paket, lokasi, dan status pembayaran.
                    </p>
                  </div>

                  <div 
                    onClick={() => setSelectedType('transactions')}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedType === 'transactions' 
                        ? 'border-brand-accent bg-brand-accent/5 shadow-sm' 
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-slate-800 flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-amber-600" />
                        Data Keuangan (Pemasukan & Pengeluaran)
                      </span>
                      {selectedType === 'transactions' && <Check className="w-4 h-4 text-blue-600" />}
                    </div>
                    <p className="text-xs text-slate-500">
                      Riwayat arus kas, nominal, kategori, rekening/kantong, dan deskripsi pengeluaran/pemasukan.
                    </p>
                  </div>

                  <div 
                    onClick={() => setSelectedType('team_payments')}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedType === 'team_payments' 
                        ? 'border-brand-accent bg-brand-accent/5 shadow-sm' 
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-slate-800 flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-indigo-600" />
                        Data Honor & Pembayaran Tim
                      </span>
                      {selectedType === 'team_payments' && <Check className="w-4 h-4 text-blue-600" />}
                    </div>
                    <p className="text-xs text-slate-500">
                      Honor MUA, stylist, asisten, status lunas/belum, nomor rekening, dan acara.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleDownloadTemplate(selectedType)}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-sm flex items-center gap-2 shadow-sm transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download Template ({selectedType === 'all' ? 'Lengkap' : selectedType})
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('upload')}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm flex items-center gap-2 shadow-sm transition-colors"
                >
                  Lanjut ke Upload File
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: UPLOAD FILE */}
          {activeTab === 'upload' && (
            <div className="space-y-6">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileChange}
                className="hidden"
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                  file 
                    ? 'border-brand-accent bg-brand-accent/5' 
                    : 'border-slate-300 hover:border-brand-accent hover:bg-slate-50'
                }`}
              >
                <div className="w-16 h-16 rounded-full grad-brand text-white flex items-center justify-center mx-auto mb-4">
                  {isLoading ? (
                    <RefreshCw className="w-8 h-8 animate-spin" />
                  ) : (
                    <Upload className="w-8 h-8" />
                  )}
                </div>
                <h3 className="text-base font-bold text-slate-800 mb-1">
                  {file ? file.name : 'Klik atau Tarik File Excel Anda ke Sini'}
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                  Mendukung format file <strong>.xlsx, .xls</strong>, atau <strong>.csv</strong> yang telah disesuaikan dengan template
                </p>
                <button
                  type="button"
                  className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-700 shadow-sm"
                >
                  Pilih File dari Komputer
                </button>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('download')}
                  className="text-blue-600 hover:underline flex items-center gap-1"
                >
                  &larr; Butuh unduh template lagi?
                </button>
                <span>Maksimal ukuran file: 15 MB</span>
              </div>
            </div>
          )}

          {/* TAB 3: PREVIEW & VERIFY */}
          {activeTab === 'preview' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Hasil Pembacaan Data Excel:</h3>
                  <p className="text-xs text-slate-500">Centang data yang ingin Anda masukkan ke database sistem</p>
                </div>
                <button
                  type="button"
                  onClick={resetImport}
                  className="text-xs text-slate-600 hover:text-rose-600 underline flex items-center gap-1"
                >
                  Ganti File Excel
                </button>
              </div>

              {/* Data Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div 
                  onClick={() => parsedClients.length > 0 && setImportClients(!importClients)}
                  className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                    importClients && parsedClients.length > 0
                      ? 'border-brand-accent bg-brand-accent/5' 
                      : 'border-slate-200 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-emerald-600" />
                      Data Pengantin
                    </span>
                    <input 
                      type="checkbox" 
                      checked={importClients && parsedClients.length > 0} 
                      disabled={parsedClients.length === 0}
                      onChange={() => {}} 
                      className="rounded text-emerald-600"
                    />
                  </div>
                  <div className="text-2xl font-black text-slate-800">{parsedClients.length}</div>
                  <div className="text-[11px] text-slate-500">Baris siap diimport</div>
                </div>

                <div 
                  onClick={() => parsedTransactions.length > 0 && setImportTransactions(!importTransactions)}
                  className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                    importTransactions && parsedTransactions.length > 0
                      ? 'border-brand-accent bg-brand-accent/5' 
                      : 'border-slate-200 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4 text-amber-600" />
                      Keuangan Kas
                    </span>
                    <input 
                      type="checkbox" 
                      checked={importTransactions && parsedTransactions.length > 0} 
                      disabled={parsedTransactions.length === 0}
                      onChange={() => {}} 
                      className="rounded text-amber-600"
                    />
                  </div>
                  <div className="text-2xl font-black text-slate-800">{parsedTransactions.length}</div>
                  <div className="text-[11px] text-slate-500">Baris transaksi</div>
                </div>

                <div 
                  onClick={() => parsedTeamPayments.length > 0 && setImportTeamPayments(!importTeamPayments)}
                  className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                    importTeamPayments && parsedTeamPayments.length > 0
                      ? 'border-brand-accent bg-brand-accent/5' 
                      : 'border-slate-200 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 text-indigo-600" />
                      Honor Tim/Freelancer
                    </span>
                    <input 
                      type="checkbox" 
                      checked={importTeamPayments && parsedTeamPayments.length > 0} 
                      disabled={parsedTeamPayments.length === 0}
                      onChange={() => {}} 
                      className="rounded text-indigo-600"
                    />
                  </div>
                  <div className="text-2xl font-black text-slate-800">{parsedTeamPayments.length}</div>
                  <div className="text-[11px] text-slate-500">Baris honor tim</div>
                </div>
              </div>

              {/* Sample Preview Table */}
              {parsedClients.length > 0 && importClients && (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="bg-slate-100/80 px-4 py-2 text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span>Pratinjau Data Pengantin ({parsedClients.length} baris)</span>
                    <span className="text-[11px] text-slate-500 font-normal">Menampilkan hingga 5 teratas</span>
                  </div>
                  <div className="overflow-x-auto max-h-40">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-50 text-slate-600 sticky top-0 border-b border-slate-200">
                        <tr>
                          <th className="p-2">Nama Pengantin</th>
                          <th className="p-2">No HP / WhatsApp</th>
                          <th className="p-2">Tanggal Acara</th>
                          <th className="p-2">Paket</th>
                          <th className="p-2 text-right">Total (IDR)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {parsedClients.slice(0, 5).map((c, i) => {
                          const clientPreview = c as Partial<Client> & {
                            packageName?: string;
                            date?: string;
                            totalCost?: number;
                          };

                          return (
                            <tr key={i} className="hover:bg-slate-50">
                              <td className="p-2 font-medium text-slate-800">{clientPreview.name}</td>
                              <td className="p-2 text-slate-600">{clientPreview.phone || '-'}</td>
                              <td className="p-2 text-slate-600">{clientPreview.date || clientPreview.since}</td>
                              <td className="p-2 text-slate-600">{clientPreview.packageName || '-'}</td>
                              <td className="p-2 text-right text-slate-800 font-semibold">
                                {(clientPreview.totalCost || 0).toLocaleString('id-ID')}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {parsedTransactions.length > 0 && importTransactions && (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="bg-slate-100/80 px-4 py-2 text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span>Pratinjau Transaksi Keuangan ({parsedTransactions.length} baris)</span>
                    <span className="text-[11px] text-slate-500 font-normal">Menampilkan hingga 5 teratas</span>
                  </div>
                  <div className="overflow-x-auto max-h-40">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-50 text-slate-600 sticky top-0 border-b border-slate-200">
                        <tr>
                          <th className="p-2">Tanggal</th>
                          <th className="p-2">Deskripsi</th>
                          <th className="p-2">Tipe</th>
                          <th className="p-2">Kategori</th>
                          <th className="p-2 text-right">Nominal (IDR)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {parsedTransactions.slice(0, 5).map((tx, i) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="p-2 text-slate-600">{tx.date}</td>
                            <td className="p-2 font-medium text-slate-800">{tx.description}</td>
                            <td className="p-2">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                tx.type === TransactionType.INCOME ? 'solid-green text-white' : 'bg-red-600 text-white'
                              }`}>
                                {tx.type === TransactionType.INCOME ? 'Pemasukan' : 'Pengeluaran'}
                              </span>
                            </td>
                            <td className="p-2 text-slate-600">{tx.category}</td>
                            <td className="p-2 text-right text-slate-800 font-semibold">
                              {(tx.amount || 0).toLocaleString('id-ID')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {parsedTeamPayments.length > 0 && importTeamPayments && (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="bg-slate-100/80 px-4 py-2 text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span>Pratinjau Honor Tim ({parsedTeamPayments.length} baris)</span>
                    <span className="text-[11px] text-slate-500 font-normal">Menampilkan hingga 5 teratas</span>
                  </div>
                  <div className="overflow-x-auto max-h-40">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-50 text-slate-600 sticky top-0 border-b border-slate-200">
                        <tr>
                          <th className="p-2">Nama Tim</th>
                          <th className="p-2">Peran</th>
                          <th className="p-2">Nama Acara</th>
                          <th className="p-2">Status</th>
                          <th className="p-2 text-right">Honor (IDR)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {parsedTeamPayments.slice(0, 5).map((tp, i) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="p-2 font-medium text-slate-800">{tp.teamMemberName}</td>
                            <td className="p-2 text-slate-600">{tp.role}</td>
                            <td className="p-2 text-slate-600">{tp.projectName || '-'}</td>
                            <td className="p-2">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                tp.status === 'Paid' ? 'solid-green text-white' : 'solid-orange text-white'
                              }`}>
                                {tp.status}
                              </span>
                            </td>
                            <td className="p-2 text-right text-slate-800 font-semibold">
                              {tp.amount.toLocaleString('id-ID')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Warnings / Skipped Rows */}
              {validationErrors.length > 0 && (
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                  <div className="font-bold mb-1 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    Pemberitahuan ({validationErrors.length} baris dilewati karena data tidak lengkap):
                  </div>
                  <ul className="list-disc ml-5 space-y-0.5 max-h-24 overflow-y-auto">
                    {validationErrors.slice(0, 10).map((err, i) => (
                      <li key={i}>
                        Sheet <strong>{err.sheet}</strong>, Baris #{err.row}: {err.reason}
                      </li>
                    ))}
                    {validationErrors.length > 10 && (
                      <li>...dan {validationErrors.length - 10} baris lainnya.</li>
                    )}
                  </ul>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setActiveTab('upload')}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                >
                  &larr; Kembali
                </button>

                <button
                  type="button"
                  disabled={isLoading || (!importClients && !importTransactions && !importTeamPayments)}
                  onClick={handleExecuteImport}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-bold text-sm flex items-center gap-2 shadow-md transition-all"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Sedang Menyimpan ke Sistem...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Mulai Import Sekarang
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: SUCCESS */}
          {activeTab === 'success' && (
            <div className="text-center py-8 space-y-6">
              <div className="w-16 h-16 rounded-full grad-green text-white flex items-center justify-center mx-auto shadow-sm animate-bounce-subtle">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <h3 className="text-xl font-extrabold text-slate-800 mb-1">
                  Import Data Berhasil!
                </h3>
                <p className="text-sm text-slate-500 max-w-md mx-auto">
                  Semua data dari file Excel Anda telah sukses dimasukkan ke dalam sistem manajemen Filda Makeup.
                </p>
              </div>

              <div className="max-w-md mx-auto bg-slate-50 rounded-2xl p-4 border border-slate-200 text-left space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-600 font-medium">Pengantin Berhasil Diimpor:</span>
                  <span className="font-bold text-slate-800">{importResult.clientsCount} Pengantin</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-600 font-medium">Transaksi Keuangan:</span>
                  <span className="font-bold text-slate-800">{importResult.transactionsCount} Transaksi</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-600 font-medium">Catatan Honor Tim:</span>
                  <span className="font-bold text-slate-800">{importResult.teamPaymentsCount} Pembayaran</span>
                </div>
                {importResult.newTeamMembersCount > 0 && (
                  <div className="flex justify-between py-1">
                    <span className="text-blue-600 font-medium">Anggota Tim Baru Didaftarkan:</span>
                    <span className="font-bold text-blue-700">{importResult.newTeamMembersCount} Orang</span>
                  </div>
                )}
              </div>

              <div className="pt-4 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-md"
                >
                  Selesai & Tutup
                </button>
                <button
                  type="button"
                  onClick={resetImport}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-sm"
                >
                  Import File Lain
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
