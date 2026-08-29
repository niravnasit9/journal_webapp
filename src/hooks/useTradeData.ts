import { useEffect, useCallback } from 'react';
import { useTradeStore } from '@/store/useTradeStore';
import { tradeService } from '@/services/tradeService';

export const useTradeData = (accountIds: string[]) => {
  const { trades, loading, error, setTrades, setLoading, setError } = useTradeStore();

  const fetchTrades = useCallback(async () => {
    if (!accountIds || accountIds.length === 0) {
      setTrades([]);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      const fetchedTrades = await tradeService.fetchTradesForAccounts(accountIds);
      setTrades(fetchedTrades);
    } catch (err: any) {
      setError(err.message || "Failed to fetch trades");
    } finally {
      setLoading(false);
    }
  }, [accountIds, setTrades, setLoading, setError]);

  useEffect(() => {
    fetchTrades();
  }, [fetchTrades]);

  return { trades, loading, error, refetch: fetchTrades };
};
