import type { Json } from '@/integrations/supabase/types';

export interface MenuLabelConfig {
  path: string;
  defaultLabel: string;
  description: string;
}

export type MenuLabelOverrides = Record<string, string>;

type FontSizeKey = 'small' | 'normal' | 'large';
const FONT_SIZE_MAP: Record<FontSizeKey, string> = {
  small: '14px',
  normal: '16px',
  large: '18px',
};

export const MENU_LABEL_FIELDS: MenuLabelConfig[] = [
  { path: '/', defaultLabel: 'الرئيسية', description: 'العودة إلى الصفحة الرئيسية للزوار' },
  { path: '/properties', defaultLabel: 'العقارات', description: 'صفحة عرض جميع العقارات' },
  { path: '/map', defaultLabel: 'الخريطة', description: 'عرض العقارات مع الخريطة التفاعلية' },
  { path: '/favorites', defaultLabel: 'المفضلة', description: 'الوصول إلى قائمة العقارات المفضلة' },
  { path: '/add-property', defaultLabel: 'إضافة عقار', description: 'فتح نموذج إضافة عقار جديد' },
  { path: '/profile', defaultLabel: 'الملف الشخصي', description: 'الوصول إلى صفحة الملف المحفوظة' },
  { path: '/dashboard/overview', defaultLabel: 'لوحة التحكم', description: 'مدخل إدارة النظام للمشرف' },
  { path: '/admin/users', defaultLabel: 'إدارة المستخدمين', description: 'التحكم في صلاحيات ومحتوى المستخدمين' },
];

export const FOOTER_DEFAULT_HEADING = 'تطبيق "سكني" - المنصة الأولى في كوردستان لنشر العقارات للبيع والإيجار';
export const FOOTER_DEFAULT_SUBTEXT = 'جميع الحقوق محفوظة';

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const parseMenuLabelOverrides = (settings: Json | null): MenuLabelOverrides => {
  if (!settings) return {};
  const cfg = settings as Record<string, Json>;
  const raw = cfg['menu_labels'];
  if (!raw || !isPlainObject(raw)) return {};
  const overrides: MenuLabelOverrides = {};
  for (const [key, value] of Object.entries(raw)) {
    overrides[key] = value === null || value === undefined ? '' : String(value);
  }
  return overrides;
};

export const getMenuLabel = (
  path: string,
  defaultLabel: string,
  overrides: MenuLabelOverrides | undefined
): string => overrides?.[path] && overrides[path].trim().length > 0 ? overrides[path] : defaultLabel;

export const getMenuFontSize = (settings: Json | null): string => {
  if (!settings) return FONT_SIZE_MAP.normal;
  const cfg = settings as Record<string, Json>;
  const raw = cfg['menu_font_size'];
  if (raw && typeof raw === 'string' && raw in FONT_SIZE_MAP) {
    return FONT_SIZE_MAP[raw as FontSizeKey];
  }
  return FONT_SIZE_MAP.normal;
};

export const MENU_FONT_SIZE_MAP = FONT_SIZE_MAP;
