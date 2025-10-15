import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import VerifiedBadge from '@/components/VerifiedBadge';
import useVerification from '@/hooks/useVerification';
import { useAuth } from '@/hooks/useAuth';

const ROLE_OPTIONS = ['admin', 'agency', 'pro', 'user'] as const;

type Limits = { max_properties: number; max_images: number; max_featured: number; storage_mb: number };

export const UserRolesManagement = () => {
  const { user, userRole, isAdmin } = useAuth();
  const [userId, setUserId] = useState<string>('');
  const [roleName, setRoleName] = useState<string>('user');
  const [limits, setLimits] = useState<Limits>({ max_properties: 20, max_images: 200, max_featured: 0, storage_mb: 2000 });
  const { verified, setVerified, loading: verLoading } = useVerification(userId, isAdmin);

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
    // Function not implemented yet
    console.log('admin_set_role_limit not implemented', {
      p_role_name: roleName,
      p_max_properties: limits.max_properties,
      p_max_images: limits.max_images,
      p_max_featured: limits.max_featured,
      p_storage_mb: limits.storage_mb
    });
  };

  const handleSetRole = async () => {
    if (disabled || !userId) return;
    // Function not implemented yet
    console.log('admin_set_user_role not implemented', { p_user_id: userId, p_role: roleName });
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
    <div className={`space-y-6 ${disabled ? 'opacity-70 pointer-events-none' : ''}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold">إدارة المستخدمين والصلاحيات</h3>
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
          <Select value={roleName} onValueChange={setRoleName}>
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
            <Input 
              type="number" 
              value={limits.max_featured}
              onChange={(e) => setLimits(s => ({ ...s, max_featured: Number(e.target.value) }))}
              placeholder="المميزة" 
            />
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
  );
};