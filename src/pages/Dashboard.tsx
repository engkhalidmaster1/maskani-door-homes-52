import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useProperties } from "@/hooks/useProperties";
import { useAuth } from "@/hooks/useAuth";
import { useAuditLog } from "@/hooks/useAuditLog";
import { useDashboardData } from "@/hooks/useDashboardData";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Building2, Eye, EyeOff, Trash2, TrendingUp, Activity } from "lucide-react";
import AdminUserControls from "@/components/Dashboard/AdminUserControls";
import { toast } from "@/hooks/use-toast";
import { DashboardTabs } from "@/components/Dashboard/DashboardTabs";
import { useNavigate, useParams } from 'react-router-dom';
import { useDashboardNav } from '@/hooks/useDashboardNav';
import type { DashboardTabId } from '@/hooks/useDashboardNav';
import { EditPropertiesTab } from "@/components/Dashboard/EditPropertiesTab";
import { BannerSettingsTab } from "@/components/Dashboard/BannerSettingsTab";
import SettingsTab from "@/components/Dashboard/SettingsTab";
import { Profile } from "@/pages/Profile";
import { Helmet } from 'react-helmet-async';
import { UserActions } from "@/components/Dashboard/UserActions";
import { UserStatusControl } from "@/components/Dashboard/UserStatusControl";
import { useUserStatus } from "@/hooks/useUserStatus";
import { UserRolesManagement } from "@/components/Dashboard/UserRolesManagement";
import { BroadcastNotification } from "@/components/Dashboard/BroadcastNotification";
import { SystemHealthTab } from "@/components/Dashboard/SystemHealthTab";
import { UsersTable } from "@/components/Dashboard/UsersTable";
import { FloatingButtonManagement } from "@/components/Dashboard/FloatingButtonManagement";
import { HomeCardsManagement } from "@/components/Dashboard/HomeCardsManagement";
import { SearchBarSettings } from "@/components/Dashboard/SearchBarSettings";

interface DashboardProps {
  onPageChange?: (page: string) => void;
  onEditProperty?: (propertyId: string) => void;
}

