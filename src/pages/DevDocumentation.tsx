import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Shield,
  Database,
  Server,
  Layout,
  ArrowDown,
  CheckCircle2,
  Clock,
  AlertTriangle,
  BookOpen,
  Key,
  Smartphone,
  MessageSquare,
} from "lucide-react";

const DevDocumentation = () => {
  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl" dir="rtl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-3 rounded-xl bg-primary/10">
            <BookOpen className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">توثيق التطوير</h1>
            <p className="text-muted-foreground text-sm mt-1">نظام المصادقة الثنائية عبر واتساب (WhatsApp OTP 2FA)</p>
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <Badge variant="outline" className="text-xs">الإصدار 1.0</Badge>
          <Badge variant="secondary" className="text-xs">قيد التطوير</Badge>
        </div>
      </div>

      {/* Overview */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="h-5 w-5 text-primary" />
            نظرة عامة
          </CardTitle>
          <CardDescription>شرح الفكرة العامة وأهداف النظام</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground leading-relaxed">
          <p>
            يهدف هذا النظام إلى إضافة طبقة أمان إضافية عبر إرسال رمز تحقق (OTP) من 6 أرقام
            إلى رقم واتساب المستخدم عند تسجيل الدخول، باستخدام <strong>Meta WhatsApp Business API</strong>.
          </p>
          <p>
            يدعم النظام ميزة <strong>"تذكّر هذا الجهاز"</strong> لمدة 30 يومًا عبر بصمة المتصفح (Device Fingerprint)،
            بحيث لا يُطلب OTP من نفس الجهاز خلال تلك الفترة.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
            {[
              { icon: Key, label: "رمز OTP مكون من 6 أرقام", color: "text-amber-600" },
              { icon: Smartphone, label: "إرسال عبر واتساب", color: "text-green-600" },
              { icon: Shield, label: "تذكّر الجهاز 30 يومًا", color: "text-blue-600" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border">
                <item.icon className={`h-4 w-4 ${item.color}`} />
                <span className="text-xs font-medium text-foreground">{item.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Flow Diagram */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ArrowDown className="h-5 w-5 text-primary" />
            مخطط التدفق
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 font-mono text-xs bg-muted/50 p-4 rounded-lg border overflow-x-auto" dir="ltr">
            {[
              "1. User enters email + password → signIn()",
              "2. Check profiles.whatsapp_number exists?",
              "   ├─ No  → Login directly (no 2FA)",
              "   └─ Yes → Check trusted_devices for this browser",
              "       ├─ Trusted & not expired → Login directly",
              "       └─ Not trusted → Call send-otp-whatsapp Edge Function",
              "3. User receives OTP on WhatsApp",
              "4. User enters OTP → Call verify-otp Edge Function",
              "   ├─ Valid   → Login + optionally save trusted device",
              "   └─ Invalid → Show error (max 3 attempts)",
            ].map((line, i) => (
              <div key={i} className="text-muted-foreground whitespace-pre">{line}</div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Database Schema */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Database className="h-5 w-5 text-primary" />
            هيكل قاعدة البيانات
          </CardTitle>
          <CardDescription>الجداول والدوال المطلوبة</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" className="w-full">
            {/* otp_codes */}
            <AccordionItem value="otp_codes">
              <AccordionTrigger className="text-sm font-semibold">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono text-xs">otp_codes</Badge>
                  <Badge className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">موجود ✓</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <TableSchema
                  columns={[
                    { name: "id", type: "uuid", description: "المعرّف الفريد (PK)" },
                    { name: "user_id", type: "uuid", description: "معرّف المستخدم (FK → auth.users)" },
                    { name: "code_hash", type: "text", description: "هاش SHA-256 لرمز OTP" },
                    { name: "attempts", type: "integer", description: "عدد المحاولات (افتراضي: 0، حد أقصى: 3)" },
                    { name: "verified", type: "boolean", description: "هل تم التحقق (افتراضي: false)" },
                    { name: "expires_at", type: "timestamptz", description: "وقت الانتهاء (5 دقائق)" },
                    { name: "created_at", type: "timestamptz", description: "وقت الإنشاء" },
                  ]}
                  rls="RLS مُفعّل — فقط المستخدم صاحب الرمز يمكنه القراءة"
                />
              </AccordionContent>
            </AccordionItem>

            {/* trusted_devices */}
            <AccordionItem value="trusted_devices">
              <AccordionTrigger className="text-sm font-semibold">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono text-xs">trusted_devices</Badge>
                  <Badge className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">موجود ✓</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <TableSchema
                  columns={[
                    { name: "id", type: "uuid", description: "المعرّف الفريد (PK)" },
                    { name: "user_id", type: "uuid", description: "معرّف المستخدم (FK → auth.users)" },
                    { name: "device_hash", type: "text", description: "بصمة الجهاز (SHA-256)" },
                    { name: "created_at", type: "timestamptz", description: "وقت التسجيل" },
                    { name: "expires_at", type: "timestamptz", description: "صلاحية 30 يومًا" },
                  ]}
                  rls="RLS مُفعّل — فقط المستخدم صاحب الجهاز"
                />
              </AccordionContent>
            </AccordionItem>

            {/* whatsapp_config */}
            <AccordionItem value="whatsapp_config">
              <AccordionTrigger className="text-sm font-semibold">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono text-xs">whatsapp_config</Badge>
                  <Badge className="text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">مخطط ⏳</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <TableSchema
                  columns={[
                    { name: "id", type: "uuid", description: "المعرّف الفريد (PK)" },
                    { name: "access_token", type: "text", description: "Meta API Access Token (مشفّر)" },
                    { name: "phone_number_id", type: "text", description: "معرّف رقم الهاتف في Meta" },
                    { name: "is_active", type: "boolean", description: "هل النظام مفعّل" },
                    { name: "updated_at", type: "timestamptz", description: "آخر تحديث" },
                    { name: "updated_by", type: "uuid", description: "المدير الذي عدّل (FK)" },
                  ]}
                  rls="RLS مُفعّل — المدير فقط يقرأ/يعدّل. دالة get_whatsapp_config() بصلاحية SECURITY DEFINER."
                />
              </AccordionContent>
            </AccordionItem>

            {/* profiles.whatsapp_number */}
            <AccordionItem value="profiles">
              <AccordionTrigger className="text-sm font-semibold">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono text-xs">profiles.whatsapp_number</Badge>
                  <Badge className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">موجود ✓</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="text-sm text-muted-foreground p-3 bg-muted/50 rounded-lg border">
                  عمود <code className="bg-muted px-1 rounded font-mono text-xs">whatsapp_number TEXT</code> مُضاف
                  إلى جدول <code className="bg-muted px-1 rounded font-mono text-xs">profiles</code>.
                  يُستخدم لتحديد ما إذا كان المستخدم يحتاج 2FA عند تسجيل الدخول.
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* Edge Functions */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Server className="h-5 w-5 text-primary" />
            Edge Functions
          </CardTitle>
          <CardDescription>الدوال الطرفية على Supabase</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" className="w-full">
            <AccordionItem value="send-otp">
              <AccordionTrigger className="text-sm font-semibold">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono text-xs">send-otp-whatsapp</Badge>
                  <Badge className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">مكتوبة ✓</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-3">
                <div className="text-sm text-muted-foreground">
                  تُولّد رمز OTP من 6 أرقام، تُخزّن الهاش في <code className="bg-muted px-1 rounded font-mono text-xs">otp_codes</code>،
                  وترسل الرمز عبر Meta WhatsApp API.
                </div>
                <FunctionSpec
                  method="POST"
                  input={{ user_id: "string", phone: "string" }}
                  output={{ success: "boolean", expires_in: "300 (seconds)" }}
                />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="verify-otp">
              <AccordionTrigger className="text-sm font-semibold">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono text-xs">verify-otp</Badge>
                  <Badge className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">مكتوبة ✓</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-3">
                <div className="text-sm text-muted-foreground">
                  تتحقق من صحة الرمز المدخل (هاش مقارنة)، تتحقق من عدد المحاولات وانتهاء الصلاحية.
                  إذا اختار المستخدم "تذكّر الجهاز"، تُسجّل بصمة الجهاز.
                </div>
                <FunctionSpec
                  method="POST"
                  input={{ user_id: "string", code: "string", device_hash: "string?", trust_device: "boolean?" }}
                  output={{ verified: "boolean", error: "string?" }}
                />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* Frontend Changes */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Layout className="h-5 w-5 text-primary" />
            تعديلات الواجهة الأمامية
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" className="w-full">
            <AccordionItem value="useAuth">
              <AccordionTrigger className="text-sm font-semibold">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono text-xs">useAuth.tsx</Badge>
                  <Badge className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">معدّل ✓</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside">
                  <li>إضافة حالة <code className="bg-muted px-1 rounded font-mono text-xs">needsOtp</code> و <code className="bg-muted px-1 rounded font-mono text-xs">otpUserId</code></li>
                  <li>اعتراض تسجيل الدخول للتحقق من وجود رقم واتساب</li>
                  <li>فحص الأجهزة الموثوقة قبل إرسال OTP</li>
                  <li>دوال <code className="bg-muted px-1 rounded font-mono text-xs">sendOtp()</code> و <code className="bg-muted px-1 rounded font-mono text-xs">verifyOtp()</code></li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="login">
              <AccordionTrigger className="text-sm font-semibold">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono text-xs">Login.tsx</Badge>
                  <Badge className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">معدّل ✓</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside">
                  <li>شاشة إدخال OTP مخصصة باستخدام <code className="bg-muted px-1 rounded font-mono text-xs">InputOTP</code></li>
                  <li>مؤقت العد التنازلي للانتهاء (5 دقائق) وإعادة الإرسال (60 ثانية)</li>
                  <li>خيار "تذكّر هذا الجهاز" (Checkbox)</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="fingerprint">
              <AccordionTrigger className="text-sm font-semibold">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono text-xs">deviceFingerprint.ts</Badge>
                  <Badge className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">جديد ✓</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="text-sm text-muted-foreground">
                  أداة مساعدة تُولّد بصمة SHA-256 بناءً على خصائص المتصفح والشاشة
                  (User Agent, اللغة, المنطقة الزمنية, دقة الشاشة, عدد الأنوية, الذاكرة).
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* Secrets */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Key className="h-5 w-5 text-primary" />
            الأسرار المطلوبة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              {
                name: "WHATSAPP_ACCESS_TOKEN",
                description: "رمز الوصول لـ Meta WhatsApp Business API",
                status: "مطلوب",
                statusColor: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
              },
              {
                name: "WHATSAPP_PHONE_NUMBER_ID",
                description: "معرّف رقم الهاتف في حساب Meta Business",
                status: "مطلوب",
                statusColor: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
              },
            ].map((secret) => (
              <div key={secret.name} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                <div>
                  <code className="font-mono text-xs font-semibold text-foreground">{secret.name}</code>
                  <p className="text-xs text-muted-foreground mt-1">{secret.description}</p>
                </div>
                <Badge className={`text-xs ${secret.statusColor}`}>{secret.status}</Badge>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            <AlertTriangle className="h-3 w-3 inline ml-1" />
            سيتم إدارة هذه الأسرار من خلال جدول <code className="font-mono text-xs">whatsapp_config</code> في لوحة التحكم بدلاً من متغيرات البيئة.
          </p>
        </CardContent>
      </Card>

      {/* Implementation Status */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            حالة التنفيذ
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[
              { label: "جدول otp_codes", done: true },
              { label: "جدول trusted_devices", done: true },
              { label: "عمود profiles.whatsapp_number", done: true },
              { label: "Edge Function: send-otp-whatsapp", done: true },
              { label: "Edge Function: verify-otp", done: true },
              { label: "تعديل useAuth.tsx لدعم OTP", done: true },
              { label: "شاشة OTP في Login.tsx", done: true },
              { label: "أداة deviceFingerprint.ts", done: true },
              { label: "جدول whatsapp_config", done: false },
              { label: "واجهة إعدادات واتساب في لوحة التحكم", done: false },
              { label: "تعديل Edge Function لقراءة config من DB", done: false },
              { label: "حقل رقم واتساب في الملف الشخصي", done: false },
              { label: "اختبار شامل للتدفق", done: false },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                {item.done ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                ) : (
                  <Clock className="h-4 w-4 text-yellow-600 shrink-0" />
                )}
                <span className={item.done ? "text-foreground" : "text-muted-foreground"}>{item.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Separator className="my-6" />
      <p className="text-xs text-center text-muted-foreground pb-8">
        <MessageSquare className="h-3 w-3 inline ml-1" />
        آخر تحديث: مارس 2026 — مسكني • توثيق التطوير
      </p>
    </div>
  );
};

/* Helper Components */

function TableSchema({ columns, rls }: { columns: { name: string; type: string; description: string }[]; rls: string }) {
  return (
    <div className="space-y-3">
      <div className="overflow-x-auto">
        <table className="w-full text-xs border rounded-lg overflow-hidden">
          <thead>
            <tr className="bg-muted/70">
              <th className="text-right p-2 font-semibold text-foreground">العمود</th>
              <th className="text-right p-2 font-semibold text-foreground">النوع</th>
              <th className="text-right p-2 font-semibold text-foreground">الوصف</th>
            </tr>
          </thead>
          <tbody>
            {columns.map((col) => (
              <tr key={col.name} className="border-t">
                <td className="p-2 font-mono text-foreground">{col.name}</td>
                <td className="p-2 text-muted-foreground font-mono">{col.type}</td>
                <td className="p-2 text-muted-foreground">{col.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="text-xs text-muted-foreground flex items-center gap-1 p-2 bg-muted/30 rounded border">
        <Shield className="h-3 w-3 text-primary shrink-0" />
        {rls}
      </div>
    </div>
  );
}

function FunctionSpec({ method, input, output }: { method: string; input: Record<string, string>; output: Record<string, string> }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div className="p-3 rounded-lg border bg-muted/30">
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="outline" className="text-xs font-mono">{method}</Badge>
          <span className="text-xs font-semibold text-foreground">المدخلات</span>
        </div>
        <pre className="text-xs font-mono text-muted-foreground whitespace-pre-wrap" dir="ltr">
          {JSON.stringify(input, null, 2)}
        </pre>
      </div>
      <div className="p-3 rounded-lg border bg-muted/30">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-semibold text-foreground">المخرجات</span>
        </div>
        <pre className="text-xs font-mono text-muted-foreground whitespace-pre-wrap" dir="ltr">
          {JSON.stringify(output, null, 2)}
        </pre>
      </div>
    </div>
  );
}

export default DevDocumentation;
