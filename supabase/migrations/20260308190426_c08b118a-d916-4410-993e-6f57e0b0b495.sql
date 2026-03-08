
-- Admin OTP codes for seal authentication
CREATE TABLE public.admin_otp_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  code text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  CONSTRAINT admin_otp_email_check CHECK (char_length(email) > 0)
);

-- RLS: only service role can access
ALTER TABLE public.admin_otp_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on admin_otp_codes"
  ON public.admin_otp_codes
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
