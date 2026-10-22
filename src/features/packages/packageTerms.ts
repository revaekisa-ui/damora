import { PackageTermItem } from '../../types';

export const DEFAULT_PACKAGE_TERMS: PackageTermItem[] = [
  {
    id: 'pt-booking',
    title: 'Ketentuan Pemesanan & Pembayaran DP',
    items: [
      'Booking paket dinyatakan sah setelah pembayaran Down Payment (DP) minimal 30%.',
      'Tanggal acara hanya akan di-lock setelah bukti transfer DP diverifikasi.',
      'Pelunasan total biaya paket dilakukan selambat-lambatnya H-7 sebelum hari pelaksanaan acara.',
      'Pembayaran hanya sah melalui rekening resmi vendor yang tertera di dokumen invoice.'
    ]
  },
  {
    id: 'pt-reschedule',
    title: 'Perubahan Jadwal & Penyesuaian Paket',
    items: [
      'Permintaan penyesuaian jadwal (reschedule) wajib disampaikan minimal H-30 sebelum hari acara.',
      'Perubahan tanggal tunduk pada ketersediaan jadwal tim vendor pada tanggal yang baru.',
      'Upgrade paket atau penambahan add-on dapat dilakukan kapan saja sebelum hari H.'
    ]
  },
  {
    id: 'pt-execution',
    title: 'Pelaksanaan & Penyerahan Hasil Layanan',
    items: [
      'Tim vendor akan tiba di lokasi acara selambat-lambatnya 2 jam sebelum rundown dimulai.',
      'Preview hasil layanan (teaser / highlight foto & video) dikirimkan maksimal H+7 acara.',
      'Seluruh hasil final (full album / Google Drive / video edit) diserahkan maksimal H+30 acara.'
    ]
  },
  {
    id: 'pt-cancellation',
    title: 'Pembatalan & Force Majeure',
    items: [
      'Pembatalan sepihak dari pihak klien menyebabkan DP hangus dan tidak dapat dikembalikan.',
      'Keadaan force majeure (bencana alam, huru-hara, regulasi darurat) diselesaikan secara musyawarah mufakat.'
    ]
  }
];

export const getPackageTerms = (terms?: PackageTermItem[], region?: string) => {
  const configuredTerms = terms && terms.length > 0 ? terms : DEFAULT_PACKAGE_TERMS;
  if (!configuredTerms.some(term => term.region)) return configuredTerms;

  const normalizedRegion = region?.trim().toLowerCase();
  return configuredTerms.filter(term =>
    !term.region || (!!normalizedRegion && term.region.trim().toLowerCase() === normalizedRegion),
  );
};
