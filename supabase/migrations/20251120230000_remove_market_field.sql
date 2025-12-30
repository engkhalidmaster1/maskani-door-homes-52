-- إزالة حقل market من جدول properties
-- Migration created: 2025-11-20

-- حذف الـ index أولاً
DROP INDEX IF EXISTS idx_properties_market;
DROP INDEX IF EXISTS properties_market_idx;

-- حذف العمود market
ALTER TABLE public.properties
DROP COLUMN IF EXISTS market;

-- إضافة تعليق على الـ migration
COMMENT ON TABLE public.properties IS 'تم إزالة حقل market في 2025-11-20';
