# PETA FITUR LENGKAP APLIKASI (FEATURE MAP)

> **Catatan Sumber**: Dokumen ini mendokumentasikan setiap halaman, rute navigasi, struktur data, tombol aksi, formulir, modal, filter, pencarian, dan alur CRUD yang benar-benar ada di dalam kode sumber repositori (berdasarkan `src/types/index.ts`, `src/routes/routesConfig.ts`, `src/routes/AuthenticatedRoutes.tsx`, serta komponen halaman di `src/pages/` dan `src/features/`).
>
> Dokumen ini tidak memuat fitur fiktif atau asumsi di luar kode aktual.

---

## 1. Daftar Rute & Navigasi Aplikasi

Aplikasi menggunakan sistem navigasi berbasis enum `ViewType` yang terdaftar pada `src/routes/routesConfig.ts`:

| ViewType Key | Label Menu | Icon | Path URL / Anchor | Kategori Otorisasi |
| :--- | :--- | :--- | :--- | :--- |
| `DASHBOARD` | Dashboard | `TrendingUp` | `/` | Manajemen Utama |
| `CALENDAR` | Kalender Acara | `Calendar` | `/calendar` | Operasional Acara |
| `PROJECTS` | Acara Pernikahan | `FolderKanban` | `/projects` | Operasional Acara |
| `CLIENTS` | Pengantin | `Users` | `/clients` | Relasi Pengantin |
| `LEADS` | Calon Pengantin | `Target` | `/leads` | Relasi Pengantin |
| `FINANCIAL` | Finansial | `DollarSign` | `/finance` | Finansial & Kas |
| `TEAM` | Tim & Mitra | `Briefcase` | `/team` | SDM & Freelance |
| `PACKAGES` | Paket Layanan | `ClipboardList` | `/packages` | Master Data |
| `CONTRACTS` | Kontrak Kerja | `FileText` | `/contracts` | Legalitas & Dokumen |
| `INVOICE` | Tagihan Invoice | `CreditCard` | `/invoice` | Finansial & Tagihan |
| `REPORTS` | Laporan Pengantin | `BarChart2` | `/reports` | Analitik & KPI |
| `PROMO_CODES` | Kode Promo | `Tag` | `/promo` | Marketing |
| `SETTINGS` | Pengaturan | `Settings` | `/settings` | Konfigurasi Sistem |
| `VENDOR_PROFILE` | Profil Vendor | `Building` | `/vendor-profile` | Konfigurasi Bisnis |
| `BOOKING` | Booking Form | `CalendarCheck` | `/booking` | Formulir Terbuka |
| *PORTAL PUBLIK* | Portal Pengantin | `Globe` | `/portal/:token` | Akses Publik Pengantin |
| *PORTAL VENDOR* | Portal Freelance | `Briefcase` | `/freelancer-portal/:token` | Akses Publik Tim |
| *UPLOAD GALERI* | Galeri Foto | `Camera` | `/gallery/:token` | Akses Unggah Foto |

---

## 2. Rincian Halaman & Fitur Per Halaman

---

### Halaman 1: Dashboard (`ViewType.DASHBOARD`)

- **Rute**: `/` (Default view setelah login)
- **Tujuan Halaman**: Pusat kendali ringkasan metrik performa bisnis wedding vendor secara *real-time*, memantau arus kas masuk/keluar, target pendapatan, acara pernikahan mendatang, calon pengantin baru, serta umpan balik pengantin (feedback).
- **Data yang Dikelola**:
  - `Project[]`: Data seluruh acara pernikahan.
  - `Client[]`: Data pasangan pengantin.
  - `Transaction[]`: Data arus transaksi kas masuk & keluar.
  - `Lead[]`: Data calon pengantin & status konversi.
  - `Card[]`: Saldo rekening bank dan dompet digital.
  - `FinancialPocket[]`: Alokasi anggaran kantong finansial.
  - `ClientFeedback[]`: Rating bintang dan ulasan pengantin.
  - `CalendarEvent[]`: Agenda acara internal & pernikahan.
- **Komponen & Seksi Utama**:
  1. **Header Ringkasan & Periode**: Menampilkan salam pengguna aktif, role akses, status database sync, dan ringkasan tanggal hari ini.
  2. **Kartu Statistik Utama (`ModernStatCard` 4 Kolom)**:
     - *Total Pendapatan (Revenue)*: Total pemasukan transaksi dalam rupiah.
     - *Acara Aktif*: Jumlah acara pernikahan yang sedang berjalan dalam pipeline.
     - *Total Pengantin*: Jumlah pengantin pasangan pengantin terdaftar.
     - *Calon Pengantin (Leads)*: Jumlah leads aktif menunggu tindak lanjut.
  3. **Widget Akses Cepat (`QuickLinksWidget`)**:
     - Grid navigasi pintas ke halaman utama yang diizinkan sesuai hak akses pengguna.
  4. **Widget Grafik Keuangan Interaktif (`IncomeChartWidget`)**:
     - Grafik batang komparasi Pemasukan vs Pengeluaran.
     - Toggle view: *Bulanan* (Jan - Des tahun berjalan) vs *Tahunan*.
     - Tooltip melayang saat hover menunjukkan nominal exact pemasukan & pengeluaran.
  5. **Widget Acara Pernikahan Terdekat (`UpcomingEventsWidget`)**:
     - Menampilkan daftar acara terdekat dengan hitung mundur hari, nama pengantin, lokasi gedung, dan status pengerjaan.
  6. **Widget Ulasan Pengantin (`ClientFeedbackWidget`)**:
     - Menampilkan rating rata-rata (skala 1-5 bintang) dan testimoni terbaru pengantin.
- **Daftar Tombol & Fungsinya**:
  - `Tombol Periode Bulanan / Tahunan`: Mengubah mode visualisasi grafik bar pemasukan & pengeluaran.
  - `Tombol Akses Cepat (Icon Nav)`: Berpindah langsung ke rute tujuan (Acara, Pengantin, Kalender, Finansial, dll).
  - `Tombol Klik Kartu Statistik`: Membuka modal drill-down rincian data metrik yang diklik (`StatCardModal`).
  - `Tombol Lihat Semua Acara`: Menavigasikan pengguna ke halaman `/projects`.
  - `Tombol Hubungi Pengantin (WA Icon)`: Membuka link `wa.me/` langsung ke calon pengantin atau pengantin dari daftar terdekat.
