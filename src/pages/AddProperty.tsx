import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PlusCircle, Building, Home, Layers, Store, Tag, Camera } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useOptimizedImageUpload } from "@/hooks/useOptimizedImageUpload";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useUserStatus } from "@/hooks/useUserStatus";
import { generatePropertyCode } from "@/utils/propertyCodeUtils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const AddProperty = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { uploadOptimizedImages, uploadProgress, isUploading } = useOptimizedImageUpload();
  const navigate = useNavigate();
  const { userStatus, canAddProperty, getRemainingProperties } = useUserStatus();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    property_type: "apartment", 
    listing_type: "",
    building: "",
    apartment: "",
    floor: "",
    market: "",
    furnished: "",
    price: "",
    description: "",
    bedrooms: "2",
    bathrooms: "1",
    area: "",
  });

  const [showFurnishedField, setShowFurnishedField] = useState(false);

  const handleTypeChange = (value: string) => {
    setFormData({ ...formData, listing_type: value });
    setShowFurnishedField(value === "rent");
    if (value !== "rent") {
      setFormData({ ...formData, listing_type: value, furnished: "" });
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Check image limits based on user status
    const maxImages = userStatus?.images_limit || 2;
    const currentImagesCount = selectedImages.length;
    const totalAfterAdd = currentImagesCount + files.length;

    if (totalAfterAdd > maxImages) {
      toast({
        title: "تجاوز حد الصور المسموح",
        description: `يمكنك رفع ${maxImages} صور فقط. لديك حالياً ${currentImagesCount} صورة.`,
        variant: "destructive",
      });
      return;
    }

    // Validate file types and sizes
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        toast({
          title: "نوع ملف غير صحيح",
          description: `${file.name} ليس ملف صورة صالح`,
          variant: "destructive",
        });
        return false;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "حجم الملف كبير",
          description: `${file.name} يتجاوز 5 ميجابايت`,
          variant: "destructive",
        });
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    // Final check after validation
    if (currentImagesCount + validFiles.length > maxImages) {
      const allowedCount = maxImages - currentImagesCount;
      if (allowedCount > 0) {
        const allowedFiles = validFiles.slice(0, allowedCount);
        setSelectedImages(prev => [...prev, ...allowedFiles]);
        
        allowedFiles.forEach(file => {
          const reader = new FileReader();
          reader.onload = (e) => {
            setImagePreviewUrls(prev => [...prev, e.target?.result as string]);
          };
          reader.readAsDataURL(file);
        });

        toast({
          title: "تم إضافة الصور المسموحة",
          description: `تم إضافة ${allowedFiles.length} صورة من أصل ${validFiles.length}`,
          variant: "default",
        });
      }
      return;
    }

    setSelectedImages(prev => [...prev, ...validFiles]);

    // Create preview URLs
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreviewUrls(prev => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });

    toast({
      title: "تم إضافة الصور",
      description: `تم إضافة ${validFiles.length} صورة`,
    });
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async (): Promise<string[]> => {
    if (selectedImages.length === 0) return [];
    
    try {
      return await uploadOptimizedImages(selectedImages, 'property-images');
    } catch (error) {
      console.error('Error uploading optimized images:', error);
      return [];
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "خطأ",
        description: "يجب تسجيل الدخول أولاً",
        variant: "destructive",
      });
      return;
    }

    // Check if user can add more properties
    if (!canAddProperty()) {
      toast({
        title: "تجاوز حد العقارات المسموح",
        description: `لقد وصلت إلى الحد الأقصى للعقارات المسموحة (${userStatus?.properties_limit}). اتصل بالإدارة لترقية حسابك.`,
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Upload images first
      const uploadedImageUrls = await uploadImages();

      // Generate property code using client-side function
      const propertyCode = generatePropertyCode(parseInt(formData.bedrooms));

      // Generate title from building and apartment
      const title = `شقة رقم ${formData.apartment} في العمارة ${formData.building}`;
      
      // Prepare data for insertion
      const propertyData = {
        user_id: user.id,
        title,
        description: formData.description || null,
        property_type: formData.property_type,
        listing_type: formData.listing_type,
        price: parseFloat(formData.price),
        area: formData.area ? parseFloat(formData.area) : null,
        bedrooms: parseInt(formData.bedrooms),
        bathrooms: parseInt(formData.bathrooms),
        location: `العمارة ${formData.building} - الطابق ${formData.floor} - قرب ${formData.market}`,
        address: `شقة ${formData.apartment}، العمارة ${formData.building}، الطابق ${formData.floor}`,
        amenities: formData.furnished ? [formData.furnished === "yes" ? "مؤثثة" : "غير مؤثثة"] : [],
        images: uploadedImageUrls,
        property_code: propertyCode,
        is_published: true,
      };

      const { error } = await supabase
        .from('properties')
        .insert([propertyData]);

      if (error) {
        throw error;
      }

      toast({
        title: "تم نشر العقار بنجاح!",
        description: `تم إضافة العقار مع ${uploadedImageUrls.length} صورة`,
      });
      
      navigate("/properties");
    } catch (error: any) {
      console.error('Error adding property:', error);
      toast({
        title: "خطأ في إضافة العقار",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading or access denied if user status not loaded
  if (!userStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري تحميل معلومات حسابك...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full">
        {/* User Status Info - Compact */}
        <div className="bg-blue-50 border-b border-blue-200 p-3">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className="bg-blue-500 text-white p-1 rounded">
                <Building className="h-4 w-4" />
              </div>
              <div>
                <span className="font-semibold text-blue-900">
                  {userStatus.status === 'publisher' && 'ناشر'}
                  {userStatus.status === 'trusted_owner' && 'مالك موثوق'}
                  {userStatus.status === 'office_agent' && 'مكلف بالنشر'}
                </span>
                <span className="text-blue-700 ml-2">
                  ({getRemainingProperties()}/{userStatus.properties_limit} عقار | {userStatus.images_limit} صور)
                </span>
              </div>
            </div>
            {!canAddProperty() && (
              <span className="text-red-600 text-xs bg-red-100 px-2 py-1 rounded">
                ⚠️ تجاوزت الحد
              </span>
            )}
          </div>
        </div>

        <div className="p-4">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-3 border-b-2 border-primary pb-3">
            <div className="bg-primary text-primary-foreground p-2 rounded-lg">
              <PlusCircle className="h-5 w-5" />
            </div>
            إضافة عقار جديد
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Row 1: Listing Type, Area, Building, Apartment */}
            <div className="grid grid-cols-4 gap-3">
              <div>
                <Label htmlFor="listing_type" className="flex items-center gap-1 text-xs font-semibold mb-1">
                  <Tag className="h-3 w-3 text-primary" />
                  نوع العرض
                </Label>
                <Select value={formData.listing_type} onValueChange={handleTypeChange} required>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="اختر نوع العرض" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sale">للبيع</SelectItem>
                    <SelectItem value="rent">للإيجار</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="area" className="flex items-center gap-1 text-xs font-semibold mb-1">
                  <Building className="h-3 w-3 text-primary" />
                  المساحة (م²)
                </Label>
                <Input
                  id="area"
                  type="number"
                  value={formData.area}
                  onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                  placeholder="المساحة"
                  className="h-8 text-sm"
                />
              </div>

              <div>
                <Label htmlFor="building" className="flex items-center gap-1 text-xs font-semibold mb-1">
                  <Building className="h-3 w-3 text-primary" />
                  رقم العمارة
                </Label>
                <Input
                  id="building"
                  value={formData.building}
                  onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                  placeholder="رقم العمارة"
                  className="h-8 text-sm"
                  required
                />
              </div>

              <div>
                <Label htmlFor="apartment" className="flex items-center gap-1 text-xs font-semibold mb-1">
                  <Home className="h-3 w-3 text-primary" />
                  رقم الشقة
                </Label>
                <Input
                  id="apartment"
                  value={formData.apartment}
                  onChange={(e) => setFormData({ ...formData, apartment: e.target.value })}
                  placeholder="رقم الشقة"
                  className="h-8 text-sm"
                  required
                />
              </div>
            </div>

            {/* Row 2: Floor, Market, Price, Bedrooms */}
            <div className="grid grid-cols-4 gap-3">
              <div>
                <Label htmlFor="floor" className="flex items-center gap-1 text-xs font-semibold mb-1">
                  <Layers className="h-3 w-3 text-primary" />
                  الطابق
                </Label>
                <Input
                  id="floor"
                  value={formData.floor}
                  onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                  placeholder="رقم الطابق"
                  className="h-8 text-sm"
                  required
                />
              </div>

              <div>
                <Label htmlFor="market" className="flex items-center gap-1 text-xs font-semibold mb-1">
                  <Store className="h-3 w-3 text-primary" />
                  قرب أي سوق
                </Label>
                <Select
                  value={formData.market}
                  onValueChange={(value) => setFormData({ ...formData, market: value })}
                  required
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="اختر السوق" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">السوق الأول</SelectItem>
                    <SelectItem value="2">السوق الثاني</SelectItem>
                    <SelectItem value="3">السوق الثالث</SelectItem>
                    <SelectItem value="4">السوق الرابع</SelectItem>
                    <SelectItem value="5">السوق الخامس</SelectItem>
                    <SelectItem value="6">السوق السادس</SelectItem>
                    <SelectItem value="7">الفنادق</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="price" className="flex items-center gap-1 text-xs font-semibold mb-1">
                  <Tag className="h-3 w-3 text-primary" />
                  السعر (دينار)
                </Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="السعر"
                  className="h-8 text-sm"
                  required
                />
              </div>

              <div>
                <Label htmlFor="bedrooms" className="flex items-center gap-1 text-xs font-semibold mb-1">
                  <Home className="h-3 w-3 text-primary" />
                  غرف النوم
                </Label>
                <Select
                  value={formData.bedrooms}
                  onValueChange={(value) => setFormData({ ...formData, bedrooms: value })}
                  required
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="عدد الغرف" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 5 }, (_, i) => (
                      <SelectItem key={i + 1} value={`${i + 1}`}>
                        {i + 1}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Row 3: Bathrooms, Furnished (conditional), Description */}
            <div className="grid grid-cols-4 gap-3">
              <div>
                <Label htmlFor="bathrooms" className="flex items-center gap-1 text-xs font-semibold mb-1">
                  <Home className="h-3 w-3 text-primary" />
                  دورات المياه
                </Label>
                <Select
                  value={formData.bathrooms}
                  onValueChange={(value) => setFormData({ ...formData, bathrooms: value })}
                  required
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="عدد الحمامات" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 4 }, (_, i) => (
                      <SelectItem key={i + 1} value={`${i + 1}`}>
                        {i + 1}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {showFurnishedField && (
                <div>
                  <Label htmlFor="furnished" className="flex items-center gap-1 text-xs font-semibold mb-1">
                    <Home className="h-3 w-3 text-primary" />
                    نوع العقار
                  </Label>
                  <Select
                    value={formData.furnished}
                    onValueChange={(value) => setFormData({ ...formData, furnished: value })}
                    required={showFurnishedField}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="اختر النوع" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">مؤثثة</SelectItem>
                      <SelectItem value="no">غير مؤثثة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className={showFurnishedField ? "col-span-2" : "col-span-3"}>
                <Label htmlFor="description" className="flex items-center gap-1 text-xs font-semibold mb-1">
                  <Building className="h-3 w-3 text-primary" />
                  وصف العقار
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="أضف وصفاً للعقار"
                  rows={2}
                  className="resize-none text-sm"
                />
              </div>
            </div>

            {/* Row 4: Images */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="images" className="flex items-center gap-1 text-xs font-semibold">
                  <Camera className="h-3 w-3 text-primary" />
                  صور العقار
                </Label>
                <span className="text-xs text-muted-foreground">
                  {selectedImages.length} / {userStatus?.images_limit || 2}
                </span>
              </div>
              
              <Input
                id="images"
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageChange}
                className="h-8 cursor-pointer text-xs"
                disabled={selectedImages.length >= (userStatus?.images_limit || 2)}
              />
              
              {/* Image Previews - Compact */}
              {imagePreviewUrls.length > 0 && (
                <div className="grid grid-cols-6 gap-2 mt-2">
                  {imagePreviewUrls.map((url, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={url}
                        alt={`معاينة ${index + 1}`}
                        className="w-full h-16 object-cover rounded border border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ×
                      </button>
                      <div className="absolute bottom-0 left-0 bg-black/50 text-white text-xs px-1 rounded-tl">
                        {index + 1}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full h-10 text-sm font-semibold mt-4" 
              variant="default" 
              disabled={isLoading || !canAddProperty()}
            >
              <PlusCircle className="h-4 w-4 ml-2" />
              {isLoading ? "جاري النشر..." : !canAddProperty() ? "تجاوزت الحد المسموح" : "نشر العقار"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};