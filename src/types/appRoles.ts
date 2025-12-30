import type { Database } from '@/integrations/supabase/types';

export type AppRole = Database['public']['Enums']['app_role'];

export const ALL_ROLES: AppRole[] = ['admin', 'office', 'agent', 'publisher'];
