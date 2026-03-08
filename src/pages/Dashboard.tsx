import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useProperties } from "@/hooks/useProperties";
import { useAuth } from "@/hooks/useAuth";
import { useAuditLog } from "@/hooks/useAuditLog";
import { useDashboardData } from "@/hooks/useDashboardData";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Building2, Eye, EyeOff, Trash2, TrendingUp } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { DashboardTabs } from "@/components/Dashboard/DashboardTabs";
import { useDashboardNav } from '@/hooks/useDashboardNav';
import type { DashboardTabId } from '@/hooks/useDashboardNav';
import { EditPropertiesTab } from "@/components/Dashboard/EditPropertiesTab";
import { BannerSettingsTab } from "@/components/Dashboard/BannerSettingsTab";
import SettingsTab from "@/components/Dashboard/SettingsTab";
import { Profile } from "@/pages/Profile";
import { Helmet } from 'react-helmet-async';
import { BroadcastNotification } from "@/components/Dashboard/BroadcastNotification";
import { SystemHealthTab } from "@/components/Dashboard/SystemHealthTab";
import { FloatingButtonManagement } from "@/components/Dashboard/FloatingButtonManagement";
import { HomeCardsManagement } from "@/components/Dashboard/HomeCardsManagement";
import { SearchBarSettings } from "@/components/Dashboard/SearchBarSettings";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DashboardProps {
  onPageChange?: (page: string) => void;
  onEditProperty?: (propertyId: string) => void;
}

