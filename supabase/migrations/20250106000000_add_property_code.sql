-- Add property_code column to properties table
ALTER TABLE public.properties 
ADD COLUMN property_code VARCHAR(20) UNIQUE;

-- Create index for faster searches
CREATE INDEX idx_properties_code ON public.properties(property_code);

-- Function to generate next sequential number for property code
CREATE OR REPLACE FUNCTION public.get_next_property_sequence(
  target_date DATE DEFAULT CURRENT_DATE,
  bedrooms_count INTEGER DEFAULT 1
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  date_prefix TEXT;
  bedrooms_prefix TEXT;
  next_seq INTEGER;
BEGIN
  -- Format date as YYYYMMDD
  date_prefix := TO_CHAR(target_date, 'YYYYMMDD');
  
  -- Format bedrooms
  bedrooms_prefix := 'BR' || bedrooms_count::TEXT;
  
  -- Get the next sequence number for this date and bedroom combination
  SELECT COALESCE(MAX(
    CAST(
      SUBSTRING(property_code FROM LENGTH(date_prefix || '-' || bedrooms_prefix || '-') + 1)
      AS INTEGER
    )
  ), 0) + 1
  INTO next_seq
  FROM public.properties
  WHERE property_code LIKE date_prefix || '-' || bedrooms_prefix || '-%'
    AND LENGTH(property_code) = LENGTH(date_prefix || '-' || bedrooms_prefix || '-000');
  
  RETURN next_seq;
END;
$$;

-- Function to generate property code
CREATE OR REPLACE FUNCTION public.generate_property_code(
  bedrooms_count INTEGER,
  created_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  date_prefix TEXT;
  bedrooms_prefix TEXT;
  sequence_num INTEGER;
  property_code TEXT;
BEGIN
  -- Format date as YYYYMMDD
  date_prefix := TO_CHAR(created_date, 'YYYYMMDD');
  
  -- Format bedrooms
  bedrooms_prefix := 'BR' || bedrooms_count::TEXT;
  
  -- Get next sequence number
  sequence_num := public.get_next_property_sequence(created_date::DATE, bedrooms_count);
  
  -- Generate the code
  property_code := date_prefix || '-' || bedrooms_prefix || '-' || LPAD(sequence_num::TEXT, 3, '0');
  
  RETURN property_code;
END;
$$;

-- Update existing properties with generated codes
UPDATE public.properties 
SET property_code = public.generate_property_code(
  COALESCE(bedrooms, 1), 
  created_at
)
WHERE property_code IS NULL;

-- Make property_code NOT NULL after updating existing records
ALTER TABLE public.properties 
ALTER COLUMN property_code SET NOT NULL;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_next_property_sequence TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_property_code TO authenticated;






