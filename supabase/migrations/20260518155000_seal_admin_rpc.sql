-- Secure function to check if a given email belongs to an authorized Suite Administrator or Manager
CREATE OR REPLACE FUNCTION public.is_admin_email(email_to_check text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  matching_user_id uuid;
  user_role text;
BEGIN
  -- Resolve the user ID from auth.users by email
  SELECT id INTO matching_user_id 
    FROM auth.users 
   WHERE LOWER(email) = LOWER(TRIM(email_to_check));
   
  IF matching_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check if they have an active app profile for 'suite' with manager or super_admin role
  SELECT role INTO user_role 
    FROM public.profiles
   WHERE user_id = matching_user_id 
     AND app_id = (SELECT id FROM public.applications WHERE app_slug = 'suite')
     AND status = 'active';
     
  RETURN COALESCE(user_role IN ('super_admin', 'manager'), false);
END;
$$;
