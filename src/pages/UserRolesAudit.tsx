import { useState, useEffect, useCallback } from "react";
import type { AppRole } from '@/types/appRoles';
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, User, Crown, Building, UserCheck, AlertTriangle, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AuthUser {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
  created_at?: string;
  last_sign_in_at?: string;
}

interface UserWithRole {
  id: string;
  email: string;
  role: import('@/types/appRoles').AppRole;
  created_at: string;
  user_metadata?: {
    full_name?: string;
    role?: string;
  } | null;
}

const getRoleIcon = (role: string) => {
  switch (role) {
    case 'admin': return <Crown className="h-4 w-4" />;
    case 'user': return <User className="h-4 w-4" />;
    default: return <Shield className="h-4 w-4" />;
  }
};

const getRoleColor = (role: string) => {
  switch (role) {
    case 'admin': return 'bg-red-100 text-red-800 border-red-200';
    case 'user': return 'bg-blue-100 text-blue-800 border-blue-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getRoleNameAr = (role: string) => {
  switch (role) {
    case 'admin': return 'مدير النظام';
    case 'user': return 'مستخدم';
    default: return 'غير محدد';
  }
};

export default function UserRolesAudit() {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // محاولة استخدام Edge Function أولاً
      try {
        const { data: session } = await supabase.auth.getSession();
        if (session?.session) {
          const response = await supabase.functions.invoke('get-users-roles', {
            headers: {
              Authorization: `Bearer ${session.session.access_token}`
            }
          });
          
          if (response.data?.users) {
            setUsers(response.data.users);
            return;
          }
        }
      } catch (edgeFunctionError) {
        console.log('Edge function not available, using direct database access');
      }

      // الطريقة البديلة: الاستعلام المباشر من قاعدة البيانات
      const { data: userRoles, error } = await supabase
        .from('user_roles')
        .select(`
          user_id,
          role,
          created_at
        `);

      if (error) {
        throw error;
      }

      // محاولة الحصول على معلومات إضافية من جدول profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, email, full_name');

      // دمج البيانات
      const userRolesTyped = (userRoles ?? []) as { user_id: string; role: AppRole; created_at: string }[];
      const profilesTyped = (profiles ?? []) as { user_id: string; email?: string | null; full_name?: string | null }[];

      const usersWithRoles: UserWithRole[] = userRolesTyped.map((roleData) => {
        const profile = profilesTyped.find((p) => p.user_id === roleData.user_id);

        return {
          id: roleData.user_id,
          email: profile?.email || `user-${roleData.user_id.slice(0, 8)}`,
          role: roleData.role,
          created_at: roleData.created_at,
          user_metadata: profile ? { full_name: profile.full_name } : null
        } as UserWithRole;
      });

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل بيانات المستخدمين",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const adminUsers = users.filter(user => user.role === 'admin');
  const regularUsers = users.filter(user => user.role === 'publisher');

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8" />
            مراجعة أدوار المستخدمين
          </h1>
          <p className="text-muted-foreground mt-2">
            مراقبة ومراجعة أدوار المستخدمين في النظام
          </p>
        </div>
        
        <Button
          onClick={fetchUsers}
          disabled={isLoading}
          variant="outline"
        >
          {isLoading ? (
            <RefreshCw className="h-4 w-4 animate-spin ml-2" />
          ) : (
            <RefreshCw className="h-4 w-4 ml-2" />
          )}
          تحديث
        </Button>
      </div>

      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-red-600" />
              <div>
                <div className="text-2xl font-bold text-red-600">{adminUsers.length}</div>
                <div className="text-sm text-muted-foreground">مديرين</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold text-blue-600">{regularUsers.length}</div>
                <div className="text-sm text-muted-foreground">مستخدمين</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold text-green-600">{users.length}</div>
                <div className="text-sm text-muted-foreground">إجمالي</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* تحذير للمديرين المتعددين */}
      {adminUsers.length > 1 && (
        <Card className="mb-6 border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
              <div>
                <div className="font-semibold text-orange-800">تحذير: مديرين متعددين</div>
                <div className="text-sm text-orange-700 mt-1">
                  يوجد {adminUsers.length} مديرين في النظام. تأكد من أن جميعهم يحتاجون صلاحيات المدير.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* قائمة المديرين */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-700">
            <Crown className="h-5 w-5" />
            مديرو النظام ({adminUsers.length})
          </CardTitle>
          <CardDescription>
            المستخدمون الذين لديهم صلاحيات إدارية كاملة
          </CardDescription>
        </CardHeader>
        <CardContent>
          {adminUsers.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              لا يوجد مديرين في النظام
            </div>
          ) : (
            <div className="space-y-3">
              {adminUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 border rounded-lg bg-red-50 border-red-200"
                >
                  <div className="flex items-center gap-3">
                    <Crown className="h-5 w-5 text-red-600" />
                    <div>
                      <div className="font-semibold">{user.email}</div>
                      {user.user_metadata?.full_name && (
                        <div className="text-sm text-muted-foreground">
                          {user.user_metadata.full_name}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getRoleColor(user.role)}>
                      {getRoleIcon(user.role)}
                      <span className="ml-1">{getRoleNameAr(user.role)}</span>
                    </Badge>
                    <div className="text-xs text-muted-foreground">
                      {new Date(user.created_at).toLocaleDateString('ar-SA')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* قائمة المستخدمين العاديين */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-700">
            <User className="h-5 w-5" />
            المستخدمون العاديون ({regularUsers.length})
          </CardTitle>
          <CardDescription>
            المستخدمون الذين لديهم صلاحيات محدودة
          </CardDescription>
        </CardHeader>
        <CardContent>
          {regularUsers.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              لا يوجد مستخدمين عاديين
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {regularUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-blue-600" />
                    <div>
                      <div className="font-medium">{user.email}</div>
                      {user.user_metadata?.full_name && (
                        <div className="text-sm text-muted-foreground">
                          {user.user_metadata.full_name}
                        </div>
                      )}
                      {user.user_metadata?.role && user.user_metadata.role !== 'user' && (
                        <div className="text-xs text-blue-600">
                          التخصص: {user.user_metadata.role}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getRoleColor(user.role)}>
                      {getRoleIcon(user.role)}
                      <span className="ml-1">{getRoleNameAr(user.role)}</span>
                    </Badge>
                    <div className="text-xs text-muted-foreground">
                      {new Date(user.created_at).toLocaleDateString('ar-SA')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}