-- Migration: Enable RLS Policies for gallery-images Storage Bucket
-- Memperbolehkan upload, view, update, dan delete di bucket gallery-images

-- 1. Policy untuk SELECT (Melihat / mengunduh file)
DROP POLICY IF EXISTS "Public Select gallery-images" ON storage.objects;
CREATE POLICY "Public Select gallery-images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'gallery-images');

-- 2. Policy untuk INSERT (Mengupload file baru)
DROP POLICY IF EXISTS "Public Insert gallery-images" ON storage.objects;
CREATE POLICY "Public Insert gallery-images"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'gallery-images');

-- 3. Policy untuk UPDATE (Memperbarui / menimpa file yang sudah ada)
DROP POLICY IF EXISTS "Public Update gallery-images" ON storage.objects;
CREATE POLICY "Public Update gallery-images"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id = 'gallery-images');

-- 4. Policy untuk DELETE (Menghapus file saat gambar/PDF dihapus)
DROP POLICY IF EXISTS "Public Delete gallery-images" ON storage.objects;
CREATE POLICY "Public Delete gallery-images"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'gallery-images');
