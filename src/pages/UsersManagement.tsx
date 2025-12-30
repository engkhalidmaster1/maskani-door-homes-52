import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { 
  Users, 
  Key, 
  Shield, 
  Search, 
  Eye, 
  EyeOff,
  CheckCircle,
  XCircle,
  RefreshCw,
  Trash2,
  UserX,
  UserCheck,
  Mail
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface UserMetadata {
  full_name?: string;
  status?: 'user' | 'publisher' | 'trusted_owner';
  max_properties?: number;
  max_images_per_property?: number;
}

interface User {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at?: string;
  user_metadata?: {
    full_name?: string;
  };
}

interface UserStatus {
  user_id: string;
  status: string;
  properties_limit: number;
  images_limit: number;
}

export const UsersManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [userStatuses, setUserStatuses] = useState<{ [key: string]: UserStatus }>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const { toast } = useToast();
  const { isAdmin: authIsAdmin, isLoading: authIsLoading } = useAuth();

  // Prefer app-wide auth role to avoid hitting RLS on admin_users
  useEffect(() => {
    // انتظر حتى تنتهي عملية جلب بيانات الصلاحيات
    if (authIsLoading) {
      setLoading(true);
      return;
    }

    setIsAdmin(authIsAdmin);
    setLoading(false);
  }, [authIsAdmin, authIsLoading]);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  const fetchUsers = async () => {
    try {
      setLoading(true);

      // جلب قائمة المستخدمين عبر Edge Function لتجاوز 403
      const { data: fnData, error: fnError } = await supabase.functions.invoke('admin-list-users', { body: {} });

      if (fnError) {
        console.error('Edge function error:', fnError);
        toast({
          title: "❌ خطأ",
          description: "فشل في جلب قائمة المستخدمين (Edge Function)",
          variant: "destructive",
        });
        return;
      }

      setUsers((fnData?.users ?? []) as User[]);

      // جلب حالات المستخدمين
      const { data: statusData } = await supabase
        .from('user_statuses')
        .select('*');

      if (statusData) {
        const statusMap: { [key: string]: UserStatus } = {};
        statusData.forEach((status) => {
          statusMap[status.user_id] = status as UserStatus;
        });
        setUserStatuses(statusMap);
      }

    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "❌ خطأ",
        description: "حدث خطأ أثناء جلب البيانات",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPasswordDialog = (user: User) => {
    setSelectedUser(user);
    setNewPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setShowPasswordDialog(true);
  };

  const handleChangePassword = async () => {
    if (!selectedUser) return;

    // التحقق من صحة البيانات
    if (newPassword.length < 6) {
      toast({
        title: "⚠️ تنبيه",
        description: "كلمة المرور يجب أن تكون 6 أحرف على الأقل",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "⚠️ تنبيه",
        description: "كلمة المرور وتأكيد كلمة المرور غير متطابقتين",
        variant: "destructive",
      });
      return;
    }

    try {
      setChangingPassword(true);

      // تحديث كلمة المرور عبر Edge Function
      const { error } = await supabase.functions.invoke('admin-update-password', {
        body: { userId: selectedUser.id, newPassword },
      });

      if (error) throw error;

      toast({
        title: "✅ نجح",
        description: `تم تغيير كلمة المرور للمستخدم ${selectedUser.email} بنجاح`,
      });

      setShowPasswordDialog(false);
      setSelectedUser(null);
      setNewPassword('');
      setConfirmPassword('');

    } catch (error) {
      console.error('Error changing password:', error);
      const errorMessage = error instanceof Error ? error.message : "فشل في تغيير كلمة المرور";
      toast({
        title: "❌ خطأ",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setChangingPassword(false);
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (!confirm(`هل أنت متأكد من حذف المستخدم: ${user.email}؟\n\nتحذير: سيتم حذف جميع بيانات المستخدم بشكل نهائي!`)) {
      return;
    }

    try {
      // حذف المستخدم عبر Edge Function
      const { error } = await supabase.functions.invoke('admin-delete-user', {
        body: { userId: user.id },
      });

      if (error) throw error;

      toast({
        title: "✅ تم الحذف",
        description: `تم حذف المستخدم ${user.email} بنجاح`,
      });

      // تحديث القائمة
      fetchUsers();

    } catch (error) {
      console.error('Error deleting user:', error);
      const errorMessage = error instanceof Error ? error.message : "فشل في حذف المستخدم";
      toast({
        title: "❌ خطأ",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleSendResetEmail = async (user: User) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      toast({
        title: "✅ تم الإرسال",
        description: `تم إرسال رابط إعادة تعيين كلمة المرور إلى ${user.email}`,
      });

    } catch (error) {
      console.error('Error sending reset email:', error);
      const errorMessage = error instanceof Error ? error.message : "فشل في إرسال البريد";
      toast({
        title: "❌ خطأ",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (userId: string) => {
    const status = userStatuses[userId];
    if (!status) return <span className="text-xs text-gray-500">لا يوجد</span>;

    const statusConfig: { [key: string]: { label: string; color: string; icon: string } } = {
      publisher: { label: 'ناشر', color: 'bg-blue-100 text-blue-800', icon: '📝' },
      trusted_owner: { label: 'مالك موثوق', color: 'bg-green-100 text-green-800', icon: '🏆' },
      office_agent: { label: 'مكلف بالنشر', color: 'bg-purple-100 text-purple-800', icon: '🏢' },
      office_owner: { label: 'صاحب مكتب', color: 'bg-orange-100 text-orange-800', icon: '👔' },
    };

    const config = statusConfig[status.status] || { label: status.status, color: 'bg-gray-100 text-gray-800', icon: '👤' };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.icon} {config.label}
      </span>
    );
  };

  const filteredUsers = users.filter(user => {
    const searchLower = searchQuery.toLowerCase();
    return (
      user.email.toLowerCase().includes(searchLower) ||
      user.user_metadata?.full_name?.toLowerCase().includes(searchLower) ||
      user.id.toLowerCase().includes(searchLower)
    );
  });

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="p-8 max-w-md text-center">
          <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">⛔ غير مصرح</h2>
          <p className="text-gray-600 mb-2">ليس لديك صلاحيات للوصول إلى هذه الصفحة</p>
          <p className="text-sm text-gray-500 mb-6">هذه الصفحة متاحة للمديرين فقط</p>
          
          <div className="flex flex-col gap-3">
            <Button 
              onClick={() => window.location.href = '/admin/debug'}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              🔍 فحص الصلاحيات وإضافة نفسك كمدير
            </Button>
            <Button 
              onClick={() => window.location.href = '/'}
              variant="outline"
              className="w-full"
            >
              🏠 العودة للصفحة الرئيسية
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">جاري تحميل المستخدمين...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">إدارة المستخدمين</h1>
                <p className="text-sm text-gray-600">نظام إدارة شامل للمستخدمين</p>
              </div>
            </div>
            <Button onClick={fetchUsers} variant="outline" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              تحديث
            </Button>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-sm text-blue-700 font-medium">إجمالي المستخدمين</p>
                  <p className="text-2xl font-bold text-blue-900">{users.length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
              <div className="flex items-center gap-3">
                <UserCheck className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-sm text-green-700 font-medium">ناشرين معتمدين</p>
                  <p className="text-2xl font-bold text-green-900">
                    {users.filter(u => (u.user_metadata as UserMetadata)?.status === 'publisher').length}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
              <div className="flex items-center gap-3">
                <Shield className="h-8 w-8 text-purple-600" />
                <div>
                  <p className="text-sm text-purple-700 font-medium">ملاك موثوقين</p>
                  <p className="text-2xl font-bold text-purple-900">
                    {users.filter(u => (u.user_metadata as UserMetadata)?.status === 'trusted_owner').length}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-4 border border-amber-200">
              <div className="flex items-center gap-3">
                <UserX className="h-8 w-8 text-amber-600" />
                <div>
                  <p className="text-sm text-amber-700 font-medium">مستخدمين عاديين</p>
                  <p className="text-2xl font-bold text-amber-900">
                    {users.filter(u => !(u.user_metadata as UserMetadata)?.status || (u.user_metadata as UserMetadata)?.status === 'user').length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="mt-4">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="ابحث بالبريد الإلكتروني أو الاسم أو المعرف..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10 h-12"
              />
            </div>
          </div>
        </div>

        {/* Users List */}
        <div className="grid grid-cols-1 gap-4">
          {filteredUsers.map((user) => (
            <Card key={user.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                      {user.email.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {user.user_metadata?.full_name || 'لا يوجد اسم'}
                      </h3>
                      <p className="text-sm text-gray-600">{user.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-600 mr-13">
                    <div className="flex items-center gap-1">
                      <span>الحالة:</span>
                      {getStatusBadge(user.id)}
                    </div>
                    {userStatuses[user.id] && (
                      <>
                        <div>
                          عدد العقارات: <span className="font-semibold">{userStatuses[user.id].properties_limit}</span>
                        </div>
                        <div>
                          عدد الصور: <span className="font-semibold">{userStatuses[user.id].images_limit}</span>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="mt-2 text-xs text-gray-500">
                    <div>تاريخ التسجيل: {new Date(user.created_at).toLocaleDateString('ar-EG')}</div>
                    {user.last_sign_in_at && (
                      <div>آخر تسجيل دخول: {new Date(user.last_sign_in_at).toLocaleDateString('ar-EG')}</div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleOpenPasswordDialog(user)}
                      className="gap-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
                      size="sm"
                    >
                      <Key className="h-4 w-4" />
                      تغيير كلمة المرور
                    </Button>
                    <Button
                      onClick={() => handleSendResetEmail(user)}
                      variant="outline"
                      className="gap-2 border-blue-300 text-blue-700 hover:bg-blue-50"
                      size="sm"
                    >
                      <Mail className="h-4 w-4" />
                      إرسال رابط إعادة تعيين
                    </Button>
                  </div>
                  <Button
                    onClick={() => handleDeleteUser(user)}
                    variant="destructive"
                    className="gap-2 w-full"
                    size="sm"
                  >
                    <Trash2 className="h-4 w-4" />
                    حذف المستخدم
                  </Button>
                </div>
              </div>
            </Card>
          ))}

          {filteredUsers.length === 0 && (
            <Card className="p-12 text-center">
              <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">لا توجد نتائج للبحث</p>
            </Card>
          )}
        </div>
      </div>

      {/* Password Change Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-amber-500" />
              تغيير كلمة المرور
            </DialogTitle>
            <DialogDescription>
              تغيير كلمة المرور للمستخدم: <span className="font-semibold">{selectedUser?.email}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="new-password" className="flex items-center gap-2 mb-2">
                <Key className="h-4 w-4 text-gray-500" />
                كلمة المرور الجديدة
              </Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="أدخل كلمة المرور الجديدة (6 أحرف على الأقل)"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <Label htmlFor="confirm-password" className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4 text-gray-500" />
                تأكيد كلمة المرور
              </Label>
              <Input
                id="confirm-password"
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="أعد إدخال كلمة المرور"
              />
            </div>

            {newPassword && confirmPassword && (
              <div className={`flex items-center gap-2 text-sm p-3 rounded-lg ${
                newPassword === confirmPassword 
                  ? 'bg-green-50 text-green-700' 
                  : 'bg-red-50 text-red-700'
              }`}>
                {newPassword === confirmPassword ? (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    <span>كلمات المرور متطابقة ✓</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4" />
                    <span>كلمات المرور غير متطابقة</span>
                  </>
                )}
              </div>
            )}

            <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg text-sm text-amber-800">
              <div className="flex items-start gap-2">
                <Shield className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold mb-1">ملاحظات هامة:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>كلمة المرور يجب أن تكون 6 أحرف على الأقل</li>
                    <li>سيتم تغيير كلمة المرور فوراً</li>
                    <li>سيحتاج المستخدم لتسجيل الدخول بكلمة المرور الجديدة</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowPasswordDialog(false)}
              disabled={changingPassword}
            >
              إلغاء
            </Button>
            <Button
              onClick={handleChangePassword}
              disabled={changingPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword}
              className="gap-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
            >
              {changingPassword ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  جاري التغيير...
                </>
              ) : (
                <>
                  <Key className="h-4 w-4" />
                  تغيير كلمة المرور
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UsersManagement;
