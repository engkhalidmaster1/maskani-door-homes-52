-- Add market column to properties table
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS market TEXT;

-- Optionally, create an index for market if queries will filter by it
CREATE INDEX IF NOT EXISTS properties_market_idx ON public.properties (market);
