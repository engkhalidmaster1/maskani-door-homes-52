import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building, Plus, Search, Filter, MapPin, Phone, Mail, Star, Clock, CheckCircle, Globe, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRealEstateOfficesDB, type RealEstateOffice } from '@/hooks/useRealEstateOfficesDB';
import { useAuth } from '@/hooks/useAuth';

const OfficeCard = ({ office, onViewDetails }: { office: RealEstateOffice; onViewDetails: (id: string) => void }) => {
  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => onViewDetails(office.id)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {office.logo_url ? (
              <img 
                src={office.logo_url} 
                alt={office.office_name}
                className="w-12 h-12 rounded-lg object-cover"
              />
            ) : (
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Building className="h-6 w-6 text-primary" />
              </div>
            )}
            <div>
              <CardTitle className="text-lg">{office.name}</CardTitle>
              <p className="text-sm text-gray-600">رخصة رقم: {office.license_number}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            {office.verified && (
              <Badge className="bg-green-100 text-green-800">
                <CheckCircle className="w-3 h-3 mr-1" />
                موثق
              </Badge>
            )}
            <Badge className={office.status === 'active' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}>
              {office.status === 'active' ? 'نشط' : office.status === 'pending' ? 'قيد المراجعة' : 'معلق'}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {office.cover_image_url && (
          <div className="mb-4 -mx-6">
            <img 
              src={office.cover_image_url}
              alt={office.office_name}
              className="w-full h-32 object-cover"
            />
          </div>
        )}

        {office.description && (
          <p className="text-sm text-gray-700 mb-4 line-clamp-2">
            {office.description}
          </p>
        )}

        <div className="space-y-2">
          {office.address && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="w-4 h-4" />
              <span className="truncate">{office.address}</span>
            </div>
          )}

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Phone className="w-4 h-4" />
            <span>{office.phone}</span>
          </div>

          {office.email && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Mail className="w-4 h-4" />
              <span className="truncate">{office.email}</span>
            </div>
          )}

          {office.properties_count > 0 && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Users className="w-4 h-4" />
              <span>{office.properties_count} عقار متاح</span>
            </div>
          )}
        </div>

        {office.services && office.services.length > 0 && (
          <div className="mt-4">
            <div className="flex flex-wrap gap-1">
              {office.services.slice(0, 3).map((service, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {service}
                </Badge>
              ))}
              {office.services.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{office.services.length - 3}
                </Badge>
              )}
            </div>
          </div>
        )}

        <div className="flex justify-between items-center mt-4 pt-4 border-t">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Clock className="w-3 h-3" />
            عضو منذ {new Date(office.created_at).getFullYear()}
          </div>
          
          <div className="flex gap-2">
            {office.website && (
              <Button size="sm" variant="outline" onClick={(e) => {
                e.stopPropagation();
                window.open(office.website, '_blank');
              }}>
                <Globe className="w-3 h-3" />
              </Button>
            )}
            
            <Button size="sm" onClick={(e) => {
              e.stopPropagation();
              window.open(`tel:${office.phone}`, '_self');
            }}>
              اتصل الآن
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default function OfficesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { offices, loading, fetchOffices } = useRealEstateOfficesDB();
  const [filters, setFilters] = useState<OfficeFilters>({});

  const handleSearch = (searchTerm: string) => {
    setFilters(prev => ({ ...prev, search: searchTerm }));
  };

  const handleFilterChange = (key: keyof OfficeFilters, value: string | number | boolean | undefined) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleViewDetails = (officeId: string) => {
    navigate(`/offices/${officeId}`);
  };

  useEffect(() => {
    fetchOffices();
  }, [fetchOffices]);

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Building className="h-8 w-8" />
            المكاتب العقارية
          </h1>
          <p className="text-gray-600 mt-2">
            اكتشف أفضل المكاتب العقارية الموثقة ({offices.length} مكتب)
          </p>
        </div>

        <div className="flex gap-3">
          {user && !userOffice && (
            <Button onClick={() => navigate('/register-office')}>
              <Plus className="w-4 h-4 ml-2" />
              سجل مكتبك
            </Button>
          )}
          
          {user && userOffice && (
            <Button variant="outline" onClick={() => navigate('/my-office')}>
              <Building className="w-4 h-4 ml-2" />
              مكتبي
            </Button>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="ابحث عن مكتب عقاري..."
                  className="pr-10"
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Select onValueChange={(value) => handleFilterChange('verified', value === 'verified' ? true : undefined)}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="التوثيق" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  <SelectItem value="verified">موثق فقط</SelectItem>
                </SelectContent>
              </Select>

              <Select onValueChange={(value) => handleFilterChange('rating', value === 'all' ? undefined : parseInt(value))}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="التقييم" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع التقييمات</SelectItem>
                  <SelectItem value="4">4+ نجوم</SelectItem>
                  <SelectItem value="3">3+ نجوم</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline">
                <Filter className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User's Office Notice */}
      {user && userOffice && (
        <Card className="mb-6 bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Building className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-blue-800">مكتبك: {userOffice.office_name}</p>
                  <p className="text-sm text-blue-600">
                    الحالة: {userOffice.is_verified ? 'موثق ✅' : 'قيد المراجعة ⏳'}
                  </p>
                </div>
              </div>
              <Button variant="outline" onClick={() => navigate('/my-office')}>
                إدارة المكتب
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Offices Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, index) => (
            <Card key={index} className="animate-pulse">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-32"></div>
                    <div className="h-3 bg-gray-200 rounded w-24"></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : offices.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Building className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">لا توجد مكاتب عقارية</h3>
            <p className="text-gray-600 mb-6">
              {filters.search ? 'لم يتم العثور على مكاتب تطابق البحث' : 'لا توجد مكاتب عقارية مسجلة حالياً'}
            </p>
            {user && !userOffice && (
              <Button onClick={() => navigate('/register-office')}>
                <Plus className="w-4 h-4 ml-2" />
                كن أول مكتب مسجل
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {offices.map((office) => (
            <OfficeCard
              key={office.id}
              office={office}
              onViewDetails={handleViewDetails}
            />
          ))}
        </div>
      )}

      {/* Call to Action */}
      {!user && (
        <Card className="mt-12 bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-8 text-center">
            <Building className="h-16 w-16 text-blue-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-blue-800 mb-2">
              هل تمتلك مكتب عقاري؟
            </h3>
            <p className="text-blue-600 mb-6">
              انضم إلى شبكتنا من المكاتب العقارية الموثقة واحصل على المزيد من العملاء
            </p>
            <div className="flex gap-4 justify-center">
              <Button onClick={() => navigate('/login')}>
                تسجيل الدخول
              </Button>
              <Button variant="outline" onClick={() => navigate('/register')}>
                إنشاء حساب جديد
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}