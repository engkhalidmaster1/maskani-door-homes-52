import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Home, Building, PlusCircle, User, Menu, LogOut, Shield, Settings, LogIn, UserPlus, Heart, List } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useFavorites } from "@/hooks/useFavorites";
import { useUserStatus } from "@/hooks/useUserStatus";
import { Badge } from "@/components/ui/badge";
import { MobileNav } from "./MobileNav";

interface MobileHeaderProps {
  onSidebarToggle: () => void;
}

export const MobileHeader = ({ onSidebarToggle }: MobileHeaderProps) => {
  const { user, signOut, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { getFavoritesCount } = useFavorites();
  const { userStatus, getStatusLabel, getStatusColor } = useUserStatus();
  
  // Navigation items based on authentication status
  const navItems = user ? [
    { id: "/", label: "الرئيسية", icon: Home },
    { id: "/properties", label: "العقارات", icon: Building },
    { id: "/favorites", label: "المفضلة", icon: Heart, badge: getFavoritesCount() },
    { id: "/add-property", label: "إضافة عقار", icon: PlusCircle },
    { id: "/profile", label: "الملف الشخصي", icon: User },
    ...(isAdmin ? [{ id: "/dashboard", label: "لوحة التحكم", icon: Settings }] : []),
  ] : [
    { id: "/", label: "الرئيسية", icon: Home },
    { id: "/properties", label: "العقارات", icon: Building },
  ];

  // Check if current path is dashboard-related
  const isDashboardPath = location.pathname.startsWith('/dashboard');

  return (
    <header className="gradient-primary text-primary-foreground shadow-elegant sticky top-0 z-50 lg:hidden">
      <div className="px-4">
        <div className="flex items-center justify-between h-14">
          {/* Menu button */}
          <Button
            variant="ghost"
            className="flex items-center gap-2 px-3 py-2 hover:bg-white/20 text-primary-foreground group rounded-lg"
            onClick={onSidebarToggle}
          >
            <div className="flex flex-col items-end gap-1 min-w-[20px]">
              <div className="w-5 h-[2px] bg-white rounded-full transition-all duration-300 group-hover:w-4"></div>
              <div className="w-4 h-[2px] bg-white rounded-full transition-all duration-300 group-hover:w-5"></div>
              <div className="w-5 h-[2px] bg-white rounded-full transition-all duration-300 group-hover:w-3"></div>
            </div>
            <span className="font-medium text-sm tracking-wide">قائمة</span>
          </Button>

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="bg-accent text-accent-foreground p-1.5 rounded-lg">
              <Home className="h-4 w-4" />
            </div>
            <h1 className="text-lg font-bold">سكني</h1>
          </Link>

          {/* User Actions */}
          <div className="flex items-center gap-1">
            {user ? (
              <MobileNav>
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = item.id === "/dashboard" ? isDashboardPath : location.pathname === item.id;
                  return (
                    <Link key={item.id} to={item.id}>
                      <Button
                        variant="ghost"
                        className={`w-full justify-start text-foreground hover:bg-muted gap-3 ${
                          isActive ? "bg-muted" : ""
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {item.label}
                        {item.badge && item.badge > 0 && (
                          <Badge variant="secondary" className="text-xs mr-auto bg-red-500 text-white">
                            {item.badge}
                          </Badge>
                        )}
                      </Button>
                    </Link>
                  );
                })}
                
                {user && (
                  <>
                    <div className="border-t border-muted my-2"></div>
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-destructive hover:bg-destructive/10 gap-3"
                      onClick={() => signOut()}
                    >
                      <LogOut className="h-4 w-4" />
                      تسجيل الخروج
                    </Button>
                  </>
                )}
              </MobileNav>
            ) : (
              <div className="flex items-center gap-1">
                <Link to="/auth/login">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1 text-primary-foreground hover:bg-white/20 text-xs px-2"
                  >
                    <LogIn className="h-3 w-3" />
                    دخول
                  </Button>
                </Link>
                <Link to="/auth/register">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1 text-primary-foreground border-primary-foreground hover:bg-white/20 text-xs px-2"
                  >
                    <UserPlus className="h-3 w-3" />
                    تسجيل
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};