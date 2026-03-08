import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { LogIn, Mail, Lock, ShieldCheck, RefreshCw, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Link, useNavigate, useLocation } from "react-router-dom";

export const Login = () => {
  const { signIn, needsOtp, otpMaskedNumber, verifyOtp, resendOtp, cancelOtp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";
  
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [rememberDevice, setRememberDevice] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(60);
  const [expiryCountdown, setExpiryCountdown] = useState(300); // 5 min

  // Resend countdown
  useEffect(() => {
    if (!needsOtp || resendCountdown <= 0) return;
    const t = setTimeout(() => setResendCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [needsOtp, resendCountdown]);

  // Expiry countdown
  useEffect(() => {
    if (!needsOtp || expiryCountdown <= 0) return;
    const t = setTimeout(() => setExpiryCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [needsOtp, expiryCountdown]);

  // Reset counters when OTP screen shows
  useEffect(() => {
    if (needsOtp) {
      setResendCountdown(60);
      setExpiryCountdown(300);
      setOtpCode("");
    }
  }, [needsOtp]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const { error } = await signIn(formData.email, formData.password);
    if (!error && !needsOtp) {
      // Will navigate after OTP or directly
    }
    setIsLoading(false);
  };

  // Navigate when OTP not needed (already verified or no 2FA)
  useEffect(() => {
    if (!isLoading && !needsOtp && formData.email) {
      // signIn succeeded without OTP requirement - navigation handled by auth state
    }
  }, [needsOtp, isLoading]);

  const handleVerifyOtp = useCallback(async () => {
    if (otpCode.length !== 6) return;
    setIsLoading(true);
    const { error } = await verifyOtp(otpCode, rememberDevice);
    if (!error) {
      navigate(from, { replace: true });
    }
    setIsLoading(false);
  }, [otpCode, rememberDevice, verifyOtp, navigate, from]);

  const handleResend = async () => {
    await resendOtp();
    setResendCountdown(60);
    setExpiryCountdown(300);
    setOtpCode("");
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  // Auto-submit when 6 digits entered
  useEffect(() => {
    if (otpCode.length === 6 && needsOtp) {
      handleVerifyOtp();
    }
  }, [otpCode, needsOtp, handleVerifyOtp]);

  if (needsOtp) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="container mx-auto px-4 max-w-md">
          <Card className="shadow-elegant hover-lift">
            <div className="p-8">
              <h2 className="text-2xl font-bold mb-2 flex items-center gap-3 justify-center text-center">
                <div className="bg-primary text-primary-foreground p-3 rounded-xl">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                التحقق بخطوتين
              </h2>

              <p className="text-center text-muted-foreground mb-2">
                تم إرسال رمز التحقق عبر واتساب
              </p>
              {otpMaskedNumber && (
                <p className="text-center text-sm text-muted-foreground mb-6" dir="ltr">
                  {otpMaskedNumber}
                </p>
              )}

              <div className="flex justify-center mb-6" dir="ltr">
                <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode}>
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>

              {/* Expiry timer */}
              <p className={`text-center text-sm mb-4 ${expiryCountdown <= 60 ? 'text-destructive' : 'text-muted-foreground'}`}>
                ينتهي الرمز خلال {formatTime(expiryCountdown)}
              </p>

              {/* Remember device */}
              <div className="flex items-center gap-2 justify-center mb-6">
                <Checkbox
                  id="remember"
                  checked={rememberDevice}
                  onCheckedChange={(v) => setRememberDevice(v === true)}
                />
                <Label htmlFor="remember" className="text-sm cursor-pointer">
                  تذكر هذا الجهاز لمدة 30 يوم
                </Label>
              </div>

              <Button
                onClick={handleVerifyOtp}
                className="w-full h-12 text-lg font-semibold mb-3"
                disabled={isLoading || otpCode.length !== 6}
              >
                <ShieldCheck className="h-5 w-5 ml-2" />
                {isLoading ? "جاري التحقق..." : "تحقق"}
              </Button>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleResend}
                  disabled={resendCountdown > 0}
                  className="flex-1"
                >
                  <RefreshCw className="h-4 w-4 ml-1" />
                  {resendCountdown > 0 ? `إعادة إرسال (${resendCountdown})` : "إعادة إرسال"}
                </Button>
                <Button variant="ghost" onClick={cancelOtp} className="flex-1">
                  <ArrowRight className="h-4 w-4 ml-1" />
                  إلغاء
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

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
                to="/register"
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
