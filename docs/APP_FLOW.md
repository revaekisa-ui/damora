# ALUR OPERASIONAL & DIAGRAM INTERAKSI APLIKASI (APP FLOW)

> **Catatan Dokumen**: Dokumen ini mendokumentasikan alur kerja end-to-end aplikasi manajemen vendor pernikahan berdasarkan arsitektur kode dan logika bisnis aktual di repository. Seluruh diagram dan tahapan menjelaskan interaksi data lintas modul, sinkronisasi state antar komponen, serta prioritas pengalaman pengguna berbasis **MOBILE-FIRST**.

---

## 1. Diagram Alur Utama End-to-End (High-Level Operational Flow)

```
[1. LEAD / PROSPEK MASUK]
  ├─ Sumber: WhatsApp, Instagram, Website, Telepon, Form Rekomendasi
  ▼
[2. KUALIFIKASI & FOLLOW UP]
  ├─ Diskusi Kebutuhan, Cek Jadwal Tanggal Acara di Kalender, Negosiasi Paket & Add-on
  ▼
[3. KONVERSI PROSPEK (CONVERT LEAD)]
  ├─ Input Paket + Add-on + Diskon Promo
  ├─ Hitung Nilai Kontrak, Set Uang Muka (DP), Pilih Rekening Kas Penampung
  ▼
  ├─── Otomatis Menghasilkan:
  │    ├─ Data Pengantin Baru (Clients)
  │    ├─ Data Acara Pernikahan Aktif (Projects)
  │    ├─ Tagihan & Invoice Resmi (Invoices)
  │    └─ Transaksi Kas Masuk DP (Finance Income & Saldo Kartu Bertambah)
  ▼
[4. OPERASIONAL & PERSIAPAN ACARA (PROJECT CONTROL)]
  ├─ Sinkronisasi Jadwal di Kalender (Bulan, Minggu, Hari, Agenda, Timeline Tim)
  ├─ Penugasan Anggota Tim / Freelancer & Setup Nominal Honor (Team Project Payment)
  ├─ Checklist Persiapan Teknis & Briefing Hari H
  ├─ Kontrak Kerja Sama & Tanda Tangan Digital Pengantin
  ├─ Tautan Portal Publik Pengantin (Client Portal via QR / Link)
  ▼
[5. EKSEKUSI HARI H (WEDDING DAY)]
  ├─ Briefing kru & checklist operasional di venue
  ├─ Pelunasan Sisa Tagihan Pengantin (Kwitansi Resmi & Kas Masuk)
  ▼
[6. PASCA ACARA & PAYROLL / SLIP GAJI TIM]
  ├─ Pelacakan Honor Belum Lunas (Team Unpaid Tab)
  ├─ Pemilihan Acara & Pembayaran Honor (Multi-Project Selection)
  ├─ Pembuatan Slip Gaji Resmi (Payment Slip Document)
  ├─ Pembubuhan Tanda Tangan Digital Verifikator (Signature Pad)
  ├─ Unduh PDF Slip Gaji & Kirim ke WhatsApp Freelancer / Akses via Portal Freelance
  ├─ Otomatis Merekam Transaksi Kas Keluar (Finance Expense & Saldo Berkurang)
  ▼
[7. PENUTUPAN FINANSIAL & EVALUASI]
  ├─ Laporan Laba Rugi Acara Pernikahan (Revenue Kontrak vs Total Honor & Operasional)
  ├─ Pengalokasian Laba Bersih ke Kantong Anggaran (Financial Pockets)
  └─ Penerimaan Feedback & Rating Pengantin (Client Feedback)
```

---

## 2. Rincian Alur per Modul Bisnis

---

### Alur A: Calon Pengantin (Leads) → Konversi → Pengantin & Acara Baru

1. **Pencatatan Calon Pengantin Baru**:
   - **Tindakan Pengguna**: Menekan tombol `+ Lead Baru` di halaman `/leads` (atau menekan FAB di smartphone).
   - **Input Data**: Nama calon pengantin, saluran kontak (`ContactChannel`), nomor WhatsApp aktif, rencana tanggal acara, kota/lokasi, alamat gedung venue, dan catatan preferensi.
   - **Status Awal**: Otomatis berstatus `Sedang Diskusi (DISCUSSION)`.
