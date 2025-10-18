import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, UserPlus, Loader2 } from "lucide-react";

type UserRole = 'admin' | 'office' | 'agent' | 'publisher';

interface RoleConfig {
  value: UserRole;
  label: string;
  labelAr: string;
  description: string;
  limits: {
    properties: number;
    images_per_property: number;
    featured_properties: number;
    storage_mb: number;
  };
}

const ROLE_CONFIGS: RoleConfig[] = [
  {
    value: 'publisher',
    label: 'Publisher',
    labelAr: '👤 ناشر عادي',
    description: '3 عقارات، 10 صور لكل عقار',
    limits: {
      properties: 3,
      images_per_property: 10,
      featured_properties: 0,
      storage_mb: 100,
    },
  },
  {
    value: 'agent',
    label: 'Agent',
    labelAr: '🏆 وكيل عقاري موثق',
    description: '10 عقارات، 10 صور لكل عقار',
    limits: {
      properties: 10,
      images_per_property: 10,
      featured_properties: 3,
      storage_mb: 500,
    },
  },
  {
    value: 'office',
    label: 'Office',
    labelAr: '🏢 مكتب عقارات',
    description: 'عقارات غير محدودة، 10 صور لكل عقار',
    limits: {
      properties: -1,
      images_per_property: 10,
      featured_properties: 50,
      storage_mb: 5000,
    },
  },
  {
    value: 'admin',
    label: 'Admin',
    labelAr: '🔑 مدير النظام',
    description: 'صلاحيات غير محدودة بالكامل',
    limits: {
      properties: -1,
      images_per_property: -1,
      featured_properties: -1,
      storage_mb: -1,
    },
  },
];

export default function AdminAddUser() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    phone: '',
    address: '',
    role: 'publisher' as UserRole,
  });

  const selectedRoleConfig = ROLE_CONFIGS.find(r => r.value === formData.role);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      toast({
        title: "خطأ",
        description: "يجب إدخال البريد الإلكتروني وكلمة المرور",
        variant: "destructive",
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: "خطأ",
        description: "كلمة المرور يجب أن تكون 6 أحرف على الأقل",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // استدعاء Edge Function لإنشاء المستخدم بشكل آمن
      const { data: { session } } = await supabase.auth.getSession();
      
      const functionUrl = import.meta.env.VITE_SUPABASE_FUNCTION_CREATE_USER || 
                         `${supabase.supabaseUrl}/functions/v1/create-user`;

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || ''}`,
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          full_name: formData.fullName,
          phone: formData.phone,
          role: formData.role,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'فشل إنشاء المستخدم');
      }

      // إنشاء الملف الشخصي (اختياري - يمكن نقله للـ Edge Function لاحقاً)
      if (result.user?.id) {
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            user_id: result.user.id,
            full_name: formData.fullName || null,
            phone: formData.phone || null,
            address: formData.address || null,
          });

        if (profileError) {
          console.error('Profile creation error:', profileError);
          // نكمل حتى لو فشل Profile
        }
      }

      const roleConfig = ROLE_CONFIGS.find(r => r.value === formData.role);
      
      toast({
        title: "✅ تم بنجاح",
        description: `تم إنشاء المستخدم ${formData.email} بصلاحيات ${roleConfig?.labelAr || formData.role}`,
      });

      // العودة لصفحة إدارة المستخدمين
      navigate('/admin/users');
      
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast({
        title: "❌ خطأ في إنشاء المستخدم",
        description: error.message || "فشل إنشاء المستخدم. تأكد من نشر Edge Function.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-3xl">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/admin/users')}
          className="mb-4"
        >
          <ArrowLeft className="ml-2 h-4 w-4" />
          العودة لإدارة المستخدمين
        </Button>

        <h1 className="text-3xl font-bold">إضافة مستخدم جديد</h1>
        <p className="text-muted-foreground mt-2">
          إنشاء حساب مستخدم جديد مع تحديد الدور والصلاحيات
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            بيانات المستخدم
          </CardTitle>
          <CardDescription>
            جميع الحقول المطلوبة مميزة بـ *
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* معلومات تسجيل الدخول */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">معلومات تسجيل الدخول</h3>
              
              <div className="space-y-2">
                <Label htmlFor="email">
                  البريد الإلكتروني <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="user@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">
                  كلمة المرور <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="كلمة مرور قوية (6 أحرف على الأقل)"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  minLength={6}
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* المعلومات الشخصية */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">المعلومات الشخصية (اختيارية)</h3>
              
              <div className="space-y-2">
                <Label htmlFor="fullName">الاسم الكامل</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="الاسم الكامل للمستخدم"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">رقم الهاتف</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+966 5X XXX XXXX"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">العنوان</Label>
                <Input
                  id="address"
                  type="text"
                  placeholder="المدينة، المنطقة"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* الدور والصلاحيات */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">الدور والصلاحيات</h3>
              
              <div className="space-y-2">
                <Label htmlFor="role">
                  الدور <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData({ ...formData, role: value as UserRole })}
                  disabled={isLoading}
                >
                  <SelectTrigger id="role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLE_CONFIGS.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        <div className="flex flex-col">
                          <span className="font-medium">{role.labelAr}</span>
                          <span className="text-xs text-muted-foreground">
                            {role.description}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* معاينة الصلاحيات */}
              {selectedRoleConfig && (
                <Card className="bg-muted/50">
                  <CardHeader>
                    <CardTitle className="text-sm">صلاحيات {selectedRoleConfig.labelAr}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>عدد العقارات:</span>
                      <span className="font-medium">
                        {selectedRoleConfig.limits.properties === -1
                          ? '♾️ غير محدود'
                          : selectedRoleConfig.limits.properties}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>الصور لكل عقار:</span>
                      <span className="font-medium">
                        {selectedRoleConfig.limits.images_per_property === -1
                          ? '♾️ غير محدود'
                          : selectedRoleConfig.limits.images_per_property}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>العقارات المميزة:</span>
                      <span className="font-medium">
                        {selectedRoleConfig.limits.featured_properties === -1
                          ? '♾️ غير محدود'
                          : selectedRoleConfig.limits.featured_properties}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>مساحة التخزين:</span>
                      <span className="font-medium">
                        {selectedRoleConfig.limits.storage_mb === -1
                          ? '♾️ غير محدود'
                          : `${selectedRoleConfig.limits.storage_mb} MB`}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* أزرار التحكم */}
            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    جاري الإنشاء...
                  </>
                ) : (
                  <>
                    <UserPlus className="ml-2 h-4 w-4" />
                    إنشاء المستخدم
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/admin/users')}
                disabled={isLoading}
              >
                إلغاء
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
