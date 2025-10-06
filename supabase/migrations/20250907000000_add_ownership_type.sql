-- Add ownership_type column to properties table
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS ownership_type TEXT;

-- Add comment to describe the new column
COMMENT ON COLUMN public.properties.ownership_type IS 'نوع الملكية: tamlik (تمليك) أو sar_qafliya (سر قفلية)';