- **Modal yang Terhubung**:
  - `StatCardModal`: Menampilkan daftar record mentah yang membentuk angka statistik (misal: daftar detail acara aktif, rincian transaksi bulan berjalan).
- **Filter & Pencarian**:
  - Filter rentang waktu (Bulanan vs Tahunan pada chart).
- **Hubungan Antar Halaman**:
  - Klik kartu acara mengarahkan ke `ProjectDetailModal` di `/projects`.
  - Klik akses cepat membuka halaman modul masing-masing.

---

### Halaman 2: Kalender Acara (`ViewType.CALENDAR`)

- **Rute**: `/calendar`
- **Tujuan Halaman**: Pusat visualisasi operasional terintegrasi (*Event Control Center*) untuk menjadwalkan, memantau, memfilter, dan mengelola seluruh acara pernikahan pengantin serta kegiatan internal tim (Technical Meeting, Survey Venue, Foto Studio, Libur, dll).
- **Data yang Dikelola**:
  - `Project[]`: Data acara pernikahan pengantin lengkap dengan tanggal, sesi, lokasi, dan status.
  - `Client[]`: Referensi data pengantin.
  - `TeamMember[]`: Penugasan anggota tim & vendor.
  - `CalendarEvent[]`: Agenda acara internal non-pengantin (meeting, maintenance alat, survey).
  - `ProjectStatusConfig[]`: Konfigurasi warna status acara.
- **Fitur Utama**:
  1. **6 Mode Tampilan Kalender (Calendar Sub-Views)**:
     - `Month View`: Tampilan kisi bulan standar dengan indikator baris event harian berwarna dan penanda bentrok (*overlap indicator*).
     - `Week View`: Tampilan jadwal mingguan berdasar hari.
     - `Day View`: Tampilan rinci hari demi hari dengan pembagian slot waktu jam.
     - `Agenda View`: Tampilan list kronologis terurut ke bawah dengan badge hari dan hitung mundur.
     - `Team Timeline View`: Tampilan matriks penugasan per anggota tim pada tanggal terpilih untuk mencegah dobel jadwal fotografer/videografer.
     - `Client Timeline View`: Tampilan linimasa tahapan persiapan per pasangan pengantin.
  2. **Filter Kalender Komprehensif**:
     - Filter berdasarkan jenis acara (Semua, Acara Pernikahan Saja, Agenda Internal Saja).
     - Filter berdasarkan pengantin spesifik.
     - Filter berdasarkan status pengerjaan acara pernikahan.
  3. **Event Side Panel (`EventPanel`)**:
     - Panel drawer kanan yang menampilkan rincian kegiatan pada tanggal yang dipilih.
  4. **Ekspor & Sinkronisasi Eksternal**:
     - Ekspor jadwal kalender ke file standar iCalendar (`.ics`) untuk diimpor ke Google Calendar / Apple Calendar.
- **Daftar Tombol & Fungsinya**:
  - `Tombol Prev (<) & Next (>)`: Menggeser navigasi tanggal mundur atau maju 1 bulan/minggu/hari.
  - `Tombol Hari Ini (Today)`: Mengembalikan fokus tampilan tanggal langsung ke hari ini.
  - `Tombol Switch View (Bulan, Minggu, Hari, Agenda, Tim, Pengantin)`: Mengubah tata letak kisi kalender.
  - `Tombol Tambah Acara Internal (+ Event)`: Membuka formulir pembuatan agenda internal tim.
  - `Tombol Ekspor .ICS`: Menghasilkan dan mengunduh file `.ics` kalender ke komputer/ponsel.
  - `Tombol Klik Tanggal Kisi Kalender`: Memilih tanggal aktif dan membuka daftar jadwal pada tanggal tersebut di side panel.
  - `Tombol Klik Item Event`: Membuka modal detail lengkap acara pernikahan atau agenda internal.
  - `Tombol Hapus Event Internal`: Menghapus agenda jadwal internal yang tidak lagi diperlukan.
- **Form & Modal**:
  - `Add/Edit Calendar Event Form`: Input nama agenda, tanggal, jam mulai, jam selesai, kategori (Meeting, Survey, Internal, Libur), lokasi, dan catatan.
  - `ProjectDetailModal`: Dibuka jika item yang diklik merupakan acara pernikahan pengantin.
- **Hubungan Antar Halaman**:
  - Terhubung dua arah dengan `ProjectsPage` dan `TeamPage` (penugasan jadwal tim/vendor).

---

### Halaman 3: Acara Pernikahan (`ViewType.PROJECTS`)

- **Rute**: `/projects`
- **Tujuan Halaman**: Manajemen siklus hidup penuh (*full lifecycle*) seluruh acara pernikahan dari inisiasi kontrak hingga serah terima hasil dokumentasi dan evaluasi kepuasan.
- **Data yang Dikelola**:
  - `Project`: ID, nama acara, tanggal acara, lokasi, client ID, package ID, add-ons, tim yang ditugaskan, custom costs (biaya tambahan), checklist tugas, kontrak, total biaya, uang muka (DP), sisa tagihan, payment status, project status, sub-status.
  - `Client`, `Package`, `TeamMember`, `Transaction`.
- **Fitur Utama**:
  1. **3 Mode Tampilan Halaman (Tabs)**:
     - `Semua Acara (List/Table View)`: Tampilan tabel desktop yang otomatis bermutasi menjadi kartu vertikal (`ProjectCard`) di ponsel.
     - `Kanban Board`: Papan visual pengerjaan berdasar kolom status (Booking, Persiapan, Hari H, Editing, Selesai).
     - `Analitik Acara`: Visualisasi rasio pengerjaan dan metrik penyelesaian acara.
  2. **Filter & Pencarian Multifungsi**:
     - Pencarian teks (nama acara, nama pengantin, lokasi gedung).
     - Filter berdasarkan Status Pembayaran (Lunas, DP Terbayar, Belum Bayar).
     - Filter berdasarkan Status Pengerjaan Acara.
     - Filter berdasarkan Rentang Tanggal Acara.
     - Filter Urutan (Sorting): Tanggal Terdekat, Tanggal Terjauh, Nilai Kontrak Tertinggi, Progres Paling Rendah.
  3. **Checklist Hari H (Wedding Day Checklist)**:
     - Manajemen checklist persiapan teknis (alat, baterai, memory card, rundown, briefing).
  4. **Kalkulator Biaya Tambahan (Custom Costs)**:
     - Penambahan biaya charge ekstra langsung di rincian acara yang otomatis mengkalkulasi ulang total tagihan dan invoice.
