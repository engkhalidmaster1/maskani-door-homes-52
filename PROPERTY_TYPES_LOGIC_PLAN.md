# خطة شاملة: نظام ربط أنواع العقارات بالحقول المنطقية

**التاريخ**: 15 نوفمبر 2025  
**الهدف**: إنشاء نظام منطقي متكامل يربط كل نوع عقار بالحقول المناسبة له فقط

---

## 1. أنواع العقارات المدعومة

### 1.1 العقارات السكنية (Residential)
1. **شقة (apartment)** - وحدة سكنية داخل عمارة
2. **بيت / منزل (house)** - بناء سكني مستقل
3. **فيلا (villa)** - منزل فاخر مع حديقة
4. **استوديو (studio)** - وحدة صغيرة مفتوحة
5. **دوبلكس (duplex)** - وحدة بطابقين
6. **بنتهاوس (penthouse)** - شقة فاخرة في الطابق العلوي

### 1.2 العقارات التجارية (Commercial)
1. **محل تجاري (shop)** - محل للبيع بالتجزئة
2. **مكتب (office)** - مساحة عمل إدارية
3. **مستودع (warehouse)** - مساحة تخزين
4. **معرض (showroom)** - مساحة عرض تجاري
5. **مطعم/كافيه (restaurant_cafe)** - مساحة مطاعم
6. **عيادة (clinic)** - مساحة طبية

### 1.3 الأراضي (Land)
1. **أرض سكنية (residential_land)** - للبناء السكني
2. **أرض تجارية (commercial_land)** - للبناء التجاري
3. **أرض زراعية (agricultural_land)** - للزراعة
4. **أرض صناعية (industrial_land)** - للمصانع

### 1.4 عقارات خاصة (Special)
1. **مزرعة (farm)** - أرض زراعية مع مباني
2. **شاليه (chalet)** - بيت ريفي/ساحلي
3. **غرفة (room)** - غرفة مفردة للإيجار

---

## 2. الحقول الأساسية والمشتركة

### 2.1 حقول إلزامية لجميع الأنواع
```typescript
{
  title: string;              // عنوان العقار
  property_type: PropertyType; // نوع العقار
  listing_type: 'sale' | 'rent'; // نوع العرض
  price: number;              // السعر
  area: number;               // المساحة (متر مربع)
  description?: string;       // الوصف
  location?: string;          // الموقع العام
  address?: string;           // العنوان التفصيلي
  latitude?: number;          // خط العرض
  longitude?: number;         // خط الطول
  market?: string;            // السوق/المنطقة
  images?: string[];          // الصور
}
```

---

## 3. الحقول الخاصة بكل نوع

### 3.1 شقة (apartment)
**حقول إلزامية إضافية**:
```typescript
{
  building: string;           // رقم العمارة ✓ مطلوب
  apartment: string;          // رقم الشقة ✓ مطلوب
  floor: string;              // الطابق ✓ مطلوب
  bedrooms: number;           // عدد غرف النوم ✓ مطلوب
  bathrooms?: number;         // عدد الحمامات
  furnished: 'yes'|'no';      // مفروش؟ (للإيجار فقط) ✓ مطلوب للإيجار
}
```
**حقول اختيارية**:
- balcony (شرفة)
- parking (موقف سيارة)
- elevator (مصعد)

### 3.2 بيت/منزل (house)
**حقول إلزامية إضافية**:
```typescript
{
  bedrooms: number;           // عدد غرف النوم ✓ مطلوب
  bathrooms?: number;         // عدد الحمامات
  floors_count?: number;      // عدد الطوابق
  furnished: 'yes'|'no';      // مفروش؟ (للإيجار فقط) ✓ مطلوب للإيجار
}
```
**حقول اختيارية**:
- garden (حديقة)
- garage (جراج)
- swimming_pool (مسبح)

### 3.3 فيلا (villa)
**حقول إلزامية إضافية**:
```typescript
{
  bedrooms: number;           // عدد غرف النوم ✓ مطلوب
  bathrooms: number;          // عدد الحمامات ✓ مطلوب
  floors_count: number;       // عدد الطوابق ✓ مطلوب
  land_area?: number;         // مساحة الأرض
  building_area?: number;     // مساحة البناء
  furnished: 'yes'|'no';      // مفروش؟ (للإيجار فقط)
}
```
**حقول اختيارية**:
- garden (حديقة) ✓ غالباً موجودة
- garage (جراج)
- swimming_pool (مسبح)
- maid_room (غرفة خادمة)
- driver_room (غرفة سائق)

