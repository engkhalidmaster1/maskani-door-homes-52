import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  Clock, 
  Activity,
  Lock,
  Unlock,
  Eye,
  EyeOff
} from 'lucide-react';
import { useSecurityMonitor } from '@/hooks/useSecurityMonitor';
import { useRateLimit } from '@/hooks/useRateLimit';
import { useAuth } from '@/hooks/useAuth';

interface SecurityDashboardProps {
  className?: string;
}

export const SecurityDashboard = React.memo(({ className }: SecurityDashboardProps) => {
  const { user, session } = useAuth();
  const [showDetails, setShowDetails] = useState(false);
  
  const {
    securityEvents,
    metrics,
    isBlocked,
    securityScore,
    recentAlerts,
    locationInfo,
    isSecure,
    needsAttention
  } = useSecurityMonitor(user, session, {
    maxFailedAttempts: 5,
    sessionTimeoutMinutes: 60,
    enableActivityTracking: true,
    enableLocationTracking: true
  });

  const {
    statistics: rateLimitStats,
    hasActiveBlocks,
    totalRequests,
    resetAll: resetRateLimit
  } = useRateLimit();

  // Security score color and icon
  const getSecurityIndicator = () => {
    if (securityScore >= 80) {
      return { 
        color: 'text-green-600', 
        bg: 'bg-green-100', 
        icon: ShieldCheck, 
        label: 'آمن' 
      };
    } else if (securityScore >= 60) {
      return { 
        color: 'text-yellow-600', 
        bg: 'bg-yellow-100', 
        icon: Shield, 
        label: 'معتدل' 
      };
    } else {
      return { 
        color: 'text-red-600', 
        bg: 'bg-red-100', 
        icon: ShieldAlert, 
        label: 'خطر' 
      };
    }
  };

  const indicator = getSecurityIndicator();
  const IconComponent = indicator.icon;

  if (!user) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            لوحة الأمان
          </CardTitle>
          <CardDescription>
            يجب تسجيل الدخول لعرض معلومات الأمان
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            لوحة الأمان
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-2"
          >
            {showDetails ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showDetails ? 'إخفاء التفاصيل' : 'عرض التفاصيل'}
          </Button>
        </div>
        <CardDescription>
          مراقبة حالة أمان الحساب والجلسة
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Security Score Overview */}
        <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${indicator.bg}`}>
              <IconComponent className={`h-5 w-5 ${indicator.color}`} />
            </div>
            <div>
              <h3 className="font-semibold">نقاط الأمان</h3>
              <p className="text-sm text-muted-foreground">
                {indicator.label} - {securityScore}/100
              </p>
            </div>
          </div>
          <div className="text-right">
            <Progress value={securityScore} className="w-24" />
          </div>
        </div>

        {/* Security Alerts */}
        {recentAlerts.length > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>تنبيهات أمنية:</strong> {recentAlerts.length} تنبيه في آخر 24 ساعة
            </AlertDescription>
          </Alert>
        )}

        {/* Account Status */}
        {(isBlocked || hasActiveBlocks) && (
          <Alert variant="destructive">
            <Lock className="h-4 w-4" />
            <AlertDescription>
              {isBlocked && 'حسابك محظور مؤقتاً بسبب نشاط مشبوه. '}
              {hasActiveBlocks && 'بعض الخدمات محظورة بسبب تجاوز الحد المسموح.'}
            </AlertDescription>
          </Alert>
        )}

        {showDetails && (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
              <TabsTrigger value="activity">النشاط</TabsTrigger>
              <TabsTrigger value="limits">الحدود</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Session Info */}
                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    معلومات الجلسة
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">آخر دخول:</span>
                      <span>{metrics.lastLoginTime?.toLocaleString('ar-IQ')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">مهلة الجلسة:</span>
                      <span>{Math.round(metrics.sessionTimeout / 60000)} دقيقة</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">الموقع:</span>
                      <span>
                        {locationInfo.country && locationInfo.city 
                          ? `${locationInfo.city}, ${locationInfo.country}`
                          : 'غير محدد'
                        }
                      </span>
                    </div>
                  </div>
                </div>

                {/* Security Metrics */}
                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    المقاييس الأمنية
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">محاولات دخول فاشلة:</span>
                      <Badge variant={metrics.failedLoginAttempts > 3 ? "destructive" : "secondary"}>
                        {metrics.failedLoginAttempts}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">أنشطة مشبوهة:</span>
                      <Badge variant={metrics.suspiciousActivities > 0 ? "destructive" : "secondary"}>
                        {metrics.suspiciousActivities}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">الجلسات النشطة:</span>
                      <Badge variant="secondary">{metrics.activeSessionsCount}</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="activity" className="space-y-4">
              <div className="space-y-3">
                <h4 className="font-semibold">آخر الأحداث الأمنية</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {securityEvents.length > 0 ? (
                    securityEvents.slice(0, 10).map((event) => (
                      <div
                        key={event.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              event.severity === 'critical' ? 'destructive' :
                              event.severity === 'high' ? 'destructive' :
                              event.severity === 'medium' ? 'default' : 'secondary'
                            }
                          >
                            {event.type}
                          </Badge>
                          <span className="text-sm">{event.message}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {event.timestamp.toLocaleTimeString('ar-IQ')}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      لا توجد أحداث أمنية مسجلة
                    </p>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="limits" className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">حدود معدل الطلبات</h4>
                  {hasActiveBlocks && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={resetRateLimit}
                      className="text-destructive"
                    >
                      إعادة تعيين الحدود
                    </Button>
                  )}
                </div>
                
                <div className="text-sm text-muted-foreground">
                  إجمالي الطلبات: {totalRequests}
                </div>

                <div className="space-y-3">
                  {rateLimitStats.map((stat) => (
                    <div key={stat.ruleId} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{stat.endpoint}</span>
                        <Badge variant={stat.blocked ? "destructive" : "secondary"}>
                          {stat.remaining}/{stat.maxRequests}
                        </Badge>
                      </div>
                      
                      <Progress 
                        value={stat.utilizationPercent} 
                        className="mb-2" 
                      />
                      
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>
                          ناجح: {stat.successfulRequests} | فاشل: {stat.failedRequests}
                        </span>
                        {stat.blocked && stat.blockUntil && (
                          <span className="text-destructive">
                            محظور حتى: {new Date(stat.blockUntil).toLocaleTimeString('ar-IQ')}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}

        {/* Quick Actions */}
        <div className="flex gap-2 pt-4 border-t">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
            onClick={() => window.location.reload()}
          >
            <Shield className="h-4 w-4" />
            تحديث الحالة
          </Button>
          
          {isSecure && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Unlock className="h-3 w-3" />
              حساب آمن
            </Badge>
          )}
          
          {needsAttention && (
            <Badge variant="destructive" className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              يحتاج انتباه
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
});