import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save, MapPin, Phone, Mail, Globe } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRealEstateOfficesDB, type RealEstateOffice } from '@/hooks/useRealEstateOfficesDB';
import { MapPicker } from '@/components/MapPicker';

export const EditOffice = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { fetchOfficeById, updateOffice, loading } = useRealEstateOfficesDB();
  
  const [office, setOffice] = useState<RealEstateOffice | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    license_number: '',
    description: '',
    phone: '',
    email: '',
    website: '',
    address: '',
    latitude: 0,
    longitude: 0
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (id) {
      const loadOffice = async () => {
        try {
          const foundOffice = await fetchOfficeById(id);
          setOffice(foundOffice);
          setFormData({
            name: foundOffice.name,
            license_number: foundOffice.license_number,
            description: foundOffice.description || '',
            phone: foundOffice.phone,
            email: foundOffice.email || '',
            website: foundOffice.website || '',
            address: foundOffice.address,
            latitude: foundOffice.latitude || 0,
            longitude: foundOffice.longitude || 0
          });
        } catch (error) {
          toast({
            title: "خطأ",
            description: "لم يتم العثور على المكتب المطلوب",
            variant: "destructive",
          });
          navigate('/offices');
        }
      };
      loadOffice();
    }
  }, [id, fetchOfficeById, navigate, toast]);

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
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

  const handleSave = async () => {
    try {
      setIsSaving(true);

      // التحقق من صحة البيانات
      if (!formData.name.trim()) {
        toast({
          title: "خطأ في البيانات",
          description: "اسم المكتب مطلوب",
          variant: "destructive",
        });
        return;
      }

      if (!formData.license_number.trim()) {
        toast({
          title: "خطأ في البيانات", 
          description: "رقم الترخيص مطلوب",
          variant: "destructive",
        });
        return;
      }

      if (!formData.phone.trim()) {
        toast({
          title: "خطأ في البيانات",
          description: "رقم الهاتف مطلوب",
          variant: "destructive",
        });
        return;
      }

      if (!formData.address.trim()) {
        toast({
          title: "خطأ في البيانات",
          description: "العنوان مطلوب",
          variant: "destructive",
        });
        return;
      }

      // محاكاة حفظ البيانات
      await new Promise(resolve => setTimeout(resolve, 2000));

      toast({
        title: "تم الحفظ بنجاح",
        description: "تم تحديث معلومات المكتب بنجاح (بيانات تجريبية)",
      });

      navigate('/dashboard');
    } catch (error) {
      console.error('Error saving office:', error);
      toast({
        title: "خطأ في الحفظ",
        description: "حدث خطأ أثناء حفظ البيانات",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading || !office) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">جاري تحميل بيانات المكتب...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            رجوع
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">تعديل معلومات المكتب</h1>
            <p className="text-gray-600">قم بتحديث معلومات مكتبك العقاري</p>
          </div>
        </div>

        {/* Form */}
        <div className="space-y-6">
          {/* معلومات أساسية */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Globe className="h-5 w-5 text-blue-600" />
                </div>
                المعلومات الأساسية
              </CardTitle>
              <CardDescription>
                تحديث المعلومات الأساسية للمكتب العقاري
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">اسم المكتب *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="مثال: مكتب العقارات الذهبية"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="license">رقم الترخيص *</Label>
                  <Input
                    id="license"
                    value={formData.license_number}
                    onChange={(e) => handleInputChange('license_number', e.target.value)}
                    placeholder="مثال: RE001"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">وصف المكتب</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="وصف مختصر عن خدمات ونشاط المكتب العقاري..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* معلومات الاتصال */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Phone className="h-5 w-5 text-green-600" />
                </div>
                معلومات الاتصال
              </CardTitle>
              <CardDescription>
                تحديث وسائل التواصل مع المكتب
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">رقم الهاتف *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="مثال: +964 771 234 5678"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">البريد الإلكتروني</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="مثال: info@office.com"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">الموقع الإلكتروني</Label>
                <Input
                  id="website"
                  value={formData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  placeholder="مثال: https://your-office.com"
                />
              </div>
            </CardContent>
          </Card>

          {/* الموقع */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 bg-red-100 rounded-lg">
                  <MapPin className="h-5 w-5 text-red-600" />
                </div>
                موقع المكتب
              </CardTitle>
              <CardDescription>
                تحديد موقع المكتب على الخريطة
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address">العنوان التفصيلي *</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="العنوان التفصيلي للمكتب..."
                  rows={2}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>موقع المكتب على الخريطة</Label>
                <div className="h-64 rounded-lg overflow-hidden border">
                  <MapPicker
                    initialPosition={[formData.latitude || 33.3128, formData.longitude || 44.3615]}
                    onLocationSelect={handleLocationSelect}
                  />
                </div>
                <p className="text-sm text-gray-500">
                  اسحب العلامة لتحديد الموقع الدقيق للمكتب
                </p>
              </div>
            </CardContent>
          </Card>

          {/* أزرار الحفظ */}
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => navigate(-1)}
              disabled={isSaving}
            >
              إلغاء
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {isSaving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};