import { Info } from "lucide-react";
import { useBannerSettings } from "@/hooks/useBannerSettings";

export const ScrollingBanner = () => {
  const { activeBanner, isLoadingActive } = useBannerSettings();

  // Don't show banner if loading or no active banner
  if (isLoadingActive || !activeBanner) {
    return null;
  }

  return (
    <div className="gradient-primary text-primary-foreground rounded-xl mb-8 overflow-hidden">
      <div className="py-3 relative">
        <div className="animate-scroll-left-to-right whitespace-nowrap">
          <div className="flex items-center gap-2 inline-block">
            <Info className="h-5 w-5" />
            <span className="font-medium">
              {activeBanner.text}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};