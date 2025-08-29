import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useProperties } from "@/hooks/useProperties";
import { useAuth } from "@/hooks/useAuth";
import { useDashboardData } from "@/hooks/useDashboardData";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Building2, Eye, EyeOff, Trash2, TrendingUp, Activity, Menu } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { DashboardSidebar } from "@/components/Dashboard/DashboardSidebar";
import { DashboardBreadcrumb } from "@/components/Dashboard/DashboardBreadcrumb";
import { EditPropertiesTab } from "@/components/Dashboard/EditPropertiesTab";
import { BannerSettingsTab } from "@/components/Dashboard/BannerSettingsTab";
import { Profile } from "@/pages/Profile";
import { UserActions } from "@/components/Dashboard/UserActions";
import { UserStatusControl } from "@/components/Dashboard/UserStatusControl";
import { useUserStatus } from "@/hooks/useUserStatus";

interface DashboardProps {
  onPageChange?: (page: string) => void;
  onEditProperty?: (propertyId: string) => void;
}

export const Dashboard = ({ onPageChange, onEditProperty }: DashboardProps) => {
  const { isAdmin } = useAuth();
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
  
  const [selectedTab, setSelectedTab] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
    await togglePropertyPublication(propertyId, currentStatus);
    toast({
      title: currentStatus ? "تم إخفاء العقار" : "تم نشر العقار",
      description: currentStatus ? "العقار غير مرئي للعملاء الآن" : "العقار مرئي للعملاء الآن",
    });
  };

  const handleDeleteProperty = async (propertyId: string) => {
    if (confirm("هل أنت متأكد من حذف هذا العقار؟")) {
      await deleteProperty(propertyId);
      toast({
        title: "تم حذف العقار",
        description: "تم حذف العقار بنجاح",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (confirm("هل أنت متأكد من حذف هذا المستخدم؟ سيتم حذف جميع عقاراته أيضاً")) {
      await deleteUser(userId);
      toast({
        title: "تم حذف المستخدم",
        description: "تم حذف المستخدم وجميع عقاراته بنجاح",
        variant: "destructive",
      });
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
      case "users":
        return renderUsersTab();
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
            <CardTitle className="text-sm font-medium">معدل النشر</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.publishRate}%</div>
            <p className="text-xs text-muted-foreground">من إجمالي العقارات</p>
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

  const renderUsersTab = () => (
    <Card>
      <CardHeader>
        <CardTitle>إدارة المستخدمين</CardTitle>
        <p className="text-sm text-muted-foreground">عرض وإدارة جميع المستخدمين المسجلين</p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الاسم</TableHead>
                <TableHead>البريد الإلكتروني</TableHead>
                <TableHead>الهاتف</TableHead>
                <TableHead>الدور</TableHead>
                <TableHead>حالة المستخدم</TableHead>
                <TableHead>الحدود</TableHead>
                <TableHead>عدد العقارات</TableHead>
                <TableHead>تاريخ التسجيل</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allUsersWithStatus.map((userWithStatus) => {
                const user = users.find(u => u.id === userWithStatus.id);
                if (!user || !userWithStatus.status_data) return null;
                
                return (
                  <TableRow key={userWithStatus.id}>
                    <TableCell>{userWithStatus.full_name || "غير محدد"}</TableCell>
                    <TableCell>{userWithStatus.email}</TableCell>
                    <TableCell>{userWithStatus.phone || "غير محدد"}</TableCell>
                    <TableCell>
                      <Badge variant={user.role === 'admin' ? "default" : "secondary"}>
                        {user.role === 'admin' ? "مدير" : "مستخدم"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <UserStatusControl
                        userId={userWithStatus.id}
                        currentStatus={userWithStatus.status_data.status}
                        userName={userWithStatus.full_name || userWithStatus.email}
                        onStatusUpdate={fetchAllUsersWithStatus}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>العقارات: {userWithStatus.status_data.properties_limit}</div>
                        <div>الصور: {userWithStatus.status_data.images_limit}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">
                        {user.properties_count || 0}
                      </span>
                      <span className="text-muted-foreground">
                        /{userWithStatus.status_data.properties_limit}
                      </span>
                    </TableCell>
                    <TableCell>
                      {new Date(user.created_at).toLocaleDateString('en-US')}
                    </TableCell>
                    <TableCell>
                      <UserActions
                        user={user}
                        onDelete={handleDeleteUser}
                        onUpdateRole={updateUserRole}
                        onBanUser={banUserFromPublishing}
                        onUnbanUser={unbanUserFromPublishing}
                        getUserProfile={getUserProfile}
                        getUserProperties={getUserProperties}
                      />
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
    <div className="min-h-screen bg-background">
      <div className="flex">
        {/* Sidebar */}
        <DashboardSidebar 
          activeTab={selectedTab}
          onTabChange={(tab) => {
            setSelectedTab(tab);
          }}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        
        {/* Main content */}
        <div className="flex-1 lg:mr-0">
          <div className="p-6">
            {/* Mobile menu button */}
            <div className="flex items-center justify-between mb-6 lg:hidden">
              <h1 className="text-2xl font-bold">لوحة التحكم</h1>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
            </div>
            
            {/* Breadcrumb */}
            <DashboardBreadcrumb 
              activeTab={selectedTab}
              onNavigate={(page) => {
                switch (page) {
                  case 'overview':
                    setSelectedTab('overview');
                    break;
                  case 'properties':
                    setSelectedTab('properties');
                    break;
                  case 'properties-management':
                    setSelectedTab('properties-management');
                    break;
                  case 'edit-properties':
                    setSelectedTab('edit-properties');
                    break;
                  case 'banner-settings':
                    setSelectedTab('banner-settings');
                    break;
                  case 'users':
                    setSelectedTab('users');
                    break;
                  case 'profile':
                    setSelectedTab('profile');
                    break;
                }
              }}
            />
            
            {/* Header for desktop */}
            <div className="hidden lg:flex items-center justify-between mb-8">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold">لوحة التحكم الإدارية</h1>
                <p className="text-muted-foreground">إدارة شاملة للمستخدمين والعقارات</p>
              </div>
              <Badge variant="secondary" className="text-lg px-4 py-2">
                <Activity className="w-4 h-4 mr-2" />
                مدير النظام
              </Badge>
            </div>

            {/* Content */}
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );

};

export default Dashboard;