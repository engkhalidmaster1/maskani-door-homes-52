-- Update the most recent user to have admin role
UPDATE public.user_roles 
SET role = 'admin' 
WHERE user_id = (
  SELECT id 
  FROM auth.users 
  ORDER BY created_at DESC 
  LIMIT 1
);