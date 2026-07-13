import { create } from 'zustand';

interface WalletState {
  balance: number;
  addBalance: (amount: number) => void;
  isTopUpModalOpen: boolean;
  setTopUpModalOpen: (open: boolean) => void;
}

export const useWalletStore = create<WalletState>((set) => ({
  balance: 1200,
  addBalance: (amount) => set((state) => ({ balance: state.balance + amount })),
  isTopUpModalOpen: false,
  setTopUpModalOpen: (open) => set({ isTopUpModalOpen: open })
}));
