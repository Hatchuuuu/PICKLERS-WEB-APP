import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

interface WalletState {
  balance: number;
  isTopUpModalOpen: boolean;
  setTopUpModalOpen: (open: boolean) => void;
  fetchBalance: (userId: string, isDemo?: boolean) => Promise<void>;
  isLoadingBalance: boolean;
}

export const useWalletStore = create<WalletState>((set) => ({
  balance: 0,
  isLoadingBalance: false,
  isTopUpModalOpen: false,
  setTopUpModalOpen: (open) => set({ isTopUpModalOpen: open }),
  fetchBalance: async (userId: string, isDemo?: boolean) => {
    if (isDemo) {
      set({ balance: 2500, isLoadingBalance: false });
      return;
    }
    if (!userId) {
      set({ balance: 0, isLoadingBalance: false });
      return;
    }
    
    set({ isLoadingBalance: true });
    try {
      const { data, error } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (error) {
        // Suppress empty object error logs on component mount
        set({ balance: 0, isLoadingBalance: false });
      } else if (data) {
        set({ balance: data.balance, isLoadingBalance: false });
      } else {
        // Wallet doesn't exist yet, default to 0
        set({ balance: 0, isLoadingBalance: false });
      }
    } catch (e) {
      set({ balance: 0, isLoadingBalance: false });
    }
  }
}));
