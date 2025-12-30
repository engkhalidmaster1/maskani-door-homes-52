import React from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Users, 
  Building2, 
  User, 
  Home, 
  X, 
  MessageSquare, 
  Settings, 
  Shield, 
  Bell,
  LayoutDashboard,
  ChevronLeft,
  ChevronRight,
  Activity,
  UsersRound
} from "lucide-react";

interface DashboardSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isOpen: boolean;
  onClose: () => void;
  onToggle: () => void;
}

export const DashboardSidebar = ({ activeTab, onTabChange, isOpen, onClose, onToggle }: DashboardSidebarProps) => {
  const sidebarSections = [
    {
      title: "الرئيسية",
      items: [
        { 
          id: "overview", 
          label: "نظرة عامة", 
          icon: LayoutDashboard,
          color: "text-blue-600",
          bgColor: "bg-blue-50",
          description: "إحصائيات ونظرة شاملة"
        },
      ]
    },
    {
      title: "إدارة المحتوى",
      items: [
        { 
          id: "properties", 
          label: "العقارات", 
          icon: Building2,
          color: "text-emerald-600",
          bgColor: "bg-emerald-50",
          badge: "الكل",
          description: "إدارة جميع العقارات"
        },
        { 
          id: "banner-settings", 
          label: "الشريط الإعلاني", 
          icon: MessageSquare,
          color: "text-purple-600",
          bgColor: "bg-purple-50",
          description: "تخصيص الشريط العلوي"
        },
        { 
          id: "floating-button", 
          label: "الزر العائم", 
          icon: Activity,
          color: "text-orange-600",
          bgColor: "bg-orange-50",
          description: "إدارة الزر العائم"
        },
      ]
    },
    {
      title: "المستخدمين",
      items: [
        { 
          id: "users-view", 
          label: "قائمة المستخدمين", 
          icon: UsersRound,
          color: "text-sky-600",
          bgColor: "bg-sky-50",
          description: "عرض بيانات المستخدمين"
        },
      ]
    },
    {
      title: "إدارة المستخدمين",
      items: [
        { 
          id: "users", 
          label: "المستخدمون", 
          icon: Users,
          color: "text-indigo-600",
          bgColor: "bg-indigo-50",
          badge: "جديد",
          description: "عرض وإدارة المستخدمين"
        },
        { 
          id: "user-roles", 
          label: "الصلاحيات", 
          icon: Shield,
          color: "text-red-600",
          bgColor: "bg-red-50",
          description: "تحديد الأدوار والصلاحيات"
        },
        {
          id: "settings",
          label: "الإعدادات",
          icon: Settings,
          color: "text-violet-600",
          bgColor: "bg-violet-50",
          description: "إعدادات النظام العامة"
        },
        // التوثيق أُزيل من الشريط الجانبي — الإشعارات تُعرض بدلاً منه
      ]
    },
    {
      title: "المشتركين",
      items: [
        {
          id: "subscribers",
          label: "المشتركين",
          icon: Users,
          color: "text-green-600",
          bgColor: "bg-green-50",
          badge: "جديد",
          description: "عرض جميع المشتركين"
        },
      ]
    },
    {
      title: "الإشعارات والملف",
      items: [
        { 
          id: "broadcast-notification", 
          label: "إرسال إشعار", 
          icon: Bell,
          color: "text-amber-600",
          bgColor: "bg-amber-50",
          description: "إشعار لجميع المستخدمين"
        },
        { 
          id: "profile", 
          label: "الملف الشخصي", 
          icon: User,
          color: "text-slate-600",
          bgColor: "bg-slate-50",
          description: "معلوماتك الشخصية"
        },
      ]
    }
  ];

  return (
    <>
      {/* Toggle Button - يظهر دائماً */}
      <Button
        variant="default"
        size="icon"
        className={`
          fixed top-20 z-50 shadow-lg transition-all duration-300
          ${isOpen ? 'right-[336px]' : 'right-4'}
        `}
        onClick={onToggle}
        title={isOpen ? "إخفاء القائمة" : "إظهار القائمة"}
      >
        {isOpen ? (
          <ChevronRight className="h-5 w-5" />
        ) : (
          <ChevronLeft className="h-5 w-5" />
        )}
      </Button>

      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 transition-opacity duration-300"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed right-0 top-16 h-[calc(100vh-64px)] w-80 bg-background border-l shadow-2xl z-40 transform transition-all duration-300
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-primary via-primary/90 to-primary/80 text-primary-foreground p-6 shadow-lg z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <LayoutDashboard className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">لوحة التحكم</h2>
                <p className="text-xs text-primary-foreground/80">مسكني - إدارة متقدمة</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-primary-foreground hover:bg-white/20"
              onClick={onToggle}
              title="إخفاء القائمة"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <div className="h-[calc(100vh-100px)] overflow-y-auto px-4 py-6 space-y-6 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
          {sidebarSections.map((section, sectionIndex) => (
            <div key={sectionIndex} className="space-y-2">
              {/* Section Title */}
              <div className="flex items-center gap-2 px-3 mb-3">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  {section.title}
                </h3>
                <Separator className="flex-1" />
              </div>

              {/* Section Items */}
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  
                  return (
                    <Button
                      key={item.id}
                      variant="ghost"
                      className={`
                        w-full justify-start gap-3 text-right h-auto py-3 px-3 transition-all duration-200
                        ${isActive 
                          ? `${item.bgColor} ${item.color} shadow-md border border-current/20 hover:${item.bgColor}` 
                          : 'hover:bg-muted/50 text-muted-foreground hover:text-foreground'
                        }
                      `}
                      onClick={() => {
                        onTabChange(item.id);
                        onClose();
                      }}
                    >
                      <div className={`
                        p-2 rounded-lg transition-all duration-200
                        ${isActive 
                          ? `${item.bgColor} ${item.color}` 
                          : 'bg-muted/30'
                        }
                      `}>
                        <Icon className="h-5 w-5" />
                      </div>
                      
                      <div className="flex-1 text-right">
                        <div className="flex items-center justify-between">
                          <span className={`font-medium text-sm ${isActive ? 'font-bold' : ''}`}>
                            {item.label}
                          </span>
                          {item.badge && (
                            <Badge 
                              variant={isActive ? "default" : "secondary"} 
                              className={`text-xs px-2 py-0 ${isActive ? item.color : ''}`}
                            >
                              {item.badge}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {item.description}
                        </p>
                      </div>

                      {isActive && (
                        <ChevronLeft className={`h-4 w-4 ${item.color}`} />
                      )}
                    </Button>
                  );
                })}
              </div>

              {/* Separator between sections except last */}
              {sectionIndex < sidebarSections.length - 1 && (
                <Separator className="my-4" />
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              © 2025 مسكني • نظام إدارة متقدم
            </p>
          </div>
        </div>
      </div>
    </>
  );
};