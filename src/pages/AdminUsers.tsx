import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  UserPlus, Loader2, Ban, CheckCircle, ArrowLeft, LayoutGrid, List,
} from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  RoleBadge, PropertyLimitBadge, UserStatusBadge, UsersFilters, UsersStats,
} from "@/components/Users";
import { UserCard } from "@/components/Users/UserCard";
import { Helmet } from "react-helmet-async";

// ─── Types ───
interface UserWithPermissions {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  role: 'admin' | 'office' | 'agent' | 'publisher';
  role_name_ar: string;
  properties_count: number;
  properties_limit: number;
  images_limit: number;
  can_publish: boolean;
  is_verified: boolean;
  is_active: boolean;
  status_indicator: string;
  account_created: string;
  last_sign_in_at: string | null;
}

const isRole = (r: unknown): r is UserWithPermissions['role'] =>
  typeof r === 'string' && ['admin', 'office', 'agent', 'publisher'].includes(r as string);

// ─── Component ───
export default function AdminUsers() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin } = useAuth();

  const [users, setUsers] = useState<UserWithPermissions[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Ban dialog
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithPermissions | null>(null);
  const [isBanLoading, setIsBanLoading] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const perPage = 20;

  // ─── Fetch users via RPC ───
  const fetchUsers = useCallback(async () => {
    if (!isAdmin) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_users_for_admin_v2');
      if (error) throw error;

      const mapped: UserWithPermissions[] = (data ?? []).map((row: Record<string, unknown>) => {
        const castRole: UserWithPermissions['role'] = isRole(row.role) ? row.role : 'publisher';
        const u: UserWithPermissions = {
          id: row.id as string,
          email: (row.email as string) || '',
          full_name: (row.full_name as string) || 'مستخدم جديد',
          phone: (row.phone as string) || null,
          role: castRole,
          role_name_ar: (row.role_name_ar as string) || '👤 ناشر',
          properties_count: (row.properties_count as number) ?? 0,
          properties_limit: (row.properties_limit as number) ?? 3,
          images_limit: (row.images_limit as number) ?? 10,
          can_publish: (row.can_publish as boolean) ?? true,
          is_verified: (row.is_verified as boolean) ?? false,
          is_active: (row.is_active as boolean) ?? true,
          status_indicator: (row.status_indicator as string) || '',
          account_created: row.account_created as string,
          last_sign_in_at: (row.last_sign_in_at as string) ?? null,
        };
        if (castRole === 'admin') {
          u.properties_limit = -1;
          u.can_publish = true;
          u.is_verified = true;
          u.is_active = true;
        }
        return u;
      });

      setUsers(mapped);
    } catch (err) {
      console.error('Fetch users error:', err);
      toast({ title: "خطأ", description: "فشل تحميل المستخدمين", variant: "destructive" });
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin, toast]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // ─── Stats ───
  const stats = useMemo(() => ({
    total: users.length,
    admins: users.filter(u => u.role === 'admin').length,
    offices: users.filter(u => u.role === 'office').length,
    agents: users.filter(u => u.role === 'agent').length,
    publishers: users.filter(u => u.role === 'publisher').length,
    verified: users.filter(u => u.is_verified).length,
    banned: users.filter(u => !u.can_publish).length,
  }), [users]);

  // ─── Filter ───
  const filtered = useMemo(() => {
    let result = users;
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      result = result.filter(u =>
        u.email.toLowerCase().includes(s) ||
        u.full_name?.toLowerCase().includes(s) ||
        u.phone?.includes(s)
      );
    }
    if (roleFilter !== 'all') result = result.filter(u => u.role === roleFilter);
    if (statusFilter === 'active') result = result.filter(u => u.can_publish && u.is_active);
    else if (statusFilter === 'banned') result = result.filter(u => !u.can_publish);
    else if (statusFilter === 'verified') result = result.filter(u => u.is_verified);
    else if (statusFilter === 'unverified') result = result.filter(u => !u.is_verified);
    return result;
  }, [users, searchTerm, roleFilter, statusFilter]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  useEffect(() => { setPage(1); }, [searchTerm, roleFilter, statusFilter]);

  // ─── Ban toggle ───
  const handleBanToggle = async () => {
    if (!selectedUser) return;
    setIsBanLoading(true);
    try {
      const shouldBan = selectedUser.can_publish;
      const { error } = await supabase.rpc('toggle_user_ban', {
        target_user_id: selectedUser.id,
        should_ban: shouldBan,
      });
      if (error) throw error;
      toast({
        title: "✅ تم بنجاح",
        description: shouldBan ? `تم حظر ${selectedUser.email}` : `تم إلغاء حظر ${selectedUser.email}`,
      });
      await fetchUsers();
      setBanDialogOpen(false);
      setSelectedUser(null);
    } catch (err) {
      toast({ title: "خطأ", description: err instanceof Error ? err.message : "فشل العملية", variant: "destructive" });
    } finally {
      setIsBanLoading(false);
    }
  };

  // ─── Role change ───
  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase.rpc('set_user_role', { target_user_id: userId, new_role: newRole });
      if (error) throw error;
      toast({ title: '✅ تم بنجاح', description: 'تم تحديث دور المستخدم' });
      await fetchUsers();
    } catch (err) {
      toast({ title: "خطأ", description: err instanceof Error ? err.message : "فشل التحديث", variant: "destructive" });
    }
  };

  if (!isAdmin) {
    return <div className="container mx-auto p-6 text-destructive">ليس لديك صلاحية</div>;
  }

  return (
    <>
      <Helmet>
        <title>إدارة المستخدمين - سكني</title>
        <meta name="description" content="إدارة شاملة لجميع المستخدمين والأدوار والصلاحيات في تطبيق سكني" />
      </Helmet>

      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                إدارة المستخدمين والصلاحيات
              </h1>
              <p className="text-muted-foreground mt-1">مصدر بيانات موحد • {users.length} مستخدم</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={() => setViewMode(v => v === 'table' ? 'grid' : 'table')} title="تبديل العرض">
                {viewMode === 'table' ? <LayoutGrid className="h-4 w-4" /> : <List className="h-4 w-4" />}
              </Button>
              <Button variant="outline" onClick={() => navigate('/dashboard')}>
                <ArrowLeft className="ml-2 h-4 w-4" /> العودة
              </Button>
              <Button onClick={() => navigate('/admin/add-user')} className="bg-gradient-to-r from-primary to-primary/80">
                <UserPlus className="ml-2 h-4 w-4" /> إضافة مستخدم
              </Button>
            </div>
          </div>

          <UsersStats {...stats} />
        </div>

        {/* Filters */}
        <UsersFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          roleFilter={roleFilter}
          onRoleFilterChange={setRoleFilter}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
        />

        {/* Content */}
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : viewMode === 'grid' ? (
          /* Grid View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paged.map(user => (
              <UserCard
                key={user.id}
                user={{
                  ...user,
                  address: null,
                  created_at: user.account_created,
                }}
                onBanToggle={(u) => { setSelectedUser(user); setBanDialogOpen(true); }}
                onEdit={(u) => handleRoleChange(u.id, u.role)}
              />
            ))}
            {paged.length === 0 && (
              <div className="col-span-full text-center py-8 text-muted-foreground">لا توجد نتائج مطابقة</div>
            )}
          </div>
        ) : (
          /* Table View */
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>البريد</TableHead>
                  <TableHead>الاسم</TableHead>
                  <TableHead>الدور</TableHead>
                  <TableHead>العقارات</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>آخر دخول</TableHead>
                  <TableHead className="text-center">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">لا توجد نتائج</TableCell>
                  </TableRow>
                ) : paged.map(u => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium text-sm">{u.email}</TableCell>
                    <TableCell>{u.full_name}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 items-start">
                        <RoleBadge role={u.role} variant="compact" />
                        <Select value={u.role} onValueChange={(v) => handleRoleChange(u.id, v)}>
                          <SelectTrigger className="w-40 h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">👑 مدير</SelectItem>
                            <SelectItem value="office">🏢 مكتب</SelectItem>
                            <SelectItem value="agent">🏆 وكيل</SelectItem>
                            <SelectItem value="publisher">👤 ناشر</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </TableCell>
                    <TableCell>
                      <PropertyLimitBadge current={u.properties_count} limit={u.properties_limit} imagesLimit={u.images_limit} role={u.role} />
                    </TableCell>
                    <TableCell>
                      <UserStatusBadge isActive={u.is_active} canPublish={u.can_publish} isVerified={u.is_verified} />
                    </TableCell>
                    <TableCell className="text-xs">
                      {u.last_sign_in_at
                        ? new Date(u.last_sign_in_at).toLocaleString('ar-SA', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
                        : 'لم يسجل دخول'}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => { setSelectedUser(u); setBanDialogOpen(true); }}
                        className={u.can_publish ? 'text-destructive' : 'text-green-600'}
                      >
                        {u.can_publish ? <><Ban className="ml-1 h-4 w-4" /> حظر</> : <><CheckCircle className="ml-1 h-4 w-4" /> إلغاء حظر</>}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>السابق</Button>
            <span className="flex items-center text-sm text-muted-foreground">{page} / {totalPages}</span>
            <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>التالي</Button>
          </div>
        )}
      </div>

      {/* Ban Dialog */}
      <AlertDialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{selectedUser?.can_publish ? 'حظر المستخدم' : 'إلغاء الحظر'}</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedUser?.can_publish
                ? `هل أنت متأكد من حظر ${selectedUser?.email}؟`
                : `هل أنت متأكد من إلغاء حظر ${selectedUser?.email}؟`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBanLoading}>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleBanToggle} disabled={isBanLoading}>
              {isBanLoading ? <><Loader2 className="ml-2 h-4 w-4 animate-spin" /> جاري...</> : 'تأكيد'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
