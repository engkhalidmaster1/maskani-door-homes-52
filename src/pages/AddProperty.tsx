import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PlusCircle, Building, Home, Layers, Store, Tag, Camera } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
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
  const [formData, setFormData] = useState({
    type: "",
    building: "",
    apartment: "",
    floor: "",
    market: "",
    furnished: "",
    price: "",
    description: "",
  });

  const [showFurnishedField, setShowFurnishedField] = useState(false);

  const handleTypeChange = (value: string) => {
    setFormData({ ...formData, type: value });
    setShowFurnishedField(value === "rent");
    if (value !== "rent") {
      setFormData({ ...formData, type: value, furnished: "" });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "تم نشر العقار بنجاح!",
      description: "سيتم مراجعة العقار ونشره في أقرب وقت.",
    });
    onPageChange("properties");
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
              {/* Property Type */}
              <div className="space-y-2">
                <Label htmlFor="type" className="flex items-center gap-2 text-base font-semibold">
                  <Tag className="h-5 w-5 text-primary" />
                  نوع العرض
                </Label>
                <Select value={formData.type} onValueChange={handleTypeChange} required>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="اختر نوع العرض" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sale">للبيع</SelectItem>
                    <SelectItem value="rent">للإيجار</SelectItem>
                  </SelectContent>
                </Select>
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
                  <Select
                    value={formData.apartment}
                    onValueChange={(value) => setFormData({ ...formData, apartment: value })}
                    required
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="اختر رقم الشقة" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => (
                        <SelectItem key={i + 1} value={`${i + 1}`}>
                          {i + 1}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Floor and Market */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="floor" className="flex items-center gap-2 text-base font-semibold">
                    <Layers className="h-5 w-5 text-primary" />
                    الطابق
                  </Label>
                  <Select
                    value={formData.floor}
                    onValueChange={(value) => setFormData({ ...formData, floor: value })}
                    required
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="اختر الطابق" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 10 }, (_, i) => (
                        <SelectItem key={i + 1} value={`${i + 1}`}>
                          {i + 1}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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

              {/* Submit Button */}
              <Button type="submit" className="w-full h-12 text-lg font-semibold" variant="default">
                <PlusCircle className="h-5 w-5 ml-2" />
                نشر العقار
              </Button>
            </form>
          </div>
        </Card>
      </div>
    </div>
  );
};