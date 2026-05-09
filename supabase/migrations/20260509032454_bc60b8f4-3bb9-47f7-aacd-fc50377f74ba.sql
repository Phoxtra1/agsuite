
REVOKE EXECUTE ON FUNCTION public.has_app_access(uuid, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.has_app_access(uuid, text) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.ensure_app_profile(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.ensure_app_profile(uuid, uuid) TO service_role;
