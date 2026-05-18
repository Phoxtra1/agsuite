-- Secure Handshakes Table: Holds transient single-use cryptographic tokens
CREATE TABLE IF NOT EXISTS public.secure_handshakes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  target_app text NOT NULL,
  token text UNIQUE NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone NOT NULL,
  consumed boolean DEFAULT false
);

-- Enable RLS on secure_handshakes
ALTER TABLE public.secure_handshakes ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert their own handshake tokens
CREATE POLICY "Users can create their own handshakes" ON public.secure_handshakes
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to view their own handshakes
CREATE POLICY "Users can view their own handshakes" ON public.secure_handshakes
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Secure RPC to generate a short-lived single-use handshake token
CREATE OR REPLACE FUNCTION public.generate_handshake_token(target_app_name text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  generated_token text;
  caller_uid uuid;
BEGIN
  -- Resolve the authenticated user ID
  caller_uid := auth.uid();
  IF caller_uid IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Generate a cryptographically secure random token (sha256 hex)
  generated_token := encode(digest(gen_random_uuid()::text || clock_timestamp()::text, 'sha256'), 'hex');

  -- Insert the handshake record (valid for 15 seconds)
  INSERT INTO public.secure_handshakes (user_id, target_app, token, expires_at)
  VALUES (caller_uid, LOWER(TRIM(target_app_name)), generated_token, now() + interval '15 seconds');

  RETURN generated_token;
END;
$$;

-- Secure RPC to verify and consume a handshake token
-- Since target apps call this under public/anonymous context to authorize, it runs with SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.verify_handshake_token(token_to_verify text, target_app_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  handshake_record record;
BEGIN
  -- Locate the active, unexpired, unconsumed token for the correct application
  SELECT * INTO handshake_record
    FROM public.secure_handshakes
   WHERE token = token_to_verify
     AND LOWER(target_app) = LOWER(TRIM(target_app_name))
     AND consumed = false
     AND expires_at > now();

  IF handshake_record.id IS NULL THEN
    RETURN false;
  END IF;

  -- Mark the token as consumed immediately (strictly single-use!)
  UPDATE public.secure_handshakes
     SET consumed = true
   WHERE id = handshake_record.id;

  RETURN true;
END;
$$;
