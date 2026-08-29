import { useEffect, useCallback } from 'react';
import { useAccountStore } from '@/store/useAccountStore';
import { accountService } from '@/services/accountService';
import { DEMO_ACCOUNTS } from '@/lib/adminDemoData';

export const useAccountData = (uid: string | undefined, isDemoMode: boolean, role: string | null | undefined) => {
  const { accounts, loading, error, setAccounts, setLoading, setError } = useAccountStore();

  const fetchAccounts = useCallback(async () => {
    if (isDemoMode || role === "admin") {
      setAccounts(DEMO_ACCOUNTS);
      setLoading(false);
      return;
    }
    
    if (!uid) {
      setAccounts([]);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      const fetchedAccounts = await accountService.fetchUserAccounts(uid);
      setAccounts(fetchedAccounts);
    } catch (err: any) {
      setError(err.message || "Failed to fetch accounts");
    } finally {
      setLoading(false);
    }
  }, [uid, isDemoMode, role, setAccounts, setLoading, setError]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  return { accounts, loading, error, refetch: fetchAccounts };
};
