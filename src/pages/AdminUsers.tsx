import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
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

interface UserWithPermissions {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  role: 'admin' | 'office' | 'agent' | 'publisher';
  role_name_ar: string;
  properties_count: number;
  properties_limit: number;
  can_publish: boolean;
  is_verified: boolean;
  is_active: boolean;
  status_indicator: string;
  account_created: string;
  last_sign_in_at: string | null;
}

export default function AdminUsers() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [users, setUsers] = useState<UserWithPermissions[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserWithPermissions[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithPermissions | null>(null);
  const [isBanLoading, setIsBanLoading] = useState(false);

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

  // جلب المستخدمين
  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('users_with_permissions')
        .select('*')
        .order('account_created', { ascending: false });

      if (error) throw error;

      setUsers(data || []);
      setFilteredUsers(data || []);
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

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

      const { error } = await supabase.rpc('toggle_user_ban', {
        target_user_id: selectedUser.id,
        should_ban: shouldBan,
      });

      if (error) throw error;

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
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsBanLoading(false);
    }
  };

  // تغيير الدور
  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase.rpc('update_user_role', {
        target_user_id: userId,
        new_role: newRole,
      });

      if (error) throw error;

      toast({
        title: "✅ تم بنجاح",
        description: "تم تحديث دور المستخدم",
      });

      await fetchUsers();
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    }
  };

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
            <Button onClick={() => navigate('/admin/add-user')} className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
              <UserPlus className="ml-2 h-4 w-4" />
              إضافة مستخدم جديد
            </Button>
          </div>
        </div>

        {/* الإحصائيات */}
        <UsersStats {...stats} />
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
                    لا توجد نتائج
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.email}</TableCell>
                    <TableCell>
                      <div className="font-medium">{user.full_name || '-'}</div>
                      {user.phone && (
                        <div className="text-xs text-muted-foreground" dir="ltr">{user.phone}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={user.role}
                        onValueChange={(value) => handleRoleChange(user.id, value)}
                      >
                        <SelectTrigger className="w-44">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="publisher">👤 ناشر عادي</SelectItem>
                          <SelectItem value="agent">🏆 وكيل عقاري</SelectItem>
                          <SelectItem value="office">🏢 مكتب عقارات</SelectItem>
                          <SelectItem value="admin">🔑 مدير النظام</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <PropertyLimitBadge
                        current={user.properties_count}
                        limit={user.properties_limit}
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
                    <TableCell className="text-sm text-muted-foreground">
                      {user.last_sign_in_at
                        ? new Date(user.last_sign_in_at).toLocaleDateString('ar-SA')
                        : 'لم يدخل بعد'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2 justify-center">
                        <Button
                          size="sm"
                          variant={user.can_publish ? "destructive" : "default"}
                          onClick={() => {
                            setSelectedUser(user);
                            setBanDialogOpen(true);
                          }}
                        >
                          {user.can_publish ? (
                            <>
                              <Ban className="h-4 w-4" />
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4" />
                            </>
                          )}
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

      {/* حوار التأكيد */}
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
