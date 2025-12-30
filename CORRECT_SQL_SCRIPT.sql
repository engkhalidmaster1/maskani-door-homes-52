-- 🔧 السكريپت الصحيح لإصلاح قاعدة البيانات
-- انسخ هذا النص بدقة والصقه في Supabase SQL Editor

INSERT INTO user_roles (user_id, role) 
VALUES ('85c5601e-d99e-4daa-90c6-515f5accff06', 'admin');

INSERT INTO profiles (user_id, email, first_name, last_name, full_name) 
VALUES ('85c5601e-d99e-4daa-90c6-515f5accff06', 'eng.khalid.work@gmail.com', 'Khalid', 'Engineer', 'Khalid Engineer');

INSERT INTO user_statuses (user_id, status) 
VALUES ('85c5601e-d99e-4daa-90c6-515f5accff06', 'active');