- **Daftar Tombol & Fungsinya**:
  - `Tombol Tambah Acara (+ Acara Baru)`: Membuka formulir pembuatan acara pernikahan baru.
  - `Tombol Mode List / Kanban / Analitik`: Mengubah cara pandang penyajian data acara.
  - `Tombol Ekspor CSV`: Mengunduh daftar seluruh acara pernikahan dalam format CSV.
  - `Tombol Card: Detail (Mata / Icon Folder)`: Membuka modal detail komprehensif (`ProjectDetailModal`).
  - `Tombol Card: Edit (Pencil Icon)`: Membuka modal formulir pengeditan data acara.
  - `Tombol Card: Hapus (Trash Icon)`: Membuka dialog konfirmasi penghapusan acara (dengan proteksi integritas data transaksi).
  - `Tombol Card: WhatsApp Pengantin`: Membuka chat WhatsApp langsung ke nomor pengantin dengan nomor yang telah dibersihkan (`cleanPhoneNumber`).
  - `Tombol Card: Quick Status Change`: Dropdown instan untuk memajukan status acara tanpa membuka modal.
  - `Tombol Dalam Detail: Tambah Biaya Ekstra (+ Charge)`: Menambahkan biaya kustom baru pada acara.
  - `Tombol Dalam Detail: Hapus Biaya Ekstra`: Menghapus baris biaya kustom yang salah input.
  - `Tombol Dalam Detail: Catat Pembayaran Tagihan`: Merekam transaksi kas masuk pelunasan atau cicilan dari pengantin.
  - `Tombol Dalam Detail: Lihat Invoice`: Membuka preview invoice resmi untuk acara tersebut.
  - `Tombol Dalam Detail: Bagikan Portal Pengantin`: Membuka tautan atau QR Code portal publik pengantin.
- **Modal yang Terhubung**:
  - `ProjectFormModal`: Formulir tambah/edit acara pernikahan.
  - `ProjectDetailModal`: Modal multi-tab (Informasi, Tim Bertugas, Checklist Hari H, Keuangan, Kontrak).
  - `InvoiceModal`: Modal pratinjau invoice cetak.
- **Hubungan Antar Halaman**:
  - Mengirim data pengeluaran fee ke `TeamPage` (TeamProjectPayment).
  - Merekam mutasi kas ke `FinancePage` saat pembayaran dicatat.

---

### Halaman 4: Pengantin (`ViewType.CLIENTS`)

- **Rute**: `/clients`
- **Tujuan Halaman**: Manajemen database hubungan pelanggan (*CRM Pengantin*) untuk mengelola profil pasangan pengantin, nomor kontak, histori acara pernikahan mereka, status piutang/pembayaran, kwitansi, dan tautan portal pengantin.
- **Data yang Dikelola**:
  - `Client`: ID, nama pengantin, tipe pengantin, email, telepon, nomor WhatsApp, Instagram, alamat, kota lokasi, total tagihan, total terbayar, sisa piutang, status pembayaran, portal token.
  - `Project[]`, `Transaction[]`, `Card[]`.
- **Fitur Utama**:
  1. **Kartu Statistik Pengantin (4 Metrik)**:
     - Total Pengantin Terdaftar.
     - Pengantin Lunas.
     - Pengantin Memiliki Sisa Tagihan (Piutang).
     - Total Nilai Piutang Aktif dalam Rupiah.
  2. **Filter & Pencarian**:
     - Kolom pencarian nama pengantin, nomor telepon, atau akun Instagram.
     - Filter status pembayaran (Semua, Lunas, Belum Lunas).
     - Filter pengurutan (A-Z, Tanggal Ditambahkan, Sisa Tagihan Tertinggi).
  3. **Tampilan Responsif (Tabel Desktop & Mobile Cards)**:
     - Desktop: Tabel data lengkap dengan kolom foto avatar, nama & Instagram, kontak WA, total acara, nilai transaksi, status tagihan, dan aksi.
     - Mobile: Kartu pengantin mandiri dengan tombol hubungi WhatsApp satu sentuhan.
  4. **Perekaman Pembayaran Bertahap (Partial Payments)**:
     - Fitur input nominal cicilan, pemilihan kartu/rekening bank penampung, dan validasi agar tidak melebihi sisa tagihan.
  5. **Portal Pengantin Terintegrasi**:
     - Generate tautan aman dan QR Code khusus untuk dibagikan kepada pengantin agar dapat melihat rundown, invoice, galeri, dan tim bertugas secara mandiri.
- **Daftar Tombol & Fungsinya**:
  - `Tombol Tambah Pengantin (+ Pengantin Baru)`: Membuka formulir input pasangan pengantin baru.
  - `Tombol Detail Pengantin (Nama / Icon)`: Membuka `ClientDetailModal` (tab info umum & tab riwayat pembayaran).
  - `Tombol Edit Pengantin (Pencil)`: Membuka formulir pembaruan data kontak dan profil pengantin.
  - `Tombol Hapus Pengantin (Trash)`: Menghapus data pengantin beserta validasi riwayat acara.
  - `Tombol Chat WhatsApp (WA Icon)`: Mengarahkan langsung ke obrolan WhatsApp pengantin.
  - `Tombol Bagikan Portal (Share Icon)`: Membuka modal tautan dan QR Code portal pengantin.
  - `Tombol Lihat Invoice`: Menampilkan tagihan resmi acara pengantin.
  - `Tombol Lihat Kwitansi`: Menampilkan kwitansi pembayaran resmi atas transaksi yang telah terekam.
  - `Tombol Simpan Pembayaran Baru`: Menyimpan cicilan uang masuk ke database dan memperbarui saldo rekening bank terpilih.
