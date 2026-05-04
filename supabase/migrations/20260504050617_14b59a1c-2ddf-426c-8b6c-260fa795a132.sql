
-- Track SLA notification dispatch state to prevent duplicate alerts
ALTER TABLE public.support_tickets
  ADD COLUMN IF NOT EXISTS fr_at_risk_alert_at timestamptz,
  ADD COLUMN IF NOT EXISTS fr_breach_alert_at timestamptz,
  ADD COLUMN IF NOT EXISTS res_at_risk_alert_at timestamptz,
  ADD COLUMN IF NOT EXISTS res_breach_alert_at timestamptz;

-- Enable required extensions for scheduling
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- SLA dispatcher: scans open tickets and inserts notifications for at-risk
-- (≤20% time remaining) and breached SLA states. Idempotent via per-phase
-- alert timestamps so each ticket fires at most one at_risk + one breach
-- notification per SLA phase.
CREATE OR REPLACE FUNCTION public.process_sla_alerts()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  t record;
  fr_total_min int;
  res_total_min int;
  fr_due timestamptz;
  res_due timestamptz;
  fr_remaining_ms bigint;
  res_remaining_ms bigint;
  fr_total_ms bigint;
  res_total_ms bigint;
  notifications int := 0;
  notif_subject text;
  notif_body text;
BEGIN
  FOR t IN
    SELECT * FROM public.support_tickets
    WHERE status NOT IN ('resolved','closed')
  LOOP
    fr_total_min := COALESCE(t.sla_first_response_minutes,
      CASE t.priority WHEN 'urgent' THEN 60 WHEN 'high' THEN 240 WHEN 'low' THEN 1440 ELSE 480 END);
    res_total_min := COALESCE(t.sla_resolution_minutes,
      CASE t.priority WHEN 'urgent' THEN 240 WHEN 'high' THEN 1440 WHEN 'low' THEN 10080 ELSE 4320 END);

    fr_due := t.created_at + (fr_total_min || ' minutes')::interval;
    res_due := t.created_at + (res_total_min || ' minutes')::interval;
    fr_total_ms := fr_total_min * 60000;
    res_total_ms := res_total_min * 60000;
    fr_remaining_ms := EXTRACT(EPOCH FROM (fr_due - now())) * 1000;
    res_remaining_ms := EXTRACT(EPOCH FROM (res_due - now())) * 1000;

    -- First response: only check if no first response yet
    IF t.first_response_at IS NULL AND t.last_replied_at IS NULL THEN
      -- BREACHED
      IF fr_remaining_ms <= 0 AND t.fr_breach_alert_at IS NULL THEN
        notif_subject := '[SLA BREACHED] First response overdue: ' || t.subject;
        notif_body := 'First-response SLA has been BREACHED for ticket "' || t.subject ||
          '" (' || COALESCE(t.source_app,'general') || ', priority ' || t.priority ||
          '). Due: ' || fr_due || '. Please respond immediately.';
        INSERT INTO public.inbound_messages(user_id, sender, sender_name, subject, body, channel, type, source_app, priority, related_ticket_id)
        VALUES (t.user_id, 'ComsSystem', 'ComsSystem SLA Monitor', notif_subject, notif_body, 'in-app', 'notification', 'ComsSystem', 'urgent', t.id);
        INSERT INTO public.ticket_audit_log(ticket_id, actor_kind, actor_label, action, details)
        VALUES (t.id, 'system', 'SLA Monitor', 'sla_breached', 'First-response SLA breached');
        UPDATE public.support_tickets SET fr_breach_alert_at = now() WHERE id = t.id;
        notifications := notifications + 1;
      -- AT RISK (≤20% remaining)
      ELSIF fr_remaining_ms > 0
        AND fr_remaining_ms::float / fr_total_ms <= 0.2
        AND t.fr_at_risk_alert_at IS NULL THEN
        notif_subject := '[SLA AT RISK] First response due soon: ' || t.subject;
        notif_body := 'First-response SLA is approaching breach for ticket "' || t.subject ||
          '" (' || COALESCE(t.source_app,'general') || ', priority ' || t.priority ||
          '). Due: ' || fr_due || '.';
        INSERT INTO public.inbound_messages(user_id, sender, sender_name, subject, body, channel, type, source_app, priority, related_ticket_id)
        VALUES (t.user_id, 'ComsSystem', 'ComsSystem SLA Monitor', notif_subject, notif_body, 'in-app', 'notification', 'ComsSystem', 'high', t.id);
        INSERT INTO public.ticket_audit_log(ticket_id, actor_kind, actor_label, action, details)
        VALUES (t.id, 'system', 'SLA Monitor', 'sla_at_risk', 'First-response SLA at risk');
        UPDATE public.support_tickets SET fr_at_risk_alert_at = now() WHERE id = t.id;
        notifications := notifications + 1;
      END IF;
    END IF;

    -- Resolution
    IF t.resolved_at IS NULL THEN
      IF res_remaining_ms <= 0 AND t.res_breach_alert_at IS NULL THEN
        notif_subject := '[SLA BREACHED] Resolution overdue: ' || t.subject;
        notif_body := 'Resolution SLA has been BREACHED for ticket "' || t.subject ||
          '" (' || COALESCE(t.source_app,'general') || ', priority ' || t.priority ||
          '). Due: ' || res_due || '.';
        INSERT INTO public.inbound_messages(user_id, sender, sender_name, subject, body, channel, type, source_app, priority, related_ticket_id)
        VALUES (t.user_id, 'ComsSystem', 'ComsSystem SLA Monitor', notif_subject, notif_body, 'in-app', 'notification', 'ComsSystem', 'urgent', t.id);
        INSERT INTO public.ticket_audit_log(ticket_id, actor_kind, actor_label, action, details)
        VALUES (t.id, 'system', 'SLA Monitor', 'sla_breached', 'Resolution SLA breached');
        UPDATE public.support_tickets SET res_breach_alert_at = now() WHERE id = t.id;
        notifications := notifications + 1;
      ELSIF res_remaining_ms > 0
        AND res_remaining_ms::float / res_total_ms <= 0.2
        AND t.res_at_risk_alert_at IS NULL THEN
        notif_subject := '[SLA AT RISK] Resolution due soon: ' || t.subject;
        notif_body := 'Resolution SLA is approaching breach for ticket "' || t.subject ||
          '" (' || COALESCE(t.source_app,'general') || ', priority ' || t.priority ||
          '). Due: ' || res_due || '.';
        INSERT INTO public.inbound_messages(user_id, sender, sender_name, subject, body, channel, type, source_app, priority, related_ticket_id)
        VALUES (t.user_id, 'ComsSystem', 'ComsSystem SLA Monitor', notif_subject, notif_body, 'in-app', 'notification', 'ComsSystem', 'high', t.id);
        INSERT INTO public.ticket_audit_log(ticket_id, actor_kind, actor_label, action, details)
        VALUES (t.id, 'system', 'SLA Monitor', 'sla_at_risk', 'Resolution SLA at risk');
        UPDATE public.support_tickets SET res_at_risk_alert_at = now() WHERE id = t.id;
        notifications := notifications + 1;
      END IF;
    END IF;
  END LOOP;
  RETURN notifications;
END;
$$;

-- Schedule SLA monitor every minute
DO $$
BEGIN
  PERFORM cron.unschedule('coms-sla-monitor');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule('coms-sla-monitor', '* * * * *', $$SELECT public.process_sla_alerts();$$);
