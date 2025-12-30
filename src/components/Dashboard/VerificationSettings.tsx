import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export const VerificationSettings = () => {
  const [badgeTarget, setBadgeTarget] = useState<string>(() => 
    (typeof window !== 'undefined' && window.localStorage?.getItem('verifiedBadgeTarget')) || 'owner'
  );

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold mb-4">إعدادات التوثيق</h3>
      <div className="max-w-md space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">إظهار شارة التوثيق على</label>
          <Select 
            value={badgeTarget} 
            onValueChange={(v) => { 
              setBadgeTarget(v); 
              if (typeof window !== 'undefined') window.localStorage?.setItem('verifiedBadgeTarget', v); 
            }}
          >
            <SelectTrigger><SelectValue placeholder="اختر الهدف" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="owner">المالك</SelectItem>
              <SelectItem value="publisher">الناشر</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="bg-muted/50 p-4 rounded-lg">
          <p className="text-xs text-muted-foreground">
            💡 <strong>ملاحظة:</strong> مؤقتاً يتم حفظ الإعداد محلياً في المتصفح. يمكن لاحقاً نقله إلى إعدادات قاعدة البيانات.
          </p>
        </div>
      </div>
    </div>
  );
};