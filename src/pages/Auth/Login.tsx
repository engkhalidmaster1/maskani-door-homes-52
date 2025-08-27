import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn, Mail, Lock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Link, useNavigate, useLocation } from "react-router-dom";

export const Login = () => {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const { error } = await signIn(formData.email, formData.password);
    
    if (!error) {
      navigate(from, { replace: true });
    }
    
    setIsLoading(false);
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

              <Button type="submit" className="w-full h-12 text-lg font-semibold" disabled={isLoading}>
                <LogIn className="h-5 w-5 ml-2" />
                {isLoading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
              </Button>
            </form>
            
            <p className="text-center mt-6 text-muted-foreground">
              ليس لديك حساب؟{" "}
              <Link
                to="/auth/register"
                className="text-primary font-semibold hover:underline"
              >
                أنشئ حساب جديد
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};