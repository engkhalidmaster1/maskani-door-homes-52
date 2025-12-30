-- إعطاء صلاحية التنفيذ لدالة log_audit_entry لجميع المستخدمين عبر واجهة Supabase
GRANT EXECUTE ON FUNCTION public.log_audit_entry(text, text, text, jsonb, uuid) TO anon, authenticated;
