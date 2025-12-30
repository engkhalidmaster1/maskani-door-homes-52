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
import { Toaster } from "@/components/ui/toaster";
import type { Database } from '@/integrations/supabase/types';
import type { AppRole } from '@/types/appRoles';

// Local UserData type definition
type UserData = {
  id: string;
  email?: string | null;
  full_name?: string | null;
  phone?: string | null;
  address?: string | null;
  role?: AppRole;
  is_active?: boolean;
  is_verified?: boolean;
  can_publish?: boolean;
  properties_count?: number;
  properties_limit?: number;
  images_limit?: number;
  account_created?: string | null;
  last_sign_in_at?: string | null;
  status_indicator?: string | null;
};
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/hooks/useAuth';
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
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

export const UsersView = () => {
  const { toast } = useToast();

  // Data and UI state
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [propertiesFilter, setPropertiesFilter] = useState<string>('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;

  // Dialogs
  const [viewDialogOpen, setViewDialogOpen] = useState<boolean>(false);
  const [editDialogOpen, setEditDialogOpen] = useState<boolean>(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [banDialogOpen, setBanDialogOpen] = useState<boolean>(false);

  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [userProperties, setUserProperties] = useState<Database['public']['Tables']['properties']['Row'][]>([]);

  const [editForm, setEditForm] = useState<{
    full_name: string;
    phone: string;
    address: string;
    role: AppRole;
  }>({
    full_name: '',
    phone: '',
    address: '',
    role: 'publisher',
  });

  const { user } = useAuth();

  // Type for rows returned from the `users_with_permissions` view
  type UsersWithPermissionsRow = {
    id: string;
    email?: string | null;
    full_name?: string | null;
    phone?: string | null;
    role?: AppRole;
    properties_count?: number;
    properties_limit?: number;
    images_limit?: number;
    can_publish?: boolean;
    is_verified?: boolean;
    is_active?: boolean;
    role_name_ar?: string | null;
    status_indicator?: string | null;
    account_created?: string | null;
    last_sign_in_at?: string | null;
  };

  // Helper: extract numeric limit value from JSON limits safely
  const getLimitNumber = (limits: Database['public']['Tables']['user_permissions']['Row']['limits'], key: string, fallback: number) => {
  try {
  if (!limits || typeof limits !== 'object') return fallback;
  const val = (limits as Record<string, unknown>)[key];
      if (typeof val === 'number') return val;
      if (typeof val === 'string' && !isNaN(Number(val))) return Number(val);
      return fallback;
    } catch {
      return fallback;
    }
  };

  const computeLimitsForRole = (role: AppRole) => {
    switch (role) {
      case 'admin':
        return { properties: -1, images_per_property: -1, featured_properties: -1, storage_mb: -1 };
      case 'office':
        return { properties: -1, images_per_property: 10, featured_properties: 50, storage_mb: 5000 };
      case 'agent':
        return { properties: 10, images_per_property: 10, featured_properties: 3, storage_mb: 500 };
      default:
        return { properties: 3, images_per_property: 10, featured_properties: 0, storage_mb: 100 };
    }
  };

  // Fetch users using the secure RPC
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data: users, error } = await supabase.rpc('get_users_for_admin_v2');
      if (error) throw error;
      setUsers((users as UserData[]) || []);
    } catch (err: unknown) {
      console.error('fetchUsers error:', err);
      if (err instanceof Error) {
        toast({ title: 'خطأ', description: err.message, variant: 'destructive' });
      } else {
        toast({ title: 'خطأ', description: 'فشل جلب المستخدمين', variant: 'destructive' });
      }
    } finally {
      setLoading(false);
    }
  };

  // fetch once on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchUsers(); }, []);

  // Actions
  const handleViewUser = async (user: UserData) => {
    setSelectedUser(user);
    try {
      const { data: properties, error } = await supabase
        .from('properties')
        .select('*')
        .eq('user_id', user.id);
      if (error) throw error;
      setUserProperties((properties as Database['public']['Tables']['properties']['Row'][] ) || []);
      setViewDialogOpen(true);
    } catch (err) {
      console.error('handleViewUser error:', err);
    }
  };

  const handleEditUser = async (user: UserData) => {
    setSelectedUser(user);
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('full_name, phone, address')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      setEditForm({
        full_name: profile?.full_name ?? user.full_name ?? '',
        phone: profile?.phone ?? user.phone ?? '',
        address: profile?.address ?? '',
        role: user.role ?? 'publisher',
      });
    } catch (err) {
      // fallback to minimal data
      setEditForm({ full_name: user.full_name ?? '', phone: user.phone ?? '', address: '', role: user.role ?? 'publisher' });
    } finally {
      setEditDialogOpen(true);
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedUser) return;
    try {
      // upsert profile (create or update)
      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert({ user_id: selectedUser.id, full_name: editForm.full_name, phone: editForm.phone, address: editForm.address });
      if (upsertError) throw upsertError;

      // change role by updating/ upserting user_permissions directly (RPC removed)
      const newLimits = computeLimitsForRole(editForm.role);
      const promoteVerified = ['agent', 'office', 'admin'].includes(editForm.role as string);
      const upsertPayload: {
        user_id: string;
        role: AppRole;
        limits: Record<string, number>;
        is_verified?: boolean;
      } = {
        user_id: selectedUser.id,
        role: editForm.role,
        limits: newLimits,
      };
      if (promoteVerified) {
        upsertPayload.is_verified = true;
      }

      const { error: roleError } = await supabase
        .from('user_permissions')
        .upsert([upsertPayload]);
      if (roleError) throw roleError;

      toast({ title: 'تم التحديث', description: 'تم حفظ التغييرات' });
      setEditDialogOpen(false);
      fetchUsers();
    } catch (err) {
      console.error('handleSaveEdit error:', err);
      toast({ title: 'خطأ', description: 'فشل حفظ التغييرات', variant: 'destructive' });
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    const userId = selectedUser.id;

    const cleanupRelatedTables = async (id: string) => {
      const tables = [
        { name: 'properties', label: 'العقارات' },
        { name: 'favorites', label: 'المفضلات' },
        { name: 'user_statuses', label: 'الحالة' },
        { name: 'user_roles', label: 'الأدوار' },
        { name: 'user_permissions', label: 'الصلاحيات' },
        { name: 'profiles', label: 'الملف الشخصي' },
      ];

      for (const table of tables) {
        const { error: cleanupError } = await supabase
          .from(table.name as 'properties' | 'favorites' | 'user_statuses' | 'user_roles' | 'user_permissions' | 'profiles')
          .delete()
          .eq('user_id', id);

        if (cleanupError) {
          console.error(`handleDeleteUser cleanup ${table.label} error:`, cleanupError);
        }
      }
    };

    try {
      const { error: fnError } = await supabase.functions.invoke('admin-delete-user', {
        body: JSON.stringify({ userId }),
      });

      if (fnError) {
        throw fnError;
      }

      toast({ title: 'تم الحذف', description: 'تم حذف المستخدم من نظام المصادقة وجميع البيانات المرتبطة.' });
    } catch (err) {
      console.warn('handleDeleteUser: admin-delete-user function failed, falling back to manual cleanup.', err);
      await cleanupRelatedTables(userId);
      toast({
        title: 'تم حذف البيانات',
        description: 'تم حذف بيانات المستخدم من الجداول المتاحة، وستحتاج إلى حذف الحساب من auth يدوياً.',
      });
    } finally {
      setDeleteDialogOpen(false);
      fetchUsers();
    }
  };

  const handleBanUser = async () => {
    if (!selectedUser) return;
    try {
      // Use the secure RPC function instead of direct table update
      const { error } = await supabase.rpc('toggle_user_ban', {
        target_user_id: selectedUser.id,
        should_ban: true
      });

      if (error) throw error;

      toast({ title: 'تم الحظر', description: 'تم حظر المستخدم وإخفاء عقاراته' });
      setBanDialogOpen(false);
      fetchUsers();
    } catch (err) {
      console.error('handleBanUser error:', err);
      toast({ title: 'خطأ', description: 'فشل حظر المستخدم', variant: 'destructive' });
    }
  };

  const handleRoleChange = async (userId: string, newRole: AppRole) => {
    try {
      // Use the secure RPC function instead of direct table update
      const { error } = await supabase.rpc('set_user_role', {
        target_user_id: userId,
        new_role: newRole
      });

      if (error) throw error;

      toast({ title: 'تم التحديث', description: 'تم تحديث دور المستخدم' });
      fetchUsers();
    } catch (err) {
      console.error('handleRoleChange error:', err);
      toast({ title: 'خطأ', description: 'فشل تحديث الدور', variant: 'destructive' });
    }
  };

  // Filtering and pagination
  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return users.filter((u) => {
      if (roleFilter !== 'all' && u.role !== roleFilter) return false;
      if (statusFilter !== 'all' && u.status_indicator !== statusFilter) return false;
      if (propertiesFilter === 'max') {
        // show those who reached limit
        if (u.properties_limit === -1) return false;
        if (u.properties_count < u.properties_limit) return false;
      }
      if (q) {
        if ((u.email || '').toLowerCase().includes(q)) return true;
        if ((u.full_name || '').toLowerCase().includes(q)) return true;
        if ((u.phone || '').toLowerCase().includes(q)) return true;
        return false;
      }
      return true;
    });
  }, [users, searchQuery, roleFilter, statusFilter, propertiesFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / itemsPerPage));
  const paginatedUsers = useMemo(() => filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage), [filteredUsers, currentPage]);

  const stats = useMemo(() => ({
    total: users.length,
    admins: users.filter(u => u.role === 'admin').length,
    offices: users.filter(u => u.role === 'office').length,
    agents: users.filter(u => u.role === 'agent').length,
    publishers: users.filter(u => u.role === 'publisher').length,
    verified: users.filter(u => u.is_verified).length,
    banned: users.filter(u => !u.can_publish).length,
  }), [users]);

  const handleUnbanUser = async () => {
    if (!selectedUser) return;
    try {
      // Use the secure RPC function instead of direct table update
      const { error } = await supabase.rpc('toggle_user_ban', {
        target_user_id: selectedUser.id,
        should_ban: false
      });

      if (error) throw error;

      toast({ title: 'تم إلغاء الحظر', description: 'تم إلغاء حظر المستخدم وإظهار عقاراته' });
      fetchUsers();
    } catch (err) {
      console.error('handleUnbanUser error:', err);
      toast({ title: 'خطأ', description: 'فشل إلغاء حظر المستخدم', variant: 'destructive' });
    }
  };

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
      <Toaster />
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-3 rounded-xl shadow-lg">
              <Users className="h-8 w-8 text-white" />
            </div>
            <div>
            <h1 className="text-3xl font-bold text-gray-900">إدارة المستخدمين</h1>
            <p className="text-sm text-gray-600">إدارة شاملة للمستخدمين والأدوار والصلاحيات</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Input placeholder="ابحث باسم أو بريد أو هاتف" value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }} />
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الحالات</SelectItem>
                <SelectItem value="publisher">ناشر</SelectItem>
                <SelectItem value="trusted_owner">مالك موثوق</SelectItem>
                <SelectItem value="office_agent">مكتب</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <p className="text-sm text-muted-foreground">إجمالي المستخدمين</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-purple-600">{stats.admins}</div>
              <p className="text-sm text-muted-foreground">المديرون</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{stats.offices}</div>
              <p className="text-sm text-muted-foreground">المكاتب</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-orange-600">{stats.agents}</div>
              <p className="text-sm text-muted-foreground">الوكلاء</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-gray-600">{stats.publishers}</div>
              <p className="text-sm text-muted-foreground">الناشرون</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-emerald-600">{stats.verified}</div>
              <p className="text-sm text-muted-foreground">موثقون</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-red-600">{stats.banned}</div>
              <p className="text-sm text-muted-foreground">محظورون</p>
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle>المستخدمون ({filteredUsers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-lg border bg-white shadow">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>المستخدم</TableHead>
                    <TableHead>البريد الإلكتروني</TableHead>
                    <TableHead>الهاتف</TableHead>
                    <TableHead>النوع</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>العقارات</TableHead>
                    <TableHead className="text-center">إجراءات</TableHead>
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
                        <div className="flex flex-col gap-2">
                          <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                            {user.role === 'admin' ? '👨‍💼 مدير' : user.role === 'office' ? '🏢 مكتب' : user.role === 'agent' ? '🏆 وكيل' : '👤 ناشر'}
                          </Badge>
                          <Select 
                            value={user.role} 
                            onValueChange={(value: AppRole) => handleRoleChange(user.id, value)}
                            disabled={user.email === 'eng.khalid.work@gmail.com'} // Protect super admin
                          >
                            <SelectTrigger className="w-32 h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="publisher">👤 ناشر</SelectItem>
                              <SelectItem value="agent">🏆 وكيل</SelectItem>
                              <SelectItem value="office">🏢 مكتب</SelectItem>
                              <SelectItem value="admin">👨‍💼 مدير</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </TableCell>
                      <TableCell>
                        {user.can_publish === false ? (
                          <Badge variant="destructive">🚫 محظور</Badge>
                        ) : (
                          <Badge variant="outline">👤 ناشر</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{user.properties_count} / {user.properties_limit}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Button size="sm" variant="ghost" onClick={() => handleViewUser(user)} title="عرض التفاصيل"><Eye className="h-4 w-4" /></Button>
                          <Button size="sm" variant="ghost" onClick={() => handleEditUser(user)} title="تعديل"><Edit3 className="h-4 w-4" /></Button>
                          {user.can_publish === false ? (
                            <Button size="sm" variant="ghost" className="text-green-600" onClick={() => { setSelectedUser(user); handleUnbanUser(); }} title="إلغاء حظر"><UserCheck className="h-4 w-4" /></Button>
                          ) : (
                            <Button size="sm" variant="ghost" className="text-orange-600" onClick={() => { setSelectedUser(user); setBanDialogOpen(true); }} title="حظر"><Ban className="h-4 w-4" /></Button>
                          )}
                          <Button size="sm" variant="ghost" className="text-red-600" onClick={() => { setSelectedUser(user); setDeleteDialogOpen(true); }} title="حذف"><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Empty state */}
            {paginatedUsers.length === 0 && (
              <div className="text-center py-12">
                <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-lg text-gray-500">لا توجد نتائج</p>
                <p className="text-sm text-gray-400 mt-2">جرب تعديل الفلاتر أو البحث</p>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6 pt-6 border-t">
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1}><ChevronRight className="h-4 w-4" /> السابق</Button>
                <div className="flex gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <Button key={pageNum} variant={currentPage === pageNum ? 'default' : 'outline'} size="sm" onClick={() => setCurrentPage(pageNum)} className="min-w-[40px]">{pageNum}</Button>
                  ))}
                </div>
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages}>التالي <ChevronLeft className="h-4 w-4" /></Button>
                <div className="mr-4 text-sm text-gray-600">صفحة {currentPage} من {totalPages} ({filteredUsers.length} مستخدم)</div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* View dialog */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><Eye className="h-5 w-5" /> تفاصيل المستخدم</DialogTitle>
              <DialogDescription>معلومات المستخدم وعقاراته</DialogDescription>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">المعلومات الشخصية</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-2"><Users className="h-4 w-4 text-muted-foreground" /><span className="font-medium">الاسم:</span><span>{selectedUser.full_name || 'غير محدد'}</span></div>
                      <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" /><span className="font-medium">البريد:</span><span className="truncate">{selectedUser.email}</span></div>
                      <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" /><span className="font-medium">الهاتف:</span><span>{selectedUser.phone || 'غير محدد'}</span></div>
                      <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-muted-foreground" /><span className="font-medium">تاريخ التسجيل:</span><span>{format(new Date(selectedUser.account_created), 'dd MMMM yyyy', { locale: ar })}</span></div>
                      <div className="flex items-center gap-2"><span className="font-medium">الدور:</span><Badge variant={selectedUser.role === 'admin' ? 'default' : 'secondary'}>{selectedUser.role === 'admin' ? '👑 مدير' : '👤 مستخدم'}</Badge></div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2"><Building2 className="h-5 w-5" /> العقارات ({userProperties.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {userProperties.length > 0 ? (
                      <div className="space-y-3">
                        {userProperties.map((property) => (
                          <div key={property.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex-1"><h4 className="font-medium">{property.title}</h4><p className="text-sm text-muted-foreground">{property.location}</p></div>
                            <Badge variant={property.is_published ? 'default' : 'secondary'}>{property.is_published ? 'منشور' : 'مخفي'}</Badge>
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

        {/* Edit dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><Edit3 className="h-5 w-5" /> تعديل بيانات المستخدم</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div><label className="text-sm font-medium">الاسم الكامل</label><Input value={editForm.full_name} onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })} placeholder="الاسم الكامل" /></div>
              <div><label className="text-sm font-medium">رقم الهاتف</label><Input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} placeholder="رقم الهاتف" /></div>
              <div><label className="text-sm font-medium">العنوان</label><Input value={editForm.address} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} placeholder="العنوان" /></div>
              <div><label className="text-sm font-medium">الدور</label><Select value={editForm.role} onValueChange={(v: AppRole) => setEditForm({ ...editForm, role: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="publisher">ناشر</SelectItem><SelectItem value="agent">وكيل</SelectItem><SelectItem value="office">مكتب</SelectItem><SelectItem value="admin">مدير</SelectItem></SelectContent></Select></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>إلغاء</Button>
              <Button onClick={handleSaveEdit}>حفظ التغييرات</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete confirm */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-red-600"><Trash2 className="h-5 w-5" /> تأكيد حذف المستخدم</AlertDialogTitle>
              <AlertDialogDescription>هل أنت متأكد؟ سيتم حذف جميع بيانات المستخدم.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>إلغاء</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteUser} className="bg-red-600 hover:bg-red-700">حذف نهائياً</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Ban confirm */}
        <AlertDialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-orange-600"><Ban className="h-5 w-5" /> تأكيد حظر المستخدم</AlertDialogTitle>
              <AlertDialogDescription>هل تريد حظر المستخدم من النشر وإخفاء عقاراته؟</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>إلغاء</AlertDialogCancel>
              <AlertDialogAction onClick={handleBanUser} className="bg-orange-600 hover:bg-orange-700">حظر من النشر</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

      </div>
    </div>
  );
};

export default UsersView;
