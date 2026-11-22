-- Retire storage owned exclusively by the removed Amineva Central Server (ACS)
-- and the former homepage category-product catalogue.
-- Keep profiles, auth, ComsSystem, support tickets, device registry/observations,
-- and admin Product Registry records intact.

DO $$
DECLARE
  target_table text;
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    FOREACH target_table IN ARRAY ARRAY[
      'acs_events',
      'acs_sync_logs',
      'acs_intelligence_outputs',
      'acs_processing_logs'
    ] LOOP
      IF EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
          AND schemaname = 'public'
          AND tablename = target_table
      ) THEN
        EXECUTE format('ALTER PUBLICATION supabase_realtime DROP TABLE public.%I', target_table);
      END IF;
    END LOOP;
  END IF;
END
$$;

DROP FUNCTION IF EXISTS public.sync_acs_data_lake(uuid);
DROP FUNCTION IF EXISTS public.refresh_acs_daily_cache();

-- These tables contain only duplicated ACS events, sync logs, extracted data,
-- processing output, intelligence cache and transformation audit records.
DROP TABLE IF EXISTS
  public.acs_daily_intelligence_cache,
  public.acs_transformation_audit,
  public.acs_intelligence_outputs,
  public.acs_processing_logs,
  public.acs_raw_data,
  public.acs_sync_logs,
  public.acs_events
CASCADE;

-- Remove only the old category-based homepage product rows. Keep admin registry rows.
DELETE FROM public.products
WHERE product_type = 'category';

-- Category labels belonged to the retired catalogue, not the current software registry.
ALTER TABLE public.products
  ALTER COLUMN product_type SET DEFAULT 'admin';

ALTER TABLE public.products
  DROP COLUMN IF EXISTS category;
