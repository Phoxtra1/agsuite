-- Secure function to check email registration across different ecosystem applications
CREATE OR REPLACE FUNCTION public.check_email_availability(email_to_check text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  existing_user_id uuid;
  registered_app text;
BEGIN
  -- Search for the user ID in auth.users by lowercased email
  SELECT id INTO existing_user_id 
    FROM auth.users 
   WHERE LOWER(email) = LOWER(TRIM(email_to_check));
   
  IF existing_user_id IS NULL THEN
    RETURN jsonb_build_object('available', true);
  END IF;
  
  -- If user exists, find their primary registered product from user metadata
  SELECT raw_user_meta_data->>'registered_product' INTO registered_app
    FROM auth.users
   WHERE id = existing_user_id;
   
  RETURN jsonb_build_object(
    'available', false,
    'registered_product', COALESCE(registered_app, 'suite')
  );
END;
$$;
