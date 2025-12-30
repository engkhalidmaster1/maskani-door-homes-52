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
    // Table not implemented yet - using mock data
    const data = { verified: false, verified_at: null };
    const error = null;

    if (error) {
      setState({ verified: false, loading: false, error: 'Error fetching verification' });
      return;
    }
    setState({ verified: !!(data && (data as { verified?: boolean }).verified), verifiedAt: (data && (data as { verified_at?: string | null }).verified_at) ?? null, loading: false, error: null });
  }, [userId]);

  const setVerified = useCallback(async (verified: boolean) => {
    if (!userId) return { error: 'No userId' };
    if (!isAdmin) return { error: 'Not allowed' };

    // Function not implemented yet
    console.log('admin_verify_user not implemented', {
      p_user_id: userId,
      p_verified: verified
    });

    const error = null;
    if (error) {
      setState(s => ({ ...s, error: 'Error' }));
      return { error: { message: 'Error' } };
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
