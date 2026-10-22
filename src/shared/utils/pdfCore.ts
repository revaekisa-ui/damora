import { jsPDF } from 'jspdf';
import sansRegularUrl from 'pdfjs-dist/standard_fonts/LiberationSans-Regular.ttf?url';
import sansBoldUrl from 'pdfjs-dist/standard_fonts/LiberationSans-Bold.ttf?url';
import sansItalicUrl from 'pdfjs-dist/standard_fonts/LiberationSans-Italic.ttf?url';
import sansBoldItalicUrl from 'pdfjs-dist/standard_fonts/LiberationSans-BoldItalic.ttf?url';

/**
 * Utilitas inti untuk renderer PDF berbasis teks/vector (jsPDF).
 *
 * Modul ini tidak menyentuh tampilan aplikasi. Ia hanya menyediakan konstanta
 * layout A4, palet warna, format data Indonesia, pemuat gambar beresolusi
 * penuh, dan helper menggambar yang dipakai bersama oleh seluruh renderer
 * dokumen (Invoice, Slip Pembayaran/Gaji, Tanda Terima, Kontrak Kerja).
 */

export type RGB = [number, number, number];

export const PAGE_W = 210; // A4 portrait (mm)
export const PAGE_H = 297;
export const MARGIN_X = 8;
export const MARGIN_TOP = 6;
export const MARGIN_BOTTOM = 6;
export const CONTENT_LEFT = MARGIN_X;
export const CONTENT_RIGHT = PAGE_W - MARGIN_X;
export const CONTENT_W = CONTENT_RIGHT - CONTENT_LEFT;
export const CONTENT_BOTTOM = PAGE_H - MARGIN_BOTTOM;

export const PT_TO_MM = 0.352778;
export const lineHeight = (sizePt: number, factor = 1.3): number => sizePt * PT_TO_MM * factor;

export const COLORS = {
  text: [15, 23, 42] as RGB, // slate-900
  textSoft: [71, 85, 105] as RGB, // slate-600
  muted: [148, 163, 184] as RGB, // slate-400
  label: [100, 116, 139] as RGB, // slate-500
  border: [203, 213, 225] as RGB, // slate-300
  borderSoft: [226, 232, 240] as RGB, // slate-200
  panel: [248, 250, 252] as RGB, // slate-50
  headBg: [241, 245, 249] as RGB, // slate-100
  badge: [226, 232, 240] as RGB, // slate-200
  black: [0, 0, 0] as RGB,
  white: [255, 255, 255] as RGB,
  green: [22, 163, 74] as RGB,
  red: [220, 38, 38] as RGB,
  orange: [234, 88, 12] as RGB,
  blue: [37, 99, 235] as RGB,
};

export const DEFAULT_ACCENT: RGB = [93, 135, 255]; // --color-accent fallback (#5d87ff)

export const hexToRgb = (hex?: string): RGB | null => {
  if (!hex) return null;
  const normalized = hex.trim().replace('#', '');
  if (!/^[0-9a-f]{6}$/i.test(normalized)) return null;
  return [
    parseInt(normalized.slice(0, 2), 16),
    parseInt(normalized.slice(2, 4), 16),
    parseInt(normalized.slice(4, 6), 16),
  ];
};

export const mixWithWhite = (color: RGB, amount: number): RGB => {
  const ratio = Math.min(Math.max(amount, 0), 1);
  return [
    Math.round(color[0] + (255 - color[0]) * ratio),
    Math.round(color[1] + (255 - color[1]) * ratio),
    Math.round(color[2] + (255 - color[2]) * ratio),
  ];
};

export const sanitize = (value?: string | number | null): string =>
  String(value ?? '').replace(/\u00A0/g, ' ');

export const formatCurrency = (amount?: number): string =>
  `Rp ${new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(
    Math.round(Number(amount) || 0),
  )}`;

export const formatDate = (dateString?: string): string => {
  if (!dateString) return 'Tanpa Tanggal';
  try {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
};

export const formatDateWithWeekday = (dateString?: string): string => {
  if (!dateString) return '[Tanggal belum diisi]';
  try {
    return new Date(dateString).toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
};

const loadHtmlImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    if (!src.startsWith('data:')) img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Gagal memuat gambar'));
    img.src = src;
  });

/**
 * Normalisasi gambar apa pun (base64 data URL atau URL biasa) menjadi PNG data
 * URL tanpa kehilangan resolusi aslinya, sehingga logo, stempel, dan tanda
 * tangan tetap tajam di dalam PDF.
 */
export const loadImageAsset = async (
  src?: string,
  options?: { grayscale?: boolean },
): Promise<{ dataUrl: string; width: number; height: number } | null> => {
  if (!src) return null;
  try {
    const img = await loadHtmlImage(src);
    if (!img.naturalWidth || !img.naturalHeight) return null;
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    if (options?.grayscale) ctx.filter = 'grayscale(1)';
    ctx.drawImage(img, 0, 0);
    return {
      dataUrl: canvas.toDataURL('image/png'),
      width: img.naturalWidth,
      height: img.naturalHeight,
    };
  } catch {
    return null;
  }
};

export const createPdfDoc = (orientation: 'portrait' | 'landscape' = 'portrait'): jsPDF =>
  new jsPDF({ unit: 'mm', format: 'a4', orientation, compress: true });

