import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Home, Building, PlusCircle, User, Menu, LogOut, Settings, LogIn, UserPlus, Heart, MapPin, Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useFavorites } from "@/hooks/useFavorites";
import { useSettings } from '@/hooks/useSettings';
import { parseMenuLabelOverrides, getMenuLabel } from '@/lib/menuLabels';
import { useUserStatus } from "@/hooks/useUserStatus";
import { Badge } from "@/components/ui/badge";
import NotificationsBell from "@/components/NotificationsBell";

interface HeaderProps {
  onSidebarToggle: () => void;
}

export const Header = ({ onSidebarToggle }: HeaderProps) => {
  const { user, signOut, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { getFavoritesCount } = useFavorites();
  const { settings } = useSettings() ?? { settings: null };
  const { theme, toggleTheme } = useTheme();
  const labelOverrides = parseMenuLabelOverrides(settings);
  
  // Desktop navigation items
  const navItems = user ? [
    { id: "/", label: getMenuLabel('/', 'الرئيسية', labelOverrides), icon: Home },
    { id: "/properties", label: getMenuLabel('/properties', 'العقارات', labelOverrides), icon: Building },
    { id: "/map", label: getMenuLabel('/map', 'الخريطة', labelOverrides), icon: MapPin },
    { id: "/offices", label: getMenuLabel('/offices', 'المكاتب', labelOverrides), icon: Building },
    { id: "/favorites", label: getMenuLabel('/favorites', 'المفضلة', labelOverrides), icon: Heart, badge: getFavoritesCount() },
    { id: "/add-property", label: getMenuLabel('/add-property', 'إضافة عقار', labelOverrides), icon: PlusCircle },
    { id: "/profile", label: getMenuLabel('/profile', 'الملف الشخصي', labelOverrides), icon: User },
    ...(isAdmin ? [{ id: "/dashboard/overview", label: getMenuLabel('/dashboard/overview', 'لوحة التحكم', labelOverrides), icon: Settings }] : []),
  ] : [
    { id: "/", label: getMenuLabel('/', 'الرئيسية', labelOverrides), icon: Home },
    { id: "/properties", label: getMenuLabel('/properties', 'العقارات', labelOverrides), icon: Building },
    { id: "/map", label: getMenuLabel('/map', 'الخريطة', labelOverrides), icon: MapPin },
    { id: "/offices", label: getMenuLabel('/offices', 'المكاتب', labelOverrides), icon: Building },
  ];

  const isDashboardPath = location.pathname.startsWith('/dashboard');

  return (
    <header className="gradient-primary text-primary-foreground shadow-elegant sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-14 md:h-16">
          {/* Mobile: Logo on the right */}
          <Link to="/" className="flex items-center gap-2 md:gap-3">
            <div className="bg-accent text-accent-foreground p-1.5 md:p-2 rounded-xl">
              <Home className="h-5 w-5 md:h-6 md:w-6" />
            </div>
            <h1 className="text-xl md:text-2xl font-bold">سكني</h1>
          </Link>

          {/* Desktop Navigation - hidden on mobile */}
          <nav className="hidden md:flex items-center gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.id.startsWith('/dashboard') ? isDashboardPath : location.pathname === item.id;
              return (
                <Link key={item.id} to={item.id}>
                  <Button
                    variant="ghost"
                    className={`text-primary-foreground hover:bg-white/20 gap-2 relative ${
                      isActive ? "bg-white/25" : ""
                    }`}
                    style={{ fontSize: 'var(--menu-font-size)' }}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                    {item.badge && item.badge > 0 && (
                      <Badge variant="secondary" className="text-xs ml-1 bg-red-500 text-white">
                        {item.badge}
                      </Badge>
                    )}
                  </Button>
                </Link>
              );
            })}
          </nav>

          {/* Right side actions */}
          <div className="flex items-center gap-2">
            {/* Notifications bell */}
            {user && <NotificationsBell />}

            {/* Desktop auth buttons */}
            {!user ? (
              <div className="hidden md:flex items-center gap-2">
                <Link to="/login">
                  <Button
                    variant="ghost"
                    className="gap-2 text-primary-foreground hover:bg-white/20 border-2 border-white"
                  >
                    <LogIn className="h-4 w-4" />
                    تسجيل الدخول
                  </Button>
                </Link>
                <Link to="/register">
                  <Button
                    variant="default"
                    className="gap-2 bg-primary hover:bg-primary/90 text-white border-2 border-white"
                  >
                    <UserPlus className="h-4 w-4" />
                    إنشاء حساب
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Button
                  variant="ghost"
                  className="gap-2 text-primary-foreground hover:bg-white/20 border-2 border-white"
                  onClick={async () => {
                    await signOut();
                    navigate('/');
                  }}
                >
                  <LogOut className="h-4 w-4" />
                  تسجيل الخروج
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