export const Dashboard = ({ onPageChange, onEditProperty }: DashboardProps) => {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { logPropertyAction } = useAuditLog();
  const { userProperties, isLoading, getDashboardStats } = useDashboardData();
  const { togglePropertyPublication, deleteProperty } = useProperties();
  const { selectedTab, setTab } = useDashboardNav();

  const [optimisticPublication, setOptimisticPublication] = useState<Record<string, boolean>>({});
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean; title: string; description: string; variant?: 'destructive' | 'default'; onConfirm: () => void;
  }>({ open: false, title: '', description: '', onConfirm: () => {} });

  const showConfirm = (title: string, description: string, onConfirm: () => void, variant: 'destructive' | 'default' = 'destructive') => {
    setConfirmDialog({ open: true, title, description, variant, onConfirm });
  };

  const stats = useMemo(() => getDashboardStats(), [getDashboardStats]);

  const handleTabChange = (tabId: string) => {
    // Redirect users tab to standalone page
    if (tabId === 'users') {
      navigate('/admin/users');
      return;
    }
    setTab(tabId as DashboardTabId);
  };

  // === Handlers ===
  const handleBulkPublish = async () => {
    try {
      const unpublished = userProperties.filter(p => !p.is_published);
      for (const prop of unpublished) {
        await togglePropertyPublication(prop.id, prop.is_published);
      }
      toast({ title: "تم نشر جميع العقارات", description: `تم نشر ${unpublished.length} عقار` });
    } catch { toast({ title: "خطأ", description: "حدث خطأ أثناء النشر المجمع", variant: "destructive" }); }
  };

  const handleBulkUnpublish = async () => {
    try {
      const published = userProperties.filter(p => p.is_published);
      for (const prop of published) {
        await togglePropertyPublication(prop.id, prop.is_published);
      }
      toast({ title: "تم إخفاء جميع العقارات", description: `تم إخفاء ${published.length} عقار` });
    } catch { toast({ title: "خطأ", description: "حدث خطأ أثناء الإخفاء المجمع", variant: "destructive" }); }
  };

  const handleBulkDelete = () => {
    showConfirm("حذف جميع العقارات", "هل أنت متأكد؟ لا يمكن التراجع.", async () => {
      try {
        for (const prop of userProperties) { await deleteProperty(prop.id); }
        toast({ title: "تم حذف جميع العقارات", variant: "destructive" });
      } catch { toast({ title: "خطأ", variant: "destructive" }); }
    });
  };

  const handleTogglePublication = async (propertyId: string, currentStatus: boolean) => {
    setOptimisticPublication(prev => ({ ...prev, [propertyId]: !currentStatus }));
    try {
      await togglePropertyPublication(propertyId, currentStatus);
      toast({ title: currentStatus ? "تم إخفاء العقار" : "تم نشر العقار" });
      setOptimisticPublication(prev => { const c = { ...prev }; delete c[propertyId]; return c; });
    } catch {
      setOptimisticPublication(prev => { const c = { ...prev }; delete c[propertyId]; return c; });
      toast({ title: "خطأ", variant: "destructive" });
    }
  };

  const handleDeleteProperty = (propertyId: string) => {
    showConfirm("حذف العقار", "هل أنت متأكد؟", async () => {
      try {
        await deleteProperty(propertyId);
        toast({ title: "تم حذف العقار", variant: "destructive" });
      } catch { toast({ title: "خطأ", variant: "destructive" }); }
    });
  };

  if (!isAdmin) {
    return <div className="container mx-auto p-6"><Card><CardContent className="p-6"><p className="text-destructive">ليس لديك صلاحية</p></CardContent></Card></div>;
  }

  if (isLoading) {
    return <div className="container mx-auto p-6"><div className="flex items-center justify-center min-h-[400px]"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div></div></div>;
  }

  const publishRate = stats.totalProperties > 0 ? Math.round((stats.publishedProperties / stats.totalProperties) * 100) : 0;

  const renderTabContent = () => {
    switch (selectedTab) {
      case "overview": return renderOverviewTab();
      case "properties": return renderPropertiesTab();
      case "edit-properties": return <EditPropertiesTab />;
      case "banner-settings": return <BannerSettingsTab />;
      case "settings": return <SettingsTab />;
      case "floating-button": return <FloatingButtonManagement />;
      case "home-cards": return <HomeCardsManagement />;
      case "search-bar-settings": return <SearchBarSettings />;
      case "broadcast-notification": return <BroadcastNotification />;
      case "system-health": return <SystemHealthTab />;
      case "profile": return <Profile />;
      default: return renderOverviewTab();
    }
  };

  const renderOverviewTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">إجمالي المستخدمين</CardTitle><Users className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{stats.totalUsers}</div><p className="text-xs text-muted-foreground">مستخدم مسجل</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">إجمالي العقارات</CardTitle><Building2 className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{stats.totalProperties}</div><p className="text-xs text-muted-foreground">عقار في النظام</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">العقارات المنشورة</CardTitle><Eye className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{stats.publishedProperties}</div><p className="text-xs text-muted-foreground">عقار مرئي</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">نسبة النشر</CardTitle><TrendingUp className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{publishRate}%</div><p className="text-xs text-muted-foreground">{stats.totalProperties - stats.publishedProperties} مخفي</p></CardContent></Card>
      </div>
      <Card><CardHeader><CardTitle>آخر العقارات</CardTitle></CardHeader><CardContent><div className="space-y-4">{userProperties.slice(0, 5).map(p => (
        <div key={p.id} className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex-1"><h3 className="font-medium">{p.title}</h3><p className="text-sm text-muted-foreground">{p.location}</p></div>
          <div className="flex items-center gap-2"><Badge variant={p.is_published ? "default" : "secondary"}>{p.is_published ? "منشور" : "مخفي"}</Badge><span className="text-lg font-bold">{p.price.toLocaleString()} د.ع</span></div>
        </div>
      ))}</div></CardContent></Card>
    </div>
  );

  const renderPropertiesTab = () => (
    <Card>
      <CardHeader>
        <CardTitle>إدارة العقارات</CardTitle>
        <div className="flex flex-wrap gap-2 mt-4">
          <Button size="sm" onClick={handleBulkPublish}>نشر الكل</Button>
          <Button size="sm" variant="outline" onClick={handleBulkUnpublish}>إخفاء الكل</Button>
          <Button variant="destructive" size="sm" onClick={handleBulkDelete}>حذف الكل</Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader><TableRow><TableHead>العنوان</TableHead><TableHead>المالك</TableHead><TableHead>السعر</TableHead><TableHead>الموقع</TableHead><TableHead>النوع</TableHead><TableHead>الحالة</TableHead><TableHead>الإجراءات</TableHead></TableRow></TableHeader>
            <TableBody>
              {userProperties.map(property => {
                const opt = optimisticPublication[property.id];
                const isPublished = typeof opt === 'boolean' ? opt : property.is_published;
                return (
                  <TableRow key={property.id}>
                    <TableCell className="font-medium">{property.title}</TableCell>
                    <TableCell>{property.owner_name || "غير محدد"}</TableCell>
                    <TableCell>{property.price.toLocaleString()} د.ع</TableCell>
                    <TableCell>{property.location}</TableCell>
                    <TableCell>{property.property_type}</TableCell>
                    <TableCell><Badge variant={isPublished ? "default" : "secondary"}>{isPublished ? "منشور" : "مخفي"}</Badge></TableCell>
                    <TableCell><div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleTogglePublication(property.id, isPublished)}>{isPublished ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDeleteProperty(property.id)}><Trash2 className="w-4 h-4" /></Button>
                    </div></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <>
      <Helmet><title>لوحة التحكم - سكني</title></Helmet>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <DashboardTabs activeTab={selectedTab} onTabChange={handleTabChange} />
        <div className="container mx-auto px-4 py-6">{renderTabContent()}</div>
      </div>
      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>{confirmDialog.title}</AlertDialogTitle><AlertDialogDescription>{confirmDialog.description}</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction className={confirmDialog.variant === 'destructive' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''} onClick={() => { confirmDialog.onConfirm(); setConfirmDialog(prev => ({ ...prev, open: false })); }}>تأكيد</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default Dashboard;
