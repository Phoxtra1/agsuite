-- Allow authenticated users to update their own sync logs (for sync completion)
CREATE POLICY "Authenticated users can update their sync logs"
  ON public.acs_sync_logs
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Also allow anon to insert/read sync logs for now (ACS console may not always have auth)
CREATE POLICY "Anon can insert sync logs"
  ON public.acs_sync_logs
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anon can read sync logs"
  ON public.acs_sync_logs
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anon can update sync logs"
  ON public.acs_sync_logs
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- Allow anon to insert/read acs_events
CREATE POLICY "Anon can insert events"
  ON public.acs_events
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anon can read events"
  ON public.acs_events
  FOR SELECT
  TO anon
  USING (true);