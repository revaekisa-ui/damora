# STANDAR DESIGN SYSTEM & UI/UX DOKUMENTASI (ACTUAL SYSTEM)

> **Catatan Dokumen**: Dokumen ini disusun berdasarkan audit repository aktual aplikasi manajemen vendor pernikahan (wedding organizer / vendor fotografi & videografi). Tidak ada rekayasa atau spekulasi; seluruh variabel CSS, token warna, tipografi, komponen, hierarki, pola responsif (desktop, tablet, mobile), serta arsitektur antarmuka diturunkan langsung dari kode sumber (`src/index.css`, `tailwind.config.js`, komponen-komponen antarmuka `src/components/`, `src/shared/ui/`, `src/features/`, dan `src/layouts/`).
>
> Dokumen ini memprioritaskan prinsip **MOBILE-FIRST** agar menjadi pedoman standar bagi perancangan ulang UI/UX pada Google Stitch maupun implementasi kode berikutnya.

---

## 1. Filosofi & Prinsip Desain Mobile-First

1. **Mobile-First Priority**: Seluruh alur kerja dan antarmuka dirancang dengan asumsi perangkat layar sentuh bergerak (viewport 360px - 428px) sebagai titik awal utama, kemudian beradaptasi secara elegan ke ukuran tablet (768px - 1024px) dan desktop (>= 1025px).
2. **Ergonomi Sentuh (Touch Targets)**:
   - Target sentuh minimum adalah **44px x 44px** untuk seluruh tombol interaktif primer, ikon aksi, navigasi bawah (bottom navbar), dan kontrol form di ponsel.
   - Penempatan navigasi utama berada di zona jempol bawah (**Bottom Navigation Bar** setinggi 64px dengan safe area) saat diakses melalui smartphone.
3. **Data Density & Card Morphing**:
   - Pola tabel data desktop diubah menjadi kartu informasi adaptif (**Mobile Table Cards**) di ponsel dengan badge status yang jelas, progress bar ringkas, serta tombol aksi yang dapat dijangkau satu tangan.
4. **Pencegahan Zoom Tak Sengaja**:
   - Seluruh elemen `input`, `select`, dan `textarea` menggunakan ukuran font minimum **16px** pada perangkat mobile (via utility `text-base sm:text-sm`) untuk mencegah auto-zoom pada peramban iOS Safari / Android Chrome.
5. **Aksen Visual Modern & Bersih (Modernize / Light Palette)**:
   - Palet warna mengadopsi nuansa Modernize clean: dominan putih (`#FFFFFF`) dan permukaan abu lembut (`#F4F6F9`) dengan aksen biru korporat profesional (`#5D87FF` / `var(--color-accent)`), teks kontras tinggi (`#2A3547`), serta indikator status semantik yang kaya makna.

---

## 2. Tipografi (Typography)

Sistem tipografi aplikasi berbasis font sans-serif modern standar sistem dengan falling back yang rapi:

### 2.1 Font Family
- **Primary / Body & Display**: `Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`
- **Monospace / Angka Format Dokumen & Nomor Rekening**: `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`

### 2.2 Skala Ukuran Font (Font Size Scale) & Penggunaan

| Ukuran Kelas | Ukuran Pixel | Line Height | Penggunaan Aktual pada Aplikasi |
| :--- | :--- | :--- | :--- |
| `text-[9px]` / `text-[10px]` | 9px - 10px | 1.2 - 1.4 | Label stat mikro, kategori huruf kapital (`uppercase tracking-widest`), timestamp memo |
| `text-[11px]` / `text-xs` | 11px - 12px | 1.4 - 1.5 | Badge status, bantuan form (helper text), info metadata tanggal, caption tabel |
| `text-sm` | 14px | 1.5 | Teks isi standar (desktop body), input form (desktop), rincian transaksi & checklist |
| `text-base` | 16px | 1.5 - 1.6 | Teks isi standar mobile (mencegah auto-zoom form), subjudul modal, nama pengantin pada card |
| `text-lg` | 18px | 1.4 | Judul seksi kartu ringkasan, angka nominal pada kartu statistik mobile, header drawer |
| `text-xl` | 20px | 1.3 | Judul modal utama, judul halaman mobile, ringkasan saldo kas |
| `text-2xl` | 24px | 1.25 | Judul besar halaman desktop, total nilai kontrak, total honor bersih slip gaji |
| `text-3xl` | 30px | 1.2 | Header dokumen PDF (Slip Gaji / Invoice resmi / Laporan Kas) |

