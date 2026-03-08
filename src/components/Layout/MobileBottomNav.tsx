import { Home, Building, MapPin, Heart, Menu } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useFavorites } from "@/hooks/useFavorites";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { haptic } from "@/utils/haptic";

interface MobileBottomNavProps {
  onDrawerOpen: () => void;
}

const tabs = [
  { id: "/", label: "الرئيسية", icon: Home },
  { id: "/properties", label: "العقارات", icon: Building },
  { id: "/map", label: "الخريطة", icon: MapPin },
  { id: "/favorites", label: "المفضلة", icon: Heart },
];

export const MobileBottomNav = ({ onDrawerOpen }: MobileBottomNavProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { getFavoritesCount } = useFavorites();
  const { user } = useAuth();
  const favCount = getFavoritesCount();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-card/95 backdrop-blur-lg border-t border-border shadow-[0_-4px_20px_hsl(0_0%_0%/0.08)]">
      <div className="flex items-center justify-around h-16 px-1 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = location.pathname === tab.id;
          const showBadge = tab.id === "/favorites" && user && favCount > 0;

          return (
            <button
              key={tab.id}
              onClick={() => navigate(tab.id)}
              className="relative flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-colors"
              aria-label={tab.label}
            >
              {isActive && (
                <motion.div
                  layoutId="bottomNavIndicator"
                  className="absolute -top-0.5 w-8 h-1 rounded-full bg-primary"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
              <div className="relative">
                <Icon
                  className={`h-5 w-5 transition-colors ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`}
                />
                {showBadge && (
                  <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold px-1">
                    {favCount}
                  </span>
                )}
              </div>
              <span
                className={`text-[10px] font-medium leading-tight ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}

        {/* More / Drawer button */}
        <button
          onClick={onDrawerOpen}
          className="relative flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-colors"
          aria-label="المزيد"
        >
          <Menu className="h-5 w-5 text-muted-foreground" />
          <span className="text-[10px] font-medium leading-tight text-muted-foreground">
            المزيد
          </span>
        </button>
      </div>

      {/* Safe area spacer for notched devices */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
};
