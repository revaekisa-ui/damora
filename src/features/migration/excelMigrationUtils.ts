import * as XLSX from 'xlsx';
import { Client, ClientStatus, ClientType, Transaction, TransactionType, TeamMember } from '../../types';

export type MigrationDataType = 'clients' | 'transactions' | 'team_payments' | 'packages' | 'all';

export interface ParseResult<T> {
  valid: T[];
  errors: { row: number; reason: string; data?: any }[];
  totalRows: number;
}

// Generate template workbook with sample data and column descriptions
export function generateExcelTemplate(type: MigrationDataType = 'all'): void {
  const wb = XLSX.utils.book_new();

  if (type === 'clients' || type === 'all') {
    const clientsData = [
      {
        'Nama Pengantin (Wajib)': 'Rian & Maya',
        'Email': 'rian.maya@gmail.com',
        'Nomor WhatsApp / Telepon (Wajib)': '081234567890',
        'Instagram': '@rianmaya',
        'Jenis Pengantin': 'Langsung',
        'Nama Acara Pernikahan': 'Wedding Rian & Maya',
        'Tanggal Acara (YYYY-MM-DD)': '2026-11-20',
        'Lokasi (Kota)': 'Serang',
        'Alamat Lengkap / Gedung': 'Hotel Aston, Serang',
        'Status Pengantin': 'Aktif',
        'Catatan': 'Tema adat Sunda modern, butuh 2 MUA & 1 asisten'
      },
      {
        'Nama Pengantin (Wajib)': 'Dimas & Anisa',
        'Email': 'dimas.anisa@yahoo.com',
        'Nomor WhatsApp / Telepon (Wajib)': '085712345678',
        'Instagram': '@dimasanisa',
        'Jenis Pengantin': 'Vendor',
        'Nama Acara Pernikahan': 'Wedding Dimas & Anisa',
        'Tanggal Acara (YYYY-MM-DD)': '2026-12-15',
        'Lokasi (Kota)': 'Anyer',
        'Alamat Lengkap / Gedung': 'Villa Seaside, Anyer',
        'Status Pengantin': 'Calon Pengantin',
        'Catatan': 'Mau sesi outdoor sore hari'
      }
    ];

    const wsClients = XLSX.utils.json_to_sheet(clientsData);
    wsClients['!cols'] = [
      { wch: 28 }, { wch: 25 }, { wch: 24 }, { wch: 18 }, { wch: 18 },
      { wch: 26 }, { wch: 20 }, { wch: 24 }, { wch: 28 }, { wch: 20 }, { wch: 38 }
    ];
    XLSX.utils.book_append_sheet(wb, wsClients, 'Data Pengantin');
  }

  if (type === 'transactions' || type === 'all') {
    const transactionsData = [
      {
        'Tanggal (YYYY-MM-DD)': '2026-09-01',
        'Keterangan / Deskripsi (Wajib)': 'DP Pembayaran Pernikahan Rian & Maya',
        'Tipe (Pemasukan / Pengeluaran)': 'Pemasukan',
        'Nominal (IDR) (Wajib)': 5000000,
        'Kategori': 'Pembayaran Pengantin',
        'Metode Pembayaran': 'Transfer Bank',
        'Catatan': 'Transfer via m-Banking BCA'
      },
      {
        'Tanggal (YYYY-MM-DD)': '2026-09-03',
        'Keterangan / Deskripsi (Wajib)': 'Sewa Lensa Sony 70-200mm GM',
        'Tipe (Pemasukan / Pengeluaran)': 'Pengeluaran',
        'Nominal (IDR) (Wajib)': 450000,
        'Kategori': 'Peralatan & Gear',
        'Metode Pembayaran': 'Tunai',
        'Catatan': 'Untuk job weekend'
      }
    ];

    const wsTx = XLSX.utils.json_to_sheet(transactionsData);
    wsTx['!cols'] = [
      { wch: 18 }, { wch: 35 }, { wch: 25 }, { wch: 18 },
      { wch: 22 }, { wch: 22 }, { wch: 30 }
    ];
    XLSX.utils.book_append_sheet(wb, wsTx, 'Data Keuangan Transaksi');
  }

  if (type === 'team_payments' || type === 'all') {
    const teamData = [
      {
        'Nama Anggota Tim / Freelancer (Wajib)': 'Andi Pratama',
        'Peran / Posisi': 'Lead Photographer',
        'Nomor WhatsApp': '081299887766',
        'Nomor Rekening & Bank': 'BCA 1234567890 a.n Andi Pratama',
        'Nama Acara': 'Wedding Rian & Maya',
        'Tanggal Tugas (YYYY-MM-DD)': '2026-11-20',
        'Honor / Fee (IDR) (Wajib)': 1200000,
        'Status Bayar (Paid / Unpaid)': 'Unpaid',
        'Tanggal Bayar (Jika Paid)': '',
        'Metode Bayar (Transfer/Cash)': 'Transfer',
        'Catatan': 'Shooting dari akad s.d resepsi'
      }
    ];

    const wsTeam = XLSX.utils.json_to_sheet(teamData);
    wsTeam['!cols'] = [
      { wch: 28 }, { wch: 20 }, { wch: 20 }, { wch: 30 },
      { wch: 26 }, { wch: 20 }, { wch: 18 }, { wch: 18 },
      { wch: 20 }, { wch: 20 }, { wch: 30 }
    ];
    XLSX.utils.book_append_sheet(wb, wsTeam, 'Keuangan Tim & Honor');
  }

  if (type === 'packages' || type === 'all') {
    const packagesData = [
      {
        'Nama Paket (Wajib)': 'Wedding Makeup Gold',
        'Harga (IDR) (Wajib)': 15000000,
        'Wilayah': 'Serang',
        'Kategori': 'Wedding Makeup',
        'Tim Rias': '2 MUA',
        'Asisten': '1 Orang',
        'Waktu Pengerjaan': '14 Hari Kerja',
        'Item Digital (Pisahkan dengan koma)': 'Foto Akad & Resepsi High-Res, Video Teaser',
        'Item Fisik (Pisahkan dengan koma)': 'Free Pasang Melati, Touch-up Standby'
      }
    ];

    const wsPkg = XLSX.utils.json_to_sheet(packagesData);
    wsPkg['!cols'] = [
      { wch: 25 }, { wch: 18 }, { wch: 15 }, { wch: 15 },
      { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 40 }, { wch: 40 }
    ];
    XLSX.utils.book_append_sheet(wb, wsPkg, 'Data Paket');
  }

  const guideData = [
    { 'PANDUAN': 'PETUNJUK IMPORT EXCEL Filda Makeup' },
    { 'PANDUAN': '1. Sheet "Data Pengantin": isi Nama Pengantin, Email, Nomor HP, Status Pengantin (Aktif/Calon Pengantin/Tidak Aktif/Hilang), Tipe Pengantin (Langsung/Vendor), dan Alamat.' },
    { 'PANDUAN': '2. Sheet "Data Keuangan Transaksi": isi Tanggal, Keterangan, Tipe (Pemasukan/Pengeluaran), Nominal, Kategori, dan Metode Pembayaran.' },
    { 'PANDUAN': '3. Sheet "Keuangan Tim & Honor": isi Nama Tim, Peran, Nomor HP, Nomor Rekening, Total Honor, dan Status Bayar.' },
    { 'PANDUAN': '4. Simpan file .xlsx/.xls lalu unggah ke halaman Migrasi & Import Data.' },
    { 'PANDUAN': '5. Jika ada kolom angka, isi tanpa titik, koma, atau simbol mata uang (contoh: 5000000).' }
  ];
  const wsGuide = XLSX.utils.json_to_sheet(guideData, { header: ['PANDUAN'] });
  wsGuide['!cols'] = [{ wch: 110 }];
  XLSX.utils.book_append_sheet(wb, wsGuide, 'Petunjuk Pengisian');

  const fileName = type === 'all' ? 'Template_Migrasi_Vena_Pictures.xlsx' : `Template_${type}_Vena_Pictures.xlsx`;
  XLSX.writeFile(wb, fileName);
}

