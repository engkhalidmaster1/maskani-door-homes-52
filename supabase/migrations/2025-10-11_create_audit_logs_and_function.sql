-- إنشاء جدول audit_logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id serial PRIMARY KEY,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id text NOT NULL,
  details jsonb,
  user_id uuid,
  created_at timestamp DEFAULT now()
);

-- إنشاء دالة تسجيل العمليات في جدول audit_logs
CREATE OR REPLACE FUNCTION public.log_audit_entry(
  p_action text,
  p_resource_type text,
  p_resource_id text,
  p_details jsonb,
  p_user_id uuid
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO audit_logs(action, resource_type, resource_id, details, user_id, created_at)
  VALUES (p_action, p_resource_type, p_resource_id, p_details, p_user_id, now());
END;
$$;
