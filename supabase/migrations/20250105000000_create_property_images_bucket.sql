-- Create storage bucket for property images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'property-images', 
  'property-images', 
  true, 
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/jpg']
) ON CONFLICT (id) DO NOTHING;

-- Enable Row Level Security
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create storage policies
CREATE POLICY "Allow authenticated users to upload property images" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'property-images' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Allow public access to view property images" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'property-images');

CREATE POLICY "Allow users to update their own property images" 
ON storage.objects FOR UPDATE 
USING (
  bucket_id = 'property-images' 
  AND owner = auth.uid()
);

CREATE POLICY "Allow users to delete their own property images" 
ON storage.objects FOR DELETE 
USING (
  bucket_id = 'property-images' 
  AND owner = auth.uid()
);

-- Grant necessary permissions
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO authenticated;








