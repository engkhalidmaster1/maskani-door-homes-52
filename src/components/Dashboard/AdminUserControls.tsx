import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import VerifiedBadge from '@/components/VerifiedBadge';
import useVerification from '@/hooks/useVerification';
import { useAuth } from '@/hooks/useAuth';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

const ROLE_OPTIONS = ['admin', 'office', 'agent', 'publisher'] as const;

type Limits = { max_properties: number; max_images: number; storage_mb: number };

export const AdminUserControls = () => {
  const { userRole, isAdmin } = useAuth();
  const [userId, setUserId] = useState<string>('');
  const [roleName, setRoleName] = useState<import('@/types/appRoles').AppRole>('publisher');
  const [limits, setLimits] = useState<Limits>({ max_properties: 20, max_images: 200, storage_mb: 2000 });
  const { verified, setVerified, loading: verLoading } = useVerification(userId, isAdmin);
  const [badgeTarget, setBadgeTarget] = useState<string>(() => (typeof window !== 'undefined' && window.localStorage?.getItem('verifiedBadgeTarget')) || 'owner');
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [selectedSection, setSelectedSection] = useState<'users' | 'verify' | 'broadcast'>('users');
  const { toast } = useToast();

  const disabled = !isAdmin;

  const fetchLimits = useMemo(() => async (role: string) => {
    // Table not implemented yet - using default values
    const { data } = await supabase
      .from('properties')
      .select('id')
      .limit(0)
      .maybeSingle<{
        max_properties: number | null;
        max_images: number | null;
        storage_mb: number | null;
      }>();
    if (data) setLimits({
      max_properties: data.max_properties ?? 0,
      max_images: data.max_images ?? 0,
      storage_mb: data.storage_mb ?? 0
    });
  }, []);

  useEffect(() => {
    fetchLimits(roleName);
  }, [roleName, fetchLimits]);

  const handleSaveLimits = async () => {
    if (disabled) return;
    // Function not implemented yet
    console.log('admin_set_role_limit not implemented', {
      p_role_name: roleName,
      p_max_properties: limits.max_properties,
      p_max_images: limits.max_images,
      p_storage_mb: limits.storage_mb
    });
  };

  const handleSetRole = async () => {
    if (disabled || !userId) return;
    // Function not implemented yet
        try {
          const { error } = await supabase.rpc('set_user_role', { target_user_id: userId, new_role: roleName });
          if (error) throw error;
          toast({ title: '✅ تم التحديث', description: `تم تحديث دور المستخدم إلى ${roleName}` });
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : String(err);
          toast({ title: 'خطأ', description: message || 'فشل تحديث الدور', variant: 'destructive' });
        }
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
    <div className={`flex rounded-lg border min-h-[600px] ${disabled ? 'opacity-70 pointer-events-none' : ''}`}>
      {/* القائمة الجانبية */}
      <aside className="w-64 bg-muted/30 border-r flex flex-col p-4 gap-2">
        <h2 className="text-lg font-bold mb-4 text-center">لوحة التحكم الإدارية</h2>
        <button
          className={`text-right px-4 py-3 rounded-lg font-medium text-sm transition-all duration-200 ${
            selectedSection === 'users' 
              ? 'bg-primary text-primary-foreground shadow-md' 
              : 'hover:bg-muted/60 text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setSelectedSection('users')}
        >
          👥 إدارة الصلاحيات
        </button>
        <button
          className={`text-right px-4 py-3 rounded-lg font-medium text-sm transition-all duration-200 ${
            selectedSection === 'verify' 
              ? 'bg-primary text-primary-foreground shadow-md' 
              : 'hover:bg-muted/60 text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setSelectedSection('verify')}
        >
          ✅ إعدادات التوثيق
        </button>
        <button
          className={`text-right px-4 py-3 rounded-lg font-medium text-sm transition-all duration-200 ${
            selectedSection === 'broadcast' 
              ? 'bg-primary text-primary-foreground shadow-md' 
              : 'hover:bg-muted/60 text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setSelectedSection('broadcast')}
        >
          📢 إرسال إشعار عام
        </button>
      </aside>

      {/* المحتوى الرئيسي */}
      <main className="flex-1 p-6">
        {selectedSection === 'users' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">إدارة الصلاحيات</h3>
              <span className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full">
                دورك: {userRole ?? 'unknown'}
              </span>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="space-y-3">
                <label className="text-sm font-medium">معرّف المستخدم (UUID)</label>
                <Input 
                  value={userId} 
                  onChange={(e) => setUserId(e.target.value.trim())} 
                  placeholder="85c5601e-...." 
                  className="font-mono text-xs"
                />
                <div className="flex items-center gap-2 mt-3">
                  <span className="text-sm font-medium">حالة التوثيق:</span>
                  <VerifiedBadge verified={verified} />
                  <Button size="sm" onClick={handleToggleVerify} disabled={!isAdmin || !userId || verLoading}>
                    {verified ? 'إلغاء التوثيق' : 'توثيق'}
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                  📊 عدد العقارات: {counters.properties} — عدد الصور: {counters.images}
                </div>
              </div>
              
              <div className="space-y-3">
                <label className="text-sm font-medium">الدور</label>
                <Select value={roleName} onValueChange={(v: import('@/types/appRoles').AppRole) => setRoleName(v)}>
                  <SelectTrigger><SelectValue placeholder="اختر الدور" /></SelectTrigger>
                  <SelectContent>
                    {ROLE_OPTIONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button onClick={handleSetRole} disabled={!isAdmin || !userId} className="w-full">
                  تحديث الدور للمستخدم
                </Button>
              </div>
              
              <div className="space-y-3">
                <label className="text-sm font-medium">حدود الدور المختار</label>
                <div className="grid grid-cols-2 gap-2">
                  <Input 
                    type="number" 
                    value={limits.max_properties}
                    onChange={(e) => setLimits(s => ({ ...s, max_properties: Number(e.target.value) }))}
                    placeholder="عدد العقارات" 
                  />
                  <Input 
                    type="number" 
                    value={limits.max_images}
                    onChange={(e) => setLimits(s => ({ ...s, max_images: Number(e.target.value) }))}
                    placeholder="عدد الصور" 
                  />
                  {/* تم إلغاء ميزة العقارات المميزة من النظام */}
                  <Input 
                    type="number" 
                    value={limits.storage_mb}
                    onChange={(e) => setLimits(s => ({ ...s, storage_mb: Number(e.target.value) }))}
                    placeholder="المساحة (MB)" 
                  />
                </div>
                <Button onClick={handleSaveLimits} disabled={!isAdmin} className="w-full">
                  حفظ حدود الدور
                </Button>
              </div>
            </div>
          </div>
        )}

        {selectedSection === 'verify' && (
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
        )}

        {selectedSection === 'broadcast' && (
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
                disabled={!isAdmin || !broadcastMessage.trim()}
                onClick={async () => {
                  try {
                    const { data, error } = await supabase.rpc('admin_broadcast_notification', { 
                      p_title: broadcastTitle || 'إشعار', 
                      p_message: broadcastMessage 
                    });
                    if (error) throw error;
                    setBroadcastTitle('');
                    setBroadcastMessage('');
                    alert('✅ تم إرسال الإشعار لجميع المستخدمين بنجاح!');
                  } catch (err) {
                    alert('❌ حدث خطأ أثناء إرسال الإشعار: ' + (err as Error).message);
                  }
                }}
                className="w-full"
              >
                📢 إرسال الإشعار للجميع
              </Button>
              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                <p className="text-xs text-yellow-800">
                  ⚠️ <strong>ملاحظة:</strong> الإدراج محكوم بحصص الدور عبر تريغر قاعدة البيانات. دوال الإدارة محمية وفق RLS و SECURITY DEFINER للأدمن فقط.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminUserControls;
