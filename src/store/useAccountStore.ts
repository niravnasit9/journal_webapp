import { create } from 'zustand';
import { AccountDoc } from '@/lib/firebase/schema';

interface AccountState {
  accounts: AccountDoc[];
  loading: boolean;
  error: string | null;
  setAccounts: (accounts: AccountDoc[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useAccountStore = create<AccountState>()((set) => ({
  accounts: [],
  loading: false,
  error: null,
  setAccounts: (accounts: AccountDoc[]) => set({ accounts }),
  setLoading: (loading: boolean) => set({ loading }),
  setError: (error: string | null) => set({ error }),
}));