- **Modal yang Terhubung**:
  - `ClientFormModal`: Formulir tambah/edit pengantin.
  - `ClientDetailModal`: Modal detail multi-tab dengan ringkasan keuangan (pill total biaya, terbayar, sisa tagihan).
  - `ReceiptModal`: Menampilkan dokumen kwitansi pembayaran resmi.
  - `PortalShareModal`: Menampilkan QR Code dan URL portal pengantin.
- **Hubungan Antar Halaman**:
  - Konversi dari `LeadsPage`.
  - Terhubung ke `ProjectsPage` (satu pengantin dapat memiliki lebih dari satu acara/acara).
  - Terhubung ke `FinancePage` saat pembayaran terekam.

---

### Halaman 5: Calon Pengantin (`ViewType.LEADS`)

- **Rute**: `/leads`
- **Tujuan Halaman**: Manajemen saluran penjualan (*sales pipeline*) untuk mencatat prospek calon pengantin yang menghubungi melalui berbagai saluran kontak, melakukan proses kualifikasi, follow up, hingga konversi otomatis menjadi pengantin resmi dan acara pernikahan.
- **Data yang Dikelola**:
  - `Lead`: ID, nama prospek, nomor WhatsApp, saluran kontak (`ContactChannel`: WhatsApp, Instagram, Website, Telepon, Referral, Form Saran), tanggal acara yang diinginkan, kota lokasi, alamat gedung, catatan kebutuhan, status (`LeadStatus`: Sedang Diskusi, Menunggu Follow Up, Dikonversi, Ditolak), tanggal masuk, tanggal konversi.
  - `Package[]`, `AddOn[]`, `PromoCode[]`, `Profile`.
- **Fitur Utama**:
  1. **Kanban Pipeline & List View**:
     - Menampilkan prospek dalam kolom status: *Sedang Diskusi*, *Menunggu Follow Up*, *Dikonversi*, *Ditolak*.
     - Penghitung jumlah hari sejak prospek masuk (`Hari ini`, `Kemarin`, `X hari lalu`).
  2. **Formulir Konversi Prospek Cerdas (`ConvertLeadForm`)**:
     - Mengubah prospek menjadi pengantin & acara pernikahan dalam satu langkah.
     - Menghubungkan paket wedding pilihan, add-on kustom, kode promo diskon (persentase atau nominal tetap), menghitung uang muka (DP), dan memilih rekening kas penampung DP.
     - Otomatis membuat record `Client`, record `Project`, record `Transaction` (jika ada DP), serta memperbarui saldo kartu bank terkait.
  3. **Analitik Saluran Leads (Lead Source Analytics)**:
     - Mengukur persentase saluran kontak paling efektif (Instagram vs WhatsApp vs Referral).
- **Daftar Tombol & Fungsinya**:
  - `Tombol Tambah Calon Pengantin (+ Lead Baru)`: Membuka formulir pencatatan prospek baru.
  - `Tombol Konversi (Convert to Client)`: Membuka form komprehensif konversi lead menjadi pengantin & acara aktif.
  - `Tombol Chat WhatsApp Langsung`: Menghubungi calon pengantin dengan template sapaan pembuka instan.
  - `Tombol Ubah Status Cepat (Dropdown)`: Memindahkan status lead antara Diskusi, Follow Up, atau Ditolak.
  - `Tombol Edit Lead`: Memperbarui data kontak, catatan kebutuhan, atau rencana tanggal acara.
  - `Tombol Hapus Lead`: Menghapus data prospek yang tidak relevan.
- **Modal yang Terhubung**:
  - `LeadFormModal`: Modal penambahan dan pembaruan data prospek.
  - `ConvertLeadModal`: Modal form konversi lengkap dengan kalkulator harga paket, add-on, dan promo.
- **Hubungan Antar Halaman**:
  - Menghasilkan record baru di `ClientsPage`, `ProjectsPage`, dan `FinancePage`.

---

### Halaman 6: Tim & Mitra Freelance (`ViewType.TEAM`) & Slip Gaji / Payroll

- **Rute**: `/team`
- **Tujuan Halaman**: Manajemen sumber daya manusia (tim internal & vendor freelance eksternal: fotografer, videografer, pilot drone, MUA, dekorasi), memantau penugasan acara, menghitung akumulasi honor belum terbayar (*unpaid fees*), menerbitkan slip gaji resmi ber-PDF, mencatat tanda tangan digital, serta portal freelance.
- **Data yang Dikelola**:
  - `TeamMember`: ID, nama, role/posisi, tipe (`Internal` atau `Vendor/Freelance`), nomor kontak, nomor rekening bank, nama bank, rating performa, catatan internal, link portal freelance.
  - `TeamProjectPayment`: ID penugasan acara, member ID, project ID, besaran fee (honor), status pembayaran fee (`Unpaid` / `Paid`), payment record ID.
  - `TeamPaymentRecord`: Nomor slip (misal: `#SLIP-2026-001`), member ID, tanggal bayar, total nominal, daftar ID penugasan yang dibayar, tanda tangan digital vendor/verifikator, sumber rekening kas pembayaran.
  - `Profile`, `Project[]`, `Card[]`, `FinancialPocket[]`.