// Parse Raw Number or Currency
export function parseRawNumber(val: any): number {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') return Number.isFinite(val) ? val : 0;

  const raw = String(val).trim();
  if (!raw) return 0;

  const normalized = raw.replace(/\s+/g, '').replace(/[^\d,.-]/g, '');
  if (!normalized || normalized === '-' || normalized === '.' || normalized === ',') return 0;

  let sign = '';
  let digits = normalized;
  if (digits.startsWith('-')) {
    sign = '-';
    digits = digits.slice(1);
  } else if (digits.startsWith('+')) {
    digits = digits.slice(1);
  }

  if (digits.includes(',') && digits.includes('.')) {
    const lastComma = digits.lastIndexOf(',');
    const lastDot = digits.lastIndexOf('.');
    const decimalSeparator = lastComma > lastDot ? ',' : '.';
    const thousandsSeparator = decimalSeparator === ',' ? '.' : ',';
    const compacted = digits
      .replace(new RegExp(`\\${thousandsSeparator}`, 'g'), '')
      .replace(decimalSeparator, '.');
    const num = Number(compacted);
    return Number.isFinite(num) ? (sign ? -num : num) : 0;
  }

  if (digits.includes('.') && digits.split('.').length > 2) {
    const num = Number(digits.replace(/\./g, ''));
    return Number.isFinite(num) ? (sign ? -num : num) : 0;
  }

  if (digits.includes(',') && digits.split(',').length > 2) {
    const num = Number(digits.replace(/,/g, ''));
    return Number.isFinite(num) ? (sign ? -num : num) : 0;
  }

  if (digits.includes(',')) {
    const parts = digits.split(',');
    if (parts.length === 2 && parts[1].length <= 2 && parts[1].length > 0) {
      const num = Number(`${parts[0]}.${parts[1]}`);
      return Number.isFinite(num) ? (sign ? -num : num) : 0;
    }
    const num = Number(digits.replace(/,/g, ''));
    return Number.isFinite(num) ? (sign ? -num : num) : 0;
  }

  if (digits.includes('.')) {
    const parts = digits.split('.');
    if (parts.length === 2 && parts[1].length <= 2 && parts[1].length > 0) {
      const num = Number(digits);
      return Number.isFinite(num) ? (sign ? -num : num) : 0;
    }
    const num = Number(digits.replace(/\./g, ''));
    return Number.isFinite(num) ? (sign ? -num : num) : 0;
  }

  const num = Number(digits);
  return Number.isFinite(num) ? (sign ? -num : num) : 0;
}