2. **Kualifikasi & Cek Ketersediaan**:
   - Admin memeriksa tanggal rencana acara di `/calendar` (apakah ada bentrok acara lain atau keterbatasan fotografer).
   - Melalui tombol WhatsApp satu sentuhan di mobile card, admin mengirimkan salam pembuka dan rincian katalog paket layanan.
3. **Tahap Follow-Up**:
   - Status prospek dipindahkan ke `Menunggu Follow Up (FOLLOW_UP)`. Sistem mencatat jumlah hari sejak kontak pertama (*"2 hari lalu"*).
4. **Proses Konversi Cerdas (`ConvertLeadModal`)**:
   - **Pemicu**: Admin menekan tombol `Konversi` pada kartu lead.
   - **Formulir Konversi Dua Kolom**:
     - *Kolom Pengantin & Acara*: Memvalidasi nama pengantin, jenis pengantin, nomor kontak, nama acara pernikahan, jenis acara, tanggal fix, dan lokasi gedung.
     - *Kolom Finansial & Paket*: Memilih paket layanan (`Package`), memilih layanan tambahan (`AddOn` multi-select), memilih kode promo diskon (`PromoCode`), memasukkan nominal uang muka (DP), dan memilih rekening bank penampung DP (`Card`).
   - **Kalkulasi Otomatis di Layar**:
     $$\text{Total Kontrak} = (\text{Harga Paket} + \text{Total Add-On}) - \text{Diskon Promo}$$
     $$\text{Sisa Tagihan} = \text{Total Kontrak} - \text{Uang Muka (DP)}$$
5. **Dampak Otomatis Multi-Modul (Multi-Table Mutation)**:
   - Status lead berganti menjadi `Dikonversi (CONVERTED)`.
   - Record `Client` baru otomatis tercipta di database kien.
   - Record `Project` baru otomatis tercipta di database acara dengan status `Booking Confirmed` dan payment status `DP_TERBAYAR` (atau `LUNAS` jika DP penuh).
   - Record `Transaction` bertipe `INCOME` otomatis tercipta di database finansial dengan nomor kwitansi otomatis.
   - Saldo rekening bank (`Card.currentBalance`) yang dipilih bertambah sebesar nominal DP secara *real-time*.

---

### Alur B: Pengelolaan Pengantin (Clients), Tagihan & Portal Pengantin

1. **Akses Data Pengantin di Mobile & Desktop**:
   - Di smartphone: Setiap pengantin disajikan dalam kartu sentuh ringkas dengan foto avatar, status lunas, nominal sisa tagihan, dan tombol WhatsApp instan.
   - Di desktop: Tabel komprehensif dengan pengurutan piutang terbesar.
2. **Pencatatan Pembayaran Bertahap / Pelunasan**:
   - Admin membuka `ClientDetailModal` -> Tab `Pembayaran`.
   - Admin memilih acara pengantin yang bersangkutan, memasukkan nominal uang masuk di `RupiahInput`, dan memilih rekening tujuan transfer.
   - Sistem memvalidasi bahwa nominal tidak melebihi sisa tagihan.
   - Saat disimpan:
     - Total terbayar pada acara dan pengantin bertambah.
     - Sisa tagihan berkurang. Jika sisa tagihan menjadi Rp 0, status otomatis berubah menjadi `LUNAS (PaymentStatus.LUNAS)`.
     - Transaksi kas masuk baru otomatis tercatat di modul finansial.
3. **Penerbitan Kwitansi & Invoice**:
   - Admin dapat menekan tombol `Kwitansi` untuk setiap pembayaran yang masuk. Sistem memuat `ReceiptModal` berformat cetak resmi dengan nomor kwitansi unik.
   - Admin dapat menekan tombol `Invoice` untuk mencetak faktur tagihan lengkap dengan rincian paket dan petunjuk rekening bank perusahaan.
4. **Berbagi Portal Pengantin Mandiri**:
   - Admin menekan tombol `Bagikan Portal Pengantin`.
   - Sistem memunculkan modal QR Code dan tombol salin tautan unik (`/portal/:token`).
   - Pengantin membuka link dari ponsel mereka tanpa perlu login, dapat memantau rundown acara, melihat status pengerjaan, memeriksa invoice, dan mengakses link galeri foto.

---

### Alur C: Acara Pernikahan (Projects / Event Control Center)

