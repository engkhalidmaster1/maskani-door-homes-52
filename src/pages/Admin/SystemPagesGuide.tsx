import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  LayoutDashboard,
  Users,
  UserPlus,
  FileText,
  Bug,
  BookOpen,
  Info,
  FileCode
} from "lucide-react";

export default function SystemPagesGuide() {
  const navigate = useNavigate();

  const pages = [
    {
      title: "لوحة التحكم الرئيسية (Dashboard)",
      path: "/dashboard",
      icon: LayoutDashboard,
      description: "نقطة الانطلاق الرئيسية للمشرف. توفر نظرة عامة على النظام وإحصائيات سريعة وروابط للوظائف الرئيسية.",
      features: [
        "عرض الإحصائيات الحيوية (عدد المستخدمين، العقارات، المكاتب).",
        "روابط سريعة للأقسام الإدارية الهامة.",
        "نظرة عامة على آخر الأنشطة في النظام.",
      ],
      color: "blue"
    },
    {
      title: "إدارة المستخدمين (Admin Users)",
      path: "/admin/users",
      icon: Users,
      description: "صفحة مركزية لإدارة جميع المستخدمين في النظام. تتيح للمشرف عرض، تعديل، وحظر المستخدمين.",
      features: [
        "جدول يعرض جميع المستخدمين مع معلوماتهم الأساسية.",
        "إمكانية البحث والتصفية للمستخدمين.",
        "أزرار إجراءات سريعة لتغيير دور المستخدم، حظره، أو حذفه.",
        "عرض حالة المستخدم (نشط، محظور).",
      ],
      color: "purple"
    },
    {
      title: "إضافة مستخدم جديد (Admin Add User)",
      path: "/admin/add-user",
      icon: UserPlus,
      description: "نموذج مخصص لإنشاء حسابات مستخدمين جدد مباشرة من قبل المشرف.",
      features: [
        "إدخال معلومات المستخدم الأساسية (الاسم، البريد الإلكتروني).",
        "تعيين كلمة مرور أولية للمستخدم.",
        "اختيار دور المستخدم مباشرة عند الإنشاء.",
      ],
      color: "green"
    },
    {
      title: "توثيق الأدوار والصلاحيات (System Documentation)",
      path: "/system-documentation",
      icon: FileText,
      description: "صفحة تفصيلية تشرح نظام الأدوار والصلاحيات في المنصة.",
      features: [
        "شرح لكل دور (مدير، مكتب، وكيل، ناشر).",
        "توضيح الصلاحيات والقيود لكل دور (عدد العقارات، الصور، إلخ).",
        "جدول مقارنة سريع بين الأدوار المختلفة.",
      ],
      color: "yellow"
    },
    {
      title: "صفحة تصحيح الأخطاء (Admin Debug)",
      path: "/admin/debug",
      icon: Bug,
      description: "أدوات متقدمة للمطورين والمشرفين لتشخيص وحل المشاكل التقنية.",
      features: [
        "عرض معلومات تقنية عن حالة النظام.",
        "أدوات لتشغيل وظائف معينة يدوياً.",
        "محاكاة حالات خطأ لتجربة استجابة النظام.",
      ],
      color: "red"
    }
  ];

  return (
    <div className="container mx-auto p-6 space-y-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 via-teal-600 to-sky-600 bg-clip-text text-transparent">
            دليل صفحات نظام الإدارة
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            شرح مفصل لكل صفحة من صفحات لوحة تحكم المشرف
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
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-teal-50/50 to-green-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Info className="h-6 w-6 text-primary" />
            مقدمة
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-lg leading-relaxed">
            هذا الدليل يوفر شرحاً وافياً للوحات والصفحات المتاحة للمشرف (Admin) في نظام مسكني.
            كل صفحة مصممة لتوفير تحكم كامل وجعل إدارة المنصة سهلة وفعالة.
          </p>
        </CardContent>
      </Card>

      {/* الصفحات بالتفصيل */}
      <div className="space-y-6">
        <h2 className="text-3xl font-bold flex items-center gap-3">
          <BookOpen className="h-8 w-8 text-primary" />
          شرح الصفحات
        </h2>

        {pages.map((page) => {
          const Icon = page.icon;
          return (
            <Card key={page.path} className="overflow-hidden">
              <CardHeader className={`bg-gradient-to-r from-${page.color}-500 to-${page.color}-600 text-white`}>
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Icon className="h-8 w-8" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl text-white">{page.title}</CardTitle>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* الوصف */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-lg flex items-center gap-2">
                      <FileCode className="h-5 w-5 text-primary" />
                      وصف الصفحة
                    </h4>
                    <p className="text-muted-foreground">{page.description}</p>
                    <Button variant="outline" onClick={() => navigate(page.path)}>
                      الانتقال إلى {page.title}
                    </Button>
                  </div>

                  {/* المميزات */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-lg flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-primary" />
                      أهم المميزات
                    </h4>
                    <ul className="space-y-2">
                      {page.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <div className={`h-2 w-2 rounded-full bg-${page.color}-500 mt-2 flex-shrink-0`}></div>
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
