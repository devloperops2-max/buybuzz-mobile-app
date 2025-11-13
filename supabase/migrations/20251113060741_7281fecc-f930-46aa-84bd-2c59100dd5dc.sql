-- Update the handle_new_user function to automatically grant admin role
-- to the Admin@NVstore.co.in email address
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Insert profile for the new user
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  
  -- Check if the user email is the designated admin email
  IF NEW.email = 'Admin@NVstore.co.in' THEN
    -- Grant admin role for the admin email
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin');
  ELSE
    -- Assign default 'user' role for all other users
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user');
  END IF;
  
  RETURN NEW;
END;
$function$;