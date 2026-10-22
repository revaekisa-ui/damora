# Laporan Pengantin & Business Intelligence Dashboard

Transformasi komprehensif halaman **Laporan Pengantin** (`/client-reports`) dari sekadar pelacak klien sederhana menjadi pusat intelijen bisnis terpadu dengan 4 tab analisis modular (Pengantin, Leads, Keuangan, Paket), penyaring periode dinamis, dan kalkulasi akurat berdasarkan data riil proyek, transaksi, calon pengantin, dan paket layanan.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> Berdasarkan jawaban klarifikasi yang telah Anda tentukan, berikut adalah keputusan arsitektur dan fungsional yang telah disepakati:

- **Confirmed Decision 1 (Struktur Navigasi)**: Dashboard terpadu multi-tab yang membagi data ke dalam 4 pilar bisnis utama: **Pengantin**, **Leads (Calon Pengantin)**, **Keuangan**, dan **Paket**.
- **Confirmed Decision 2 (Filter Periode Dinamis)**: Filter waktu instan dengan pilihan cepat: **Bulan Ini**, **Kuartal Ini (Q1/Q2/Q3/Q4)**, **Tahun Ini**, dan **Semua Waktu**, dilengkapi pemilih rentang tanggal kustom (Date Range Picker).
- **Confirmed Decision 3 (Metrik Kunci yang Ditampilkan)**:
  1. *Keuangan*: Total omzet, DP masuk, sisa piutang tertagih/belum lunas, rata-rata nilai transaksi per pengantin, dan estimasi laba kotor per acara.
  2. *Paket*: Paket terlaris berdasarkan frekuensi pemesanan, kontribusi omzet per paket (persentase & nominal), serta add-on pendukung.
  3. *Leads*: Funnel akuisisi (Diskusi -> Follow Up -> Dikonversi -> Batal), rasio konversi waktu-nyata, dan efektivitas channel asal.
  4. *Pengantin*: Pertumbuhan klien, sebaran kota/wilayah, distribusi status layanan (Active, Lead, Inactive), dan skor kepuasan riil.

---

## 1. Overview & Core Concept

- **What It Does**: Memberikan pandangan 360 derajat atas kesehatan bisnis fotografi & wedding organizer. Pemilik bisnis dan tim manajemen dapat mengevaluasi kinerja akuisisi calon pengantin, memantau cash flow (DP vs piutang), mengetahui paket mana yang paling menguntungkan, dan mengidentifikasi kota atau channel dengan performa tertinggi.
- **Target Audience / Persona**: Pemilik studio, wedding planner, dan manajer operasional yang membutuhkan angka akurat untuk mengambil keputusan bisnis strategis tanpa harus menghitung manual di spreadsheet terpisah.
- **Key Value**: Mengintegrasikan 4 entitas data yang sebelumnya terpisah (`clients`, `leads`, `projects`, `transactions`, `packages`) ke dalam satu dashboard interaktif dengan komputasi otomatis yang konsisten.

---

## 2. User Experience & Visual Design

### Key User Flows
1. **Pemilihan Periode Waktu**: Di bagian atas halaman, pengguna disambut oleh *Period Filter Bar* fleksibel. Klik satu tombol (misal: "Bulan Ini" atau "Tahun Ini") langsung memutakhirkan seluruh angka KPI, grafik, dan tabel secara instan tanpa reload.
2. **Peralihan Tab Terpadu**:
   - **Tab Pengantin**: Memantau volume total pengantin, rasio pengantin aktif, peringkat klien berdasarkan nilai kontrak, serta distribusi wilayah kota.
   - **Tab Leads (Calon Pengantin)**: Menganalisis corong prospek (Funnel), tingkat konversi dari chat awal ke penandatanganan kontrak, serta channel promosi mana yang menghasilkan lead terbanyak.
   - **Tab Keuangan**: Fokus pada arus kas acara—total nilai kontrak, total pembayaran masuk (DP & cicilan), sisa piutang yang belum dilunasi, estimasi margin laba, dan status penagihan.
   - **Tab Paket**: Peringkat paket terlaris, persentase kontribusi omzet masing-masing paket terhadap total pendapatan, serta rata-rata harga transaksi per paket.
