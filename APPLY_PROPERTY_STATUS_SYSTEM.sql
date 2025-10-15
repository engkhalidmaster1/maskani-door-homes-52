-- تطبيق نظام حالة الصفقة للعقارات
-- يجب تشغيل هذا الكود في Supabase SQL Editor

-- إضافة حقل status لجدول properties
DO $$ 
BEGIN
    -- التحقق من وجود العمود قبل إضافته
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'properties' 
        AND column_name = 'status'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.properties 
        ADD COLUMN status TEXT DEFAULT 'available';
        
        -- إضافة قيد للتحقق من القيم المسموحة
        ALTER TABLE public.properties 
        ADD CONSTRAINT check_property_status 
        CHECK (status IN ('available', 'sold', 'rented', 'under_negotiation'));
        
        RAISE NOTICE 'تم إضافة حقل status إلى جدول properties';
    ELSE
        RAISE NOTICE 'حقل status موجود بالفعل في جدول properties';
    END IF;
END $$;

-- إنشاء فهرس للحقل الجديد لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_properties_status ON public.properties(status);

-- تحديث جميع العقارات الحالية لتكون متاحة (إن لم تكن محددة)
UPDATE public.properties 
SET status = 'available' 
WHERE status IS NULL;

-- تحديث RLS policies إذا لزم الأمر
-- لا حاجة لتحديث policies حيث أن حقل status يتبع نفس قواعد الوصول الحالية

-- إضافة تعليق توضيحي للحقل
COMMENT ON COLUMN public.properties.status IS 'حالة العقار: available (متاح), sold (مباع), rented (مؤجر), under_negotiation (قيد التفاوض)';

-- عرض نتيجة الإجراء
SELECT 
    'نجح تطبيق نظام حالة الصفقة' as result,
    COUNT(*) as total_properties,
    COUNT(CASE WHEN status = 'available' THEN 1 END) as available_properties,
    COUNT(CASE WHEN status = 'sold' THEN 1 END) as sold_properties,
    COUNT(CASE WHEN status = 'rented' THEN 1 END) as rented_properties,
    COUNT(CASE WHEN status = 'under_negotiation' THEN 1 END) as under_negotiation_properties
FROM public.properties;