export const Dashboard = ({ onPageChange, onEditProperty }: DashboardProps) => {
  // العمليات المجمعة للعقارات
  const handleBulkPublish = async () => {
    try {
      const unpublished = userProperties.filter(p => !p.is_published);
      for (const prop of unpublished) {
        await togglePropertyPublication(prop.id, prop.is_published);
        await logPropertyAction(
          'update', // تحديث حالة العقار للنشر
          prop.id,
          {
            property_title: prop.title,
            bulk_action: true,
            admin_action: true,
            new_status: 'published'
          }
        );
      }
      toast({
        title: "تم نشر جميع العقارات غير المنشورة",
        description: `تم نشر ${unpublished.length} عقار`,
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء النشر المجمع",
        variant: "destructive",
      });
    }
  };

  const handleBulkUnpublish = async () => {
    try {
      const published = userProperties.filter(p => p.is_published);
      for (const prop of published) {
        await togglePropertyPublication(prop.id, prop.is_published);
        await logPropertyAction(
          'update', // تحديث حالة العقار للإخفاء
          prop.id,
          {
            property_title: prop.title,
            bulk_action: true,
            admin_action: true,
            new_status: 'unpublished'
          }
        );
      }
      toast({
        title: "تم إخفاء جميع العقارات المنشورة",
        description: `تم إخفاء ${published.length} عقار`,
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء الإخفاء المجمع",
        variant: "destructive",
      });
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm("هل أنت متأكد من حذف جميع العقارات؟")) return;
    try {
      for (const prop of userProperties) {
        await deleteProperty(prop.id);
        await logPropertyAction(
          'delete', // النوع الصحيح للعملية
          prop.id,
          {
            property_title: prop.title,
            bulk_action: true,
            admin_action: true
          }
        );
      }
      toast({
        title: "تم حذف جميع العقارات",
        description: `تم حذف ${userProperties.length} عقار`,
        variant: "destructive",
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء الحذف المجمع",
        variant: "destructive",
      });
    }
  };
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
  // Optimistic state for property publication
  const [optimisticPublication, setOptimisticPublication] = useState<Record<string, boolean>>({});

  const handleTabChange = (tabId: string) => {
    // sync state with URL via hook
    setTab(tabId as DashboardTabId);
  };

  const stats = useMemo(() => getDashboardStats(), [getDashboardStats]);

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

  const handleTogglePublication = async (propertyId: string, currentStatus: boolean) => {
    // Optimistic update
    setOptimisticPublication(prev => ({ ...prev, [propertyId]: !currentStatus }));
    try {
      await togglePropertyPublication(propertyId, currentStatus);
      // تسجيل العملية في audit log
      await logPropertyAction(
        'update',
        propertyId,
        { 
          previous_status: currentStatus ? 'published' : 'unpublished',
          new_status: currentStatus ? 'unpublished' : 'published',
          admin_action: true
        }
      );
      toast({
        title: currentStatus ? "تم إخفاء العقار" : "تم نشر العقار",
        description: currentStatus ? "العقار غير مرئي للعملاء الآن" : "العقار مرئي للعملاء الآن",
      });
      // Remove optimistic state after backend confirms
      setOptimisticPublication(prev => {
        const copy = { ...prev };
        delete copy[propertyId];
        return copy;
      });
    } catch (error) {
      // Revert optimistic update
      setOptimisticPublication(prev => {
        const copy = { ...prev };
        delete copy[propertyId];
        return copy;
      });
      console.error('Error toggling property publication:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحديث حالة النشر",
        variant: "destructive",
      });
    }
  };

  const handleDeleteProperty = async (propertyId: string) => {
    if (confirm("هل أنت متأكد من حذف هذا العقار؟")) {
        try {
          // الحصول على معلومات العقار قبل الحذف
          const property = userProperties.find(p => p.id === propertyId);
        
      await deleteProperty(propertyId);
        
          // تسجيل العملية في audit log
          await logPropertyAction(
            'delete',
            propertyId,
            { 
              property_title: property?.title,
              property_owner: property?.owner_name,
              admin_action: true
            }
          );
        
      toast({
        title: "تم حذف العقار",
        description: "تم حذف العقار بنجاح",
        variant: "destructive",
      });
        } catch (error) {
          console.error('Error deleting property:', error);
          toast({
            title: "خطأ",
            description: "حدث خطأ أثناء حذف العقار",
            variant: "destructive",
          });
        }
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (confirm("هل أنت متأكد من حذف هذا المستخدم؟ سيتم حذف جميع عقاراته أيضاً")) {
        try {
          // الحصول على معلومات المستخدم قبل الحذف
          const user = users.find(u => u.id === userId);
        
      await deleteUser(userId);
        
          // تسجيل العملية في audit log
          await logUserAction(
            'delete',
            userId,
            { 
              user_email: user?.email,
              user_role: user?.role,
              properties_count: user?.properties_count,
              admin_action: true
            }
          );
        
      toast({
        title: "تم حذف المستخدم",
        description: "تم حذف المستخدم وجميع عقاراته بنجاح",
        variant: "destructive",
      });
        } catch (error) {
          console.error('Error deleting user:', error);
          toast({
            title: "خطأ",
            description: "حدث خطأ أثناء حذف المستخدم",
            variant: "destructive",
          });
        }
    }
  };

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

  const renderTabContent = () => {
    switch (selectedTab) {
      case "overview":
        return renderOverviewTab();
      case "properties":
        return renderPropertiesTab();
      case "properties-management":
        return renderPropertiesManagementTab();
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
        return <UsersTable
          users={users}
          allUsersWithStatus={allUsersWithStatus}
          onDeleteUser={handleDeleteUser}
          onUpdateRole={updateUserRole}
          onBanUser={banUserFromPublishing}
          onUnbanUser={unbanUserFromPublishing}
          getUserProfile={getUserProfile}
          getUserProperties={getUserProperties}
          onStatusUpdate={fetchAllUsersWithStatus}
        />;
      case "user-roles":
        return <UserRolesManagement />;
      // verification-settings tab removed; notifications tab will be used instead
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6">
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
            <CardTitle className="text-sm font-medium">العقارات غير المنشورة</CardTitle>
            <EyeOff className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProperties - stats.publishedProperties}</div>
            <p className="text-xs text-muted-foreground">عقار مخفي عن العملاء</p>
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

  const renderPropertiesManagementTab = () => (
    <Card>
      <CardHeader>
        <CardTitle>إدارة العقارات</CardTitle>
        <p className="text-sm text-muted-foreground">إدارة شاملة لجميع العقارات في النظام</p>
        {/* شريط العمليات المجمعة */}
        {isAdmin && (
          <div className="flex gap-2 mt-4">
            <Button size="sm" onClick={handleBulkPublish}>نشر جميع العقارات غير المنشورة</Button>
            <Button size="sm" onClick={handleBulkUnpublish}>إخفاء جميع العقارات المنشورة</Button>
            <Button variant="destructive" size="sm" onClick={handleBulkDelete}>حذف جميع العقارات</Button>
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
                const isPublished =
                  typeof optimistic === 'boolean' ? optimistic : property.is_published;
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
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleTogglePublication(property.id, isPublished)}
                        >
                          {isPublished ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteProperty(property.id)}
                        >
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

  const renderPropertiesTab = () => (
    <Card>
      <CardHeader>
        <CardTitle>جميع العقارات</CardTitle>
        <p className="text-sm text-muted-foreground">عرض جميع العقارات في النظام</p>
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
              {userProperties.map((property) => (
                <TableRow key={property.id}>
                  <TableCell className="font-medium">{property.title}</TableCell>
                  <TableCell>{property.owner_name || "غير محدد"}</TableCell>
                  <TableCell>{property.price.toLocaleString()} د.ع</TableCell>
                  <TableCell>{property.location}</TableCell>
                  <TableCell>{property.property_type}</TableCell>
                  <TableCell>
                    <Badge variant={property.is_published ? "default" : "secondary"}>
                      {property.is_published ? "منشور" : "مخفي"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTogglePublication(property.id, property.is_published)}
                      >
                        {property.is_published ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteProperty(property.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
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
      {/* Top Tabs Navigation */}
      <DashboardTabs 
        activeTab={selectedTab}
        onTabChange={handleTabChange}
      />
      
      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        {renderTabContent()}
      </div>
    </div>
    </>
  );

};

export default Dashboard;