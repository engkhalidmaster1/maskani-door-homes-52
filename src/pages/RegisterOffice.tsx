import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Building, Upload, MapPin, Clock, Star, Phone, Mail, Globe, FileText, Image, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useRealEstateOfficesDB } from '@/hooks/useRealEstateOfficesDB';
import { MapPicker } from '@/components/MapPicker';
import type { OfficeFormData } from '@/hooks/useRealEstateOfficesDB';

const services = [
  'بيع العقارات',
  'تأجير العقارات', 
  'إدارة الممتلكات',
  'التقييم العقاري',
  'الاستشارات العقارية',
  'التسويق العقاري',
  'إجراءات نقل الملكية',
  'التمويل العقاري'
];

const daysOfWeek = [
  { key: 'saturday', label: 'السبت' },
  { key: 'sunday', label: 'الأحد' },
  { key: 'monday', label: 'الاثنين' },
  { key: 'tuesday', label: 'الثلاثاء' },
  { key: 'wednesday', label: 'الأربعاء' },
  { key: 'thursday', label: 'الخميس' },
  { key: 'friday', label: 'الجمعة' }
];

export default function RegisterOffice() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { createOffice, loading } = useRealEstateOfficesDB();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<OfficeFormData>({
    office_name: '',
    owner_name: '',
    phone: '',
    email: '',
    address: '',
    latitude: undefined,
    longitude: undefined,
    license_number: '',
    license_expiry: '',
    description: '',
    website: '',
    social_media: {
      facebook: '',
      instagram: '',
      twitter: '',
      linkedin: ''
    },
    working_hours: {
      saturday: { open: '09:00', close: '17:00', closed: false },
      sunday: { open: '09:00', close: '17:00', closed: false },
      monday: { open: '09:00', close: '17:00', closed: false },
      tuesday: { open: '09:00', close: '17:00', closed: false },
      wednesday: { open: '09:00', close: '17:00', closed: false },
      thursday: { open: '09:00', close: '17:00', closed: false },
      friday: { open: '', close: '', closed: true }
    },
    services: [],
    documents: []
  });

  const handleInputChange = (field: keyof OfficeFormData, value: string | number | undefined) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSocialMediaChange = (platform: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      social_media: {
        ...prev.social_media,
        [platform]: value
      }
    }));
  };

  const handleWorkingHoursChange = (day: string, field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      working_hours: {
        ...prev.working_hours,
        [day]: {
          ...prev.working_hours[day as keyof typeof prev.working_hours],
          [field]: value
        }
      }
    }));
  };

  const handleServiceToggle = (service: string) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter(s => s !== service)
        : [...prev.services, service]
    }));
  };

  const handleFileChange = (field: 'logo' | 'cover_image', file: File) => {
    setFormData(prev => ({
      ...prev,
      [field]: file
    }));
  };

  const handleDocumentAdd = (files: FileList) => {
    const newFiles = Array.from(files);
    setFormData(prev => ({
      ...prev,
      documents: [...prev.documents, ...newFiles]
    }));
  };

  const handleLocationSelect = (lat: number, lng: number, address: string) => {
    setFormData(prev => ({
      ...prev,
      latitude: lat,
      longitude: lng,
      address: address
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // التحقق من البيانات الأساسية
    if (!formData.office_name || !formData.owner_name || !formData.phone) {
      toast({
        title: "بيانات مطلوبة",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }

    const success = await createOffice(formData);
    if (success) {
      navigate('/offices');
    }
  };

  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="ml-2 h-4 w-4" />
          العودة
        </Button>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Building className="h-6 w-6" />
          تسجيل مكتب عقاري
        </h1>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center mb-8">
        {[1, 2, 3, 4].map((step) => (
          <React.Fragment key={step}>
            <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
              step <= currentStep 
                ? 'bg-primary text-white border-primary' 
                : 'bg-gray-100 text-gray-400 border-gray-300'
            }`}>
              {step}
            </div>
            {step < 4 && (
              <div className={`h-1 w-16 ${
                step < currentStep ? 'bg-primary' : 'bg-gray-200'
              }`} />
            )}
          </React.Fragment>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>
              {currentStep === 1 && 'المعلومات الأساسية'}
              {currentStep === 2 && 'الموقع وساعات العمل'}
              {currentStep === 3 && 'الخدمات ووسائل التواصل'}
              {currentStep === 4 && 'الصور والمستندات'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">

            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="office_name">اسم المكتب العقاري *</Label>
                    <Input
                      id="office_name"
                      value={formData.office_name}
                      onChange={(e) => handleInputChange('office_name', e.target.value)}
                      placeholder="مكتب العقارات الذهبية"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="owner_name">اسم المالك *</Label>
                    <Input
                      id="owner_name"
                      value={formData.owner_name}
                      onChange={(e) => handleInputChange('owner_name', e.target.value)}
                      placeholder="أحمد محمد علي"
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
                      placeholder="07XXXXXXXXX"
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
                      placeholder="info@office.com"
                    />
                  </div>

                  <div>
                    <Label htmlFor="license_number">رقم الرخصة التجارية</Label>
                    <Input
                      id="license_number"
                      value={formData.license_number}
                      onChange={(e) => handleInputChange('license_number', e.target.value)}
                      placeholder="123456789"
                    />
                  </div>

                  <div>
                    <Label htmlFor="license_expiry">تاريخ انتهاء الرخصة</Label>
                    <Input
                      id="license_expiry"
                      type="date"
                      value={formData.license_expiry}
                      onChange={(e) => handleInputChange('license_expiry', e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">وصف المكتب</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="نبذة عن المكتب والخدمات المقدمة..."
                    rows={4}
                  />
                </div>
              </div>
            )}

            {/* Step 2: Location and Working Hours */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div>
                  <Label className="flex items-center gap-2 mb-4">
                    <MapPin className="h-4 w-4" />
                    موقع المكتب
                  </Label>
                  <div className="h-96 rounded-lg overflow-hidden border">
                    <MapPicker
                      onLocationSelect={handleLocationSelect}
                      initialPosition={
                        formData.latitude && formData.longitude
                          ? [formData.latitude, formData.longitude]
                          : undefined
                      }
                    />
                  </div>
                  {formData.address && (
                    <p className="mt-2 text-sm text-gray-600">
                      العنوان المحدد: {formData.address}
                    </p>
                  )}
                </div>

                <div>
                  <Label className="flex items-center gap-2 mb-4">
                    <Clock className="h-4 w-4" />
                    ساعات العمل
                  </Label>
                  <div className="space-y-4">
                    {daysOfWeek.map(({ key, label }) => (
                      <div key={key} className="flex items-center gap-4 p-4 border rounded-lg">
                        <div className="w-20 font-medium">{label}</div>
                        <Checkbox
                          checked={formData.working_hours[key as keyof typeof formData.working_hours].closed}
                          onCheckedChange={(checked) => 
                            handleWorkingHoursChange(key, 'closed', !!checked)
                          }
                        />
                        <Label className="text-sm">مغلق</Label>
                        
                        {!formData.working_hours[key as keyof typeof formData.working_hours].closed && (
                          <>
                            <div className="flex items-center gap-2">
                              <Label className="text-sm">من:</Label>
                              <Input
                                type="time"
                                value={formData.working_hours[key as keyof typeof formData.working_hours].open}
                                onChange={(e) => handleWorkingHoursChange(key, 'open', e.target.value)}
                                className="w-24"
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <Label className="text-sm">إلى:</Label>
                              <Input
                                type="time"
                                value={formData.working_hours[key as keyof typeof formData.working_hours].close}
                                onChange={(e) => handleWorkingHoursChange(key, 'close', e.target.value)}
                                className="w-24"
                              />
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Services and Social Media */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div>
                  <Label className="flex items-center gap-2 mb-4">
                    <Star className="h-4 w-4" />
                    الخدمات المقدمة
                  </Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {services.map((service) => (
                      <div key={service} className="flex items-center space-x-2">
                        <Checkbox
                          checked={formData.services.includes(service)}
                          onCheckedChange={() => handleServiceToggle(service)}
                        />
                        <Label className="text-sm">{service}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="website">الموقع الإلكتروني</Label>
                  <Input
                    id="website"
                    type="url"
                    value={formData.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    placeholder="https://www.example.com"
                  />
                </div>

                <div>
                  <Label className="mb-4 block">وسائل التواصل الاجتماعي</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="facebook">فيسبوك</Label>
                      <Input
                        id="facebook"
                        value={formData.social_media.facebook}
                        onChange={(e) => handleSocialMediaChange('facebook', e.target.value)}
                        placeholder="https://facebook.com/office"
                      />
                    </div>

                    <div>
                      <Label htmlFor="instagram">إنستغرام</Label>
                      <Input
                        id="instagram"
                        value={formData.social_media.instagram}
                        onChange={(e) => handleSocialMediaChange('instagram', e.target.value)}
                        placeholder="https://instagram.com/office"
                      />
                    </div>

                    <div>
                      <Label htmlFor="twitter">تويتر</Label>
                      <Input
                        id="twitter"
                        value={formData.social_media.twitter}
                        onChange={(e) => handleSocialMediaChange('twitter', e.target.value)}
                        placeholder="https://twitter.com/office"
                      />
                    </div>

                    <div>
                      <Label htmlFor="linkedin">لينكد إن</Label>
                      <Input
                        id="linkedin"
                        value={formData.social_media.linkedin}
                        onChange={(e) => handleSocialMediaChange('linkedin', e.target.value)}
                        placeholder="https://linkedin.com/company/office"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Images and Documents */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label className="flex items-center gap-2 mb-4">
                      <Image className="h-4 w-4" />
                      شعار المكتب
                    </Label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <Camera className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => e.target.files?.[0] && handleFileChange('logo', e.target.files[0])}
                        className="hidden"
                        id="logo-upload"
                      />
                      <Label htmlFor="logo-upload" className="cursor-pointer">
                        <span className="text-blue-600 hover:text-blue-500">اختر صورة</span>
                        <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF حتى 10MB</p>
                      </Label>
                    </div>
                  </div>

                  <div>
                    <Label className="flex items-center gap-2 mb-4">
                      <Image className="h-4 w-4" />
                      صورة الغلاف
                    </Label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <Camera className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => e.target.files?.[0] && handleFileChange('cover_image', e.target.files[0])}
                        className="hidden"
                        id="cover-upload"
                      />
                      <Label htmlFor="cover-upload" className="cursor-pointer">
                        <span className="text-blue-600 hover:text-blue-500">اختر صورة</span>
                        <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF حتى 10MB</p>
                      </Label>
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="flex items-center gap-2 mb-4">
                    <FileText className="h-4 w-4" />
                    المستندات والملفات الرسمية
                  </Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <Upload className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <Input
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      onChange={(e) => e.target.files && handleDocumentAdd(e.target.files)}
                      className="hidden"
                      id="documents-upload"
                    />
                    <Label htmlFor="documents-upload" className="cursor-pointer">
                      <span className="text-blue-600 hover:text-blue-500">اختر ملفات</span>
                      <p className="text-xs text-gray-500 mt-1">
                        رخصة تجارية، هوية، شهادات، إلخ
                      </p>
                      <p className="text-xs text-gray-500">PDF, DOC, DOCX, JPG, PNG</p>
                    </Label>
                  </div>

                  {formData.documents.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm font-medium mb-2">الملفات المحددة:</p>
                      <ul className="space-y-1">
                        {formData.documents.map((doc, index) => (
                          <li key={index} className="text-sm text-gray-600 flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            {doc.name}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-medium text-yellow-800 mb-2">ملاحظة مهمة:</h4>
                  <p className="text-sm text-yellow-700">
                    سيتم مراجعة جميع المعلومات والمستندات المرسلة خلال 48 ساعة عمل. 
                    ستتلقى إشعاراً عند اكتمال عملية التوثيق.
                  </p>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
              >
                السابق
              </Button>

              <div className="flex gap-2">
                {currentStep < 4 ? (
                  <Button type="button" onClick={nextStep}>
                    التالي
                  </Button>
                ) : (
                  <Button type="submit" disabled={loading}>
                    {loading ? 'جاري التسجيل...' : 'تسجيل المكتب'}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}