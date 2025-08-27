-- Create banner_settings table
CREATE TABLE IF NOT EXISTS public.banner_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  text TEXT NOT NULL DEFAULT 'مرحباً بك في تطبيق "سكني" - منصة العقارات الأولى في مجمع الدور | أسعار مناسبة للجميع | شقق مفروشة وغير مفروشة | عقارات للبيع والإيجار',
  is_active BOOLEAN DEFAULT true,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default banner settings
INSERT INTO public.banner_settings (text, is_active) VALUES (
  'مرحباً بك في تطبيق "سكني" - منصة العقارات الأولى في مجمع الدور | أسعار مناسبة للجميع | شقق مفروشة وغير مفروشة | عقارات للبيع والإيجار',
  true
) ON CONFLICT DO NOTHING;

-- Create function to update updated_at column
CREATE OR REPLACE FUNCTION public.update_banner_settings_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for banner_settings
DROP TRIGGER IF EXISTS update_banner_settings_updated_at ON public.banner_settings;
CREATE TRIGGER update_banner_settings_updated_at 
  BEFORE UPDATE ON public.banner_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_banner_settings_updated_at_column();

-- RLS policies for banner_settings (admin only)
ALTER TABLE public.banner_settings ENABLE ROW LEVEL SECURITY;

-- Allow admins to read banner settings
CREATE POLICY "Admins can read banner settings" ON public.banner_settings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role = 'admin'
    )
  );

-- Allow admins to insert banner settings
CREATE POLICY "Admins can insert banner settings" ON public.banner_settings
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role = 'admin'
    )
  );

-- Allow admins to update banner settings
CREATE POLICY "Admins can update banner settings" ON public.banner_settings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role = 'admin'
    )
  );

-- Allow admins to delete banner settings
CREATE POLICY "Admins can delete banner settings" ON public.banner_settings
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role = 'admin'
    )
  );

-- Allow public to read active banner settings
CREATE POLICY "Public can read active banner settings" ON public.banner_settings
  FOR SELECT USING (is_active = true);
