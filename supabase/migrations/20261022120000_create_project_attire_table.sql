-- Create project_attire join table (mirrors project_add_ons) so selected attire
-- items are stored separately from add-ons on each project.
CREATE TABLE IF NOT EXISTS public.project_attire (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    attire_id UUID NOT NULL REFERENCES public.attire(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (project_id, attire_id)
);

-- Enable RLS
ALTER TABLE public.project_attire ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'project_attire' AND policyname = 'Allow public read access for project_attire'
    ) THEN
        CREATE POLICY "Allow public read access for project_attire" ON public.project_attire
            FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'project_attire' AND policyname = 'Allow all actions for authenticated users on project_attire'
    ) THEN
        CREATE POLICY "Allow all actions for authenticated users on project_attire" ON public.project_attire
            FOR ALL TO authenticated USING (true) WITH CHECK (true);
    END IF;
END $$;

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON TABLE public.project_attire TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.project_attire TO authenticated;

-- Add to supabase_realtime publication
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
    ) AND NOT EXISTS (
        SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'project_attire'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.project_attire;
    END IF;
END $$;

NOTIFY pgrst, 'reload schema';
