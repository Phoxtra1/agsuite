-- Migration: Update handle_new_user trigger to provision registered product dynamically and seed agstock

-- Seed agstock app if it doesn't already exist
INSERT INTO public.applications (app_slug, app_name, app_key, app_type)
VALUES ('agstock', 'AGStock', 'agstock_app_key', 'product')
ON CONFLICT (app_slug) DO NOTHING;

-- Redefine handle_new_user function to automatically assign target product access on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  suite_app uuid;
  target_app uuid;
  target_product text;
BEGIN
  -- Always grant suite access (the trigger on user_app_access will build the suite profile)
  SELECT id INTO suite_app FROM public.applications WHERE app_slug = 'suite';
  IF suite_app IS NOT NULL THEN
    INSERT INTO public.user_app_access (user_id, app_id, role, active)
    VALUES (NEW.id, suite_app, 'user', true)
    ON CONFLICT (user_id, app_id) DO NOTHING;
  END IF;

  -- Grant access to the specifically registered product if provided in user metadata
  target_product := NEW.raw_user_meta_data->>'registered_product';
  IF target_product IS NOT NULL THEN
    SELECT id INTO target_app FROM public.applications WHERE app_slug = target_product;
    IF target_app IS NOT NULL THEN
      INSERT INTO public.user_app_access (user_id, app_id, role, active)
      VALUES (NEW.id, target_app, 'user', true)
      ON CONFLICT (user_id, app_id) DO NOTHING;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;
