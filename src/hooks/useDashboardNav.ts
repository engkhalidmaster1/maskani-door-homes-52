import { useEffect, useMemo } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';

// جميع التبويبات المسموح بها في لوحة التحكم
export const DASHBOARD_TABS = [
  'overview',
  'properties',
  'properties-management',
  'edit-properties',
  'banner-settings',
  'floating-button',
  'home-cards',
  'search-bar-settings',
  'users',
  'user-roles',
  'broadcast-notification',
  'system-health',
  'settings',
  'profile',
  'system-documentation',
] as const;

export type DashboardTabId = typeof DASHBOARD_TABS[number];

function isValidTab(tab: string | undefined | null): tab is DashboardTabId {
  return !!tab && (DASHBOARD_TABS as readonly string[]).includes(tab);
}

/**
 * هوك مركزي لإدارة تبويبات لوحة التحكم:
 * - يزامن التبويب مع مسار الرابط /dashboard/:tab
 * - يحفظ آخر تبويب في localStorage
 * - يعيد التوجيه إلى overview عند وجود تبويب غير صالح
 */
export function useDashboardNav() {
  const params = useParams<{ tab?: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  // استنتاج التبويب الحالي من الـ URL أو localStorage أو القيمة الافتراضية
  const selectedTab: DashboardTabId = useMemo(() => {
    const fromUrl = params.tab;
    if (isValidTab(fromUrl)) return fromUrl;
    try {
      const stored = localStorage.getItem('dashboard_selected_tab');
      if (isValidTab(stored)) return stored;
    } catch (storageError) {
      console.warn('Failed to read dashboard selected tab from storage', storageError);
    }
    return 'overview';
  }, [params.tab]);

  // إصلاح الروابط غير الصالحة: إن كان المسار /dashboard/:tab غير صالح، أعد التوجيه إلى overview
  useEffect(() => {
    const fromUrl = params.tab;
    if (fromUrl && !isValidTab(fromUrl)) {
      navigate('/dashboard/overview', { replace: true });
    }
  }, [params.tab, navigate]);

  // حفظ آخر تبويب تم فتحه
  useEffect(() => {
    try {
      localStorage.setItem('dashboard_selected_tab', selectedTab);
    } catch (storageError) {
      console.warn('Failed to persist dashboard tab selection', storageError);
    }
  }, [selectedTab]);

  // تغيير التبويب مع تحديث الـ URL بشكل مستقر
  const setTab = (tab: DashboardTabId) => {
    if (!isValidTab(tab)) {
      tab = 'overview';
    }
    const target = `/dashboard/${tab}`;
    if (location.pathname !== target) {
      navigate(target, { replace: false });
    }
  };

  return { selectedTab, setTab };
}
