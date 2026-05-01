DROP POLICY IF EXISTS "Authenticated users can view their events" ON public.acs_events;
CREATE POLICY "Authenticated users can view all ACS events"
ON public.acs_events
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Authenticated users can view their sync logs" ON public.acs_sync_logs;
CREATE POLICY "Authenticated users can view all ACS sync logs"
ON public.acs_sync_logs
FOR SELECT
TO authenticated
USING (true);