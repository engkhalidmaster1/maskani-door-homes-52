import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Building, MapPin, Phone, Mail, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useRealEstateOfficesDB, type OfficeFormData } from '@/hooks/useRealEstateOfficesDB';
import { MapPicker } from '@/components/MapPicker';

const services = [
  'بيع العقارات',
  'تأجير العقارات', 
  'إدارة الممتلكات',
  'التقييم العقاري',
  'الاستشارات العقارية',
  'التسويق العقاري',
  'التمويل العقاري',
  'الصيانة والتطوير'
];

const RegisterOfficeSimple = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { createOffice, loading } = useRealEstateOfficesDB();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<OfficeFormData>({
    name: '',
    license_number: '',
    description: '',
    phone: '',
    email: '',
    website: '',
    address: '',
    latitude: 33.3152,
    longitude: 44.3661,
    services: [],
    working_hours: {
      saturday: { open: '09:00', close: '17:00', closed: false },
      sunday: { open: '09:00', close: '17:00', closed: false },
      monday: { open: '09:00', close: '17:00', closed: false },
      tuesday: { open: '09:00', close: '17:00', closed: false },
      wednesday: { open: '09:00', close: '17:00', closed: false },
      thursday: { open: '09:00', close: '17:00', closed: false },
      friday: { open: '09:00', close: '17:00', closed: true }
    }
  });

  const totalSteps = 3;

  const handleInputChange = (field: keyof OfficeFormData, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleServiceToggle = (service: string) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter(s => s !== service)
        : [...prev.services, service]
    }));
  };

  const handleLocationSelect = (lat: number, lng: number, address?: string) => {
    setFormData(prev => ({
      ...prev,
      latitude: lat,
      longitude: lng,
      address: address || prev.address
    }));
  };

  const validateStep = (step: number) => {
    switch (step) {
      case 1:
        return formData.name && formData.license_number && formData.phone;
      case 2:
        return formData.address && formData.latitude && formData.longitude;
      case 3:
        return formData.services.length > 0;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    } else {
      toast({
        title: "يرجى إكمال الحقول المطلوبة",
        description: "تأكد من ملء جميع الحقول المطلوبة في هذه الخطوة",
        variant: "destructive",
      });
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) {
      toast({
        title: "يرجى إكمال الحقول المطلوبة",
        description: "تأكد من ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }

    const success = await createOffice(formData);
    if (success) {
      navigate('/offices');
    }
  };

  const getStepTitle = (step: number) => {
    switch (step) {
      case 1: return "المعلومات الأساسية";
      case 2: return "الموقع والعنوان";
      case 3: return "الخدمات وساعات العمل";
      default: return "";
    }
  };

  return (
    <div className="container py-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button variant="outline" size="sm" onClick={() => navigate('/offices')}>
          <ArrowLeft className="ml-2 h-4 w-4" />
          العودة
        </Button>
        <div>
          <h1 className="text-3xl font-bold">تسجيل مكتب عقاري</h1>
          <p className="text-gray-600 mt-2">انضم إلى شبكة المكاتب العقارية المعتمدة</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {Array.from({ length: totalSteps }, (_, i) => (
            <div key={i + 1} className="flex items-center">
              <div 
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                  i + 1 <= currentStep 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {i + 1}
              </div>
              {i < totalSteps - 1 && (
                <div 
                  className={`flex-1 h-2 mx-4 rounded ${
                    i + 1 < currentStep ? 'bg-primary' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <h2 className="text-xl font-semibold text-center">{getStepTitle(currentStep)}</h2>
      </div>

      <Card>
        <CardContent className="p-8">
          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <Building className="h-16 w-16 text-primary mx-auto mb-4" />
                <h3 className="text-lg font-semibold">معلومات المكتب الأساسية</h3>
                <p className="text-gray-600">أدخل المعلومات الأساسية للمكتب العقاري</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="office-name">اسم المكتب العقاري *</Label>
                  <Input
                    id="office-name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="مثال: مكتب العقارات الذهبية"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="license-number">رقم الترخيص *</Label>
                  <Input
                    id="license-number"
                    value={formData.license_number}
                    onChange={(e) => handleInputChange('license_number', e.target.value)}
                    placeholder="مثال: RE001"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="phone">رقم الهاتف *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="+964 771 234 5678"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="email">البريد الإلكتروني</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="info@example.com"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="website">الموقع الإلكتروني</Label>
                  <div className="relative">
                    <Globe className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="website"
                      value={formData.website}
                      onChange={(e) => handleInputChange('website', e.target.value)}
                      placeholder="https://www.example.com"
                      className="pr-10"
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="description">وصف المكتب</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="اكتب وصفاً مختصراً عن مكتبك وخدماتك..."
                    rows={4}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Location */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <MapPin className="h-16 w-16 text-primary mx-auto mb-4" />
                <h3 className="text-lg font-semibold">موقع المكتب</h3>
                <p className="text-gray-600">حدد موقع مكتبك على الخريطة</p>
              </div>

              <div>
                <Label htmlFor="address">العنوان التفصيلي *</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="أدخل العنوان التفصيلي..."
                  required
                />
              </div>

              <div>
                <Label>اختر الموقع على الخريطة</Label>
                <MapPicker
                  initialPosition={[formData.latitude || 33.3128, formData.longitude || 44.3615]}
                  onLocationSelect={handleLocationSelect}
                  height="400px"
                />
              </div>
            </div>
          )}

          {/* Step 3: Services and Hours */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <Building className="h-16 w-16 text-primary mx-auto mb-4" />
                <h3 className="text-lg font-semibold">الخدمات وساعات العمل</h3>
                <p className="text-gray-600">حدد خدماتك وساعات عملك</p>
              </div>

              <div>
                <Label>الخدمات المقدمة *</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-3">
                  {services.map((service) => (
                    <div key={service} className="flex items-center space-x-2 space-x-reverse">
                      <Checkbox
                        id={service}
                        checked={formData.services.includes(service)}
                        onCheckedChange={() => handleServiceToggle(service)}
                      />
                      <Label htmlFor={service} className="text-sm cursor-pointer">
                        {service}
                      </Label>
                    </div>
                  ))}
                </div>
                {formData.services.length === 0 && (
                  <p className="text-sm text-red-500 mt-2">يرجى اختيار خدمة واحدة على الأقل</p>
                )}
              </div>

              <div>
                <Label>ساعات العمل</Label>
                <div className="space-y-3 mt-3">
                  {Object.entries(formData.working_hours).map(([day, hours]) => (
                    <div key={day} className="flex items-center gap-4 p-3 border rounded-lg">
                      <div className="w-20 text-sm font-medium">
                        {day === 'saturday' ? 'السبت' :
                         day === 'sunday' ? 'الأحد' :
                         day === 'monday' ? 'الاثنين' :
                         day === 'tuesday' ? 'الثلاثاء' :
                         day === 'wednesday' ? 'الأربعاء' :
                         day === 'thursday' ? 'الخميس' : 'الجمعة'}
                      </div>
                      
                      <Checkbox
                        checked={!hours.closed}
                        onCheckedChange={(checked) => {
                          const updatedHours = { ...formData.working_hours };
                          updatedHours[day as keyof typeof updatedHours].closed = !checked;
                          handleInputChange('working_hours', updatedHours);
                        }}
                      />
                      
                      {!hours.closed && (
                        <>
                          <Input
                            type="time"
                            value={hours.open}
                            onChange={(e) => {
                              const updatedHours = { ...formData.working_hours };
                              updatedHours[day as keyof typeof updatedHours].open = e.target.value;
                              handleInputChange('working_hours', updatedHours);
                            }}
                            className="w-24"
                          />
                          <span className="text-gray-500">إلى</span>
                          <Input
                            type="time"
                            value={hours.close}
                            onChange={(e) => {
                              const updatedHours = { ...formData.working_hours };
                              updatedHours[day as keyof typeof updatedHours].close = e.target.value;
                              handleInputChange('working_hours', updatedHours);
                            }}
                            className="w-24"
                          />
                        </>
                      )}
                      
                      {hours.closed && (
                        <span className="text-gray-500 text-sm">مغلق</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <div>
              {currentStep > 1 && (
                <Button variant="outline" onClick={handlePrevious}>
                  السابق
                </Button>
              )}
            </div>
            
            <div>
              {currentStep < totalSteps ? (
                <Button onClick={handleNext}>
                  التالي
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={loading}>
                  {loading ? 'جاري التسجيل...' : 'تسجيل المكتب'}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RegisterOfficeSimple;