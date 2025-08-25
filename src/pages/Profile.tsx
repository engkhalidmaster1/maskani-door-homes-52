import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PropertyCard } from "@/components/Property/PropertyCard";
import { User, Phone, MapPin, Save, Edit, Trash2, Home as HomeIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const Profile = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "أحمد محمد",
    phone: "07701234567",
    address: "مجمع الدور، بغداد، العراق",
  });

  // Sample user properties
  const userProperties = [
    {
      id: "user-1",
      title: "شقة في مجمع الدور",
      type: "sale" as const,
      building: "٩",
      apartment: "٢٠٣",
      floor: "الثاني",
      market: "الفنادق",
      price: "٣٠٠،٠٠٠ دينار",
      icon: "home" as const,
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "تم حفظ التغييرات بنجاح!",
      description: "تم تحديث معلومات الملف الشخصي",
    });
  };

  const handleEdit = (propertyId: string) => {
    toast({
      title: "تعديل العقار",
      description: "سيتم فتح صفحة تعديل العقار قريباً",
    });
  };

  const handleDelete = (propertyId: string) => {
    toast({
      title: "تم حذف العقار",
      description: "تم حذف العقار من قائمتك",
      variant: "destructive",
    });
  };

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Profile Form */}
        <Card className="shadow-elegant hover-lift mb-12">
          <div className="p-8">
            <h2 className="text-4xl font-bold mb-8 flex items-center gap-4 border-b-2 border-primary pb-4">
              <div className="bg-primary text-primary-foreground p-3 rounded-xl">
                <User className="h-6 w-6" />
              </div>
              الملف الشخصي
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="flex items-center gap-2 text-base font-semibold">
                    <User className="h-5 w-5 text-primary" />
                    الاسم الكامل
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="ادخل اسمك الكامل"
                    className="h-12"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2 text-base font-semibold">
                    <Phone className="h-5 w-5 text-primary" />
                    رقم الجوال
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="ادخل رقم الجوال"
                    className="h-12"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="flex items-center gap-2 text-base font-semibold">
                  <MapPin className="h-5 w-5 text-primary" />
                  العنوان
                </Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="ادخل عنوانك"
                  rows={3}
                  className="resize-none"
                />
              </div>

              <Button type="submit" variant="success" className="gap-2">
                <Save className="h-5 w-5" />
                حفظ التغييرات
              </Button>
            </form>
          </div>
        </Card>

        {/* User Properties */}
        <section>
          <h3 className="text-4xl font-bold mb-8 flex items-center gap-4 border-b-2 border-primary pb-4">
            <div className="bg-primary text-primary-foreground p-3 rounded-xl">
              <HomeIcon className="h-6 w-6" />
            </div>
            عقاراتي
          </h3>
          
          {userProperties.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {userProperties.map((property) => (
                <div key={property.id} className="relative">
                  <PropertyCard property={property} />
                  <div className="absolute top-4 left-4 space-y-2">
                    <Button
                      size="icon"
                      variant="outline"
                      className="bg-white/90 backdrop-blur-sm hover:bg-white"
                      onClick={() => handleEdit(property.id)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="destructive"
                      className="bg-destructive/90 backdrop-blur-sm"
                      onClick={() => handleDelete(property.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <HomeIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">لا توجد عقارات</h3>
              <p className="text-muted-foreground mb-6">
                لم تقم بإضافة أي عقارات بعد
              </p>
              <Button variant="accent">إضافة عقار جديد</Button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};