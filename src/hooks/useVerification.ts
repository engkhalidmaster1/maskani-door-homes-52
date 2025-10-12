import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface VerificationState {
  verified: boolean;
  verifiedAt?: string | null;
  loading: boolean;
  error?: string | null;
}

export const useVerification = (userId?: string, isAdmin?: boolean) => {
  const [state, setState] = useState<VerificationState>({ verified: false, loading: !!userId });

  const fetchStatus = useCallback(async () => {
    if (!userId) return;
    setState(s => ({ ...s, loading: true, error: null }));
    const { data, error } = await supabase
      .from('user_verifications')
      .select('verified, verified_at')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      setState({ verified: false, loading: false, error: error.message });
      return;
    }
  setState({ verified: !!(data && (data as { verified?: boolean }).verified), verifiedAt: (data && (data as { verified_at?: string | null }).verified_at) ?? null, loading: false, error: null });
  }, [userId]);

  const setVerified = useCallback(async (verified: boolean) => {
    if (!userId) return { error: 'No userId' };
    if (!isAdmin) return { error: 'Not allowed' };

    const { error } = await supabase.rpc('admin_verify_user', {
      p_user_id: userId,
      p_verified: verified
    });

    if (error) {
      setState(s => ({ ...s, error: error.message }));
      return { error };
    }
    await fetchStatus();
    return { error: null };
  }, [userId, isAdmin, fetchStatus]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  return {
    ...state,
    refresh: fetchStatus,
    setVerified
  };
};

export default useVerification;
