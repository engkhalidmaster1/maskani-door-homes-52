import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useProperties } from "@/hooks/useProperties";
import { useAuth } from "@/hooks/useAuth";
import { useDashboardData } from "@/hooks/useDashboardData";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Building2, Eye, EyeOff, Trash2, Edit, TrendingUp, Activity } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export const Dashboard = () => {
  const { isAdmin } = useAuth();
  const { 
    users, 
    userProperties, 
    isLoading, 
    deleteUser, 
    updateUserRole,
    getDashboardStats 
  } = useDashboardData();
  const { togglePropertyPublication, deleteProperty } = useProperties();
  
  const [selectedTab, setSelectedTab] = useState("overview");

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

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">لوحة التحكم الإدارية</h1>
          <p className="text-muted-foreground">إدارة شاملة للمستخدمين والعقارات</p>
        </div>
        <Badge variant="secondary" className="text-lg px-4 py-2">
          <Activity className="w-4 h-4 mr-2" />
          مدير النظام
        </Badge>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="users">المستخدمون</TabsTrigger>
          <TabsTrigger value="properties">العقارات</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                      <span className="text-lg font-bold">{property.price.toLocaleString()} ر.س</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>إدارة المستخدمين</CardTitle>
              <p className="text-sm text-muted-foreground">عرض وإدارة جميع المستخدمين المسجلين</p>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الاسم</TableHead>
                    <TableHead>البريد الإلكتروني</TableHead>
                    <TableHead>الهاتف</TableHead>
                    <TableHead>الدور</TableHead>
                    <TableHead>عدد العقارات</TableHead>
                    <TableHead>تاريخ التسجيل</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.full_name || "غير محدد"}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.phone || "غير محدد"}</TableCell>
                      <TableCell>
                        <Badge variant={user.role === 'admin' ? "default" : "secondary"}>
                          {user.role === 'admin' ? "مدير" : "مستخدم"}
                        </Badge>
                      </TableCell>
                      <TableCell>{user.properties_count}</TableCell>
                      <TableCell>
                        {new Date(user.created_at).toLocaleDateString('ar-SA')}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {user.role !== 'admin' && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteUser(user.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="properties" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>إدارة العقارات</CardTitle>
              <p className="text-sm text-muted-foreground">عرض وإدارة جميع العقارات في النظام</p>
            </CardHeader>
            <CardContent>
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
                      <TableCell>{property.price.toLocaleString()} ر.س</TableCell>
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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;