-- Create storage bucket for chat attachments
-- sqlfluff: dialect=postgres

INSERT INTO storage.buckets (id, name, "public", file_size_limit, allowed_mime_types)
VALUES (
  'chat-attachments',
  'chat-attachments',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/jpg', 'application/pdf']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- Ensure RLS is enabled (already enabled globally but kept for clarity)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Storage policies for chat attachments
CREATE POLICY "Allow authenticated users to upload chat attachments"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'chat-attachments'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Allow public access to chat attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'chat-attachments');

CREATE POLICY "Allow users to update their chat attachments"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'chat-attachments'
  AND owner = auth.uid()
);

CREATE POLICY "Allow users to delete their chat attachments"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'chat-attachments'
  AND owner = auth.uid()
);

-- Grant permissions to authenticated role
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO authenticated;
