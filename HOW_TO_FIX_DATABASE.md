# 🔧 كيفية إصلاح قاعدة البيانات

## الخطوات البسيطة:

### 1. افتح Supabase Dashboard
- اذهب إلى: https://supabase.com/dashboard
- سجل دخولك
- اختر مشروع maskani
- اضغط على "SQL Editor" في القائمة الجانبية

### 2. انسخ والصق هذا الكود:

```sql
INSERT INTO user_roles (user_id, role) 
VALUES ('85c5601e-d99e-4daa-90c6-515f5accff06', 'admin');

INSERT INTO profiles (user_id, email, first_name, last_name, full_name) 
VALUES ('85c5601e-d99e-4daa-90c6-515f5accff06', 'eng.khalid.work@gmail.com', 'Khalid', 'Engineer', 'Khalid Engineer');

INSERT INTO user_statuses (user_id, status) 
VALUES ('85c5601e-d99e-4daa-90c6-515f5accff06', 'active');
```

### 3. اضغط زر "Run"

### 4. اختبر النظام:
- اذهب إلى http://localhost:8082 
- اضغط F5 لإعادة التحميل
- يجب أن تختفي جميع الأخطاء

## إذا ظهرت رسالة خطأ "already exists":

```sql
UPDATE user_roles SET role = 'admin' WHERE user_id = '85c5601e-d99e-4daa-90c6-515f5accff06';
UPDATE profiles SET email = 'eng.khalid.work@gmail.com', full_name = 'Khalid Engineer' WHERE user_id = '85c5601e-d99e-4daa-90c6-515f5accff06';
UPDATE user_statuses SET status = 'active' WHERE user_id = '85c5601e-d99e-4daa-90c6-515f5accff06';
```

## للتحقق من النجاح:

```sql
SELECT 
    ur.role,
    p.email,
    us.status
FROM user_roles ur
JOIN profiles p ON ur.user_id = p.user_id
JOIN user_statuses us ON ur.user_id = us.user_id
WHERE ur.user_id = '85c5601e-d99e-4daa-90c6-515f5accff06';
```

يجب أن تظهر النتيجة:
- role: admin
- email: eng.khalid.work@gmail.com  
- status: active

بعد ذلك سيعمل النظام بدون أخطاء!