### 2.3 Bobot Font (Font Weight)
- `font-normal` (400): Teks deskripsi panjang, catatan rapat, syarat & ketentuan kontrak.
- `font-medium` (500): Teks isian tabel, label form sekunder, placeholder input.
- `font-semibold` (600): Subjudul kartu, item navigasi aktif, peran tim, nomor invoice.
- `font-bold` (700): Judul halaman, nominal mata uang penting, judul modal, nama pengantin.
- `font-black` (900): Kategori label kapital mikro (`tracking-widest`), judul dokumen cetak slip gaji.

---

## 3. Sistem Warna (Color Palette & Variables)

Warna aplikasi didefinisikan melalui CSS Custom Properties (`:root`) pada `src/index.css` serta dipadukan dengan utility Tailwind CSS:

### 3.1 Token Warna Inti (`:root`)

```css
:root {
  --color-accent: #5d87ff;        /* Biru Aksen Primer (Primary Accent) */
  --color-accent-hover: #4570ea;  /* Biru Hover / Active State */
  --color-bg: #f4f6f9;            /* Background Aplikasi (Warm Neutral Light) */
  --color-surface: #ffffff;       /* Surface / Kontainer Kartu / Modal */
  --color-border: #eaeff4;        /* Border Standar Kartu & Tabel */
  --color-text-primary: #2a3547;  /* Teks Utama / Judul Kontras Tinggi */
  --color-text-secondary: #5a6a85;/* Teks Sekunder / Label Keterangan */
  --color-text-light: #2a3547;    /* Teks Terang Permukaan */
  --color-input-bg: #ffffff;      /* Background Input Form */
  --color-input-border: #dfe5ef;  /* Border Input Form */
}
```

### 3.2 Warna Semantik & Status Bisnis

| Status / Domain | Kode HEX Primer | Background Tint (Badge/Pill) | Border Tint | Penggunaan Fungsional |
| :--- | :--- | :--- | :--- | :--- |
| **Primary (Aksen)** | `#5D87FF` | `#ECF2FF` | `rgba(93,135,255,0.2)` | Tombol utama, item aktif, link navigasi, ikon fokus |
| **Success (Sukses/Lunas)** | `#13DEB9` / `#10B981` | `#E6FFFA` / `#DCFCE7` | `rgba(19,222,185,0.2)` | Status "Lunas", "Selesai", konfirmasi simpan, lead converted |
| **Warning (Perhatian/DP)** | `#FFAE1F` / `#F59E0B` | `#FEF5E5` / `#FEF3C7` | `rgba(255,174,31,0.2)` | Status "DP Terbayar", "Follow Up", batas waktu mendekat |
| **Danger (Bahaya/Belum Bayar)** | `#FA896B` / `#EF4444` | `#FDEDE8` / `#FEE2E2` | `rgba(250,137,107,0.2)` | Status "Belum Bayar", "Ditolak", "Batal", aksi Hapus data |
| **Info / Diskusi** | `#49BEFF` / `#3B82F6` | `#E8F7FF` / `#EFF6FF` | `rgba(73,190,255,0.2)` | Status "Diskusi", status baru masuk, tooltip bantuan |
| **Ungu (Vendor/Mitra)** | `#8B5CF6` / `#7352FF` | `#F3F0FF` | `rgba(139,92,246,0.2)` | Kategori mitra vendor eksternal, tab vendor, honor freelance |
| **WhatsApp Emerald** | `#25D366` | `#DCFCE7` | `#86EFAC` | Tombol kontak WhatsApp instan (chat pengantin / tim) |

### 3.3 Status Alur Acara Pernikahan (Project Status Colors)
- **Draft / Inisiasi**: `#94A3B8` (Background `#F1F5F9`)
- **Booking Confirmed**: `#5D87FF` (Background `#ECF2FF`)
- **Technical Meeting / Persiapan**: `#FFAE1F` (Background `#FEF5E5`)
- **Ready for Wedding Day**: `#8B5CF6` (Background `#F3F0FF`)
- **Wedding Day Execution**: `#49BEFF` (Background `#E8F7FF`)
- **Post-Production / Editing**: `#F97316` (Background `#FFEDD5`)
- **Completed (Selesai)**: `#13DEB9` (Background `#E6FFFA`)
- **Cancelled (Batal)**: `#FA896B` (Background `#FDEDE8`)

