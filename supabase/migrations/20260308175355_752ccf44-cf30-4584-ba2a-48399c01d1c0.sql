
-- ============================================================
-- المرحلة 1: تفعيل RLS على الجداول المكشوفة + سياسات أمان
-- ============================================================

-- 1. تفعيل RLS على الجداول الخمسة
ALTER TABLE public.backup_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.home_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.home_page_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_metrics ENABLE ROW LEVEL SECURITY;

-- 2. سياسات backup_logs (قراءة للمدير فقط)
CREATE POLICY "admins_select_backup_logs" ON public.backup_logs
  FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

-- 3. سياسات home_cards (قراءة عامة، تعديل للمدير)
CREATE POLICY "public_select_home_cards" ON public.home_cards
  FOR SELECT USING (true);

CREATE POLICY "admins_all_home_cards" ON public.home_cards
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- 4. سياسات home_page_settings (قراءة عامة، تعديل للمدير)
CREATE POLICY "public_select_home_page_settings" ON public.home_page_settings
  FOR SELECT USING (true);

CREATE POLICY "admins_all_home_page_settings" ON public.home_page_settings
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- 5. سياسات system_alerts (مدير فقط)
CREATE POLICY "admins_select_system_alerts" ON public.system_alerts
  FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "admins_all_system_alerts" ON public.system_alerts
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- 6. سياسات system_metrics (مدير فقط)
CREATE POLICY "admins_select_system_metrics" ON public.system_metrics
  FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "admins_insert_system_metrics" ON public.system_metrics
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

-- ============================================================
-- إصلاح users_with_permissions view - تحويل إلى SECURITY INVOKER
-- ============================================================
DROP VIEW IF EXISTS public.users_with_permissions;

CREATE VIEW public.users_with_permissions
WITH (security_invoker = true)
AS
SELECT
  au.id,
  au.email,
  au.created_at AS account_created,
  au.last_sign_in_at,
  au.email_confirmed_at,
  p.full_name,
  p.phone,
  p.address,
  up.role,
  up.properties_count,
  up.images_count,
  up.can_publish,
  up.is_verified,
  up.is_active,
  up.limits,
  up.verified_at,
  up.verified_by,
  up.created_at AS permissions_created,
  up.updated_at AS permissions_updated,
  (up.limits->>'properties')::integer AS properties_limit,
  (up.limits->>'images_per_property')::integer AS images_limit,
  (up.limits->>'featured_properties')::integer AS featured_limit,
  (up.limits->>'storage_mb')::integer AS storage_mb,
  CASE COALESCE(up.role, 'publisher')
    WHEN 'admin' THEN '👑 مدير'
    WHEN 'office' THEN '🏢 مكتب'
    WHEN 'agent' THEN '🧑‍💼 وسيط'
    ELSE '👤 ناشر'
  END AS role_name_ar,
  CASE
    WHEN NOT COALESCE(up.can_publish, true) THEN '🚫 محظور'
    WHEN COALESCE(up.role,'publisher') = 'admin' THEN '🔑 غير محدود'
    WHEN COALESCE(up.properties_count,0) >= COALESCE((up.limits->>'properties')::int, 3) THEN '🔴 وصل للحد'
    ELSE '🟢 ضمن الحد'
  END AS status_indicator
FROM auth.users au
LEFT JOIN public.profiles p ON p.user_id = au.id
LEFT JOIN public.user_permissions up ON up.user_id = au.id;

-- ============================================================
-- إضافة search_path لجميع الدوال التي تفتقر إليه
-- ============================================================

-- is_admin
CREATE OR REPLACE FUNCTION public.is_admin(uid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_permissions 
    WHERE user_id = uid AND role = 'admin'
  );
$$;

-- get_user_role
CREATE OR REPLACE FUNCTION public.get_user_role(uid uuid DEFAULT auth.uid())
RETURNS user_role_type
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_permissions WHERE user_id = uid;
$$;

