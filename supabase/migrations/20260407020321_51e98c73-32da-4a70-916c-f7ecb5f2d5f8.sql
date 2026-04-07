
-- Drop the existing ALL policy which is too restrictive for reading
DROP POLICY IF EXISTS "Users can manage their own inbound messages" ON public.inbound_messages;

-- All authenticated users can read all inbound messages (admin inbox)
CREATE POLICY "Authenticated users can read all inbound messages"
ON public.inbound_messages
FOR SELECT
TO authenticated
USING (true);

-- Users can update messages (mark read, star, archive)
CREATE POLICY "Authenticated users can update inbound messages"
ON public.inbound_messages
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Users can delete messages
CREATE POLICY "Authenticated users can delete inbound messages"
ON public.inbound_messages
FOR DELETE
TO authenticated
USING (true);

-- Users can insert messages (for pushNotification)
CREATE POLICY "Authenticated users can insert inbound messages"
ON public.inbound_messages
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Service role full access (for edge function inserts)
CREATE POLICY "Service role full access on inbound_messages"
ON public.inbound_messages
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Same treatment for support_tickets and coms_logs so ComsSystem can view all
DROP POLICY IF EXISTS "Users can view their own tickets" ON public.support_tickets;
CREATE POLICY "Authenticated users can read all tickets"
ON public.support_tickets
FOR SELECT
TO authenticated
USING (true);

-- Service role for edge function ticket inserts
CREATE POLICY "Service role full access on support_tickets"
ON public.support_tickets
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Allow all authenticated to read coms_logs
DROP POLICY IF EXISTS "Users can manage their own logs" ON public.coms_logs;
CREATE POLICY "Authenticated users can read all coms logs"
ON public.coms_logs
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert coms logs"
ON public.coms_logs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Service role for edge function log inserts
CREATE POLICY "Service role full access on coms_logs"
ON public.coms_logs
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
