# إعداد نظام المفضلة - خطوات الحل

## 🚨 **المشكلة:** لا تظهر صفحة المفضلة

## ✅ **الحل:** تنفيذ الخطوات التالية بالترتيب

### 1️⃣ **تطبيق الهجرة في قاعدة البيانات Supabase**

انتقل إلى [Supabase Dashboard](https://supabase.com/dashboard) وقم بالتالي:

1. اختر مشروعك
2. اذهب إلى `SQL Editor`
3. انسخ والصق الكود التالي:

```sql
-- Create favorites table
CREATE TABLE public.favorites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, property_id)
);

-- Enable Row Level Security
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for favorites
CREATE POLICY "Users can view their own favorites" ON public.favorites
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can add their own favorites" ON public.favorites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own favorites" ON public.favorites
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_favorites_user_id ON public.favorites(user_id);
CREATE INDEX idx_favorites_property_id ON public.favorites(property_id);
CREATE INDEX idx_favorites_created_at ON public.favorites(created_at DESC);

-- Grant permissions
GRANT ALL ON public.favorites TO authenticated;
GRANT ALL ON public.favorites TO service_role;
```

4. اضغط `RUN` لتنفيذ الهجرة

### 2️⃣ **تشغيل التطبيق**

```bash
# في Terminal أو Command Prompt
cd D:\projects\maskani
npm run dev
```

أو انقر نقراً مزدوجاً على `start-maskani.bat`

### 3️⃣ **اختبار النظام**

1. **تسجيل الدخول** في التطبيق
2. **اذهب إلى العقارات** `/properties`
3. **اضغط على زر القلب ❤️** في أي عقار
4. **اذهب إلى المفضلة** `/favorites` من القائمة

### 4️⃣ **التحقق من الروابط**

الروابط التي يجب أن تعمل:
- `http://localhost:8080/favorites` - صفحة المفضلة
- القائمة الجانبية: زر "المفضلة" مع عداد
- الشريط العلوي: زر "المفضلة" مع عداد

## 🔍 **تشخيص المشاكل المحتملة:**

### ❌ **مشكلة 1: خطأ في قاعدة البيانات**
```
Error: relation "public.favorites" does not exist
```
**الحل:** تطبيق الهجرة في الخطوة 1️⃣

### ❌ **مشكلة 2: خطأ في الصلاحيات**
```
Error: insufficient_privilege
```
**الحل:** التأكد من تطبيق جميع `GRANT` statements في الهجرة

### ❌ **مشكلة 3: لا يظهر الرابط في القائمة**
**الحل:** التأكد من تسجيل الدخول أولاً (المفضلة تظهر للمستخدمين المسجلين فقط)

### ❌ **مشكلة 4: خطأ 404**
**الحل:** التأكد من إعادة تشغيل خادم التطوير بعد التحديثات

## 🎯 **التحقق من نجاح الإعداد:**

✅ **يظهر رابط "المفضلة" في القائمة**  
✅ **يعمل زر القلب في العقارات**  
✅ **تفتح صفحة المفضلة بدون أخطاء**  
✅ **يظهر العقار المحفوظ في صفحة المفضلة**  

## 📞 **في حالة استمرار المشكلة:**

1. تحقق من console في المتصفح (F12)
2. تحقق من logs خادم التطوير
3. تأكد من وجود جدول `favorites` في Supabase
4. تأكد من تسجيل الدخول في التطبيق

---
**💡 ملاحظة:** نظام المفضلة يتطلب تسجيل الدخول للعمل!

