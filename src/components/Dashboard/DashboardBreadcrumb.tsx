import React from 'react';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Home, Settings } from "lucide-react";

interface DashboardBreadcrumbProps {
  activeTab: string;
  onNavigate: (page: string) => void;
}

export const DashboardBreadcrumb = ({ activeTab, onNavigate }: DashboardBreadcrumbProps) => {
  const getTabLabel = (tab: string) => {
    switch (tab) {
      case "overview": return "نظرة عامة";
      case "properties": return "العقارات";
      case "edit-properties": return "تعديل العقارات";
      case "users": return "إدارة المستخدمين";
      case "profile": return "الملف الشخصي";
      default: return "لوحة التحكم";
    }
  };

  return (
    <Breadcrumb className="mb-6">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink 
            onClick={() => onNavigate("home")}
            className="flex items-center gap-2 cursor-pointer hover:text-primary"
          >
            <Home className="h-4 w-4" />
            الرئيسية
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink 
            onClick={() => onNavigate("dashboard")}
            className="flex items-center gap-2 cursor-pointer hover:text-primary"
          >
            <Settings className="h-4 w-4" />
            لوحة التحكم
          </BreadcrumbLink>
        </BreadcrumbItem>
        {activeTab !== "overview" && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{getTabLabel(activeTab)}</BreadcrumbPage>
            </BreadcrumbItem>
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
};