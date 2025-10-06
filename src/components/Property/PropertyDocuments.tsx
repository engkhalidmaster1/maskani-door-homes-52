import React, { useState, useCallback } from 'react';
import { Upload, FileText, Download, Trash2, Eye, CheckCircle, AlertCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface PropertyDocument {
  id: string;
  name: string;
  type: 'ownership' | 'identity' | 'permit' | 'survey' | 'contract' | 'other';
  url: string;
  size: number;
  uploaded_at: string;
  verified?: boolean;
  notes?: string;
}

interface PropertyDocumentsProps {
  propertyId: string;
  documents: PropertyDocument[];
  onDocumentsChange: (documents: PropertyDocument[]) => void;
  canEdit?: boolean;
}

const documentTypes = {
  ownership: { label: 'سند الملكية', color: 'bg-blue-100 text-blue-800' },
  identity: { label: 'هوية المالك', color: 'bg-green-100 text-green-800' },
  permit: { label: 'إجازة البناء', color: 'bg-purple-100 text-purple-800' },
  survey: { label: 'مخطط المسح', color: 'bg-orange-100 text-orange-800' },
  contract: { label: 'عقد البيع/الإيجار', color: 'bg-red-100 text-red-800' },
  other: { label: 'أخرى', color: 'bg-gray-100 text-gray-800' }
};

export const PropertyDocuments: React.FC<PropertyDocumentsProps> = ({
  propertyId,
  documents,
  onDocumentsChange,
  canEdit = false
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [selectedType, setSelectedType] = useState<keyof typeof documentTypes>('other');

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const uploadDocument = useCallback(async (file: File, type: keyof typeof documentTypes) => {
    if (!user) {
      toast({
        title: "خطأ في التحميل",
        description: "يجب تسجيل الدخول أولاً",
        variant: "destructive",
      });
      return;
    }

    try {
      setUploading(true);

      // تحديد مجلد الرفع
      const fileName = `${propertyId}/${type}/${Date.now()}-${file.name}`;
      
      // رفع الملف إلى Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('property-documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // الحصول على رابط الملف
      const { data: urlData } = supabase.storage
        .from('property-documents')
        .getPublicUrl(fileName);

      // إنشاء كائن المستند الجديد
      const newDocument: PropertyDocument = {
        id: Date.now().toString(),
        name: file.name,
        type,
        url: urlData.publicUrl,
        size: file.size,
        uploaded_at: new Date().toISOString(),
        verified: false,
      };

      // تحديث قائمة المستندات
      const updatedDocuments = [...documents, newDocument];
      onDocumentsChange(updatedDocuments);

      // حفظ معلومات المستند في قاعدة البيانات
      const { error: dbError } = await supabase
        .from('property_documents')
        .insert({
          property_id: propertyId,
          document_id: newDocument.id,
          name: newDocument.name,
          type: newDocument.type,
          url: newDocument.url,
          size: newDocument.size,
          user_id: user.id
        });

      if (dbError) {
        console.error('Database error:', dbError);
        // لا نفشل العملية إذا فشل حفظ قاعدة البيانات
      }

      toast({
        title: "تم رفع المستند بنجاح",
        description: `تم رفع ${file.name}`,
      });

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "خطأ في رفع المستند",
        description: error instanceof Error ? error.message : "حدث خطأ غير متوقع",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  }, [user, propertyId, documents, onDocumentsChange, toast]);

  const deleteDocument = useCallback(async (documentId: string) => {
    try {
      const document = documents.find(doc => doc.id === documentId);
      if (!document) return;

      // حذف من التخزين
      const fileName = document.url.split('/').pop();
      if (fileName) {
        await supabase.storage
          .from('property-documents')
          .remove([`${propertyId}/${document.type}/${fileName}`]);
      }

      // حذف من قاعدة البيانات
      await supabase
        .from('property_documents')
        .delete()
        .eq('document_id', documentId);

      // تحديث قائمة المستندات
      const updatedDocuments = documents.filter(doc => doc.id !== documentId);
      onDocumentsChange(updatedDocuments);

      toast({
        title: "تم حذف المستند",
        description: "تم حذف المستند بنجاح",
      });

    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: "خطأ في حذف المستند",
        description: "حدث خطأ أثناء حذف المستند",
        variant: "destructive",
      });
    }
  }, [documents, propertyId, onDocumentsChange, toast]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      Array.from(files).forEach(file => {
        uploadDocument(file, selectedType);
      });
      // إعادة تعيين قيمة input
      event.target.value = '';
    }
  };

  const openDocument = (url: string) => {
    window.open(url, '_blank');
  };

  const downloadDocument = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          مستندات العقار
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Upload Section */}
        {canEdit && (
          <div className="mb-6 p-4 border-2 border-dashed border-gray-300 rounded-lg">
            <div className="text-center">
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              
              <div className="mb-4">
                <Label htmlFor="document-type">نوع المستند:</Label>
                <Select value={selectedType} onValueChange={(value: keyof typeof documentTypes) => setSelectedType(value)}>
                  <SelectTrigger className="w-full mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(documentTypes).map(([key, { label }]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <input
                type="file"
                id="document-upload"
                multiple
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                onChange={handleFileSelect}
                className="hidden"
                disabled={uploading}
                aria-label="رفع مستندات العقار"
              />
              
              <Label htmlFor="document-upload" className="cursor-pointer">
                <Button type="button" disabled={uploading} asChild>
                  <span>
                    {uploading ? 'جاري الرفع...' : 'اختر ملفات'}
                  </span>
                </Button>
              </Label>
              
              <p className="text-xs text-gray-500 mt-2">
                PDF, DOC, DOCX, JPG, PNG - حد أقصى 10MB لكل ملف
              </p>
            </div>
          </div>
        )}

        {/* Documents List */}
        <div className="space-y-4">
          {documents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-2" />
              <p>لا توجد مستندات مرفوعة</p>
              {canEdit && (
                <p className="text-sm">ارفع المستندات الخاصة بالعقار لزيادة الثقة</p>
              )}
            </div>
          ) : (
            documents.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-sm">{doc.name}</h4>
                      <Badge className={documentTypes[doc.type].color}>
                        {documentTypes[doc.type].label}
                      </Badge>
                      {doc.verified && (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          موثق
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-xs text-gray-500">
                      {formatFileSize(doc.size)} • {new Date(doc.uploaded_at).toLocaleDateString('ar-SA')}
                    </p>
                    
                    {doc.notes && (
                      <p className="text-xs text-orange-600 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {doc.notes}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openDocument(doc.url)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadDocument(doc.url, doc.name)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>

                  {canEdit && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteDocument(doc.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {documents.length > 0 && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-800">فوائد توثيق المستندات:</p>
                <ul className="text-blue-700 mt-1 space-y-1">
                  <li>• زيادة ثقة المشترين والمستأجرين</li>
                  <li>• تسريع عملية البيع أو التأجير</li>
                  <li>• حماية قانونية أفضل</li>
                  <li>• أولوية في نتائج البحث</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};