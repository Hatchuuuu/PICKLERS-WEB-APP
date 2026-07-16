import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

interface WalletState {
  balance: number;
  isTopUpModalOpen: boolean;
  setTopUpModalOpen: (open: boolean) => void;
  fetchBalance: (userId: string) => Promise<void>;
  isLoadingBalance: boolean;
}

export const useWalletStore = create<WalletState>((set) => ({
  balance: 0,
  isLoadingBalance: false,
  isTopUpModalOpen: false,
  setTopUpModalOpen: (open) => set({ isTopUpModalOpen: open }),
  fetchBalance: async (userId: string) => {
    set({ isLoadingBalance: true });
    try {
      const { data, error } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', userId)
        .single();
      
      if (!error && data) {
        set({ balance: data.balance, isLoadingBalance: false });
      } else {
        console.error("Failed to fetch wallet balance:", error);
        set({ isLoadingBalance: false });
      }
    } catch (e) {
      console.error(e);
      set({ isLoadingBalance: false });
    }
  }
}));
