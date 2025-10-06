# تفعيل ميزة الخرائط - Map Feature Activation

## المشكلة الحالية
تم تطوير ميزة الخرائط في التطبيق، ولكنها غير مفعلة حالياً لأن أعمدة الإحداثيات الجغرافية (`latitude` و `longitude`) غير موجودة في قاعدة بيانات Supabase.

## الحل

### الخطوة 1: تشغيل Migration في Supabase

1. افتح لوحة تحكم Supabase الخاصة بمشروعك
2. اذهب إلى قسم **SQL Editor**
3. انسخ والصق الكود التالي وقم بتشغيله:

```sql
-- إضافة أعمدة الإحداثيات الجغرافية لجدول العقارات
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS latitude NUMERIC(10, 7),
ADD COLUMN IF NOT EXISTS longitude NUMERIC(10, 7);

-- إضافة تعليقات توضيحية للأعمدة الجديدة
COMMENT ON COLUMN public.properties.latitude IS 'إحداثية العرض الجغرافي للعقار';
COMMENT ON COLUMN public.properties.longitude IS 'إحداثية الطول الجغرافي للعقار';

-- إنشاء فهرس لتحسين أداء الاستعلامات الجغرافية
CREATE INDEX IF NOT EXISTS idx_properties_location 
ON public.properties (latitude, longitude) 
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- رسالة تأكيد
SELECT 'Migration completed successfully! أعمدة الإحداثيات تم إضافتها بنجاح!' as result;
```

### الخطوة 2: تفعيل الكود في التطبيق

بعد تشغيل الـ migration بنجاح، قم بالتالي:

#### في ملف `AddProperty.tsx`:

1. ابحث عن السطر:
```typescript
// Prepare data for insertion (including required property_code)
```

2. أضف الحقول التالية إلى `propertyData`:
```typescript
latitude: formData.latitude,
longitude: formData.longitude,
```

3. أضف نفس الحقول إلى `basicPropertyData`

4. احذف أو علق على الكود المؤقت:
```typescript
// TODO: After adding coordinates to database, add this code:
```

#### في ملف `PropertyDetails.tsx`:

1. ابحث عن التعليق:
```typescript
{/* Property Location Map - TODO: Uncomment after adding coordinates to database */}
```

2. احذف التعليق وأزل علامات التعليق `/* */` من حول كود الخريطة

3. احذف القسم المؤقت:
```typescript
{/* Temporary notice about map feature */}
```

#### في ملف `MapPage.tsx`:

1. استبدل المحتوى الحالي للخريطة بالكود الأصلي للخريطة التفاعلية
2. أزل الرسالة المؤقتة حول التطوير

### الخطوة 3: التحقق من التفعيل

1. أعد تشغيل التطبيق
2. اذهب إلى صفحة "إضافة عقار"
3. حدد موقع على الخريطة
4. أضف العقار
5. اذهب إلى صفحة "الخرائط" للتأكد من ظهور العقار
6. اذهب إلى تفاصيل العقار للتأكد من ظهور الخريطة

## المزايا المتاحة بعد التفعيل

- ✅ عرض موقع العقار الفردي في صفحة التفاصيل
- ✅ عرض جميع العقارات على خريطة تفاعلية
- ✅ دبابيس ملونة حسب نوع العقار (للبيع/للإيجار)
- ✅ بطاقات معلومات منبثقة عند النقر على الدبابيس
- ✅ إمكانية الاتصال المباشر بالمالك من الخريطة
- ✅ حفظ الإحداثيات عند إضافة عقار جديد

## إعادة التفعيل السريع

إذا كنت تريد إعادة تفعيل الميزة لاحقاً:

1. تشغيل الـ SQL المذكور أعلاه
2. في Terminal:
```bash
cd "d:\projects\sakani\maskani 1"
git checkout HEAD -- src/pages/AddProperty.tsx src/pages/PropertyDetails.tsx src/pages/MapPage.tsx
```
3. إعادة إضافة حقول الإحداثيات في الكود

---

**ملاحظة مهمة:** تأكد من تشغيل الـ migration في بيئة التطوير أولاً قبل الإنتاج.