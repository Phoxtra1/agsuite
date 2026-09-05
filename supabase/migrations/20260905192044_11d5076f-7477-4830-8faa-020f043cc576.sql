CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

CREATE TABLE IF NOT EXISTS public.admin_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id text NOT NULL UNIQUE,
  recovery_id text NOT NULL UNIQUE,
  position text NOT NULL DEFAULT 'System Administrator',
  pin_salt text NOT NULL,
  pin_hash text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  failed_attempts integer NOT NULL DEFAULT 0,
  locked_until timestamptz,
  last_login_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.admin_credentials TO service_role;

ALTER TABLE public.admin_credentials ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_admin_credentials_updated_at
BEFORE UPDATE ON public.admin_credentials
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed the legacy built-in credential (SM-001-SEC1 / PIN 1234) so existing access keeps working
INSERT INTO public.admin_credentials (admin_id, recovery_id, position, pin_salt, pin_hash)
SELECT 'SM-001-SEC1', 'RC-999-REC', 'System Manager', 'amv-seal-legacy',
       encode(extensions.digest('amv-seal-legacy' || '1234', 'sha256'), 'hex')
WHERE NOT EXISTS (SELECT 1 FROM public.admin_credentials WHERE admin_id = 'SM-001-SEC1');