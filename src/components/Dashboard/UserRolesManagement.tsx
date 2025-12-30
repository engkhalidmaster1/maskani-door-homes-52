import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RoleBadge } from '@/components/Users';
import { useAuth } from '@/hooks/useAuth';
import { Shield, Users, Building2, User, FileText, CheckCircle, XCircle, TrendingUp, Database, ArrowRight } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

// الأدوار الجديدة من user_permissions table
const ROLE_OPTIONS = [
  { value: 'admin', label: '👑 مدير النظام', icon: Shield, gradient: 'from-purple-500 to-pink-600' },
  { value: 'office', label: '🏢 مكتب عقاري', icon: Building2, gradient: 'from-blue-500 to-cyan-600' },
  { value: 'agent', label: '🏠 وكيل عقاري', icon: User, gradient: 'from-green-500 to-emerald-600' },
  { value: 'publisher', label: '📝 ناشر عقارات', icon: FileText, gradient: 'from-gray-500 to-gray-600' },
] as const;

type UserRole = 'admin' | 'office' | 'agent' | 'publisher';

export const UserRolesManagement = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [searchEmail, setSearchEmail] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('publisher');
  const [loading, setLoading] = useState(false);
  type PermRow = {
    user_id: string;
    role?: UserRole;
    properties_count?: number;
    limits?: { properties?: number; images_per_property?: number; storage_mb?: number };
    can_publish?: boolean;
    is_verified?: boolean;
    is_active?: boolean;
    last_sign_in_at?: string | null;
  };
  const [userData, setUserData] = useState<PermRow | null>(null);

  const disabled = !isAdmin;

  // جلب بيانات المستخدم المحدد
  useEffect(() => {
    const fetchUserData = async () => {
      if (!selectedUserId) {
        setUserData(null);
        return;
      }
      
      setLoading(true);
      try {
        const { data: perm, error } = await supabase
          .from('user_permissions')
          .select('*')
          .eq('user_id', selectedUserId)
          .single();

        if (error) throw error;
        setUserData(perm as PermRow);
        setSelectedRole((perm as PermRow)?.role ?? 'publisher');
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        toast({
          title: "خطأ",
          description: message || "فشل جلب بيانات المستخدم",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, [selectedUserId]);

  // البحث عن مستخدم بواسطة البريد الإلكتروني وتعيينه
  const handleFindUserByEmail = async () => {
    if (!searchEmail) {
      toast({ title: 'خطأ', description: 'الرجاء إدخال البريد الإلكتروني للبحث', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('user_id, email')
        .ilike('email', searchEmail)
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (!profile) {
        toast({ 
          title: 'غير موجود', 
          description: 'لم يتم العثور على مستخدم بهذا البريد', 
          variant: 'destructive' 
        });
        setSelectedUserId('');
        setUserData(null);
        return;
      }

      setSelectedUserId(profile.user_id);
      toast({ title: 'تم العثور', description: `المستخدم ${profile.email} جاهز للتحرير` });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      toast({ title: 'خطأ', description: message || 'فشل البحث عن المستخدم', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // تحديث دور المستخدم
  const handleUpdateRole = async () => {
    if (!selectedUserId || !selectedRole) {
      toast({
        title: "خطأ",
        description: "الرجاء تحديد المستخدم والدور",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // تحديد الحدود بناءً على الدور
      // Use server-side RPC to change role and keep permissions and statuses in sync
      const { error: rpcErr } = await supabase.rpc('set_user_role', { target_user_id: selectedUserId, new_role: selectedRole });
      if (rpcErr) throw rpcErr;

      toast({ title: '✅ تم التحديث بنجاح', description: `تم تغيير دور المستخدم إلى ${ROLE_OPTIONS.find(r => r.value === selectedRole)?.label}` });

      // إعادة جلب البيانات
      const { data } = await supabase
        .from('user_permissions')
        .select('*')
        .eq('user_id', selectedUserId)
        .single();
      setUserData(data as PermRow);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      toast({
        title: "❌ فشل التحديث",
        description: message || "حدث خطأ أثناء تحديث الدور",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // معلومات الصلاحيات لكل دور
  const rolePermissions = useMemo(() => ({
      admin: {
        properties: -1,
        images_per_property: -1,
        storage_mb: -1,
        description: "صلاحيات غير محدودة - تحكم كامل بالنظام"
      },
      office: {
        properties: 100,
        images_per_property: 10,
        storage_mb: 5000,
        description: "صلاحيات محدودة للعقارات - مخصص للمكاتب"
      },
      agent: {
        properties: 30,
        images_per_property: 10,
        storage_mb: 1024,
        description: "صلاحيات محدودة - مخصص للوكلاء الأفراد"
      },
      publisher: {
        properties: 3,
        images_per_property: 10,
        storage_mb: 200,
        description: "صلاحيات محدودة جداً - للنشر فقط"
      }
  }), []);

  return (
    <div className={`space-y-6 ${disabled ? 'opacity-70 pointer-events-none' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            إدارة الأدوار والصلاحيات
          </h2>
          <p className="text-muted-foreground mt-2">
            تعيين الأدوار وإدارة صلاحيات المستخدمين
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => navigate('/system-documentation')}
          className="gap-2"
        >
          <FileText className="h-4 w-4" />
          توثيق النظام
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* بطاقات الأدوار */}
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              الأدوار المتاحة
            </CardTitle>
            <CardDescription>
              اختر الدور المناسب للمستخدم بناءً على صلاحياته المطلوبة
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {ROLE_OPTIONS.map((role) => {
                const Icon = role.icon;
                const permissions = rolePermissions[role.value];
                const isSelected = selectedRole === role.value;
                
                return (
                  <Card
                    key={role.value}
                    className={`cursor-pointer transition-all hover:shadow-lg ${
                      isSelected ? 'ring-2 ring-primary shadow-md' : ''
                    }`}
                    onClick={() => setSelectedRole(role.value)}
                  >
                    <CardHeader className="pb-3">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${role.gradient} flex items-center justify-center mb-3`}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <CardTitle className="text-lg">
                        <RoleBadge role={role.value} variant="detailed" />
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <p className="text-muted-foreground text-xs">
                        {permissions.description}
                      </p>
                      <div className="space-y-1 pt-2 border-t">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">العقارات:</span>
                          <span className="font-medium">
                            {permissions.properties === -1 ? '∞' : permissions.properties}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">الصور:</span>
                          <span className="font-medium">
                            {permissions.images_per_property === -1 ? '∞' : permissions.images_per_property}
                          </span>
                        </div>
                        {/* الميزة 'العقارات المميزة' ألغيت من النظام */}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* تعيين الدور للمستخدم */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              تعيين الدور
            </CardTitle>
            <CardDescription>
              أدخل معرّف المستخدم واختر الدور المناسب
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
                <label className="text-sm font-medium">معرّف المستخدم (UUID)</label>
                <div className="flex gap-2">
                  <Input
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value.trim())}
                    placeholder="85c5601e-1234-5678-abcd-123456789abc"
                    className="font-mono text-xs"
                  />
                  <Button size="sm" onClick={() => {
                    if (selectedUserId) setSelectedUserId('');
                  }} variant="ghost">مسح</Button>
                </div>

                <div className="mt-2">
                  <label className="text-sm font-medium">أو بحث بالإيميل</label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      value={searchEmail}
                      onChange={(e) => setSearchEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="font-mono text-xs"
                    />
                    <Button size="sm" onClick={() => handleFindUserByEmail()} disabled={loading}>بحث</Button>
                  </div>
                </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">الدور الجديد</label>
              <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as UserRole)}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الدور" />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {userData && (
              <Card className="bg-muted/50">
                <CardContent className="pt-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">الدور الحالي:</span>
                    <RoleBadge role={userData.role} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">الحالة:</span>
                    <div className="flex items-center gap-2">
                      {userData.is_active && userData.can_publish ? (
                        <>
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm">نشط</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4 text-red-500" />
                          <span className="text-sm">معطل</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">التوثيق:</span>
                    <div className="flex items-center gap-2">
                      {userData.is_verified ? (
                        <>
                          <CheckCircle className="h-4 w-4 text-blue-500" />
                          <span className="text-sm">موثق</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">غير موثق</span>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Button
              onClick={handleUpdateRole}
              disabled={!selectedUserId || loading}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              {loading ? 'جاري التحديث...' : 'تحديث الدور'}
            </Button>
          </CardContent>
        </Card>

        {/* معاينة الصلاحيات */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              معاينة الصلاحيات
            </CardTitle>
            <CardDescription>
              الصلاحيات المرتبطة بالدور المحدد
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center py-4">
                <RoleBadge role={selectedRole} variant="detailed" />
              </div>

              <div className="space-y-3">
                {Object.entries(rolePermissions[selectedRole]).map(([key, value]) => {
                  if (key === 'description') return null;
                  if (!['properties', 'images_per_property', 'storage_mb'].includes(key)) return null;
                  const labels: Record<string, string> = {
                    properties: '📊 عدد العقارات',
                    images_per_property: '🖼️ الصور لكل عقار',
                    storage_mb: '💾 المساحة التخزينية',
                  };

                  return (
                    <div key={key} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <span className="text-sm font-medium">{labels[key]}</span>
                      <span className={`text-lg font-bold ${value === -1 ? 'text-green-600' : 'text-blue-600'}`}>
                        {value === -1 ? '∞ غير محدود' : `${(value as number).toLocaleString()}`}
                      </span>
                    </div>
                  );
                })}
              </div>

              <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
                <CardContent className="pt-4">
                  <p className="text-sm text-blue-900">
                    {rolePermissions[selectedRole].description}
                  </p>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* روابط سريعة */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            روابط سريعة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              onClick={() => navigate('/admin/users')}
              className="justify-start gap-2"
            >
              <Users className="h-4 w-4" />
              إدارة المستخدمين
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/admin/add-user')}
              className="justify-start gap-2"
            >
              <Users className="h-4 w-4" />
              إضافة مستخدم جديد
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/system-documentation')}
              className="justify-start gap-2"
            >
              <FileText className="h-4 w-4" />
              توثيق النظام الكامل
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
