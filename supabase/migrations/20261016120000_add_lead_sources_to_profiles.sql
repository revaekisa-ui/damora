-- Add customizable "Sumber Calon Pengantin" (lead sources) list to profiles.
-- Mirrors other category columns (project_types, package_categories, ...) managed from
-- Pengaturan > Kustomisasi Kategori.
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS lead_sources JSONB DEFAULT '[]'::jsonb;

-- No RLS changes needed — profile rows are already RLS-scoped per admin_user_id.
NOTIFY pgrst, 'reload schema';
