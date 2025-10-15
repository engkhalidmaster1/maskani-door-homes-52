-- ======================================
-- إنشاء وتكوين Bucket للصور في Supabase
-- ======================================

-- 1. إنشاء bucket للصور (إذا لم يكن موجوداً)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'property-images',
  'property-images',
  true, -- السماح بالوصول العام
  5242880, -- 5MB حد أقصى لحجم الملف
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE
SET 
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

-- 2. السماح برفع الصور للمستخدمين المسجلين
CREATE POLICY IF NOT EXISTS "Allow authenticated users to upload images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'property-images');

-- 3. السماح بقراءة الصور للجميع (حتى الزوار)
CREATE POLICY IF NOT EXISTS "Allow public to read images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'property-images');

-- 4. السماح للمستخدمين بحذف صورهم الخاصة
CREATE POLICY IF NOT EXISTS "Allow users to delete their own images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'property-images' AND
  (auth.uid())::text = (storage.foldername(name))[1]
);

-- 5. السماح للمستخدمين بتحديث صورهم الخاصة
CREATE POLICY IF NOT EXISTS "Allow users to update their own images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'property-images' AND
  (auth.uid())::text = (storage.foldername(name))[1]
);

-- 6. التحقق من وجود الـ bucket
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'property-images') THEN
    RAISE NOTICE 'Bucket property-images موجود ومُكوّن بنجاح ✓';
  ELSE
    RAISE EXCEPTION 'فشل في إنشاء bucket property-images';
  END IF;
END $$;
