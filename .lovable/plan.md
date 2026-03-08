

# فحص توافق صفحة إضافة العقار مع بقية النظام

---

## العيوب المكتشفة

### 1. تناقض حرج في أنواع العقارات (سيمنع حفظ العقار)
- **PropertyTypeSection.tsx** (واجهة الإضافة) تعرض: `apartment | villa | commercial`
- **useAddPropertyForm.ts** (التحقق) يقبل فقط: `apartment | house | commercial`
- **النتيجة**: إذا اختار المستخدم "فيلا" من الواجهة، سيُرفض النموذج لأن `villa` ليست ضمن `ALLOWED_PROPERTY_TYPES`
- **MapPage.tsx** و **EditProperty.tsx** يستخدمان `house` وليس `villa`
- **AdvancedSearchBar.tsx** يعرض كلاً من `villa` و `house` و `land` — تناقض إضافي

### 2. حقل الحمامات (bathrooms) مفقود بالكامل
- قاعدة البيانات تحتوي على عمود `bathrooms`
- الخريطة تصفّي بعدد الحمامات
- صفحة المقارنة تعرض الحمامات
- **لكن صفحة الإضافة لا تحتوي على حقل لإدخال عدد الحمامات** → يُحفظ دائماً كـ `null`

### 3. AdvancedSearchBar يحتوي أنواع عقارات غير قابلة للإنشاء
- يعرض "أرض" (`land`) و "فيلا" (`villa`) كخيارات بحث
- لكن لا يمكن إضافة عقار بهذه الأنواع من صفحة الإضافة
- الخريطة لا تدعم هذه الأنواع في فلاترها أيضاً

### 4. حقل `status` لا يُضبط عند الإضافة
- الخريطة تصفّي بـ `available | negotiating`
- العقار يُحفظ بـ `status: 'available'` (القيمة الافتراضية في DB) — مقبول لكن لا يوجد خيار لتغييره

---

## خطة الإصلاح

### الإصلاح 1: توحيد أنواع العقارات عبر النظام
- تغيير `PropertyTypeSection.tsx` من `villa` إلى `house` ليتوافق مع:
  - `useAddPropertyForm.ts` (التحقق)
  - `MapPage.tsx` (الفلاتر)
  - `EditProperty.tsx` (التعديل)
- التسمية: `apartment` → شقة، `house` → بيت، `commercial` → محل تجاري
- تحديث `AdvancedSearchBar.tsx` لإزالة `villa` و `land` أو توحيدهما

### الإصلاح 2: إضافة حقل الحمامات
- إضافة `bathrooms` إلى `initialFormData` في `useAddPropertyForm.ts`
- إضافة حقل اختيار عدد الحمامات في `FloorAndRoomsSection.tsx` (بجانب غرف النوم)
- تضمين `bathrooms` في بيانات الإرسال `propertyData`

### الإصلاح 3: تنظيف AdvancedSearchBar
- إزالة `villa` و `land` من خيارات البحث أو استبدالهما بالقيم المتوافقة (`house`, `commercial`, `apartment`)

---

## الملفات المتأثرة
- `src/components/Property/AddProperty/PropertyTypeSection.tsx` — تغيير villa→house
- `src/hooks/useAddPropertyForm.ts` — إضافة bathrooms
- `src/components/Property/AddProperty/FloorAndRoomsSection.tsx` — إضافة حقل الحمامات
- `src/components/Home/AdvancedSearchBar.tsx` — توحيد أنواع العقارات

