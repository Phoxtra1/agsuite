
-- 1) SLA + lifecycle fields on support_tickets
ALTER TABLE public.support_tickets
  ADD COLUMN IF NOT EXISTS first_response_at timestamptz,
  ADD COLUMN IF NOT EXISTS resolved_at timestamptz,
  ADD COLUMN IF NOT EXISTS sla_first_response_minutes integer,
  ADD COLUMN IF NOT EXISTS sla_resolution_minutes integer;

-- Default SLAs by priority (minutes). Applied via trigger on insert.
CREATE OR REPLACE FUNCTION public.apply_ticket_sla_defaults()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.sla_first_response_minutes IS NULL THEN
    NEW.sla_first_response_minutes := CASE COALESCE(NEW.priority, 'normal')
      WHEN 'urgent' THEN 60        -- 1h
      WHEN 'high'   THEN 240       -- 4h
      WHEN 'normal' THEN 480       -- 8h
      WHEN 'low'    THEN 1440      -- 24h
      ELSE 480
    END;
  END IF;
  IF NEW.sla_resolution_minutes IS NULL THEN
    NEW.sla_resolution_minutes := CASE COALESCE(NEW.priority, 'normal')
      WHEN 'urgent' THEN 240       -- 4h
      WHEN 'high'   THEN 1440      -- 24h
      WHEN 'normal' THEN 4320      -- 3d
      WHEN 'low'    THEN 10080     -- 7d
      ELSE 4320
    END;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_support_tickets_sla_defaults ON public.support_tickets;
CREATE TRIGGER trg_support_tickets_sla_defaults
BEFORE INSERT ON public.support_tickets
FOR EACH ROW EXECUTE FUNCTION public.apply_ticket_sla_defaults();

-- 2) Ticket audit log
CREATE TABLE IF NOT EXISTS public.ticket_audit_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id uuid NOT NULL,
  actor_user_id uuid,
  actor_kind text NOT NULL DEFAULT 'user', -- user | app | system
  actor_label text,                        -- e.g. "AGStock", "Amineva Support"
  action text NOT NULL,                    -- created | replied | status_changed | attachment_added | note
  from_status text,
  to_status text,
  message_id uuid,                         -- optional link to inbound_messages
  attachment_id uuid,                      -- optional link to ticket_attachments
  details text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ticket_audit_log_ticket ON public.ticket_audit_log(ticket_id, created_at DESC);

ALTER TABLE public.ticket_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read ticket audit"
  ON public.ticket_audit_log FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can insert their own audit entries"
  ON public.ticket_audit_log FOR INSERT TO authenticated
  WITH CHECK (actor_user_id IS NULL OR actor_user_id = auth.uid());

CREATE POLICY "Service role full access on ticket_audit_log"
  ON public.ticket_audit_log FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 3) Ticket attachments
CREATE TABLE IF NOT EXISTS public.ticket_attachments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id uuid NOT NULL,
  message_id uuid,                  -- optional: tie to a specific reply
  storage_path text NOT NULL,       -- path inside the ticket-attachments bucket
  file_name text NOT NULL,
  mime_type text,
  size_bytes bigint,
  uploaded_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ticket_attachments_ticket ON public.ticket_attachments(ticket_id, created_at DESC);

ALTER TABLE public.ticket_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read ticket attachments"
  ON public.ticket_attachments FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can insert their own ticket attachments"
  ON public.ticket_attachments FOR INSERT TO authenticated
  WITH CHECK (uploaded_by = auth.uid());

CREATE POLICY "Service role full access on ticket_attachments"
  ON public.ticket_attachments FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 4) Status-change audit + lifecycle stamps via trigger
CREATE OR REPLACE FUNCTION public.support_ticket_audit_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  actor uuid := auth.uid();
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.ticket_audit_log(ticket_id, actor_user_id, actor_kind, actor_label, action, to_status, details)
    VALUES (
      NEW.id,
      COALESCE(NEW.sender_user_id, actor),
      CASE WHEN NEW.sender_user_id IS NULL AND actor IS NULL THEN 'app' ELSE 'user' END,
      COALESCE(NEW.sender_name, NEW.source_app, 'system'),
      'created',
      NEW.status,
      'Ticket opened from ' || COALESCE(NEW.source_app, 'unknown')
    );
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    -- Status transition
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      INSERT INTO public.ticket_audit_log(ticket_id, actor_user_id, actor_kind, actor_label, action, from_status, to_status)
      VALUES (NEW.id, actor, CASE WHEN actor IS NULL THEN 'system' ELSE 'user' END, NULL, 'status_changed', OLD.status, NEW.status);

      IF NEW.status = 'resolved' AND NEW.resolved_at IS NULL THEN
        NEW.resolved_at := now();
      END IF;
    END IF;

    -- First response stamp on first reply
    IF NEW.last_replied_at IS DISTINCT FROM OLD.last_replied_at
       AND NEW.last_replied_at IS NOT NULL
       AND NEW.first_response_at IS NULL THEN
      NEW.first_response_at := NEW.last_replied_at;
    END IF;

    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_support_tickets_audit_ins ON public.support_tickets;
CREATE TRIGGER trg_support_tickets_audit_ins
AFTER INSERT ON public.support_tickets
FOR EACH ROW EXECUTE FUNCTION public.support_ticket_audit_trigger();

DROP TRIGGER IF EXISTS trg_support_tickets_audit_upd ON public.support_tickets;
CREATE TRIGGER trg_support_tickets_audit_upd
BEFORE UPDATE ON public.support_tickets
FOR EACH ROW EXECUTE FUNCTION public.support_ticket_audit_trigger();

-- 5) Storage bucket for ticket attachments (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('ticket-attachments', 'ticket-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Authenticated team members can read all ticket files
CREATE POLICY "Authenticated can read ticket attachment files"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'ticket-attachments');

-- Authenticated users can upload into the bucket
CREATE POLICY "Authenticated can upload ticket attachment files"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'ticket-attachments');

-- Uploaders can delete their own files
CREATE POLICY "Users can delete their own ticket attachment files"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'ticket-attachments' AND owner = auth.uid());

-- 6) Realtime for the new tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.ticket_audit_log;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ticket_attachments;
