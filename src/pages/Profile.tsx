import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PropertyCard } from "@/components/Property/PropertyCard";
import { User, Phone, MapPin, Save, Edit, Trash2, Home as HomeIcon, Mail, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useProfile } from "@/hooks/useProfile";
import { useProperties } from "@/hooks/useProperties";
import { useAuth } from "@/hooks/useAuth";
import { MainNav } from "@/components/Layout/MainNav";
import { ContactFooter } from "@/components/Layout/ContactFooter";

export const Profile = () => {
  const { toast } = useToast();
  const { profileData, isLoading, isSaving, updateProfile } = useProfile();
  const { userProperties } = useProperties();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
  });

  // Update form data when profile data changes
  useEffect(() => {
    if (profileData) {
      setFormData({
        name: profileData.full_name || "",
        phone: profileData.phone || "",
        address: profileData.address || "",
      });
    }
  }, [profileData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await updateProfile({
      full_name: formData.name,
      phone: formData.phone,
      address: formData.address,
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  const content = (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <MainNav />
      <div className="container mx-auto px-4 py-8 max-w-7xl flex-grow">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          {/* Profile Form */}
          <div className="w-full md:w-1/3">
            <Card className="shadow-elegant hover-lift mb-4">
              <div className="p-8">
                <h2 className="text-4xl font-bold mb-8 flex items-center gap-4 border-b-2 border-primary pb-4">
                  <div className="bg-primary text-primary-foreground p-3 rounded-xl">
                    <User className="h-6 w-6" />
                  </div>
                  الملف الشخصي
                </h2>
                <form className="space-y-6" onSubmit={handleSubmit}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
                    <div>
                      <Label htmlFor="name" className="flex items-center gap-2 text-sm font-semibold">
                        <User className="h-5 w-5 text-primary" />
                        الاسم الكامل
                      </Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="ادخل اسمك الكامل"
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone" className="flex items-center gap-2 text-sm font-semibold">
                        <Phone className="h-5 w-5 text-primary" />
                        رقم الهاتف
                      </Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="ادخل رقم هاتفك"
                        className="mt-2"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col md:flex-row md:items-center md:gap-8 mb-6">
                    <div className="flex-1 mb-4 md:mb-0">
                      <Label htmlFor="email" className="flex items-center gap-2 text-sm font-semibold">
                        <Mail className="h-5 w-5 text-primary" />
                        البريد الإلكتروني
                      </Label>
                      <Input
                        id="email"
                        value={user?.email || ''}
                        disabled
                        className="mt-2 bg-gray-100"
                      />
                    </div>
                    <div>
                      <Button
                        type="button"
                        variant="outline"
                        className="gap-2"
                        onClick={() => {
                          toast({
                            title: "تعديل كلمة المرور",
                            description: "سيتم إضافة هذه الميزة قريباً",
                          });
                        }}
                      >
                        تغيير كلمة المرور
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="address" className="flex items-center gap-2 text-sm font-semibold">
                      <MapPin className="h-5 w-5 text-primary" />
                      العنوان
                    </Label>
                    <Textarea
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="ادخل عنوانك"
                      rows={3}
                      className="resize-none mt-2"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    disabled={isSaving}
                    className="gap-2"
                  >
                    <Save className="h-5 w-5" />
                    {isSaving ? "جاري الحفظ..." : "حفظ التغييرات"}
                  </Button>
                </form>
              </div>
            </Card>
          </div>
          {/* User Properties */}
          <div className="w-full md:w-2/3">
            <Card className="shadow-elegant hover-lift">
              <div className="p-8">
                <h2 className="text-4xl font-bold mb-8 flex items-center gap-4 border-b-2 border-primary pb-4">
                  <div className="bg-primary text-primary-foreground p-3 rounded-xl">
                    <HomeIcon className="h-6 w-6" />
                  </div>
                  عقاراتي
                </h2>
                {userProperties.length > 0 ? (
                  <div className="flex flex-col gap-4">
                    {userProperties.map((property) => (
                      <div key={property.id} className="relative flex items-center bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-all">
                        {/* صورة العقار */}
                        {property.images && property.images.length > 0 ? (
                          <img src={property.images[0]} alt={property.title} className="w-28 h-20 object-cover rounded-md mr-4 border" />
                        ) : (
                          <div className="w-28 h-20 bg-gray-200 flex items-center justify-center rounded-md mr-4 border text-gray-400">بدون صورة</div>
                        )}
                        {/* بيانات العقار */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-lg truncate">{property.title}</span>
                            <span className="text-xs text-gray-500">{property.property_type}</span>
                          </div>
                          <div className="text-sm text-gray-600 truncate">{property.address || property.location}</div>
                          <div className="text-sm text-primary font-bold mt-1">{property.price?.toLocaleString()} د.ع</div>
                        </div>
                        {/* أزرار التعديل والحذف */}
                        <div className="flex flex-col gap-2 ml-4">
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
              </div>
            </Card>
          </div>
        </div>
      </div>
      <ContactFooter />
    </div>
  );
  return content;
};