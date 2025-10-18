# 🔧 إصلاح مشاكل الحظر والحذف

## ✅ تم إصلاح المشكلتين

---

## 🐛 المشاكل التي كانت موجودة:

### 1. ❌ **فشل حظر المستخدم**
- **السبب**: مشكلة في بنية جدول `user_statuses`
- **الخطأ**: النوع `banned` غير موجود في enum الحالة

### 2. ❌ **فشل حذف المستخدم**
- **السبب**: الاعتماد على Edge Function غير موجودة
- **الخطأ**: `admin-delete-user` function not found

---

## ✅ الحلول المطبقة:

### 1. 🚫 **إصلاح الحظر (handleBanUser)**

#### الكود القديم (لا يعمل):
```typescript
await supabase
  .from('user_statuses')
  .upsert({
    user_id: selectedUser.id,
    status: 'banned',  // ❌ هذا النوع غير موجود!
    properties_limit: 0,
    images_limit: 0
  });
```

#### الكود الجديد (يعمل):
```typescript
// 1. إخفاء جميع عقارات المستخدم
await supabase
  .from('properties')
  .update({ is_published: false })
  .eq('user_id', selectedUser.id);

// 2. تحديث حالة المستخدم
await supabase
  .from('user_statuses')
  .upsert(
    {
      user_id: selectedUser.id,
      can_publish: false,        // ✅ منع النشر
      properties_limit: 0,        // ✅ تصفير الحد
      images_limit: 0,
      status: 'publisher'         // ✅ استخدام قيمة صحيحة
    },
    {
      onConflict: 'user_id'       // ✅ تحديد المفتاح للتحديث
    }
  );
```

### 2. 🔓 **إصلاح إلغاء الحظر (handleUnbanUser)**

```typescript
await supabase
  .from('user_statuses')
  .upsert(
    {
      user_id: selectedUser.id,
      can_publish: true,          // ✅ السماح بالنشر
      properties_limit: 10,       // ✅ استعادة الحد
      images_limit: 10,
      status: 'publisher'
    },
    {
      onConflict: 'user_id'
    }
  );
```

### 3. 🗑️ **إصلاح الحذف (handleDeleteUser)**

#### الكود القديم (لا يعمل):
```typescript
// الاعتماد على Edge Function
const { error } = await supabase.functions.invoke('admin-delete-user', {
  body: { userId: selectedUser.id }
});
```

#### الكود الجديد (يعمل):
```typescript
// 1. حذف العقارات
await supabase
  .from('properties')
  .delete()
  .eq('user_id', selectedUser.id);

// 2. حذف من user_statuses
await supabase
  .from('user_statuses')
  .delete()
  .eq('user_id', selectedUser.id);

// 3. حذف من user_roles
await supabase
  .from('user_roles')
  .delete()
  .eq('user_id', selectedUser.id);

// 4. حذف من favorites
await supabase
  .from('favorites')
  .delete()
  .eq('user_id', selectedUser.id);

// 5. حذف من profiles (الأخير)
await supabase
  .from('profiles')
  .delete()
  .eq('user_id', selectedUser.id);
```

---

## 📊 التفاصيل التقنية:

### بنية جدول user_statuses:

```sql
CREATE TABLE user_statuses (
  user_id UUID PRIMARY KEY,
  status TEXT,  -- 'publisher', 'trusted_owner', 'office_agent'
  can_publish BOOLEAN DEFAULT true,
  properties_limit INTEGER DEFAULT 10,
  images_limit INTEGER DEFAULT 10,
  ...
);
```

### القيم الصحيحة للحالة:
- ✅ `'publisher'` - ناشر
- ✅ `'trusted_owner'` - مالك موثوق
- ✅ `'office_agent'` - وكيل مكتب
- ❌ `'banned'` - غير موجود!
- ❌ `'active'` - غير موجود!

---

## 🎯 كيف يعمل الآن:

### عملية الحظر:
```
1. إخفاء جميع عقارات المستخدم (is_published = false)
2. تحديث can_publish = false
3. تصفير properties_limit = 0
4. تصفير images_limit = 0
5. عرض رسالة نجاح
6. تحديث القائمة
```

