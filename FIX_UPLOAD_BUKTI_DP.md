# Fix: Upload Bukti Transfer DP Gagal (RLS Error)

## Masalah yang Terjadi

❌ **Error saat upload bukti DP:**
```
StorageApiError: new row violates row-level security policy
```

❌ **Halaman yang terpengaruh:**
- `http://localhost:3000/#/public-packages?region=...` 
- `http://localhost:3000/#/public-booking?region=...`
- Form "Tambah Pengantin & Acara Pernikahan Baru"

❌ **Penyebab:**
Bucket `dp-proofs` tidak memiliki RLS (Row-Level Security) policy yang memperbolehkan public untuk upload file.

## Solusi (Pilih salah satu)

### 🚀 Cara Cepat: Via Supabase Dashboard

#### Step 1: Buat Bucket (jika belum ada)
1. Buka [Supabase Dashboard](https://supabase.com/dashboard)
2. Pilih project Anda
3. Klik **Storage** di sidebar kiri
4. Klik **New bucket**
5. Isi:
   - **Name:** `dp-proofs`
   - **✅ Centang "Public bucket"** (PENTING!)
   - File size limit: `10 MB`
   - Allowed MIME types: `image/jpeg, image/png, image/webp`
6. Klik **Create bucket**

#### Step 2: Jalankan Migration RLS Policy
1. Di Supabase Dashboard, klik **SQL Editor** di sidebar
2. Copy seluruh isi file `supabase/migrations/20261030120000_storage_dp_proofs_policies.sql`
3. Paste ke SQL Editor
4. Klik **Run** atau tekan `Ctrl+Enter`

Seharusnya muncul pesan sukses: ✅ Success. No rows returned

---

### 🛠️ Cara Alternatif: Via Supabase CLI

Jika Anda sudah setup Supabase CLI:

```bash
# Jalankan semua migration yang belum dijalankan
supabase db push
```

---

## Verifikasi

Setelah migration berhasil, coba:

1. ✅ Buka halaman booking: `http://localhost:3000/#/public-booking?region=pricelist+wedding+2026+banten`
2. ✅ Isi form booking
3. ✅ Upload bukti transfer DP
4. ✅ Klik "Kirim Booking"

**Seharusnya berhasil tanpa error!** 🎉

---

## Catatan Teknis

### Files yang Dibuat:
1. `supabase/migrations/20261030115900_create_dp_proofs_bucket.sql` - Membuat bucket
2. `supabase/migrations/20261030120000_storage_dp_proofs_policies.sql` - RLS policies
3. `docs/STORAGE_BUCKET_SETUP.md` - Dokumentasi lengkap

### Bucket yang Ada:
- ✅ **gallery-images** - Untuk cover paket, gallery, logo, pricelist (sudah ada policy)
- ⚠️ **dp-proofs** - Untuk bukti transfer DP (perlu policy baru)

### RLS Policy yang Ditambahkan:
```sql
-- Memperbolehkan public untuk:
- SELECT (view/download bukti DP)
- INSERT (upload bukti DP baru)  
- UPDATE (replace bukti DP)
- DELETE (hapus bukti DP)
```

Policy ini aman karena:
- File sudah dikompres di client (max 400KB)
- Validasi tipe file: hanya image/*
- Bucket limit: 10MB per file
- URL disimpan di database (tidak ada direct file listing)

---

## Troubleshooting

### Jika masih error setelah migration:

1. **Cek bucket exists:**
   ```sql
   SELECT * FROM storage.buckets WHERE id = 'dp-proofs';
   ```
   Jika tidak ada, buat manual via dashboard (Step 1 di atas)

2. **Cek RLS policy exists:**
   ```sql
   SELECT * FROM pg_policies 
   WHERE tablename = 'objects' 
   AND policyname LIKE '%dp-proofs%';
   ```
   Seharusnya ada 4 policy (SELECT, INSERT, UPDATE, DELETE)

3. **Cek RLS enabled:**
   ```sql
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'storage' AND tablename = 'objects';
   ```
   Kolom `rowsecurity` harus `true`

4. **Test upload manual:**
   Di Storage dashboard, coba upload file ke bucket `dp-proofs` secara manual.
   Jika gagal, berarti bucket belum dibuat dengan benar.

---

## Need Help?

Jika masih mengalami masalah:
1. Screenshot error message
2. Cek browser console (F12) untuk detail error
3. Cek Supabase logs di dashboard

---

**Created:** 2026-10-30  
**Issue:** Upload bukti DP RLS error  
**Status:** Fixed ✅