---

## 4. Spasi, Layout & Grid (Spacing, Layout & Grid)

### 4.1 Skala Spasi (Spacing Scale)
- **xs (`0.5rem` / 8px)**: Jarak antar ikon dan teks ringkas, padding chip/tag internal.
- **sm (`0.75rem` / 12px)**: Jarak antar input field form kompak, margin badge, padding tombol kecil.
- **md (`1rem` / 16px)**: Padding standar kontainer kartu mobile, gap antar kartu informasi.
- **lg (`1.5rem` / 24px)**: Padding kartu tablet/desktop, jarak antar seksi konten utama.
- **xl (`2rem` / 32px)**: Margin atas header halaman desktop, padding modal besar.

### 4.2 Struktur Layout Antarmuka

1. **Mobile Layout (< 768px)**:
   - **Header Mobile**: Tinggi 56px - 60px, posisi `sticky top-0 z-30`, memuat logo ringkas, indikator sinkronisasi, dan tombol profil/notifikasi.
   - **Main Content**: Padding horizontal `p-3.5` hingga `p-4`, padding bawah `pb-24` (agar konten paling bawah tidak tertutup oleh bottom navigation bar).
   - **Bottom Navigation Bar**: Tinggi 64px, posisi `fixed bottom-0 left-0 right-0 z-40`, background `#FFFFFF` dengan efek blur `backdrop-blur-md`, border atas `#EAEFF4`.
   - **Floating Action Button (FAB)**: Posisi `fixed bottom-20 right-4 z-30` berdiameter 48px - 52px dengan shadow bulat untuk aksi instan "Tambah Acara" / "Tambah Transaksi".

2. **Tablet & Desktop Layout (>= 768px - 1024px+)**:
   - **Sidebar Desktop**: Lebar 260px (expand) atau 80px (collapse), posisi `fixed left-0 top-0 bottom-0 z-40`, background putih bersih, pembagian grup menu vertikal.
   - **Top Header**: Tinggi 70px, posisi `sticky top-0 z-30`, breadcrumb lokasi rute, search universal, saldo kas cepat, tombol buat baru global, dan avatar pengguna.
   - **Content Canvas**: Lebar responsif maksimal `max-w-7xl mx-auto p-6 md:p-8`, padding bawah standar `pb-10`.

---

## 5. Sudut & Border (Radius, Border & Elevation)

### 5.1 Border Radius
- **Tombol & Input (`rounded-xl` / 12px)**: Standar untuk seluruh tombol (`button-primary`, `button-secondary`), field input, select, dan filter chip.
- **Kartu Konten (`rounded-2xl` / 16px)**: Standar untuk seluruh kartu widget, tabel desktop wrapper, mobile table cards, dan popup menu.
- **Modal & Drawer (`rounded-2xl` / 16px - 20px pada desktop, `rounded-t-3xl` / 24px pada mobile bottom sheet)**: Memberikan kesan ramah sentuh dan modern.
- **Badge & Pill (`rounded-full` / 9999px)**: Standar untuk status pill, avatar profil bulat, tombol aksi bulat kecil.

### 5.2 Border & Garis Pembatas
- Standar ketebalan border: `1px solid #EAEFF4` (`border-brand-border`).
- Garis pembatas daftar item (divider): `divide-y divide-[#EAEFF4]`.
- Garis aksen kiri pada kartu kalender/event: `border-l-4` menggunakan warna kategori acara dinamis.

### 5.3 Bayangan (Shadows & Elevation)
- **Kartu Normal (`shadow-[0_9px_17.5px_rgba(0,0,0,0.05)]`)**: Bayangan halus khas Modernize, memberi kesan kartu mengambang tanpa kontras tajam.
- **Hover Card (`hover:shadow-[0_12px_24px_rgba(0,0,0,0.08)]`)**: Pengangkatan halus saat kursor melintas pada desktop.
- **Tombol Aksen (`shadow-[0_4px_12px_rgba(93,135,255,0.25)]`)**: Pendaran halus biru aksen untuk menarik perhatian mata (*call-to-action*).
- **Modal Dialog & Dropdown (`shadow-2xl` / `shadow-[0_20px_50px_rgba(0,0,0,0.15)]`)**: Lapisan elevasi tertinggi untuk fokus konteks.

---

## 6. Komponen Antarmuka Standar (UI Components)

### 6.1 Tombol (Buttons)

