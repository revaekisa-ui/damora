import { useMemo, useState, useCallback } from 'react';
import { Client, Project, Transaction, TransactionType, PaymentStatus, TeamPaymentRecord } from '../../../types';
import { deleteProject } from '../../../services/projects';
import { deleteTransaction } from '../../../services/transactions';
import { deleteTeamPaymentRecord } from '../../../services/teamPaymentRecords';

// ─── Unified document types ────────────────────────────────────────────────

export type InvoiceDocKind = 'invoice' | 'receipt' | 'slip-gaji';

export interface InvoiceDoc {
  id: string;               // project.id for invoice, transaction.id for receipt, payment.id for slip-gaji
  kind: InvoiceDocKind;
  number: string;           // display number e.g. "INV-XXXXXXXX"
  clientName: string;
  date: string;             // ISO date string
  amount: number;
  paidAmount: number;
  paymentStatus: string;    // 'Lunas' | 'DP Terbayar' | 'Belum Bayar' | 'Pemasukan' | 'Dibayar'
  method?: string;          // only for receipts
  category?: string;        // only for receipts
  projectName?: string;
  projectId?: string;
  // raw data for modals
  project?: Project;
  transaction?: Transaction;
  teamPaymentRecord?: TeamPaymentRecord;
  client?: Client;
}

export type FilterKind = 'semua' | 'invoice' | 'receipt' | 'slip-gaji';
export type SortField = 'date' | 'amount' | 'clientName' | 'number';
export type SortDir = 'asc' | 'desc';

// ─── Hook ──────────────────────────────────────────────────────────────────

export interface UseInvoicesParams {
  projects: Project[];
  transactions: Transaction[];
  clients: Client[];
  teamPaymentRecords: TeamPaymentRecord[];
  showNotification: (msg: string) => void;
  onDeleteProject?: (projectId: string) => void;
  onDeleteTransaction?: (transactionId: string) => void;
  onDeleteTeamPaymentRecord?: (id: string) => void;
}

