import React, { useState } from 'react';
import { useOfficeManagement } from '@/hooks/useOfficeManagement';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Building2, 
  Users, 
  AlertTriangle,
  Eye,
  MessageSquare,
  Phone,
  Mail,
  MapPin
} from 'lucide-react';

import type { RealEstateOffice, OfficeActionData } from '@/hooks/useOfficeManagement';

const AdminDashboard: React.FC = () => {
  const {
    offices,
    pendingOffices,
    loading,
    isAdmin,
    adminUser,
    approveOffice,
    rejectOffice,
    suspendOffice,
    reactivateOffice,
    totalOffices,
    pendingCount,
    activeCount,
    suspendedCount,
    inactiveCount,
  } = useOfficeManagement();

  const [selectedOffice, setSelectedOffice] = useState<RealEstateOffice | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'suspend' | 'activate'>('approve');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // التحقق من الصلاحيات
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Alert className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            ليس لديك صلاحية للوصول إلى لوحة تحكم الإدارة
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // تنفيذ الإجراء المحدد
  const handleOfficeAction = async () => {
    if (!selectedOffice) return;

    setActionLoading(true);

    const actionData: OfficeActionData = {
      officeId: selectedOffice.id,
      status: actionType === 'approve' ? 'active' : 
              actionType === 'reject' ? 'inactive' : 
              actionType === 'suspend' ? 'suspended' : 'active',
      reason,
      notes,
    };

    let success = false;

    switch (actionType) {
      case 'approve':
        success = await approveOffice(actionData);
        break;
      case 'reject':
        success = await rejectOffice(actionData);
        break;
      case 'suspend':
        success = await suspendOffice(actionData);
        break;
      case 'activate':
        success = await reactivateOffice(actionData);
        break;
    }

    if (success) {
      setSelectedOffice(null);
      setReason('');
      setNotes('');
    }

    setActionLoading(false);
  };

  // مكون إحصائية
  const StatCard: React.FC<{
    title: string;
    value: number;
    icon: React.ReactNode;
    color: string;
  }> = ({ title, value, icon, color }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={`p-2 rounded-full ${color}`}>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );

  // مكون بطاقة المكتب
  const OfficeCard: React.FC<{
    office: RealEstateOffice;
    showActions?: boolean;
  }> = ({ office, showActions = true }) => {
    const getStatusBadge = (status: string) => {
      const variants = {
        pending: { variant: 'secondary' as const, text: 'قيد المراجعة', color: 'bg-yellow-100 text-yellow-800' },
        active: { variant: 'default' as const, text: 'مفعل', color: 'bg-green-100 text-green-800' },
        suspended: { variant: 'destructive' as const, text: 'معلق', color: 'bg-red-100 text-red-800' },
        inactive: { variant: 'outline' as const, text: 'غير مفعل', color: 'bg-gray-100 text-gray-800' },
      };

      const config = variants[status as keyof typeof variants] || variants.inactive;

      return (
        <Badge className={config.color}>
          {config.text}
        </Badge>
      );
    };

    return (
      <Card className="w-full">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <CardTitle className="text-lg">{office.name}</CardTitle>
              <CardDescription>
                رخصة رقم: {office.license_number}
              </CardDescription>
            </div>
            {getStatusBadge(office.status)}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="h-4 w-4" />
              <span>{office.address}</span>
            </div>
            
            {office.phone && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Phone className="h-4 w-4" />
                <span dir="ltr">{office.phone}</span>
              </div>
            )}

            {office.email && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail className="h-4 w-4" />
                <span>{office.email}</span>
              </div>
            )}

            {office.description && (
              <p className="text-sm text-gray-700 line-clamp-2">
                {office.description}
              </p>
            )}

            <div className="text-xs text-gray-500">
              تاريخ التسجيل: {new Date(office.created_at).toLocaleDateString('ar-SA')}
            </div>
            
            {showActions && (
              <div className="flex flex-wrap gap-2 pt-3">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedOffice(office)}
                    >
                      <Eye className="w-4 h-4 ml-1" />
                      عرض التفاصيل
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>تفاصيل المكتب العقاري</DialogTitle>
                    </DialogHeader>
                    <OfficeDetailsModal office={office} />
                  </DialogContent>
                </Dialog>

                {office.status === 'pending' && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedOffice(office);
                        setActionType('approve');
                      }}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle2 className="w-4 h-4 ml-1" />
                      موافقة
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        setSelectedOffice(office);
                        setActionType('reject');
                      }}
                    >
                      <XCircle className="w-4 h-4 ml-1" />
                      رفض
                    </Button>
                  </>
                )}

                {office.status === 'active' && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      setSelectedOffice(office);
                      setActionType('suspend');
                    }}
                  >
                    <AlertTriangle className="w-4 h-4 ml-1" />
                    تعليق
                  </Button>
                )}

                {office.status === 'suspended' && (
                  <Button
                    size="sm"
                    onClick={() => {
                      setSelectedOffice(office);
                      setActionType('activate');
                    }}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <CheckCircle2 className="w-4 h-4 ml-1" />
                    إعادة تفعيل
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  // مكون تفاصيل المكتب
  const OfficeDetailsModal: React.FC<{ office: RealEstateOffice }> = ({ office }) => (
    <div className="space-y-4 max-h-96 overflow-y-auto">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>اسم المكتب</Label>
          <p className="text-sm font-medium">{office.name}</p>
        </div>
        <div>
          <Label>رقم الرخصة</Label>
          <p className="text-sm font-medium">{office.license_number}</p>
        </div>
      </div>

      {office.description && (
        <div>
          <Label>الوصف</Label>
          <p className="text-sm">{office.description}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>الهاتف</Label>
          <p className="text-sm" dir="ltr">{office.phone || 'غير محدد'}</p>
        </div>
        <div>
          <Label>البريد الإلكتروني</Label>
          <p className="text-sm">{office.email || 'غير محدد'}</p>
        </div>
      </div>

      <div>
        <Label>العنوان</Label>
        <p className="text-sm">{office.address}</p>
      </div>

      {office.website && (
        <div>
          <Label>الموقع الإلكتروني</Label>
          <p className="text-sm">{office.website}</p>
        </div>
      )}

      {office.services && office.services.length > 0 && (
        <div>
          <Label>الخدمات</Label>
          <div className="flex flex-wrap gap-1 mt-1">
            {office.services.map((service, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {service}
              </Badge>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 pt-2 border-t">
        <div>
          <Label>تاريخ التسجيل</Label>
          <p className="text-sm">{new Date(office.created_at).toLocaleString('ar-SA')}</p>
        </div>
        <div>
          <Label>آخر تحديث</Label>
          <p className="text-sm">{new Date(office.updated_at).toLocaleString('ar-SA')}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* رأس الصفحة */}
        <div className="bg-white rounded-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            لوحة تحكم الإدارة
          </h1>
          <p className="text-gray-600">
            مرحباً {adminUser?.role === 'super_admin' ? 'مدير عام' : 'مدير'} - 
            إدارة ومراجعة المكاتب العقارية
          </p>
        </div>

        {/* الإحصائيات */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="إجمالي المكاتب"
            value={totalOffices}
            icon={<Building2 className="h-4 w-4 text-white" />}
            color="bg-blue-500"
          />
          <StatCard
            title="في الانتظار"
            value={pendingCount}
            icon={<Clock className="h-4 w-4 text-white" />}
            color="bg-yellow-500"
          />
          <StatCard
            title="مفعل"
            value={activeCount}
            icon={<CheckCircle2 className="h-4 w-4 text-white" />}
            color="bg-green-500"
          />
          <StatCard
            title="معلق"
            value={suspendedCount}
            icon={<AlertTriangle className="h-4 w-4 text-white" />}
            color="bg-red-500"
          />
        </div>

        {/* المحتوى الرئيسي */}
        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="pending">
              المعلقة ({pendingCount})
            </TabsTrigger>
            <TabsTrigger value="all">
              جميع المكاتب ({totalOffices})
            </TabsTrigger>
            <TabsTrigger value="active">
              المفعلة ({activeCount})
            </TabsTrigger>
            <TabsTrigger value="suspended">
              المعلقة ({suspendedCount})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            <div className="bg-white rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">
                المكاتب في انتظار المراجعة ({pendingCount})
              </h2>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">جاري التحميل...</p>
                </div>
              ) : pendingOffices.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">لا توجد مكاتب في انتظار المراجعة</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {pendingOffices.map((office) => (
                    <OfficeCard key={office.id} office={office} />
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="all" className="space-y-4">
            <div className="bg-white rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">
                جميع المكاتب ({totalOffices})
              </h2>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">جاري التحميل...</p>
                </div>
              ) : offices.length === 0 ? (
                <div className="text-center py-8">
                  <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">لا توجد مكاتب مسجلة</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {offices.map((office) => (
                    <OfficeCard key={office.id} office={office} />
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="active" className="space-y-4">
            <div className="bg-white rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">
                المكاتب المفعلة ({activeCount})
              </h2>
              <div className="grid gap-4">
                {offices
                  .filter(office => office.status === 'active')
                  .map((office) => (
                    <OfficeCard key={office.id} office={office} />
                  ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="suspended" className="space-y-4">
            <div className="bg-white rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">
                المكاتب المعلقة ({suspendedCount})
              </h2>
              <div className="grid gap-4">
                {offices
                  .filter(office => office.status === 'suspended')
                  .map((office) => (
                    <OfficeCard key={office.id} office={office} />
                  ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* نافذة الإجراء */}
        {selectedOffice && (
          <Dialog
            open={!!selectedOffice}
            onOpenChange={(open) => {
              if (!open) {
                setSelectedOffice(null);
                setReason('');
                setNotes('');
              }
            }}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {actionType === 'approve' && 'موافقة على المكتب'}
                  {actionType === 'reject' && 'رفض المكتب'}
                  {actionType === 'suspend' && 'تعليق المكتب'}
                  {actionType === 'activate' && 'إعادة تفعيل المكتب'}
                </DialogTitle>
                <DialogDescription>
                  المكتب: {selectedOffice.name}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="reason">السبب *</Label>
                  <Textarea
                    id="reason"
                    placeholder="اكتب السبب هنا..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="notes">ملاحظات إضافية</Label>
                  <Textarea
                    id="notes"
                    placeholder="ملاحظات اختيارية..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedOffice(null)}
                    disabled={actionLoading}
                  >
                    إلغاء
                  </Button>
                  <Button
                    onClick={handleOfficeAction}
                    disabled={!reason.trim() || actionLoading}
                    className={
                      actionType === 'approve'
                        ? 'bg-green-600 hover:bg-green-700'
                        : actionType === 'activate'
                        ? 'bg-blue-600 hover:bg-blue-700'
                        : actionType === 'reject'
                        ? 'bg-red-600 hover:bg-red-700'
                        : 'bg-yellow-600 hover:bg-yellow-700'
                    }
                  >
                    {actionLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : null}
                    تأكيد الإجراء
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;