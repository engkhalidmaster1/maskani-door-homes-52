import { Info } from "lucide-react";

export const ScrollingBanner = () => {
  return (
    <div className="gradient-primary text-primary-foreground rounded-xl mb-8 overflow-hidden">
      <div className="py-3 whitespace-nowrap">
        <div className="inline-block animate-pulse px-4">
          <div className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            <span className="font-medium">
              مرحباً بك في تطبيق "سكني" - منصة العقارات الأولى في مجمع الدور | أسعار مناسبة للجميع | شقق مفروشة وغير مفروشة | عقارات للبيع والإيجار
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};