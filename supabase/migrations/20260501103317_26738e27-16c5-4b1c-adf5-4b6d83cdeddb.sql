ALTER TABLE public.inbound_messages
ADD COLUMN IF NOT EXISTS sender_user_id uuid,
ADD COLUMN IF NOT EXISTS target_user_id uuid,
ADD COLUMN IF NOT EXISTS related_ticket_id uuid,
ADD COLUMN IF NOT EXISTS reply_to_message_id uuid,
ADD COLUMN IF NOT EXISTS direction text NOT NULL DEFAULT 'inbound';

ALTER TABLE public.support_tickets
ADD COLUMN IF NOT EXISTS sender_user_id uuid,
ADD COLUMN IF NOT EXISTS sender_email text,
ADD COLUMN IF NOT EXISTS sender_name text,
ADD COLUMN IF NOT EXISTS last_replied_at timestamp with time zone;

CREATE INDEX IF NOT EXISTS idx_inbound_messages_sender_user_id ON public.inbound_messages(sender_user_id);
CREATE INDEX IF NOT EXISTS idx_inbound_messages_target_user_id ON public.inbound_messages(target_user_id);
CREATE INDEX IF NOT EXISTS idx_inbound_messages_related_ticket_id ON public.inbound_messages(related_ticket_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_sender_user_id ON public.support_tickets(sender_user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_sender_email ON public.support_tickets(sender_email);