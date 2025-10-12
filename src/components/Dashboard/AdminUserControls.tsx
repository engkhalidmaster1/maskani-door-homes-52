import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import VerifiedBadge from '@/components/VerifiedBadge';
import useVerification from '@/hooks/useVerification';
import { useAuth } from '@/hooks/useAuth';
import { Textarea } from '@/components/ui/textarea';

const ROLE_OPTIONS = ['admin', 'agency', 'pro', 'user'] as const;

type Limits = { max_properties: number; max_images: number; max_featured: number; storage_mb: number };

export const AdminUserControls = () => {
  const { user, userRole, isAdmin } = useAuth();
  const [userId, setUserId] = useState<string>('');
  const [roleName, setRoleName] = useState<string>('user');
  const [limits, setLimits] = useState<Limits>({ max_properties: 20, max_images: 200, max_featured: 0, storage_mb: 2000 });
  const { verified, setVerified, loading: verLoading } = useVerification(userId, isAdmin);
  const [badgeTarget, setBadgeTarget] = useState<string>(() => (typeof window !== 'undefined' && window.localStorage?.getItem('verifiedBadgeTarget')) || 'owner');
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');

  const disabled = !isAdmin;

  const fetchLimits = useMemo(() => async (role: string) => {
    const { data } = await supabase
      .from('role_limits_by_name')
      .select('max_properties, max_images, max_featured, storage_mb')
      .eq('role_name', role)
      .maybeSingle<{
        max_properties: number | null;
        max_images: number | null;
        max_featured: number | null;
        storage_mb: number | null;
      }>();
    if (data) setLimits({
      max_properties: data.max_properties ?? 0,
      max_images: data.max_images ?? 0,
      max_featured: data.max_featured ?? 0,
      storage_mb: data.storage_mb ?? 0
    });
  }, []);

  useEffect(() => {
    fetchLimits(roleName);
  }, [roleName, fetchLimits]);

  const handleSaveLimits = async () => {
    if (disabled) return;
    await supabase.rpc('admin_set_role_limit', {
      p_role_name: roleName,
      p_max_properties: limits.max_properties,
      p_max_images: limits.max_images,
      p_max_featured: limits.max_featured,
      p_storage_mb: limits.storage_mb
    });
  };

  const handleSetRole = async () => {
    if (disabled || !userId) return;
    await supabase.rpc('admin_set_user_role', { p_user_id: userId, p_role: roleName });
  };

  const handleToggleVerify = async () => {
    if (!userId) return;
    await setVerified(!verified);
  };

  // Counters: properties count and images count for the given user
  const [counters, setCounters] = useState<{ properties: number; images: number }>({ properties: 0, images: 0 });
  useEffect(() => {
    const fetchCounters = async () => {
      if (!userId) return;
      const { count: propsCount } = await supabase
        .from('properties')
        .select('id', { head: true, count: 'exact' })
        .eq('user_id', userId);

      // Assuming each property has images: string[] column
      const { data: propsData } = await supabase
        .from('properties')
        .select('images')
        .eq('user_id', userId);

      const totalImages = (propsData || []).reduce((sum: number, p: { images: string[] | null }) => sum + ((p.images || []).length), 0);
      setCounters({ properties: propsCount || 0, images: totalImages });
    };
    fetchCounters();
  }, [userId]);

  return (
    <div className={`rounded-lg border p-4 space-y-4 ${disabled ? 'opacity-70 pointer-events-none' : ''}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">إدارة المستخدمين والصلاحيات</h3>
        <span className="text-sm text-gray-500">دورك: {userRole ?? 'unknown'}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="space-y-2">
          <label className="text-sm">معرّف المستخدم (UUID)</label>
          <Input value={userId} onChange={(e) => setUserId(e.target.value.trim())} placeholder="85c5601e-...." />
          <div className="flex items-center gap-2">
            <span className="text-sm">توثيق:</span>
            <VerifiedBadge verified={verified} />
            <Button size="sm" onClick={handleToggleVerify} disabled={!isAdmin || !userId || verLoading}>
              {verified ? 'إلغاء التوثيق' : 'توثيق'}
            </Button>
          </div>
          <div className="text-xs text-muted-foreground">
            عدد العقارات: {counters.properties} — عدد الصور: {counters.images}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm">الدور</label>
          <Select value={roleName} onValueChange={setRoleName}>
            <SelectTrigger><SelectValue placeholder="اختر الدور" /></SelectTrigger>
            <SelectContent>
              {ROLE_OPTIONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={handleSetRole} disabled={!isAdmin || !userId}>تحديث الدور للمستخدم</Button>
        </div>

        <div className="space-y-2">
          <label className="text-sm">حدود الدور المختار</label>
          <div className="grid grid-cols-2 gap-2">
            <Input type="number" value={limits.max_properties}
              onChange={(e) => setLimits(s => ({ ...s, max_properties: Number(e.target.value) }))}
              placeholder="Max properties" />
            <Input type="number" value={limits.max_images}
              onChange={(e) => setLimits(s => ({ ...s, max_images: Number(e.target.value) }))}
              placeholder="Max images" />
            <Input type="number" value={limits.max_featured}
              onChange={(e) => setLimits(s => ({ ...s, max_featured: Number(e.target.value) }))}
              placeholder="Max featured" />
            <Input type="number" value={limits.storage_mb}
              onChange={(e) => setLimits(s => ({ ...s, storage_mb: Number(e.target.value) }))}
              placeholder="Storage (MB)" />
          </div>
          <Button onClick={handleSaveLimits} disabled={!isAdmin}>حفظ حدود الدور</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="space-y-2">
          <label className="text-sm">إظهار شارة التوثيق على</label>
          <Select value={badgeTarget} onValueChange={(v) => { setBadgeTarget(v); if (typeof window !== 'undefined') window.localStorage?.setItem('verifiedBadgeTarget', v); }}>
            <SelectTrigger><SelectValue placeholder="اختر الهدف" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="owner">المالك</SelectItem>
              <SelectItem value="publisher">الناشر</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">مؤقتاً يتم حفظ الإعداد محلياً في المتصفح. يمكن لاحقاً نقله إلى إعدادات قاعدة البيانات.</p>
        </div>
      </div>

      {/* Admin broadcast notification */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-semibold">إرسال إشعار عام (لكل المستخدمين)</label>
          <Input 
            placeholder="عنوان الإشعار" 
            value={broadcastTitle} 
            onChange={(e) => setBroadcastTitle(e.target.value)} 
          />
          <Textarea 
            placeholder="نص الإشعار" 
            value={broadcastMessage} 
            onChange={(e) => setBroadcastMessage(e.target.value)} 
            rows={4} 
          />
        </div>
        <div className="flex items-end">
          <Button
            disabled={!isAdmin || !broadcastMessage.trim()}
            onClick={async () => {
              try {
                console.log('📢 إرسال إشعار للمستخدمين...', { 
                  title: broadcastTitle || 'إشعار', 
                  message: broadcastMessage 
                });
                
                const { data, error } = await supabase.rpc('admin_broadcast_notification', { 
                  p_title: broadcastTitle || 'إشعار', 
                  p_message: broadcastMessage 
                });
                
                if (error) {
                  console.error('❌ خطأ في إرسال الإشعار:', error);
                  throw error;
                }
                
                console.log('✅ تم إرسال الإشعار بنجاح', data);
                
                setBroadcastTitle('');
                setBroadcastMessage('');
                
                // إظهار رسالة نجاح
                alert('✅ تم إرسال الإشعار لجميع المستخدمين بنجاح!');
              } catch (err) {
                console.error('❌ فشل إرسال الإشعار:', err);
                alert('❌ حدث خطأ أثناء إرسال الإشعار: ' + (err as Error).message);
              }
            }}
          >
            إرسال الإشعار للجميع
          </Button>
        </div>
      </div>

      <p className="text-xs text-gray-500">
        ملاحظة: الإدراج محكوم بحصص الدور عبر تريغر قاعدة البيانات. دوال الإدارة محمية وفق RLS و SECURITY DEFINER للأدمن فقط.
      </p>
    </div>
  );
};

export default AdminUserControls;
