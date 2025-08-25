import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PlusCircle, Building, Home, Layers, Store, Tag, Camera } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AddPropertyProps {
  onPageChange: (page: string) => void;
}

export const AddProperty = ({ onPageChange }: AddPropertyProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
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

    setIsLoading(true);

    try {
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
        images: [],
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
        description: "تم إضافة العقار وهو متاح الآن للمشاهدة",
      });
      
      onPageChange("properties");
    } catch (error: any) {
      console.error('Error adding property:', error);
      toast({
        title: "خطأ في إضافة العقار",
        description: error.message || "حدث خطأ غير متوقع",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="shadow-elegant hover-lift">
          <div className="p-8">
            <h2 className="text-4xl font-bold mb-8 flex items-center gap-4 border-b-2 border-primary pb-4">
              <div className="bg-primary text-primary-foreground p-3 rounded-xl">
                <PlusCircle className="h-6 w-6" />
              </div>
              إضافة عقار جديد
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title and Property Type */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="listing_type" className="flex items-center gap-2 text-base font-semibold">
                    <Tag className="h-5 w-5 text-primary" />
                    نوع العرض
                  </Label>
                  <Select value={formData.listing_type} onValueChange={handleTypeChange} required>
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="اختر نوع العرض" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sale">للبيع</SelectItem>
                      <SelectItem value="rent">للإيجار</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="area" className="flex items-center gap-2 text-base font-semibold">
                    <Building className="h-5 w-5 text-primary" />
                    المساحة (متر مربع)
                  </Label>
                  <Input
                    id="area"
                    type="number"
                    value={formData.area}
                    onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                    placeholder="ادخل المساحة"
                    className="h-12"
                  />
                </div>
              </div>

              {/* Building and Apartment */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="building" className="flex items-center gap-2 text-base font-semibold">
                    <Building className="h-5 w-5 text-primary" />
                    رقم العمارة
                  </Label>
                  <Input
                    id="building"
                    value={formData.building}
                    onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                    placeholder="ادخل رقم العمارة"
                    className="h-12"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="apartment" className="flex items-center gap-2 text-base font-semibold">
                    <Home className="h-5 w-5 text-primary" />
                    رقم الشقة
                  </Label>
              <Input
                    id="apartment"
                    value={formData.apartment}
                    onChange={(e) => setFormData({ ...formData, apartment: e.target.value })}
                    placeholder="ادخل رقم الشقة"
                    className="h-12"
                    required
                  />
                </div>
              </div>

              {/* Floor and Market */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="floor" className="flex items-center gap-2 text-base font-semibold">
                    <Layers className="h-5 w-5 text-primary" />
                    الطابق
                  </Label>
              <Input
                    id="floor"
                    value={formData.floor}
                    onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                    placeholder="ادخل رقم الطابق"
                    className="h-12"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="market" className="flex items-center gap-2 text-base font-semibold">
                    <Store className="h-5 w-5 text-primary" />
                    قرب أي سوق
                  </Label>
                  <Select
                    value={formData.market}
                    onValueChange={(value) => setFormData({ ...formData, market: value })}
                    required
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="اختر السوق الأقرب" />
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
              </div>

              {/* Furnished Field (conditional) */}
              {showFurnishedField && (
                <div className="space-y-2">
                  <Label htmlFor="furnished" className="flex items-center gap-2 text-base font-semibold">
                    <Home className="h-5 w-5 text-primary" />
                    نوع العقار
                  </Label>
                  <Select
                    value={formData.furnished}
                    onValueChange={(value) => setFormData({ ...formData, furnished: value })}
                    required={showFurnishedField}
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="اختر النوع" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">مؤثثة</SelectItem>
                      <SelectItem value="no">غير مؤثثة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Price */}
              <div className="space-y-2">
                <Label htmlFor="price" className="flex items-center gap-2 text-base font-semibold">
                  <Tag className="h-5 w-5 text-primary" />
                  السعر (دينار عراقي)
                </Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="ادخل السعر"
                  className="h-12"
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="flex items-center gap-2 text-base font-semibold">
                  <Building className="h-5 w-5 text-primary" />
                  وصف العقار
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="أضف وصفاً للعقار"
                  rows={4}
                  className="resize-none"
                />
              </div>

              {/* Images */}
              <div className="space-y-2">
                <Label htmlFor="images" className="flex items-center gap-2 text-base font-semibold">
                  <Camera className="h-5 w-5 text-primary" />
                  رفع صور العقار
                </Label>
                <Input
                  id="images"
                  type="file"
                  multiple
                  accept="image/*"
                  className="h-12 cursor-pointer"
                />
              </div>

              {/* Bedrooms and Bathrooms */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="bedrooms" className="flex items-center gap-2 text-base font-semibold">
                    <Home className="h-5 w-5 text-primary" />
                    عدد غرف النوم
                  </Label>
                  <Select
                    value={formData.bedrooms}
                    onValueChange={(value) => setFormData({ ...formData, bedrooms: value })}
                    required
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="اختر عدد الغرف" />
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

                <div className="space-y-2">
                  <Label htmlFor="bathrooms" className="flex items-center gap-2 text-base font-semibold">
                    <Home className="h-5 w-5 text-primary" />
                    عدد دورات المياه
                  </Label>
                  <Select
                    value={formData.bathrooms}
                    onValueChange={(value) => setFormData({ ...formData, bathrooms: value })}
                    required
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="اختر عدد الحمامات" />
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
              </div>

              {/* Submit Button */}
              <Button type="submit" className="w-full h-12 text-lg font-semibold" variant="default" disabled={isLoading}>
                <PlusCircle className="h-5 w-5 ml-2" />
                {isLoading ? "جاري النشر..." : "نشر العقار"}
              </Button>
            </form>
          </div>
        </Card>
      </div>
    </div>
  );
};