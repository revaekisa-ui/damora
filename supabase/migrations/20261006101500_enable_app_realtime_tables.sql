DO $$
DECLARE
  table_name text;
  app_tables text[] := ARRAY[
    'add_ons',
    'calendar_events',
    'cards',
    'client_feedback',
    'clients',
    'contracts',
    'galleries',
    'inventory_items',
    'leads',
    'notifications',
    'packages',
    'pockets',
    'profiles',
    'project_add_ons',
    'project_team_assignments',
    'projects',
    'promo_codes',
    'team_members',
    'team_payment_records',
    'team_project_payments',
    'transactions',
    'vendor_portfolios',
    'vendor_profiles',
    'wedding_day_checklists'
  ];
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;

  FOREACH table_name IN ARRAY app_tables LOOP
    IF EXISTS (
      SELECT 1
      FROM pg_tables
      WHERE schemaname = 'public' AND tablename = table_name
    ) AND NOT EXISTS (
      SELECT 1
      FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = table_name
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', table_name);
    END IF;
  END LOOP;
END;
$$;