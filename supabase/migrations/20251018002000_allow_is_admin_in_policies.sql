-- ========================================
-- 2025-10-18 - Allow admins detected via user_permissions to bypass RLS
-- Updates profiles/user_roles/properties policies to consider public.is_admin()
-- ========================================

-- Profiles: allow admins (by user_roles OR unified user_permissions) to view/update
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
  ON public.profiles
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR public.has_role(auth.uid(), 'admin')
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  USING (
    auth.uid() = user_id
    OR public.has_role(auth.uid(), 'admin')
    OR public.is_admin()
  );

-- user_roles: allow admins via unified permissions to view/manage
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
CREATE POLICY "Admins can view all roles"
  ON public.user_roles
  FOR SELECT
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
CREATE POLICY "Admins can manage roles"
  ON public.user_roles
  FOR ALL
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.is_admin()
  );

-- properties: ensure unified-admins can manage and view unpublished
DROP POLICY IF EXISTS "Anyone can view published properties" ON public.properties;
CREATE POLICY "Anyone can view published properties"
  ON public.properties
  FOR SELECT
  USING (
    is_published = true
    OR auth.uid() = user_id
    OR public.has_role(auth.uid(), 'admin')
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "Users can update their own properties" ON public.properties;
CREATE POLICY "Users can update their own properties"
  ON public.properties
  FOR UPDATE
  USING (
    auth.uid() = user_id
    OR public.has_role(auth.uid(), 'admin')
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "Admins can delete any property" ON public.properties;
CREATE POLICY "Admins can delete any property"
  ON public.properties
  FOR DELETE
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.is_admin()
  );

DO $$ BEGIN
  RAISE NOTICE '✅ Policies updated to consider public.is_admin()';
END $$;
