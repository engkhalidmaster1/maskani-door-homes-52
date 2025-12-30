-- ==================================================
-- إصلاح مشكلة التكرار اللانهائي في جدول admin_users
-- ==================================================

-- 1. حذف جميع السياسات القديمة التي تسبب المشكلة
DROP POLICY IF EXISTS "Admin users can read admin_users" ON admin_users;
DROP POLICY IF EXISTS "Admin users can update admin_users" ON admin_users;
DROP POLICY IF EXISTS "Admin users can insert admin_users" ON admin_users;
DROP POLICY IF EXISTS "Admin users can delete admin_users" ON admin_users;
DROP POLICY IF EXISTS "Enable read access for admins" ON admin_users;
DROP POLICY IF EXISTS "Enable insert for admins" ON admin_users;
DROP POLICY IF EXISTS "Enable update for admins" ON admin_users;
DROP POLICY IF EXISTS "Enable delete for admins" ON admin_users;

-- 2. تعطيل RLS مؤقتاً (إذا كنت تريد الوصول الكامل للمديرين)
-- ALTER TABLE admin_users DISABLE ROW LEVEL SECURITY;

-- 3. أو إنشاء سياسات جديدة بدون تكرار لانهائي
-- السياسة الصحيحة: السماح لأي authenticated user بقراءة admin_users
-- (لأن التحقق من الصلاحيات يتم في الكود)
CREATE POLICY "Allow authenticated users to read admin_users"
ON admin_users
FOR SELECT
TO authenticated
USING (true);

-- السماح لأي مستخدم مصادق بإدراج سجل لنفسه فقط
CREATE POLICY "Allow users to insert their own admin record"
ON admin_users
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- السماح بالتحديث فقط للمستخدم نفسه أو super_admin
CREATE POLICY "Allow users to update their own record or super_admin"
ON admin_users
FOR UPDATE
TO authenticated
USING (
    auth.uid() = user_id OR
    EXISTS (
        SELECT 1 FROM admin_users
        WHERE user_id = auth.uid() 
        AND role = 'super_admin' 
        AND active = true
    )
);

-- السماح بالحذف فقط للـ super_admin
CREATE POLICY "Only super_admin can delete"
ON admin_users
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM admin_users
        WHERE user_id = auth.uid() 
        AND role = 'super_admin' 
        AND active = true
    )
);

-- 4. التحقق من السياسات الحالية
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'admin_users';
