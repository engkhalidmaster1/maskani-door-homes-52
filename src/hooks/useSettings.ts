import { useContext } from 'react';
import { SettingsContext } from '@/context/settingsContextValue';

export function useSettings() {
  return useContext(SettingsContext);
}