1. **Monitoring Alur Acara**:
   - Admin memantau seluruh acara melalui mode List, Kanban Board, atau Kalender.
   - Tahapan acara: `Booking Confirmed` -> `Technical Meeting` -> `Ready for Wedding Day` -> `Wedding Day Execution` -> `Post-Production / Editing` -> `Completed`.
2. **Penugasan Tim & Mitra Vendor (Assigning Crew)**:
   - Di dalam detail acara (tab *Tim Bertugas*), admin menugaskan fotografer, videografer, asisten, atau pilot drone.
   - Admin menentukan besaran honor (fee) untuk masing-masing peran pada acara tersebut.
   - Record `TeamProjectPayment` tercipta dengan status awal `Unpaid`.
   - Jadwal penugasan kru langsung tampil di Kalender Tim (`Team Timeline View`).
3. **Biaya Tambahan di Lapangan (Custom Charges)**:
   - Jika terdapat permintaan ekstra dari pengantin di lapangan (misal: lembur jam kerja, sewa lighting tambahan), admin menekan `+ Biaya Tambahan`.
   - Sistem memperbarui total tagihan acara dan menyesuaikan status pembayaran menjadi belum lunas atas selisih biaya tersebut.
4. **Wedding Day Checklist**:
   - Kru dapat membuka checklist teknis dari ponsel: kelengkapan baterai, memory card terformat, lensa bersih, cetakan rundown, kontak darurat WO.

---

### Alur D: Kalender Acara (Calendar Management)

1. **Penyajian Jadwal Lintas Sudut Pandang**:
   - Pengguna memilih tampilan kalender: Bulan, Minggu, Hari, Agenda, Tim, atau Pengantin.
2. **Deteksi Bentrok Jadwal**:
   - Setiap kotak tanggal pada kisi bulan menampilkan jumlah acara dan titik warna status. Jika lebih dari 2 acara berlangsung pada tanggal yang sama, penanda bentrok/kepadatan jadwal akan aktif.
3. **Side Panel Detail Cepat**:
   - Klik pada tanggal langsung membuka drawer side panel kanan (atau bottom sheet di ponsel) yang mencantumkan seluruh jadwal pada hari tersebut lengkap dengan jam mulai dan lokasi gedung.
4. **Sinkronisasi Kalender Luar**:
   - Admin menekan tombol `Ekspor .ICS` untuk mengunduh seluruh jadwal kerja ke Google Calendar, Outlook, atau kalender iPhone kru.

---

### Alur E: Manajemen Tim, Mitra Freelance & Alur Payroll / Slip Gaji

Alur ini merupakan inti operasional keuangan tenaga kerja vendor pernikahan:

```
[1. FILTER ACARA SELESAI & TUGAS TIM]
  ▼
[2. BUKA TAB FEE BELUM LUNAS (TEAM UNPAID TAB)]
  ├─ Sistem menampilkan seluruh honor tertunggak dari semua acara
  ▼
[3. PILIH ANGGOTA TIM / MITRA FREELANCE]
  ├─ Buka Modal Detail Anggota Tim -> Tab "Buat Pembayaran"
  ▼
[4. MULTI-SELECT TUGAS / PROYEK]
  ├─ Centang satu atau beberapa acara yang akan dibayarkan honornya sekaligus
  ├─ Sistem mengkalkulasi akumulasi total fee secara otomatis
  ▼
[5. INPUT PEMBAYARAN & PILIH SUMBER KAS]
  ├─ Masukkan nominal bayar (Lunas penuh atau Parsial)
  ├─ Pilih Rekening Bank Pengirim (Card) atau Kantong Anggaran (Pocket: Gaji Tim)
  ▼
[6. TERBITKAN SLIP GAJI RESMI (PAYMENT SLIP DOCUMENT)]
  ├─ Nomor slip gaji dibuat otomatis (misal: #SLIP-2026-0034)
  ├─ Rincian acara, peran kru, dan nominal fee ditampilkan rapi dalam tata letak A4
  ▼
[7. BUBURKAN TANDA TANGAN DIGITAL]
  ├─ Buka SignaturePad -> Tanda tangan sentuh di layar -> Simpan ke dokumen
  ▼
[8. CETAK / UNDUH PDF & BAGIKAN]
  ├─ Generate PDF resolusi tinggi via PDFViewer
  ├─ Unduh file PDF slip gaji ke ponsel/laptop
  ├─ Kirim dokumen ke WhatsApp freelancer bersangkutan
  ▼
[9. MUTASI OTOMATIS KE KEUANGAN]
  ├─ Status penugasan berubah menjadi Paid
  ├─ Saldo rekening bank / kantong terpilih terpotong
  └─ Transaksi pengeluaran kas (EXPENSE) baru otomatis tercatat di modul Finansial
```

