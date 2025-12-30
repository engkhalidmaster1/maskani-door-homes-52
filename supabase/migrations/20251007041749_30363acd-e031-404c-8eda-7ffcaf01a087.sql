-- إضافة عمود market إلى جدول properties
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS market TEXT;

-- إضافة index على عمود market لتحسين الأداء عند البحث والفلترة
CREATE INDEX IF NOT EXISTS idx_properties_market 
ON public.properties (market) 
WHERE market IS NOT NULL;

-- إضافة تعليق على العمود
COMMENT ON COLUMN public.properties.market IS 'السوق أو المنطقة التي ينتمي إليها العقار';