3. **Eksplorasi Detail & Drill-down**: Setiap baris tabel atau kartu ranking mendukung pencarian instan, sorting dinamis, dan tombol navigasi langsung ke halaman terkait (misal: tombol "Buka Detail Acara" atau "Hubungi Pengantin").
4. **Ekspor Laporan**: Tombol ekspor CSV kontekstual yang mengunduh data sesuai tab dan rentang periode yang sedang aktif.

### Visual Identity & Theme
- **Aesthetic Direction**: *Executive Analytical Workspace* — Bersih, modular, modern, dan bernuansa profesional tanpa elemen visual berlebihan (anti-AI slop).
- **Color Palette & Discipline**:
  - Dominan Kanvas: Slate neutral bersih (`bg-brand-bg` / `#0F172A` dark posture / `#F8FAFC` light posture).
  - Permukaan Struktural: Kartu tunggal berekstensi halus dengan hairline border (`border border-neutral-200 dark:border-neutral-800`).
  - Aksen Fungsional (10% budget):
    - Hijau (`#16A34A`): DP Lunas, Cash In, Tingkat Konversi Sehat.
    - Amber/Kuning (`#D97706`): Piutang Tertunda / Menunggu Pelunasan.
    - Biru/Indigo (`#2563EB` / `#4F46E5`): Indikator Total Pengantin & Paket Utama.
    - Merah (`#DC2626`): Piutang Jatuh Tempo / Lead Ditolak.
- **Zero-Pill Discipline & Typography**:
  - Semua angka mata uang dan persentase diformat menggunakan angka tabular (`font-mono tabular-nums`) untuk perataan vertikal yang rapi.
  - Metadata status menggunakan teks terstruktur dengan separator halus (`·`), tanpa badge kapsul bertumpuk.
  - Tab navigasi menggunakan segmented controls fungsional yang jelas dan responsif untuk mobile maupun desktop.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Modular Multi-Tab Dashboard vs Halaman Scroll Panjang**
  - *Chosen Approach*: Menerapkan sistem 4 tab terpadu (Pengantin, Leads, Keuangan, Paket) dengan state yang tersinkronisasi pada filter periode.
  - *Why*: Mengurangi beban kognitif pengguna. Menampilkan semua grafik dan tabel keuangan sekaligus dalam satu scroll panjang membingungkan pengguna yang hanya ingin fokus mengecek piutang atau performa paket.
  - *Alternatives Considered*: Halaman accordion tunggal (ditolak karena mengharuskan pengguna membuka-tutup accordion berulang kali).

- **Decision 2: Penyediaan Data Transaksi & Paket ke Komponen Laporan**
  - *Chosen Approach*: Menyambungkan properti `transactions` dan `packages` dari `AuthenticatedRoutes` langsung ke `ClientReports` / `LaporanPengantinHub`.
  - *Why*: Data transaksi riil mencakup `type: 'income' | 'expense'`, pembayaran DP, dan cicilan yang ditautkan ke `clientId` / `projectId`. Menggunakan data ini menghasilkan angka piutang dan laba yang 100% akurat sesuai riwayat kasir, bukan perkiraan fiktif.
  - *Alternatives Considered*: Menghitung keuangan hanya dari `project.totalCost` tanpa membaca riwayat pembayaran (ditolak karena tidak bisa menghitung sisa piutang dan DP riil).

- **Decision 3: Filter Waktu Berbasis Presets Dinamis**
  - *Chosen Approach*: Tombol preset (Bulan Ini, Kuartal Ini, Tahun Ini, Semua Waktu) yang secara otomatis mengisi state tanggal awal dan akhir, dengan opsi input manual untuk tanggal khusus.
  - *Why*: Memudahkan pemilik bisnis melihat performa berkala (misal evaluasi kuartal Q3 atau tutup buku tahunan) dengan 1 klik.

---

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                      AuthenticatedRoutes (/client-reports)              │
│       Props: clients, leads, projects, transactions, packages, feedback │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   Unified LaporanPengantinHub Component                │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Global Filter Bar: Presets (Bulan Ini | Q1-Q4 | Tahun | Semua)    │  │
│  │ Date Range Picker + Reset + Contextual CSV Export Button         │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Segmented Tab Switcher: [Pengantin] [Leads] [Keuangan] [Paket]   │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└───────┬───────────────────┬───────────────────┬───────────────────┬────┘
        │                   │                   │                   │
        ▼                   ▼                   ▼                   ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│ Tab Pengantin │   │   Tab Leads   │   │ Tab Keuangan  │   │   Tab Paket   │