export function useInvoices({
  projects,
  transactions,
  clients,
  teamPaymentRecords,
  showNotification,
  onDeleteProject,
  onDeleteTransaction,
  onDeleteTeamPaymentRecord,
}: UseInvoicesParams) {
  // ── Filter & sort state ──────────────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState('');
  const [filterKind, setFilterKind] = useState<FilterKind>('semua');
  const [filterStatus, setFilterStatus] = useState('semua');
  const [filterClientId, setFilterClientId] = useState('semua');
  const [filterMonth, setFilterMonth] = useState('');       // 'YYYY-MM' format
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  // ── UI state ─────────────────────────────────────────────────────────────
  const [selectedDoc, setSelectedDoc] = useState<InvoiceDoc | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<InvoiceDoc | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // ── Client lookup map ─────────────────────────────────────────────────────
  const clientMap = useMemo(() => {
    const map = new Map<string, Client>();
    clients.forEach((c) => map.set(c.id, c));
    return map;
  }, [clients]);

  // ── Project lookup map ────────────────────────────────────────────────────
  const projectMap = useMemo(() => {
    const map = new Map<string, Project>();
    projects.forEach((p) => map.set(p.id, p));
    return map;
  }, [projects]);

  // ── Build unified list ────────────────────────────────────────────────────
  const allDocs = useMemo((): InvoiceDoc[] => {
    const docs: InvoiceDoc[] = [];

    // RULE 2, 6, 7: Pre-compute actual paid amounts from income transactions per project.
    // Transactions are the source of truth for payment data.
    const txPaidByProject = new Map<string, number>();
    transactions
      .filter((t) => t.type === TransactionType.INCOME && t.projectId)
      .forEach((t) => {
        const prev = txPaidByProject.get(t.projectId!) || 0;
        txPaidByProject.set(t.projectId!, prev + (Number(t.amount) || 0));
      });

    // 1. Invoice docs — one per project
    projects.forEach((proj) => {
      let client = proj.clientId ? clientMap.get(proj.clientId) : undefined;
      if (!client && proj.clientName) {
        client = clients.find((c) => c.name.toLowerCase() === proj.clientName.toLowerCase());
      }
      if (!client && proj.clientName) {
        client = {
          id: proj.clientId || '',
          name: proj.clientName,
          phone: '',
          whatsapp: '',
          email: '',
          address: proj.address || '',
        } as Client;
      }

      // Use transaction sum as paidAmount (source of truth).
      // Fall back to proj.amountPaid only if no transactions exist yet for this project.
      const txPaid = txPaidByProject.get(proj.id);
      const paidAmount = txPaid !== undefined ? txPaid : (proj.amountPaid || 0);

      // Recompute payment status from actual paid vs total (Rules 6 & 7)
      const total = proj.totalCost || 0;
      let paymentStatus: string;
      if (total > 0 && paidAmount >= total) {
        paymentStatus = PaymentStatus.LUNAS;
      } else if (paidAmount > 0) {
        paymentStatus = PaymentStatus.DP_TERBAYAR;
      } else {
        paymentStatus = proj.paymentStatus || PaymentStatus.BELUM_BAYAR;
      }

      docs.push({
        id: proj.id,
        kind: 'invoice',
        number: `INV-${proj.id.slice(-8).toUpperCase()}`,
        clientName: proj.clientName,
        date: proj.date || proj.createdAt || '',
        amount: proj.totalCost,
        paidAmount,
        paymentStatus,
        projectName: proj.projectName,
        projectId: proj.id,
        project: proj,
        client,
      });
    });

    // 2. Receipt docs — transactions with type INCOME that have a projectId
    transactions
      .filter((tx) => tx.type === TransactionType.INCOME)
      .forEach((tx) => {
        const project = tx.projectId ? projectMap.get(tx.projectId) : undefined;
        const client = project?.clientId ? clientMap.get(project.clientId) : undefined;
        docs.push({
          id: tx.id,
          kind: 'receipt',
          number: `RCP-${tx.id.slice(0, 8).toUpperCase()}`,
          clientName: client?.name || project?.clientName || tx.description.slice(0, 30),
          date: tx.date,
          amount: tx.amount,
          paidAmount: tx.amount,
          paymentStatus: 'Pemasukan',
          method: tx.method,
          category: tx.category,
          projectName: project?.projectName,
          projectId: tx.projectId,
          project,
          transaction: tx,
          client,
        });
      });

    // 3. Slip Gaji docs
    teamPaymentRecords.forEach((record) => {
      docs.push({
        id: record.id,
        kind: 'slip-gaji',
        number: `PAY-${record.recordNumber || record.id.slice(0, 8).toUpperCase()}`,
        clientName: 'Internal Team', // Or map to team member?
        date: record.date,
        amount: record.totalAmount,
        paidAmount: record.totalAmount,
        paymentStatus: 'Dibayar',
        teamPaymentRecord: record,
      });
    });

    return docs;
  }, [projects, transactions, teamPaymentRecords, clientMap, projectMap]);

  // ── Stats ─────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const invoiceDocs = allDocs.filter((d) => d.kind === 'invoice');
    const receiptDocs = allDocs.filter((d) => d.kind === 'receipt');

    const totalInvoiceValue = invoiceDocs.reduce((s, d) => s + d.amount, 0);
    const totalPaid = invoiceDocs.reduce((s, d) => s + d.paidAmount, 0);
    const totalUnpaid = invoiceDocs.reduce((s, d) => s + (d.amount - d.paidAmount), 0);
    const lunas = invoiceDocs.filter((d) => d.paymentStatus === PaymentStatus.LUNAS).length;
    const pending = invoiceDocs.filter((d) => d.paymentStatus !== PaymentStatus.LUNAS).length;
    const totalReceipts = receiptDocs.reduce((s, d) => s + d.amount, 0);

    return {
      totalInvoice: invoiceDocs.length,
      totalReceipt: receiptDocs.length,
      totalInvoiceValue,
      totalPaid,
      totalUnpaid,
      lunas,
      pending,
      totalReceipts,
    };
  }, [allDocs]);

  // ── Available client options for filter ───────────────────────────────────
  const clientOptions = useMemo(() => {
    const seen = new Map<string, string>();
    allDocs.forEach((d) => {
      if (d.client) {
        seen.set(d.client.id, d.client.name);
      } else if (d.clientName) {
        seen.set(d.clientName, d.clientName);
      }
    });
    return Array.from(seen.entries()).map(([id, name]) => ({ id, name }));
  }, [allDocs]);

  // ── Filtered + sorted list ────────────────────────────────────────────────
  const filteredDocs = useMemo(() => {
    let result = allDocs;

    // Kind filter
    if (filterKind !== 'semua') {
      result = result.filter((d) => d.kind === filterKind);
    }

    // Status filter
    if (filterStatus !== 'semua') {
      result = result.filter((d) => d.paymentStatus === filterStatus);
    }

    // Client filter
    if (filterClientId !== 'semua') {
      result = result.filter(
        (d) => d.client?.id === filterClientId || d.clientName === filterClientId,
      );
    }

    // Month filter ('YYYY-MM')
    if (filterMonth) {
      result = result.filter((d) => d.date && d.date.startsWith(filterMonth));
    }

    // Search (number, client name, project name)
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        (d) =>
          d.number.toLowerCase().includes(q) ||
          d.clientName.toLowerCase().includes(q) ||
          (d.projectName || '').toLowerCase().includes(q),
      );
    }

    // Sort
    result = [...result].sort((a, b) => {
      let cmp = 0;
      if (sortField === 'date') {
        cmp = new Date(a.date).getTime() - new Date(b.date).getTime();
      } else if (sortField === 'amount') {
        cmp = a.amount - b.amount;
      } else if (sortField === 'clientName') {
        cmp = a.clientName.localeCompare(b.clientName);
      } else if (sortField === 'number') {
        cmp = a.number.localeCompare(b.number);
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [allDocs, filterKind, filterStatus, filterClientId, filterMonth, searchTerm, sortField, sortDir]);

  // ── Sorting toggle ────────────────────────────────────────────────────────
  const handleSort = useCallback(
    (field: SortField) => {
      if (sortField === field) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortField(field);
        setSortDir('desc');
      }
    },
    [sortField],
  );

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteConfirm) return;
    setIsDeleting(true);
    try {
      if (deleteConfirm.kind === 'invoice') {
        const success = await deleteProject(deleteConfirm.id);
        if (success) {
          onDeleteProject?.(deleteConfirm.id);
          showNotification('Invoice dan data acara terkait berhasil dihapus.');
        } else {
          showNotification('Gagal menghapus invoice di server. Coba lagi.');
        }
      } else if (deleteConfirm.kind === 'receipt') {
        await deleteTransaction(deleteConfirm.id);
        onDeleteTransaction?.(deleteConfirm.id);
        showNotification('Tanda terima berhasil dihapus.');
      } else if (deleteConfirm.kind === 'slip-gaji') {
        await deleteTeamPaymentRecord(deleteConfirm.id);
        onDeleteTeamPaymentRecord?.(deleteConfirm.id);
        showNotification('Pembayaran tim berhasil dihapus.');
      }
    } catch (err) {
      console.error('[useInvoices] delete error', err);
      showNotification('Gagal menghapus dokumen. Coba lagi.');
    } finally {
      setIsDeleting(false);
      setDeleteConfirm(null);
    }
  }, [deleteConfirm, onDeleteProject, onDeleteTransaction, showNotification]);

  return {
    // data
    allDocs,
    filteredDocs,
    stats,
    clientOptions,
    // filter state
    searchTerm,
    setSearchTerm,
    filterKind,
    setFilterKind,
    filterStatus,
    setFilterStatus,
    filterClientId,
    setFilterClientId,
    filterMonth,
    setFilterMonth,
    // sort state
    sortField,
    sortDir,
    handleSort,
    // UI state
    selectedDoc,
    setSelectedDoc,
    deleteConfirm,
    setDeleteConfirm,
    isDeleting,
    handleDeleteConfirm,
  };
}
