-- Migration: Enable RLS Policies for dp-proofs Storage Bucket
-- Memperbolehkan public untuk upload, view, update, dan delete bukti transfer DP

-- 1. Policy untuk SELECT (Melihat / mengunduh file)
DROP POLICY IF EXISTS "Public Select dp-proofs" ON storage.objects;
CREATE POLICY "Public Select dp-proofs"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'dp-proofs');

-- 2. Policy untuk INSERT (Mengupload file baru)
DROP POLICY IF EXISTS "Public Insert dp-proofs" ON storage.objects;
CREATE POLICY "Public Insert dp-proofs"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'dp-proofs');

-- 3. Policy untuk UPDATE (Memperbarui / menimpa file yang sudah ada)
DROP POLICY IF EXISTS "Public Update dp-proofs" ON storage.objects;
CREATE POLICY "Public Update dp-proofs"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id = 'dp-proofs');

-- 4. Policy untuk DELETE (Menghapus file saat bukti transfer dihapus)
DROP POLICY IF EXISTS "Public Delete dp-proofs" ON storage.objects;
CREATE POLICY "Public Delete dp-proofs"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'dp-proofs');
