import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Moon, Sun, Bell, BellOff, Globe, Monitor, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@/hooks/useTheme";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

type Language = "ar" | "en";
type ThemeMode = "light" | "dark" | "system";

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

export function Settings() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();

  const [language, setLanguage] = useState<Language>(() =>
    (localStorage.getItem("app_language") as Language) || "ar"
  );

  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    const stored = localStorage.getItem("theme_mode") as ThemeMode | null;
    return stored || (theme === "dark" ? "dark" : "light");
  });

  const [notifications, setNotifications] = useState(() => ({
    push: localStorage.getItem("notif_push") !== "false",
    sound: localStorage.getItem("notif_sound") !== "false",
    newProperties: localStorage.getItem("notif_new_props") !== "false",
    priceChanges: localStorage.getItem("notif_price") !== "false",
  }));

  // Apply theme mode
  useEffect(() => {
    localStorage.setItem("theme_mode", themeMode);
    if (themeMode === "system") {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setTheme(prefersDark ? "dark" : "light");
    } else {
      setTheme(themeMode as "light" | "dark");
    }
  }, [themeMode, setTheme]);

  // Save language
  useEffect(() => {
    localStorage.setItem("app_language", language);
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = language;
  }, [language]);

  // Save notification preferences
  const updateNotification = (key: keyof typeof notifications, value: boolean) => {
    setNotifications((prev) => {
      const updated = { ...prev, [key]: value };
      localStorage.setItem(`notif_${key === "newProperties" ? "new_props" : key === "priceChanges" ? "price" : key}`, String(value));
      return updated;
    });
  };

  const themeModes: { value: ThemeMode; label: string; icon: React.ReactNode }[] = [
    { value: "light", label: "فاتح", icon: <Sun className="h-5 w-5" /> },
    { value: "dark", label: "داكن", icon: <Moon className="h-5 w-5" /> },
    { value: "system", label: "تلقائي", icon: <Monitor className="h-5 w-5" /> },
  ];

  const languages: { value: Language; label: string; flag: string }[] = [
    { value: "ar", label: "العربية", flag: "🇮🇶" },
    { value: "en", label: "English", flag: "🇺🇸" },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container max-w-2xl mx-auto flex items-center gap-3 p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="shrink-0">
            <ArrowRight className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold text-foreground">الإعدادات</h1>
        </div>
      </div>

      <motion.div
        className="container max-w-2xl mx-auto p-4 space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {/* Theme Section */}
        <motion.div variants={itemVariants}>
          <h2 className="text-sm font-semibold text-muted-foreground mb-3 px-1">المظهر</h2>
          <Card className="overflow-hidden border-border/50 shadow-sm">
            <CardContent className="p-3">
              <div className="grid grid-cols-3 gap-2">
                {themeModes.map((mode) => (
                  <button
                    key={mode.value}
                    onClick={() => setThemeMode(mode.value)}
                    className={`relative flex flex-col items-center gap-2 p-4 rounded-xl transition-all duration-200 ${
                      themeMode === mode.value
                        ? "bg-primary/10 text-primary ring-2 ring-primary/30"
                        : "bg-muted/50 text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {themeMode === mode.value && (
                      <motion.div
                        layoutId="theme-check"
                        className="absolute top-2 left-2 bg-primary text-primary-foreground rounded-full p-0.5"
                      >
                        <Check className="h-3 w-3" />
                      </motion.div>
                    )}
                    {mode.icon}
                    <span className="text-xs font-medium">{mode.label}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Language Section */}
        <motion.div variants={itemVariants}>
          <h2 className="text-sm font-semibold text-muted-foreground mb-3 px-1">
            <Globe className="h-4 w-4 inline-block ml-1" />
            اللغة
          </h2>
          <Card className="overflow-hidden border-border/50 shadow-sm">
            <CardContent className="p-3">
              <div className="grid grid-cols-2 gap-2">
                {languages.map((lang) => (
                  <button
                    key={lang.value}
                    onClick={() => {
                      setLanguage(lang.value);
                      toast({
                        title: lang.value === "ar" ? "تم تغيير اللغة" : "Language changed",
                        description: lang.value === "ar" ? "تم التبديل إلى العربية" : "Switched to English",
                      });
                    }}
                    className={`flex items-center gap-3 p-4 rounded-xl transition-all duration-200 ${
                      language === lang.value
                        ? "bg-primary/10 text-primary ring-2 ring-primary/30"
                        : "bg-muted/50 text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <span className="text-2xl">{lang.flag}</span>
                    <span className="font-medium text-sm">{lang.label}</span>
                    {language === lang.value && (
                      <motion.div layoutId="lang-check" className="mr-auto bg-primary text-primary-foreground rounded-full p-0.5">
                        <Check className="h-3 w-3" />
                      </motion.div>
                    )}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Notifications Section */}
        <motion.div variants={itemVariants}>
          <h2 className="text-sm font-semibold text-muted-foreground mb-3 px-1">
            <Bell className="h-4 w-4 inline-block ml-1" />
            الإشعارات
          </h2>
          <Card className="overflow-hidden border-border/50 shadow-sm">
            <CardContent className="p-0">
              {[
                { key: "push" as const, label: "إشعارات الدفع", desc: "تلقي إشعارات فورية", icon: <Bell className="h-5 w-5 text-primary" /> },
                { key: "sound" as const, label: "صوت الإشعارات", desc: "تشغيل صوت عند وصول إشعار", icon: notifications.sound ? <Bell className="h-5 w-5 text-primary" /> : <BellOff className="h-5 w-5 text-muted-foreground" /> },
                { key: "newProperties" as const, label: "عقارات جديدة", desc: "إشعار عند إضافة عقارات جديدة", icon: <Bell className="h-5 w-5 text-accent" /> },
                { key: "priceChanges" as const, label: "تغييرات الأسعار", desc: "إشعار عند تغيير أسعار العقارات المفضلة", icon: <Bell className="h-5 w-5 text-destructive" /> },
              ].map((item, i, arr) => (
                <div key={item.key}>
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-muted/50">{item.icon}</div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{item.label}</p>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                    </div>
                    <Switch
                      checked={notifications[item.key]}
                      onCheckedChange={(val) => updateNotification(item.key, val)}
                    />
                  </div>
                  {i < arr.length - 1 && <Separator />}
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* App Info */}
        <motion.div variants={itemVariants}>
          <Card className="overflow-hidden border-border/50 shadow-sm">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground">سكني v1.0.0</p>
              <p className="text-xs text-muted-foreground mt-1">تطبيق العقارات الأول في مجمع الدور</p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default Settings;
