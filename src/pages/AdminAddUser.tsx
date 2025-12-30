import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { ArrowLeft, UserPlus, Loader2, Clock } from "lucide-react";
import { createUser, CreateUserData } from "@/services/adminUserService";

// Rate limiting state - using localStorage for persistence
const RATE_LIMIT_MS = 10000; // 10 seconds between attempts

const getRemainingCooldown = () => {
  const lastAttempt = localStorage.getItem('lastUserCreationAttempt');
  if (!lastAttempt) return 0;
  
  const timeSinceLastAttempt = Date.now() - parseInt(lastAttempt);
  const remainingCooldown = RATE_LIMIT_MS - timeSinceLastAttempt;
  
  return remainingCooldown > 0 ? remainingCooldown : 0;
};

type UserRole = 'admin' | 'office' | 'agent' | 'publisher';

interface RoleConfig {
  value: UserRole;
  label: string;
  labelAr: string;
  description: string;
  limits: {
    properties: number;
    images_per_property: number;
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
      storage_mb: 100,
    },
  },
  {
    value: 'agent',
    label: 'Agent',
    labelAr: '🏆 وكيل عقاري موثق',
    description: '30 عقاراً، 10 صور لكل عقار',
    limits: {
      properties: 30,
      images_per_property: 10,
      storage_mb: 1024,
    },
  },
  {
    value: 'office',
    label: 'Office',
    labelAr: '🏢 مكتب عقارات',
    description: '100 عقارات، 10 صور لكل عقار',
    limits: {
      properties: 100,
      images_per_property: 10,
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
      storage_mb: -1,
    },
  },
];

export default function AdminAddUser() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  
  // Check for cooldown on component mount
  useState(() => {
    const remaining = getRemainingCooldown();
    if (remaining > 0) {
      setCooldownSeconds(Math.ceil(remaining / 1000));
      const interval = setInterval(() => {
        const newRemaining = getRemainingCooldown();
        if (newRemaining <= 0) {
          setCooldownSeconds(0);
          clearInterval(interval);
        } else {
          setCooldownSeconds(Math.ceil(newRemaining / 1000));
        }
      }, 1000);
    }
  });

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
    
    // Check rate limit
    const remainingCooldown = getRemainingCooldown();
    if (remainingCooldown > 0) {
      toast({
        title: "انتظر قليلاً",
        description: `يرجى الانتظار ${Math.ceil(remainingCooldown / 1000)} ثانية قبل المحاولة مرة أخرى`,
        variant: "destructive",
      });
      return;
    }
    
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
    
    // تحذير خاص للمدير
    if (formData.role === 'admin') {
      const confirmAdmin = window.confirm(
        '⚠️ تحذير: أنت على وشك إنشاء مستخدم بصلاحيات مدير!\n\n' +
        'المديرون لديهم صلاحيات كاملة لإدارة النظام بما في ذلك:\n' +
        '• إدارة جميع المستخدمين\n' +
        '• حذف البيانات\n' +
        '• تعديل إعدادات النظام\n\n' +
        'هل أنت متأكد من المتابعة؟'
      );
      
      if (!confirmAdmin) {
        setIsLoading(false);
        return;
      }
    }
    
    // Record attempt time
    localStorage.setItem('lastUserCreationAttempt', Date.now().toString());

    try {
      const userData: CreateUserData = {
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
        phone: formData.phone,
        address: formData.address,
        role: formData.role,
      };

      const result = await createUser(userData);

      const roleConfig = ROLE_CONFIGS.find(r => r.value === formData.role);
      
      toast({
        title: "✅ تم بنجاح",
        description: `تم إنشاء المستخدم ${formData.email} بصلاحيات ${roleConfig?.labelAr || formData.role}`,
      });

      // Clear the attempt time on success
      localStorage.removeItem('lastUserCreationAttempt');
      
      // العودة لصفحة إدارة المستخدمين
      navigate('/admin/users');
      
    } catch (error: unknown) {
      console.error('Error creating user:', error);
      const errorMessage = error instanceof Error ? error.message : "فشل إنشاء المستخدم";
      
      // معالجة أنواع مختلفة من الأخطاء
      let displayMessage = errorMessage;
      
      if (errorMessage.includes('already registered') || errorMessage.includes('مستخدم بالفعل')) {
        displayMessage = 'البريد الإلكتروني مستخدم بالفعل، يرجى استخدام بريد إلكتروني آخر';
        // Clear rate limit on duplicate email since it's a valid attempt
        localStorage.removeItem('lastUserCreationAttempt');
      } else if (errorMessage.includes('Invalid email')) {
        displayMessage = 'البريد الإلكتروني غير صحيح';
        localStorage.removeItem('lastUserCreationAttempt');
      } else if (errorMessage.includes('Password') || errorMessage.includes('كلمة المرور')) {
        displayMessage = 'كلمة المرور ضعيفة، يجب أن تكون 6 أحرف على الأقل مع أرقام وحروف';
        localStorage.removeItem('lastUserCreationAttempt');
      } else if (errorMessage.includes('Network') || errorMessage.includes('fetch')) {
        displayMessage = 'خطأ في الاتصال، تأكد من الاتصال بالإنترنت وأعد المحاولة';
      } else if (errorMessage.includes('security purposes') || errorMessage.includes('حد أمان')) {
        displayMessage = 'يرجى الانتظار دقيقة واحدة ثم إعادة المحاولة (حد أمان مؤقت)';
        // Start cooldown timer
        setCooldownSeconds(60);
        const interval = setInterval(() => {
          setCooldownSeconds(prev => {
            if (prev <= 1) {
              clearInterval(interval);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
      
      toast({
        title: "❌ خطأ في إنشاء المستخدم",
        description: displayMessage,
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
        
        {cooldownSeconds > 0 && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2 text-yellow-800">
              <Clock className="h-4 w-4" />
              <span className="text-sm">
                انتظر {cooldownSeconds} ثانية قبل إنشاء مستخدم آخر (حد أمان مؤقت)
              </span>
            </div>
          </div>
        )}
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
                
                {/* تحذير خاص للمدير */}
                {formData.role === 'admin' && (
                  <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-start gap-2 text-red-800">
                      <div className="text-red-600 text-lg">⚠️</div>
                      <div className="text-sm">
                        <div className="font-semibold">تحذير: صلاحيات مدير</div>
                        <div className="mt-1">
                          هذا المستخدم سيحصل على صلاحيات كاملة لإدارة النظام بما في ذلك إدارة المستخدمين وحذف البيانات.
                        </div>
                      </div>
                    </div>
                  </div>
                )}
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
                    {/* ميزات 'العقارات المميزة' ألغيت — لا تظهر في معاينة الصلاحيات */}
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
                disabled={isLoading || cooldownSeconds > 0}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    جاري الإنشاء...
                  </>
                ) : cooldownSeconds > 0 ? (
                  <>
                    <Clock className="ml-2 h-4 w-4" />
                    انتظر {cooldownSeconds}ث
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