- **Fitur Utama**:
  1. **Navigasi 4 Tab Utama (`TeamTabNav`)**:
     - `Tim Internal`: Daftar anggota tim tetap, metrik pengeluaran fee tim, pencarian posisi/nama.
     - `Mitra Vendor Eksternal`: Daftar mitra freelance, bidang keahlian, nomor rekening, dan riwayat penugasan.
     - `Fee Belum Lunas (TeamUnpaidTab)`: Rekapitulasi terpusat seluruh honor anggota tim/vendor yang belum terbayarkan di semua acara pernikahan yang telah berlangsung, dengan total nominal agregat.
     - `Analitik & Performa (TeamAnalyticsTab)`: Grafik distribusi honor tim, frekuensi penugasan, dan rekapitulasi pembayaran per periode.
  2. **Modal Detail Anggota Tim (`TeamMemberDetailModal`) dengan 4 Sub-Tab**:
     - *Tab Acara/Acara*: Daftar acara pernikahan yang ditugaskan kepada anggota tim beserta status pengerjaan.
     - *Tab Riwayat Pembayaran*: Histori slip gaji dan bukti pembayaran yang telah diterbitkan.
     - *Tab Performa & Catatan*: Sistem rating bintang (1-5) dan catatan evaluasi kerja (positif/negatif).
     - *Tab Buat Pembayaran (Create Payment Tab)*: Memilih satu atau beberapa tugas acara yang akan dibayarkan sekaligus (multi-select), memasukkan nominal cicilan/lunas, memilih rekening bank sumber dana atau kantong operasional, dan langsung memproses pembayaran.
  3. **Mesin Slip Gaji Resmi (`PaymentSlipDocument`)**:
     - Tata letak dokumen cetak A4 800px dengan border aksen atas, kop logo vendor, info penerima & nomor rekening, tabel rincian pekerjaan dan nominal honor, total bersih, serta kolom tanda tangan digital verifikator bergaris bawah.
  4. **Tanda Tangan Digital (`SignaturePad`)**:
     - Canvas tanda tangan langsung di layar untuk dibubuhkan pada slip gaji sebelum diunduh.
  5. **Ekspor & Pemirsa PDF (`PDFViewer`)**:
     - Pembuat file PDF otomatis dari slip gaji, siap disimpan atau dikirim melalui WhatsApp ke anggota tim.
  6. **Portal Freelancer Mandiri (`FreelancerPortal`)**:
     - Halaman publik khusus anggota tim untuk memeriksa jadwal tugas acara mendatang, status honor yang belum/sudah cair, serta mengunduh slip gaji tanpa perlu login ke sistem admin.
- **Daftar Tombol & Fungsinya**:
  - `Tombol Tambah Anggota (+ Tambah Anggota / Mitra)`: Membuka formulir pendaftaran anggota tim atau vendor baru.
  - `Tombol Filter Rentang Tanggal`: Memfilter perhitungan honor dan penugasan acara dalam periode tertentu.
  - `Tombol Reset Rentang Tanggal`: Mengembalikan filter tanggal ke periode default.
  - `Tombol Unduh CSV`: Mengunduh rekapitulasi data tim dan honor dalam format spreadsheet CSV.
  - `Tombol Tab Tim / Vendor / Belum Lunas / Analitik`: Berpindah antar seksi manajemen SDM.
  - `Tombol Klik Kartu / Baris Tim`: Membuka modal detail lengkap anggota tim (`TeamMemberDetailModal`).
  - `Tombol Edit Tim (Pencil)`: Membuka formulir pengeditan nama, peran, no HP, dan data rekening bank.
  - `Tombol Hapus Tim (Trash)`: Menghapus data anggota tim dengan proteksi validasi acara.
  - `Tombol Tab Buat Pembayaran: Pilih Acara (Checkbox)`: Memilih acara mana saja yang akan dibayarkan honornya dalam satu slip.
  - `Tombol Tab Buat Pembayaran: Proses Pembayaran`: Memvalidasi kelengkapan data dan memotong saldo rekening/kantong kas.
  - `Tombol Lihat Slip Gaji (Eye / FileText)`: Membuka modal tampilan PDF slip gaji.
  - `Tombol Bubuhkan / Ganti TTD`: Membuka canvas `SignaturePad` untuk menandatangani slip gaji.
  - `Tombol Simpan TTD`: Menyimpan goresan tanda tangan ke slip pembayaran.
  - `Tombol Unduh PDF Slip Gaji`: Mengunduh slip gaji resmi dalam format PDF beresolusi tinggi.
  - `Tombol Bagikan Portal Freelance (QR Icon)`: Menampilkan QR Code dan link akses portal bagi anggota tim bersangkutan.
  - `Tombol Salin Tautan Portal`: Menyalin URL portal freelance ke clipboard perangkat.
- **Modal yang Terhubung**:
  - `TeamMemberFormModal`: Modal formulir tambah/edit anggota tim.
  - `TeamMemberDetailModal`: Modal detail multi-tab 4 seksi.
  - `Modal Slip Pembayaran`: Modal penampil dokumen PDF slip gaji dengan tombol tanda tangan & unduh.
  - `Modal SignaturePad`: Modal tanda tangan sentuh digital.
  - `TeamStatDrillModal`: Modal drill-down metrik statistik honor & penugasan.
  - `Modal QR Code Portal`: Menampilkan QR Code akses portal freelance.
- **Hubungan Antar Halaman**:
  - Terintegrasi dengan `ProjectsPage` (penugasan tim per acara).
  - Terintegrasi dengan `FinancePage` (setiap pembayaran slip gaji otomatis menerbitkan transaksi `EXPENSE` dan memotong saldo kartu/kantong).

---

### Halaman 7: Finansial & Kas (`ViewType.FINANCIAL`)

- **Rute**: `/finance`
- **Tujuan Halaman**: Manajemen komprehensif seluruh arus kas keuangan usaha vendor pernikahan, mengelola rekening bank & dompet digital, pengalokasian kantong anggaran (budget pockets), pencatatan transaksi masuk/keluar, analisis arus kas (cash flow), laporan mutasi, hingga laporan laba rugi per acara pernikahan.
- **Data yang Dikelola**:
  - `Transaction`: ID, tipe (`INCOME` / `EXPENSE` / `TRANSFER`), kategori, jumlah (nominal Rupiah), tanggal, deskripsi, card ID (sumber/tujuan), pocket ID, project ID (jika terikat acara tertentu), client ID, receipt number.
  - `Card`: ID, nama bank/dompet (misal: BCA Bisnis, Mandiri, Cash Tunai, GoPay), nomor rekening, nama pemilik rekening, saldo saat ini (*current balance*), warna kartu, tipe kartu.
  - `FinancialPocket`: ID, nama kantong (misal: Operasional, Gaji Tim, Pajak, Tabungan Alat, Profit Owner), saldo saat ini, target alokasi, persentase alokasi, warna, ikon.
  - `Project[]`, `Profile`.
