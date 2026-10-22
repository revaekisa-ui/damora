-- Grant table privileges required by the public reader and authenticated admin.
-- Row-level security policies continue to restrict which rows may be accessed.
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON TABLE public.bio_link_pages TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.bio_link_pages TO authenticated;

NOTIFY pgrst, 'reload schema';
