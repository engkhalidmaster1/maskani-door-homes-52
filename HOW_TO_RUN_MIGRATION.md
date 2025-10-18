# 🚀 خطوات تنفيذ Migration - مبسطة

## ⚠️ هام: لا أستطيع الوصول إلى Supabase Dashboard من هنا
**لذا اتبع هذه الخطوات بنفسك:**

---

## 📋 الخطوة 1: افتح Supabase SQL Editor

1. اذهب إلى: **https://supabase.com/dashboard**
2. سجل دخول بحسابك
3. اختر المشروع: **maskani-door-homes-52**
4. من القائمة اليسرى، اضغط على: **SQL Editor**
5. اضغط على: **"New Query"** أو **"+ New query"**

---

## 📂 الخطوة 2: افتح ملف Migration

في VS Code (هذه النافذة):

1. اضغط **Ctrl+P** لفتح Quick Open
2. اكتب: `20251017000000_unified_permissions_system.sql`
3. اضغط **Enter**
4. اضغط **Ctrl+A** لتحديد كل المحتوى (553 سطر)
5. اضغط **Ctrl+C** للنسخ

**أو:**
- الملف موجود في المجلد: `supabase/migrations/`
- اسم الملف: `20251017000000_unified_permissions_system.sql`

---

## 📝 الخطوة 3: نفّذ Migration

في Supabase SQL Editor:

1. **الصق** المحتوى الذي نسخته (Ctrl+V)
2. تأكد أنك ترى السطر الأول:
   ```sql
   -- ========================================
   -- Unified Permissions System
   ```
3. تأكد أنك ترى السطر الأخير:
   ```sql
   RAISE NOTICE '🎉 Migration completed successfully!';
   ```
4. اضغط **"Run"** أو اضغط **Ctrl+Enter**

---

## ✅ الخطوة 4: تحقق من النجاح

يجب أن ترى في نافذة **Messages/Output**:

```
✅ Unified Permissions System Created Successfully!
📊 Roles Available:
  - admin: مدير النظام (غير محدود)
  - office: مكتب عقارات (غير محدود عقارات، 10 صور)
  - agent: وكيل عقاري موثق (10 عقارات، 10 صور)
  - publisher: ناشر عادي (3 عقارات، 10 صور)

📋 Components Created:
  ✅ Table: user_permissions
  ✅ Type: user_role_type
  ✅ Functions: 6
  ✅ Triggers: 3
  ✅ Policies: 4
  ✅ View: users_with_permissions
  ✅ Data Migration: Complete

📝 Next Steps:
  1. Run MAKE_ADMIN_UNIFIED.sql to assign admin role
  2. Test with CHECK_MIGRATION_STATUS.sql
  3. Update frontend to use new system

🎉 Migration completed successfully!

Success. No rows returned
```

---

## ⚠️ إذا ظهرت أخطاء

### **خطأ: "relation already exists"**
**الحل:** Migration نُفذ من قبل - تخطى للخطوة التالية

### **خطأ: "permission denied"**
**الحل:** تأكد أنك مسجل دخول كـ Owner للمشروع

### **خطأ: "syntax error"**
**الحل:** تأكد من نسخ الملف كاملاً (553 سطر)

---

## 🎯 بعد النجاح - الخطوة التالية

### **خطوة 2: تعيين نفسك كمدير**

1. افتح ملف: `MAKE_ADMIN_UNIFIED.sql`
2. ابحث عن: `'eng.khalid.work@gmail.com'` (سطور متعددة)
3. **استبدل الكل** بـ: **إيميلك الفعلي** (اللي سجلت به)
4. انسخ المحتوى المعدل
5. الصقه في Supabase SQL Editor
6. اضغط **Run**

**النتيجة المتوقعة:**
```
✅ تم تعيين YOUR_EMAIL كمدير النظام!
User ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
🔑 الصلاحيات: غير محدودة في كل شيء
```

---

## 📞 أخبرني بعد التنفيذ

عندما تنتهي، أخبرني بواحد من هذه:

✅ **"تم بنجاح"** - سأنتقل للخطوة التالية
❌ **"ظهر خطأ: [نص الخطأ]"** - سأساعدك في حله
❓ **"غير واضح"** - سأشرح بالتفصيل أكثر

---

**جاهز؟ ابدأ الآن!** 🚀
