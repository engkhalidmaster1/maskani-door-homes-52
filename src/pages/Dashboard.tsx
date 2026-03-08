import React, { useState, useMemo } from 'react';
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
import { useUserStatus } from "@/hooks/useUserStatus";
import { UserRolesManagement } from "@/components/Dashboard/UserRolesManagement";
import { BroadcastNotification } from "@/components/Dashboard/BroadcastNotification";
import { SystemHealthTab } from "@/components/Dashboard/SystemHealthTab";
import { UsersTable } from "@/components/Dashboard/UsersTable";
import { FloatingButtonManagement } from "@/components/Dashboard/FloatingButtonManagement";
import { HomeCardsManagement } from "@/components/Dashboard/HomeCardsManagement";
import { SearchBarSettings } from "@/components/Dashboard/SearchBarSettings";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DashboardProps {
  onPageChange?: (page: string) => void;
  onEditProperty?: (propertyId: string) => void;
}

export const Dashboard = ({ onPageChange, onEditProperty }: DashboardProps) => {
  // === Hooks first ===
  const { isAdmin } = useAuth();
  const { logPropertyAction, logUserAction } = useAuditLog();
  const {
    users,
    userProperties,
    isLoading,
    deleteUser,
    updateUserRole,
    banUserFromPublishing,
    unbanUserFromPublishing,
    getUserProfile,
    getUserProperties,
    getDashboardStats
  } = useDashboardData();
  const { togglePropertyPublication, deleteProperty } = useProperties();
  const { allUsersWithStatus, fetchAllUsersWithStatus } = useUserStatus();
  const { selectedTab, setTab } = useDashboardNav();

  const [optimisticPublication, setOptimisticPublication] = useState<Record<string, boolean>>({});

  // AlertDialog state for confirmations
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    variant?: 'destructive' | 'default';
    onConfirm: () => void;
  }>({ open: false, title: '', description: '', onConfirm: () => {} });

  const showConfirm = (title: string, description: string, onConfirm: () => void, variant: 'destructive' | 'default' = 'destructive') => {
    setConfirmDialog({ open: true, title, description, variant, onConfirm });
  };

  const stats = useMemo(() => getDashboardStats(), [getDashboardStats]);

  const handleTabChange = (tabId: string) => {
    setTab(tabId as DashboardTabId);
  };

  // === Handlers (after hooks) ===
  const handleBulkPublish = async () => {
    try {
      const unpublished = userProperties.filter(p => !p.is_published);
      for (const prop of unpublished) {
        await togglePropertyPublication(prop.id, prop.is_published);
        await logPropertyAction('update', prop.id, {
          property_title: prop.title, bulk_action: true, admin_action: true, new_status: 'published'
        });
      }
      toast({ title: "تم نشر جميع العقارات غير المنشورة", description: `تم نشر ${unpublished.length} عقار` });
    } catch {
      toast({ title: "خطأ", description: "حدث خطأ أثناء النشر المجمع", variant: "destructive" });
    }
  };

  const handleBulkUnpublish = async () => {
    try {
      const published = userProperties.filter(p => p.is_published);
      for (const prop of published) {
        await togglePropertyPublication(prop.id, prop.is_published);
        await logPropertyAction('update', prop.id, {
          property_title: prop.title, bulk_action: true, admin_action: true, new_status: 'unpublished'
        });
      }
      toast({ title: "تم إخفاء جميع العقارات المنشورة", description: `تم إخفاء ${published.length} عقار` });
    } catch {
      toast({ title: "خطأ", description: "حدث خطأ أثناء الإخفاء المجمع", variant: "destructive" });
    }
  };

  const handleBulkDelete = () => {
    showConfirm(
      "حذف جميع العقارات",
      "هل أنت متأكد من حذف جميع العقارات؟ لا يمكن التراجع عن هذا الإجراء.",
      async () => {
        try {
          for (const prop of userProperties) {
            await deleteProperty(prop.id);
            await logPropertyAction('delete', prop.id, {
              property_title: prop.title, bulk_action: true, admin_action: true
            });
          }
          toast({ title: "تم حذف جميع العقارات", description: `تم حذف ${userProperties.length} عقار`, variant: "destructive" });
        } catch {
          toast({ title: "خطأ", description: "حدث خطأ أثناء الحذف المجمع", variant: "destructive" });
        }
      }
    );
  };

  const handleTogglePublication = async (propertyId: string, currentStatus: boolean) => {
    setOptimisticPublication(prev => ({ ...prev, [propertyId]: !currentStatus }));
    try {
      await togglePropertyPublication(propertyId, currentStatus);
      await logPropertyAction('update', propertyId, {
        previous_status: currentStatus ? 'published' : 'unpublished',
        new_status: currentStatus ? 'unpublished' : 'published',
        admin_action: true
      });
      toast({
        title: currentStatus ? "تم إخفاء العقار" : "تم نشر العقار",
        description: currentStatus ? "العقار غير مرئي للعملاء الآن" : "العقار مرئي للعملاء الآن",
      });
      setOptimisticPublication(prev => { const c = { ...prev }; delete c[propertyId]; return c; });
    } catch (error) {
      setOptimisticPublication(prev => { const c = { ...prev }; delete c[propertyId]; return c; });
      console.error('Error toggling property publication:', error);
      toast({ title: "خطأ", description: "حدث خطأ أثناء تحديث حالة النشر", variant: "destructive" });
    }
  };

  const handleDeleteProperty = (propertyId: string) => {
    showConfirm(
      "حذف العقار",
      "هل أنت متأكد من حذف هذا العقار؟ لا يمكن التراجع عن هذا الإجراء.",
      async () => {
        try {
          const property = userProperties.find(p => p.id === propertyId);
          await deleteProperty(propertyId);
          await logPropertyAction('delete', propertyId, {
            property_title: property?.title, property_owner: property?.owner_name, admin_action: true
          });
          toast({ title: "تم حذف العقار", description: "تم حذف العقار بنجاح", variant: "destructive" });
        } catch (error) {
          console.error('Error deleting property:', error);
          toast({ title: "خطأ", description: "حدث خطأ أثناء حذف العقار", variant: "destructive" });
        }
      }
    );
  };

  const handleDeleteUser = (userId: string) => {
    showConfirm(
      "حذف المستخدم",
      "هل أنت متأكد من حذف هذا المستخدم؟ سيتم حذف جميع عقاراته أيضاً.",
      async () => {
        try {
          const user = users.find(u => u.id === userId);
          await deleteUser(userId);
          await logUserAction('delete', userId, {
            user_email: user?.email, user_role: user?.role, properties_count: user?.properties_count, admin_action: true
          });
          toast({ title: "تم حذف المستخدم", description: "تم حذف المستخدم وجميع عقاراته بنجاح", variant: "destructive" });
        } catch (error) {
          console.error('Error deleting user:', error);
          toast({ title: "خطأ", description: "حدث خطأ أثناء حذف المستخدم", variant: "destructive" });
        }
      }
    );
  };

  // === Guards ===
  if (!isAdmin) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-destructive">ليس لديك صلاحية للوصول إلى لوحة التحكم</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p>جاري تحميل البيانات...</p>
          </div>
        </div>
      </div>
    );
  }

  // === Tab content ===
  const publishRate = stats.totalProperties > 0
    ? Math.round((stats.publishedProperties / stats.totalProperties) * 100)
    : 0;

  const renderTabContent = () => {
    switch (selectedTab) {
      case "overview":
        return renderOverviewTab();
      case "properties":
        return renderPropertiesTab();
      case "edit-properties":
        return <EditPropertiesTab />;
      case "banner-settings":
        return <BannerSettingsTab />;
      case "settings":
        return <SettingsTab />;
      case "floating-button":
        return <FloatingButtonManagement />;
      case "home-cards":
        return <HomeCardsManagement />;
      case "search-bar-settings":
        return <SearchBarSettings />;
      case "users":
        return (
          <UsersTable
            users={users}
            allUsersWithStatus={allUsersWithStatus}
            onDeleteUser={handleDeleteUser}
            onUpdateRole={updateUserRole}
            onBanUser={banUserFromPublishing}
            onUnbanUser={unbanUserFromPublishing}
            getUserProfile={getUserProfile}
            getUserProperties={getUserProperties}
            onStatusUpdate={fetchAllUsersWithStatus}
          />
        );
      case "user-roles":
        return <UserRolesManagement />;
      case "broadcast-notification":
        return <BroadcastNotification />;
      case "system-health":
        return <SystemHealthTab />;
      case "profile":
        return <Profile />;
      default:
        return renderOverviewTab();
    }
  };

  const renderOverviewTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المستخدمين</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">مستخدم مسجل</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي العقارات</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProperties}</div>
            <p className="text-xs text-muted-foreground">عقار في النظام</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">العقارات المنشورة</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.publishedProperties}</div>
            <p className="text-xs text-muted-foreground">عقار مرئي للعملاء</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">نسبة النشر</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{publishRate}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalProperties - stats.publishedProperties} عقار مخفي
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>آخر العقارات المضافة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {userProperties.slice(0, 5).map((property) => (
              <div key={property.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <h3 className="font-medium">{property.title}</h3>
                  <p className="text-sm text-muted-foreground">{property.location}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={property.is_published ? "default" : "secondary"}>
                    {property.is_published ? "منشور" : "مخفي"}
                  </Badge>
                  <span className="text-lg font-bold">{property.price.toLocaleString()} د.ع</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Unified properties tab (merged properties + properties-management)
  const renderPropertiesTab = () => (
    <Card>
      <CardHeader>
        <CardTitle>إدارة العقارات</CardTitle>
        <p className="text-sm text-muted-foreground">عرض وإدارة جميع العقارات في النظام</p>
        {isAdmin && (
          <div className="flex flex-wrap gap-2 mt-4">
            <Button size="sm" onClick={handleBulkPublish}>نشر الكل</Button>
            <Button size="sm" variant="outline" onClick={handleBulkUnpublish}>إخفاء الكل</Button>
            <Button variant="destructive" size="sm" onClick={handleBulkDelete}>حذف الكل</Button>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>العنوان</TableHead>
                <TableHead>المالك</TableHead>
                <TableHead>السعر</TableHead>
                <TableHead>الموقع</TableHead>
                <TableHead>النوع</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {userProperties.map((property) => {
                const optimistic = optimisticPublication[property.id];
                const isPublished = typeof optimistic === 'boolean' ? optimistic : property.is_published;
                return (
                  <TableRow key={property.id}>
                    <TableCell className="font-medium">{property.title}</TableCell>
                    <TableCell>{property.owner_name || "غير محدد"}</TableCell>
                    <TableCell>{property.price.toLocaleString()} د.ع</TableCell>
                    <TableCell>{property.location}</TableCell>
                    <TableCell>{property.property_type}</TableCell>
                    <TableCell>
                      <Badge variant={isPublished ? "default" : "secondary"}>
                        {isPublished ? "منشور" : "مخفي"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleTogglePublication(property.id, isPublished)}>
                          {isPublished ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDeleteProperty(property.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
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
      <Helmet>
        <title>لوحة التحكم - سكني</title>
        <meta name="description" content="لوحة تحكم المستخدم لإدارة العقارات والحساب الشخصي في تطبيق سكني" />
      </Helmet>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <DashboardTabs activeTab={selectedTab} onTabChange={handleTabChange} />
        <div className="container mx-auto px-4 py-6">
          {renderTabContent()}
        </div>
      </div>

      {/* Confirmation AlertDialog */}
      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmDialog.title}</AlertDialogTitle>
            <AlertDialogDescription>{confirmDialog.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              className={confirmDialog.variant === 'destructive' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}
              onClick={() => {
                confirmDialog.onConfirm();
                setConfirmDialog(prev => ({ ...prev, open: false }));
              }}
            >
              تأكيد
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default Dashboard;
