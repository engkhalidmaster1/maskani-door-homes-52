import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Home, Building, PlusCircle, User, Menu, LogOut, Shield, Settings, LogIn, UserPlus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Link, useLocation, useNavigate } from "react-router-dom";

interface HeaderProps {
  onSidebarToggle: () => void;
}

export const Header = ({ onSidebarToggle }: HeaderProps) => {
  const { user, signOut, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Different navigation items based on authentication status
  const navItems = user ? [
    { id: "/", label: "الرئيسية", icon: Home },
    { id: "/properties", label: "العقارات", icon: Building },
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
    <header className="gradient-primary text-primary-foreground shadow-elegant sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-primary-foreground hover:bg-white/20"
            onClick={onSidebarToggle}
          >
            <Menu className="h-6 w-6" />
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
                    className={`text-primary-foreground hover:bg-white/20 gap-2 ${
                      isActive ? "bg-white/25" : ""
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </nav>

          {/* User Actions */}
          <div className="flex items-center gap-2">
            {isAdmin && user && (
              <div className="flex items-center gap-1 bg-accent/20 text-accent-foreground px-3 py-1 rounded-full text-sm">
                <Shield className="h-4 w-4" />
                أدمن
              </div>
            )}
            
            {user ? (
              <Button
                variant="ghost"
                onClick={async () => {
                  console.log('Header: Sign out button clicked');
                  await signOut();
                  navigate('/');
                }}
                className="gap-2 text-primary-foreground hover:bg-white/20"
              >
                <LogOut className="h-4 w-4" />
                تسجيل الخروج
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/auth/login">
                  <Button
                    variant="ghost"
                    className="gap-2 text-primary-foreground hover:bg-white/20"
                  >
                    <LogIn className="h-4 w-4" />
                    تسجيل الدخول
                  </Button>
                </Link>
                <Link to="/auth/register">
                  <Button
                    variant="outline"
                    className="gap-2 text-primary-foreground border-primary-foreground hover:bg-white/20"
                  >
                    <UserPlus className="h-4 w-4" />
                    إنشاء حساب
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