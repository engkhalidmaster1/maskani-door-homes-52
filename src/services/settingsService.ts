import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

export const fetchAppSettings = async (): Promise<Json | null> => {
  const { data, error } = await supabase.rpc('get_app_settings');
  if (error) throw error;
  // RPC returns raw jsonb value
  return data as Json | null;
};

export const setAppSettings = async (settings: Json) => {
  // Attempt RPC first (preferred, server-side logic may be definer-run)
  const { error, data } = await supabase.rpc('set_app_settings', { p_settings: settings });
  if (error) {
    console.error('set_app_settings RPC failed', { settings, error, data });
    // Do not attempt to update the table directly from the client; require
    // server-side function to be fixed or use service role via secure edge function.
    throw error;
  }
  return true;
};

export const setMaintenanceMode = async (on: boolean) => {
  const { error, data } = await supabase.rpc('set_maintenance_mode', { p_on: on });
  if (error) {
    console.error('set_maintenance_mode RPC failed', { on, error, data });
    throw error;
  }
  return true;
};