- **Fitur Utama**:
  1. **Kartu Statistik Finansial Teratas (`FinanceHeaderStats`)**:
     - *Total Aset Keuangan*: Akumulasi seluruh saldo rekening bank dan dompet digital.
     - *Alokasi Kantong*: Total dana yang telah dipartisi ke dalam kantong finansial.
     - *Pemasukan Bulan Ini*: Total transaksi masuk pada bulan berjalan.
     - *Pengeluaran Bulan Ini*: Total transaksi keluar pada bulan berjalan.
  2. **7 Tab Navigasi Finansial (`FinanceTabs`)**:
     - `Transaksi Kas (transactions)`: Catatan mutasi transaksi kronologis dengan filter kategori & tanggal.
     - `Kantong Finansial (pockets)`: Sistem amplop digital (budgeting pockets) untuk memisahkan dana operasional, tabungan alat baru, dan laba bersih.
     - `Rekening & Dompet (cards)`: Manajemen rekening bank, e-wallet, kas kecil, dan mutasi saldo.
     - `Arus Kas (cashflow)`: Grafik interaktif perbandingan arus kas bulanan & tren likuiditas (`InteractiveCashflowChart`).
     - `Laporan Mutasi (laporan)`: Laporan transaksi berfilter dengan fitur ekspor CSV siap audit.
     - `Laporan per Rekening (laporanKartu)`: Rekapitulasi mutasi dan saldo akhir terpisah per nomor rekening bank.
     - `Laba Rugi Acara (labaAcara Pernikahan)`: Analisis profitabilitas per acara pernikahan (Pendapatan Kontrak vs Pengeluaran Fee Tim vs Biaya Operasional Vendor = Laba Bersih Acara).
  3. **Visual Summary Chart**:
     - Diagram donat (`DonutChart`) pengeluaran per kategori (Honor Tim, Transportasi, Cetak Album, Konsumsi, Marketing).
- **Daftar Tombol & Fungsinya**:
  - `Tombol Tambah Transaksi (+ Transaksi Baru)`: Membuka formulir pencatatan pemasukan atau pengeluaran kas.
  - `Tombol Transfer Antar Rekening`: Membuka formulir pemindahan saldo antar rekening bank/dompet digital tanpa mempengaruhi laba rugi.
  - `Tombol Tambah Rekening / Dompet Baru`: Mendaftarkan nomor rekening bank atau e-wallet baru.
  - `Tombol Tambah Kantong Anggaran Baru`: Membuat kantong partisi dana baru.
  - `Tombol Alokasikan Dana ke Kantong`: Memindahkan saldo kas umum ke kantong finansial tertentu.
  - `Tombol Tarik Dana dari Kantong`: Mengembalikan alokasi dana kantong ke kas bebas.
  - `Tombol Ekspor CSV Laporan Transaksi`: Mengunduh laporan mutasi transaksi dalam file spreadsheet.
  - `Tombol Ekspor CSV Laporan Laba Rugi Acara`: Mengunduh laporan profitabilitas acara pernikahan.
  - `Tombol Filter Kategori (Dropdown)`: Memfilter transaksi berdasarkan jenis (Pemasukan / Pengeluaran / Kategori spesifik).
  - `Tombol Filter Rentang Tanggal`: Menentukan periode laporan keuangan.
  - `Tombol Edit Transaksi (Pencil)`: Memperbarui deskripsi, kategori, atau nominal transaksi yang salah catat.
  - `Tombol Hapus Transaksi (Trash)`: Menghapus transaksi dan otomatis memulihkan (*rollback*) saldo rekening bank terkait.
  - `Tombol Riwayat Rekening / Kantong`: Membuka modal histori mutasi spesifik pada kartu atau kantong tersebut (`FinanceHistoryModal`).
  - `Tombol Panduan Finansial (Info Icon)`: Membuka panduan praktik terbaik pengelolaan keuangan vendor (`FinanceGuideModal`).
- **Modal yang Terhubung**:
  - `FinanceFormModal`: Modal pencatatan transaksi masuk/keluar, transfer saldo, dan top-up kantong.
  - `FinanceHistoryModal`: Modal riwayat mutasi per rekening atau kantong.
  - `FinanceStatDetailModal`: Modal rincian drill-down aset dan mutasi bulanan.
  - `FinanceGuideModal`: Modal petunjuk tata cara pembukuan vendor.
- **Hubungan Antar Halaman**:
  - Menerima mutasi otomatis dari pelunasan acara di `ProjectsPage` dan `ClientsPage`.
  - Menerima pencatatan pengeluaran otomatis dari pembayaran slip gaji di `TeamPage`.

---

### Halaman 8: Paket Layanan (`ViewType.PACKAGES`)

- **Rute**: `/packages`
- **Tujuan Halaman**: Manajemen katalog produk paket pernikahan (wedding documentation packages: Siraman, Akad Saja, Resepsi Penuh, Pre-Wedding, Cinematic Video) dan opsi layanan tambahan (*add-ons*).
- **Data yang Dikelola**:
  - `Package`: ID, nama paket, harga paket (Rupiah), deskripsi layanan, item yang termasuk (daftar rincian deliverables, durasi jam kerja, jumlah kru yang dikirimkan, jenis album, resolusi video).
  - `AddOn`: ID, nama layanan tambahan (misal: Drone 4K, Same Day Edit, Cetak Kanvas 24R, Flashdisk Kayu Eksklusif), harga, deskripsi.
- **Fitur Utama**:
  1. Daftar kartu paket layanan dengan rincian fitur dan harga.
  2. Seksi daftar add-ons dengan tag harga jelas.
  3. Pembuat kalkulasi paket yang terhubung langsung ke formulir konversi prospek dan booking.
- **Daftar Tombol & Fungsinya**:
  - `Tombol Tambah Paket Baru`: Membuka formulir pembuatan paket layanan baru.
  - `Tombol Tambah Add-On Baru`: Membuka formulir pembuatan item layanan tambahan.
  - `Tombol Edit Paket / Add-On`: Memperbarui harga dan rincian fasilitas layanan.
  - `Tombol Hapus Paket / Add-On`: Menghapus opsi paket dari katalog.
