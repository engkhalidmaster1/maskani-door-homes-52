import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Home, Building, PlusCircle, User, Menu, LogOut, Settings, LogIn, UserPlus, Heart, MapPin } from "lucide-react";
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
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const { user, signOut, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { getFavoritesCount } = useFavorites();
  const { settings } = useSettings() ?? { settings: null };
  const labelOverrides = parseMenuLabelOverrides(settings);
  const { userStatus, getStatusLabel, getStatusColor } = useUserStatus();
  
  // Different navigation items based on authentication status
  const navItems = user ? [
    { id: "/", label: getMenuLabel('/', 'الرئيسية', labelOverrides), icon: Home },
    { id: "/properties", label: getMenuLabel('/properties', 'العقارات', labelOverrides), icon: Building },
    { id: "/map", label: getMenuLabel('/map', 'الخريطة', labelOverrides), icon: MapPin },
    { id: "/favorites", label: getMenuLabel('/favorites', 'المفضلة', labelOverrides), icon: Heart, badge: getFavoritesCount() },
    { id: "/add-property", label: getMenuLabel('/add-property', 'إضافة عقار', labelOverrides), icon: PlusCircle },
    { id: "/profile", label: getMenuLabel('/profile', 'الملف الشخصي', labelOverrides), icon: User },
    ...(isAdmin ? [{ id: "/dashboard/overview", label: getMenuLabel('/dashboard/overview', 'لوحة التحكم', labelOverrides), icon: Settings }] : []),
  ] : [
    { id: "/", label: getMenuLabel('/', 'الرئيسية', labelOverrides), icon: Home },
    { id: "/properties", label: getMenuLabel('/properties', 'العقارات', labelOverrides), icon: Building },
    { id: "/map", label: getMenuLabel('/map', 'الخريطة', labelOverrides), icon: MapPin },
  ];

  // Check if current path is dashboard-related
  const isDashboardPath = location.pathname.startsWith('/dashboard');


  return (
    <header className="gradient-primary text-primary-foreground shadow-elegant sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Menu button - Mobile Only */}
          <Button
            className="md:hidden flex items-center justify-center p-0 rounded-full border-4 border-white bg-blue-500 w-12 h-12 shadow-lg"
            onClick={onSidebarToggle}
            aria-label="فتح القائمة"
          >
            <Menu className="h-7 w-7 text-white" />
          </Button>

          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <div className="bg-accent text-accent-foreground p-2 rounded-xl">
              <Home className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold">سكني</h1>
          </Link>

          {/* Desktop Navigation */}
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

          {/* User Actions + Profile Icon */}
          <div className="flex items-center gap-2">
            {/* Removed maintenance indicator and settings dependency */}
            {/* Notifications bell */}
            {user && (
              <div className="block">
                <NotificationsBell />
              </div>
            )}
            {/* زر الملف الشخصي يظهر فقط في الجوال */}
            <div className="relative md:hidden">
              <Button
                className="flex items-center justify-center p-0 rounded-full border-4 border-white bg-blue-500 w-12 h-12 shadow-lg"
                onClick={() => {
                  if (!user) {
                    navigate("/login");
                  } else {
                    setShowProfileMenu((prev) => !prev);
                  }
                }}
                title={user ? "الملف الشخصي" : "تسجيل الدخول"}
              >
                <User className="h-7 w-7 text-white" />
              </Button>
              {/* قائمة تسجيل خروج تظهر عند الضغط */}
              {user && showProfileMenu && (
                <div className="absolute left-0 mt-2 w-36 bg-white rounded-xl shadow-lg z-50 border">
                  <Button
                    className="w-full text-red-600 rounded-xl"
                    variant="ghost"
                    onClick={async () => {
                      setShowProfileMenu(false);
                      await signOut();
                      navigate("/");
                    }}
                  >
                    تسجيل الخروج
                  </Button>
                </div>
              )}
            </div>
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