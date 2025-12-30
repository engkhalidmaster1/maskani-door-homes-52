-- Add address column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS address TEXT;

-- Update the profiles table structure
COMMENT ON COLUMN public.profiles.address IS 'User address field';