- **Hubungan Antar Halaman**:
  - Menjadi master data referensi untuk `LeadsPage` (konversi calon pengantin), `ProjectsPage` (pemilihan paket acara), dan formulir booking publik pengantin.

---

### Halaman 9: Kontrak Kerja (`ViewType.CONTRACTS`) & Dokumen Legal

- **Rute**: `/contracts`
- **Tujuan Halaman**: Pengelolaan perjanjian kerja sama resmi antara vendor dan pasangan pengantin, mencakup pasal-pasal hak cipta foto/video, jadwal pembayaran, pembatalan/force majeure, serta penandatanganan digital dua belah pihak.
- **Data yang Dikelola**:
  - `Contract`: ID acara terkait, teks klausul syarat & ketentuan, tanggal penandatanganan, tanda tangan digital pengantin, tanda tangan digital vendor, status kontrak (`Draft`, `Signed`, `Active`).
  - `Project`, `Client`, `Profile`.
- **Fitur Utama**:
  1. Editor template klausul kontrak kerja sama pernikahan.
  2. Pratinjau dokumen kontrak resmi siap cetak / unduh PDF.
  3. Canvas tanda tangan digital untuk pengantin dan pemilik vendor.
- **Daftar Tombol & Fungsinya**:
  - `Tombol Buat Kontrak Baru`: Mengenerate draft kontrak untuk acara pernikahan terpilih.
  - `Tombol Edit Klausul Kontrak`: Menyesuaikan butir-butir pasal kesepakatan khusus.
  - `Tombol Tanda Tangani Kontrak`: Membuka canvas tanda tangan digital.
  - `Tombol Unduh PDF Kontrak`: Mengunduh dokumen legal perjanjian kerja sama dalam format PDF.
  - `Tombol Kirim Kontrak ke Pengantin`: Mengirimkan tautan penandatanganan online ke WhatsApp pengantin.
- **Hubungan Antar Halaman**:
  - Terikat langsung dengan acara pernikahan di `ProjectsPage` dan pengantin di `ClientsPage`.

---

### Halaman 10: Tagihan Invoice (`ViewType.INVOICE`) & Dokumen Tagihan

- **Rute**: `/invoice`
- **Tujuan Halaman**: Manajemen penerbitan faktur tagihan resmi (Wedding Invoice) dengan kalkulasi otomatis DP, diskon promo, biaya tambahan, sisa tagihan, petunjuk rekening transfer bank, serta tanda tangan pengesahan.
- **Data yang Dikelola**:
  - `Invoice`: Nomor invoice (misal: `#INV-2026-081`), tanggal terbit, tanggal jatuh tempo, data acara, data pengantin, rincian item tagihan, status bayar (`Lunas`, `DP Terbayar`, `Belum Bayar`).
- **Fitur Utama**:
  1. Generator invoice otomatis berdasarkan data riil dari acara pernikahan.
  2. Canvas pratinjau invoice format A4 dengan tata letak elegan dan warna brand.
  3. Konversi langsung menjadi file PDF atau gambar untuk dikirimkan melalui chat.
- **Daftar Tombol & Fungsinya**:
  - `Tombol Terbitkan Invoice`: Membuat invoice resmi dari acara yang belum memiliki tagihan.
  - `Tombol Unduh PDF Invoice`: Mengunduh file invoice PDF ke penyimpanan lokal.
  - `Tombol Cetak Invoice`: Membuka dialog print browser standar.
  - `Tombol Bagikan via WhatsApp`: Mengirim pesan tagihan otomatis beserta nomor invoice ke WhatsApp pengantin.
- **Hubungan Antar Halaman**:
  - Diakses langsung dari `ProjectsPage` dan `ClientsPage`.

---

### Halaman 11: Laporan Pengantin & KPI (`ViewType.REPORTS`)

- **Rute**: `/reports`
- **Tujuan Halaman**: Analisis performa akuisisi pengantin, metrik kepuasan pengantin (Net Promoter Score / Client Satisfaction), retensi referral, dan efektivitas konversi kampanye promosi.
- **Data yang Dikelola**:
  - Data agregat `Client`, `Lead`, `ClientFeedback`, `Transaction`.
- **Fitur Utama**:
  1. Grafik rasio kepuasan pengantin berdasarkan rating layanan.
  2. Metrik rata-rata nilai kontrak per pengantin (*Average Deal Size*).
  3. Grafik sumber asal pengantin paling potensial.
- **Daftar Tombol & Fungsinya**:
  - `Tombol Filter Tahun / Kuartal`: Memilih periode evaluasi performa bisnis.
  - `Tombol Ekspor Laporan KPI`: Mengunduh ringkasan performa bisnis.
- **Hubungan Antar Halaman**:
  - Menarik data historis dari `ClientsPage`, `LeadsPage`, dan `FeedbackPage`.

---

### Halaman 12: Kode Promo (`ViewType.PROMO_CODES`)

- **Rute**: `/promo`
- **Tujuan Halaman**: Manajemen voucher diskon dan promosi musiman (misal: Diskon Pameran Wedding Expo, Promo Awal Tahun, Diskon Referral Teman).
- **Data yang Dikelola**:
  - `PromoCode`: ID, kode kupon (misal: `WEDDINGEXPO2026`), tipe diskon (`percentage` atau `fixed` nominal Rupiah), nilai diskon, batas penggunaan, tanggal kedaluwarsa, status aktif.
- **Fitur Utama**:
  1. Pembuatan kode promo dengan pembatasan kuota dan masa berlaku.
  2. Validasi otomatis saat kode promo diaplikasikan pada form booking atau konversi lead.
- **Daftar Tombol & Fungsinya**:
  - `Tombol Tambah Kode Promo (+ Promo Baru)`: Membuka formulir pembuatan voucher promosi.
  - `Tombol Toggle Status Aktif/Nonaktif`: Menghentikan atau mengaktifkan kembali penggunaan kode promo secara instan.
  - `Tombol Hapus Promo`: Menghapus kode promo dari sistem.
