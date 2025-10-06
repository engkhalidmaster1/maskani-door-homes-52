import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Home, Building, PlusCircle, User, Menu, LogOut, Shield, Settings, LogIn, UserPlus, Heart, MapPin } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useFavorites } from "@/hooks/useFavorites";
import { useUserStatus } from "@/hooks/useUserStatus";
import { Badge } from "@/components/ui/badge";

interface HeaderProps {
  onSidebarToggle: () => void;
}

export const Header = ({ onSidebarToggle }: HeaderProps) => {
  const { user, signOut, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { getFavoritesCount } = useFavorites();
  const { userStatus, getStatusLabel, getStatusColor } = useUserStatus();
  
  // Different navigation items based on authentication status
  const navItems = user ? [
    { id: "/", label: "الرئيسية", icon: Home },
    { id: "/properties", label: "العقارات", icon: Building },
    { id: "/offices", label: "المكاتب العقارية", icon: Shield },
    { id: "/map", label: "الخريطة", icon: MapPin },
    { id: "/favorites", label: "المفضلة", icon: Heart, badge: getFavoritesCount() },
    { id: "/add-property", label: "إضافة عقار", icon: PlusCircle },
    { id: "/profile", label: "الملف الشخصي", icon: User },
    ...(isAdmin ? [{ id: "/dashboard", label: "لوحة التحكم", icon: Settings }] : []),
  ] : [
    { id: "/", label: "الرئيسية", icon: Home },
    { id: "/properties", label: "العقارات", icon: Building },
    { id: "/offices", label: "المكاتب العقارية", icon: Shield },
    { id: "/map", label: "الخريطة", icon: MapPin },
  ];

  // Check if current path is dashboard-related
  const isDashboardPath = location.pathname.startsWith('/dashboard');

  return (
    <header className="gradient-primary text-primary-foreground shadow-elegant sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Menu button - Mobile Only */}
          <Button
            variant="ghost"
            className="md:hidden flex items-center gap-3 px-4 py-2.5 hover:bg-white/20 text-primary-foreground group rounded-xl"
            onClick={onSidebarToggle}
          >
            <div className="flex flex-col items-end gap-2 min-w-[28px]">
              <div className="w-7 h-[3px] bg-white rounded-full transition-all duration-300 group-hover:w-6"></div>
              <div className="w-6 h-[3px] bg-white rounded-full transition-all duration-300 group-hover:w-7"></div>
              <div className="w-7 h-[3px] bg-white rounded-full transition-all duration-300 group-hover:w-5"></div>
            </div>
            <span className="font-medium text-[15px] tracking-wide">قائمة</span>
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
              const isActive = item.id === "/dashboard" ? isDashboardPath : location.pathname === item.id;
              return (
                <Link key={item.id} to={item.id}>
                  <Button
                    variant="ghost"
                    className={`text-primary-foreground hover:bg-white/20 gap-2 relative ${
                      isActive ? "bg-white/25" : ""
                    }`}
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

          {/* User Actions */}
          <div className="flex items-center gap-2">
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