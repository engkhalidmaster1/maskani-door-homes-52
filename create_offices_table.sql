-- Migration to create real estate offices table
-- Run this in your Supabase SQL editor

-- Create real estate offices table
CREATE TABLE IF NOT EXISTS public.real_estate_offices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  office_name TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT,
  latitude NUMERIC(10, 7),
  longitude NUMERIC(10, 7),
  license_number TEXT UNIQUE,
  license_expiry DATE,
  description TEXT,
  website TEXT,
  social_media JSONB DEFAULT '{}',
  working_hours JSONB DEFAULT '{}',
  services JSONB DEFAULT '[]',
  logo_url TEXT,
  cover_image_url TEXT,
  documents JSONB DEFAULT '[]', -- For storing document URLs
  is_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  rating NUMERIC(2,1) DEFAULT 0.0,
  reviews_count INTEGER DEFAULT 0,
  properties_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add comments to describe columns
COMMENT ON TABLE public.real_estate_offices IS 'جدول المكاتب العقارية';
COMMENT ON COLUMN public.real_estate_offices.office_name IS 'اسم المكتب العقاري';
COMMENT ON COLUMN public.real_estate_offices.owner_name IS 'اسم مالك المكتب';
COMMENT ON COLUMN public.real_estate_offices.license_number IS 'رقم الرخصة التجارية';
COMMENT ON COLUMN public.real_estate_offices.license_expiry IS 'تاريخ انتهاء الرخصة';
COMMENT ON COLUMN public.real_estate_offices.documents IS 'المستندات والملفات المرفوعة';
COMMENT ON COLUMN public.real_estate_offices.is_verified IS 'حالة التوثيق';
COMMENT ON COLUMN public.real_estate_offices.working_hours IS 'ساعات العمل';
COMMENT ON COLUMN public.real_estate_offices.services IS 'الخدمات المقدمة';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_offices_user_id ON public.real_estate_offices(user_id);
CREATE INDEX IF NOT EXISTS idx_offices_license ON public.real_estate_offices(license_number);
CREATE INDEX IF NOT EXISTS idx_offices_location ON public.real_estate_offices(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_offices_verified ON public.real_estate_offices(is_verified);
CREATE INDEX IF NOT EXISTS idx_offices_active ON public.real_estate_offices(is_active);

-- Enable RLS (Row Level Security)
ALTER TABLE public.real_estate_offices ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Policy for users to read all active offices
CREATE POLICY "Users can view active offices" ON public.real_estate_offices
  FOR SELECT USING (is_active = true);

-- Policy for users to insert their own office
CREATE POLICY "Users can insert their own office" ON public.real_estate_offices
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy for users to update their own office
CREATE POLICY "Users can update their own office" ON public.real_estate_offices
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy for users to delete their own office
CREATE POLICY "Users can delete their own office" ON public.real_estate_offices
  FOR DELETE USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_real_estate_offices_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_real_estate_offices_updated_at
  BEFORE UPDATE ON public.real_estate_offices
  FOR EACH ROW
  EXECUTE FUNCTION update_real_estate_offices_updated_at();

-- Create storage bucket for office documents if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('office-documents', 'office-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for office documents
CREATE POLICY "Office owners can upload documents" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'office-documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Office owners can view their documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'office-documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Office owners can update their documents" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'office-documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Office owners can delete their documents" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'office-documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

SELECT 'Real estate offices table and related structures created successfully!' as result;