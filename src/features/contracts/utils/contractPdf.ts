import { jsPDF } from 'jspdf';
import { Contract, Profile, Project } from '../../../types';
import {
  COLORS,
  CONTENT_BOTTOM,
  CONTENT_LEFT,
  CONTENT_RIGHT,
  CONTENT_W,
  MARGIN_TOP,
  PT_TO_MM,
  RGB,
  createPdfDoc,
  createPdfTools,
  embedPdfFonts,
  PDF_FONT_FAMILY,
  formatCurrency,
  formatDateWithWeekday,
  lineHeight,
  loadImageAsset,
  sanitize,
} from '../../../shared/utils/pdfCore';

/**
 * Renderer PDF untuk Kontrak Kerja.
 *
 * Dibangun ulang memakai primitive vector jsPDF (teks & garis tajam), dengan
 * aliran halaman otomatis sehingga pasal, paragraf, tabel biaya, dan area tanda
 * tangan tidak terpotong. Struktur mengikuti ContractDocument pada preview
 * aplikasi; preview itu sendiri tidak diubah.
 */

export interface ContractPdfInput {
  contract: Contract;
  project: Project;
  profile: Profile;
  hideSignatures?: boolean;
}

interface Seg {
  text: string;
  bold?: boolean;
  italic?: boolean;
}

interface Token {
  text: string;
  bold: boolean;
  italic: boolean;
  w: number;
}

const BLUE_800: RGB = [30, 64, 175];
const SLATE_700: RGB = [51, 65, 85];
const PARA_COLOR: RGB = [51, 65, 85];
const SECTION_MARGIN_TOP = 5;
const SECTION_MARGIN_BOTTOM = 3;