// Standardize Date String to YYYY-MM-DD
export function parseRawDate(val: any): string {
  if (!val) return new Date().toISOString().split('T')[0];
  
  // If Excel serial number date
  if (typeof val === 'number') {
    const d = XLSX.SSF.parse_date_code(val);
    if (d) {
      const month = String(d.m).padStart(2, '0');
      const day = String(d.d).padStart(2, '0');
      return `${d.y}-${month}-${day}`;
    }
  }

  const str = String(val).trim();
  // Check if already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;

  // Check DD/MM/YYYY, DD-MM-YYYY, or DD.MM.YYYY
  const ddmmyyyy = str.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
  if (ddmmyyyy) {
    const day = ddmmyyyy[1].padStart(2, '0');
    const month = ddmmyyyy[2].padStart(2, '0');
    const year = ddmmyyyy[3];
    return `${year}-${month}-${day}`;
  }

  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0];
  }

  return new Date().toISOString().split('T')[0];
}

// Parse Clients Sheet
export function parseClientsFromSheet(rows: any[]): ParseResult<Partial<Client>> {
  const valid: Partial<Client>[] = [];
  const errors: { row: number; reason: string; data?: any }[] = [];

  rows.forEach((row, idx) => {
    const rowNum = idx + 2;
    const normalized: Record<string, any> = {};
    for (const key of Object.keys(row)) {
      normalized[key.trim().toLowerCase()] = row[key];
    }

    const name =
      normalized['nama pengantin (wajib)'] ||
      normalized['nama pengantin / klien (wajib)'] ||
      normalized['nama pengantin (wajib)'] ||
      normalized['nama pengantin'] ||
      normalized['nama klien (wajib)'] ||
      normalized['nama klien'] ||
      normalized['nama'] ||
      normalized['client name'] ||
      normalized['name'];

    if (!name || String(name).trim() === '') {
      errors.push({ row: rowNum, reason: 'Nama Pengantin kosong atau tidak ditemukan', data: row });
      return;
    }

    const phone =
      normalized['nomor whatsapp / telepon (wajib)'] ||
      normalized['nomor telepon / whatsapp (wajib)'] ||
      normalized['nomor hp / whatsapp (wajib)'] ||
      normalized['nomor hp'] ||
      normalized['no hp'] ||
      normalized['no whatsapp'] ||
      normalized['whatsapp'] ||
      normalized['phone'] || '';

    const email = normalized['email'] || normalized['alamat email'] || '';
    const eventDate = parseRawDate(
      normalized['tanggal acara (yyyy-mm-dd)'] ||
      normalized['tanggal acara'] ||
      normalized['tanggal pernikahan'] ||
      normalized['tanggal hubungi / event (yyyy-mm-dd)'] ||
      normalized['tanggal hubungi'] ||
      normalized['wedding date'] ||
      normalized['tanggal'] ||
      normalized['since']
    );

    const venue =
      normalized['lokasi (kota)'] ||
      normalized['lokasi acara'] ||
      normalized['lokasi'] ||
      normalized['venue'] || '';
    const city =
      normalized['lokasi (kota)'] ||
      normalized['kota / wilayah'] ||
      normalized['kota'] ||
      normalized['wilayah'] ||
      normalized['city'] || '';
    const addressBase =
      normalized['alamat lengkap / gedung'] ||
      normalized['alamat lengkap'] ||
      normalized['alamat'] ||
      normalized['address'] ||
      '';
    const address =
      addressBase
        ? (city ? `${addressBase}, ${city}` : addressBase)
        : (venue ? (city ? `${venue}, ${city}` : venue) : (city || ''));
    const instagram = normalized['instagram'] || normalized['ig'] || normalized['instagram handle'] || '';

    const statusRaw = String(
      normalized['status pengantin'] ||
      normalized['status (active/completed/cancelled/lead)'] ||
      normalized['status klien'] ||
      normalized['status'] ||
      'Aktif'
    ).toLowerCase();

    let status: ClientStatus = ClientStatus.ACTIVE;
    if (statusRaw.includes('complete') || statusRaw.includes('selesai') || statusRaw.includes('done')) status = ClientStatus.INACTIVE;
    else if (statusRaw.includes('cancel') || statusRaw.includes('batal') || statusRaw.includes('lost') || statusRaw.includes('hilang')) status = ClientStatus.LOST;
    else if (statusRaw.includes('lead') || statusRaw.includes('calon')) status = ClientStatus.LEAD;
    else if (statusRaw.includes('tidak aktif') || statusRaw.includes('inactive')) status = ClientStatus.INACTIVE;

    const clientTypeRaw = String(
      normalized['jenis pengantin'] ||
      normalized['tipe klien'] ||
      normalized['client type'] ||
      'Langsung'
    ).toLowerCase();
    const clientType: ClientType = clientTypeRaw.includes('vendor') ? ClientType.VENDOR : ClientType.DIRECT;

    const notes = normalized['catatan tambahan'] || normalized['catatan'] || normalized['notes'] || '';
    const projectName = normalized['nama acara'] || normalized['nama acara pernikahan'] || normalized['nama proyek'] || normalized['project name'] || `${String(name).trim()} Wedding Makeup`;
    const projectType = normalized['jenis acara'] || normalized['project type'] || normalized['jenis pengantin'] || 'Wedding Makeup';
    const packageName = normalized['nama paket'] || normalized['package name'] || normalized['package'] || 'Custom Package';
    const projectDate = parseRawDate(
      normalized['tanggal acara'] ||
      normalized['tanggal acara (yyyy-mm-dd)'] ||
      eventDate
    );
    const projectLocation = normalized['lokasi (kota)'] || normalized['lokasi acara'] || normalized['location'] || city || venue || '';
    const totalCost = parseRawNumber(
      normalized['total tagihan (idr)'] ||
      normalized['total cost'] ||
      normalized['total tagihan'] ||
      normalized['total'] || 0
    );
    const amountPaid = parseRawNumber(
      normalized['dp (idr)'] ||
      normalized['amount paid'] ||
      normalized['jumlah dibayar'] ||
      normalized['dp'] || 0
    );
    const paymentStatus = normalized['status pembayaran'] || normalized['payment status'] || (amountPaid > 0 ? 'DP Terbayar' : 'Belum Bayar');
    const durationSelection = normalized['durasi'] || normalized['duration selection'] || undefined;
    const unitPrice = parseRawNumber(
      normalized['unit price'] ||
      normalized['harga paket'] ||
      normalized['unit_price'] || 0
    );

    const clientItem: Partial<Client> & {
      projectName?: string;
      projectType?: string;
      packageName?: string;
      date?: string;
      location?: string;
      totalCost?: number;
      amountPaid?: number;
      paymentStatus?: string;
      durationSelection?: string;
      unitPrice?: number;
    } = {
      id: crypto.randomUUID(),
      name: String(name).trim(),
      email: String(email).trim(),
      phone: String(phone).trim(),
      whatsapp: String(phone).trim() || undefined,
      since: eventDate,
      instagram: instagram ? String(instagram).trim() : undefined,
      status,
      clientType,
      lastContact: eventDate,
      portalAccessId: crypto.randomUUID(),
      address: address || (notes ? String(notes).trim() : undefined),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      projectName: String(projectName).trim(),
      projectType: String(projectType).trim(),
      packageName: String(packageName).trim(),
      date: projectDate,
      location: String(projectLocation).trim(),
      totalCost,
      amountPaid,
      paymentStatus: String(paymentStatus).trim(),
      durationSelection: durationSelection ? String(durationSelection).trim() : undefined,
      unitPrice: unitPrice > 0 ? unitPrice : undefined,
    };

    valid.push(clientItem);
  });

  return { valid, errors, totalRows: rows.length };
}

