import { createContext } from 'react';
import type { Json } from '@/integrations/supabase/types';

export type SettingsContextValue = {
  settings: Json | null;
  reload: () => Promise<void>;
};

export const SettingsContext = createContext<SettingsContextValue>({
  settings: null,
  reload: async () => {},
});
