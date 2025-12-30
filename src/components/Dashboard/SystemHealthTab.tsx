import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Database,
  Server,
  TrendingUp,
  Zap,
  RefreshCw,
  ExternalLink,
  Bell,
  Info
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useSystemMetrics, useAlerts, checkThresholds } from "@/hooks/useSystemHealth";

export const SystemHealthTab = () => {
  const { metrics, isLoading: metricsLoading, refetch: refetchMetrics } = useSystemMetrics();
  const { alerts, resolveAlert, createAlert } = useAlerts();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // محاكاة تحديث البيانات
  const refreshMetrics = async () => {
    setIsRefreshing(true);
    await refetchMetrics();
    setIsRefreshing(false);
    toast({
      title: "تم تحديث البيانات",
      description: "تم تحديث مؤشرات النظام بنجاح",
    });
  };

  // فحص تلقائي للتنبيهات عند تحديث المقاييس
  useEffect(() => {
    if (!metricsLoading) {
      const newAlerts = checkThresholds(metrics);
      newAlerts.forEach(alert => {
        // تحقق من عدم وجود تنبيه مشابه نشط
        const existingAlert = alerts.find(a =>
          !a.resolved &&
          a.title === alert.title &&
          a.type === alert.type
        );

        if (!existingAlert) {
          createAlert(alert);
        }
      });
    }
  }, [metrics, metricsLoading, alerts, createAlert]);

  if (metricsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>جاري تحميل بيانات النظام...</p>
        </div>
      </div>
    );
  }

  const getStatusColor = (value: number, thresholds: { warning: number; critical: number }) => {
    if (value >= thresholds.critical) return 'text-red-600';
    if (value >= thresholds.warning) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getProgressColor = (value: number) => {
    if (value >= 80) return 'bg-red-500';
    if (value >= 60) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const handleResolveAlert = async (alertId: string) => {
    await resolveAlert(alertId);
    toast({
      title: "تم حل التنبيه",
      description: "تم وضع علامة تم الحل على التنبيه",
    });
  };

  const upgradePlan = () => {
    // في التطبيق الحقيقي، هذا سيفتح صفحة ترقية الخطة
    window.open('https://supabase.com/dashboard/project/YOUR_PROJECT/billing', '_blank');
    toast({
      title: "ترقية الخطة",
      description: "تم فتح صفحة ترقية الخطة في نافذة جديدة",
    });
  };

  return (
    <div className="space-y-6">
      {/* رأس الصفحة مع زر التحديث */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">حالة النظام</h2>
          <p className="text-muted-foreground">مراقبة أداء النظام والتنبيهات</p>
        </div>
        <Button
          onClick={refreshMetrics}
          disabled={isRefreshing}
          variant="outline"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          تحديث البيانات
        </Button>
      </div>

      {/* معلومات توضيحية */}
      <Alert className="border-green-200 bg-green-50">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertTitle className="text-green-800">البيانات متصلة بقاعدة البيانات الحقيقية</AlertTitle>
        <AlertDescription className="text-green-700">
          جميع المؤشرات والتنبيهات تُجلب من قاعدة البيانات مباشرة. البيانات تُحدث تلقائياً كل 30 ثانية.
        </AlertDescription>
      </Alert>

      {/* مؤشرات النظام الرئيسية */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الاتصالات النشطة</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getStatusColor(metrics.activeConnections, { warning: 60, critical: 80 })}`}>
              {metrics.activeConnections}
            </div>
            <Progress value={metrics.activeConnections} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">من أصل 100 اتصال</p>
            <p className="text-xs text-muted-foreground mt-2">
              <strong>الشرح:</strong> عدد المستخدمين المتصلين حالياً بالتطبيق.
              <br />• أخضر: طبيعي (أقل من 60)
              <br />• أصفر: متوسط (60-80)
              <br />• أحمر: حرج (أكثر من 80)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">زمن الاستجابة</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getStatusColor(metrics.latency, { warning: 300, critical: 500 })}`}>
              {metrics.latency}ms
            </div>
            <Progress value={Math.min(metrics.latency / 10, 100)} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">متوسط P95</p>
            <p className="text-xs text-muted-foreground mt-2">
              <strong>الشرح:</strong> الوقت المستغرق للرد على الطلبات (95% من الطلبات).
              <br />• أخضر: سريع (أقل من 300ms)
              <br />• أصفر: متوسط (300-500ms)
              <br />• أحمر: بطيء (أكثر من 500ms)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">استخدام CPU</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getStatusColor(metrics.cpuUsage, { warning: 70, critical: 90 })}`}>
              {metrics.cpuUsage}%
            </div>
            <Progress value={metrics.cpuUsage} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">معدل الاستخدام</p>
            <p className="text-xs text-muted-foreground mt-2">
              <strong>الشرح:</strong> نسبة استخدام معالج الخادم.
              <br />• أخضر: طبيعي (أقل من 70%)
              <br />• أصفر: مرتفع (70-90%)
              <br />• أحمر: حرج (أكثر من 90%)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">استخدام الذاكرة</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getStatusColor(metrics.memoryUsage, { warning: 75, critical: 90 })}`}>
              {metrics.memoryUsage}%
            </div>
            <Progress value={metrics.memoryUsage} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">من إجمالي الذاكرة</p>
            <p className="text-xs text-muted-foreground mt-2">
              <strong>الشرح:</strong> نسبة استخدام ذاكرة الخادم.
              <br />• أخضر: طبيعي (أقل من 75%)
              <br />• أصفر: مرتفع (75-90%)
              <br />• أحمر: حرج (أكثر من 90%)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* إحصائيات إضافية */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">معدل الأخطاء</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{metrics.errorRate}%</div>
            <p className="text-xs text-muted-foreground">في آخر ساعة</p>
            <p className="text-xs text-muted-foreground mt-2">
              <strong>الشرح:</strong> نسبة الطلبات التي فشلت في آخر ساعة.
              <br />• أخضر: منخفض (أقل من 1%)
              <br />• أحمر: مرتفع (أكثر من 1%)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">مدة التشغيل</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{Math.floor(metrics.uptime / 24)} يوم</div>
            <p className="text-xs text-muted-foreground">{metrics.uptime % 24} ساعة متواصلة</p>
            <p className="text-xs text-muted-foreground mt-2">
              <strong>الشرح:</strong> الوقت الذي مضى منذ آخر إعادة تشغيل للخادم.
              <br />كلما طالت المدة، كان ذلك أفضل (استقرار أكبر).
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">آخر نسخة احتياطية</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {new Date(metrics.lastBackup).toLocaleDateString('ar-SA')}
            </div>
            <p className="text-xs text-muted-foreground">
              {new Date(metrics.lastBackup).toLocaleTimeString('ar-SA')}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              <strong>الشرح:</strong> تاريخ آخر نسخة احتياطية لقاعدة البيانات.
              <br />يُفضل أن تكون يومية أو أسبوعية على الأقل.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* التنبيهات النشطة */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            التنبيهات والإشعارات
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Alert className="border-green-200 bg-green-50">
              <Info className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800">شرح التنبيهات</AlertTitle>
              <AlertDescription className="text-green-700">
                <strong>أنواع التنبيهات:</strong>
                <br />• <span className="text-red-600 font-semibold">خطأ (أحمر):</span> مشاكل حرجة تحتاج تدخل فوري
                <br />• <span className="text-yellow-600 font-semibold">تحذير (أصفر):</span> مشاكل متوسطة تحتاج مراقبة
                <br />• <span className="text-blue-600 font-semibold">معلومات (أزرق):</span> إشعارات روتينية
                <br /><br />
                <strong>التنبيهات الشائعة:</strong>
                <br />• عدد الاتصالات المرتفع: يشير إلى ضغط كبير على الخادم
                <br />• ارتفاع معدل الأخطاء: يعني فشل في معالجة الطلبات
                <br />• اقتراب من الحدود: تنبيه مبكر قبل الوصول للحد الأقصى
              </AlertDescription>
            </Alert>

            {alerts.filter(alert => !alert.resolved).length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <p className="text-muted-foreground">جميع التنبيهات محلولة ✅</p>
              </div>
            ) : (
              alerts.filter(alert => !alert.resolved).map((alert) => (
                <Alert key={alert.id} className={`border-l-4 ${
                  alert.type === 'error' ? 'border-l-red-500' :
                  alert.type === 'warning' ? 'border-l-yellow-500' :
                  'border-l-blue-500'
                }`}>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle className="flex items-center justify-between">
                    {alert.title}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleResolveAlert(alert.id)}
                      >
                        حل
                      </Button>
                      {alert.type === 'error' && (
                        <Button
                          size="sm"
                          onClick={upgradePlan}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          <TrendingUp className="w-4 h-4 mr-1" />
                          ترقية الخطة
                        </Button>
                      )}
                    </div>
                  </AlertTitle>
                  <AlertDescription>
                    {alert.description}
                    <br />
                    <span className="text-xs text-muted-foreground">
                      {alert.timestamp.toLocaleString('ar-SA')}
                    </span>
                  </AlertDescription>
                </Alert>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* سجل التنبيهات */}
      <Card>
        <CardHeader>
          <CardTitle>سجل التنبيهات</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>النوع</TableHead>
                <TableHead>العنوان</TableHead>
                <TableHead>التاريخ</TableHead>
                <TableHead>الحالة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {alerts.map((alert) => (
                <TableRow key={alert.id}>
                  <TableCell>
                    <Badge variant={
                      alert.type === 'error' ? 'destructive' :
                      alert.type === 'warning' ? 'secondary' :
                      'outline'
                    }>
                      {alert.type === 'error' ? 'خطأ' :
                       alert.type === 'warning' ? 'تحذير' : 'معلومات'}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">{alert.title}</TableCell>
                  <TableCell>{alert.timestamp.toLocaleString('ar-SA')}</TableCell>
                  <TableCell>
                    <Badge variant={alert.resolved ? 'outline' : 'default'}>
                      {alert.resolved ? 'محلول' : 'نشط'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* إجراءات سريعة */}
      <Card>
        <CardHeader>
          <CardTitle>إجراءات سريعة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Alert className="border-blue-200 bg-blue-50">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertTitle className="text-blue-800">شرح الإجراءات السريعة</AlertTitle>
              <AlertDescription className="text-blue-700">
                <strong>تحسين قاعدة البيانات:</strong> تنظيف وتحسين الفهارس وإزالة البيانات المكررة
                <br /><strong>مسح ذاكرة التخزين المؤقت:</strong> حذف البيانات المؤقتة لتحسين الأداء
                <br /><strong>لوحة تحكم Supabase:</strong> الوصول المباشر إلى إدارة قاعدة البيانات والمراقبة
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button variant="outline" className="h-20 flex-col gap-2">
                <Database className="w-6 h-6" />
                <span>تحسين قاعدة البيانات</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col gap-2">
                <Zap className="w-6 h-6" />
                <span>مسح ذاكرة التخزين المؤقت</span>
              </Button>
              <Button
                variant="outline"
                className="h-20 flex-col gap-2"
                onClick={() => window.open('https://supabase.com/dashboard', '_blank')}
              >
                <ExternalLink className="w-6 h-6" />
                <span>لوحة تحكم Supabase</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};