import { Download, Smartphone } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const MobileAppCard = () => {
  const handleInstallClick = () => {
    // For development only - show a message about installation
    alert('تم طلب تثبيت التطبيق - هذه ميزة متاحة فقط في وضع الإنتاج أو على جهاز محمول');
  };

  return (
    <Card className="p-6 bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg border-none overflow-hidden relative group">
      <div className="absolute -right-10 -top-10 w-40 h-40 bg-blue-400 rounded-full opacity-20 group-hover:scale-110 transition-transform duration-500"></div>
      <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-blue-400 rounded-full opacity-20 group-hover:scale-110 transition-transform duration-500"></div>
      
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="bg-white/20 p-3 rounded-full">
          <Smartphone className="h-10 w-10" />
        </div>
        
        <div className="flex-1">
          <h3 className="font-bold text-xl mb-2">تطبيق سكني للجوال</h3>
          <p className="text-white/80 mb-4">
            قم بتثبيت تطبيق سكني على جهازك للوصول السريع واستخدامه بدون إنترنت
          </p>
          
          <div className="flex gap-2 flex-wrap">
            <Button 
              onClick={handleInstallClick}
              className="gap-2 bg-white text-blue-600 hover:bg-white/90"
            >
              <Download className="h-4 w-4" />
              تثبيت التطبيق
            </Button>
            
            <Button
              variant="outline"
              className="bg-transparent border-white text-white hover:bg-white/20"
              onClick={() => {
                // Just for demonstration in development
                alert('ميزات التطبيق: التصفح بدون إنترنت، إشعارات فورية، واجهة مخصصة للجوال');
              }}
            >
              عرض المميزات
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default MobileAppCard;
