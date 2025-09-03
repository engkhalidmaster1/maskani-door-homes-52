import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, User, Phone, Lock, Mail } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Link, useNavigate } from "react-router-dom";

export const Register = () => {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const { error } = await signUp(formData.email, formData.password, formData.fullName, formData.phone);
    
    if (!error) {
      navigate("/login");
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="container mx-auto px-4 max-w-lg">
        <Card className="shadow-elegant hover-lift">
          <div className="p-8">
            <h2 className="text-3xl font-bold mb-8 flex items-center gap-4 justify-center text-center">
              <div className="bg-primary text-primary-foreground p-3 rounded-xl">
                <UserPlus className="h-6 w-6" />
              </div>
              إنشاء حساب جديد
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Grid layout for form fields - 2 columns on larger screens, 1 column on mobile */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="flex items-center gap-2 text-base font-semibold">
                    <User className="h-5 w-5 text-primary" />
                    الاسم الكامل
                  </Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="ادخل اسمك الكامل"
                    className="h-12"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2 text-base font-semibold">
                    <Mail className="h-5 w-5 text-primary" />
                    البريد الإلكتروني
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="ادخل البريد الإلكتروني"
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

                <div className="space-y-2">
                  <Label htmlFor="password" className="flex items-center gap-2 text-base font-semibold">
                    <Lock className="h-5 w-5 text-primary" />
                    كلمة المرور
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="اختر كلمة مرور قوية"
                    className="h-12"
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full h-12 text-lg font-semibold mt-6" disabled={isLoading}>
                <UserPlus className="h-5 w-5 ml-2" />
                {isLoading ? "جاري إنشاء الحساب..." : "إنشاء حساب"}
              </Button>
            </form>
            
            <p className="text-center mt-6 text-muted-foreground">
              لديك حساب بالفعل؟{" "}
              <Link
                to="/login"
                className="text-primary font-semibold hover:underline"
              >
                سجل الدخول
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};