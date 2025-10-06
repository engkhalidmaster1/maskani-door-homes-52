import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Home, Building, PlusCircle, User, LogOut, X, Phone, Mail, Shield, Settings, LogIn, UserPlus, Heart, MapPin } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useFavorites } from "@/hooks/useFavorites";
import { Badge } from "@/components/ui/badge";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const { user, signOut, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { getFavoritesCount } = useFavorites();
  
  // Different navigation items based on authentication status
  const navItems = user ? [
    { id: "/", label: "الرئيسية", icon: Home },
    { id: "/properties", label: "العقارات", icon: Building },
    { id: "/offices", label: "المكاتب العقارية", icon: Shield },
    { id: "/favorites", label: "المفضلة", icon: Heart, badge: getFavoritesCount() },
    { id: "/add-property", label: "إضافة عقار", icon: PlusCircle },
    { id: "/profile", label: "الملف الشخصي", icon: User },
    ...(isAdmin ? [{ id: "/dashboard", label: "لوحة التحكم", icon: Settings }] : []),
  ] : [
    { id: "/", label: "الرئيسية", icon: Home },
    { id: "/properties", label: "العقارات", icon: Building },
    { id: "/offices", label: "المكاتب العقارية", icon: Shield },
  ];

  const handleNavClick = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Sidebar */}
      <div
        className={`fixed top-0 right-0 h-full w-80 bg-card border-l shadow-2xl z-50 transform transition-transform duration-300 overflow-y-auto ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-8 pb-4 border-b">
            <Link to="/" className="flex items-center gap-3">
              <div className="bg-primary text-primary-foreground p-2 rounded-xl">
                <Home className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-bold">سكني</h2>
            </Link>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* User Info */}
          {user ? (
            <div className="bg-accent/20 p-4 rounded-lg mb-6">
              <div className="flex items-center gap-2 mb-2">
                <User className="h-5 w-5 text-primary" />
                <span className="font-semibold">مرحباً بك</span>
              </div>
              {isAdmin && (
                <div className="flex items-center gap-1 text-accent text-sm">
                  <Shield className="h-4 w-4" />
                  أدمن النظام
                </div>
              )}
            </div>
          ) : (
            <div className="bg-accent/20 p-4 rounded-lg mb-6">
              <div className="flex items-center gap-2 mb-2">
                <User className="h-5 w-5 text-primary" />
                <span className="font-semibold">مرحباً بك في سكني</span>
              </div>
              <p className="text-sm text-muted-foreground">
                سجل دخولك للوصول إلى جميع الميزات
              </p>
            </div>
          )}

          {/* Navigation */}
          <nav className="space-y-2 mb-8">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.id;
              return (
                <Button
                  key={item.id}
                  variant="ghost"
                  className={`w-full justify-start gap-3 h-12 relative ${
                    isActive
                      ? "gradient-primary text-primary-foreground shadow-elegant"
                      : "hover:bg-accent"
                  }`}
                  onClick={() => handleNavClick(item.id)}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                  {item.badge && item.badge > 0 && (
                    <Badge variant="secondary" className="text-xs mr-auto bg-red-500 text-white">
                      {item.badge}
                    </Badge>
                  )}
                </Button>
              );
            })}
            
            {user ? (
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 h-12 hover:bg-destructive/10 text-destructive"
                onClick={async () => {
                  console.log('Sidebar: Sign out button clicked');
                  await signOut();
                  onClose();
                  navigate('/');
                }}
              >
                <LogOut className="h-5 w-5" />
                تسجيل الخروج
              </Button>
            ) : (
              <>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 h-12 hover:bg-accent"
                  onClick={() => handleNavClick('/login')}
                >
                  <LogIn className="h-5 w-5" />
                  تسجيل الدخول
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start gap-3 h-12 border-primary hover:bg-accent"
                  onClick={() => handleNavClick('/register')}
                >
                  <UserPlus className="h-5 w-5" />
                  إنشاء حساب
                </Button>
              </>
            )}
          </nav>

          {/* Contact Card */}
          <Card className="p-4 shadow-card">
            <h3 className="font-semibold mb-3">تواصل معنا</h3>
            <p className="text-sm text-muted-foreground mb-4">
              للاستفسارات والدعم الفني:
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>00905013196750</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
};