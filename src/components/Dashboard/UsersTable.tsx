import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UserActions } from "./UserActions";
import { UserStatusControl } from "./UserStatusControl";
import { Search, Filter, ChevronLeft, ChevronRight, Users, Calendar, Phone, Building2 } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import type { Database } from "@/integrations/supabase/types";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type PropertyRow = Database["public"]["Tables"]["properties"]["Row"];

interface User {
  id: string;
  email: string;
  role: string;
  created_at: string;
  properties_count?: number;
  full_name?: string | null;
  phone?: string | null;
}

interface UserWithStatus {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  status_data: {
    status: string;
    properties_limit: number;
    images_limit: number;
  };
}

interface UsersTableProps {
  users: User[];
  allUsersWithStatus: UserWithStatus[];
  onDeleteUser: (userId: string) => Promise<void>;
  onUpdateRole: (userId: string, role: string) => Promise<void>;
  onBanUser: (userId: string) => Promise<void>;
  onUnbanUser: (userId: string) => Promise<void>;
  getUserProfile: (userId: string) => Promise<ProfileRow | null>;
  getUserProperties: (userId: string) => Promise<PropertyRow[]>;
  onStatusUpdate: () => void;
}

export const UsersTable = ({
  users,
  allUsersWithStatus,
  onDeleteUser,
  onUpdateRole,
  onBanUser,
  onUnbanUser,
  getUserProfile,
  getUserProperties,
  onStatusUpdate,
}: UsersTableProps) => {
  // حالة الترقيم
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // حالة الفلاتر
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [propertiesFilter, setPropertiesFilter] = useState<string>("all");

  // دمج البيانات وتطبيق الفلاتر
  const filteredUsers = useMemo(() => {
    return allUsersWithStatus.filter((userWithStatus) => {
      const user = users.find(u => u.id === userWithStatus.id);
      if (!user || !userWithStatus.status_data) return false;

      // فلتر البحث (الاسم، البريد، الهاتف)
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        !searchTerm ||
        userWithStatus.email.toLowerCase().includes(searchLower) ||
        (userWithStatus.full_name?.toLowerCase().includes(searchLower)) ||
        (userWithStatus.phone?.includes(searchTerm));

      // فلتر الدور
      const matchesRole = 
        roleFilter === "all" || 
        user.role === roleFilter;

      // فلتر الحالة
      const matchesStatus = 
        statusFilter === "all" || 
        userWithStatus.status_data.status === statusFilter;

      // فلتر التاريخ
      const userDate = new Date(user.created_at);
      const now = new Date();
      const daysDiff = Math.floor((now.getTime() - userDate.getTime()) / (1000 * 60 * 60 * 24));
      
      let matchesDate = true;
      if (dateFilter === "today") matchesDate = daysDiff === 0;
      else if (dateFilter === "week") matchesDate = daysDiff <= 7;
      else if (dateFilter === "month") matchesDate = daysDiff <= 30;
      else if (dateFilter === "year") matchesDate = daysDiff <= 365;

      // فلتر العقارات
      const propertiesCount = user.properties_count || 0;
      let matchesProperties = true;
      if (propertiesFilter === "none") matchesProperties = propertiesCount === 0;
      else if (propertiesFilter === "has") matchesProperties = propertiesCount > 0;
      else if (propertiesFilter === "limit") matchesProperties = propertiesCount >= userWithStatus.status_data.properties_limit;

      return matchesSearch && matchesRole && matchesStatus && matchesDate && matchesProperties;
    });
  }, [allUsersWithStatus, users, searchTerm, roleFilter, statusFilter, dateFilter, propertiesFilter]);

  // حساب الصفحات
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentUsers = filteredUsers.slice(startIndex, endIndex);

  // إحصائيات
  const stats = useMemo(() => {
    const totalUsers = filteredUsers.length;
    const activeUsers = filteredUsers.filter(u => u.status_data.status === 'active').length;
    const bannedUsers = filteredUsers.filter(u => u.status_data.status === 'banned').length;
    const admins = filteredUsers.filter(u => {
      const user = users.find(us => us.id === u.id);
      return user?.role === 'admin';
    }).length;

    return { totalUsers, activeUsers, bannedUsers, admins };
  }, [filteredUsers, users]);

  // إعادة تعيين الصفحة عند تغيير الفلتر
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, roleFilter, statusFilter, dateFilter, propertiesFilter]);

  return (
    <div className="space-y-6">
      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">إجمالي المستخدمين</p>
                <h3 className="text-2xl font-bold">{stats.totalUsers}</h3>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">نشطون</p>
                <h3 className="text-2xl font-bold text-green-600">{stats.activeUsers}</h3>
              </div>
              <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                <div className="h-4 w-4 rounded-full bg-green-600"></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">محظورون</p>
                <h3 className="text-2xl font-bold text-red-600">{stats.bannedUsers}</h3>
              </div>
              <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                <div className="h-4 w-4 rounded-full bg-red-600"></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">المديرون</p>
                <h3 className="text-2xl font-bold text-blue-600">{stats.admins}</h3>
              </div>
              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                <div className="h-4 w-4 rounded-full bg-blue-600"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* جدول المستخدمين */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>قائمة المستخدمين</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                عرض {startIndex + 1} - {Math.min(endIndex, filteredUsers.length)} من {filteredUsers.length} مستخدم
              </p>
            </div>

            {/* شريط البحث */}
            <div className="relative w-full md:w-80">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="بحث بالاسم، البريد أو الهاتف..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>
          </div>

          {/* الفلاتر المتقدمة */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
            <div>
              <label className="text-sm font-medium mb-2 flex items-center gap-2">
                <Filter className="h-4 w-4" />
                الدور
              </label>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="كل الأدوار" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل الأدوار</SelectItem>
                  <SelectItem value="admin">مدير</SelectItem>
                  <SelectItem value="user">مستخدم</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 flex items-center gap-2">الحالة</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="كل الحالات" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل الحالات</SelectItem>
                  <SelectItem value="active">نشط</SelectItem>
                  <SelectItem value="banned">محظور</SelectItem>
                  <SelectItem value="suspended">معلق</SelectItem>
                  <SelectItem value="pending">معلق الموافقة</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                تاريخ التسجيل
              </label>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="كل الأوقات" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل الأوقات</SelectItem>
                  <SelectItem value="today">اليوم</SelectItem>
                  <SelectItem value="week">آخر أسبوع</SelectItem>
                  <SelectItem value="month">آخر شهر</SelectItem>
                  <SelectItem value="year">آخر سنة</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                العقارات
              </label>
              <Select value={propertiesFilter} onValueChange={setPropertiesFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="كل المستخدمين" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل المستخدمين</SelectItem>
                  <SelectItem value="none">بدون عقارات</SelectItem>
                  <SelectItem value="has">لديهم عقارات</SelectItem>
                  <SelectItem value="limit">وصلوا للحد الأقصى</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* زر إعادة تعيين الفلاتر */}
          {(searchTerm || roleFilter !== "all" || statusFilter !== "all" || dateFilter !== "all" || propertiesFilter !== "all") && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchTerm("");
                setRoleFilter("all");
                setStatusFilter("all");
                setDateFilter("all");
                setPropertiesFilter("all");
              }}
              className="mt-4"
            >
              إعادة تعيين الفلاتر
            </Button>
          )}
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">#</TableHead>
                  <TableHead>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      المستخدم
                    </div>
                  </TableHead>
                  <TableHead>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      الهاتف
                    </div>
                  </TableHead>
                  <TableHead>الدور</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      العقارات
                    </div>
                  </TableHead>
                  <TableHead>الحدود</TableHead>
                  <TableHead>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      التسجيل
                    </div>
                  </TableHead>
                  <TableHead className="text-center">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Users className="h-12 w-12 opacity-50" />
                        <p>لا توجد نتائج</p>
                        <p className="text-sm">جرب تغيير الفلاتر أو البحث</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  currentUsers.map((userWithStatus, index) => {
                    const user = users.find(u => u.id === userWithStatus.id);
                    if (!user) return null;

                    const propertiesCount = user.properties_count || 0;
                    const isAtLimit = propertiesCount >= userWithStatus.status_data.properties_limit;

                    return (
                      <TableRow key={userWithStatus.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium text-muted-foreground">
                          {startIndex + index + 1}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{userWithStatus.full_name || "غير محدد"}</span>
                            {user.role === 'admin' && (
                              <Badge variant="outline" className="w-fit mt-1 text-xs">
                                مدير
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {userWithStatus.phone ? (
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{userWithStatus.phone}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">غير محدد</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.role === 'admin' ? "default" : "secondary"}>
                            {user.role === 'admin' ? "مدير" : "مستخدم"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <UserStatusControl
                            userId={userWithStatus.id}
                            currentStatus={(userWithStatus.status_data.status || 'publisher') as 'publisher' | 'trusted_owner' | 'office_agent'}
                            userName={userWithStatus.full_name || userWithStatus.email}
                            onStatusUpdate={onStatusUpdate}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <span className={`font-medium ${isAtLimit ? 'text-red-600' : ''}`}>
                              {propertiesCount}
                            </span>
                            <span className="text-muted-foreground">
                              / {userWithStatus.status_data.properties_limit}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm space-y-1">
                            <div className="flex items-center gap-1">
                              <span className="text-muted-foreground">عقارات:</span>
                              <span className="font-medium">{userWithStatus.status_data.properties_limit}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-muted-foreground">صور:</span>
                              <span className="font-medium">{userWithStatus.status_data.images_limit}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                              {format(new Date(user.created_at), 'dd MMM yyyy', { locale: ar })}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <UserActions
                            user={{
                              ...user,
                              full_name: userWithStatus.full_name,
                              phone: userWithStatus.phone,
                              properties_count: user.properties_count || 0
                            }}
                            onDelete={onDeleteUser}
                            onUpdateRole={onUpdateRole}
                            onBanUser={onBanUser}
                            onUnbanUser={onUnbanUser}
                            getUserProfile={getUserProfile}
                            getUserProperties={getUserProperties}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* ترقيم الصفحات */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-muted-foreground">
                الصفحة {currentPage} من {totalPages}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronRight className="h-4 w-4" />
                  السابق
                </Button>

                {/* أرقام الصفحات */}
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className="w-10"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  التالي
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>

              <div className="text-sm text-muted-foreground">
                {filteredUsers.length} مستخدم
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