// Parse Transactions Sheet
export function parseTransactionsFromSheet(rows: any[]): ParseResult<Partial<Transaction>> {
  const valid: Partial<Transaction>[] = [];
  const errors: { row: number; reason: string; data?: any }[] = [];

  rows.forEach((row, idx) => {
    const rowNum = idx + 2;
    const normalized: Record<string, any> = {};
    for (const key of Object.keys(row)) {
      normalized[key.trim().toLowerCase()] = row[key];
    }

    const description =
      normalized['keterangan / deskripsi (wajib)'] ||
      normalized['keterangan'] ||
      normalized['deskripsi'] ||
      normalized['description'] ||
      normalized['nama transaksi'];

    if (!description || String(description).trim() === '') {
      errors.push({ row: rowNum, reason: 'Keterangan transaksi kosong', data: row });
      return;
    }

    const amount = parseRawNumber(
      normalized['nominal (idr) (wajib)'] ||
      normalized['nominal'] ||
      normalized['jumlah'] ||
      normalized['amount'] ||
      normalized['total']
    );

    if (amount <= 0) {
      errors.push({ row: rowNum, reason: 'Nominal transaksi harus lebih dari 0', data: row });
      return;
    }

    const typeRaw = String(
      normalized['tipe (pemasukan / pengeluaran) (wajib)'] ||
      normalized['tipe (pemasukan / pengeluaran)'] ||
      normalized['tipe'] ||
      normalized['jenis'] ||
      normalized['type'] || 'Pemasukan'
    ).toLowerCase();

    const isExpense = typeRaw.includes('keluar') || typeRaw.includes('expense') || typeRaw.includes('out') || typeRaw.includes('pengeluaran');
    const type: TransactionType = isExpense ? TransactionType.EXPENSE : TransactionType.INCOME;

    const date = parseRawDate(
      normalized['tanggal (yyyy-mm-dd)'] ||
      normalized['tanggal'] ||
      normalized['date']
    );

    const category =
      normalized['kategori'] ||
      normalized['category'] ||
      (isExpense ? 'Operasional' : 'Pembayaran Pengantin');

    const methodRaw =
      normalized['metode pembayaran'] ||
      normalized['metode'] ||
      normalized['payment method'] ||
      normalized['akun / rekening'] ||
      normalized['rekening'] ||
      normalized['akun'] ||
      'Transfer Bank';

    const method: Transaction['method'] =
      String(methodRaw).toLowerCase().includes('cash') || String(methodRaw).toLowerCase().includes('tunai')
        ? 'Tunai'
        : String(methodRaw).toLowerCase().includes('e-wallet') || String(methodRaw).toLowerCase().includes('ewallet') || String(methodRaw).toLowerCase().includes('ovo') || String(methodRaw).toLowerCase().includes('dana')
          ? 'E-Wallet'
          : String(methodRaw).toLowerCase().includes('kartu') || String(methodRaw).toLowerCase().includes('card')
            ? 'Kartu'
            : 'Transfer Bank';

    const relatedClient = normalized['nama klien / vendor terkait'] || normalized['klien'] || normalized['vendor'] || '';
    const notes = normalized['catatan'] || normalized['notes'] || '';
    const fullNotes = [relatedClient ? `Pihak Terkait: ${relatedClient}` : '', notes].filter(Boolean).join(' | ');

    const txItem: Partial<Transaction> = {
      id: crypto.randomUUID(),
      date,
      description: String(description).trim(),
      amount,
      type,
      category: String(category).trim(),
      method,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...(fullNotes ? { vendorSignature: fullNotes } : {}),
    };

    valid.push(txItem);
  });

  return { valid, errors, totalRows: rows.length };
}

