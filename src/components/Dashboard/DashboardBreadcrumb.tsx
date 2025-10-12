import React from 'react';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Home, Settings } from "lucide-react";
import { Link } from "react-router-dom";

interface DashboardBreadcrumbProps {
  activeTab: string;
  onNavigate: (page: string) => void;
}

export const DashboardBreadcrumb = ({ activeTab, onNavigate }: DashboardBreadcrumbProps) => {
  const getTabLabel = (tab: string) => {
    switch (tab) {
      case "overview": return "نظرة عامة";
      case "properties": return "العقارات";
      case "banner-settings": return "إدارة الشريط";
      case "users": return "إدارة المستخدمين";
      case "profile": return "الملف الشخصي";
      default: return "لوحة التحكم";
    }
  };

  return (
    <Breadcrumb className="mb-6">
              <BreadcrumbList>
          <BreadcrumbItem>
            <Link to="/" className="flex items-center gap-2 cursor-pointer hover:text-primary">
              <Home className="h-4 w-4" />
              الرئيسية
            </Link>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <button
              onClick={() => onNavigate('overview')}
              className="flex items-center gap-2 cursor-pointer hover:text-primary"
            >
              <Settings className="h-4 w-4" />
              لوحة التحكم
            </button>
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