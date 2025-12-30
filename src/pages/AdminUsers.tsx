import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from '@/integrations/supabase/types';
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  UserPlus,
  Loader2,
  Ban,
  CheckCircle,
  ArrowLeft,
} from "lucide-react";
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
  RoleBadge, 
  PropertyLimitBadge, 
  UserStatusBadge,
  UsersFilters,
  UsersStats 
} from "@/components/Users";
import Subscribers from "./Subscribers";

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

// Local helpers to avoid liberal `any` usage and to narrow role strings
type PermLimits = { properties?: number; images_per_property?: number; storage_mb?: number };
type PermRow = { user_id: string; role?: string; properties_count?: number; limits?: PermLimits; can_publish?: boolean; is_verified?: boolean; is_active?: boolean; last_sign_in_at?: string | null };
type ProfileRow = { user_id: string; full_name?: string | null; phone?: string | null; email?: string | null; created_at?: string | null };
type AuthUserRow = { id: string; email?: string | null; created_at?: string | null; last_sign_in_at?: string | null; user_metadata?: Record<string, unknown> };
type GetUsersForAdminRow = {
  id: string;
  email?: string | null;
  full_name?: string | null;
  phone?: string | null;
  role?: string | null;
  properties_count?: number | null;
  images_limit?: number | null;
  properties_limit?: number | null;
  can_publish?: boolean | null;
  is_verified?: boolean | null;
  is_active?: boolean | null;
  role_name_ar?: string | null;
  status_indicator?: string | null;
  account_created?: string | null;
  last_sign_in_at?: string | null;
  limits?: PermLimits;
};


const isRole = (r: unknown): r is UserWithPermissions['role'] => typeof r === 'string' && ['admin','office','agent','publisher'].includes(r as string);

