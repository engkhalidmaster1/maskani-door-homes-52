import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

export const BroadcastNotification = () => {
  const { isAdmin } = useAuth();
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    if (!broadcastMessage.trim()) return;
    setIsSending(true);
    try {
      const { error } = await supabase.rpc('admin_broadcast_notification', {
        p_title: broadcastTitle || 'إشعار',
        p_message: broadcastMessage
      });
      if (error) throw error;
      setBroadcastTitle('');
      setBroadcastMessage('');
      toast({ title: '✅ تم إرسال الإشعار', description: 'تم إرسال الإشعار لجميع المستخدمين بنجاح' });
    } catch (err) {
      toast({ title: '❌ خطأ في الإرسال', description: (err as Error).message, variant: 'destructive' });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold mb-4">إرسال إشعار عام (لكل المستخدمين)</h3>
      <div className="max-w-lg space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">عنوان الإشعار</label>
          <Input
            placeholder="أدخل عنوان الإشعار..."
            value={broadcastTitle}
            onChange={(e) => setBroadcastTitle(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">نص الإشعار</label>
          <Textarea
            placeholder="أدخل نص الإشعار المراد إرساله لجميع المستخدمين..."
            value={broadcastMessage}
            onChange={(e) => setBroadcastMessage(e.target.value)}
            rows={5}
          />
        </div>
        <Button
          size="lg"
          disabled={!isAdmin || !broadcastMessage.trim() || isSending}
          onClick={handleSend}
          className="w-full"
        >
          {isSending ? 'جاري الإرسال...' : '📢 إرسال الإشعار للجميع'}
        </Button>
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
          <p className="text-xs text-yellow-800">
            ⚠️ <strong>ملاحظة:</strong> الإدراج محكوم بحصص الدور عبر تريغر قاعدة البيانات. دوال الإدارة محمية وفق RLS و SECURITY DEFINER للأدمن فقط.
          </p>
        </div>
      </div>
    </div>
  );
};
