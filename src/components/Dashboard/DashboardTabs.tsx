import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  UserCog
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
      gradient: "from-blue-600 to-indigo-600"
    },
    {
      id: "properties",
      label: "العقارات",
      icon: Building2,
      color: "text-emerald-600",
      gradient: "from-emerald-600 to-teal-600",
      badge: "الكل"
    },
    {
      id: "users-view",
      label: "المستخدمون",
      icon: UsersRound,
      color: "text-sky-600",
      gradient: "from-sky-600 to-blue-600"
    },
    {
      id: "admin-users",
      label: "إدارة المستخدمين",
      icon: UserCog,
      color: "text-indigo-600",
      gradient: "from-indigo-600 to-purple-600",
      badge: "جديد"
    },
    {
      id: "user-roles",
      label: "الصلاحيات",
      icon: Shield,
      color: "text-red-600",
      gradient: "from-red-600 to-rose-600"
    },
    {
      id: "banner-settings",
      label: "الشريط الإعلاني",
      icon: MessageSquare,
      color: "text-purple-600",
      gradient: "from-purple-600 to-pink-600"
    },
    {
      id: "floating-button",
      label: "الزر العائم",
      icon: Activity,
      color: "text-orange-600",
      gradient: "from-orange-600 to-amber-600"
    },
    {
      id: "verification-settings",
      label: "التوثيق",
      icon: Settings,
      color: "text-cyan-600",
      gradient: "from-cyan-600 to-blue-600"
    },
    {
      id: "broadcast-notification",
      label: "الإشعارات",
      icon: Bell,
      color: "text-amber-600",
      gradient: "from-amber-600 to-yellow-600"
    },
    {
      id: "profile",
      label: "الملف الشخصي",
      icon: User,
      color: "text-slate-600",
      gradient: "from-slate-600 to-gray-600"
    }
  ];

  return (
    <div className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-4">
        {/* Tabs Navigation */}
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex gap-2 py-3 min-w-max">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <Button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  variant={isActive ? "default" : "ghost"}
                  className={`
                    relative group transition-all duration-300
                    ${isActive 
                      ? `bg-gradient-to-r ${tab.gradient} text-white shadow-lg hover:shadow-xl` 
                      : `hover:bg-gray-100 ${tab.color}`
                    }
                    px-4 py-2 h-auto min-h-[44px]
                  `}
                >
                  <div className="flex items-center gap-2">
                    <Icon className={`h-5 w-5 ${isActive ? 'text-white' : ''}`} />
                    <span className="font-medium whitespace-nowrap">{tab.label}</span>
                    {tab.badge && (
                      <Badge 
                        variant={isActive ? "secondary" : "outline"}
                        className={`
                          text-xs px-2 py-0.5
                          ${isActive ? 'bg-white/20 text-white border-white/30' : ''}
                        `}
                      >
                        {tab.badge}
                      </Badge>
                    )}
                  </div>
                  
                  {/* Active Indicator */}
                  {isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-white rounded-t-full" />
                  )}
                </Button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Custom Scrollbar Styles */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};
