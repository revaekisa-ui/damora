# Audit Query Supabase dan Database

Tanggal audit: 26 Oktober 2026

## Ruang lingkup dan batas audit

Audit statis mencakup query Supabase di `src/services`, hook/query React di `src/hooks` dan `src/contexts`, pemanggilan database dari Edge Functions, serta migration yang tersedia di `supabase/migrations`. Proyek tidak memiliki `supabase/config.toml` atau `supabase/schemas/`; struktur yang dapat diverifikasi hanya struktur yang tersirat dari migration dan pemakaian kolom di kode. CLI Supabase tersedia (2.120.0), tetapi tidak ada konfigurasi local project untuk menjalankan query atau `EXPLAIN` terhadap database. Karena itu, ukuran tabel, indeks remote, kebijakan RLS lengkap, dan rencana eksekusi belum dapat diverifikasi.

Workspace saat audit sudah berisi perubahan lokal yang belum di-commit pada sejumlah file query, provider, dan halaman. Temuan di bawah menggambarkan keadaan file saat ini dan perubahan audit tidak boleh menghapus atau menimpa perubahan tersebut.

## Ringkasan

| Prioritas | Temuan | Dampak |
| --- | --- | --- |
| Tinggi | Provider memulai banyak query domain serentak ketika aplikasi authenticated dibuka | Login pertama menunggu banyak round-trip dan payload, termasuk data yang belum diperlukan halaman aktif |
| Tinggi | Sebagian besar daftar global hanya mengambil satu batch terbatas tanpa UI pagination server-side | Data di luar batch tidak terlihat pada halaman, statistik, pencarian, atau laporan; menaikkan limit bukan solusi skala |
| Tinggi | Query proyek mengambil `*` dan tiga query relasi per batch | Payload kolom berlebih dan biaya request tetap bertambah per batch |
| Tinggi | Paket memakai `select('*')`; `cover_image` dapat berupa base64 | Potensi payload terbesar pada cold start; sekaligus memuat data gambar saat layar mungkin hanya butuh nama/harga |
| Sedang | Kalender, pembayaran tim, slip pembayaran, feedback, notifikasi, katalog, dan beberapa daftar publik tidak dibatasi | Response tumbuh seiring tabel dan dapat terpotong oleh batas maksimum API |
| Sedang | Ada fungsi pagination klien/proyek/tim, tetapi tidak ditemukan pemanggilnya dari halaman | Implementasi service saja belum memberi pagination kepada pengguna |
| Sedang | Pencarian klien/proyek membangun ekspresi `.or()` dari teks pencarian | Karakter khusus PostgREST dapat mengubah makna pencarian atau menyebabkan error; escape input perlu konsisten |
| Sedang | Sinkronisasi status klien membaca seluruh status proyek per klien dan dipanggil per klien yang berubah | Biaya membesar pada batch edit; query bisa menjadi existence check yang lebih murah |
| Belum terverifikasi | Indexes, query plans, RLS untuk tabel inti | Migration yang tersedia tidak cukup untuk membuktikan kondisi database remote |

## Temuan rinci

### 1. Cold start menjalankan query lintas fitur

`src/contexts/SimplifiedDataContext.tsx` memasang query klien, proyek, anggota tim, transaksi, leads, kartu, kantong, paket, add-on, attire, kalender, feedback, dan statistik sekaligus. `src/hooks/useAuxiliaryData.ts` menambah profil, kode promo, pembayaran tim, slip pembayaran, dan notifikasi. Route publik ringan sudah memiliki gating, tetapi route authenticated tetap menjalankan mayoritas query bersama.

**Dampak:** login pertama tanpa cache mengirim belasan request bersamaan. Waktu tampil halaman mengikuti request terlama, dan tabel berukuran besar/kolom gambar memperbesar egress. Cache lokal memperbaiki kunjungan berikutnya, bukan login pertama.

**Perbaikan yang disarankan:** aktifkan query per domain saat route/fitur membutuhkan datanya; prioritaskan data penting untuk route awal. Pertahankan data silang yang benar-benar dipakai tiap halaman, dan use-case agregasi melalui RPC. Jangan sekadar mengubah global limit menjadi 10 sebelum tabel dan komputasi yang memerlukan seluruh dataset dipindah ke pagination/server aggregation.

### 2. Batas dan pagination daftar

