ALTER TABLE public.projects
    ALTER COLUMN date DROP NOT NULL;


-- Add PDF metadata support for public pricelist galleries.
-- Safe to run repeatedly.

ALTER TABLE public.galleries
    ADD COLUMN IF NOT EXISTS pdf_url TEXT,
    ADD COLUMN IF NOT EXISTS pdf_name TEXT;

NOTIFY pgrst, 'reload schema';
