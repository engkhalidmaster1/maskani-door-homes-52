import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { 
  Users, 
  Search, 
  UserCheck,
  UserX,
  Building2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Filter,
  Eye,
  Edit3,
  Trash2,
  Ban,
  Unlock,
  Grid3x3,
  Table as TableIcon,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useToast } from "@/hooks/use-toast";

interface UserData {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  address: string | null;
  role: string;
  created_at: string;
  properties_count: number;
  status: string;
  properties_limit: number;
  images_limit: number;
  can_publish?: boolean;
}

export const UsersView = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [propertiesFilter, setPropertiesFilter] = useState<string>('all');
  
  // View and Pagination states
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // Dialog states
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [userProperties, setUserProperties] = useState<any[]>([]);
  
  // Edit form states
  const [editForm, setEditForm] = useState({
    full_name: '',
    phone: '',
    address: '',
    role: 'user' as 'admin' | 'user'
  });

  const { toast } = useToast();

  // جلب البيانات
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);

      // جلب المستخدمين من profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*');

      if (profilesError) throw profilesError;

      // جلب الأدوار
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('user_id, role');

      // جلب الحالات
      const { data: statusData } = await supabase
        .from('user_statuses')
        .select('*');

      // جلب عدد العقارات لكل مستخدم
      const { data: propertiesCount } = await supabase
        .from('properties')
        .select('user_id');

      // دمج البيانات
      const combinedUsers: UserData[] = (profilesData || []).map(profile => {
        const roleEntry = rolesData?.find(r => r.user_id === profile.user_id);
        const statusEntry = statusData?.find((s: any) => s.user_id === profile.user_id);
        const userPropertiesCount = propertiesCount?.filter(p => p.user_id === profile.user_id).length || 0;

        return {
          id: profile.user_id,
          email: profile.email || '',
          full_name: profile.full_name,
          phone: profile.phone,
          address: profile.address,
          role: roleEntry?.role || 'user',
          created_at: profile.created_at,
          properties_count: userPropertiesCount,
          status: statusEntry?.status || 'active',
          properties_limit: statusEntry?.properties_limit || 10,
          images_limit: statusEntry?.images_limit || 10,
          can_publish: statusEntry?.can_publish ?? true,
        };
      });

      setUsers(combinedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  // وظائف الإجراءات
  const handleViewUser = async (user: UserData) => {
    setSelectedUser(user);
    
    // جلب عقارات المستخدم
    const { data: properties } = await supabase
      .from('properties')
      .select('*')
      .eq('user_id', user.id);
    
    setUserProperties(properties || []);
    setViewDialogOpen(true);
  };

  const handleEditUser = (user: UserData) => {
    setSelectedUser(user);
    setEditForm({
      full_name: user.full_name || '',
      phone: user.phone || '',
      address: user.address || '',
      role: user.role as 'admin' | 'user'
    });
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedUser) return;

    try {
      // تحديث البروفايل
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: editForm.full_name,
          phone: editForm.phone,
          address: editForm.address,
        })
        .eq('user_id', selectedUser.id);

      if (profileError) throw profileError;

      // تحديث الدور
      const { error: roleError } = await supabase
        .from('user_roles')
        .upsert({
          user_id: selectedUser.id,
          role: editForm.role
        });

      if (roleError) throw roleError;

      toast({
        title: "تم التحديث بنجاح",
        description: "تم تحديث بيانات المستخدم",
      });

      setEditDialogOpen(false);
      fetchUsers();
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل تحديث البيانات",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      // حذف العقارات أولاً
      const { error: propsError } = await supabase
        .from('properties')
        .delete()
        .eq('user_id', selectedUser.id);

      if (propsError) {
        console.error('Error deleting properties:', propsError);
      }

      // حذف من user_statuses
      await supabase
        .from('user_statuses')
        .delete()
        .eq('user_id', selectedUser.id);

      // حذف من user_roles
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', selectedUser.id);

      // حذف من favorites
      await supabase
        .from('favorites')
        .delete()
        .eq('user_id', selectedUser.id);

      // حذف من profiles
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('user_id', selectedUser.id);

      if (profileError) throw profileError;

      toast({
        title: "تم الحذف بنجاح",
        description: "تم حذف المستخدم وجميع بياناته من النظام",
      });

      setDeleteDialogOpen(false);
      fetchUsers();
    } catch (error: any) {
      console.error('Delete error:', error);
      toast({
        title: "خطأ في الحذف",
        description: error.message || "فشل حذف المستخدم",
        variant: "destructive",
      });
    }
  };

  const handleBanUser = async () => {
    if (!selectedUser) return;

    try {
      // إخفاء جميع عقارات المستخدم
      const { error: hideError } = await supabase
        .from('properties')
        .update({ is_published: false })
        .eq('user_id', selectedUser.id);

      if (hideError) {
        console.error('Error hiding properties:', hideError);
      }

      // حظر المستخدم من النشر
      const { error: statusError } = await supabase
        .from('user_statuses')
        .upsert(
          {
            user_id: selectedUser.id,
            can_publish: false,  // ✅ منع النشر
            properties_limit: 0,
            images_limit: 0,
          },
          {
            onConflict: 'user_id'
          }
        );

      if (statusError) {
        console.error('Status update error:', statusError);
        throw statusError;
      }

      toast({
        title: "تم الحظر بنجاح",
        description: "تم حظر المستخدم من النشر وإخفاء جميع عقاراته",
      });

      setBanDialogOpen(false);
      fetchUsers();
    } catch (error: any) {
      console.error('Ban error:', error);
      toast({
        title: "خطأ في الحظر",
        description: error.message || "فشل حظر المستخدم",
        variant: "destructive",
      });
    }
  };

  const handleUnbanUser = async () => {
    if (!selectedUser) return;

    try {
      const { error } = await supabase
        .from('user_statuses')
        .upsert(
          {
            user_id: selectedUser.id,
            can_publish: true,  // ✅ السماح بالنشر
            properties_limit: 10,
            images_limit: 10,
          },
          {
            onConflict: 'user_id'
          }
        );

      if (error) {
        console.error('Unban error:', error);
        throw error;
      }

      toast({
        title: "تم إلغاء الحظر",
        description: "تم إلغاء حظر المستخدم بنجاح وإعادة صلاحيات النشر",
      });

      fetchUsers();
    } catch (error: any) {
      console.error('Unban error:', error);
      toast({
        title: "خطأ في إلغاء الحظر",
        description: error.message || "فشل إلغاء الحظر",
        variant: "destructive",
      });
    }
  };

  // الفلاتر والبحث
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      // البحث
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = 
        (user.full_name?.toLowerCase().includes(searchLower) || false) ||
        (user.email?.toLowerCase().includes(searchLower) || false) ||
        (user.phone?.includes(searchQuery) || false) ||
        (user.address?.toLowerCase().includes(searchLower) || false);

      if (searchQuery && !matchesSearch) return false;

      // فلتر الدور
      if (roleFilter !== 'all' && user.role !== roleFilter) return false;

      // فلتر الحالة
      if (statusFilter === 'banned') {
        // إذا اختار "محظور" - نعرض المستخدمين الممنوعين من النشر
        if (user.can_publish !== false) return false;
      } else if (statusFilter !== 'all') {
        // وإلا نفلتر حسب نوع الحساب (status)
        if (user.status !== statusFilter) return false;
      }

      // فلتر العقارات
      if (propertiesFilter === 'none' && user.properties_count > 0) return false;
      if (propertiesFilter === 'has' && user.properties_count === 0) return false;
      if (propertiesFilter === 'max' && user.properties_count < user.properties_limit) return false;

      return true;
    });
  }, [users, searchQuery, roleFilter, statusFilter, propertiesFilter]);

  // إعادة تعيين الصفحة عند تغيير الفلاتر
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, roleFilter, statusFilter, propertiesFilter]);

  // حساب عدد الصفحات والبيانات المقسمة
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredUsers.slice(startIndex, endIndex);
  }, [filteredUsers, currentPage, itemsPerPage]);

  // الإحصائيات
  const stats = useMemo(() => ({
    total: filteredUsers.length,
    publishers: filteredUsers.filter(u => u.status === 'publisher').length,
    trusted: filteredUsers.filter(u => u.status === 'trusted_owner').length,
    offices: filteredUsers.filter(u => u.status === 'office_agent').length,
    banned: filteredUsers.filter(u => u.can_publish === false).length,
    admins: filteredUsers.filter(u => u.role === 'admin').length,
  }), [filteredUsers]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 flex items-center justify-center">
        <div className="text-center">
          <Users className="h-12 w-12 text-blue-600 animate-pulse mx-auto mb-4" />
          <p className="text-lg text-gray-600">جاري تحميل المستخدمين...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* الرأس */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-3 rounded-xl shadow-lg">
              <Users className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">قائمة المستخدمين</h1>
              <p className="text-sm text-gray-600">عرض بيانات جميع المستخدمين المسجلين</p>
            </div>
          </div>
        </div>

        {/* الإحصائيات */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 font-medium">إجمالي المستخدمين</p>
                  <p className="text-3xl font-bold text-blue-900 mt-2">{stats.total}</p>
                </div>
                <Users className="h-12 w-12 text-blue-600 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">ناشرون عاديون</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stats.publishers}</p>
                </div>
                <UserCheck className="h-12 w-12 text-gray-600 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-yellow-600 font-medium">ملاك موثوقون</p>
                  <p className="text-3xl font-bold text-yellow-900 mt-2">{stats.trusted}</p>
                </div>
                <Building2 className="h-12 w-12 text-yellow-600 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 font-medium">مكاتب دلالية</p>
                  <p className="text-3xl font-bold text-green-900 mt-2">{stats.offices}</p>
                </div>
                <Building2 className="h-12 w-12 text-green-600 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-600 font-medium">محظورون</p>
                  <p className="text-3xl font-bold text-red-900 mt-2">{stats.banned}</p>
                </div>
                <UserX className="h-12 w-12 text-red-600 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* الفلاتر */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              الفلاتر والبحث
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* البحث */}
              <div className="relative">
                <Search className="absolute right-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="ابحث باسم أو بريد أو هاتف..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10"
                />
              </div>

              {/* فلتر الدور */}
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="الدور" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل الأدوار</SelectItem>
                  <SelectItem value="admin">مدراء فقط</SelectItem>
                  <SelectItem value="user">مستخدمون عاديون</SelectItem>
                </SelectContent>
              </Select>

              {/* فلتر الحالة */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل الحالات</SelectItem>
                  <SelectItem value="publisher">👤 ناشر عادي</SelectItem>
                  <SelectItem value="trusted_owner">🏆 مالك موثوق</SelectItem>
                  <SelectItem value="office_agent">🏢 مكتب دلالية</SelectItem>
                  <SelectItem value="banned">🚫 محظور من النشر</SelectItem>
                </SelectContent>
              </Select>

              {/* فلتر العقارات */}
              <Select value={propertiesFilter} onValueChange={setPropertiesFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="العقارات" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل المستخدمين</SelectItem>
                  <SelectItem value="none">بدون عقارات</SelectItem>
                  <SelectItem value="has">لديهم عقارات</SelectItem>
                  <SelectItem value="max">وصلوا للحد الأقصى</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* قائمة المستخدمين */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>المستخدمون ({filteredUsers.length})</CardTitle>
            
            {/* زر التبديل بين Grid و Table */}
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="gap-2"
              >
                <Grid3x3 className="h-4 w-4" />
                مربعات
              </Button>
              <Button
                variant={viewMode === 'table' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('table')}
                className="gap-2"
              >
                <TableIcon className="h-4 w-4" />
                جدول
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {viewMode === 'grid' ? (
              // عرض المربعات (Grid)
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {paginatedUsers.map((user) => (
                <Card key={user.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {/* الاسم والحالة */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-bold text-lg text-gray-900">
                            {user.full_name || 'غير محدد'}
                          </h3>
                          <div className="flex gap-2 mt-2 flex-wrap">
                            <Badge variant={user.role === 'admin' ? "default" : "secondary"}>
                              {user.role === 'admin' ? 'مدير' : 'مستخدم'}
                            </Badge>
                            <Badge variant={
                              user.status === 'trusted_owner' ? 'default' :
                              user.status === 'office_agent' ? 'default' :
                              'secondary'
                            }>
                              {user.status === 'trusted_owner' ? '🏆 مالك موثوق' :
                               user.status === 'office_agent' ? '🏢 مكتب دلالية' :
                               '👤 ناشر'}
                            </Badge>
                            {user.can_publish === false && (
                              <Badge variant="destructive" className="text-xs">
                                🚫 محظور
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* المعلومات */}
                      <div className="space-y-2 text-sm">
                        {user.email && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <Mail className="h-4 w-4" />
                            <span className="truncate">{user.email}</span>
                          </div>
                        )}
                        
                        {user.phone && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <Phone className="h-4 w-4" />
                            <span>{user.phone}</span>
                          </div>
                        )}

                        {user.address && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <MapPin className="h-4 w-4" />
                            <span className="truncate">{user.address}</span>
                          </div>
                        )}

                        <div className="flex items-center gap-2 text-gray-600">
                          <Building2 className="h-4 w-4" />
                          <span>العقارات: {user.properties_count} / {user.properties_limit}</span>
                        </div>

                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {format(new Date(user.created_at), 'dd MMMM yyyy', { locale: ar })}
                          </span>
                        </div>
                      </div>

                      {/* أزرار الإجراءات */}
                      <div className="flex gap-2 flex-wrap pt-2 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewUser(user)}
                          className="gap-2 flex-1"
                        >
                          <Eye className="h-4 w-4" />
                          عرض
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditUser(user)}
                          className="gap-2 flex-1"
                        >
                          <Edit3 className="h-4 w-4" />
                          تعديل
                        </Button>

                        {user.can_publish === false ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedUser(user);
                              handleUnbanUser();
                            }}
                            className="gap-2 flex-1 text-green-600 hover:text-green-700 border-green-600"
                          >
                            <Unlock className="h-4 w-4" />
                            إلغاء حظر
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedUser(user);
                              setBanDialogOpen(true);
                            }}
                            className="gap-2 flex-1 text-orange-600 hover:text-orange-700 border-orange-600"
                          >
                            <Ban className="h-4 w-4" />
                            حظر
                          </Button>
                        )}

                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            setSelectedUser(user);
                            setDeleteDialogOpen(true);
                          }}
                          className="gap-2 flex-1"
                        >
                          <Trash2 className="h-4 w-4" />
                          حذف
                        </Button>
                      </div>

                      {/* شريط التقدم للعقارات */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-gray-600">
                          <span>استخدام العقارات</span>
                          <span>{Math.round((user.properties_count / user.properties_limit) * 100)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all ${
                              user.properties_count >= user.properties_limit 
                                ? 'bg-red-600' 
                                : user.properties_count > user.properties_limit * 0.7
                                ? 'bg-yellow-600'
                                : 'bg-green-600'
                            }`}
                            style={{ width: `${Math.min((user.properties_count / user.properties_limit) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            ) : (
              // عرض الجدول (Table)
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>المستخدم</TableHead>
                      <TableHead>البريد الإلكتروني</TableHead>
                      <TableHead>الهاتف</TableHead>
                      <TableHead>النوع</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>العقارات</TableHead>
                      <TableHead className="text-center">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="font-medium">{user.full_name || 'غير محدد'}</div>
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.phone || '-'}</TableCell>
                        <TableCell>
                          <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                            {user.role === 'admin' ? '👨‍💼 مدير' : '👤 مستخدم'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {user.can_publish === false ? (
                            <Badge variant="destructive">🚫 محظور</Badge>
                          ) : user.status === 'office_agent' ? (
                            <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200">🏢 مكتب</Badge>
                          ) : user.status === 'trusted_owner' ? (
                            <Badge className="bg-green-100 text-green-700 hover:bg-green-200">🏆 موثوق</Badge>
                          ) : (
                            <Badge variant="outline">👤 ناشر</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {user.properties_count} / {user.properties_limit}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleViewUser(user)}
                              title="عرض التفاصيل"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditUser(user)}
                              title="تعديل"
                            >
                              <Edit3 className="h-4 w-4" />
                            </Button>
                            {user.can_publish === false ? (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-green-600"
                                onClick={() => {
                                  setSelectedUser(user);
                                  handleUnbanUser();
                                }}
                                title="إلغاء حظر"
                              >
                                <UserCheck className="h-4 w-4" />
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-orange-600"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setBanDialogOpen(true);
                                }}
                                title="حظر"
                              >
                                <Ban className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-600"
                              onClick={() => {
                                setSelectedUser(user);
                                setDeleteDialogOpen(true);
                              }}
                              title="حذف"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {paginatedUsers.length === 0 && (
              <div className="text-center py-12">
                <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-lg text-gray-500">لا توجد نتائج</p>
                <p className="text-sm text-gray-400 mt-2">جرب تعديل الفلاتر أو البحث</p>
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6 pt-6 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronRight className="h-4 w-4" />
                  السابق
                </Button>
                
                <div className="flex gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                    // عرض الصفحات: الأولى، الأخيرة، الحالية، وصفحتين قبل وبعد الحالية
                    const showPage = 
                      pageNum === 1 || 
                      pageNum === totalPages || 
                      (pageNum >= currentPage - 2 && pageNum <= currentPage + 2);
                    
                    const showEllipsis = 
                      (pageNum === currentPage - 3 && currentPage > 4) ||
                      (pageNum === currentPage + 3 && currentPage < totalPages - 3);

                    if (showEllipsis) {
                      return <span key={pageNum} className="px-2">...</span>;
                    }

                    if (!showPage) return null;

                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className="min-w-[40px]"
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

                <div className="mr-4 text-sm text-gray-600">
                  صفحة {currentPage} من {totalPages} ({filteredUsers.length} مستخدم)
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog: عرض تفاصيل المستخدم */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              تفاصيل المستخدم
            </DialogTitle>
            <DialogDescription>
              معلومات المستخدم وعقاراته
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-6">
              {/* معلومات المستخدم */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">المعلومات الشخصية</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">الاسم:</span>
                      <span>{selectedUser.full_name || 'غير محدد'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">البريد:</span>
                      <span className="truncate">{selectedUser.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">الهاتف:</span>
                      <span>{selectedUser.phone || 'غير محدد'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">العنوان:</span>
                      <span>{selectedUser.address || 'غير محدد'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">تاريخ التسجيل:</span>
                      <span>{format(new Date(selectedUser.created_at), 'dd MMMM yyyy', { locale: ar })}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">الدور:</span>
                      <Badge variant={selectedUser.role === 'admin' ? 'default' : 'secondary'}>
                        {selectedUser.role === 'admin' ? '👑 مدير' : '👤 مستخدم'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">نوع الحساب:</span>
                      <Badge variant={
                        selectedUser.status === 'trusted_owner' ? 'default' :
                        selectedUser.status === 'office_agent' ? 'default' :
                        'secondary'
                      }>
                        {selectedUser.status === 'trusted_owner' ? '🏆 مالك موثوق' :
                         selectedUser.status === 'office_agent' ? '🏢 مكتب دلالية' :
                         '👤 ناشر عادي'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">حالة النشر:</span>
                      <Badge variant={selectedUser.can_publish === false ? 'destructive' : 'default'}>
                        {selectedUser.can_publish === false ? '🚫 محظور من النشر' : '✅ يمكنه النشر'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">حد العقارات:</span>
                      <span className="text-sm">
                        {selectedUser.properties_count} / {selectedUser.properties_limit} عقار
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">حد الصور:</span>
                      <span className="text-sm">{selectedUser.images_limit} صورة لكل عقار</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* عقارات المستخدم */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    العقارات ({userProperties.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {userProperties.length > 0 ? (
                    <div className="space-y-3">
                      {userProperties.map((property) => (
                        <div key={property.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex-1">
                            <h4 className="font-medium">{property.title}</h4>
                            <p className="text-sm text-muted-foreground">{property.location}</p>
                          </div>
                          <Badge variant={property.is_published ? 'default' : 'secondary'}>
                            {property.is_published ? 'منشور' : 'مخفي'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-4">لا توجد عقارات</p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog: تعديل بيانات المستخدم */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit3 className="h-5 w-5" />
              تعديل بيانات المستخدم
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">الاسم الكامل</label>
              <Input
                value={editForm.full_name}
                onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                placeholder="الاسم الكامل"
              />
            </div>

            <div>
              <label className="text-sm font-medium">رقم الهاتف</label>
              <Input
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                placeholder="رقم الهاتف"
              />
            </div>

            <div>
              <label className="text-sm font-medium">العنوان</label>
              <Input
                value={editForm.address}
                onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                placeholder="العنوان"
              />
            </div>

            <div>
              <label className="text-sm font-medium">الدور</label>
              <Select value={editForm.role} onValueChange={(value: 'admin' | 'user') => setEditForm({ ...editForm, role: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">مستخدم</SelectItem>
                  <SelectItem value="admin">مدير</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleSaveEdit}>
              حفظ التغييرات
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AlertDialog: تأكيد الحذف */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              تأكيد حذف المستخدم
            </AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف المستخدم <strong>{selectedUser?.full_name || selectedUser?.email}</strong>؟
              <br />
              <span className="text-red-600 font-bold">تحذير: سيتم حذف جميع بياناته وعقاراته بشكل نهائي!</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} className="bg-red-600 hover:bg-red-700">
              حذف نهائياً
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AlertDialog: تأكيد الحظر */}
      <AlertDialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-orange-600">
              <Ban className="h-5 w-5" />
              تأكيد حظر المستخدم
            </AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حظر المستخدم <strong>{selectedUser?.full_name || selectedUser?.email}</strong> من النشر؟
              <br />
              <span className="text-orange-600">سيتم إخفاء جميع عقاراته وتعطيل قدرته على النشر.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleBanUser} className="bg-orange-600 hover:bg-orange-700">
              حظر من النشر
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default UsersView;
