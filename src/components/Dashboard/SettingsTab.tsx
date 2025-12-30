import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAppSettings } from '@/hooks/useAppSettings';
import { MENU_LABEL_FIELDS, parseMenuLabelOverrides, MENU_FONT_SIZE_MAP, FOOTER_DEFAULT_HEADING, FOOTER_DEFAULT_SUBTEXT } from '@/lib/menuLabels';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { Json } from '@/integrations/supabase/types';

// Minimal color conversion helpers
function hexToHsl(hex: string) {
  // Remove leading '#'
  const h = hex.replace('#', '');
  const bigint = parseInt(h, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;
  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  let hDeg = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rNorm:
        hDeg = (gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0);
        break;
      case gNorm:
        hDeg = (bNorm - rNorm) / d + 2;
        break;
      case bNorm:
        hDeg = (rNorm - gNorm) / d + 4;
        break;
    }
    hDeg = Math.round(hDeg * 60);
  }
  return { h: Math.round(hDeg), s: Math.round(s * 100), l: Math.round(l * 100) };
}

// Convert HSL numeric parts to hex color string
function hslToHex(h: number, s: number, l: number) {
  // h: 0-360, s: 0-100, l: 0-100
  const sNorm = s / 100;
  const lNorm = l / 100;

  const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = lNorm - c / 2;
  let r = 0, g = 0, b = 0;
  if (h >= 0 && h < 60) { r = c; g = x; b = 0; }
  else if (h >= 60 && h < 120) { r = x; g = c; b = 0; }
  else if (h >= 120 && h < 180) { r = 0; g = c; b = x; }
  else if (h >= 180 && h < 240) { r = 0; g = x; b = c; }
  else if (h >= 240 && h < 300) { r = x; g = 0; b = c; }
  else { r = c; g = 0; b = x; }

  const toHex = (v: number) => {
    const val = Math.round((v + m) * 255);
    const hex = val.toString(16).padStart(2, '0');
    return hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
function parseHslVar(hslVar: unknown) {
  if (!hslVar) return null;
  if (typeof hslVar === 'string') {
    const parts = hslVar.trim().split(/\s+/);
    if (parts.length >= 3) {
      const h = parseFloat(parts[0]);
      const s = parseFloat(parts[1].replace('%', ''));
      const l = parseFloat(parts[2].replace('%', ''));
      return { h, s, l };
    }
    // If already hex offered
    if (hslVar.startsWith('#')) {
      return hexToHsl(hslVar as string);
    }
  }
  return null;
}

type LocalSettings = {
  primary: string;
  theme: 'auto' | 'light' | 'dark';
  font_size: 'small' | 'normal' | 'large';
  maintenance_mode: boolean;
  system_visible: boolean;
  menu_labels?: Record<string, string>;
  footer_heading?: string;
  footer_subtext?: string;
  menu_font_size?: 'small' | 'normal' | 'large';
  font_size_px?: number | null;
  menu_font_size_px?: number | null;
};

export const SettingsTab = () => {
  /**
   * Notes for developers / admins:
   * - `font_size_px` and `menu_font_size_px` are numeric overrides (px) stored in the settings JSON.
   *   If set, they take precedence over the categorical `font_size` / `menu_font_size` fields.
   * - Inputs accept plain integer values representing pixels. Empty input = null = fallback to category.
   * - The Reset buttons:
   *   - "إعادة تسمية القوائم للافتراضي" clears the local overrides only; it won't save until you click Save.
   *   - "استعادة التذييل وتسميات القوائم للـافتراضي (حفظ)" calls updateSettings and persists the default values to the DB.
   */
  const { settings, isLoading, updateSettings, toggleMaintenance, isUpdating, isTogglingMaintenance, reload } = useAppSettings();
  const [local, setLocal] = useState<Partial<LocalSettings>>({});
  const [isDirty, setIsDirty] = useState(false);
  // Disable font controls by default per request: admins can re-enable
  // using the toggle below if needed for maintenance/temporary changes.
  const [allowFontControl, setAllowFontControl] = useState(false);

  const { isAdmin } = useAuth();

  useEffect(() => {
    if (settings) {
      // Initialize local state from settings JSONB
      const initial: Record<string, Json | string | boolean> = {};
      // Prefer hex color for the color input; try parse HSL first
      const cfg = (settings ?? {}) as Record<string, Json>;
      const prim = cfg['primary'];
      let primHex = '#1d4ed8';
      if (prim && typeof prim === 'string') {
        if (prim.startsWith('#')) {
          primHex = prim;
        } else {
          const parsed = parseHslVar(prim);
          if (parsed) primHex = hslToHex(parsed.h, parsed.s, parsed.l);
        }
      }

      initial.primary = primHex;
        // Prefer explicit local user preference first (to avoid flashes of dark),
        // otherwise fall back to server setting or default to 'light'.
        let storedTheme: string | null = null;
        try { storedTheme = localStorage.getItem('app:theme-preference'); } catch { storedTheme = null; }
        initial.theme = (storedTheme as 'auto' | 'light' | 'dark') ?? (cfg['theme'] as string) ?? 'light';
  initial.font_size = (cfg['font_size'] as string) ?? 'normal';
  initial.font_size_px = typeof cfg['font_size_px'] === 'number' ? Number(cfg['font_size_px']) : null;
  initial.menu_font_size = (cfg['menu_font_size'] as string) ?? 'normal';
  initial.menu_font_size_px = typeof cfg['menu_font_size_px'] === 'number' ? Number(cfg['menu_font_size_px']) : null;
  initial.menu_labels = cfg['menu_labels'] ? (cfg['menu_labels'] as Record<string, string>) : {};
  initial.footer_heading = (cfg['footer_heading'] as string) ?? '';
  initial.footer_subtext = (cfg['footer_subtext'] as string) ?? '';
  initial.maintenance_mode = Boolean(cfg['maintenance_mode'] ?? false);
  initial.system_visible = Boolean(cfg['system_visible'] ?? true);

      setLocal(initial);
      setIsDirty(false);
    }
  }, [settings]);

  const applyPreview = (next: Partial<LocalSettings>) => {
    // Apply color & theme & font size preview to documentElement
    try {
      const doc = document.documentElement;
      if (next.primary) {
        const hsl = hexToHsl(String(next.primary));
        doc.style.setProperty('--primary', `${hsl.h} ${hsl.s}% ${hsl.l}%`);
        // light variant: increase lightness
        doc.style.setProperty('--primary-light', `${hsl.h} ${hsl.s}% ${Math.min(95, hsl.l + 12)}%`);
      }
      if (next.theme) {
        if (next.theme === 'dark') {
          doc.classList.add('dark');
        } else if (next.theme === 'light') {
          doc.classList.remove('dark');
        } else {
          // auto -> follow prefers-color-scheme
          const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
          if (prefersDark) doc.classList.add('dark'); else doc.classList.remove('dark');
        }
      }

      if (next.font_size) {
        const mapping: Record<string, string> = { small: '14px', normal: '16px', large: '18px' };
        (document.documentElement.style as CSSStyleDeclaration).fontSize = mapping[String(next.font_size)] ?? '16px';
      }
      if (typeof next.font_size_px === 'number') {
        (document.documentElement.style as CSSStyleDeclaration).fontSize = `${next.font_size_px}px`;
      }
      if (next.menu_font_size) {
        const menuMap: Record<string, string> = { small: '14px', normal: '16px', large: '18px' };
        document.documentElement.style.setProperty('--menu-font-size', menuMap[next.menu_font_size] ?? '16px');
      }
      if (typeof next.menu_font_size_px === 'number') {
        document.documentElement.style.setProperty('--menu-font-size', `${next.menu_font_size_px}px`);
      }
    } catch (err) {
      console.error('Preview apply error', err);
    }
    // update menu font size preview
    if (next.menu_font_size) {
      const mapping: Record<string, string> = { small: '14px', normal: '16px', large: '18px' };
      document.documentElement.style.setProperty('--menu-font-size', mapping[String(next.menu_font_size)] ?? '16px');
    }
  };

  // Restore the previous font settings from the server into the local preview
  const handleRevertFonts = async () => {
    if (!settings) return;
    const cfg = settings as Record<string, Json>;
    const fontSizeVal = cfg['font_size'];
    const menuFontSizeVal = cfg['menu_font_size'];
    const restored: Partial<LocalSettings> = {
      font_size: (typeof fontSizeVal === 'string' && ['small', 'normal', 'large'].includes(fontSizeVal) ? fontSizeVal : 'normal') as 'small' | 'normal' | 'large',
      font_size_px: typeof cfg['font_size_px'] === 'number' ? Number(cfg['font_size_px']) : null,
      menu_font_size: (typeof menuFontSizeVal === 'string' && ['small', 'normal', 'large'].includes(menuFontSizeVal) ? menuFontSizeVal : 'normal') as 'small' | 'normal' | 'large',
      menu_font_size_px: typeof cfg['menu_font_size_px'] === 'number' ? Number(cfg['menu_font_size_px']) : null,
    };
    setLocal(prev => ({ ...prev, ...restored }));
    // Apply preview of restored values (no need to wait)
    try { applyPreview(restored as Partial<LocalSettings>); } catch { /* ignore */ }
    setIsDirty(true);
    toast({ title: '✅ تم استعادة أحجام الخط', description: 'تمت معاينة أحجام الخط السابقة (لن تحفظ حتى تضغط حفظ)' });
  };

  useEffect(() => {
    if (Object.keys(local).length > 0) {
      applyPreview(local);
    }
  }, [local]);

  // Build the menu label overrides for the editor and preview
  const menuOverrides = parseMenuLabelOverrides(settings);

  // Keep preview in 'auto' mode in sync with OS preference changes
  useEffect(() => {
    if (local.theme !== 'auto') return;
    const mql = typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
    if (!mql) return;
    const onChange = (ev: MediaQueryListEvent) => {
      applyPreview({ theme: 'auto' });
    };
    if ('addEventListener' in mql) mql.addEventListener('change', onChange);
    else {
      const mqlOld = mql as unknown as { addListener: (cb: (ev: MediaQueryListEvent) => void) => void };
      mqlOld.addListener(onChange);
    }
    return () => {
      if ('removeEventListener' in mql) mql.removeEventListener('change', onChange);
      else {
        const mqlOld = mql as unknown as { removeListener: (cb: (ev: MediaQueryListEvent) => void) => void };
        mqlOld.removeListener(onChange);
      }
    };
  }, [local.theme]);

  const handleSave = async () => {
    try {
      // Convert local back to the canonical JSON shape the DB expects
      const cfg = (settings ?? {}) as Record<string, Json>;

      // If font controls are disabled we should preserve server-side values
      // and prevent accidental resets. This ensures 'الغ التحكم باحجام الخطوط'.
      const out: Record<string, Json> = {
        theme: String(local.theme || 'auto'),
        primary: String(local.primary || '#1d4ed8'),
        primary_light: null,
        font_size: allowFontControl ? String(local.font_size || 'normal') : String(cfg['font_size'] ?? 'normal'),
        font_size_px: allowFontControl ? (typeof local.font_size_px === 'number' ? local.font_size_px : null) : (typeof cfg['font_size_px'] === 'number' ? Number(cfg['font_size_px']) : null),
        menu_font_size: allowFontControl ? String(local.menu_font_size || 'normal') : String(cfg['menu_font_size'] ?? 'normal'),
        menu_font_size_px: allowFontControl ? (typeof local.menu_font_size_px === 'number' ? local.menu_font_size_px : null) : (typeof cfg['menu_font_size_px'] === 'number' ? Number(cfg['menu_font_size_px']) : null),
        menu_labels: local.menu_labels ?? {},
        footer_heading: local.footer_heading ?? null,
        footer_subtext: local.footer_subtext ?? null,
        maintenance_mode: Boolean(local.maintenance_mode ?? false),
        system_visible: Boolean(local.system_visible ?? true),
      };

      // Convert primary hex to HSL string so existing CSS variables format remains consistent
      const primaryHex = String(local.primary || out.primary);
      const hsl = hexToHsl(primaryHex);
      out.primary = `${hsl.h} ${hsl.s}% ${hsl.l}%`;
      out.primary_light = `${hsl.h} ${hsl.s}% ${Math.min(95, hsl.l + 12)}%`;

      await updateSettings(out as Json);
      // Persist user preference locally to avoid theme flicker across navigations
      try {
        if (typeof local.theme === 'string') {
          localStorage.setItem('app:theme-preference', local.theme);
        }
      } catch (storageError) {
        console.warn('Unable to persist theme preference locally:', storageError);
      }
      setIsDirty(false);
      toast({ title: '✅ تم الحفظ', description: 'تم تحديث إعدادات النظام بنجاح' });
    } catch (err) {
      console.error('Save settings error', err);
      // If Supabase returned an object-like error expose message when possible
      const msg = err instanceof Error ? err.message : JSON.stringify(err);
      toast({ title: 'خطأ أثناء حفظ الإعدادات', description: msg, variant: 'destructive' });
    }
  };

  const handleReset = () => {
    if (!settings) return;
    if (!confirm('هل تريد إعادة الإعدادات إلى الافتراضية؟')) return;
    // Revert preview by refetching server values
    setLocal({});
    // Small timeout to allow effect to re-sync
    setTimeout(() => window.location.reload(), 200);
  };

  const handleResetDefaults = async () => {
    if (!settings) return;
    if (!confirm('هل تريد استعادة تسميات القوائم والتذييلات إلى الافتراضي؟')) return;
    try {
      const cfg = settings as Record<string, Json>;
      const out: Record<string, Json> = {
        ...cfg,
        menu_labels: {},
        footer_heading: null,
        footer_subtext: null,
      };
      await updateSettings(out as Json);
      // Refresh and update preview
      await (reload ?? Promise.resolve());
        // Refresh local
        setLocal({});
      toast({ title: '✅ تم', description: 'تم إعادة التسمية والتذييل إلى الافتراضي' });
    } catch (err) {
      console.error('Reset defaults error', err);
      toast({ title: 'خطأ', description: 'فشل استعادة الافتراضي', variant: 'destructive' });
    }
  };

  if (!isAdmin) return <div className="p-6">ليس لديك صلاحية للوصول إلى هذه الصفحة</div>;
  if (isLoading) return <div className="p-6">جاري تحميل الإعدادات...</div>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>مظهر النظام</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm">اللون الرئيسي</label>
              <div className="flex items-center gap-2">
                <input id="primary-color-input" aria-label="اختر اللون الرئيسي" type="color" value={String(local.primary || '#1d4ed8')} onChange={(e) => { setLocal(prev => ({ ...prev, primary: e.target.value })); setIsDirty(true); }} className="w-12 h-8 p-0 border rounded-md" />
                <Input value={String(local.primary || '')} onChange={(e) => { setLocal(prev => ({ ...prev, primary: e.target.value })); setIsDirty(true);} } />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm">الوضع (نهاري / مظلم / تلقائي)</label>
              <Select value={String(local.theme || 'auto')} onValueChange={(v: LocalSettings['theme']) => { setLocal(prev => ({ ...prev, theme: v })); setIsDirty(true); }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">تلقائي</SelectItem>
                  <SelectItem value="light">نهاري</SelectItem>
                  <SelectItem value="dark">مظلم</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm">حجم الخط العام</label>
              <div className="flex items-center gap-3 mb-2">
                <Switch checked={allowFontControl} onCheckedChange={(v) => { const enabled = Boolean(v); setAllowFontControl(enabled); toast({ title: enabled ? 'تم تفعيل التحكم بالخط' : 'تم تعطيل التحكم بالخط' }); }} />
                <span className="text-sm text-muted-foreground">السماح بتغيير حجم الخط (إيقاف يجعل النظام يستخدم الإعدادات السابقة)</span>
              </div>
              <div className="flex gap-2 items-center">
                <Select value={String(local.font_size || 'normal')} onValueChange={(v: LocalSettings['font_size']) => { setLocal(prev => ({ ...prev, font_size: v })); setIsDirty(true); }} disabled={!allowFontControl}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">صغير</SelectItem>
                  <SelectItem value="normal">عادي</SelectItem>
                  <SelectItem value="large">كبير</SelectItem>
                </SelectContent>
              </Select>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={12}
                    max={28}
                    value={typeof local.font_size_px === 'number' ? local.font_size_px : (typeof settings === 'object' && settings ? (typeof (settings as Record<string, unknown>)['font_size_px'] === 'number' ? Number((settings as Record<string, unknown>)['font_size_px']) : 16) : 16)}
                    onChange={(e) => { const val = parseInt(e.target.value); setLocal(prev => ({ ...prev, font_size_px: Number.isNaN(val) ? null : val })); setIsDirty(true); }}
                    disabled={!allowFontControl}
                    className="w-full"
                    aria-label="حجم الخط العام"
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{String(typeof local.font_size_px === 'number' ? local.font_size_px : (typeof settings === 'object' && settings ? (typeof (settings as Record<string, unknown>)['font_size_px'] === 'number' ? Number((settings as Record<string, unknown>)['font_size_px']) : 16) : 16))} px</span>
                    <Button variant="link" size="sm" onClick={() => { setLocal(prev => ({ ...prev, font_size_px: null })); setIsDirty(true); }}>إعادة</Button>
                  </div>
                </div>
                <span className="text-sm text-muted-foreground">px</span>
              </div>
              <div className="mt-2">
                <Button size="sm" variant="ghost" onClick={() => handleRevertFonts()}>استعادة أحجام النظام السابقة</Button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm">حجم الخط في القوائم (مخصص)</label>
                <Select value={String(local.menu_font_size || 'normal')} onValueChange={(v: LocalSettings['menu_font_size']) => { setLocal(prev => ({ ...prev, menu_font_size: v })); setIsDirty(true); }} disabled={!allowFontControl}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">صغير</SelectItem>
                  <SelectItem value="normal">عادي</SelectItem>
                  <SelectItem value="large">كبير</SelectItem>
                </SelectContent>
              </Select>
               <div className="flex items-center gap-3 mt-2">
                 <input
                   type="range"
                   min={12}
                   max={28}
                   value={typeof local.menu_font_size_px === 'number' ? local.menu_font_size_px : (typeof settings === 'object' && settings ? (typeof (settings as Record<string, unknown>)['menu_font_size_px'] === 'number' ? Number((settings as Record<string, unknown>)['menu_font_size_px']) : 16) : 16)}
                   onChange={(e) => { const val = parseInt(e.target.value); setLocal(prev => ({ ...prev, menu_font_size_px: Number.isNaN(val) ? null : val })); setIsDirty(true); }}
                  disabled={!allowFontControl}
                   className="w-full"
                   aria-label="حجم خط القوائم"
                 />
                 <div className="flex items-center gap-2">
                   <span className="text-sm">{String(typeof local.menu_font_size_px === 'number' ? local.menu_font_size_px : (typeof settings === 'object' && settings ? (typeof (settings as Record<string, unknown>)['menu_font_size_px'] === 'number' ? Number((settings as Record<string, unknown>)['menu_font_size_px']) : 16) : 16))} px</span>
                   <Button variant="link" size="sm" onClick={() => { setLocal(prev => ({ ...prev, menu_font_size_px: null })); setIsDirty(true); }}>إعادة</Button>
                 </div>
               </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm">وضع الصيانة</label>
              <div className="flex items-center gap-3">
                <Switch checked={Boolean(local.maintenance_mode)} onCheckedChange={(checked) => { setLocal(prev => ({ ...prev, maintenance_mode: checked })); setIsDirty(true); }} />
                <span className="text-sm text-muted-foreground">تفعيل لعرض صفحة الصيانة للمستخدمين غير المدراء</span>
              </div>
              <div className="mt-2 flex gap-2">
                <Button size="sm" onClick={async () => {
                  try {
                    // Apply maintenance immediately using the dedicated RPC
                    await toggleMaintenance(Boolean(local.maintenance_mode));
                    toast({ title: '✅ تم تطبيق حالة الصيانة', description: 'تم تحديث وضع الصيانة على الخادم' });

                    // refresh settings after toggle, server RPC will persist the change
                    try {
                      await (reload ?? Promise.resolve());
                    } catch (err) {
                      console.warn('Unable to reload settings after toggle', err);
                    }
                  } catch (err) {
                    console.error('Toggle maintenance RPC error', err);
                    toast({ title: 'خطأ', description: String(err), variant: 'destructive' });
                    
                  }
                }} disabled={isTogglingMaintenance}>تطبيق الآن</Button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm">ظهور النظام</label>
              <div className="flex items-center gap-3">
                <Switch checked={Boolean(local.system_visible)} onCheckedChange={(checked) => { setLocal(prev => ({ ...prev, system_visible: checked })); setIsDirty(true); }} />
                <span className="text-sm text-muted-foreground">عند إيقاف، سيخضع النظام لإخفاء كلي (باستخدام صفحة الصيانة)</span>
              </div>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button onClick={handleSave} disabled={!isDirty || isUpdating}>حفظ التغييرات</Button>
            <Button variant="outline" onClick={handleReset}>إعادة الإفتراضي</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>معاينة</CardTitle>
        </CardHeader>
        <CardContent>
            <div className="p-4 rounded-md shadow-card">
            <h3 className="font-bold mb-2">مثال على الألوان وحجم الخط</h3>
            <div className={cn('p-4 rounded-md', 'bg-gradient-primary text-white')}>زر تجريبي</div>
            <p className="mt-3">حجم النص الحالي (تجريبي): <strong>{String(local.font_size)}</strong></p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>تخصيص أزرار القائمة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {MENU_LABEL_FIELDS.map((field) => (
              <div key={field.path} className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-center">
                <div><strong>{field.defaultLabel}</strong> <div className="text-xs text-muted-foreground">{field.description}</div></div>
                <Input value={(local.menu_labels?.[field.path] ?? menuOverrides[field.path] ?? '')} onChange={(e) => { setLocal(prev => ({ ...prev, menu_labels: { ...(prev.menu_labels ?? {}), [field.path]: e.target.value } })); setIsDirty(true); }} placeholder={field.defaultLabel} />
              </div>
            ))}
            <div className="mt-2">
              <p className="text-sm text-muted-foreground">حجم القوائم الافتراضي المستخدم: <strong>{String(local.menu_font_size_px ?? (local.menu_font_size ? MENU_FONT_SIZE_MAP[local.menu_font_size] : (settings ? (settings as Record<string, Json>)['menu_font_size'] : '')) )}</strong></p>
            </div>
            <div className="mt-2">
              <p className="text-sm text-muted-foreground">معاينة القوائم:</p>
              <ul className="list-disc pl-5 mt-2">
                {MENU_LABEL_FIELDS.map((f) => <li key={f.path}>{(local.menu_labels?.[f.path] ?? menuOverrides[f.path] ?? f.defaultLabel)}</li>)}
              </ul>
            </div>
            <div className="mt-3 flex gap-2">
              <Button variant="outline" onClick={() => { setLocal(prev => ({ ...prev, menu_labels: {} })); setIsDirty(true); toast({ title: 'تم التجهيز', description: 'استعادة التسميات المحلية إلى الافتراضي (لن تطبق حتى الحفظ)' }); }}>إعادة تسمية القوائم للافتراضي</Button>
              <Button variant="ghost" onClick={() => handleResetDefaults()}>استعادة التذييل وتسميات القوائم للـافتراضي (حفظ)</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>التذييل</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <label className="block text-sm">عنوان التذييل</label>
            <Input value={String(local.footer_heading ?? (settings ? (settings as Record<string, unknown>)['footer_heading'] ?? '' : ''))} onChange={(e) => { setLocal(prev => ({ ...prev, footer_heading: e.target.value })); setIsDirty(true); }} />
            <label className="block text-sm">نص التذييل</label>
            <Input value={String(local.footer_subtext ?? (settings ? (settings as Record<string, unknown>)['footer_subtext'] ?? '' : ''))} onChange={(e) => { setLocal(prev => ({ ...prev, footer_subtext: e.target.value })); setIsDirty(true); }} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>اقتراحات تحسين الإعدادات</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc pl-5 space-y-2 text-sm">
            <li>إضافة خيار لتغيير خط النظام (مثلاً: Tajawal / Inter) مع معاينة مباشرة.</li>
            <li>التحكم في توقيت صفحة الصيانة (جدولة مواعيد الصيانة تلقائياً).</li>
            <li>السماح بإعدادات خاصة بالمنطقة الزمنية وصيغة التاريخ/العملة لكل سوق.</li>
            <li>تمكين وضع "اختبار ميزات" (feature flags) لتجربة ميزات جديدة للمستخدمين المحددين.</li>
            <li>إمكانية استرجاع سجل التغييرات (audit) عند تحديث الإعدادات من قِبل الإدارة.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsTab;