// Parse Team Payments Sheet
export interface ParsedTeamPaymentItem {
  teamMemberName: string;
  role: string;
  phone?: string;
  bankAccount?: string;
  projectName?: string;
  eventDate?: string;
  amount: number;
  status: 'Paid' | 'Unpaid';
  paidAt?: string;
  paymentMethod?: string;
  notes?: string;
}

export function parseTeamPaymentsFromSheet(rows: any[]): ParseResult<ParsedTeamPaymentItem> {
  const valid: ParsedTeamPaymentItem[] = [];
  const errors: { row: number; reason: string; data?: any }[] = [];

  rows.forEach((row, idx) => {
    const rowNum = idx + 2;
    const normalized: Record<string, any> = {};
    for (const key of Object.keys(row)) {
      normalized[key.trim().toLowerCase()] = row[key];
    }

    const name = 
      normalized['nama anggota tim / freelancer (wajib)'] || 
      normalized['nama anggota tim'] || 
      normalized['nama tim'] || 
      normalized['nama freelancer'] || 
      normalized['nama'] || 
      normalized['name'];

    if (!name || String(name).trim() === '') {
      errors.push({ row: rowNum, reason: 'Nama Anggota Tim/Freelancer kosong', data: row });
      return;
    }

    const amount = parseRawNumber(
      normalized['honor / fee (idr) (wajib)'] || 
      normalized['honor'] || 
      normalized['fee'] || 
      normalized['nominal'] || 
      normalized['jumlah'] || 
      normalized['amount']
    );

    if (amount <= 0) {
      errors.push({ row: rowNum, reason: 'Honor / Fee harus lebih dari 0', data: row });
      return;
    }

    const role = normalized['peran / posisi'] || normalized['peran'] || normalized['posisi'] || normalized['role'] || 'Photographer';
    const phone = normalized['nomor whatsapp'] || normalized['no whatsapp'] || normalized['hp'] || normalized['phone'] || '';
    const bankAccount = normalized['nomor rekening & bank'] || normalized['rekening'] || normalized['bank'] || '';
    const projectName = normalized['nama acara'] || normalized['nama proyek / acara'] || normalized['proyek'] || normalized['acara'] || normalized['project'] || 'Event';
    const eventDate = parseRawDate(normalized['tanggal tugas (yyyy-mm-dd)'] || normalized['tanggal tugas'] || normalized['tanggal']);
    
    const statusRaw = String(normalized['status bayar (paid / unpaid)'] || normalized['status bayar'] || normalized['status'] || 'Unpaid').toLowerCase().trim();
    const isUnpaid = statusRaw.includes('unpaid') || statusRaw.includes('belum') || statusRaw.includes('pending') || statusRaw.includes('menunggu');
    const isPaid = !isUnpaid && (statusRaw.includes('paid') || statusRaw.includes('lunas') || statusRaw.includes('sudah') || statusRaw.includes('dibayar'));
    const status: 'Paid' | 'Unpaid' = isPaid ? 'Paid' : 'Unpaid';
    
    const rawPaidAt = normalized['tanggal bayar (jika paid)'] || normalized['tanggal bayar'];
    const paidAt = isPaid ? (rawPaidAt ? parseRawDate(rawPaidAt) : eventDate) : undefined;
    const paymentMethod = normalized['metode bayar (transfer/cash)'] || normalized['metode bayar'] || 'Transfer';
    const notes = normalized['catatan'] || normalized['notes'] || '';

    valid.push({
      teamMemberName: String(name).trim(),
      role: String(role).trim(),
      phone: String(phone).trim(),
      bankAccount: String(bankAccount).trim(),
      projectName: String(projectName).trim(),
      eventDate,
      amount,
      status,
      paidAt,
      paymentMethod: String(paymentMethod).trim(),
      notes: String(notes).trim()
    });
  });

  return { valid, errors, totalRows: rows.length };
}