- `src/hooks/queries.ts`: `DEFAULT_LIMIT = 100`; klien, proyek, transaksi, tim, dan leads diminta sebanyak 100 baris.
- `src/services/clients.ts:listClients`, `src/services/projects.ts:listProjects`, dan `src/services/teamMembers.ts:listTeamMembers` memberi batas, tetapi default layanan klien 100 dan proyek/tim 50. Hook menimpa default ini menjadi 100.
- `src/services/transactions.ts:listTransactions` hanya membatasi bila caller mengirim `limit`; hook mengirim 100, tetapi pemanggil lain dapat meminta tanpa batas.
- `src/services/leads.ts:listLeads` hanya membatasi bila `limit` diberikan.
- `listClientsPaginated`, `listProjectsPaginated`, dan `listTeamMembersPaginated` tersedia, tetapi pencarian referensi statis tidak menemukan pemanggil halaman.

**Dampak:** UI dapat tampak memiliki pagination lokal tetapi hanya membolak-balik batch pertama, atau daftar/report kehilangan baris setelah batas batch. Untuk memenuhi 10/20/50, pagination harus menyertakan page size, offset/cursor, filter, sort, count strategy, dan key React Query pada UI pemanggilnya.

**Sebelum/sesudah yang diinginkan:** `listClients({limit: 100})`/array global → `listClientsPage({page, pageSize: 10|20|50, search, filters})` dengan batas maksimum 50, urutan stabil, dan query count terpisah/opsional. Terapkan pola sama hanya pada daftar yang ditampilkan; data agregat harus dihitung di database atau dipaginasi lengkap.

### 3. Payload proyek dan relasi

`src/services/projects.ts:listProjectsWithRelations` mengambil `projects.*` untuk maksimal 100 proyek, lalu melakukan tiga query tambahan untuk `project_team_assignments`, `project_add_ons`, dan `project_attire`. Pola ini bukan N+1 per proyek—relasi difetch per batch—tetapi kolom tabel proyek yang tidak dipakai tetap diunduh dan biaya relasi tetap tiga round-trip.

**Perbaikan:** tetapkan daftar kolom dasar dari field yang dipakai konsumen; buat mode include relasi berdasarkan layar; gunakan join selektif bila relasi/schema mendukung dan hasil plan membenarkannya. Pertahankan query batch agar tidak berubah menjadi N+1.

### 4. Payload besar dan pembacaan `*`

- `src/services/packages.ts:listPackages` menggunakan `select('*')`; normalizer membaca `cover_image`, daftar fisik/digital, opsi durasi, dan harga. Kolom `cover_image` dapat menyimpan data URL base64, sehingga dapat memperbesar cold-start secara material. File service sudah mengunggah gambar baru ke Storage saat mutasi, tetapi data lama tetap perlu diperiksa/migrasi terencana sebelum kolom tersebut dikeluarkan dari query.
- `src/services/calendarEvents.ts:listCalendarEvents` dan `listProjectMeetings` menggunakan `select('*')`; pembacaan rapat memfilter prefix `notes` lalu projectId difilter di klien.
- `src/services/teamProjectPayments.ts:listAllTeamPayments`, `src/services/teamPaymentRecords.ts:listTeamPaymentRecords`, `src/services/clientFeedback.ts:listClientFeedback`, `src/services/notifications.ts:listNotifications`, `src/services/cards.ts:listCards`, `src/services/pockets.ts:listPockets`, `src/services/addOns.ts:listAddOns`, `src/services/attire.ts:listAttire`, serta `src/services/promoCodes.ts:listPromoCodes` menggunakan `*` atau tidak membatasi jumlah baris.
- `src/services/galleries.ts:listGalleries`, `getGalleriesByRegion`, dan fallback pencarian gallery publik memakai `*`; daftar gallery penuh dapat berisi array `images`.
- `supabase/functions/google-calendar-feed/index.ts` memakai `select('*')` pada helper generic dengan pagination batch; perlu tabel/kolom whitelist per tabel karena feed hanya membutuhkan sebagian bidang.

**Perbaikan:** kolom eksplisit yang sesuai pemakaian, daftar metadata terpisah dari detail, dan paginasi backend. Untuk image/base64, verifikasi dahulu apakah data lama masih dibutuhkan; jangan menghapus atau mengubah data tanpa rencana migrasi dan persetujuan.

### 5. Pencarian dan filter

`listClientsPaginated` menggabungkan `name.ilike`, `email.ilike`, dan `phone.ilike` ke `.or()`; `listProjectsPaginated` melakukan hal serupa pada nama proyek, klien, dan lokasi. Nilai filter status/jenis diteruskan lewat builder `.eq()`, sedangkan pencarian `.or()` merupakan ekspresi PostgREST yang dirangkai sebagai string.

**Perbaikan:** escape karakter reserved PostgREST/LIKE secara benar dan validasi input/ukuran pencarian; debounce frontend; bila pencarian besar sering dipakai, ukur dan pertimbangkan indeks trigram atau endpoint pencarian yang sesuai. Jangan menambah indeks sebelum melihat selectivity dan rencana query.

