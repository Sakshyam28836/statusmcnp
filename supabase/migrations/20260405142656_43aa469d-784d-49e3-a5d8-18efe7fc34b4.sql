CREATE OR REPLACE FUNCTION public.search_profiles_by_email(search_email text)
RETURNS TABLE(user_id uuid, email text, display_name text, created_at timestamptz)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT p.user_id, p.email, p.display_name, p.created_at
  FROM public.profiles p
  WHERE p.email ILIKE '%' || search_email || '%'
  ORDER BY p.created_at DESC
  LIMIT 20;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_all_user_roles()
RETURNS TABLE(user_id uuid, role app_role, email text, display_name text, assigned_at timestamptz)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT ur.user_id, ur.role, p.email, p.display_name, ur.created_at
  FROM public.user_roles ur
  LEFT JOIN public.profiles p ON p.user_id = ur.user_id
  ORDER BY ur.created_at DESC;
END;
$$;