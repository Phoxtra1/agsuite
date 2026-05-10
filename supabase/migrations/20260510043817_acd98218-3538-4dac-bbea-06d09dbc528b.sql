-- Remove the old global one-profile-per-user rule.
-- Profiles must be unique per (user, app), not per user globally.
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_user_id_key;

-- Helper used by profile policies to avoid app-agnostic profile reads.
CREATE OR REPLACE FUNCTION public.has_app_access_by_id(_user_id uuid, _app_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_app_access uaa
    JOIN public.applications a ON a.id = uaa.app_id
    WHERE uaa.user_id = _user_id
      AND uaa.app_id = _app_id
      AND uaa.active = true
      AND a.status = 'active'
  );
$$;

REVOKE EXECUTE ON FUNCTION public.has_app_access_by_id(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_app_access_by_id(uuid, uuid) TO authenticated, service_role;

-- Replace direct subquery policies with the SECURITY DEFINER helper.
DROP POLICY IF EXISTS "Users read own app profile" ON public.profiles;
DROP POLICY IF EXISTS "Users update own app profile" ON public.profiles;
DROP POLICY IF EXISTS "Users insert own app profile when authorized" ON public.profiles;

CREATE POLICY "Users read own app profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    AND public.has_app_access_by_id(auth.uid(), app_id)
  );

CREATE POLICY "Users update own app profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id
    AND public.has_app_access_by_id(auth.uid(), app_id)
  )
  WITH CHECK (
    auth.uid() = user_id
    AND public.has_app_access_by_id(auth.uid(), app_id)
  );

CREATE POLICY "Users insert own app profile when authorized"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND public.has_app_access_by_id(auth.uid(), app_id)
  );