-- can_add_property
CREATE OR REPLACE FUNCTION public.can_add_property(uid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role user_role_type;
  v_limit INTEGER;
  v_current INTEGER;
  v_can_publish BOOLEAN;
BEGIN
  SELECT role, (limits->>'properties')::INTEGER, properties_count, can_publish
  INTO v_role, v_limit, v_current, v_can_publish
  FROM public.user_permissions WHERE user_id = uid;
  
  IF NOT v_can_publish THEN RETURN false; END IF;
  IF v_role IN ('admin', 'office') THEN RETURN true; END IF;
  RETURN v_current < v_limit;
END;
$$;

-- get_user_limits
CREATE OR REPLACE FUNCTION public.get_user_limits(uid uuid DEFAULT auth.uid())
RETURNS TABLE(role user_role_type, properties_limit integer, images_limit integer, featured_limit integer, storage_mb integer, current_properties integer, current_images integer, can_publish boolean, is_verified boolean, is_active boolean)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    up.role,
    (up.limits->>'properties')::INTEGER,
    (up.limits->>'images_per_property')::INTEGER,
    (up.limits->>'featured_properties')::INTEGER,
    (up.limits->>'storage_mb')::INTEGER,
    up.properties_count,
    up.images_count,
    up.can_publish,
    up.is_verified,
    up.is_active
  FROM public.user_permissions up
  WHERE up.user_id = uid;
$$;

-- toggle_user_ban
CREATE OR REPLACE FUNCTION public.toggle_user_ban(target_user_id uuid, should_ban boolean, admin_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin(admin_id) THEN
    RAISE EXCEPTION 'Only admins can ban/unban users';
  END IF;
  UPDATE public.user_permissions
  SET can_publish = NOT should_ban, is_active = NOT should_ban, updated_at = now()
  WHERE user_id = target_user_id;
  RETURN true;
END;
$$;

-- update_user_role
CREATE OR REPLACE FUNCTION public.update_user_role(target_user_id uuid, new_role user_role_type, admin_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_limits JSONB;
BEGIN
  IF NOT public.is_admin(admin_id) THEN
    RAISE EXCEPTION 'Only admins can update user roles';
  END IF;
  
  v_new_limits := CASE new_role
    WHEN 'admin' THEN '{"properties": -1, "images_per_property": -1, "featured_properties": -1, "storage_mb": -1}'::jsonb
    WHEN 'office' THEN '{"properties": -1, "images_per_property": 10, "featured_properties": 50, "storage_mb": 5000}'::jsonb
    WHEN 'agent' THEN '{"properties": 10, "images_per_property": 10, "featured_properties": 3, "storage_mb": 500}'::jsonb
    ELSE '{"properties": 3, "images_per_property": 10, "featured_properties": 0, "storage_mb": 100}'::jsonb
  END;
  
  UPDATE public.user_permissions
  SET role = new_role, limits = v_new_limits,
    is_verified = CASE WHEN new_role IN ('agent', 'office', 'admin') THEN true ELSE is_verified END,
    verified_by = CASE WHEN new_role IN ('agent', 'office', 'admin') THEN admin_id ELSE verified_by END,
    verified_at = CASE WHEN new_role IN ('agent', 'office', 'admin') THEN now() ELSE verified_at END,
    updated_at = now()
  WHERE user_id = target_user_id;
  
  RETURN true;
END;
$$;

-- protect_super_admin
CREATE OR REPLACE FUNCTION public.protect_super_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_super_admin_email TEXT := 'eng.khalid.work@gmail.com';
  v_super_admin_id UUID;
BEGIN
  SELECT id INTO v_super_admin_id FROM auth.users WHERE email = v_super_admin_email;
  IF v_super_admin_id IS NULL THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND NEW.user_id = v_super_admin_id THEN
    IF (NEW.role IS DISTINCT FROM OLD.role) AND (NEW.role != 'admin') THEN
      RAISE EXCEPTION '🚫 لا يمكن تغيير دور المدير العام!';
    END IF;
    IF (NEW.can_publish IS DISTINCT FROM OLD.can_publish) AND (NEW.can_publish = false) THEN
      RAISE EXCEPTION '🚫 لا يمكن حظر المدير العام!';
    END IF;
    IF (NEW.is_active IS DISTINCT FROM OLD.is_active) AND (NEW.is_active = false) THEN
      RAISE EXCEPTION '🚫 لا يمكن تعطيل المدير العام!';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- create_default_permissions
CREATE OR REPLACE FUNCTION public.create_default_permissions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_permissions (user_id, role, limits)
  VALUES (NEW.id, 'publisher', '{"properties": 3, "images_per_property": 10, "featured_properties": 0, "storage_mb": 100}'::jsonb)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- update_user_statistics
CREATE OR REPLACE FUNCTION public.update_user_statistics()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.user_permissions
  SET properties_count = (SELECT COUNT(*) FROM properties WHERE user_id = COALESCE(NEW.user_id, OLD.user_id) AND is_published = true),
      images_count = (SELECT COALESCE(SUM(array_length(images, 1)), 0) FROM properties WHERE user_id = COALESCE(NEW.user_id, OLD.user_id)),
      updated_at = now()
  WHERE user_id = COALESCE(NEW.user_id, OLD.user_id);
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- get_system_metrics
CREATE OR REPLACE FUNCTION public.get_system_metrics()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result JSON;
    active_connections_count INTEGER := 0;
    total_requests_count BIGINT := 0;
    failed_requests_count BIGINT := 0;
    avg_response_time DECIMAL(10,2) := 0;
    uptime_hours INTEGER := 0;
    last_backup_date TEXT := '';
    error_rate DECIMAL(5,3) := 0;
BEGIN
    SELECT COUNT(*) INTO active_connections_count FROM pg_stat_activity WHERE state = 'active' AND pid <> pg_backend_pid();
    IF active_connections_count = 0 THEN active_connections_count := 25 + (random() * 50)::INTEGER; END IF;
    SELECT COALESCE(SUM(sm.total_requests), 0), COALESCE(SUM(sm.failed_requests), 0), COALESCE(AVG(sm.avg_response_time), 250.0)
    INTO total_requests_count, failed_requests_count, avg_response_time
    FROM system_metrics sm WHERE sm.timestamp >= NOW() - INTERVAL '1 hour';
    SELECT EXTRACT(EPOCH FROM (NOW() - pg_postmaster_start_time())) / 3600 INTO uptime_hours;
    SELECT TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI:SS') INTO last_backup_date FROM backup_logs WHERE status = 'completed' ORDER BY created_at DESC LIMIT 1;
    IF last_backup_date IS NULL THEN last_backup_date := TO_CHAR(NOW() - INTERVAL '2 days', 'YYYY-MM-DD HH24:MI:SS'); END IF;
    IF total_requests_count > 0 THEN error_rate := (failed_requests_count::DECIMAL / total_requests_count::DECIMAL) * 100; END IF;
    SELECT json_build_object('activeConnections', active_connections_count, 'latency', avg_response_time, 'errorRate', error_rate,
      'cpuUsage', 45 + (random() * 30)::DECIMAL(5,2), 'memoryUsage', 40 + (random() * 35)::DECIMAL(5,2),
      'diskUsage', 30 + (random() * 40)::DECIMAL(5,2), 'uptime', uptime_hours, 'lastBackup', last_backup_date,
      'totalRequests', total_requests_count, 'failedRequests', failed_requests_count) INTO result;
    RETURN result;
END;
$$;

-- update_system_metrics
CREATE OR REPLACE FUNCTION public.update_system_metrics(p_active_connections integer DEFAULT NULL, p_total_requests bigint DEFAULT NULL, p_failed_requests bigint DEFAULT NULL, p_avg_response_time numeric DEFAULT NULL, p_cpu_usage numeric DEFAULT NULL, p_memory_usage numeric DEFAULT NULL, p_disk_usage numeric DEFAULT NULL)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_metric_id UUID;
    current_uptime INTEGER;
BEGIN
    SELECT EXTRACT(EPOCH FROM (NOW() - pg_postmaster_start_time())) / 3600 INTO current_uptime;
    INSERT INTO system_metrics (active_connections, total_requests, failed_requests, avg_response_time, cpu_usage, memory_usage, disk_usage, uptime_hours)
    VALUES (COALESCE(p_active_connections, 0), COALESCE(p_total_requests, 0), COALESCE(p_failed_requests, 0), COALESCE(p_avg_response_time, 250.0), COALESCE(p_cpu_usage, 50.0), COALESCE(p_memory_usage, 45.0), COALESCE(p_disk_usage, 35.0), current_uptime)
    RETURNING id INTO new_metric_id;
    RETURN new_metric_id;
END;
$$;

-- get_alerts_stats
CREATE OR REPLACE FUNCTION public.get_alerts_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE result JSON; total_alerts INTEGER; active_alerts INTEGER; resolved_today INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_alerts FROM system_alerts;
    SELECT COUNT(*) INTO active_alerts FROM system_alerts WHERE resolved = FALSE;
    SELECT COUNT(*) INTO resolved_today FROM system_alerts WHERE resolved = TRUE AND resolved_at >= CURRENT_DATE;
    SELECT json_build_object('total', total_alerts, 'active', active_alerts, 'resolved_today', resolved_today) INTO result;
    RETURN result;
END;
$$;

-- get_active_alerts
CREATE OR REPLACE FUNCTION public.get_active_alerts()
RETURNS TABLE(id uuid, alert_type character varying, title text, description text, action_required character varying, created_at timestamp with time zone, resolved boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY SELECT sa.id, sa.alert_type, sa.title, sa.description, sa.action_required, sa.created_at, sa.resolved
    FROM system_alerts sa ORDER BY sa.created_at DESC;
END;
$$;

-- resolve_alert
CREATE OR REPLACE FUNCTION public.resolve_alert(alert_id uuid, user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE updated_count INTEGER;
BEGIN
    UPDATE system_alerts SET resolved = TRUE, resolved_at = NOW(), resolved_by = user_id, updated_at = NOW()
    WHERE id = alert_id AND resolved = FALSE;
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count > 0;
END;
$$;

-- create_system_alert
CREATE OR REPLACE FUNCTION public.create_system_alert(p_alert_type character varying, p_title text, p_description text, p_action_required character varying DEFAULT NULL)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE new_alert_id UUID;
BEGIN
    INSERT INTO system_alerts (alert_type, title, description, action_required) VALUES (p_alert_type, p_title, p_description, p_action_required)
    RETURNING id INTO new_alert_id;
    RETURN new_alert_id;
END;
$$;

-- get_active_home_cards
CREATE OR REPLACE FUNCTION public.get_active_home_cards()
RETURNS TABLE(id uuid, title text, description text, icon_name character varying, path character varying, requires_auth boolean, bg_color character varying, icon_color character varying, display_order integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY SELECT hc.id, hc.title, hc.description, hc.icon_name, hc.path, hc.requires_auth, hc.bg_color, hc.icon_color, hc.display_order
    FROM home_cards hc WHERE hc.is_active = TRUE ORDER BY hc.display_order ASC;
END;
$$;

-- update_card_order
CREATE OR REPLACE FUNCTION public.update_card_order(p_card_id uuid, p_new_order integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE home_cards SET display_order = p_new_order, updated_at = NOW() WHERE id = p_card_id;
    RETURN FOUND;
END;
$$;

-- update_home_card
CREATE OR REPLACE FUNCTION public.update_home_card(p_card_id uuid, p_title text, p_description text, p_icon_name character varying, p_path character varying, p_requires_auth boolean, p_bg_color character varying, p_icon_color character varying)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE home_cards SET title = p_title, description = p_description, icon_name = p_icon_name, path = p_path,
      requires_auth = p_requires_auth, bg_color = p_bg_color, icon_color = p_icon_color, updated_at = NOW()
    WHERE id = p_card_id;
    RETURN FOUND;
END;
$$;

-- get_home_page_settings
CREATE OR REPLACE FUNCTION public.get_home_page_settings()
RETURNS TABLE(id uuid, show_search_bar boolean, search_bar_title text, search_bar_subtitle text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY SELECT hps.id, hps.show_search_bar, hps.search_bar_title, hps.search_bar_subtitle FROM home_page_settings hps LIMIT 1;
END;
$$;

-- update_home_page_settings
CREATE OR REPLACE FUNCTION public.update_home_page_settings(p_show_search_bar boolean, p_search_bar_title text, p_search_bar_subtitle text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE home_page_settings SET show_search_bar = p_show_search_bar, search_bar_title = p_search_bar_title,
      search_bar_subtitle = p_search_bar_subtitle, updated_at = NOW()
    WHERE id = (SELECT id FROM home_page_settings LIMIT 1);
    RETURN FOUND;
END;
$$;

-- ensure_super_admin
CREATE OR REPLACE FUNCTION public.ensure_super_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_super_admin_email TEXT := 'eng.khalid.work@gmail.com';
  v_uid UUID := auth.uid();
  v_owner_id UUID;
BEGIN
  SELECT id INTO v_owner_id FROM auth.users WHERE email = v_super_admin_email;
  IF v_owner_id IS NULL THEN RAISE EXCEPTION 'Super admin user not found.'; END IF;
  IF v_uid IS DISTINCT FROM v_owner_id THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  INSERT INTO public.user_permissions (user_id, role, limits, can_publish, is_verified, is_active, verified_at, verified_by, created_at, updated_at)
  VALUES (v_owner_id, 'admin', '{"properties": -1, "images_per_property": -1, "storage_mb": -1}'::jsonb, true, true, true, now(), v_owner_id, now(), now())
  ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role, limits = EXCLUDED.limits, can_publish = EXCLUDED.can_publish, is_verified = EXCLUDED.is_verified, is_active = EXCLUDED.is_active, verified_at = EXCLUDED.verified_at, verified_by = EXCLUDED.verified_by, updated_at = now();
  INSERT INTO public.user_statuses (user_id, status, properties_limit, images_limit, can_publish, is_verified, verified_at, verified_by, created_at, updated_at)
  VALUES (v_owner_id, 'trusted_owner', -1, -1, true, true, now(), v_owner_id, now(), now())
  ON CONFLICT (user_id) DO UPDATE SET status = EXCLUDED.status, properties_limit = EXCLUDED.properties_limit, images_limit = EXCLUDED.images_limit, can_publish = EXCLUDED.can_publish, is_verified = EXCLUDED.is_verified, verified_at = EXCLUDED.verified_at, verified_by = EXCLUDED.verified_by, updated_at = now();
  RETURN true;
END;
$$;

-- admin_broadcast_notification
CREATE OR REPLACE FUNCTION public.admin_broadcast_notification(p_title text, p_message text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_admin uuid := auth.uid();
BEGIN
  IF v_admin IS NULL OR NOT public.is_admin(v_admin) THEN RAISE EXCEPTION 'not allowed'; END IF;
  INSERT INTO public.notifications (id, user_id, title, message, read, type, created_at)
  SELECT gen_random_uuid(), u.id, p_title, p_message, false, 'broadcast', now() FROM auth.users u;
END;
$$;

-- set_app_settings
CREATE OR REPLACE FUNCTION public.set_app_settings(p_settings jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_admin uuid := auth.uid(); v_prev jsonb;
BEGIN
  IF v_admin IS NULL OR NOT public.is_admin(v_admin) THEN RAISE EXCEPTION 'not allowed'; END IF;
  SELECT settings INTO v_prev FROM public.app_settings ORDER BY updated_at DESC LIMIT 1;
  UPDATE public.app_settings SET settings = p_settings, updated_at = now();
  IF NOT FOUND THEN INSERT INTO public.app_settings (settings, updated_at) VALUES (p_settings, now()); END IF;
  PERFORM public.log_audit_entry('update', 'app_settings', v_prev, p_settings, v_admin);
END;
$$;

-- set_maintenance_mode
CREATE OR REPLACE FUNCTION public.set_maintenance_mode(p_on boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_admin uuid := auth.uid(); v_prev jsonb; v_new jsonb;
BEGIN
  IF v_admin IS NULL OR NOT public.is_admin(v_admin) THEN RAISE EXCEPTION 'not allowed'; END IF;
  SELECT settings INTO v_prev FROM public.app_settings ORDER BY updated_at DESC LIMIT 1;
  IF v_prev IS NULL THEN
    v_new := jsonb_build_object('maintenance_mode', p_on);
    INSERT INTO public.app_settings (settings, updated_at) VALUES (v_new, now());
  ELSE
    v_new := v_prev || jsonb_build_object('maintenance_mode', p_on);
    UPDATE public.app_settings SET settings = v_new, updated_at = now();
  END IF;
  PERFORM public.log_audit_entry('update', 'app_settings', v_prev, v_new, v_admin);
END;
$$;

-- mark_all_notifications_read
CREATE OR REPLACE FUNCTION public.mark_all_notifications_read()
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  UPDATE public.notifications SET read = true WHERE user_id = auth.uid() AND read IS DISTINCT FROM true;
END;
$$;

-- delete_user_notification
CREATE OR REPLACE FUNCTION public.delete_user_notification(p_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_user uuid := auth.uid(); v_exists boolean;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  SELECT EXISTS (SELECT 1 FROM public.notifications n WHERE n.id = p_id AND (n.user_id = v_user OR public.is_admin(v_user))) INTO v_exists;
  IF NOT v_exists THEN RAISE EXCEPTION 'not allowed'; END IF;
  DELETE FROM public.notifications WHERE id = p_id;
  RETURN true;
END;
$$;

-- log_audit_entry
CREATE OR REPLACE FUNCTION public.log_audit_entry(p_action text, p_resource_type text, p_resource_id text, p_details jsonb, p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  INSERT INTO audit_logs(action, resource_type, resource_id, details, user_id, created_at) VALUES (p_action, p_resource_type, p_resource_id, p_details, p_user_id, now());
END;
$$;

-- get_app_settings
CREATE OR REPLACE FUNCTION public.get_app_settings()
RETURNS jsonb
LANGUAGE sql
SET search_path = public
AS $$
  SELECT settings FROM public.app_settings ORDER BY updated_at DESC LIMIT 1;
$$;

-- generate_property_code
CREATE OR REPLACE FUNCTION public.generate_property_code(bedrooms_count integer, created_date timestamp with time zone DEFAULT now())
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE date_prefix TEXT; bedrooms_prefix TEXT; sequence_num INTEGER; property_code TEXT;
BEGIN
  date_prefix := TO_CHAR(created_date, 'YYYYMMDD');
  bedrooms_prefix := 'BR' || bedrooms_count::TEXT;
  sequence_num := public.get_next_property_sequence(created_date::DATE, bedrooms_count);
  property_code := date_prefix || '-' || bedrooms_prefix || '-' || LPAD(sequence_num::TEXT, 3, '0');
  RETURN property_code;
END;
$$;

-- get_next_property_sequence
CREATE OR REPLACE FUNCTION public.get_next_property_sequence(target_date date DEFAULT CURRENT_DATE, bedrooms_count integer DEFAULT 1)
RETURNS integer
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE date_prefix TEXT; bedrooms_prefix TEXT; next_seq INTEGER;
BEGIN
  date_prefix := TO_CHAR(target_date, 'YYYYMMDD');
  bedrooms_prefix := 'BR' || bedrooms_count::TEXT;
  SELECT COALESCE(MAX(CAST(SUBSTRING(property_code FROM LENGTH(date_prefix || '-' || bedrooms_prefix || '-') + 1) AS INTEGER)), 0) + 1
  INTO next_seq FROM public.properties
  WHERE property_code LIKE date_prefix || '-' || bedrooms_prefix || '-%'
    AND LENGTH(property_code) = LENGTH(date_prefix || '-' || bedrooms_prefix || '-000');
  RETURN next_seq;
END;
$$;

-- validate_property_trigger
CREATE OR REPLACE FUNCTION public.validate_property_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE validation_errors TEXT[]; need_validate BOOLEAN := TRUE;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    need_validate := (OLD.property_type IS DISTINCT FROM NEW.property_type) OR (OLD.listing_type IS DISTINCT FROM NEW.listing_type)
      OR (OLD.price IS DISTINCT FROM NEW.price) OR (OLD.area IS DISTINCT FROM NEW.area) OR (OLD.bedrooms IS DISTINCT FROM NEW.bedrooms)
      OR (OLD.building IS DISTINCT FROM NEW.building) OR (OLD.apartment IS DISTINCT FROM NEW.apartment) OR (OLD.floor IS DISTINCT FROM NEW.floor)
      OR (OLD.furnished IS DISTINCT FROM NEW.furnished);
    IF NOT need_validate THEN RETURN NEW; END IF;
  END IF;
  validation_errors := public.property_validation_core(to_jsonb(NEW), CASE WHEN TG_OP = 'UPDATE' THEN to_jsonb(OLD) ELSE NULL END);
  IF array_length(validation_errors, 1) IS NOT NULL THEN
    RAISE EXCEPTION USING MESSAGE = format('Property validation failed: %s', array_to_string(validation_errors, '; ')), ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END;
$$;

-- property_validation_core
CREATE OR REPLACE FUNCTION public.property_validation_core(p_new jsonb, p_old jsonb DEFAULT NULL)
RETURNS text[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  errs TEXT[] := ARRAY[]::TEXT[];
  property_type TEXT := lower(trim(coalesce(p_new->>'property_type','')));
  listing_type TEXT := lower(trim(coalesce(p_new->>'listing_type','')));
  price_text TEXT := coalesce(p_new->>'price','');
  area_text TEXT := coalesce(p_new->>'area','');
  bedrooms_text TEXT := coalesce(p_new->>'bedrooms','');
  floor_text TEXT := trim(coalesce(p_new->>'floor',''));
  furnished_text TEXT := lower(trim(coalesce(p_new->>'furnished','')));
  v_price NUMERIC; v_area NUMERIC; v_bedrooms INTEGER;
BEGIN
  IF property_type = '' THEN errs := array_append(errs, 'نوع العقار مطلوب');
  ELSIF property_type NOT IN ('apartment','house','commercial') THEN errs := array_append(errs, 'نوع العقار غير صالح'); END IF;
  IF listing_type = '' THEN errs := array_append(errs, 'نوع العرض مطلوب');
  ELSIF listing_type NOT IN ('sale','rent') THEN errs := array_append(errs, 'نوع العرض غير صالح'); END IF;
  IF price_text IS NULL OR trim(price_text) = '' THEN errs := array_append(errs, 'السعر مطلوب');
  ELSE BEGIN v_price := (price_text)::numeric; IF v_price <= 0 THEN errs := array_append(errs, 'السعر يجب أن يكون أكبر من صفر'); END IF;
  EXCEPTION WHEN others THEN errs := array_append(errs, 'السعر غير صالح'); END; END IF;
  IF area_text IS NULL OR trim(area_text) = '' THEN errs := array_append(errs, 'المساحة مطلوبة');
  ELSE BEGIN v_area := (area_text)::numeric; IF v_area <= 0 THEN errs := array_append(errs, 'المساحة يجب أن تكون أكبر من صفر'); END IF;
  EXCEPTION WHEN others THEN errs := array_append(errs, 'المساحة غير صالحة'); END; END IF;
  IF property_type IN ('apartment','house') THEN
    IF bedrooms_text IS NULL OR trim(bedrooms_text) = '' THEN errs := array_append(errs, 'عدد غرف النوم مطلوب');
    ELSE BEGIN v_bedrooms := (bedrooms_text)::integer; IF v_bedrooms < 0 THEN errs := array_append(errs, 'عدد غرف النوم يجب أن يكون غير سالب'); END IF;
    EXCEPTION WHEN others THEN errs := array_append(errs, 'عدد غرف النوم غير صالح'); END; END IF;
  END IF;
  IF property_type = 'apartment' THEN IF floor_text = '' THEN errs := array_append(errs, 'الطابق مطلوب للشقق'); END IF; END IF;
  IF listing_type = 'rent' THEN
    IF furnished_text = '' THEN errs := array_append(errs, 'حالة الأثاث مطلوبة عند الإيجار');
    ELSIF furnished_text NOT IN ('yes','no') THEN errs := array_append(errs, 'قيمة الأثاث غير صالحة'); END IF;
  END IF;
  RETURN errs;
END;
$$;

-- validate_property_payload
CREATE OR REPLACE FUNCTION public.validate_property_payload(p_payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE errs TEXT[];
BEGIN
  errs := public.property_validation_core(p_payload, NULL);
  RETURN jsonb_build_object('valid', CASE WHEN array_length(errs,1) IS NULL THEN true ELSE false END, 'errors', errs);
END;
$$;

-- get_users_for_admin_v2
CREATE OR REPLACE FUNCTION public.get_users_for_admin_v2()
RETURNS TABLE(id uuid, email text, full_name text, phone text, role user_role_type, properties_count integer, images_limit integer, properties_limit integer, can_publish boolean, is_verified boolean, is_active boolean, role_name_ar text, status_indicator text, account_created timestamp with time zone, last_sign_in_at timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Not allowed'; END IF;
  RETURN QUERY
  SELECT au.id, au.email::text, COALESCE(p.full_name, au.raw_user_meta_data ->> 'full_name', ''),
    COALESCE(p.phone, au.raw_user_meta_data ->> 'phone', ''),
    COALESCE(up.role::text, 'publisher')::public.user_role_type,
    COALESCE(up.properties_count, 0), COALESCE((up.limits->>'images_per_property')::int, 10),
    COALESCE((up.limits->>'properties')::int, 3), COALESCE(up.can_publish, true),
    COALESCE(up.is_verified, false), COALESCE(up.is_active, true),
    CASE COALESCE(up.role, 'publisher') WHEN 'admin' THEN '👑 مدير' WHEN 'office' THEN '🏢 مكتب' WHEN 'agent' THEN '🧑‍💼 وسيط' ELSE '👤 ناشر' END,
    CASE WHEN NOT COALESCE(up.can_publish, true) THEN '🚫 محظور' WHEN COALESCE(up.role,'publisher') = 'admin' THEN '🔑 غير محدود'
      WHEN COALESCE(up.properties_count,0) >= COALESCE((up.limits->>'properties')::int, 3) THEN '🔴 وصل للحد' ELSE '🟢 ضمن الحد' END,
    au.created_at, au.last_sign_in_at
  FROM auth.users au LEFT JOIN public.profiles p ON p.user_id = au.id LEFT JOIN public.user_permissions up ON up.user_id = au.id
  ORDER BY au.created_at DESC;
END;
$$;

-- get_users_for_admin (wrapper)
CREATE OR REPLACE FUNCTION public.get_users_for_admin()
RETURNS TABLE(id uuid, email text, full_name text, phone text, role user_role_type, properties_count integer, images_limit integer, properties_limit integer, can_publish boolean, is_verified boolean, is_active boolean, role_name_ar text, status_indicator text, account_created timestamp with time zone, last_sign_in_at timestamp with time zone)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.get_users_for_admin_v2();
$$;

-- set_user_role (2-arg version)
CREATE OR REPLACE FUNCTION public.set_user_role(user_id uuid, new_role text)
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  UPDATE users SET role = new_role::user_role_type WHERE id = user_id;
END;
$$;

-- set_user_role (3-arg version)
CREATE OR REPLACE FUNCTION public.set_user_role(target_user_id uuid, new_role text, admin_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  l_limits jsonb; l_properties_limit INTEGER; l_images_limit INTEGER;
  l_status_text public.user_statuses.status%TYPE := 'publisher';
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.user_permissions up WHERE up.user_id = admin_user_id AND up.role = 'admin') THEN
    RAISE EXCEPTION 'Only admins may change user roles';
  END IF;
  IF new_role = 'admin' THEN l_limits := '{"properties": -1, "images_per_property": -1, "storage_mb": -1}'::jsonb; l_properties_limit := -1; l_images_limit := -1; l_status_text := 'trusted_owner';
  ELSIF new_role = 'office' THEN l_limits := '{"properties": 100, "images_per_property": 10, "storage_mb": 5000}'::jsonb; l_properties_limit := 100; l_images_limit := 10; l_status_text := 'office_agent';
  ELSIF new_role = 'agent' THEN l_limits := '{"properties": 30, "images_per_property": 10, "storage_mb": 1024}'::jsonb; l_properties_limit := 30; l_images_limit := 10; l_status_text := 'trusted_owner';
  ELSIF new_role = 'publisher' THEN l_limits := '{"properties": 3, "images_per_property": 10, "storage_mb": 200}'::jsonb; l_properties_limit := 3; l_images_limit := 10; l_status_text := 'publisher';
  ELSE RAISE EXCEPTION 'Unknown role: %', new_role; END IF;
  INSERT INTO public.user_permissions (user_id, role, properties_count, can_publish, is_verified, is_active, limits)
  VALUES (target_user_id, new_role::user_role_type, 0, (new_role <> 'publisher'), (new_role <> 'publisher'), true, l_limits)
  ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role, limits = EXCLUDED.limits, can_publish = EXCLUDED.can_publish, is_verified = EXCLUDED.is_verified, is_active = EXCLUDED.is_active, updated_at = now();
  INSERT INTO public.user_statuses (user_id, status, properties_limit, images_limit, can_publish, is_verified, verified_at, verified_by, created_at, updated_at)
  VALUES (target_user_id, l_status_text, l_properties_limit, l_images_limit, (new_role <> 'publisher'), (new_role <> 'publisher'), CASE WHEN (new_role <> 'publisher') THEN now() ELSE NULL END, CASE WHEN (new_role <> 'publisher') THEN admin_user_id ELSE NULL END, now(), now())
  ON CONFLICT (user_id) DO UPDATE SET status = EXCLUDED.status, properties_limit = EXCLUDED.properties_limit, images_limit = EXCLUDED.images_limit, can_publish = EXCLUDED.can_publish, is_verified = EXCLUDED.is_verified,
    verified_at = COALESCE(EXCLUDED.verified_at, public.user_statuses.verified_at), verified_by = COALESCE(EXCLUDED.verified_by, public.user_statuses.verified_by), updated_at = now();
  RETURN TRUE;
END;
$$;

-- handle_new_user - تحديث ليضيف في user_permissions بدلاً من user_roles فقط
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, phone, email)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'phone', NEW.email);
  
  -- Keep backward compat with user_roles
  IF NEW.email = 'eng.khalid.applications@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  END IF;
  
  -- Also create user_permissions (the primary role source)
  INSERT INTO public.user_permissions (user_id, role, limits)
  VALUES (NEW.id, 'publisher', '{"properties": 3, "images_per_property": 10, "featured_properties": 0, "storage_mb": 100}'::jsonb)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- update triggers with search_path
CREATE OR REPLACE FUNCTION public.update_real_estate_offices_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public
AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION public.update_office_reviews_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public
AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION public.update_banner_settings_updated_at_column()
RETURNS trigger LANGUAGE plpgsql SET search_path = public
AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION public.handle_new_user_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$ BEGIN
  INSERT INTO public.user_statuses (user_id, status, properties_limit, images_limit) VALUES (NEW.id, 'publisher'::public.user_status, 1, 2);
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.update_user_status(target_user_id uuid, new_status user_status, admin_user_id uuid DEFAULT auth.uid())
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = admin_user_id AND role = 'admin') THEN
    RAISE EXCEPTION 'Only admins can update user status';
  END IF;
  UPDATE public.user_statuses SET status = new_status,
    properties_limit = CASE WHEN new_status = 'publisher' THEN 1 WHEN new_status = 'trusted_owner' THEN 5 WHEN new_status = 'office_agent' THEN 999 END,
    images_limit = CASE WHEN new_status = 'publisher' THEN 2 WHEN new_status = 'trusted_owner' THEN 5 WHEN new_status = 'office_agent' THEN 7 END,
    is_verified = CASE WHEN new_status != 'publisher' THEN true ELSE false END,
    verified_by = CASE WHEN new_status != 'publisher' THEN admin_user_id ELSE NULL END,
    verified_at = CASE WHEN new_status != 'publisher' THEN now() ELSE NULL END,
    updated_at = now()
  WHERE user_id = target_user_id;
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_status(user_id_param uuid DEFAULT auth.uid())
RETURNS TABLE(status user_status, properties_limit integer, images_limit integer, can_publish boolean, is_verified boolean, current_properties_count integer)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  RETURN QUERY SELECT us.status, us.properties_limit, us.images_limit, us.can_publish, us.is_verified,
    COALESCE((SELECT COUNT(*)::INTEGER FROM properties p WHERE p.user_id = user_id_param AND p.is_published = true), 0)
  FROM user_statuses us WHERE us.user_id = user_id_param;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_user_from_auth()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$ BEGIN DELETE FROM auth.users WHERE id = OLD.user_id; RETURN OLD; END; $$;

CREATE OR REPLACE FUNCTION public.notify_office_status_change()
RETURNS trigger LANGUAGE plpgsql SET search_path = public
AS $$
BEGIN
    IF NEW.status != OLD.status THEN
        INSERT INTO notifications (user_id, title, message, type)
        VALUES (NEW.user_id,
            CASE WHEN NEW.status = 'active' THEN 'تم قبول مكتبك العقاري' WHEN NEW.status = 'suspended' THEN 'تم تعليق مكتبك العقاري' WHEN NEW.status = 'inactive' THEN 'تم إلغاء تفعيل مكتبك العقاري' ELSE 'تم تحديث حالة مكتبك العقاري' END,
            CASE WHEN NEW.status = 'active' THEN 'مبروك! تم قبول مكتبك العقاري وأصبح مفعلاً الآن' WHEN NEW.status = 'suspended' THEN 'تم تعليق مكتبك العقاري مؤقتاً' WHEN NEW.status = 'inactive' THEN 'تم إلغاء تفعيل مكتبك العقاري' ELSE 'تم تحديث حالة مكتبك العقاري إلى: ' || NEW.status END,
            CASE WHEN NEW.status = 'active' THEN 'success' WHEN NEW.status IN ('suspended', 'inactive') THEN 'warning' ELSE 'info' END);
    END IF;
    RETURN NEW;
END;
$$;
