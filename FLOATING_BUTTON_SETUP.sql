-- Floating Button Management System - Complete Script
-- Copy and paste this entire script into Supabase SQL Editor

-- =============================================================================
-- STEP 1: Create Floating Button Configuration Table
-- =============================================================================

-- Create floating_button_config table
CREATE TABLE IF NOT EXISTS public.floating_button_config (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL DEFAULT 'مرحباً بك في تطبيق "سكني"',
  message text NOT NULL DEFAULT 'منصة متكاملة للعثور على أفضل العقارات للبيع والإيجار في مجمع الدور',
  button_color text NOT NULL DEFAULT 'primary',
  is_enabled boolean NOT NULL DEFAULT true,
  show_on_pages text[] DEFAULT ARRAY['home'],
  start_date timestamp with time zone DEFAULT now(),
  end_date timestamp with time zone DEFAULT NULL,
  start_time time DEFAULT '00:00:00',
  end_time time DEFAULT '23:59:59',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) DEFAULT auth.uid()
);

-- Enable RLS on floating_button_config table
ALTER TABLE public.floating_button_config ENABLE ROW LEVEL SECURITY;

-- Policy: everyone can select (read) the config
DO $$
BEGIN
  CREATE POLICY floating_button_select_all ON public.floating_button_config
    FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Policy: only admins can insert/update/delete
DO $$
BEGIN
  CREATE POLICY floating_button_admin_only ON public.floating_button_config
    FOR ALL USING (public.is_admin(auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Create function to get active floating button config
CREATE OR REPLACE FUNCTION public.get_active_floating_button_config()
RETURNS TABLE (
  id uuid,
  title text,
  message text,
  button_color text,
  is_enabled boolean,
  show_on_pages text[]
)
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    fbc.id,
    fbc.title,
    fbc.message,
    fbc.button_color,
    fbc.is_enabled,
    fbc.show_on_pages
  FROM public.floating_button_config fbc
  WHERE fbc.is_enabled = true
    AND (fbc.start_date IS NULL OR fbc.start_date <= NOW())
    AND (fbc.end_date IS NULL OR fbc.end_date >= NOW())
    AND CURRENT_TIME BETWEEN COALESCE(fbc.start_time, '00:00:00') AND COALESCE(fbc.end_time, '23:59:59')
  ORDER BY fbc.created_at DESC
  LIMIT 1;
END;
$$;

-- Grant permissions
GRANT SELECT ON public.floating_button_config TO authenticated;
GRANT ALL ON public.floating_button_config TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_active_floating_button_config() TO authenticated;

-- Insert default configuration
INSERT INTO public.floating_button_config (
  title, 
  message, 
  button_color, 
  is_enabled, 
  show_on_pages
) VALUES (
  'مرحباً بك في تطبيق "سكني"',
  'منصة متكاملة للعثور على أفضل العقارات للبيع والإيجار في مجمع الدور',
  'primary',
  true,
  ARRAY['home']
) ON CONFLICT DO NOTHING;

-- Enable Realtime for floating_button_config table
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'floating_button_config'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.floating_button_config;
  END IF;
END $$;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Floating Button management system setup complete!';
  RAISE NOTICE '🔘 Admins can now manage floating button via Dashboard';
  RAISE NOTICE '⚙️ Button appearance, timing, and pages can be controlled';
  RAISE NOTICE '🔴 Real-time updates are enabled';
END $$;