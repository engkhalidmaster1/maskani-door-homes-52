-- إضافة عمود is_hidden إلى جدول properties
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS is_hidden boolean NOT NULL DEFAULT false;

-- فهرس لتحسين الاستعلامات على is_hidden
CREATE INDEX IF NOT EXISTS idx_properties_is_hidden ON public.properties(is_hidden);
