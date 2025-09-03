-- Create user status enum
CREATE TYPE public.user_status AS ENUM (
  'publisher',      -- ناشر (افتراضي)
  'trusted_owner',  -- مالك موثوق
  'office_agent'    -- مكلف بالنشر/صاحب مكتب دلالية
);

-- Create user_statuses table
CREATE TABLE public.user_statuses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status public.user_status NOT NULL DEFAULT 'publisher',
  properties_limit INTEGER NOT NULL DEFAULT 1, -- حد العقارات المسموحة
  images_limit INTEGER NOT NULL DEFAULT 2,     -- حد الصور لكل عقار
  can_publish BOOLEAN NOT NULL DEFAULT true,   -- هل يستطيع النشر
  is_verified BOOLEAN NOT NULL DEFAULT false,  -- هل تم التحقق منه
  verified_by UUID REFERENCES auth.users(id),  -- من قام بالتحقق
  verified_at TIMESTAMP WITH TIME ZONE,        -- تاريخ التحقق
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_statuses ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own status" ON public.user_statuses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all statuses" ON public.user_statuses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update statuses" ON public.user_statuses
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

CREATE POLICY "Admins can insert statuses" ON public.user_statuses
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Function to automatically create default status for new users
CREATE OR REPLACE FUNCTION public.handle_new_user_status()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_statuses (user_id, status, properties_limit, images_limit)
  VALUES (
    NEW.id, 
    'publisher'::public.user_status, 
    1, 
    2
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create status for new users
CREATE TRIGGER on_auth_user_created_status
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_status();

-- Function to update user status (only by admin)
CREATE OR REPLACE FUNCTION public.update_user_status(
  target_user_id UUID,
  new_status public.user_status,
  admin_user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if caller is admin
  IF NOT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = admin_user_id 
    AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can update user status';
  END IF;
  
  -- Set limits based on status
  UPDATE public.user_statuses 
  SET 
    status = new_status,
    properties_limit = CASE 
      WHEN new_status = 'publisher' THEN 1
      WHEN new_status = 'trusted_owner' THEN 5
      WHEN new_status = 'office_agent' THEN 999
    END,
    images_limit = CASE 
      WHEN new_status = 'publisher' THEN 2
      WHEN new_status = 'trusted_owner' THEN 5
      WHEN new_status = 'office_agent' THEN 7
    END,
    is_verified = CASE 
      WHEN new_status != 'publisher' THEN true
      ELSE false
    END,
    verified_by = CASE 
      WHEN new_status != 'publisher' THEN admin_user_id
      ELSE NULL
    END,
    verified_at = CASE 
      WHEN new_status != 'publisher' THEN now()
      ELSE NULL
    END,
    updated_at = now()
  WHERE user_id = target_user_id;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user status with limits
CREATE OR REPLACE FUNCTION public.get_user_status(user_id_param UUID DEFAULT auth.uid())
RETURNS TABLE (
  status public.user_status,
  properties_limit INTEGER,
  images_limit INTEGER,
  can_publish BOOLEAN,
  is_verified BOOLEAN,
  current_properties_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    us.status,
    us.properties_limit,
    us.images_limit,
    us.can_publish,
    us.is_verified,
    COALESCE(
      (SELECT COUNT(*)::INTEGER 
       FROM properties p 
       WHERE p.user_id = user_id_param 
       AND p.is_published = true), 
      0
    ) as current_properties_count
  FROM user_statuses us
  WHERE us.user_id = user_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT ALL ON public.user_statuses TO authenticated;
GRANT ALL ON public.user_statuses TO service_role;
GRANT EXECUTE ON FUNCTION public.update_user_status TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_status TO authenticated;

-- Create indexes for better performance
CREATE INDEX idx_user_statuses_user_id ON public.user_statuses(user_id);
CREATE INDEX idx_user_statuses_status ON public.user_statuses(status);
CREATE INDEX idx_user_statuses_verified ON public.user_statuses(is_verified);

-- Insert default statuses for existing users
INSERT INTO public.user_statuses (user_id, status, properties_limit, images_limit)
SELECT 
  id, 
  'publisher'::public.user_status, 
  1, 
  2
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.user_statuses);








