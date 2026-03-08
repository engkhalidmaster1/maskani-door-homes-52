import { useEffect, useMemo } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';

export const DASHBOARD_TABS = [
  'overview',
  'properties',
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
  'dev-docs',
] as const;

export type DashboardTabId = typeof DASHBOARD_TABS[number];

function isValidTab(tab: string | undefined | null): tab is DashboardTabId {
  return !!tab && (DASHBOARD_TABS as readonly string[]).includes(tab);
}

export function useDashboardNav() {
  const params = useParams<{ tab?: string }>();
  const navigate = useNavigate();
  const location = useLocation();

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

  useEffect(() => {
    const fromUrl = params.tab;
    if (fromUrl && !isValidTab(fromUrl)) {
      navigate('/dashboard/overview', { replace: true });
    }
  }, [params.tab, navigate]);

  useEffect(() => {
    try {
      localStorage.setItem('dashboard_selected_tab', selectedTab);
    } catch (storageError) {
      console.warn('Failed to persist dashboard tab selection', storageError);
    }
  }, [selectedTab]);

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
