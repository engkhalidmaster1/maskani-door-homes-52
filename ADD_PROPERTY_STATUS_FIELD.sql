-- إضافة حقل status لجدول properties لتتبع حالة الصفقة
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'available' 
CHECK (status IN ('available', 'sold', 'rented', 'under_negotiation'));

-- تحديث الفهرس
CREATE INDEX IF NOT EXISTS idx_properties_status ON public.properties(status);

-- تحديث جميع العقارات الحالية لتكون متاحة
UPDATE public.properties 
SET status = 'available' 
WHERE status IS NULL;

-- تعليق توضيحي
COMMENT ON COLUMN public.properties.status IS 'حالة العقار: available (متاح), sold (مباع), rented (مؤجر), under_negotiation (قيد التفاوض)';