/**
 * Family font yang di-embed ke dalam PDF.
 *
 * Font standar bawaan PDF (Helvetica) TIDAK disertakan di dalam file, sehingga
 * viewer di HP (Android/iOS) menggantinya dengan font sistem miliknya sendiri.
 * Penggantian itu membuat teks kecil tampak tidak tajam saat diperbesar. Dengan
 * meng-embed font ini (metrik identik dengan Helvetica/Arial) setiap viewer
 * merender teks dari outline asli sehingga tetap tajam dan konsisten.
 */
export const PDF_FONT_FAMILY = 'VenaSans';

export type PdfFontStyle = 'normal' | 'bold' | 'italic' | 'bolditalic';

interface EmbeddedFont {
  style: PdfFontStyle;
  file: string;
  url: string;
}

const EMBEDDED_FONTS: EmbeddedFont[] = [
  { style: 'normal', file: 'LiberationSans-Regular.ttf', url: sansRegularUrl },
  { style: 'bold', file: 'LiberationSans-Bold.ttf', url: sansBoldUrl },
  { style: 'italic', file: 'LiberationSans-Italic.ttf', url: sansItalicUrl },
  { style: 'bolditalic', file: 'LiberationSans-BoldItalic.ttf', url: sansBoldItalicUrl },
];

const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
};

let fontPayloadPromise: Promise<Record<string, string>> | null = null;

const loadFontPayload = (): Promise<Record<string, string>> => {
  if (!fontPayloadPromise) {
    fontPayloadPromise = (async () => {
      const entries = await Promise.all(
        EMBEDDED_FONTS.map(async ({ style, url }) => {
          const res = await fetch(url);
          if (!res.ok) throw new Error(`Gagal memuat berkas font (${res.status}).`);
          const buffer = await res.arrayBuffer();
          return [style, arrayBufferToBase64(buffer)] as const;
        }),
      );
      return Object.fromEntries(entries) as Record<string, string>;
    })().catch((err) => {
      fontPayloadPromise = null;
      throw err;
    });
  }
  return fontPayloadPromise;
};

const embeddedDocs = new WeakSet<jsPDF>();

/**
 * Mendaftarkan font ter-embed ke satu instance dokumen jsPDF.
 * Harus dipanggil tepat setelah `createPdfDoc()` dan sebelum menulis teks apa pun
 * agar seluruh teks pada PDF memakai font yang tertanam (tajam di semua viewer).
 */
export const embedPdfFonts = async (doc: jsPDF): Promise<void> => {
  if (embeddedDocs.has(doc)) return;
  try {
    const payload = await loadFontPayload();
    for (const { style, file } of EMBEDDED_FONTS) {
      const base64 = payload[style];
      if (!base64) continue;
      doc.addFileToVFS(file, base64);
      doc.addFont(file, PDF_FONT_FAMILY, style);
    }
    embeddedDocs.add(doc);
  } catch (err) {
    // Font tetap bisa dibuat memakai standar PDF bila berkas gagal dimuat,
    // sehingga proses ekspor tidak pernah gagal total.
    console.warn('[pdfCore] Gagal meng-embed font, memakai font standar:', err);
  }
};

export type TextAlign = 'left' | 'center' | 'right';

export interface PdfTools {
  doc: jsPDF;
  fill: (color: RGB) => void;
  stroke: (color: RGB) => void;
  ink: (color: RGB) => void;
  setFont: (size: number, style?: PdfFontStyle) => void;
  /** Menulis beberapa baris teks; `yTop` = tepi atas blok teks. Mengembalikan kursor Y baru. */
  writeLines: (
    lines: string[],
    x: number,
    yTop: number,
    size: number,
    style?: PdfFontStyle,
    color?: RGB,
    align?: TextAlign,
    factor?: number,
  ) => number;
  wrap: (text: string, maxWidth: number) => string[];
}

export const createPdfTools = (doc: jsPDF): PdfTools => {
  const fill = (color: RGB) => doc.setFillColor(color[0], color[1], color[2]);
  const stroke = (color: RGB) => doc.setDrawColor(color[0], color[1], color[2]);
  const ink = (color: RGB) => doc.setTextColor(color[0], color[1], color[2]);

  const setFont = (size: number, style: PdfFontStyle = 'normal') => {
    doc.setFont(PDF_FONT_FAMILY, style);
    doc.setFontSize(size);
  };

  const writeLines = (
    lines: string[],
    x: number,
    yTop: number,
    size: number,
    style: PdfFontStyle = 'normal',
    color: RGB = COLORS.text,
    align: TextAlign = 'left',
    factor = 1.3,
  ): number => {
    setFont(size, style);
    ink(color);
    const lh = lineHeight(size, factor);
    let cursor = yTop;
    lines.forEach((line) => {
      doc.text(sanitize(line), x, cursor + size * PT_TO_MM, { align });
      cursor += lh;
    });
    return cursor;
  };

  const wrap = (text: string, maxWidth: number): string[] =>
    sanitize(text)
      .split('\n')
      .flatMap((line) => doc.splitTextToSize(line || ' ', maxWidth));

  return { doc, fill, stroke, ink, setFont, writeLines, wrap };
};