1. **Button Primary (`.button-primary`)**:
   - Styling: Background `#5D87FF`, warna teks `#FFFFFF`, font bobot `font-bold` (700), radius `rounded-xl`, padding mobile `py-2.5 px-4 text-xs sm:text-sm`, shadow biru `shadow-[0_4px_12px_rgba(93,135,255,0.25)]`.
   - Hover & Active: Background `#4871E3`, `active:scale-[0.98]`.
   - Penggunaan: Simpan Form, Tambah Data Baru, Unduh Dokumen, Bayar Honor.

2. **Button Secondary (`.button-secondary`)**:
   - Styling: Background `#FFFFFF` atau `#F4F6F9`, border `1px solid #EAEFF4`, warna teks `#2A3547`, radius `rounded-xl`, padding `py-2.5 px-4`.
   - Hover & Active: Background `#ECF2FF`, border `#5D87FF`, teks `#5D87FF`.
   - Penggunaan: Batal, Tutup Modal, Reset Filter, Kembali.

3. **Button Danger (`.button-danger`)**:
   - Styling: Background `#FDEDE8`, border `1px solid rgba(250,137,107,0.3)`, warna teks `#FA896B`, hover background `#FA896B` hover teks `#FFFFFF`.
   - Penggunaan: Hapus Acara, Hapus Pengantin, Hapus Transaksi.

4. **Action Icon Buttons**:
   - Dimensi: Kotak `w-8 h-8` atau `w-9 h-9` dengan radius `rounded-xl` fleksibel untuk mobile card actions.
   - Variasi warna aksi:
     - Lihat / Detail: Background `#ECF2FF`, teks `#5D87FF`.
     - Edit: Background `#FEF5E5`, teks `#FFAE1F`.
     - Hapus: Background `#FDEDE8`, teks `#FA896B`.
     - WhatsApp: Background `#13DEB9`, teks `#FFFFFF`.

### 6.2 Formulir Input & Kontrol (Inputs, Selects & Textareas)

1. **Input Standar (`.input-field`)**:
   - Styling: Background `#FFFFFF`, border `1px solid #EAEFF4` (focus border `#5D87FF`), teks `#2A3547`, radius `rounded-xl`, padding vertikal `p-2.5`, ukuran font minimal 16px di mobile untuk mencegah zoom browser.
   - Placeholder: Warna `#5A6A85` dengan opacity 70%.

2. **Input Rupiah (`RupiahInput`)**:
   - Input khusus untuk input nominal mata uang rupiah. Otomatis memformat pemisah ribuan titik (`Rp 25.000.000`) dan memvalidasi tipe angka murni tanpa desimal negatif.

3. **Input Group Floating Label (`.input-group`)**:
   - Pola floating label dengan posisi absolut transisi saat input terisi atau terfokus, menjaga antarmuka formulir tetap ringkas dan elegan.

4. **Pilihan Dropdown (`<select>`)**:
   - Styling terpadu dengan arrow chevron kustom, padding kanan ekstra `pr-8`, background putih dengan opsi yang terbaca kontras tinggi.

5. **Search Input Bar (`<input type="search">`)**:
   - Dilengkapi ikon kaca pembesar di sisi kiri, tombol clear "X" bawaan, background `#F4F6F9` yang berubah menjadi `#FFFFFF` saat aktif, placeholder komunikatif (misal: *"Cari acara pernikahan (nama, pengantin, lokasi)..."*).

### 6.3 Kartu & Kontainer (Cards)

1. **Standard White Card**:
   - `bg-white p-4 sm:p-5 md:p-6 rounded-2xl border border-[#EAEFF4] shadow-[0_9px_17.5px_rgba(0,0,0,0.05)]`.
2. **Stat Metric Card (`ModernStatCard`)**:
   - Menampilkan angka metrik besar (`text-xl` sampai `text-2xl font-bold text-[#2A3547]`), label kecil (`text-xs text-[#5A6A85]`), ikon dengan latar belakang bulat tint warna relevan di sisi kanan atas, serta indikator tren persentase atau perbandingan periode sebelumnya.
3. **Mobile Table Card (`.mobile-table-card` / `ProjectCard`)**:
   - Kartu khusus pengganti baris tabel di layar smartphone.
   - Struktur anatomi kartu:
     - **Header**: Nama acara / item utama + badge status + penanda prioritas (⭐ VIP).
     - **Metadata Bar**: Baris ikon tanggal, lokasi gedung, serta waktu hitung mundur (countdown misal: *"3 hari lagi"*).
     - **Progress Bar Segment**: Progress bar tebal 8px dengan persentase di sisi kanan dan dropdown ganti status cepat instan.
     - **Footer Quick Actions**: Grid tombol 3 kolom (WhatsApp pengantin, Edit cepat, dan Buka Detail lengkap).

