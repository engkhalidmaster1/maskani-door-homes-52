import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Eye, 
  Download, 
  Search,
  BarChart3,
  Clock,
  Users,
  Building,
  X,
  Filter,
  Settings
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useRealEstateOffices } from '@/hooks/useRealEstateOffices';
import { usePropertyDocuments } from '@/hooks/usePropertyDocuments';
import { useToast } from '@/hooks/use-toast';

interface DocumentWithProperty {
  id: string;
  document_id: string;
  name: string;
  type: string;
  url: string;
  size: number;
  uploaded_at: string;
  verified: boolean;
  notes?: string;
  property: {
    title: string;
    location: string;
    price: number;
  };
  uploader: {
    full_name: string;
    avatar_url?: string;
  };
}

export const OfficeDashboard: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { 
    fetchUnverifiedDocuments, 
    verifyDocument, 
    getDocumentStats 
  } = usePropertyDocuments();
  
  const [unverifiedDocs, setUnverifiedDocs] = useState<DocumentWithProperty[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    verified: 0,
    pending: 0,
    byType: {} as Record<string, number>
  });
  
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedDoc, setSelectedDoc] = useState<DocumentWithProperty | null>(null);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);

  const documentTypes = {
    ownership: { label: 'سند الملكية', color: 'bg-blue-100 text-blue-800' },
    identity: { label: 'هوية المالك', color: 'bg-green-100 text-green-800' },
    permit: { label: 'إجازة البناء', color: 'bg-purple-100 text-purple-800' },
    survey: { label: 'مخطط المسح', color: 'bg-orange-100 text-orange-800' },
    contract: { label: 'عقد البيع/الإيجار', color: 'bg-red-100 text-red-800' },
    other: { label: 'أخرى', color: 'bg-gray-100 text-gray-800' }
  };

  // جلب البيانات
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      
      // جلب المستندات غير الموثقة
      const docs = await fetchUnverifiedDocuments();
      setUnverifiedDocs(docs as DocumentWithProperty[]);
      
      // جلب الإحصائيات
      const statistics = await getDocumentStats();
      setStats(statistics);
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast({
        title: "خطأ في تحميل البيانات",
        description: "حدث خطأ أثناء تحميل بيانات لوحة التحكم",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [fetchUnverifiedDocuments, getDocumentStats, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // تصفية المستندات
  const filteredDocs = unverifiedDocs.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.property.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || doc.type === filterType;
    
    return matchesSearch && matchesType;
  });

  // توثيق مستند
  const handleVerifyDocument = async (verified: boolean) => {
    if (!selectedDoc) return;

    const success = await verifyDocument({
      document_id: selectedDoc.document_id,
      verified,
      notes: verificationNotes || undefined
    });

    if (success) {
      // إزالة المستند من قائمة غير الموثقة إذا تم توثيقه
      if (verified) {
        setUnverifiedDocs(prev => 
          prev.filter(doc => doc.document_id !== selectedDoc.document_id)
        );
      }
      
      // تحديث الإحصائيات
      loadData();
      
      // إغلاق الحوار
      setVerifyDialogOpen(false);
      setSelectedDoc(null);
      setVerificationNotes('');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ar-IQ', {
      style: 'currency',
      currency: 'IQD',
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">مطلوب تسجيل الدخول</h3>
            <p className="text-gray-600">يجب تسجيل الدخول للوصول إلى لوحة التحكم</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">لوحة تحكم المكتب العقاري</h1>
          <p className="text-gray-600">إدارة وتوثيق مستندات العقارات</p>
        </div>
        <div className="flex gap-3">
          <Button 
            onClick={() => navigate('/edit-office/1')} 
            variant="outline"
            className="flex items-center gap-2"
          >
            <Settings className="h-4 w-4" />
            تعديل معلومات المكتب
          </Button>
        </div>
      </div>

      {/* الإحصائيات */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">إجمالي المستندات</p>
                <p className="text-3xl font-bold">{stats.total}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">مستندات موثقة</p>
                <p className="text-3xl font-bold text-green-600">{stats.verified}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">بانتظار التوثيق</p>
                <p className="text-3xl font-bold text-orange-600">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">معدل التوثيق</p>
                <p className="text-3xl font-bold text-blue-600">
                  {stats.total > 0 ? Math.round((stats.verified / stats.total) * 100) : 0}%
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* الأدوات */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>المستندات بانتظار التوثيق</CardTitle>
        </CardHeader>
        <CardContent>
          {/* أدوات البحث والتصفية */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Label htmlFor="search">البحث</Label>
              <div className="relative">
                <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="ابحث في المستندات أو العقارات..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>
            
            <div className="w-full md:w-48">
              <Label htmlFor="filter">تصفية حسب النوع</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الأنواع</SelectItem>
                  {Object.entries(documentTypes).map(([key, { label }]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* قائمة المستندات */}
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">جاري تحميل المستندات...</p>
            </div>
          ) : filteredDocs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">لا توجد مستندات</h3>
              <p>
                {searchTerm || filterType !== 'all' 
                  ? 'لم يتم العثور على مستندات تطابق معايير البحث' 
                  : 'لا توجد مستندات بانتظار التوثيق حالياً'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredDocs.map((doc) => (
                <div key={doc.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <FileText className="h-5 w-5 text-blue-600" />
                        </div>
                        
                        <div>
                          <h4 className="font-medium">{doc.name}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className={documentTypes[doc.type as keyof typeof documentTypes]?.color || 'bg-gray-100 text-gray-800'}>
                              {documentTypes[doc.type as keyof typeof documentTypes]?.label || doc.type}
                            </Badge>
                            <span className="text-sm text-gray-500">
                              {formatFileSize(doc.size)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mr-13 space-y-1">
                        <p className="text-sm">
                          <strong>العقار:</strong> {doc.property.title}
                        </p>
                        <p className="text-sm text-gray-600">
                          <strong>الموقع:</strong> {doc.property.location}
                        </p>
                        <p className="text-sm text-gray-600">
                          <strong>السعر:</strong> {formatPrice(doc.property.price)}
                        </p>
                        <p className="text-sm text-gray-600">
                          <strong>رفع بواسطة:</strong> {doc.uploader.full_name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(doc.uploaded_at).toLocaleDateString('ar-SA')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(doc.url, '_blank')}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>

                      <Dialog 
                        open={verifyDialogOpen && selectedDoc?.id === doc.id}
                        onOpenChange={(open) => {
                          setVerifyDialogOpen(open);
                          if (!open) {
                            setSelectedDoc(null);
                            setVerificationNotes('');
                          }
                        }}
                      >
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            onClick={() => setSelectedDoc(doc)}
                          >
                            توثيق
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                          <DialogHeader>
                            <DialogTitle>توثيق المستند</DialogTitle>
                          </DialogHeader>
                          
                          <div className="space-y-4">
                            <div>
                              <p className="font-medium mb-2">{selectedDoc?.name}</p>
                              <Badge className={documentTypes[selectedDoc?.type as keyof typeof documentTypes]?.color || 'bg-gray-100 text-gray-800'}>
                                {documentTypes[selectedDoc?.type as keyof typeof documentTypes]?.label || selectedDoc?.type}
                              </Badge>
                            </div>

                            <div>
                              <Label htmlFor="verification-notes">ملاحظات التوثيق (اختياري)</Label>
                              <Textarea
                                id="verification-notes"
                                placeholder="أضف ملاحظات حول المستند..."
                                value={verificationNotes}
                                onChange={(e) => setVerificationNotes(e.target.value)}
                                className="mt-2"
                                rows={3}
                              />
                            </div>

                            <div className="flex gap-2">
                              <Button 
                                onClick={() => handleVerifyDocument(true)}
                                className="flex-1"
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                موافق
                              </Button>
                              <Button 
                                variant="destructive"
                                onClick={() => handleVerifyDocument(false)}
                                className="flex-1"
                              >
                                <X className="h-4 w-4 mr-2" />
                                رفض
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};