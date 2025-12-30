import React, { useEffect, useCallback } from 'react';
import { useAppSettings } from '@/hooks/useAppSettings';
import type { Json } from '@/integrations/supabase/types';
import { getMenuFontSize } from '@/lib/menuLabels';
import { SettingsContext } from './settingsContextValue';

export const SettingsProvider: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { settings, isLoading, reload: refetch } = useAppSettings();

  // Initialize a stable default theme on first mount to avoid sudden flips during async loads
  useEffect(() => {
    try {
      const key = 'app:theme-preference';
      const existing = localStorage.getItem(key);
      if (!existing) {
        localStorage.setItem(key, 'light');
        document.documentElement.classList.remove('dark');
      }
    } catch {
      // ignore storage errors (private mode etc.)
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // Apply user's saved theme preference immediately on mount to avoid flashing
  useEffect(() => {
    try {
      const key = 'app:theme-preference';
      let pref = localStorage.getItem(key);
      if (!pref) {
        pref = 'light';
        localStorage.setItem(key, pref);
      }
      const doc = document.documentElement;
      const prefersDark = typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)').matches : false;
      if (pref === 'dark') {
        doc.classList.add('dark');
      } else if (pref === 'light') {
        doc.classList.remove('dark');
      } else if (pref === 'auto') {
        if (prefersDark) doc.classList.add('dark'); else doc.classList.remove('dark');
      }
    } catch (err) {
      // Ignore storage errors
    }
  }, []);

  // If preference is 'auto', update theme when OS preference changes
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (ev: MediaQueryListEvent) => {
      try {
        const pref = localStorage.getItem('app:theme-preference');
        if (pref === 'auto') {
          if (ev.matches) document.documentElement.classList.add('dark');
          else document.documentElement.classList.remove('dark');
        }
      } catch (err) {
        console.warn('Failed to handle theme preference change', err);
      }
    };
    // Modern API
    type OldMQL = MediaQueryList & { addListener?: (cb: (ev: MediaQueryListEvent) => void) => void; removeListener?: (cb: (ev: MediaQueryListEvent) => void) => void };
    const oldMql = mql as OldMQL;
    if ('addEventListener' in mql) mql.addEventListener('change', onChange);
    else if (oldMql.addListener) oldMql.addListener(onChange);
    return () => {
      if ('removeEventListener' in mql) mql.removeEventListener('change', onChange);
      else if (oldMql.removeListener) oldMql.removeListener(onChange);
    };
  }, []);

  useEffect(() => {
    if (!settings) return;
    try {
      const cfg = settings as Record<string, Json>;
      // Apply primary color if present (assume HSL string or hex)
      const prim = cfg['primary'];
      if (prim && typeof prim === 'string') {
        // If value looks like HSL (contains % or spaces), set directly; else try to parse hex
        const doc = document.documentElement;
        if (prim.includes('%') || prim.split(' ').length >= 3) {
          doc.style.setProperty('--primary', prim);
        } else if (prim.startsWith('#')) {
          // convert hex to HSL simple algorithm
          const hex = prim.replace('#', '');
          const bigint = parseInt(hex, 16);
          const r = (bigint >> 16) & 255;
          const g = (bigint >> 8) & 255;
          const b = bigint & 255;
          const rNorm = r / 255;
          const gNorm = g / 255;
          const bNorm = b / 255;
          const max = Math.max(rNorm, gNorm, bNorm);
          const min = Math.min(rNorm, gNorm, bNorm);
          const l = (max + min) / 2;
          let h = 213;
          let s = 94;
          if (max !== min) {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
              case rNorm:
                h = (gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0);
                break;
              case gNorm:
                h = (bNorm - rNorm) / d + 2;
                break;
              case bNorm:
                h = (rNorm - gNorm) / d + 4;
                break;
            }
            h = Math.round(h * 60);
            s = Math.round(s * 100);
          }
          const lPct = Math.round(l * 100);
          document.documentElement.style.setProperty('--primary', `${h} ${s}% ${lPct}%`);
        }
      }

      // Apply theme with stable precedence:
      // 1) Respect explicit user preference from localStorage if present
      // 2) Otherwise use server settings (dark only when explicitly 'dark')
      // 3) Default to light
      const docEl = document.documentElement;
      const getHasDark = () => docEl.classList.contains('dark');
      const userPref = (() => {
        try { return localStorage.getItem('app:theme-preference'); } catch { return null; }
      })();
      let shouldDark = false;
      if (userPref === 'dark') {
        shouldDark = true;
      } else if (userPref === 'light') {
        shouldDark = false;
      } else if (userPref === 'auto') {
        // follow the OS preference but still don't force dark unless the system prefers it
        const prefersDark = typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)').matches : false;
        shouldDark = prefersDark;
      } else {
        const theme = cfg['theme'];
        shouldDark = theme === 'dark';
      }

      // Only update DOM if a real change is needed to avoid flicker
      if (shouldDark && !getHasDark()) {
        docEl.classList.add('dark');
      } else if (!shouldDark && getHasDark()) {
        docEl.classList.remove('dark');
      }

      // Font size: prefer explicit pixel values when present for finer control
      const fsPx = (() => {
        const raw = cfg['font_size_px'];
        if (typeof raw === 'number') return `${raw}px`;
        const legacy = String(cfg['font_size'] ?? 'normal');
        const legacyMap: Record<string, string> = { small: '14px', normal: '16px', large: '18px' };
        return legacyMap[legacy] ?? '16px';
      })();
      (document.documentElement.style as CSSStyleDeclaration).fontSize = fsPx;

      const menuFontSize = (() => {
        const menuPx = cfg['menu_font_size_px'];
        if (typeof menuPx === 'number') return `${menuPx}px`;
        return getMenuFontSize(settings);
      })();
      document.documentElement.style.setProperty('--menu-font-size', menuFontSize);
    } catch (err) {
      console.error('Error applying app settings preview:', err);
    }
  }, [settings, isLoading]);

  const reload = useCallback(async () => {
    await refetch();
  }, [refetch]);

  return (
    <SettingsContext.Provider value={{ settings: settings ?? null, reload }}>
      {children}
    </SettingsContext.Provider>
  );
};
export default SettingsProvider;