// Parse Packages Sheet
export function parsePackagesFromSheet(rows: any[]): ParseResult<any> {
  const valid: any[] = [];
  const errors: { row: number; reason: string; data?: any }[] = [];

  rows.forEach((row, idx) => {
    const rowNum = idx + 2;
    const normalized: Record<string, any> = {};
    for (const key of Object.keys(row)) {
      normalized[key.trim().toLowerCase()] = row[key];
    }

    const name = normalized['nama paket (wajib)'] || normalized['nama paket'] || normalized['nama'] || normalized['name'];
    const price = parseRawNumber(normalized['harga (idr) (wajib)'] || normalized['harga'] || normalized['price'] || 0);

    if (!name || String(name).trim() === '' || price <= 0) {
      errors.push({ row: rowNum, reason: 'Nama Paket atau Harga tidak valid', data: row });
      return;
    }

    valid.push({
      id: crypto.randomUUID(),
      name: String(name).trim(),
      price,
      region: normalized['wilayah'] || normalized['region'] || '',
      category: normalized['kategori'] || normalized['category'] || 'Umum',
      photographers: normalized['fotografer'] || '',
      videographers: normalized['videografer'] || '',
      processingTime: normalized['waktu pengerjaan'] || '',
      digitalItems: String(normalized['item digital (pisahkan dengan koma)'] || '').split(',').map(s => s.trim()).filter(Boolean),
      physicalItems: String(normalized['item fisik (pisahkan dengan koma)'] || '').split(',').map(s => s.trim()).filter(Boolean).map(name => ({ name })),
      createdAt: new Date().toISOString(),
    });
  });

  return { valid, errors, totalRows: rows.length };
}

// Convert an uploaded File (Excel or CSV) to sheet json
export async function readExcelFile(file: File): Promise<{ [sheetName: string]: any[] }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const result: { [sheetName: string]: any[] } = {};

        workbook.SheetNames.forEach((name) => {
          const sheet = workbook.Sheets[name];
          const json = XLSX.utils.sheet_to_json(sheet, { defval: '' });
          result[name] = json;
        });

        resolve(result);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
}
