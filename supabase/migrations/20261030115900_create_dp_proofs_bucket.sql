-- Migration: Create dp-proofs Storage Bucket
-- Bucket untuk menyimpan bukti transfer DP dari client

-- Note: Bucket creation mungkin tidak bisa dilakukan via migration di beberapa versi Supabase.
-- Jika migration ini gagal, buat bucket secara manual di Supabase Dashboard:
-- Storage → New bucket → Nama: "dp-proofs" → Centang "Public bucket"

-- Cek apakah bucket sudah ada
DO $$
BEGIN
  -- Coba insert bucket baru jika belum ada
  INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  VALUES (
    'dp-proofs',
    'dp-proofs',
    true,  -- Public bucket agar bisa diakses via URL
    10485760,  -- 10MB limit
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  )
  ON CONFLICT (id) DO NOTHING;
  
  -- Log hasil
  IF FOUND THEN
    RAISE NOTICE 'Bucket dp-proofs berhasil dibuat';
  ELSE
    RAISE NOTICE 'Bucket dp-proofs sudah ada, skip creation';
  END IF;
END $$;
