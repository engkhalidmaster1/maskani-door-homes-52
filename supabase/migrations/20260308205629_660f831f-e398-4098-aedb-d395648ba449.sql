
-- 1. Add whatsapp_number to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS whatsapp_number text;

-- 2. Create otp_codes table
CREATE TABLE IF NOT EXISTS public.otp_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  code_hash text NOT NULL,
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '5 minutes'),
  attempts integer NOT NULL DEFAULT 0,
  verified boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.otp_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own otp codes" ON public.otp_codes
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- 3. Create trusted_devices table
CREATE TABLE IF NOT EXISTS public.trusted_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  device_hash text NOT NULL,
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '30 days'),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, device_hash)
);

ALTER TABLE public.trusted_devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own trusted devices" ON public.trusted_devices
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own trusted devices" ON public.trusted_devices
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- 4. check_trusted_device function (SECURITY DEFINER to bypass RLS)
CREATE OR REPLACE FUNCTION public.check_trusted_device(p_user_id uuid, p_device_hash text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.trusted_devices
    WHERE user_id = p_user_id
      AND device_hash = p_device_hash
      AND expires_at > now()
  );
$$;

-- 5. save_trusted_device function
CREATE OR REPLACE FUNCTION public.save_trusted_device(p_user_id uuid, p_device_hash text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.trusted_devices (user_id, device_hash, expires_at)
  VALUES (p_user_id, p_device_hash, now() + interval '30 days')
  ON CONFLICT (user_id, device_hash)
  DO UPDATE SET expires_at = now() + interval '30 days';
END;
$$;

-- 6. cleanup_expired_otps function
CREATE OR REPLACE FUNCTION public.cleanup_expired_otps()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $$
  DELETE FROM public.otp_codes WHERE expires_at < now();
  DELETE FROM public.trusted_devices WHERE expires_at < now();
$$;