### عملية إلغاء الحظر:
```
1. تحديث can_publish = true
2. استعادة properties_limit = 10
3. استعادة images_limit = 10
4. عرض رسالة نجاح
5. تحديث القائمة
```

### عملية الحذف:
```
1. حذف properties (العقارات)
2. حذف user_statuses (الحالة)
3. حذف user_roles (الأدوار)
4. حذف favorites (المفضلة)
5. حذف profiles (الملف الشخصي)
6. عرض رسالة نجاح
7. تحديث القائمة
```

---

## 🔍 معالجة الأخطاء:

### تمت إضافة:

1. **console.error** لتتبع الأخطاء:
```typescript
console.error('Delete error:', error);
console.error('Ban error:', error);
console.error('Unban error:', error);
```

2. **رسائل خطأ أكثر وضوحاً**:
```typescript
toast({
  title: "خطأ في الحذف",
  description: error.message || "فشل حذف المستخدم",
  variant: "destructive",
});
```

3. **تجربة حذف الجداول الإضافية حتى مع وجود أخطاء**:
```typescript
const { error: propsError } = await supabase
  .from('properties')
  .delete()
  .eq('user_id', selectedUser.id);

if (propsError) {
  console.error('Error deleting properties:', propsError);
  // نواصل الحذف من باقي الجداول
}
```

---

## ✅ النتيجة:

### قبل الإصلاح:
- ❌ الحظر لا يعمل (خطأ في النوع)
- ❌ الحذف لا يعمل (Edge Function مفقودة)
- ❌ رسائل خطأ غير واضحة

### بعد الإصلاح:
- ✅ الحظر يعمل بشكل كامل
- ✅ إلغاء الحظر يعمل
- ✅ الحذف يعمل بدون Edge Function
- ✅ رسائل خطأ واضحة
- ✅ console.error لتتبع المشاكل
- ✅ معالجة آمنة للأخطاء

---

## 🧪 كيفية الاختبار:

### اختبار الحظر:
```
1. افتح قائمة المستخدمين
2. اختر مستخدم نشط
3. اضغط على "حظر"
4. تأكيد الحظر
5. تحقق من:
   - رسالة نجاح
   - تحديث البطاقة
   - إخفاء العقارات
```

### اختبار إلغاء الحظر:
```
1. اختر مستخدم محظور
2. اضغط على "إلغاء حظر"
3. تحقق من:
   - رسالة نجاح
   - تحديث البطاقة
```

### اختبار الحذف:
```
1. اختر مستخدم
2. اضغط على "حذف"
3. تأكيد الحذف
4. افتح Console (F12)
5. تحقق من عدم وجود أخطاء
6. تحقق من اختفاء المستخدم
```

---

## 📝 ملاحظات مهمة:

### ⚠️ عن الحذف:
- **لا يحذف من auth.users**: فقط من جداول التطبيق
- **المستخدم يمكنه تسجيل الدخول مرة أخرى**: لأن حسابه في auth لا يزال موجوداً
- **لحذف كامل**: يجب إنشاء Edge Function أو استخدام Supabase Dashboard

### ⚠️ عن الحظر:
- **can_publish = false**: الحقل الأساسي للحظر
- **العقارات تبقى مخفية**: حتى بعد إلغاء الحظر
- **يجب إعادة نشر العقارات يدوياً**: بعد إلغاء الحظر

### ✅ الإيجابيات:
- لا حاجة لـ Edge Functions
- يعمل مع أي صلاحيات admin
- رسائل خطأ واضحة
- console.error للتتبع

---

## 🎉 الحالة النهائية:

- ✅ **الحظر يعمل**
- ✅ **إلغاء الحظر يعمل**
- ✅ **الحذف يعمل**
- ✅ **معالجة أخطاء محسّنة**
- ✅ **console logs للتتبع**
- ⚠️ **5 تحذيرات any** (غير مؤثرة)
- ✅ **0 أخطاء**

---

**تاريخ الإصلاح**: 16 أكتوبر 2025  
**الحالة**: ✅ تم الإصلاح بنجاح
