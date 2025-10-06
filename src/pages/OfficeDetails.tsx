import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Building, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  CheckCircle, 
  Clock,
  Calendar,
  Star,
  MessageCircle
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useRealEstateOfficesDB, type RealEstateOffice } from '@/hooks/useRealEstateOfficesDB';
import { useToast } from '@/hooks/use-toast';
import { ContactModal } from '@/components/ContactModal';
import { ReviewsModal } from '@/components/ReviewsModal';

export const OfficeDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { offices, fetchOffices, fetchOfficeById } = useRealEstateOfficesDB();
  const { toast } = useToast();
  const [selectedOffice, setSelectedOffice] = React.useState<RealEstateOffice | null>(null);
  const [isOfficeLoading, setIsOfficeLoading] = React.useState(false);
  const [hasOfficeError, setHasOfficeError] = React.useState(false);

  React.useEffect(() => {
    // جلب المكاتب عند تحميل الصفحة
    if (offices.length === 0) {
      fetchOffices();
    }
  }, [offices.length, fetchOffices]);

  React.useEffect(() => {
    if (!id) {
      setSelectedOffice(null);
      return;
    }

    const existingOffice = offices.find((o) => o.id === id);
    if (existingOffice) {
      setSelectedOffice(existingOffice);
      setHasOfficeError(false);
      return;
    }

    let isCancelled = false;

    const loadOffice = async () => {
      setSelectedOffice(null);
      setIsOfficeLoading(true);
      setHasOfficeError(false);

      try {
        const officeData = await fetchOfficeById(id);
        if (isCancelled) return;

        if (officeData) {
          setSelectedOffice(officeData);
        } else {
          setHasOfficeError(true);
        }
      } finally {
        if (!isCancelled) {
          setIsOfficeLoading(false);
        }
      }
    };

    void loadOffice();

    return () => {
      isCancelled = true;
    };
  }, [id, offices, fetchOfficeById]);

  const office = selectedOffice;

  const handleContactAction = (type: 'phone' | 'email' | 'whatsapp') => {
    if (!office) return;

    switch (type) {
      case 'phone':
        window.open(`tel:${office.phone}`);
        toast({
          title: "فتح تطبيق الهاتف",
          description: `جاري الاتصال بـ ${office.name}`,
        });
        break;
      case 'email':
        if (office.email) {
          window.open(`mailto:${office.email}`);
          toast({
            title: "فتح تطبيق البريد",
            description: `جاري إرسال بريد إلى ${office.name}`,
          });
        }
        break;
      case 'whatsapp': {
        const phoneNumber = office.phone.replace(/[^0-9]/g, '');
        const message = encodeURIComponent(`مرحباً، أريد الاستفسار عن خدماتكم العقارية في مكتب ${office.name}`);
        window.open(`https://wa.me/${phoneNumber}?text=${message}`);
        toast({
          title: "فتح واتساب",
          description: `جاري التواصل مع ${office.name}`,
        });
        break;
      }
    }
  };

  if (isOfficeLoading && !office) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">جاري تحميل تفاصيل المكتب...</p>
        </div>
      </div>
    );
  }

  if (!office) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <Building className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">المكتب غير موجود</h2>
          <p className="text-gray-600 mb-4">
            {hasOfficeError ? 'لم يتم العثور على المكتب المطلوب' : 'لا تتوفر معلومات المكتب حاليًا'}
          </p>
          <Button onClick={() => navigate('/offices')}>
            العودة إلى قائمة المكاتب
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate('/offices')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          العودة للمكاتب
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* معلومات المكتب الأساسية */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Building className="h-8 w-8 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-2xl mb-2">{office.name}</CardTitle>
                      <p className="text-gray-600 mb-2">رخصة رقم: {office.license_number}</p>
                      <div className="flex items-center gap-2">
                        {office.verified && (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            موثق
                          </Badge>
                        )}
                        <Badge 
                          className={
                            office.status === 'active' 
                              ? 'bg-blue-100 text-blue-800' 
                              : office.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }
                        >
                          {office.status === 'active' 
                            ? 'نشط' 
                            : office.status === 'pending' 
                            ? 'قيد المراجعة' 
                            : 'معلق'
                          }
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {office.description && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">نبذة عن المكتب</h3>
                  <p className="text-gray-700 leading-relaxed">{office.description}</p>
                </div>
              )}

              <Separator />

              <div>
                <h3 className="font-semibold text-gray-900 mb-3">معلومات الاتصال</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <MapPin className="w-5 h-5 text-gray-600" />
                    <div>
                      <p className="font-medium">العنوان</p>
                      <p className="text-gray-600">{office.address}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Phone className="w-5 h-5 text-gray-600" />
                    <div>
                      <p className="font-medium">رقم الهاتف</p>
                      <p className="text-gray-600">{office.phone}</p>
                    </div>
                  </div>
                  {office.email && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Mail className="w-5 h-5 text-gray-600" />
                      <div>
                        <p className="font-medium">البريد الإلكتروني</p>
                        <p className="text-gray-600">{office.email}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* الخريطة */}
          {office.latitude && office.longitude && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  موقع المكتب
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-gray-200 rounded-lg flex items-center justify-center">
                  <div className="text-center text-gray-600">
                    <MapPin className="h-8 w-8 mx-auto mb-2" />
                    <p>خريطة تفاعلية</p>
                    <p className="text-sm">الإحداثيات: {office.latitude}, {office.longitude}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* الشريط الجانبي */}
        <div className="space-y-6">
          {/* أزرار التواصل */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">تواصل مع المكتب</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <ContactModal office={office} fullWidth={true} />
              <Button 
                variant="outline"
                className="w-full flex items-center gap-2" 
                onClick={() => handleContactAction('phone')}
              >
                <Phone className="h-4 w-4" />
                اتصال مباشر
              </Button>
              {office.email && (
                <Button 
                  variant="outline" 
                  className="w-full flex items-center gap-2"
                  onClick={() => handleContactAction('email')}
                >
                  <Mail className="h-4 w-4" />
                  بريد إلكتروني
                </Button>
              )}
            </CardContent>
          </Card>

          {/* المراجعات والتقييمات */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">التقييمات والمراجعات</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <ReviewsModal office={office} />
                
                <div className="flex items-center gap-3 text-sm p-3 bg-gray-50 rounded-lg">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="font-medium">تاريخ التسجيل</p>
                    <p className="text-gray-600">
                      {new Date(office.created_at).toLocaleDateString('ar-SA')}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* إحصائيات سريعة */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">إحصائيات المكتب</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-blue-600">0</p>
                  <p className="text-sm text-gray-600">العقارات</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">0</p>
                  <p className="text-sm text-gray-600">العملاء</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};