### 6.4 Tabel Data Desktop (Desktop Tables)

- Kontainer: Wrapper horizontal scrollable `overflow-x-auto w-full` tersembunyi pada mobile (`hidden md:block`).
- Header (`<thead>`): Warna teks `#5A6A85` huruf kapital (`uppercase tracking-wider`), background `#F4F6F9/80`, border bawah `#EAEFF4`, padding sel `px-4 py-3.5 font-bold text-xs`.
- Baris Data (`<tbody>`): Divider halus `#EAEFF4`, efek zebra/hover `hover:bg-[#F4F6F9]/50 transition-colors`, teks nama tebal `#2A3547`, teks sekunder `#5A6A85`.
- Kolom Aksi Kanan: Rata tengah (`text-center`) dengan tombol ikon ringkas 32px.

### 6.5 Modal & Bottom Sheet (Modals & Drawers)

1. **Desktop Modal**:
   - Dialog terpusat di tengah layar (`fixed inset-0 z-50 flex items-center justify-center p-4`).
   - Backdrop semi-transparan hitam lembut `bg-black/50 backdrop-blur-xs`.
   - Ukuran fleksibel sesuai kebutuhan: `max-w-md` (konfirmasi/hapus), `max-w-2xl` (formulir standar), `max-w-4xl` atau `max-w-5xl` (detail acara lengkap, preview PDF slip gaji / invoice).
   - Header modal memiliki judul tebal dan tombol tutup silang (`X`) di sudut kanan atas.
   - Scroll internal: Area badan modal dapat di-scroll vertikal (`max-h-[80vh] overflow-y-auto custom-scrollbar`) dengan footer tombol aksi sticky di bagian bawah.

2. **Mobile Bottom Sheet Pattern**:
   - Pada layar smartphone, modal bertransformasi menjadi lembar aksi dari bawah (*bottom drawer*), menempel pada dasar layar dengan sudut melengkung atas `rounded-t-3xl`, safe area bawah terlindungi, serta mudah ditutup dengan swipe atau tombol tutup jempol.

### 6.6 Navigasi Tab (Tabs Navigation)

- **Segmented Control Tabs**:
  - Kontainer pill luar: Background `#F4F6F9`, border `#EAEFF4`, padding `p-1`, radius `rounded-xl`.
  - Tombol Tab:
    - Tab Aktif: Background `#5D87FF` (atau `#FFFFFF` pada tab sub-view), teks putih (atau biru aksen), shadow halus `shadow-xs`, font bobot `font-bold`.
    - Tab Inaktif: Teks `#5A6A85`, hover teks `#2A3547`, transisi halus.
  - Teks tab memuat label + badge jumlah dalam kurung, misal: `Aktif (12)`, `Selesai (45)`, `Semua (57)`.
  - Di mobile: Tab dapat digeser horizontal (*scrollable tabs*) tanpa membungkus teks menjadi 2 baris.

### 6.7 Badge & Status Pills

- Bentuk kapsul penuh (`rounded-full py-0.5 px-2.5 text-[11px] font-bold inline-flex items-center gap-1.5`).
- Titik status (Status Dot): Lingkaran kecil berdiameter 6px di sisi kiri label teks badge.
- Teks badge dilarang patah baris (*no text wrap / whitespace-nowrap*).

### 6.8 Notifikasi & Toast (Toast System)

- Komponen: Banner toast mengambang di kanan atas desktop / tengah atas mobile (`fixed top-4 right-4 sm:right-6 z-50`).
- Background: Hijau emerald (sukses), merah pastel (gagal/error), atau biru aksen (info).
- Animasi: Masuk meluncur halus dari atas (*slide-down fade-in*) dan menghilang otomatis setelah 3-4 detik atau melalui tombol tutup instan.

### 6.9 Status Kosong, Loading & Error (States)

1. **Loading State (Skeleton & Spinner)**:
   - Spinner: Lingkaran animasi `animate-spin border-3 border-[#5D87FF] border-t-transparent rounded-full w-8 h-8`.
   - Skeleton Card: Elemen placeholder abu-abu berkedip halus `animate-pulse bg-[#EAEFF4] rounded-xl` untuk kalender dan daftar kartu sebelum data siap.
