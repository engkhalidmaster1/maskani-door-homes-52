import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn, Phone, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface LoginProps {
  onPageChange: (page: string) => void;
}

export const Login = ({ onPageChange }: LoginProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    phone: "",
    password: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "تم تسجيل الدخول بنجاح!",
      description: "مرحباً بعودتك إلى تطبيق سكني",
    });
    onPageChange("home");
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="container mx-auto px-4 max-w-md">
        <Card className="shadow-elegant hover-lift">
          <div className="p-8">
            <h2 className="text-3xl font-bold mb-8 flex items-center gap-4 justify-center text-center">
              <div className="bg-primary text-primary-foreground p-3 rounded-xl">
                <LogIn className="h-6 w-6" />
              </div>
              تسجيل الدخول
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
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
                  placeholder="ادخل كلمة المرور"
                  className="h-12"
                  required
                />
              </div>

              <Button type="submit" className="w-full h-12 text-lg font-semibold">
                <LogIn className="h-5 w-5 ml-2" />
                تسجيل الدخول
              </Button>
            </form>
            
            <p className="text-center mt-6 text-muted-foreground">
              ليس لديك حساب؟{" "}
              <button
                onClick={() => onPageChange("register")}
                className="text-primary font-semibold hover:underline"
              >
                أنشئ حساب جديد
              </button>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};