-- Add editable banner content to the public vendor profile page.
ALTER TABLE public.vendor_profiles
    ADD COLUMN IF NOT EXISTS page_banner_title TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS page_banner_subtitle TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS page_banner_image_url TEXT NOT NULL DEFAULT '';

NOTIFY pgrst, 'reload schema';
