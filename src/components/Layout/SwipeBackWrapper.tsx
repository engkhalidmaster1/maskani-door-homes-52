import { useCallback, useRef } from "react";
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { haptic } from "@/utils/haptic";
import { useIsMobile } from "@/hooks/use-mobile";

// Pages that are considered "detail/inner" pages where swipe-back makes sense
const SWIPEABLE_PAGES = [
  "/property/",
  "/edit-property/",
  "/edit-office/",
  "/add-property",
  "/profile",
  "/favorites",
  "/image-diagnostics",
  "/admin/",
  "/dashboard/",
  "/system-documentation",
  "/users-view",
];

interface SwipeBackWrapperProps {
  children: React.ReactNode;
}

export const SwipeBackWrapper = ({ children }: SwipeBackWrapperProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const x = useMotionValue(0);
  const opacity = useTransform(x, [0, 150], [1, 0.4]);
  const scale = useTransform(x, [0, 150], [1, 0.95]);
  const hasNavigated = useRef(false);

  const isSwipeable = SWIPEABLE_PAGES.some((p) => location.pathname.startsWith(p));

  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      // Swipe right (RTL: means "back") if offset > 100px or velocity > 500
      if ((info.offset.x > 100 || info.velocity.x > 500) && !hasNavigated.current) {
        hasNavigated.current = true;
        haptic('medium');
        navigate(-1);
        setTimeout(() => {
          hasNavigated.current = false;
        }, 500);
      }
    },
    [navigate]
  );

  if (!isMobile || !isSwipeable) {
    return <>{children}</>;
  }

  return (
    <motion.div
      style={{ x, opacity, scale }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={{ left: 0, right: 0.5 }}
      dragDirectionLock
      onDragEnd={handleDragEnd}
      className="min-h-screen"
    >
      {children}
    </motion.div>
  );
};