### 3.4 استوديو (studio)
**حقول إلزامية إضافية**:
```typescript
{
  building: string;           // رقم العمارة ✓ مطلوب
  apartment: string;          // رقم الاستوديو ✓ مطلوب
  floor: string;              // الطابق ✓ مطلوب
  bathrooms?: number;         // عدد الحمامات (عادة 1)
  furnished: 'yes'|'no';      // مفروش؟ ✓ مطلوب للإيجار
}
```
**ملاحظة**: لا يوجد bedrooms (غرفة مفتوحة واحدة)

### 3.5 دوبلكس (duplex)
**حقول إلزامية إضافية**:
```typescript
{
  building: string;           // رقم العمارة ✓ مطلوب
  apartment: string;          // رقم الوحدة ✓ مطلوب
  floor: string;              // الطوابق (مثل: "3-4") ✓ مطلوب
  bedrooms: number;           // عدد غرف النوم ✓ مطلوب
  bathrooms: number;          // عدد الحمامات ✓ مطلوب
  floors_count: number;       // عدد الطوابق (2 عادة)
  furnished: 'yes'|'no';      // مفروش؟ ✓ مطلوب للإيجار
}
```

### 3.6 محل تجاري (shop)
**حقول إلزامية إضافية**:
```typescript
{
  building?: string;          // رقم العمارة
  floor?: string;             // الطابق
  shop_type?: string;         // نوع المحل (ملابس، إلكترونيات...)
  street_facing: boolean;     // واجهة على الشارع؟
}
```
**حقول غير مطلوبة**: bedrooms, bathrooms, furnished

### 3.7 مكتب (office)
**حقول إلزامية إضافية**:
```typescript
{
  building: string;           // رقم العمارة ✓ مطلوب
  floor: string;              // الطابق ✓ مطلوب
  office_number?: string;     // رقم المكتب
  rooms_count?: number;       // عدد الغرف
  furnished: 'yes'|'no';      // مفروش؟ (للإيجار فقط)
}
```

### 3.8 مستودع (warehouse)
**حقول إلزامية إضافية**:
```typescript
{
  height?: number;            // ارتفاع السقف
  loading_dock: boolean;      // رصيف تحميل؟
  cold_storage: boolean;      // تبريد؟
}
```
**حقول غير مطلوبة**: bedrooms, bathrooms, floor, apartment, building

### 3.9 أرض (land types)
**حقول إلزامية إضافية**:
```typescript
{
  land_type: 'residential'|'commercial'|'agricultural'|'industrial';
  street_width?: number;      // عرض الشارع
  street_facing: boolean;     // واجهة على الشارع؟
  corner: boolean;            // زاوية؟
  licensed: boolean;          // مرخصة؟
}
```
**حقول غير مطلوبة**: bedrooms, bathrooms, floor, apartment, building, furnished

### 3.10 غرفة (room)
**حقول إلزامية إضافية**:
```typescript
{
  building: string;           // رقم العمارة ✓ مطلوب
  apartment?: string;         // رقم الشقة
  floor: string;              // الطابق ✓ مطلوب
  room_type: 'single'|'shared'; // نوع الغرفة
  shared_bathroom: boolean;   // حمام مشترك؟
  furnished: 'yes'|'no';      // مفروش؟ ✓ مطلوب
}
```

---

## 4. قواعد التحقق (Validation Rules)

### 4.1 قواعد عامة
- `price > 0` (جميع الأنواع)
- `area > 0` (جميع الأنواع)
- `listing_type` must be 'sale' or 'rent'
- إذا كان `listing_type = 'rent'` والنوع سكني → `furnished` مطلوب

### 4.2 قواعد خاصة بالشقق والاستوديو والدوبلكس
- `building` مطلوب (نص غير فارغ)
- `apartment` مطلوب (نص غير فارغ)
- `floor` مطلوب (نص غير فارغ)

### 4.3 قواعد الغرف
- `bedrooms >= 0` (للعقارات السكنية)
- شقة/بيت/فيلا/دوبلكس: `bedrooms >= 1` عادةً
- استوديو: لا يوجد bedrooms
- محلات/مكاتب/مستودعات/أراضي: لا يوجد bedrooms

### 4.4 قواعد التجاري
- محل/مكتب/مستودع: لا حاجة لـ `bedrooms`, `bathrooms`, `furnished`
- أرض: لا حاجة لأي حقول بناء

---

## 5. خطة التنفيذ

### المرحلة 1: قاعدة البيانات ✅
1. إنشاء migration لإضافة الحقول الجديدة
2. تحديث property_type enum لتشمل جميع الأنواع
3. إنشاء جدول `property_type_fields_config` للربط المنطقي
4. تحديث دالة `property_validation_core` لتطبيق القواعد الجديدة

