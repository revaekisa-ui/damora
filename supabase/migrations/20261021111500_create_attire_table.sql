-- Create attire table for Makeup & Vendor Attire items
CREATE TABLE IF NOT EXISTS public.attire (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    price NUMERIC NOT NULL DEFAULT 0,
    region TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.attire ENABLE ROW LEVEL SECURITY;

-- Allow public read and full authenticated management
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'attire' AND policyname = 'Allow public read access for attire'
    ) THEN
        CREATE POLICY "Allow public read access for attire" ON public.attire
            FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'attire' AND policyname = 'Allow all actions for authenticated users on attire'
    ) THEN
        CREATE POLICY "Allow all actions for authenticated users on attire" ON public.attire
            FOR ALL TO authenticated USING (true) WITH CHECK (true);
    END IF;
END $$;

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON TABLE public.attire TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.attire TO authenticated;

-- Add to supabase_realtime publication
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
    ) AND NOT EXISTS (
        SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'attire'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.attire;
    END IF;
END $$;

-- Insert initial mock data
INSERT INTO public.attire (name, price, region)
SELECT * FROM (VALUES
    ('Attire pengantin sepasang', 1500000, NULL::TEXT),
    ('Kebaya ibu/besan/sister Premium', 500000, NULL::TEXT),
    ('Kebaya ibu/besan/sister Biasa', 250000, NULL::TEXT),
    ('Beskap Premium', 400000, NULL::TEXT),
    ('Beskap Biasa', 250000, NULL::TEXT),
    ('Jas', 300000, NULL::TEXT)
) AS v(name, price, region)
WHERE NOT EXISTS (
    SELECT 1 FROM public.attire WHERE public.attire.name = v.name
);

NOTIFY pgrst, 'reload schema';
