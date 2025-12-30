-- Migration to add latitude and longitude columns to properties table
-- Run this in your Supabase SQL editor

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

-- Update RLS policies to include new columns if needed
-- (Current policies should already cover these columns via SELECT *)

-- Optional: Add default coordinates for existing properties (Iraq center)
-- UPDATE public.properties 
-- SET latitude = 34.406075, longitude = 43.789876 
-- WHERE latitude IS NULL AND longitude IS NULL;

SELECT 'Migration completed successfully! Latitude and longitude columns added to properties table.' as result;