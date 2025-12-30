import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/buttonVariants";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Building2,
  MessageSquare,
  Activity,
  UsersRound,
  Bell,
  User,
  Shield,
  Settings,
  UserCog,
  MonitorSpeaker,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

interface DashboardTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const DashboardTabs = ({ activeTab, onTabChange }: DashboardTabsProps) => {
  const tabs = [
    {
      id: "overview",
      label: "نظرة عامة",
      icon: LayoutDashboard,
      color: "text-blue-600",
      gradient: "from-blue-500 via-blue-600 to-indigo-600",
      hoverGradient: "from-blue-400 to-blue-500",
      shadowColor: "shadow-blue-500/25"
    },
    {
      id: "properties",
      label: "العقارات",
      icon: Building2,
      color: "text-emerald-600",
      gradient: "from-emerald-500 via-emerald-600 to-teal-600",
      hoverGradient: "from-emerald-400 to-emerald-500",
      shadowColor: "shadow-emerald-500/25"
    },
    {
      id: "users",
      label: "إدارة المستخدمين",
      icon: UserCog,
      color: "text-indigo-600",
      gradient: "from-indigo-500 via-indigo-600 to-purple-600",
      hoverGradient: "from-indigo-400 to-indigo-500",
      shadowColor: "shadow-indigo-500/25",
      badge: "محدث"
    },
    {
      id: "user-roles",
      label: "الصلاحيات",
      icon: Shield,
      color: "text-red-600",
      gradient: "from-red-500 via-red-600 to-rose-600",
      hoverGradient: "from-red-400 to-red-500",
      shadowColor: "shadow-red-500/25"
    },
    {
      id: "banner-settings",
      label: "الشريط الإعلاني",
      icon: MessageSquare,
      color: "text-purple-600",
      gradient: "from-purple-500 via-purple-600 to-pink-600",
      hoverGradient: "from-purple-400 to-purple-500",
      shadowColor: "shadow-purple-500/25"
    },
    {
      id: "floating-button",
      label: "الزر العائم",
      icon: Activity,
      color: "text-orange-600",
      gradient: "from-orange-500 via-orange-600 to-amber-600",
      hoverGradient: "from-orange-400 to-orange-500",
      shadowColor: "shadow-orange-500/25"
    },
    {
      id: "home-cards",
      label: "بطاقات الرئيسية",
      icon: LayoutDashboard,
      color: "text-pink-600",
      gradient: "from-pink-500 via-pink-600 to-rose-600",
      hoverGradient: "from-pink-400 to-pink-500",
      shadowColor: "shadow-pink-500/25"
    },
    {
      id: "search-bar-settings",
      label: "إعدادات البحث",
      icon: Settings,
      color: "text-sky-600",
      gradient: "from-sky-500 via-sky-600 to-blue-600",
      hoverGradient: "from-sky-400 to-sky-500",
      shadowColor: "shadow-sky-500/25"
    },
    {
      id: "broadcast-notification",
      label: "الإشعارات",
      icon: Bell,
      color: "text-amber-600",
      gradient: "from-amber-500 via-amber-600 to-yellow-600",
      hoverGradient: "from-amber-400 to-amber-500",
      shadowColor: "shadow-amber-500/25"
    },
    {
      id: "system-health",
      label: "حالة النظام",
      icon: MonitorSpeaker,
      color: "text-cyan-600",
      gradient: "from-cyan-500 via-cyan-600 to-blue-600",
      hoverGradient: "from-cyan-400 to-cyan-500",
      shadowColor: "shadow-cyan-500/25",
      badge: "مراقبة"
    },
    {
      id: "settings",
      label: "الإعدادات",
      icon: Settings,
      color: "text-teal-600",
      gradient: "from-teal-500 via-teal-600 to-emerald-600",
      hoverGradient: "from-teal-400 to-teal-500",
      shadowColor: "shadow-teal-500/25"
    },
    {
      id: "profile",
      label: "الملف الشخصي",
      icon: User,
      color: "text-slate-600",
      gradient: "from-slate-500 via-slate-600 to-gray-600",
      hoverGradient: "from-slate-400 to-slate-500",
      shadowColor: "shadow-slate-500/25"
    }
  ];

  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isRTL, setIsRTL] = useState(false);

  const updateScrollButtons = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;

    const items = Array.from(el.querySelectorAll('[data-tab-id]') as NodeListOf<HTMLElement>);
    if (items.length === 0) {
      setCanScrollLeft(false);
      setCanScrollRight(false);
      return;
    }

    const scrollerRect = el.getBoundingClientRect();
    const epsilon = 8;
    const leftHidden = items.some((it) => it.getBoundingClientRect().left < scrollerRect.left + epsilon);
    const rightHidden = items.some((it) => it.getBoundingClientRect().right > scrollerRect.right - epsilon);
    setCanScrollLeft(leftHidden);
    setCanScrollRight(rightHidden);
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    try {
      const docDir = typeof document !== 'undefined' ? document.documentElement.dir : '';
      setIsRTL(docDir === 'rtl' || getComputedStyle(el).direction === 'rtl');
    } catch (err) {
      setIsRTL(false);
    }

    updateScrollButtons();
    const onScroll = () => updateScrollButtons();
    el.addEventListener('scroll', onScroll, { passive: true });

    const ro = new ResizeObserver(updateScrollButtons);
    ro.observe(el);

    return () => {
      el.removeEventListener('scroll', onScroll);
      ro.disconnect();
    };
  }, [updateScrollButtons]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const item = el.querySelector(`[data-tab-id="${activeTab}"]`) as HTMLElement | null;
    if (item) {
      item.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }, [activeTab]);

  const scrollByStep = (dir: 'left' | 'right') => {
    const el = scrollerRef.current;
    if (!el) return;

    const revealed = revealAdjacentHiddenTab(dir);
    if (revealed) return;

    const factor = 0.7;
    const delta = Math.round(el.clientWidth * factor);
    let offset = dir === 'left' ? -delta : delta;
    if (isRTL) offset = -offset;
    el.scrollBy({ left: offset, behavior: 'smooth' });
  };

  const revealAdjacentHiddenTab = (dir: 'left' | 'right') => {
    const el = scrollerRef.current;
    if (!el) return false;

    const items = Array.from(el.querySelectorAll('[data-tab-id]') as NodeListOf<HTMLElement>);
    if (items.length === 0) return false;

    const scrollerRect = el.getBoundingClientRect();
    const dirNorm = isRTL ? (dir === 'left' ? 'right' : 'left') : dir;

    if (dirNorm === 'right') {
      const next = items.find((it) => it.getBoundingClientRect().right > scrollerRect.right + 2);
      if (next) {
        next.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        return true;
      }
    } else {
      const leftCandidates = items.filter((it) => it.getBoundingClientRect().left < scrollerRect.left - 2);
      const prev = leftCandidates.length ? leftCandidates[leftCandidates.length - 1] : null;
      if (prev) {
        prev.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        return true;
      }
    }

    return false;
  };

  return (
    <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 shadow-lg shadow-gray-900/5">
      <div className="container mx-auto px-4">
        <div className="relative">
          {/* Navigation Arrows with Enhanced Styling */}
          <div className="absolute left-0 inset-y-0 z-40 flex items-center pl-3">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => scrollByStep('left')}
              disabled={!canScrollLeft}
              className={cn(
                "pointer-events-auto rounded-full p-2 h-9 w-9 transition-all duration-300",
                "bg-white/60 hover:bg-white/80 shadow-lg shadow-gray-900/10",
                "border border-gray-200/50 backdrop-blur-sm",
                "hover:scale-105 hover:shadow-xl hover:shadow-gray-900/15",
                !canScrollLeft && "opacity-40 cursor-not-allowed"
              )}
              title="التمرير لليسار"
            >
              <ChevronLeft className="h-4 w-4 text-gray-600" />
            </Button>
          </div>

          {/* Enhanced Scroller */}
          <div
            ref={scrollerRef}
            className="overflow-x-auto overflow-y-hidden scrollbar-hide touch-action-pan-y overscroll-x-contain"
          >
            <div className="flex gap-1 py-3 min-w-max pl-12 pr-12 sm:pl-14 sm:pr-14">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <div
                    key={tab.id}
                    data-tab-id={tab.id}
                    className="flex-shrink-0"
                  >
                    <Button
                      onClick={() => onTabChange(tab.id)}
                      className={cn(
                        "relative group transition-all duration-500 ease-out",
                        "px-4 py-3 h-auto min-h-[48px] rounded-xl font-semibold text-sm",
                        "border border-transparent backdrop-blur-sm",
                        "hover:scale-[1.02] hover:-translate-y-0.5",
                        "focus:outline-none focus:ring-2 focus:ring-offset-2",
                        isActive
                          ? cn(
                              `bg-gradient-to-r ${tab.gradient} text-white`,
                              `shadow-xl ${tab.shadowColor}`,
                              "ring-2 ring-white/20",
                              "transform scale-[1.02] -translate-y-0.5"
                            )
                          : cn(
                              "bg-white/40 hover:bg-white/60 text-gray-700 hover:text-gray-900",
                              "shadow-md hover:shadow-lg hover:shadow-gray-900/10",
                              "border-gray-200/50 hover:border-gray-300/50",
                              `hover:bg-gradient-to-r hover:${tab.hoverGradient} hover:text-white`,
                              "focus:ring-gray-300"
                            )
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={cn(
                          "transition-all duration-300",
                          isActive
                            ? "h-5 w-5 text-white drop-shadow-sm"
                            : "h-5 w-5 text-current group-hover:scale-110"
                        )} />
                        <span className="whitespace-nowrap font-medium tracking-wide">
                          {tab.label}
                        </span>
                        {tab.badge && (
                          <Badge
                            variant={isActive ? "secondary" : "outline"}
                            className={cn(
                              "text-xs px-2 py-0.5 font-medium transition-all duration-300",
                              isActive
                                ? "bg-white/20 text-white border-white/30 shadow-sm"
                                : "bg-gray-100/80 text-gray-600 border-gray-200/50 hover:bg-gray-200/80"
                            )}
                          >
                            {tab.badge}
                          </Badge>
                        )}
                      </div>

                      {/* Active Indicator */}
                      {isActive && (
                        <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
                          <div className="w-6 h-1 bg-white rounded-full shadow-sm animate-pulse" />
                        </div>
                      )}

                      {/* Hover Glow Effect */}
                      <div className={cn(
                        "absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300",
                        `bg-gradient-to-r ${tab.gradient}`,
                        "group-hover:opacity-10 pointer-events-none"
                      )} />
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Navigation Arrow */}
          <div className="absolute right-0 inset-y-0 z-40 flex items-center pr-3">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => scrollByStep('right')}
              disabled={!canScrollRight}
              className={cn(
                "pointer-events-auto rounded-full p-2 h-9 w-9 transition-all duration-300",
                "bg-white/60 hover:bg-white/80 shadow-lg shadow-gray-900/10",
                "border border-gray-200/50 backdrop-blur-sm",
                "hover:scale-105 hover:shadow-xl hover:shadow-gray-900/15",
                !canScrollRight && "opacity-40 cursor-not-allowed"
              )}
              title="التمرير لليمين"
            >
              <ChevronRight className="h-4 w-4 text-gray-600" />
            </Button>
          </div>

          {/* Gradient Fades */}
          {canScrollLeft && (
            <div className="absolute left-0 top-0 bottom-0 w-12 z-30 bg-gradient-to-r from-white via-white/80 to-transparent pointer-events-none" />
          )}
          {canScrollRight && (
            <div className="absolute right-0 top-0 bottom-0 w-12 z-30 bg-gradient-to-l from-white via-white/80 to-transparent pointer-events-none" />
          )}
        </div>
      </div>

      {/* Enhanced Scrollbar Styles */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .touch-action-pan-y {
          touch-action: pan-y;
          -webkit-overflow-scrolling: touch;
        }
      `}</style>
    </div>
  );
};