### المرحلة 2: TypeScript Types ✅
1. تحديث types لتعكس جميع أنواع العقارات
2. إنشاء interfaces منفصلة لكل نوع
3. إنشاء type guards للتحقق من النوع

### المرحلة 3: UI Components ✅
1. تحديث `PropertyTypeSection` لعرض جميع الأنواع
2. إنشاء components شرطية لكل نوع
3. إضافة منطق إظهار/إخفاء الحقول

### المرحلة 4: Validation Hooks ✅
1. إنشاء `usePropertyTypeValidation` hook
2. إنشاء `useConditionalFields` hook
3. تحديث `useAddPropertyForm` لاستخدام الـ hooks

### المرحلة 5: صفحات العرض ✅
1. تحديث صفحات عرض العقارات
2. إضافة عرض شرطي للحقول
3. تحسين تجربة المستخدم

### المرحلة 6: الاختبار ✅
1. اختبار كل نوع عقار
2. التحقق من validation
3. اختبار UI/UX

---

## 6. أمثلة على السيناريوهات

### سيناريو 1: إضافة شقة للإيجار
```typescript
{
  property_type: 'apartment',
  listing_type: 'rent',
  // حقول إلزامية:
  building: '5',        ✓
  apartment: '301',     ✓
  floor: '3',           ✓
  bedrooms: 2,          ✓
  furnished: 'yes',     ✓ (مطلوب للإيجار)
  price: 500,           ✓
  area: 120,            ✓
}
```

### سيناريو 2: إضافة بيت للبيع
```typescript
{
  property_type: 'house',
  listing_type: 'sale',
  // حقول إلزامية:
  bedrooms: 3,          ✓
  price: 150000,        ✓
  area: 250,            ✓
  // حقول اختيارية:
  bathrooms: 2,
  floors_count: 2,
  garden: true,
  // غير مطلوب:
  building: null,       ✓ (لا يُطلب للبيوت)
  apartment: null,      ✓
  floor: null,          ✓
  furnished: null,      ✓ (لا يُطلب للبيع)
}
```

### سيناريو 3: إضافة محل تجاري
```typescript
{
  property_type: 'shop',
  listing_type: 'rent',
  // حقول إلزامية:
  price: 1000,          ✓
  area: 50,             ✓
  // حقول اختيارية:
  building: '10',
  floor: 'Ground',
  street_facing: true,
  // غير مطلوب ولن يظهر:
  bedrooms: null,       ✓ (لا معنى له في محل)
  furnished: null,      ✓ (لا يُطلب)
  apartment: null,      ✓
}
```

### سيناريو 4: إضافة أرض سكنية
```typescript
{
  property_type: 'residential_land',
  listing_type: 'sale',
  // حقول إلزامية:
  price: 80000,         ✓
  area: 500,            ✓
  land_type: 'residential', ✓
  // حقول اختيارية:
  street_width: 12,
  corner: true,
  licensed: true,
  // جميع حقول البناء لن تظهر:
  bedrooms: null,       ✓
  bathrooms: null,      ✓
  building: null,       ✓
  apartment: null,      ✓
  floor: null,          ✓
  furnished: null,      ✓
}
```

---

## 7. ملخص الفوائد

### 7.1 للمستخدمين
- ✅ واجهة أنظف وأسهل
- ✅ عدم رؤية حقول غير مطلوبة
- ✅ رسائل خطأ واضحة ومحددة
- ✅ تجربة مخصصة لكل نوع عقار

### 7.2 للنظام
- ✅ بيانات أكثر دقة واتساقاً
- ✅ validation محكم على مستوى الخادم والعميل
- ✅ قابلية التوسع لإضافة أنواع جديدة
- ✅ صيانة أسهل

### 7.3 للأعمال
- ✅ يتوافق مع معايير العقارات العالمية
- ✅ يدعم سوق العقارات المحلي
- ✅ مرونة في إضافة أنواع جديدة
- ✅ تقارير أدق

---

## 8. الخطوات التالية

1. ✅ مراجعة وموافقة الخطة
2. ⏳ تنفيذ المرحلة 1 (قاعدة البيانات)
3. ⏳ تنفيذ المرحلة 2 (TypeScript)
4. ⏳ تنفيذ المرحلة 3 (UI)
5. ⏳ تنفيذ المرحلة 4 (Validation)
6. ⏳ تنفيذ المرحلة 5 (العرض)
7. ⏳ الاختبار والتحسين

---

**ملاحظة مهمة**: هذه الخطة قابلة للتوسع والتعديل حسب احتياجات السوق المحلي وملاحظات المستخدمين.
