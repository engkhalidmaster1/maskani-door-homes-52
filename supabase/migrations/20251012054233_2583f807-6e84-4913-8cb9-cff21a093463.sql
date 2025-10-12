-- تفعيل RLS على جدول audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- إصلاح دالة admin_broadcast_notification - التأكد من وجودها
CREATE OR REPLACE FUNCTION public.admin_broadcast_notification(
  p_title text,
  p_message text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin uuid := auth.uid();
  v_users_count integer;
BEGIN
  -- التحقق من صلاحية المدير
  IF v_admin IS NULL OR NOT public.is_admin(v_admin) THEN
    RAISE EXCEPTION 'غير مصرح. يجب أن تكون مديراً لإرسال الإشعارات';
  END IF;

  -- إدراج إشعار لكل مستخدم
  INSERT INTO public.notifications (id, user_id, title, message, read, type, created_at)
  SELECT 
    gen_random_uuid(), 
    u.id, 
    p_title, 
    p_message, 
    false, 
    'broadcast', 
    now()
  FROM auth.users u;
  
  -- الحصول على عدد المستخدمين الذين تم إرسال الإشعار لهم
  GET DIAGNOSTICS v_users_count = ROW_COUNT;
  
  -- تسجيل في console
  RAISE NOTICE 'تم إرسال إشعار لـ % مستخدم', v_users_count;
  
  RETURN;
END;
$$;

-- منح الصلاحيات
GRANT EXECUTE ON FUNCTION public.admin_broadcast_notification(text, text) TO authenticated;