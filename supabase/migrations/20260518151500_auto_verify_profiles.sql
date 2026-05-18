-- Trigger to automatically mark profiles.email_verified = true when a user's email is confirmed in auth.users

CREATE OR REPLACE FUNCTION public.handle_user_verification_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email_confirmed_at IS NOT NULL AND (OLD.email_confirmed_at IS NULL OR NEW.email_confirmed_at <> OLD.email_confirmed_at) THEN
    UPDATE public.profiles
    SET email_verified = true, updated_at = now()
    WHERE user_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_verified ON auth.users;
CREATE TRIGGER on_auth_user_verified
  AFTER UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_user_verification_update();
