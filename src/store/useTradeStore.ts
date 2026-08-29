import { create } from 'zustand';
import { TradeDoc } from '@/lib/firebase/schema';

interface TradeState {
  trades: TradeDoc[];
  loading: boolean;
  error: string | null;
  setTrades: (trades: TradeDoc[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useTradeStore = create<TradeState>()((set) => ({
  trades: [],
  loading: false,
  error: null,
  setTrades: (trades: TradeDoc[]) => set({ trades }),
  setLoading: (loading: boolean) => set({ loading }),
  setError: (error: string | null) => set({ error }),
}));
