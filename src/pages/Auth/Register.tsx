import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, User, Phone, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface RegisterProps {
  onPageChange: (page: string) => void;
}

export const Register = ({ onPageChange }: RegisterProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    password: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "تم إنشاء الحساب بنجاح!",
      description: "مرحباً بك في تطبيق سكني",
    });
    onPageChange("login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="container mx-auto px-4 max-w-md">
        <Card className="shadow-elegant hover-lift">
          <div className="p-8">
            <h2 className="text-3xl font-bold mb-8 flex items-center gap-4 justify-center text-center">
              <div className="bg-primary text-primary-foreground p-3 rounded-xl">
                <UserPlus className="h-6 w-6" />
              </div>
              إنشاء حساب جديد
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
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

              <Button type="submit" className="w-full h-12 text-lg font-semibold">
                <UserPlus className="h-5 w-5 ml-2" />
                إنشاء حساب
              </Button>
            </form>
            
            <p className="text-center mt-6 text-muted-foreground">
              لديك حساب بالفعل؟{" "}
              <button
                onClick={() => onPageChange("login")}
                className="text-primary font-semibold hover:underline"
              >
                سجل الدخول
              </button>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};