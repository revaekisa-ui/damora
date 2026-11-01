# Setup Storage Buckets untuk Supabase

## Masalah yang Ditemukan

Upload bukti transfer DP gagal dengan error:
```
StorageApiError: new row violates row-level security policy
```

Ini terjadi karena bucket `dp-proofs` tidak memiliki RLS policy yang memperbolehkan public untuk upload.

## Solusi

### 1. Pastikan Bucket `dp-proofs` Sudah Ada

Di Supabase Dashboard:
1. Buka **Storage** → **Buckets**
2. Jika bucket `dp-proofs` belum ada, klik **New bucket**
3. Masukkan nama: `dp-proofs`
4. **PENTING**: Centang **Public bucket** agar file bisa diakses publik
5. Klik **Create bucket**

### 2. Jalankan Migration RLS Policy

Migration file sudah dibuat di:
```
supabase/migrations/20261030120000_storage_dp_proofs_policies.sql
```

Untuk menjalankannya:

**Opsi A: Via Supabase Dashboard**
1. Buka **SQL Editor** di Supabase Dashboard
2. Copy isi file migration tersebut
3. Paste dan jalankan

**Opsi B: Via Supabase CLI** (jika sudah setup)
```bash
supabase db push
```

### 3. Verifikasi

Setelah migration dijalankan, coba upload bukti transfer DP lagi di:
- `http://localhost:3000/#/public-packages` 
- `http://localhost:3000/#/public-booking`

Upload seharusnya berhasil tanpa error RLS.

## Bucket yang Digunakan di Aplikasi

1. **`gallery-images`** ✅ Sudah ada policy
   - Cover paket
   - Gallery/Portfolio
   - Logo & Signature profil
   - PDF Pricelist

2. **`dp-proofs`** ⚠️ Perlu ditambahkan policy (migration baru)
   - Bukti transfer DP dari client
   - Upload di halaman booking publik

## Catatan Keamanan

RLS policy yang dibuat memperbolehkan **public** untuk INSERT, SELECT, UPDATE, dan DELETE di bucket `dp-proofs`. Ini diperlukan karena:
- Form booking adalah halaman publik (tidak memerlukan auth)
- Client harus bisa upload bukti transfer tanpa login
- URL public diperlukan untuk ditampilkan di invoice & dashboard admin

Untuk keamanan tambahan di masa depan, pertimbangkan:
- Menambahkan validasi ukuran file di policy (saat ini sudah ada di client)
- Menambahkan validasi tipe file di policy (hanya image/*)
- Menambahkan rate limiting untuk mencegah abuse
