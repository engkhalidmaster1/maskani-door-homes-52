import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { PropertyCard } from "@/components/Property/PropertyCard";
import { User, Phone, MapPin, Save, Edit, Trash2, Home as HomeIcon, Mail, Lock, Shield, CheckCircle, XCircle, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useProfile } from "@/hooks/useProfile";
import { useProperties } from "@/hooks/useProperties";
import { useAuth } from "@/hooks/useAuth";
import { useUserStatus } from "@/hooks/useUserStatus";
import { ContactFooter } from "@/components/Layout/ContactFooter";
import { supabase } from "@/integrations/supabase/client";

export const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profileData, isLoading, isSaving, updateProfile } = useProfile();
  const { userProperties, deleteProperty } = useProperties();
  const { user } = useAuth();
  const { userStatus, getStatusLabel, getStatusColor } = useUserStatus();
  
  // تشخيص hook useProperties (مرة واحدة فقط)
  useEffect(() => {
    if (userProperties && userProperties.length > 0) {
      console.log("✅ عقارات المستخدم محملة بنجاح:", {
        عدد_العقارات: userProperties.length,
        دالة_الحذف: typeof deleteProperty,
        أول_عقار: userProperties[0]?.title
      });
    } else if (userProperties && userProperties.length === 0) {
      console.log("📋 لا توجد عقارات للمستخدم");
    }
  }, [userProperties, deleteProperty]);
  
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
  });

  const [passwordData, setPasswordData] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    new: false,
    confirm: false,
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

    const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log("🔑 بدء عملية تغيير كلمة المرور");
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      console.log("❌ كلمات المرور غير متطابقة");
      setPasswordError("كلمات المرور غير متطابقة");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      console.log("❌ كلمة المرور قصيرة جداً");
      setPasswordError("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
      return;
    }

    setIsPasswordLoading(true);
    setPasswordError("");

    try {
      // تحقق من الجلسة الحالية
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      console.log("📋 حالة الجلسة:", sessionData?.session ? "نشطة" : "غير نشطة");
      
      if (sessionError) {
        console.error("❌ خطأ في الجلسة:", sessionError);
        throw new Error("خطأ في التحقق من الجلسة");
      }

      if (!sessionData?.session) {
        console.error("❌ لا توجد جلسة نشطة");
        throw new Error("يجب تسجيل الدخول أولاً");
      }

      console.log("🔄 تحديث كلمة المرور...");
      const { data, error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      console.log("📊 نتيجة تحديث كلمة المرور:", { data, error });

      if (error) {
        console.error("❌ خطأ في تحديث كلمة المرور:", error);
        throw error;
      }

      console.log("✅ تم تحديث كلمة المرور بنجاح");
      
      // تحديث الواجهة
      setPasswordData({
        newPassword: "",
        confirmPassword: "",
      });

      setShowPasswordForm(false);
      toast({
        title: "تم تغيير كلمة المرور",
        description: "يمكنك الآن استخدام كلمة المرور الجديدة.",
      });

    } catch (error: unknown) {
      console.error("❌ خطأ في تغيير كلمة المرور:", error);
      const message = (error as Error)?.message || "حدث خطأ في تغيير كلمة المرور";
      setPasswordError(message);
      toast({
        title: "تعذر تغيير كلمة المرور",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsPasswordLoading(false);
    }
  };

  const handleEdit = (propertyId: string) => {
    console.log("✏️ الانتقال لتعديل العقار:", propertyId);
    navigate(`/edit-property/${propertyId}`);
  };

  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handleDelete = async (propertyId: string) => {
    console.log("🔍 محاولة حذف العقار:", propertyId);
    console.log("📊 حالة hook useProperties:", { 
      userPropertiesCount: userProperties?.length || 0,
      deletePropertyType: typeof deleteProperty 
    });
    
    // منع حذف متعدد
    if (isDeleting) {
      console.log("⚠️ عملية حذف أخرى قيد التنفيذ");
      return;
    }

    // طلب تأكيد من المستخدم
    const isConfirmed = window.confirm(
      "هل أنت متأكد من حذف هذا العقار؟\nسيتم حذف جميع الصور والبيانات المرتبطة بالعقار.\nلا يمكن التراجع عن هذا الإجراء."
    );
    
    if (!isConfirmed) {
      console.log("❌ المستخدم ألغى عملية الحذف");
      return;
    }

    setIsDeleting(propertyId);

    try {
      console.log("🗑️ بدء عملية حذف العقار:", propertyId);
      
      if (!deleteProperty) {
        throw new Error("دالة الحذف غير متاحة");
      }
      
      await deleteProperty(propertyId);
      console.log("✅ تم حذف العقار بنجاح");
      
      toast({
        title: "تم حذف العقار",
        description: "تم حذف العقار وجميع بياناته بنجاح",
      });
    } catch (error) {
      console.error("❌ خطأ في حذف العقار:", error);
      toast({
        title: "خطأ في حذف العقار",
        description: `حدث خطأ أثناء حذف العقار: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(null);
    }
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
                        onClick={() => setShowPasswordForm(!showPasswordForm)}
                      >
                        <Lock className="h-4 w-4" />
                        {showPasswordForm ? "إلغاء" : "تغيير كلمة المرور"}
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
                {showPasswordForm && (
                  <div className="mt-6 p-4 border-2 border-blue-200 rounded-lg bg-blue-50">
                    <h3 className="text-lg font-semibold mb-4 text-blue-800 flex items-center gap-2">
                      <Lock className="h-5 w-5" />
                      تغيير كلمة المرور
                    </h3>
                    <form onSubmit={handlePasswordChange} className="space-y-4">
                      <div>
                        <Label htmlFor="newPassword" className="flex items-center gap-2 text-sm font-semibold">
                          <Lock className="h-4 w-4 text-green-600" />
                          كلمة المرور الجديدة
                        </Label>
                        <div className="relative mt-2">
                          <Input
                            id="newPassword"
                            type={showPasswords.new ? "text" : "password"}
                            value={passwordData.newPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                            placeholder="ادخل كلمة المرور الجديدة (6 أحرف على الأقل)"
                            required
                            minLength={6}
                            className="pr-10"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute left-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                            onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                          >
                            {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="confirmPassword" className="flex items-center gap-2 text-sm font-semibold">
                          <Lock className="h-4 w-4 text-orange-600" />
                          تأكيد كلمة المرور الجديدة
                        </Label>
                        <div className="relative mt-2">
                          <Input
                            id="confirmPassword"
                            type={showPasswords.confirm ? "text" : "password"}
                            value={passwordData.confirmPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                            placeholder="أعد ادخال كلمة المرور الجديدة"
                            required
                            className="pr-10"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute left-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                            onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                          >
                            {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>

                      {passwordError && (
                        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
                          {passwordError}
                        </div>
                      )}

                      <div className="flex gap-3">
                        <Button 
                          type="submit" 
                          disabled={isPasswordLoading}
                          className="flex-1 gap-2 bg-blue-600 hover:bg-blue-700"
                        >
                          <CheckCircle className="h-4 w-4" />
                          {isPasswordLoading ? "جاري التحديث..." : "تحديث كلمة المرور"}
                        </Button>
                        <Button 
                          type="button" 
                          variant="outline"
                          onClick={() => {
                            setShowPasswordForm(false);
                            setPasswordData({
                              newPassword: "",
                              confirmPassword: "",
                            });
                            setPasswordError("");
                          }}
                          className="gap-2"
                        >
                          <XCircle className="h-4 w-4" />
                          إلغاء
                        </Button>
                      </div>
                    </form>
                  </div>
                )}
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
                
                {/* User Status Information */}
                {userStatus && (
                  <Card className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-l-primary">
                    <div className="p-6">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="bg-primary text-primary-foreground p-2 rounded-lg">
                          <Shield className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900">معلومات الصلاحية</h3>
                          <Badge className={`${getStatusColor(userStatus.status)} mt-1`}>
                            {getStatusLabel(userStatus.status)}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white rounded-lg p-4 border">
                          <div className="flex items-center gap-2 mb-2">
                            <HomeIcon className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium text-gray-600">حد العقارات</span>
                          </div>
                          <div className="text-2xl font-bold text-gray-900">
                            {/** Handle unlimited (-1) */}
                            {(() => {
                              const current = userStatus.current_properties_count || 0;
                              const limit = userStatus.properties_limit;
                              const isUnlimited = limit === -1;
                              return (
                                <>
                                  {current} / {isUnlimited ? '∞' : limit}
                                </>
                              );
                            })()}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {(() => {
                              const current = userStatus.current_properties_count || 0;
                              const limit = userStatus.properties_limit;
                              const isUnlimited = limit === -1;
                              return isUnlimited ? 'متبقي: غير محدود' : `متبقي: ${Math.max(0, limit - current)}`;
                            })()}
                          </div>
                        </div>
                        
                        <div className="bg-white rounded-lg p-4 border">
                          <div className="flex items-center gap-2 mb-2">
                            <CheckCircle className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium text-gray-600">حد الصور</span>
                          </div>
                          <div className="text-2xl font-bold text-gray-900">
                            {userStatus.images_limit === -1 ? '∞' : userStatus.images_limit}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            صورة لكل عقار
                          </div>
                        </div>
                        
                        <div className="bg-white rounded-lg p-4 border">
                          <div className="flex items-center gap-2 mb-2">
                            {userStatus.can_publish ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-500" />
                            )}
                            <span className="text-sm font-medium text-gray-600">النشر</span>
                          </div>
                          <div className={`text-lg font-semibold ${userStatus.can_publish ? 'text-green-600' : 'text-red-600'}`}>
                            {userStatus.can_publish ? 'مسموح' : 'غير مسموح'}
                          </div>
                          {userStatus.is_verified && (
                            <div className="text-xs text-green-600 mt-1 flex items-center gap-1">
                              <CheckCircle className="h-3 w-3" />
                              حساب موثق
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                )}
                
                {userProperties.length > 0 ? (
                  <div className="flex flex-col gap-4">
                    {userProperties.map((property) => (
                      <div key={property.id} className="relative flex items-center bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-all">
                        {/* صورة العقار */}
                        {property.images && property.images.length > 0 ? (
                          <img src={property.images[0]} alt={property.title} className="w-28 h-20 object-cover rounded-md mr-4 border" />
                        ) : (
                          <div className="w-28 h-20 bg-gradient-to-br from-gray-100 to-gray-200 flex flex-col items-center justify-center rounded-md mr-4 border border-dashed border-gray-300 text-gray-500 relative">
                            <HomeIcon className="h-6 w-6 mb-1 text-gray-400" />
                            <span className="text-xs font-medium text-center px-1">{property.property_type}</span>
                            <div className="absolute top-1 right-1 bg-orange-100 text-orange-600 rounded-full p-1">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                            </div>
                          </div>
                        )}
                        {/* بيانات العقار */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-lg truncate">{property.title}</span>
                            <span className="text-xs text-gray-500">{property.property_type}</span>
                          </div>
                          <div className="text-sm text-gray-600 truncate">{property.address || property.location}</div>
                          <div className="text-sm text-primary font-bold mt-1">{property.price?.toLocaleString()} د.ع</div>
                          {/* معلومات الصور */}
                          {property.images && property.images.length > 0 ? (
                            <div className="flex items-center gap-1 mt-1">
                              <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                              </svg>
                              <span className="text-xs text-green-600 font-medium">{property.images.length} صور</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 mt-1">
                              <svg className="w-3 h-3 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                              <span className="text-xs text-orange-600 font-medium">لم يتم رفع صور</span>
                            </div>
                          )}
                        </div>
                        {/* أزرار التعديل والحذف */}
                        <div className="flex flex-col gap-2 ml-4">
                          <Button
                            size="icon"
                            variant="outline"
                            className="bg-white/90 backdrop-blur-sm hover:bg-white"
                            onClick={() => handleEdit(property.id)}
                            title="تعديل العقار"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="destructive"
                            className="bg-destructive/90 backdrop-blur-sm hover:bg-destructive"
                            onClick={() => handleDelete(property.id)}
                            disabled={isDeleting === property.id}
                            title="حذف العقار"
                          >
                            {isDeleting === property.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
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
                    <Button 
                      variant="accent" 
                      onClick={() => navigate('/add-property')}
                    >
                      إضافة عقار جديد
                    </Button>
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