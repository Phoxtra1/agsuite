
-- Add Brevo message ID and delivery status columns to coms_logs
ALTER TABLE public.coms_logs 
ADD COLUMN IF NOT EXISTS brevo_message_id text,
ADD COLUMN IF NOT EXISTS delivery_status text NOT NULL DEFAULT 'sent';

-- Add index for quick lookups by message ID
CREATE INDEX IF NOT EXISTS idx_coms_logs_brevo_message_id ON public.coms_logs (brevo_message_id) WHERE brevo_message_id IS NOT NULL;

-- Add index for delivery status queries
CREATE INDEX IF NOT EXISTS idx_coms_logs_delivery_status ON public.coms_logs (delivery_status);