---

### Alur F: Finansial, Kantong Anggaran & Laba Rugi

1. **Manajemen Rekening (Cards)**:
   - Admin mendaftarkan rekening bank (BCA, Mandiri), dompet digital (GoPay, OVO), dan Kas Tunai Studio.
   - Transaksi transfer antar rekening dapat dilakukan tanpa mengubah total aset bersih bisnis.
2. **Sistem Amplop / Kantong Anggaran (Budget Pockets)**:
   - Pendapatan yang masuk dialokasikan ke pos-pos khusus: *Operasional (40%)*, *Gaji Tim (30%)*, *Tabungan Upgrade Kamera/Lensa (15%)*, *Laba Bersih Pemilik (15%)*.
   - Saat pembayaran gaji dilakukan di `TeamPage`, kas dapat dipotong langsung dari kantong *Gaji Tim*.
3. **Laporan Laba Rugi per Acara Pernikahan (`EventProfitabilityTab`)**:
   - Untuk setiap acara pernikahan yang telah selesai:
     $$\text{Pendapatan Masuk} - \text{Total Fee Tim Dibayar} - \text{Biaya Operasional Kustom} = \text{Laba Bersih Acara}$$
   - Memberikan visibilitas instan apakah sebuah acara pernikahan menguntungkan atau mengalami pembengkakan biaya kru.
4. **Ekspor Laporan Mutasi**:
   - Admin dapat mengekspor laporan transaksi kas ke file CSV kapan saja untuk keperluan pembukuan akuntan atau audit pajak tahunan.

---

## 3. Matriks Alur Interaksi Sentuh Mobile (Mobile-First Touch Journeys)

| Interaksi Pengguna Mobile | Komponen Layar Sentuh | Reaksi Sistem & Navigasi |
| :--- | :--- | :--- |
| **Buka Menu Cepat** | Bottom Navigation Bar (Jempol bawah) | Pindah antar Dashboard, Kalender, Acara, Pengantin, dan Menu Lainnya. |
| **Tambah Data Kilat** | Floating Action Button (FAB) | Membuka Bottom Sheet Form input acara baru atau transaksi kas baru. |
| **Hubungi Pengantin / Tim** | Tombol Icon WhatsApp Hijau pada Kartu | Membuka aplikasi WhatsApp langsung dengan nomor format internasional (+62). |
| **Periksa Dokumen Slip Gaji** | Kartu Riwayat Pembayaran -> Icon Mata | Membuka Modal PDF Viewer layar penuh dengan tombol tanda tangan & unduh. |
| **Tanda Tangan Digital** | Layar canvas modal `SignaturePad` | Menggambar tanda tangan langsung dengan ujung jari atau stylus pen. |
| **Periksa Jadwal Harian** | Tanggal pada kisi kalender | Membuka lembar jadwal hari tersebut dari dasar layar (*bottom drawer*). |

---

## 4. Keandalan Data, Proteksi Integritas & Error Handling

1. **Validasi Jumlah Pembayaran**:
   - Sistem menolak input pembayaran pengantin yang melebihi sisa tagihan acara untuk mencegah salah hitung atau saldo piutang minus.
2. **Proteksi Integritas Relasional (Cascade Protection)**:
   - Pengantin yang masih memiliki acara pernikahan aktif tidak dapat dihapus sembarangan.
   - Transaksi keuangan yang terikat pada acara atau pembayaran gaji tim dilindungi agar buku besar kas tidak menjadi tidak seimbang (*unbalanced ledger*).
3. **Rollback Transaksi**:
   - Menghapus transaksi kas keluar atau kas masuk akan secara otomatis mengembalikan (*reverse/rollback*) saldo rekening bank ke posisi semula sebelum transaksi dicatat.
4. **Pencegahan Zooming Ponsel**:
   - Seluruh input form di mobile memiliki ukuran font minimum 16px sehingga browser Safari iOS dan Chrome Android tidak melakukan zooming otomatis yang merusak tata letak layar.
