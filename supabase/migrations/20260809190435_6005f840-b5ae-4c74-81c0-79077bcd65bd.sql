CREATE OR REPLACE FUNCTION public.ensure_self_app_access(_app_slug text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  aid uuid;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  -- Only self-serve apps that live on the Suite backend may be auto-provisioned.
  IF _app_slug NOT IN ('workspace', 'suite') THEN
    RAISE EXCEPTION 'app % is not self-serve', _app_slug;
  END IF;

  SELECT id INTO aid FROM public.applications
   WHERE app_slug = _app_slug AND status = 'active';
  IF aid IS NULL THEN
    RETURN NULL;
  END IF;

  INSERT INTO public.user_app_access (user_id, app_id, role, active)
  VALUES (uid, aid, 'user', true)
  ON CONFLICT (user_id, app_id) DO UPDATE SET active = true;

  PERFORM public.ensure_app_profile(uid, aid);

  RETURN aid;
END;
$$;

REVOKE ALL ON FUNCTION public.ensure_self_app_access(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ensure_self_app_access(text) TO authenticated;