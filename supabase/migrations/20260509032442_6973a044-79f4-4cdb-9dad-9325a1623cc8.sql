
-- =========================================================
-- 1. APPLICATIONS REGISTRY
-- =========================================================
CREATE TABLE public.applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_slug text NOT NULL UNIQUE,
  app_name text NOT NULL,
  app_key text NOT NULL UNIQUE,
  app_type text NOT NULL DEFAULT 'product',
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active applications"
  ON public.applications FOR SELECT
  USING (status = 'active');

CREATE POLICY "Service role manages applications"
  ON public.applications FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

CREATE TRIGGER update_applications_updated_at
  BEFORE UPDATE ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed core apps
INSERT INTO public.applications (app_slug, app_name, app_key, app_type) VALUES
  ('suite',       'Amineva Suite',      'suite_app_key',       'hub'),
  ('agis',        'AGIS',               'agis_app_key',        'product'),
  ('aminevaops',  'AminevaOps',         'aminevaops_app_key',  'product'),
  ('amniva',      'Amniva',             'amniva_app_key',      'product');

-- =========================================================
-- 2. USER ↔ APP AUTHORIZATION
-- =========================================================
CREATE TABLE public.user_app_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  app_id uuid NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'user',
  permissions jsonb NOT NULL DEFAULT '{}'::jsonb,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, app_id)
);

CREATE INDEX idx_user_app_access_user ON public.user_app_access(user_id);
CREATE INDEX idx_user_app_access_app  ON public.user_app_access(app_id);

ALTER TABLE public.user_app_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read their own access rows"
  ON public.user_app_access FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role manages app access"
  ON public.user_app_access FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

CREATE TRIGGER update_user_app_access_updated_at
  BEFORE UPDATE ON public.user_app_access
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- 3. AUTHORIZATION HELPER
-- =========================================================
CREATE OR REPLACE FUNCTION public.has_app_access(_user_id uuid, _app_slug text)
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
      AND a.app_slug = _app_slug
      AND uaa.active = true
      AND a.status = 'active'
  );
$$;

-- =========================================================
-- 4. PROFILES — RESTRUCTURE FOR PER-APP ISOLATION
-- =========================================================

-- Add app scoping
ALTER TABLE public.profiles
  ADD COLUMN app_id uuid REFERENCES public.applications(id) ON DELETE CASCADE,
  ADD COLUMN role text NOT NULL DEFAULT 'user',
  ADD COLUMN metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN status text NOT NULL DEFAULT 'active';

-- Backfill existing rows -> Suite hub
UPDATE public.profiles
   SET app_id = (SELECT id FROM public.applications WHERE app_slug = 'suite')
 WHERE app_id IS NULL;

ALTER TABLE public.profiles ALTER COLUMN app_id SET NOT NULL;

-- Enforce uniqueness (user, app)
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_user_app_unique UNIQUE (user_id, app_id);

CREATE INDEX idx_profiles_user_app ON public.profiles(user_id, app_id);

-- Replace permissive RLS with strict per-user + per-app policies
DROP POLICY IF EXISTS "Users can view their own profile"   ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

CREATE POLICY "Users read own app profile"
  ON public.profiles FOR SELECT
  USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.user_app_access uaa
      WHERE uaa.user_id = auth.uid()
        AND uaa.app_id = profiles.app_id
        AND uaa.active = true
    )
  );

CREATE POLICY "Users update own app profile"
  ON public.profiles FOR UPDATE
  USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.user_app_access uaa
      WHERE uaa.user_id = auth.uid()
        AND uaa.app_id = profiles.app_id
        AND uaa.active = true
    )
  );

CREATE POLICY "Users insert own app profile when authorized"
  ON public.profiles FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.user_app_access uaa
      WHERE uaa.user_id = auth.uid()
        AND uaa.app_id = profiles.app_id
        AND uaa.active = true
    )
  );

CREATE POLICY "Service role manages profiles"
  ON public.profiles FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

-- =========================================================
-- 5. PROFILE PROVISIONING HELPER
-- =========================================================
CREATE OR REPLACE FUNCTION public.ensure_app_profile(_user_id uuid, _app_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  pid uuid;
  uemail text;
BEGIN
  SELECT id INTO pid FROM public.profiles
   WHERE user_id = _user_id AND app_id = _app_id;
  IF pid IS NOT NULL THEN
    RETURN pid;
  END IF;

  SELECT email INTO uemail FROM auth.users WHERE id = _user_id;

  INSERT INTO public.profiles (user_id, app_id, display_name, role, status)
  VALUES (_user_id, _app_id, uemail, 'user', 'active')
  RETURNING id INTO pid;

  RETURN pid;
END;
$$;

-- =========================================================
-- 6. AUTO-PROVISION PROFILE WHEN ACCESS GRANTED
-- =========================================================
CREATE OR REPLACE FUNCTION public.user_app_access_after_grant()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.active = true THEN
    PERFORM public.ensure_app_profile(NEW.user_id, NEW.app_id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_user_app_access_provision
  AFTER INSERT OR UPDATE OF active ON public.user_app_access
  FOR EACH ROW EXECUTE FUNCTION public.user_app_access_after_grant();

-- =========================================================
-- 7. REPLACE handle_new_user — Suite-only on signup
-- =========================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  suite_app uuid;
BEGIN
  SELECT id INTO suite_app FROM public.applications WHERE app_slug = 'suite';

  -- Grant Suite access (trigger will create the suite-scoped profile)
  INSERT INTO public.user_app_access (user_id, app_id, role, active)
  VALUES (NEW.id, suite_app, 'user', true)
  ON CONFLICT (user_id, app_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Ensure trigger exists on auth.users (recreate to be safe)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================================================
-- 8. BACKFILL EXISTING USERS -> SUITE ACCESS
-- =========================================================
INSERT INTO public.user_app_access (user_id, app_id, role, active)
SELECT u.id, (SELECT id FROM public.applications WHERE app_slug = 'suite'), 'user', true
FROM auth.users u
ON CONFLICT (user_id, app_id) DO NOTHING;