### 6. Query berulang dan operasi tulis

`syncClientStatusFromProjects` membaca daftar semua status project untuk setiap clientId, kemudian memeriksa keberadaan status aktif di JavaScript. `useProjectForm.ts` dan `useProjectEditMode.ts` menjalankan operasi ini untuk setiap clientId yang terdampak. Operasi pembuatan/pembaruan proyek juga memiliki beberapa langkah lintas tabel; risiko konsistensi harus dinilai sebelum dikonsolidasikan ke RPC/transaksi.

**Perbaikan:** ubah status check menjadi `EXISTS`/`LIMIT 1` atau fungsi database yang aman, dan proses beberapa client dalam batch bila pola pemanggilan massal terkonfirmasi. Jangan mengubah perilaku transaksi bisnis tanpa pengujian konkuren dan RLS.

### 7. Statistik dan agregasi

Perubahan lokal saat ini mengarahkan `src/hooks/useDashboardStats.ts` ke Edge Function `dashboard-stats`, yang memanggil RPC `get_dashboard_stats`. Ini menghindari pengunduhan semua nilai transaksi untuk menghitung revenue/expense di klien dan merupakan arah yang tepat, selama fungsi RPC ada, benar, memakai hak akses sesuai model tenant, dan terukur. `project-analytics` juga memanggil RPC `get_project_analytics`.

**Validasi yang diperlukan:** migration/function definition untuk kedua RPC tidak ada dalam migration yang ditemukan, sehingga hasil, RLS, grants, dan execution plan belum dapat diaudit dari workspace ini.

## Indeks, RLS, dan keamanan

- Migration yang tersedia berjumlah terbatas dan tidak menunjukkan indeks eksplisit untuk filter/sort utama seperti `projects(date, id)`, `clients(since, id)`, `transactions(date, id)`, atau FK relasi. Ini rekomendasi untuk diperiksa terhadap plan dan statistik aktual, bukan instruksi untuk langsung membuat semua indeks.
- RLS tampak diaktifkan pada migration tertentu seperti `bio_link_pages`, `ui_text_overrides`, `attire`, `project_attire`, `google_calendar_feed_tokens`, dan Storage policy migration. Migration ini tidak membuktikan RLS pada semua tabel inti. Audit kebijakan memerlukan schema/policy remote aktual.
- Migration storage terakhir memberi policy operasi publik pada bucket `gallery-images`; tinjau scope `INSERT/UPDATE/DELETE` dan validasi folder/tenant sebelum mengubah. Jangan memperluas akses demi performa.
- Search API Supabase memakai query builder; tidak ditemukan penggabungan SQL mentah dari input pengguna. `.or()` yang dirangkai sebagai string tetap butuh escaping format PostgREST.
- Tidak ada `SELECT`/`DELETE`/`UPDATE` tanpa predicate pada jalur aplikasi utama yang teridentifikasi dari pencarian statis; semua operasi tulis harus tetap mempertahankan `.eq()`/filter kepemilikan dan RLS.

## Urutan perbaikan yang disarankan

1. Ukur request cold-start dan identifikasi payload terbesar; ubah query provider menjadi route/domain-scoped dengan data fallback cache.
2. Integrasikan pagination server-side 10/20/50 pada tabel klien, proyek, leads, tim, transaksi, dan log yang benar-benar berupa daftar; pertahankan filter/sort dalam query key.
3. Kurangi kolom proyek dan daftar lain; pisahkan metadata dari detail dan gambar.
4. Migrasikan `select('*')` yang masih relevan, batasi calendar/payment/notification/feedback sesuai use-case, dan paginasi daftar publik.
5. Benahi pencarian PostgREST, debounce, serta check status klien berbasis existence.
6. Ambil schema/policy remote, ukur `EXPLAIN (ANALYZE, BUFFERS)` dengan aman di environment yang tepat, baru ajukan migration indeks/RPC bila plan mendukung.

## Risiko dan verifikasi

Perubahan batas data tanpa pagination end-to-end akan menghilangkan data lama dari dropdown, perhitungan dashboard, laporan keuangan, pencarian dan relasi proyek. Mengganti `*` pada model lama berisiko menghilangkan kolom yang masih dibutuhkan; menyimpan `cover_image` lama memerlukan kompatibilitas. Perubahan query/RPC harus memvalidasi RLS dan isolasi tenant.

Belum ada optimasi query atau perubahan skema yang diterapkan dalam dokumen audit ini. Verifikasi plan/latensi remote belum bisa dilakukan tanpa koneksi database dan definisi schema/RPC aktual. Audit statis perlu dilanjutkan setelah akses schema/DB tersedia, kemudian perubahan UI pagination dan query dilakukan bertahap dengan verifikasi fungsi terkait.
