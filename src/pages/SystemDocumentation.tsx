import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RoleBadge } from "@/components/Users";
import { useNavigate } from "react-router-dom";
import { 
  Shield, 
  Building2, 
  User, 
  FileText, 
  ArrowLeft, 
  CheckCircle, 
  XCircle,
  Database,
  Lock,
  Unlock,
  TrendingUp,
  Image as ImageIcon,
  Star,
  HardDrive,
  Users,
  BookOpen,
  Info
} from "lucide-react";

export default function SystemDocumentation() {
  const navigate = useNavigate();

  const roles = [
    {
      value: 'admin',
      title: '👑 مدير النظام',
      icon: Shield,
      gradient: 'from-purple-500 to-pink-600',
      description: 'صلاحيات كاملة وغير محدودة للتحكم بالنظام بالكامل',
      permissions: {
        properties: -1,
        images_per_property: -1,
        featured_properties: -1,
        storage_mb: -1,
      },
      capabilities: [
        'إدارة جميع المستخدمين',
        'تعيين وتغيير الأدوار',
        'الوصول الكامل لجميع العقارات',
        'إضافة عدد غير محدود من العقارات',
        'رفع عدد غير محدود من الصور',
        'تمييز عدد غير محدود من العقارات',
        'مساحة تخزين غير محدودة',
        'إدارة الإعدادات العامة',
        'عرض سجلات التدقيق',
        'إدارة الإشعارات',
      ],
      bestFor: 'المسؤولين عن إدارة المنصة بالكامل',
      color: 'purple'
    },
    {
      value: 'office',
      title: '🏢 مكتب عقاري',
      icon: Building2,
      gradient: 'from-blue-500 to-cyan-600',
      description: 'صلاحيات واسعة للمكاتب العقارية المحترفة',
      permissions: {
        properties: -1,
        images_per_property: -1,
        featured_properties: 50,
        storage_mb: -1,
      },
      capabilities: [
        'إضافة عدد غير محدود من العقارات',
        'رفع عدد غير محدود من الصور لكل عقار',
        'تمييز حتى 50 عقار في نفس الوقت',
        'مساحة تخزين غير محدودة',
        'إدارة فريق العمل',
        'إحصائيات متقدمة',
        'دعم فني مخصص',
        'عرض مميز في البحث',
      ],
      bestFor: 'المكاتب العقارية الكبرى والشركات',
      color: 'blue'
    },
    {
      value: 'agent',
      title: '🏠 وكيل عقاري',
      icon: User,
      gradient: 'from-green-500 to-emerald-600',
      description: 'صلاحيات محدودة مناسبة للوكلاء الأفراد',
      permissions: {
        properties: 100,
        images_per_property: 20,
        featured_properties: 10,
        storage_mb: 10240,
      },
      capabilities: [
        'إضافة حتى 100 عقار',
        'رفع حتى 20 صورة لكل عقار',
        'تمييز حتى 10 عقارات',
        'مساحة تخزين 10 جيجابايت',
        'إحصائيات أساسية',
        'دعم فني عادي',
        'صفحة خاصة للعقارات',
      ],
      bestFor: 'الوكلاء العقاريين الأفراد والمستقلين',
      color: 'green'
    },
    {
      value: 'publisher',
      title: '📝 ناشر عقارات',
      icon: FileText,
      gradient: 'from-gray-500 to-gray-600',
      description: 'صلاحيات محدودة للنشر الأساسي',
      permissions: {
        properties: 20,
        images_per_property: 10,
        featured_properties: 2,
        storage_mb: 2048,
      },
      capabilities: [
        'إضافة حتى 20 عقار',
        'رفع حتى 10 صور لكل عقار',
        'تمييز حتى عقارين',
        'مساحة تخزين 2 جيجابايت',
        'نشر وإدارة العقارات الشخصية',
      ],
      bestFor: 'الأفراد الراغبين في نشر عقاراتهم الشخصية',
      color: 'gray'
    }
  ];

  const permissionLabels = {
    properties: { icon: TrendingUp, label: 'عدد العقارات', color: 'text-blue-600' },
    images_per_property: { icon: ImageIcon, label: 'الصور لكل عقار', color: 'text-green-600' },
    featured_properties: { icon: Star, label: 'العقارات المميزة', color: 'text-yellow-600' },
    storage_mb: { icon: HardDrive, label: 'المساحة التخزينية', color: 'text-purple-600' },
  };

  const formatValue = (value: number, key: string) => {
    if (value === -1) return '∞ غير محدود';
    if (key === 'storage_mb') {
      return value >= 1024 ? `${(value / 1024).toFixed(0)} GB` : `${value} MB`;
    }
    return value.toLocaleString();
  };

  return (
    <div className="container mx-auto p-6 space-y-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent">
            توثيق نظام الأدوار والصلاحيات
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            دليل شامل لفهم الأدوار والصلاحيات في منصة مسكني
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => navigate(-1)}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          رجوع
        </Button>
      </div>

      {/* نظرة عامة */}
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-blue-50/50 to-purple-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Info className="h-6 w-6 text-primary" />
            نظرة عامة
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-lg leading-relaxed">
            يعتمد نظام مسكني على <strong>أربعة أدوار رئيسية</strong> تحدد صلاحيات كل مستخدم في المنصة.
            كل دور مصمم لتلبية احتياجات فئة معينة من المستخدمين، من المديرين إلى الناشرين الأفراد.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="flex items-start gap-3 p-4 bg-white rounded-lg shadow-sm">
              <Shield className="h-5 w-5 text-purple-600 mt-1" />
              <div>
                <h4 className="font-semibold mb-1">نظام محمي</h4>
                <p className="text-sm text-muted-foreground">
                  جميع الصلاحيات محمية على مستوى قاعدة البيانات بـ RLS Policies
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-white rounded-lg shadow-sm">
              <Database className="h-5 w-5 text-blue-600 mt-1" />
              <div>
                <h4 className="font-semibold mb-1">مرونة عالية</h4>
                <p className="text-sm text-muted-foreground">
                  يمكن تعديل الأدوار والصلاحيات بسهولة عبر لوحة التحكم
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* الأدوار بالتفصيل */}
      <div className="space-y-6">
        <h2 className="text-3xl font-bold flex items-center gap-3">
          <BookOpen className="h-8 w-8 text-primary" />
          الأدوار بالتفصيل
        </h2>

        {roles.map((role, index) => {
          const Icon = role.icon;
          return (
            <Card key={role.value} className="overflow-hidden">
              <CardHeader className={`bg-gradient-to-r ${role.gradient} text-white`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <Icon className="h-8 w-8" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl text-white">{role.title}</CardTitle>
                      <CardDescription className="text-white/90 mt-1">
                        {role.description}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-lg px-4 py-2">
                    #{index + 1}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* الصلاحيات */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-lg flex items-center gap-2">
                      <Lock className="h-5 w-5 text-primary" />
                      الصلاحيات والحدود
                    </h4>
                    <div className="space-y-3">
                      {Object.entries(role.permissions).map(([key, value]) => {
                        const perm = permissionLabels[key as keyof typeof permissionLabels];
                        const PermIcon = perm.icon;
                        return (
                          <div key={key} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                            <div className="flex items-center gap-2">
                              <PermIcon className={`h-5 w-5 ${perm.color}`} />
                              <span className="font-medium">{perm.label}</span>
                            </div>
                            <span className={`text-lg font-bold ${value === -1 ? 'text-green-600' : 'text-blue-600'}`}>
                              {formatValue(value, key)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* القدرات */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-lg flex items-center gap-2">
                      <Unlock className="h-5 w-5 text-primary" />
                      القدرات والمميزات
                    </h4>
                    <ul className="space-y-2">
                      {role.capabilities.map((capability, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle className={`h-5 w-5 text-${role.color}-600 mt-0.5 flex-shrink-0`} />
                          <span className="text-sm">{capability}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-4 p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
                      <p className="text-sm font-medium text-blue-900">
                        <strong>الأنسب لـ:</strong> {role.bestFor}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* جدول المقارنة */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <Database className="h-6 w-6" />
            جدول المقارنة السريع
          </CardTitle>
          <CardDescription>
            مقارنة سريعة بين جميع الأدوار والصلاحيات
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2">
                  <th className="text-right p-3 font-semibold">الصلاحية</th>
                  {roles.map(role => (
                    <th key={role.value} className="text-center p-3">
                      <RoleBadge role={role.value} variant="compact" />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.entries(permissionLabels).map(([key, perm]) => {
                  const Icon = perm.icon;
                  return (
                    <tr key={key} className="border-b hover:bg-muted/50">
                      <td className="p-3 font-medium flex items-center gap-2">
                        <Icon className={`h-4 w-4 ${perm.color}`} />
                        {perm.label}
                      </td>
                      {roles.map(role => {
                        const value = role.permissions[key as keyof typeof role.permissions];
                        return (
                          <td key={`${role.value}-${key}`} className="text-center p-3">
                            <Badge 
                              variant={value === -1 ? "default" : "secondary"}
                              className={value === -1 ? "bg-green-600" : ""}
                            >
                              {formatValue(value, key)}
                            </Badge>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ملاحظات مهمة */}
      <Card className="border-2 border-yellow-200 bg-gradient-to-br from-yellow-50/50 to-orange-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Info className="h-5 w-5 text-yellow-600" />
            ملاحظات مهمة
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-2">
            <Shield className="h-5 w-5 text-purple-600 mt-0.5" />
            <p className="text-sm">
              <strong>حماية المدير:</strong> دور المدير العام محمي بشكل دائم ولا يمكن تغييره أو حظره عبر الواجهة.
            </p>
          </div>
          <div className="flex items-start gap-2">
            <Database className="h-5 w-5 text-blue-600 mt-0.5" />
            <p className="text-sm">
              <strong>قاعدة البيانات:</strong> جميع الصلاحيات محفوظة في جدول <code className="bg-muted px-2 py-1 rounded">user_permissions</code>.
            </p>
          </div>
          <div className="flex items-start gap-2">
            <Lock className="h-5 w-5 text-green-600 mt-0.5" />
            <p className="text-sm">
              <strong>الأمان:</strong> يتم التحقق من الصلاحيات على مستوى قاعدة البيانات باستخدام RLS Policies وDatabase Triggers.
            </p>
          </div>
          <div className="flex items-start gap-2">
            <Users className="h-5 w-5 text-cyan-600 mt-0.5" />
            <p className="text-sm">
              <strong>التعديل:</strong> يمكن للمدراء فقط تعيين وتغيير أدوار المستخدمين الآخرين.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* روابط سريعة */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            الخطوات التالية
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              onClick={() => navigate('/admin/users')}
              className="justify-start gap-2 h-auto py-4"
            >
              <Users className="h-5 w-5" />
              <div className="text-right">
                <div className="font-semibold">إدارة المستخدمين</div>
                <div className="text-xs text-muted-foreground">عرض وإدارة جميع المستخدمين</div>
              </div>
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/dashboard')}
              className="justify-start gap-2 h-auto py-4"
            >
              <Shield className="h-5 w-5" />
              <div className="text-right">
                <div className="font-semibold">إدارة الأدوار</div>
                <div className="text-xs text-muted-foreground">تعيين وتغيير أدوار المستخدمين</div>
              </div>
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/admin/add-user')}
              className="justify-start gap-2 h-auto py-4"
            >
              <Users className="h-5 w-5" />
              <div className="text-right">
                <div className="font-semibold">إضافة مستخدم</div>
                <div className="text-xs text-muted-foreground">إنشاء حساب مستخدم جديد</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
