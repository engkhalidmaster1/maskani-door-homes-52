import type { Database } from '@/integrations/supabase/types';

// Use user_role_type which has all 4 roles: admin, office, agent, publisher
export type AppRole = Database['public']['Enums']['user_role_type'];

export const ALL_ROLES: AppRole[] = ['admin', 'office', 'agent', 'publisher'];