const safeFilePart = (value?: string): string =>
  sanitize(value).replace(/[\\/:*?"<>|\s]+/g, '_');

export const buildContractFileName = (contract: Contract, hideSignatures = false): string => {
  const name = safeFilePart(contract.contractNumber || 'digital') || 'digital';
  return `kontrak-${name}${hideSignatures ? '-tanpa-ttd' : ''}.pdf`;
};

// Terbilang sederhana (identik dengan ContractDocument).
const toWords = (n: number): string => {
  const ones = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan',
    'Sepuluh', 'Sebelas', 'Dua Belas', 'Tiga Belas', 'Empat Belas', 'Lima Belas', 'Enam Belas',
    'Tujuh Belas', 'Delapan Belas', 'Sembilan Belas'];
  const tens = ['', '', 'Dua Puluh', 'Tiga Puluh', 'Empat Puluh', 'Lima Puluh',
    'Enam Puluh', 'Tujuh Puluh', 'Delapan Puluh', 'Sembilan Puluh'];
  if (n === 0) return 'Nol';
  if (n < 0) return 'Minus ' + toWords(-n);
  if (n < 20) return ones[n];
  if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
  if (n < 1000) return ones[Math.floor(n / 100)] + ' Ratus' + (n % 100 ? ' ' + toWords(n % 100) : '');
  if (n < 1000000) return toWords(Math.floor(n / 1000)) + ' Ribu' + (n % 1000 ? ' ' + toWords(n % 1000) : '');
  if (n < 1000000000) return toWords(Math.floor(n / 1000000)) + ' Juta' + (n % 1000000 ? ' ' + toWords(n % 1000000) : '');
  return toWords(Math.floor(n / 1000000000)) + ' Miliar' + (n % 1000000000 ? ' ' + toWords(n % 1000000000) : '');
};
const terbilang = (amount: number): string => `${toWords(Math.round(amount))} Rupiah`;

export const buildContractPdf = async (input: ContractPdfInput): Promise<jsPDF> => {
  const { contract, project } = input;
  const profile = input.profile || ({} as Profile);
  const hideSignatures = !!input.hideSignatures;

  const doc = createPdfDoc('portrait');
  await embedPdfFonts(doc);
  const { fill, stroke, ink, setFont, wrap } = createPdfTools(doc);

  const vendorSig = contract.vendorSignature || profile.signatureBase64;
  const effectiveVendorSig = hideSignatures ? undefined : vendorSig;
  const effectiveClientSig = hideSignatures ? undefined : contract.clientSignature;
  const shouldShowMeteraiVendor = !!contract.includeMeterai && contract.meteraiPlacement === 'both';
  const shouldShowMeteraiClient =
    !!contract.includeMeterai &&
    ((contract.meteraiPlacement || 'client') === 'client' || contract.meteraiPlacement === 'both');

  const [logo, vendorSigImg, clientSigImg, meterai] = await Promise.all([
    loadImageAsset(profile.logoBase64),
    loadImageAsset(effectiveVendorSig),
    loadImageAsset(effectiveClientSig),
    contract.includeMeterai ? loadImageAsset('/assets/images/meterai/matrai10rb.jpg') : Promise.resolve(null),
  ]);

  // ── Aliran halaman & pengukuran teks ───────────────────────────────────
  let y = MARGIN_TOP;
  const newPage = () => {
    doc.addPage();
    y = MARGIN_TOP + 2;
  };
  const ensure = (h: number) => {
    if (y + h > CONTENT_BOTTOM) newPage();
  };

  /** Mengukur sekumpulan segmen menjadi baris-baris token (dukungan bold/italic). */
  const layoutSegments = (segs: Seg[], size: number, maxW: number): Token[][] => {
    const measure = (text: string, bold: boolean, italic: boolean): number => {
      doc.setFont(PDF_FONT_FAMILY, bold ? (italic ? 'bolditalic' : 'bold') : italic ? 'italic' : 'normal');
      doc.setFontSize(size);
      return doc.getTextWidth(sanitize(text));
    };

    const tokens: Token[] = [];
    segs.forEach((seg) => {
      const bold = !!seg.bold;
      const italic = !!seg.italic;
      sanitize(seg.text)
        .split(/(\s+)/)
        .forEach((part) => {
          if (!part) return;
          tokens.push({ text: part, bold, italic, w: measure(part, bold, italic) });
        });
    });

    const lines: Token[][] = [];
    let cur: Token[] = [];
    let curW = 0;
    tokens.forEach((tok) => {
      const isSpace = tok.text.trim() === '';
      if (cur.length > 0 && curW + tok.w > maxW) {
        lines.push(cur);
        cur = [];
        curW = 0;
        if (isSpace) return;
      }
      if (cur.length === 0 && isSpace) return;
      cur.push(tok);
      curW += tok.w;
    });
    if (cur.length) lines.push(cur);
    return lines.length ? lines : [[]];
  };

  const drawLine = (line: Token[], x: number, yLine: number, size: number, color: RGB) => {
    let cursorX = x;
    line.forEach((tok) => {
      doc.setFont(PDF_FONT_FAMILY, tok.bold ? (tok.italic ? 'bolditalic' : 'bold') : tok.italic ? 'italic' : 'normal');
      doc.setFontSize(size);
      ink(color);
      doc.text(tok.text, cursorX, yLine + size * PT_TO_MM);
      cursorX += tok.w;
    });
  };

  /** Menulis satu paragraf dengan pembelahan halaman otomatis. */
  const paragraph = (
    segs: Seg[],
    size: number,
    opts?: { indent?: number; color?: RGB; factor?: number; spaceAfter?: number; align?: 'left' | 'center' },
  ) => {
    const indent = opts?.indent ?? 0;
    const color = opts?.color ?? PARA_COLOR;
    const factor = opts?.factor ?? 1.55;
    const spaceAfter = opts?.spaceAfter ?? 1.6;
    const lh = lineHeight(size, factor);
    const maxW = CONTENT_W - indent;

    if (opts?.align === 'center') {
      // Paragraf tengah (mis. kalimat penutup) — dipecah per baris sederhana.
      setFont(size, segs[0]?.italic ? 'italic' : 'normal');
      const text = sanitize(segs.map((s) => s.text).join(''));
      const lines = wrap(text, maxW);
      lines.forEach((line) => {
        ensure(lh);
        setFont(size, segs[0]?.italic ? 'italic' : 'normal');
        ink(color);
        doc.text(line, CONTENT_LEFT + CONTENT_W / 2, y + size * PT_TO_MM, { align: 'center' });
        y += lh;
      });
      y += spaceAfter;
      return;
    }

    const lines = layoutSegments(segs, size, maxW);
    lines.forEach((line) => {
      ensure(lh);
      drawLine(line, CONTENT_LEFT + indent, y, size, color);
      y += lh;
    });
    y += spaceAfter;
  };

  /** Judul pasal: dijaga tidak terpisah dari isi berikutnya. */
  const sectionTitle = (text: string) => {
    const h = SECTION_MARGIN_TOP + lineHeight(11, 1.3) + 2.4 + SECTION_MARGIN_BOTTOM;
    ensure(h + lineHeight(11, 1.55) * 2);
    y += SECTION_MARGIN_TOP;
    setFont(11, 'bold');
    ink(BLUE_800);
    doc.text(sanitize(text), CONTENT_LEFT, y + 11 * PT_TO_MM);
    y += lineHeight(11, 1.3);
    stroke(BLUE_800);
    doc.setLineWidth(0.6);
    doc.line(CONTENT_LEFT, y, CONTENT_RIGHT, y);
    y += SECTION_MARGIN_BOTTOM;
  };

  /** Kotak identitas pihak (PIHAK PERTAMA / KEDUA) yang dijaga utuh. */
  const partyBox = (label: string, body: Seg[][], closing: Seg[]) => {
    const bodySize = 9.5;
    const bodyLh = lineHeight(bodySize, 1.6);
    const closingSize = 10;
    const closingLh = lineHeight(closingSize, 1.6);
    const innerW = CONTENT_W - 12;

    let bodyH = 0;
    body.forEach((segs) => {
      bodyH += layoutSegments(segs, bodySize, innerW).length * bodyLh;
    });
    const closingH = layoutSegments(closing, closingSize, innerW).length * closingLh;
    const boxH = 6 + lineHeight(10, 1.3) + 1.8 + 2 + bodyH + 3 + closingH + 5;

    ensure(boxH);

    fill([248, 250, 252]);
    stroke(COLORS.borderSoft);
    doc.setLineWidth(0.25);
    doc.roundedRect(CONTENT_LEFT, y, CONTENT_W, boxH, 1.6, 1.6, 'FD');

    let cursor = y + 6;
    setFont(10, 'bold');
    ink(COLORS.label);
    doc.text(sanitize(label), CONTENT_LEFT + 6, cursor + 10 * PT_TO_MM);
    cursor += lineHeight(10, 1.3);
    stroke(COLORS.borderSoft);
    doc.setLineWidth(0.2);
    doc.line(CONTENT_LEFT + 6, cursor + 1, CONTENT_RIGHT - 6, cursor + 1);
    cursor += 3;

    body.forEach((segs) => {
      const lines = layoutSegments(segs, bodySize, innerW);
      lines.forEach((line) => {
        drawLine(line, CONTENT_LEFT + 6, cursor, bodySize, PARA_COLOR);
        cursor += bodyLh;
      });
    });

    cursor += 3;
    const closingLines = layoutSegments(closing, closingSize, innerW);
    closingLines.forEach((line) => {
      drawLine(line, CONTENT_LEFT + 6, cursor, closingSize, PARA_COLOR);
      cursor += closingLh;
    });

    y += boxH + 4;
  };

  /** Konten pasal kustom (teks bebas) atau fallback bawaan. */
  const renderCustomContent = (content: string | undefined, fallback: () => void) => {
    if (!content) {
      fallback();
      return;
    }
    const parts = content.split(/\n+/);
    parts.forEach((line) => {
      const trimmed = line.trim();
      if (trimmed) {
        paragraph([{ text: trimmed }], 10);
      } else {
        y += 1.6;
      }
    });
  };

  // ── Kop / Header ───────────────────────────────────────────────────────
  fill(BLUE_800);
  doc.rect(0, 0, 210, 2.8, 'F');

  y = MARGIN_TOP + 2.8 + 4;
  const headerTop = y;
  const colGap = 3;
  const unit = (CONTENT_W - colGap * 2) / 4.5;
  const col1W = unit * 1.25;
  const col2W = unit * 2;
  const col3W = unit * 1.25;
  const col2X = CONTENT_LEFT + col1W + colGap;
  const col3X = col2X + col2W + colGap;

  // Kolom 1: logo + nama perusahaan.
  let leftY = headerTop;
  if (logo) {
    const maxH = 13.4;
    const maxW = 20.5;
    const ratio = logo.width / logo.height;
    let h = maxH;
    let w = h * ratio;
    if (w > maxW) {
      w = maxW;
      h = w / ratio;
    }
    try {
      doc.addImage(logo.dataUrl, 'PNG', CONTENT_LEFT, leftY, w, h, undefined, 'FAST');
    } catch {
      // Abaikan bila logo gagal dirender.
    }
    leftY += h + 1.6;
  }
  setFont(8.5, 'bold');
  ink(COLORS.text);
  const companyNameLines = wrap(profile.companyName || '', col1W);
  companyNameLines.forEach((line) => {
    doc.text(line, CONTENT_LEFT, leftY + 8.5 * PT_TO_MM);
    leftY += lineHeight(8.5, 1.25);
  });
  setFont(7, 'normal');
  ink(COLORS.label);
  doc.text('PROFESSIONAL MAKEUP ARTIST', CONTENT_LEFT, leftY + 7 * PT_TO_MM);
  leftY += lineHeight(7, 1.3);

  // Kolom 2: judul & subjudul.
  const serviceTitle = contract.serviceTitle || `JASA ${(project.projectType || '').toUpperCase()}`;
  setFont(13.5, 'bold');
  ink(COLORS.text);
  const titleCenterX = col2X + col2W / 2;
  doc.text('SURAT PERJANJIAN KERJA SAMA', titleCenterX, headerTop + 13.5 * PT_TO_MM, { align: 'center' });
  let centerY = headerTop + lineHeight(13.5, 1.25);
  setFont(9, 'bold');
  ink(COLORS.textSoft);
  const subtitleLines = wrap(serviceTitle, col2W - 8);
  subtitleLines.forEach((line) => {
    doc.text(line, titleCenterX, centerY + 9 * PT_TO_MM, { align: 'center' });
    centerY += lineHeight(9, 1.3);
  });

  // Kolom 3: badge nomor kontrak.
  const badgeW = Math.min(col3W, 41.6);
  const badgeX = col3X + (col3W - badgeW) / 2;
  const badgeText = sanitize(contract.contractNumber || `CTR-${sanitize(contract.id).slice(-6).toUpperCase()}`);
  const badgeTextLines = wrap(badgeText, badgeW - 6);
  const badgeH = 5 + lineHeight(7, 1.3) + badgeTextLines.length * lineHeight(8.5, 1.3) + 4;
  fill(COLORS.headBg);
  stroke(COLORS.borderSoft);
  doc.setLineWidth(0.25);
  doc.roundedRect(badgeX, headerTop, badgeW, badgeH, 1, 1, 'FD');
  setFont(7, 'normal');
  ink(COLORS.label);
  doc.text('NOMOR KONTRAK', badgeX + badgeW / 2, headerTop + 3 + 7 * PT_TO_MM, { align: 'center' });
  let badgeY = headerTop + 3 + lineHeight(7, 1.3);
  setFont(8.5, 'bold');
  ink(SLATE_700);
  badgeTextLines.forEach((line) => {
    doc.text(line, badgeX + badgeW / 2, badgeY + 8.5 * PT_TO_MM, { align: 'center' });
    badgeY += lineHeight(8.5, 1.3);
  });

  y = Math.max(leftY, centerY, headerTop + badgeH) + 4;
  stroke(COLORS.borderSoft);
  doc.setLineWidth(0.7);
  doc.line(CONTENT_LEFT, y, CONTENT_RIGHT, y);
  y += 5;

  // ── Pembuka ────────────────────────────────────────────────────────────
  paragraph(
    [
      { text: 'Pada hari ini, ' },
      { text: formatDateWithWeekday(contract.signingDate), bold: true },
      { text: ', bertempat di ' },
      { text: sanitize(contract.signingLocation || '-'), bold: true },
      { text: ', telah dibuat dan disepakati ' },
      { text: `Perjanjian Kerja Sama ${serviceTitle}`, bold: true },
      { text: ' antara:' },
    ],
    10,
    { spaceAfter: 4 },
  );

  // ── Identitas pihak ────────────────────────────────────────────────────
  const pihakPertamaBody: Seg[][] = [
    [{ text: sanitize(profile.companyName || 'Vendor'), bold: true }],
    [{ text: `yang diwakili oleh: ${sanitize(profile.authorizedSigner || '________________________')}` }],
  ];
  if (profile.address) pihakPertamaBody.push([{ text: `Alamat: ${sanitize(profile.address)}` }]);
  if (profile.phone) pihakPertamaBody.push([{ text: `Telepon: ${sanitize(profile.phone)}` }]);
  partyBox('PIHAK PERTAMA', pihakPertamaBody, [
    { text: 'Selanjutnya disebut ' },
    { text: 'PIHAK PERTAMA', bold: true },
    { text: '.', italic: true },
  ]);

  const clientDisplay = contract.clientName2
    ? `${sanitize(contract.clientName1)} DAN ${sanitize(contract.clientName2)}`
    : sanitize(contract.clientName1);
  const clientPhone = `${sanitize(contract.clientPhone1 || '')}${
    contract.clientPhone2 ? ` / ${sanitize(contract.clientPhone2)}` : ''
  }`;
  const clientAddress = `${sanitize(contract.clientAddress1 || '')}${
    contract.clientAddress2 && contract.clientAddress2 !== contract.clientAddress1
      ? ` / ${sanitize(contract.clientAddress2)}`
      : ''
  }`;
  partyBox(
    'PIHAK KEDUA',
    [
      [{ text: clientDisplay, bold: true }],
      [{ text: `Nomor Telepon: ${clientPhone}` }],
      [{ text: `Alamat: ${clientAddress}` }],
    ],
    [
      { text: 'Selanjutnya disebut ' },
      { text: 'PIHAK KEDUA', bold: true },
      { text: '.', italic: true },
    ],
  );

  // ── PASAL 1 ────────────────────────────────────────────────────────────
  sectionTitle('PASAL 1 — RUANG LINGKUP PEKERJAAN');
  renderCustomContent(contract.pasal1Content, () => {
    paragraph([
      { text: '1.1 PIHAK PERTAMA sepakat untuk memberikan jasa ' },
      { text: (contract.serviceTitle || `rias dan makeup ${project.projectType || ''}`).toLowerCase(), bold: true },
      { text: ' kepada PIHAK KEDUA.' },
    ], 10);
    paragraph([{ text: '1.2 Pelaksanaan pekerjaan dilakukan pada:' }], 10);
    paragraph([
      { text: '• ' },
      { text: 'Tanggal Acara', bold: true },
      { text: ` : ${formatDateWithWeekday(project.date)}` },
    ], 10, { indent: 5.6 });
    paragraph([
      { text: '• ' },
      { text: 'Lokasi Acara', bold: true },
      { text: ` : ${sanitize(project.location || '-')}` },
    ], 10, { indent: 5.6 });
    if (contract.shootingDuration) {
      paragraph([{ text: '1.3 Rincian layanan yang diberikan oleh PIHAK PERTAMA meliputi:' }], 10);
      paragraph([{ text: `• ${sanitize(contract.shootingDuration)}` }], 10, { indent: 5.6 });
    }
    if (contract.guaranteedPhotos) paragraph([{ text: `• ${sanitize(contract.guaranteedPhotos)}` }], 10, { indent: 5.6 });
    if (contract.albumDetails) paragraph([{ text: `• ${sanitize(contract.albumDetails)}` }], 10, { indent: 5.6 });
    if (contract.otherItems) {
      paragraph([{ text: '1.4 Layanan tambahan yang disepakati:' }], 10);
      paragraph([{ text: '• ' }, { text: sanitize(contract.otherItems), bold: true }], 10, { indent: 5.6 });
    }
    paragraph([
      { text: '1.5 Segala perubahan layanan di luar yang tercantum dalam perjanjian ini harus disepakati oleh kedua belah pihak.' },
    ], 10);
  });

  // ── PASAL 2 ────────────────────────────────────────────────────────────
  sectionTitle('PASAL 2 — BIAYA DAN SISTEM PEMBAYARAN');
  renderCustomContent(contract.pasal2Content, () => {
    paragraph([{ text: '2.1 Total biaya jasa yang disepakati oleh kedua belah pihak adalah sebesar:' }], 10);
    paragraph([{ text: formatCurrency(project.totalCost), bold: true }], 13, { align: 'center', spaceAfter: 0.5 });
    paragraph([{ text: `(${terbilang(Number(project.totalCost) || 0)})`, italic: true }], 10, {
      align: 'center',
      spaceAfter: 3,
    });
    paragraph([{ text: '2.2 Sistem pembayaran dilakukan dengan ketentuan sebagai berikut:' }], 10);
    paragraph([{ text: 'a. Uang Muka (DP)', bold: true }], 10, { indent: 5.6, spaceAfter: 0.4 });
    paragraph([
      { text: 'Sebesar ' },
      { text: formatCurrency(project.amountPaid || 0), bold: true },
      { text: ' dibayarkan pada tanggal ' },
      { text: formatDateWithWeekday(contract.dpDate), bold: true },
      { text: '.' },
    ], 10, { indent: 5.6 });
    paragraph([{ text: 'b. Pelunasan', bold: true }], 10, { indent: 5.6, spaceAfter: 0.4 });
    paragraph([
      { text: 'Sisa pembayaran wajib dilunasi paling lambat pada tanggal ' },
      { text: formatDateWithWeekday(contract.finalPaymentDate), bold: true },
      { text: ' atau sebelum hari pelaksanaan acara.' },
    ], 10, { indent: 5.6 });
    paragraph([{ text: '2.3 Pembayaran dianggap sah setelah dana diterima oleh PIHAK PERTAMA.' }], 10);
  });

  // ── PASAL 3 ────────────────────────────────────────────────────────────
  sectionTitle('PASAL 3 — KETENTUAN PEMBATALAN');
  renderCustomContent(contract.pasal3Content, () => {
    const lines = (contract.cancellationPolicy || '').split('\n').filter((l) => l.trim());
    lines.forEach((line, idx) => {
      paragraph([{ text: `3.${idx + 1} ${sanitize(line)}` }], 10);
    });
    paragraph([
      {
        text: `3.${lines.length + 1} Apabila pembatalan dilakukan oleh PIHAK PERTAMA karena alasan yang tidak dapat dihindari, maka PIHAK PERTAMA wajib mengembalikan seluruh pembayaran yang telah diterima.`,
      },
    ], 10);
  });

  // ── PASAL 4 ────────────────────────────────────────────────────────────
  sectionTitle('PASAL 4 — KETENTUAN PELAKSANAAN PEKERJAAN');
  renderCustomContent(contract.pasal4Content, () => {
    paragraph([
      { text: '4.1 Waktu pelaksanaan dan penyelesaian rias/makeup disesuaikan dengan jadwal rangkaian acara yang disepakati (durasi layanan: ' },
      { text: sanitize(contract.deliveryTimeframe || 'Hari H'), bold: true },
      { text: ').' },
    ], 10);
    if (contract.personnelCount) {
      paragraph([
        { text: '4.2 Tim yang akan bertugas pada acara PIHAK KEDUA: ' },
        { text: sanitize(contract.personnelCount), bold: true },
        { text: '.' },
      ], 10);
    }
    paragraph([
      { text: '4.3 PIHAK PERTAMA berhak menggunakan sebagian dokumentasi foto/video hasil riasan sebagai portofolio atau media promosi, kecuali apabila PIHAK KEDUA menyatakan keberatan secara tertulis.' },
    ], 10);
  });

  // ── PASAL 5 ────────────────────────────────────────────────────────────
  sectionTitle('PASAL 5 — KETENTUAN UMUM');
  renderCustomContent(contract.pasal5Content, () => {
    paragraph([{ text: '5.1 Perjanjian ini berlaku sejak tanggal ditandatangani oleh kedua belah pihak.' }], 10);
    paragraph([{ text: '5.2 Segala hal yang belum diatur dalam perjanjian ini akan diselesaikan secara musyawarah dan mufakat.' }], 10);
    paragraph([
      { text: '5.3 Apabila terjadi perselisihan yang tidak dapat diselesaikan secara musyawarah, maka kedua belah pihak sepakat untuk menyelesaikannya melalui jalur hukum di wilayah ' },
      { text: sanitize(contract.jurisdiction || '-'), bold: true },
      { text: '.' },
    ], 10);
  });

  // ── Penutup ────────────────────────────────────────────────────────────
  ensure(3);
  stroke(COLORS.borderSoft);
  doc.setLineWidth(0.7);
  doc.line(CONTENT_LEFT, y, CONTENT_RIGHT, y);
  y += 5;

  const closingText =
    contract.closingText?.trim() ||
    'Demikian Surat Perjanjian Kerja Sama ini dibuat dengan sebenar-benarnya dalam keadaan sadar dan tanpa paksaan. Perjanjian ini dibuat dalam dua rangkap yang masing-masing mempunyai kekuatan hukum yang sama.';
  closingText
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .forEach((line) => {
      paragraph([{ text: line, italic: true }], 10, { align: 'center', spaceAfter: 2 });
    });

  // ── Tanda Tangan ───────────────────────────────────────────────────────
  const sigAreaH = 22.6;
  const sigBlockH = 8 + lineHeight(13, 1.3) + 6 + sigAreaH + 6 + lineHeight(11, 1.3) + 4;
  ensure(sigBlockH + 6);
  y += 6;

  setFont(13, 'bold');
  ink(COLORS.text);
  doc.text('TANDA TANGAN PARA PIHAK', CONTENT_LEFT + CONTENT_W / 2, y + 13 * PT_TO_MM, { align: 'center' });
  y += lineHeight(13, 1.3) + 6;

  const sigGap = 12;
  const sigColW = (CONTENT_W - sigGap) / 2;
  const sigBoxes: Array<{
    label: string;
    name: string;
    x: number;
    sig: { dataUrl: string; width: number; height: number } | null;
    showMeterai: boolean;
  }> = [
    {
      label: 'PIHAK PERTAMA',
      name: sanitize(profile.companyName || ''),
      x: CONTENT_LEFT,
      sig: vendorSigImg,
      showMeterai: shouldShowMeteraiVendor,
    },
    {
      label: 'PIHAK KEDUA',
      name: clientDisplay,
      x: CONTENT_LEFT + sigColW + sigGap,
      sig: clientSigImg,
      showMeterai: shouldShowMeteraiClient,
    },
  ];

  const rowTop = y;
  sigBoxes.forEach((box) => {
    const centerX = box.x + sigColW / 2;
    let cursor = rowTop;
    setFont(10, 'bold');
    ink(COLORS.label);
    doc.text(box.label, centerX, cursor + 10 * PT_TO_MM, { align: 'center' });
    cursor += lineHeight(10, 1.3) + 1;

    setFont(11, 'bold');
    ink(COLORS.text);
    const nameLines = wrap(box.name || '-', sigColW);
    nameLines.forEach((line) => {
      doc.text(line, centerX, cursor + 11 * PT_TO_MM, { align: 'center' });
      cursor += lineHeight(11, 1.3);
    });

    // Area tanda tangan (senantiasa tercakup di dalam satu halaman).
    const areaTop = rowTop + 8 + lineHeight(10, 1.3) + nameLines.length * lineHeight(11, 1.3) + 3;

    if (box.showMeterai && meterai) {
      const m = sigAreaH;
      try {
        doc.addImage(meterai.dataUrl, 'JPEG', centerX - m / 2, areaTop, m, m, undefined, 'FAST');
      } catch {
        // Abaikan bila stempel gagal dirender.
      }
    }
    if (box.sig) {
      const maxH = sigAreaH - 4;
      const maxW = Math.min(sigColW, 56.5);
      const ratio = box.sig.width / box.sig.height;
      let h = maxH;
      let w = h * ratio;
      if (w > maxW) {
        w = maxW;
        h = w / ratio;
      }
      try {
        doc.addImage(box.sig.dataUrl, 'PNG', centerX - w / 2, areaTop + (sigAreaH - h) / 2, w, h, undefined, 'FAST');
      } catch {
        // Abaikan bila tanda tangan gagal dirender.
      }
    } else if (!hideSignatures) {
      setFont(10, 'italic');
      ink(COLORS.muted);
      doc.text('Belum Ditandatangani', centerX, areaTop + sigAreaH / 2 + (10 * PT_TO_MM) / 2, {
        align: 'center',
      });
    }

    const lineY = areaTop + sigAreaH;
    stroke(SLATE_700);
    doc.setLineWidth(0.25);
    doc.line(box.x + 6, lineY, box.x + sigColW - 6, lineY);
    setFont(11, 'normal');
    ink(COLORS.text);
    doc.text(box.name || '-', centerX, lineY + 2 + 11 * PT_TO_MM, { align: 'center' });
  });

  return doc;
};

export const downloadContractPdf = async (input: ContractPdfInput): Promise<void> => {
  const doc = await buildContractPdf(input);
  doc.save(buildContractFileName(input.contract, !!input.hideSignatures));
};