- **Hubungan Antar Halaman**:
  - Digunakan pada `LeadsPage` saat formulir konversi lead diisi.

---

### Halaman 13: Pengaturan Sistem (`ViewType.SETTINGS`) & Profil Vendor (`ViewType.VENDOR_PROFILE`)

- **Rute**: `/settings` dan `/vendor-profile`
- **Tujuan Halaman**: Konfigurasi identitas bisnis vendor pernikahan, informasi legal, rekening bank penerima resmi, pengunggahan logo perusahaan, tanda tangan digital verifikator, konfigurasi tahapan status acara kustom, serta pengaturan kategori acara internal.
- **Data yang Dikelola**:
  - `Profile`: Nama perusahaan / vendor studio, alamat lengkap studio, email bisnis, nomor telepon resmi, logo bisnis (Base64), tanda tangan digital admin (Base64), rekening bank utama penerima pembayaran, nama pemilik rekening, projectTypes (kategori acara: Wedding, Prewedding, Siraman, Lamaran, Engagement, Event Korporat).
  - `ProjectStatusConfig[]`: Konfigurasi warna hex dan urutan alur status acara.
- **Fitur Utama**:
  1. Formulir informasi profil perusahaan dan legalitas usaha.
  2. Uploader logo bisnis dengan preview instan yang otomatis disematkan pada seluruh dokumen Invoice, Kwitansi, dan Slip Gaji.
  3. Uploader tanda tangan digital admin (`authorizedSigner`).
  4. Manajemen warna dan urutan tahapan status acara pernikahan (*Custom Status Pipeline*).
- **Daftar Tombol & Fungsinya**:
  - `Tombol Unggah Logo Perusahaan`: Memilih dan mengonversi file gambar logo menjadi Base64.
  - `Tombol Unggah Tanda Tangan Resmi`: Memilih gambar tanda tangan atau menggambar langsung di canvas.
  - `Tombol Tambah Jenis Acara (+ Kategori)`: Menambahkan tipe acara baru (misal: "Foto Maternity", "Wisuda").
  - `Tombol Hapus Jenis Acara`: Menghapus tipe acara yang tidak lagi dilayani.
  - `Tombol Simpan Pengaturan`: Menyimpan seluruh konfigurasi profil ke database aplikasi.
- **Hubungan Antar Halaman**:
  - Data profil ini menjadi kepala surat (kop dokumen) resmi di `PaymentSlipDocument` (Slip Gaji di `TeamPage`), `InvoicePage`, dan `ReceiptModal`.

---

### Halaman 14: Portal Publik (Client Portal, Freelance Portal, Gallery Upload)

- **Rute**: `/portal/:token`, `/freelancer-portal/:token`, `/gallery/:token`
- **Tujuan Halaman**: Halaman mandiri tanpa login admin (*token-based authenticated public views*) untuk pengantin, mitra tim kerja, dan tamu:
  - `Client Portal`: Pasangan pengantin dapat memantau rundown hari H, status pengerjaan editing foto/video, rincian invoice, riwayat pembayaran kwitansi, dan link galeri unduh hasil foto.
  - `Freelancer Portal`: Fotografer/videografer dapat memeriksa jadwal acara yang ditugaskan kepada mereka, lokasi venue, jam hadir (call time), status pembayaran honor, serta mengunduh slip gaji mereka sendiri.
  - `Gallery Upload`: Area untuk mengunggah dan menampilkan hasil preview dokumentasi acara.
- **Daftar Tombol & Fungsinya**:
  - `Tombol Unduh Dokumen (PDF)`: Mengunduh invoice, rundown, atau slip gaji langsung ke perangkat pengantin/freelancer.
  - `Tombol Hubungi Admin (WA)`: Membuka chat WhatsApp konfirmasi ke admin studio.
  - `Tombol Konfirmasi Kehadiran (RSVP/Briefing Tim)`: Anggota tim mengonfirmasi kesiapan hadir pada hari H acara.

---

## 3. Matriks Hubungan Antar Data & Halaman (Cross-Feature Linkages)

```
[Calon Pengantin (Leads)] 
       │ (Konversi Prospek)
       ▼
[Pengantin (Clients)] ─────────► [Acara Pernikahan (Projects)] ◄────────► [Kalender Acara (Calendar)]
       │                                     │                                      │
       │ (Catat Pembayaran)                  │ (Tugaskan Tim / Fee)                 │ (Jadwal Kerja Tim)
       ▼                                     ▼                                      ▼
[Finansial: Kas Masuk]                [Tim & Mitra (Team & Freelancers)] ◄──────────┘
       │                                     │
       │                                     │ (Bayar Honor / Terbitkan Slip Gaji)
       ▼                                     ▼
[Finansial: Rekening & Kantong] ◄───── [Finansial: Kas Keluar / Payroll Slip Gaji]
```

---

## 4. Ringkasan Status Bisnis Aplikasi

1. **Status Pembayaran (`PaymentStatus`)**:
   - `LUNAS` (Hijau `#13DEB9`): Seluruh nilai kontrak telah terbayar penuh.
   - `DP_TERBAYAR` (Kuning `#FFAE1F`): Uang muka telah masuk, sisa tagihan masih aktif.
   - `BELUM_BAYAR` (Merah `#FA896B`): Belum ada pembayaran yang terekam sama sekali.
2. **Status Prospek (`LeadStatus`)**:
   - `DISCUSSION` (Biru `#3B82F6`): Tahap konsultasi awal & tanya harga.
   - `FOLLOW_UP` (Ungu `#8B5CF6`): Menunggu konfirmasi tanggal/paket dari calon pengantin.
   - `CONVERTED` (Hijau `#10B981`): Berhasil deal dan dibuatkan acara resmi.
   - `REJECTED` (Merah `#EF4444`): Calon pengantin membatalkan minat atau tanggal bentrok.
3. **Status Penugasan Tim (`TeamPaymentStatus`)**:
   - `Unpaid`: Tugas acara telah selesai atau dijadwalkan, namun honor belum dicairkan.
   - `Paid`: Honor telah dibayarkan melalui modul slip gaji dan terekam di kas keluar.