2. **Empty State (Data Kosong)**:
   - Ilustrasi atau ikon domain berskala 48px dalam lingkaran `#F4F6F9`.
   - Judul singkat tebal (misal: *"Belum Ada Acara Pernikahan"*).
   - Teks instruksi ramah (misal: *"Mulai dengan menambahkan pengantin baru atau klik tombol Tambah Acara di bawah."*).
   - Tombol Call-to-Action utama yang langsung membuka formulir pembuatan data.
3. **Error State**:
   - Banner merah halus dengan ikon peringatan bulat, menampilkan pesan kesalahan manusiawi dan tombol aksi *"Coba Lagi"* tanpa merusak layout keseluruhan aplikasi.

---

## 7. Pola Khusus Slip Gaji / Payroll & Dokumen Cetak

Aplikasi memiliki mesin dokumen resmi berpresisi tinggi (Slip Gaji Tim / Invoice Pengantin / Kwitansi):

1. **Tampilan Pratinjau (PDF Preview & Canvas)**:
   - Dimensi kertas standar: A4 lebar kanvas digital 800px.
   - Header Dokumen: Garis aksen biru tebal 8px di bagian paling atas, memuat logo vendor resmi (atau inisial bisnis), rincian kontak alamat perusahaan, serta judul dokumen tebal kapital: `SLIP GAJI` lengkap dengan nomor seri otomatis (misal: `#SLIP-2026-0042`).
   - Kartu Dua Kolom: Info penerima (nama anggota tim/vendor, peran, nama bank, dan nomor rekening) bersanding dengan info perusahaan sumber dana.
   - Tabel Rincian Tugas & Honor: Nomor urut, nama acara pernikahan, peran tugas spesifik, ID sesi pengerjaan, dan jumlah fee bersih dalam Rupiah.
   - Area Tanda Tangan & Verifikator: Blok tanda tangan digital verifikator bergaris bawah dengan nama terang dan stempel digital bisnis.
2. **Adaptasi Mobile untuk Dokumen**:
   - Di smartphone, dokumen 800px dirender di canvas `PDFViewer` interaktif dengan mode fit-width, pinch-to-zoom, serta tombol aksi cepat *"Bubuhkan Tanda Tangan"* dan *"Unduh PDF"* yang menempel rapi di bottom modal.

---

## 8. Panduan Breakpoint & Responsivitas

| Breakpoint | Ukuran Layar | Target Perangkat | Perubahan Layout Utama |
| :--- | :--- | :--- | :--- |
| **Mobile (Default)** | `< 768px` | iPhone SE, iPhone 14/15, Samsung Galaxy, Pixel | Single-column, Bottom Nav Bar, FAB aktif, Table berganti ke Card, Input 16px, Filter vertikal stack. |
| **Tablet (`md`)** | `768px - 1023px` | iPad Mini, iPad Air, Android Tablet | Sidebar collapse/drawer, 2 kolom bento stat card, tabel desktop mulai aktif dengan horizontal scroll, modal dialog di tengah. |
| **Desktop (`lg` - `xl`)** | `>= 1024px` | MacBook, Laptop, Monitor Desktop | Full Sidebar 260px, 4 kolom kartu statistik, tabel lengkap 7 kolom, drawer detail side-by-side pada kalender. |
| **Ultra-wide (`2xl`)** | `>= 1536px` | Monitor Luas 2K / 4K | Kontainer terpusat `max-w-7xl mx-auto` untuk menjaga proporsi baca tanpa perenggangan liar. |

---

## 9. Aturan Kepatuhan & Checklist Implementasi

- [x] **Zero Zoom Issue**: Pastikan tidak ada input teks atau dropdown dengan font di bawah 16px saat dirender di viewport ponsel.
- [x] **No Text Truncation Defect**: Label tombol, chip status, dan pill navigasi harus selalu satu baris (`whitespace-nowrap`).
- [x] **Safe Area Aware**: Konten mobile selalu menyisakan padding bawah minimal 80px - 96px (`pb-24`) agar tidak tertabrak oleh Bottom Nav Bar.
- [x] **Single-Source Colors**: Selalu gunakan CSS variables (`var(--color-accent)`) atau token palette `#5D87FF`, `#2A3547`, `#5A6A85`, `#EAEFF4`, `#F4F6F9` agar tampilan selaras 100%.