export default function AdminUsers() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAdmin } = useAuth();
  
  const [users, setUsers] = useState<UserWithPermissions[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserWithPermissions[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<"users" | "subscribers">("users");
  
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithPermissions | null>(null);
  const [isBanLoading, setIsBanLoading] = useState(false);

  

  // دالة لإنشاء السجلات المفقودة
  const createMissingRecords = async (userId: string, userEmail: string) => {
    try {
      // إنشاء profile إذا لم يوجد
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id: userId,
          email: userEmail,
          full_name: 'مستخدم جديد'
        });
      
      if (profileError && !profileError.message.includes('duplicate')) {
        console.error('Error creating profile:', profileError);
      }

      // إنشاء user_permissions إذا لم توجد
      const { error: permError } = await supabase
        .from('user_permissions')
        .insert({
          user_id: userId,
          role: 'publisher',
          properties_count: 0,
          can_publish: true,
          is_verified: false,
          is_active: true,
          limits: { properties: 3, images_per_property: 10, storage_mb: 200 }
        });

      if (permError && !permError.message.includes('duplicate')) {
        console.error('Error creating permissions:', permError);
      }

      // Ensure a default user_status row exists (publisher defaults)
      const { error: statusErr } = await supabase
        .from('user_statuses')
        .insert({
          user_id: userId,
          status: 'publisher',
          properties_limit: 3,
          images_limit: 10,
          can_publish: true,
          is_verified: false,
        });

      if (statusErr && !statusErr.message.includes('duplicate')) {
        console.error('Error creating user_status:', statusErr);
      }
    } catch (error) {
      console.error('Error in createMissingRecords:', error);
    }
  };

  // حساب الإحصائيات
  const stats = useMemo(() => ({
    total: users.length,
    admins: users.filter(u => u.role === 'admin').length,
    offices: users.filter(u => u.role === 'office').length,
    agents: users.filter(u => u.role === 'agent').length,
    publishers: users.filter(u => u.role === 'publisher').length,
    verified: users.filter(u => u.is_verified).length,
    banned: users.filter(u => !u.can_publish).length,
  }), [users]);

  // جلب المستخدمين مع معلومات الصلاحيات والدور
  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      // If current user is an admin, try RPCs (v2 preferred) first (secure, definer-run)
      // Edge Function commented out due to deployment issues
      /*
      if (isAdmin) {
        
        try {
          const { data: fnData, error: fnError } = await supabase.functions.invoke('admin-list-users', { body: {} });

          if (!fnError && fnData?.users) {
            const authUsers = (fnData.users ?? []) as AuthUserRow[];
            const ids = authUsers.map(u => u.id);

            // Fetch profiles and permissions for these users (merge on client)
            const { data: profilesForIds } = await supabase
              .from('profiles')
              .select('*')
              .in('user_id', ids);

            const { data: permsForIds } = await supabase
              .from('user_permissions')
              .select('*')
              .in('user_id', ids);

            const allUsers = authUsers.map((row) => {
                const profileFound = ((profilesForIds ?? []) as ProfileRow[]).find((p) => p.user_id === row.id) as ProfileRow | undefined;
                const perms = (permsForIds ?? []) as PermRow[];
                const perm = perms.find((p) => p.user_id === row.id) as PermRow | undefined;
                const castRole: UserWithPermissions['role'] = isRole(perm?.role) ? perm.role : 'publisher';
              const metaFullName = (() => {
                const meta = row.user_metadata as Record<string, unknown> | undefined;
                if (!meta) return undefined;
                const fn = meta['full_name'];
                return typeof fn === 'string' ? fn : undefined;
              })();

              const userObj: UserWithPermissions = {
                id: row.id,
                email: row.email || '',
                full_name: profileFound?.full_name ?? metaFullName ?? 'مستخدم جديد',
                phone: profileFound?.phone || null,
                role: castRole,
                role_name_ar: perm?.role === 'admin' ? '👑 مدير (بدون حدود)' : perm?.role === 'office' ? '🏢 مكتب' : perm?.role === 'agent' ? '🧑‍💼 وسيط' : '👤 ناشر عادي',
                properties_count: perm?.properties_count ?? 0,
                properties_limit: (perm?.limits as PermLimits)?.properties ?? 3,
                images_limit: (perm?.limits as PermLimits)?.images_per_property ?? 10,
                can_publish: perm?.can_publish ?? true,
                is_verified: perm?.is_verified ?? false,
                is_active: perm?.is_active ?? true,
                status_indicator: perm?.is_active ? 'نشط' : 'محظور',
                account_created: row.created_at,
                last_sign_in_at: row.last_sign_in_at ?? null,
              };

              // Force unlimited for admin users (or for the protected super-admin email)
              if (castRole === 'admin' || row.email === 'eng.khalid.work@gmail.com') {
                userObj.properties_limit = -1;
                userObj.role_name_ar = '👑 مدير (بدون حدود)';
                userObj.can_publish = true;
                userObj.is_verified = true;
                userObj.is_active = true;
              }

              return userObj;
            });

            setUsers(allUsers);
            setFilteredUsers(allUsers);
            setIsLoading(false);
            return;
          }
          if (fnError) {
            console.warn('admin-list-users function error:', fnError);
            toast({
              title: 'خطأ في دالة الخادم',
              description: `admin-list-users: ${fnError?.message ?? JSON.stringify(fnError)}`,
              variant: 'destructive'
            });
          }
        } catch (fnErr) {
          console.warn('admin-list-users function error:', fnErr);
        }

        // If Edge Function not available or failed, try RPCs (v2 preferred) first (secure, definer-run)
      */
      if (isAdmin) {
        let rpcRows: GetUsersForAdminRow[] | null = null;
  const rpcCandidates: Array<keyof Database['public']['Functions']> = ['get_users_for_admin_v2', 'get_users_for_admin'];
        for (const rpcName of rpcCandidates) {
          try {
            const { data: rpcData, error: rpcError } = await supabase.rpc(rpcName);
            if (!rpcError && rpcData) {
              rpcRows = (rpcData ?? []) as GetUsersForAdminRow[];
              console.log(`Admin users loaded via RPC: ${rpcName}`);
              break;
            }
          } catch (err) {
            console.warn(`RPC ${rpcName} call failed:`, err);
          }
        }

        // If we received RPC errors, surface helpful messages to the admin
        // Try to detect missing RPC vs permission errors and provide migration hints
        const missingHints: Record<string,string> = {
          get_users_for_admin: 'supabase/migrations/20251018004000_get_users_for_admin.sql',
          get_users_for_admin_v2: 'supabase/migrations/20251019090000_create_get_users_for_admin_v2_and_list_dependents.sql'
        };
        // If rpcRows still null, inspect last error via try-catch pattern above
        if (!rpcRows) {
          // Attempt to call each RPC once more to collect last error for messaging
          for (const rpcName of rpcCandidates) {
            try {
              const { error: rpcError } = await supabase.rpc(rpcName);
              if (rpcError) {
                console.warn(`RPC ${rpcName} error detail:`, rpcError);
                const msg = rpcError.message ?? JSON.stringify(rpcError);
                if (msg.toLowerCase().includes('does not exist') || msg.toLowerCase().includes('not found') || String(rpcError?.code).length > 0 && String(rpcError?.code).toLowerCase().includes('404')) {
                  toast({ title: 'دالة مفقودة في القاعدة', description: `الدالة ${rpcName} غير موجودة — شغّل الملف ${missingHints[rpcName]}`, variant: 'destructive' });
                } else if (msg.toLowerCase().includes('not allowed') || msg.toLowerCase().includes('not allowed')) {
                  toast({ title: 'صلاحيات ناقصة', description: `الدالة ${rpcName} رفضت النداء: ${msg}`, variant: 'destructive' });
                } else {
                  toast({ title: `RPC ${rpcName} فشل`, description: msg, variant: 'destructive' });
                }
              }
            } catch (err) {
              // ignore repeated failures
            }
          }
        }

        if (rpcRows) {
          const allUsers = rpcRows.map((row) => {
            const castRole: UserWithPermissions['role'] = isRole(row.role) ? row.role : 'publisher';
            const userObj: UserWithPermissions = {
              id: row.id,
              email: row.email || '',
              full_name: row.full_name || 'مستخدم جديد',
              phone: row.phone,
              role: castRole,
              role_name_ar: row.role_name_ar || '👤 ناشر عادي',
              properties_count: row.properties_count ?? 0,
              properties_limit: row.properties_limit ?? 3,
              images_limit: row.images_limit ?? ((row.limits && row.limits.images_per_property) || 10),
              can_publish: row.can_publish ?? true,
              is_verified: row.is_verified ?? false,
              is_active: row.is_active ?? true,
              status_indicator: row.status_indicator || 'نشط',
              account_created: row.account_created,
              last_sign_in_at: row.last_sign_in_at,
            } as UserWithPermissions;

            // Force unlimited for admin users (or for the protected super-admin email)
            if (castRole === 'admin' || row.email === 'eng.khalid.work@gmail.com') {
              userObj.properties_limit = -1;
              userObj.role_name_ar = '👑 مدير (بدون حدود)';
              userObj.can_publish = true;
              userObj.is_verified = true;
              userObj.is_active = true;
            }

            return userObj;
          });
          setUsers(allUsers);
          setFilteredUsers(allUsers);
          setIsLoading(false);
          return;
        }

        // If RPC not available or failed, fall back to profiles + permissions join
        console.warn('get_users_for_admin RPC failed or missing, falling back to profile join');
        const { data: profilesAll, error: profilesAllErr } = await supabase
          .from('profiles')
          .select('*');
        if (profilesAllErr) {
          console.error('Profiles fetch error (admin fallback):', profilesAllErr);
          setUsers([]);
          setFilteredUsers([]);
          setIsLoading(false);
          return;
        }

        const { data: permissionsAll, error: permissionsAllErr } = await supabase
          .from('user_permissions')
          .select('*');
        if (permissionsAllErr) {
          console.error('Permissions fetch error (admin fallback):', permissionsAllErr);
        }

          const fallbackUsers = (profilesAll ?? []).map((profile: ProfileRow) => {
          const perms = (permissionsAll ?? []) as PermRow[];
          const permRow = perms.find((p) => p.user_id === profile.user_id) as PermRow | undefined;
          const castRole: UserWithPermissions['role'] = isRole(permRow?.role) ? permRow.role : 'publisher';
          const userObj: UserWithPermissions = {
            id: profile.user_id,
            email: profile.email || '',
            full_name: profile.full_name || 'مستخدم جديد',
            phone: profile.phone,
            role: castRole,
            role_name_ar: castRole === 'admin' ? '👑 مدير (بدون حدود)' : castRole === 'office' ? '🏢 مكتب' : castRole === 'agent' ? '🧑‍💼 وسيط' : '👤 ناشر عادي',
            properties_count: permRow?.properties_count ?? 0,
            properties_limit: (permRow?.limits as PermLimits)?.properties ?? 3,
            images_limit: (permRow?.limits as PermLimits)?.images_per_property ?? 10,
            can_publish: permRow?.can_publish ?? true,
            is_verified: permRow?.is_verified ?? false,
            is_active: permRow?.is_active ?? true,
            status_indicator: permRow?.is_active ? 'نشط' : 'محظور',
            account_created: profile.created_at,
            last_sign_in_at: permRow?.last_sign_in_at ?? null,
          } as UserWithPermissions;

          // Force unlimited for admin users (or for the protected super-admin email)
          if (castRole === 'admin' || profile.email === 'eng.khalid.work@gmail.com') {
            userObj.properties_limit = -1;
            userObj.role_name_ar = '👑 مدير (بدون حدود)';
            userObj.can_publish = true;
            userObj.is_verified = true;
            userObj.is_active = true;
          }

          return userObj;
        });
        setUsers(fallbackUsers);
        setFilteredUsers(fallbackUsers);
        setIsLoading(false);
        return;
      }

      // Non-admin: fetch only current user's profile + permissions
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', user?.email);
      if (profilesError) {
        console.error('Profiles fetch error:', profilesError);
        setUsers([]);
        setFilteredUsers([]);
        return;
      }

      const { data: permissions, error: permissionsError } = await supabase
        .from('user_permissions')
        .select('*');
      if (permissionsError) {
        console.error('Permissions fetch error:', permissionsError);
      }

      const allUsers = (profiles ?? []).map(profile => {
        const permsList = (permissions ?? []) as PermRow[];
        const perm = permsList.find((p) => p.user_id === profile.user_id) as PermRow | undefined;
        const castRole: UserWithPermissions['role'] = isRole(perm?.role) ? perm.role : 'publisher';
        const userObj: UserWithPermissions = {
          id: profile.user_id,
          email: profile.email || '',
          full_name: profile.full_name || 'مستخدم جديد',
          phone: profile.phone,
          role: castRole,
          role_name_ar: castRole === 'admin' ? '👑 مدير' : castRole === 'office' ? '🏢 مكتب' : castRole === 'agent' ? '🧑‍💼 وسيط' : '👤 ناشر عادي',
          properties_count: perm?.properties_count ?? 0,
          properties_limit: (perm?.limits as PermLimits)?.properties ?? 3,
          images_limit: (perm?.limits as PermLimits)?.images_per_property ?? 10,
          can_publish: perm?.can_publish ?? true,
          is_verified: perm?.is_verified ?? false,
          is_active: perm?.is_active ?? true,
          status_indicator: perm?.is_active ? 'نشط' : 'محظور',
          account_created: profile.created_at,
          last_sign_in_at: perm?.last_sign_in_at ?? null,
        };

        // Force unlimited for the protected super-admin if detected
        if (user?.email === 'eng.khalid.work@gmail.com' || perm?.role === 'admin') {
          userObj.properties_limit = -1;
          userObj.role_name_ar = '👑 مدير (بدون حدود)';
          userObj.can_publish = true;
          userObj.is_verified = true;
          userObj.is_active = true;
        }

        return userObj;
      });

      setUsers(allUsers);
      setFilteredUsers(allUsers);
      console.log('Profiles loaded (non-admin):', allUsers.length);
        } catch (error: unknown) {
      console.error('Fetch users error:', error);
      setUsers([]);
      setFilteredUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin, user?.email, toast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // تطبيق الفلاتر
  useEffect(() => {
    let filtered = users;

    // فلتر البحث
    if (searchTerm) {
      filtered = filtered.filter(
        (user) =>
          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // فلتر الدور
    if (roleFilter !== 'all') {
      filtered = filtered.filter((user) => user.role === roleFilter);
    }

    // فلتر الحالة
    if (statusFilter === 'active') {
      filtered = filtered.filter((user) => user.can_publish && user.is_active);
    } else if (statusFilter === 'banned') {
      filtered = filtered.filter((user) => !user.can_publish);
    } else if (statusFilter === 'verified') {
      filtered = filtered.filter((user) => user.is_verified);
    }

    setFilteredUsers(filtered);
  }, [searchTerm, roleFilter, statusFilter, users]);

  // حظر/إلغاء حظر مستخدم
  const handleBanToggle = async () => {
    if (!selectedUser) return;

    setIsBanLoading(true);
    try {
      const shouldBan = selectedUser.can_publish; // إذا كان نشط، نحظره

      // Prefer server-side RPC to toggle ban (keeps logic centralized and respects RLS)
      try {
        const { error: rpcErr } = await supabase.rpc('toggle_user_ban', {
          target_user_id: selectedUser.id,
          should_ban: shouldBan,
        });

        if (rpcErr) {
          // Fallback to direct update if RPC not available
          const { error: updErr } = await supabase
            .from('user_permissions')
            .update({
              can_publish: !shouldBan,
              is_active: !shouldBan,
            })
            .eq('user_id', selectedUser.id);
          if (updErr) throw updErr;
        }
      } catch (err) {
        // If RPC fails unexpectedly, try direct update as a last resort
        const { error: updErr } = await supabase
          .from('user_permissions')
          .update({
            can_publish: !shouldBan,
            is_active: !shouldBan,
          })
          .eq('user_id', selectedUser.id);
        if (updErr) throw updErr;
      }

      toast({
        title: "✅ تم بنجاح",
        description: shouldBan
          ? `تم حظر المستخدم ${selectedUser.email}`
          : `تم إلغاء حظر المستخدم ${selectedUser.email}`,
      });

      // تحديث القائمة
      await fetchUsers();
      setBanDialogOpen(false);
      setSelectedUser(null);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      toast({
        title: "خطأ",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsBanLoading(false);
    }
  };

  // تغيير الدور
  const handleRoleChange = async (userId: string, newRole: import('@/types/appRoles').AppRole) => {
    try {
      // Use a server-side RPC so the role change updates both permissions and statuses
      const { error: rpcErr } = await supabase.rpc('set_user_role', { target_user_id: userId, new_role: newRole });
      if (rpcErr) throw rpcErr;

      toast({ title: '✅ تم بنجاح', description: 'تم تحديث دور المستخدم' });
      await fetchUsers();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      toast({
        title: "خطأ",
        description: message,
        variant: "destructive",
      });
    }
  };

  // إضافة ربط تبويب المشتركين
  if (activeTab === "subscribers") {
    return <Subscribers />;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* الترويسة */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              إدارة المستخدمين
            </h1>
            <p className="text-muted-foreground mt-2">
              إدارة شاملة لجميع المستخدمين والأدوار والصلاحيات
            </p>
          </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate('/dashboard')}>
                <ArrowLeft className="ml-2 h-4 w-4" />
                العودة
              </Button>
              {/* مراجعة الأدوار - تم إزالتها (الجلب يتم تلقائياً الآن) */}
              <Button onClick={() => navigate('/admin/add-user')} className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                <UserPlus className="ml-2 h-4 w-4" />
                إضافة مستخدم جديد
              </Button>
            </div>
        </div>

        {/* الإحصائيات */}
          <UsersStats {...stats} />

        {/* مراجعة الأدوار: تم إزالتها من الواجهة. الجلب الآن تلقائي ضمن عملية التحميل. */}
      </div>

      {/* الفلاتر */}
      <UsersFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        roleFilter={roleFilter}
        onRoleFilterChange={setRoleFilter}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
      />

      {/* الجدول */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>البريد الإلكتروني</TableHead>
                <TableHead>الاسم</TableHead>
                <TableHead>الدور</TableHead>
                <TableHead>العقارات</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>آخر دخول</TableHead>
                <TableHead className="text-center">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    لا توجد نتائج مطابقة
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.email}</TableCell>
                    <TableCell>{user.full_name}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 items-start">
                        <RoleBadge role={user.role} />
                        {isAdmin && (
                          <div className="w-44">
                            <Select value={user.role} onValueChange={(value: import('@/types/appRoles').AppRole) => handleRoleChange(user.id, value)}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="admin">👑 مدير (بدون حدود)</SelectItem>
                                <SelectItem value="office">🏢 مكتب</SelectItem>
                                <SelectItem value="agent">🏆 وكيل</SelectItem>
                                <SelectItem value="publisher">👤 ناشر</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <PropertyLimitBadge 
                        current={user.properties_count} 
                        limit={user.properties_limit} 
                        imagesLimit={user.images_limit}
                        role={user.role}
                      />
                    </TableCell>
                    <TableCell>
                      <UserStatusBadge 
                        isActive={user.is_active} 
                        canPublish={user.can_publish} 
                        isVerified={user.is_verified} 
                      />
                    </TableCell>
                    <TableCell>
                      {user.last_sign_in_at
                        ? new Date(user.last_sign_in_at).toLocaleString('ar-SA', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: false,
                          })
                        : 'لم يسجل دخول بعد'}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center gap-2">
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setSelectedUser(user);
                            setBanDialogOpen(true);
                          }}
                          className={user.can_publish ? 'text-destructive' : 'text-success'}
                        >
                          {user.can_publish ? <Ban className="mr-2 h-4 w-4" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                          {user.can_publish ? 'حظر' : 'إلغاء حظر'}
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => navigate(`/admin/edit-user/${user.id}`)}
                        >
                          تعديل
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* حظر/إلغاء حظر مستخدم */}
      <AlertDialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {selectedUser?.can_publish ? 'حظر المستخدم' : 'إلغاء حظر المستخدم'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedUser?.can_publish
                ? `هل أنت متأكد من حظر المستخدم ${selectedUser?.email}؟ لن يتمكن من نشر أو تعديل العقارات.`
                : `هل أنت متأكد من إلغاء حظر المستخدم ${selectedUser?.email}؟ سيتمكن من نشر العقارات مرة أخرى.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBanLoading}>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleBanToggle} disabled={isBanLoading}>
              {isBanLoading ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  جاري المعالجة...
                </>
              ) : (
                'تأكيد'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