├───────────────┤   ├───────────────┤   ├───────────────┤   ├───────────────┤
│• Total & Aktif│   │• Funnel Leads │   │• Total Omzet  │   │• Ranking Paket│
│• Top 10 Klien │   │• Conversion % │   │• DP Masuk     │   │• Share Omzet %│
│• Sebaran Kota │   │• Top Channels │   │• Sisa Piutang │   │• Rata-rata/Pkt│
│• Tabel Klien  │   │• Status Leads │   │• Est. Margin  │   │• Add-on Stats │
└───────────────┘   └───────────────┘   └───────────────┘   └───────────────┘
```

### Data Model & Computational Metrics
1. **Financial Aggregations (`Tab Keuangan`)**:
   - `totalGrossRevenue`: Jumlah total nilai kontrak proyek (`project.totalCost`).
   - `totalPaymentsCollected`: Total transaksi masuk bertipe `income` yang terkait dengan proyek/klien.
   - `totalOutstandingReceivables`: `totalGrossRevenue - totalPaymentsCollected` (Sisa tagihan pengantin).
   - `estimatedExpenses`: Total transaksi pengeluaran (`expense`) yang dialokasikan pada acara atau rata-rata operasional per acara.
   - `netProfitMargin`: `(totalGrossRevenue - estimatedExpenses) / totalGrossRevenue * 100`.
   - `averageTransactionValue`: `totalGrossRevenue / totalPengantinWithProjects`.

2. **Package Aggregations (`Tab Paket`)**:
   - Mencocokkan nama paket dari `project.packageName` atau `client.package` ke koleksi `packages`.
   - Menghitung volume pesanan, total omzet per paket, dan persentase kontribusi terhadap total pendapatan.
   - Merekam add-on yang paling sering dipesan bersama paket.

3. **Lead & Conversion Aggregations (`Tab Leads`)**:
   - Funnel tahap: `Sedang Diskusi` -> `Follow Up` -> `Dikonversi` (Deal) / `Ditolak`.
   - Rasio Konversi = `(Leads Dikonversi / Total Leads) * 100`.
   - Peringkat saluran akuisisi: WhatsApp, Instagram, TikTok, Website, Rekomendasi/Teman.

4. **Client Demographics & Loyalty (`Tab Pengantin`)**:
   - Distribusi per kota/wilayah (misal: Serang, Tangerang, Cilegon, Jakarta, dll.).
   - Status pengantin: Aktif berjalan, Selesai, Prospek baru.
   - Indeks Kepuasan Klien berdasarkan ulasan dan rating testimoni riil.

---

## 5. Implementation Steps (Planned Execution)

1. **Step 1: Koneksi Data di AuthenticatedRoutes**
   - Meneruskan `transactions` dan `packages` ke komponen `ClientReports` / `LaporanPengantinHub`.
2. **Step 2: Komponen Filter Periode Dinamis**
   - Menghadirkan selektor waktu cepat (Bulan Ini, Kuartal Ini, Tahun Ini, Semua Waktu) dengan sinkronisasi `dateFrom` dan `dateTo`.
3. **Step 3: Implementasi 4 Tab Spesifik**
   - Menata ulang layout dengan Segmented Control modern:
     - **Tab 1: Pengantin**: Metrik klien, sebaran kota, ranking nilai pengantin, tabel direktori.
     - **Tab 2: Leads**: Pipeline funnel visual, metrik konversi, performa per channel komunikasi.
     - **Tab 3: Keuangan**: Rekap omzet, total DP masuk, monitor sisa piutang, rata-rata transaksi, estimasi laba acara.
     - **Tab 4: Paket**: Tabel performa paket terlaris, persentase kontribusi omzet, rata-rata harga paket.
4. **Step 4: Pembersihan Visual & Kepatuhan Tabular Numbers**
   - Memastikan semua nominal uang dan persentase menggunakan kelas `tabular-nums` atau `font-mono`.
   - Memastikan interaksi klik, modal detail, dan ekspor CSV berfungsi dengan sempurna.
5. **Step 5: Verifikasi Kompilasi & Pengujian**
   - Menjalankan `compile_applet` untuk memastikan tidak ada kesalahan TypeScript atau layout regression.
