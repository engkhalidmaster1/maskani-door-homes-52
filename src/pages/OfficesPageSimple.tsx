import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building, Plus, Search, MapPin, Phone, Mail, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useRealEstateOfficesDB, type RealEstateOffice } from '@/hooks/useRealEstateOfficesDB';
import { useAuth } from '@/hooks/useAuth';
import { ContactModal } from '@/components/ContactModal';

const SimpleOfficeCard = ({ office }: { office: RealEstateOffice }) => {
  const navigate = useNavigate();

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <Building className="h-6 w-6 text-primary" />
            </div>
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
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3">
          {office.description && (
            <p className="text-sm text-gray-600 line-clamp-2">{office.description}</p>
          )}
          
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="w-4 h-4" />
            <span className="line-clamp-1">{office.address}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Phone className="w-4 h-4" />
            <span>{office.phone}</span>
          </div>
          
          {office.email && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Mail className="w-4 h-4" />
              <span>{office.email}</span>
            </div>
          )}
        </div>

        <div className="flex gap-2 mt-4">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={() => navigate(`/office/${office.id}`)}
          >
            عرض التفاصيل
          </Button>
          <div className="flex-1">
            <ContactModal office={office} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const OfficesPageSimple = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { offices, loading, fetchOffices, searchOffices } = useRealEstateOfficesDB();
  const [searchTerm, setSearchTerm] = useState('');

  // جلب المكاتب عند تحميل الصفحة
  useEffect(() => {
    fetchOffices();
  }, [fetchOffices]);

  // البحث عند تغيير النص
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    if (value.trim()) {
      searchOffices(value);
    } else {
      fetchOffices();
    }
  };

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">المكاتب العقارية</h1>
          <p className="text-gray-600">تصفح المكاتب العقارية المعتمدة والموثقة</p>
        </div>
        {user && (
          <Button onClick={() => navigate('/register-office')}>
            <Plus className="ml-2 h-4 w-4" />
            تسجيل مكتب عقاري
          </Button>
        )}
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="ابحث عن المكاتب العقارية..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pr-10"
            />
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري تحميل المكاتب العقارية...</p>
        </div>
      )}

      {/* Offices Grid */}
      {!loading && (
        <>
          {offices.length === 0 ? (
            <div className="text-center py-12">
              <Building className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                لا توجد مكاتب عقارية
              </h3>
              <p className="text-gray-500 mb-6">
                {searchTerm 
                  ? 'لم يتم العثور على مكاتب تطابق البحث' 
                  : 'لا توجد مكاتب عقارية مسجلة حالياً'
                }
              </p>
              {user && (
                <Button onClick={() => navigate('/register-office')}>
                  <Plus className="ml-2 h-4 w-4" />
                  كن أول من يسجل مكتباً عقارياً
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-6">
                <div className="text-sm text-gray-600">
                  تم العثور على {offices.length} مكتب عقاري
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {offices.map((office) => (
                  <SimpleOfficeCard key={office.id} office={office} />
                ))}
              </div>
            </>
          )}
        </>
      )}

      {/* Call to Action for Guest Users */}
      {!user && offices.length > 0 && (
        <div className="mt-12 text-center bg-primary/5 rounded-lg p-8">
          <h3 className="text-xl font-semibold mb-4">هل تملك مكتباً عقارياً؟</h3>
          <p className="text-gray-600 mb-6">
            انضم إلى شبكتنا من المكاتب العقارية المعتمدة وازد من عملائك
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={() => navigate('/register')}>
              إنشاء حساب جديد
            </Button>
            <Button variant="outline" onClick={() => navigate('/login')}>
              تسجيل الدخول
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OfficesPageSimple;