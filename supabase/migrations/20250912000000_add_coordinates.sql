-- Add latitude and longitude columns for map functionality
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS latitude NUMERIC(10, 7),
ADD COLUMN IF NOT EXISTS longitude NUMERIC(10, 7);

-- Add comments to describe the new columns
COMMENT ON COLUMN public.properties.latitude IS 'إحداثية العرض الجغرافي للعقار';
COMMENT ON COLUMN public.properties.longitude IS 'إحداثية الطول الجغرافي للعقار';

-- Create an index for faster geo-spatial queries
CREATE INDEX IF NOT EXISTS idx_properties_location 
ON public.properties (latitude, longitude) 
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;