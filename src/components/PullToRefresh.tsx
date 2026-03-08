import { useState, useRef, useCallback } from "react";
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import { haptic } from "@/utils/haptic";
import { RefreshCw } from "lucide-react";

interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void;
  children: React.ReactNode;
}

export const PullToRefresh = ({ onRefresh, children }: PullToRefreshProps) => {
  const isMobile = useIsMobile();
  const [refreshing, setRefreshing] = useState(false);
  const y = useMotionValue(0);
  const pullProgress = useTransform(y, [0, 80], [0, 1]);
  const rotate = useTransform(y, [0, 80], [0, 360]);
  const opacity = useTransform(y, [0, 30, 80], [0, 0.5, 1]);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleDragEnd = useCallback(
    async (_: any, info: PanInfo) => {
      if (info.offset.y > 80 && !refreshing) {
        setRefreshing(true);
        haptic("medium");
        try {
          await onRefresh();
        } finally {
          setRefreshing(false);
        }
      }
    },
    [onRefresh, refreshing]
  );

  if (!isMobile) return <>{children}</>;

  return (
    <div ref={containerRef} className="relative overflow-hidden">
      {/* Pull indicator */}
      <motion.div
        style={{ opacity }}
        className="absolute top-0 left-0 right-0 flex items-center justify-center z-10 pointer-events-none"
      >
        <motion.div
          style={{ rotate: refreshing ? undefined : rotate }}
          animate={refreshing ? { rotate: 360 } : {}}
          transition={refreshing ? { duration: 0.8, repeat: Infinity, ease: "linear" } : {}}
          className="mt-2 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center"
        >
          <RefreshCw className="w-4 h-4 text-primary" />
        </motion.div>
      </motion.div>

      <motion.div
        style={{ y: refreshing ? 48 : y }}
        drag={refreshing ? false : "y"}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.4 }}
        dragDirectionLock
        onDragEnd={handleDragEnd}
        animate={refreshing ? { y: 48 } : { y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {children}
      </motion.div>
    </div>
  );
};
