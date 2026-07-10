import { create } from 'zustand';

interface AppUIState {
  activeOwnerTab: 'courts' | 'requests';
  setActiveOwnerTab: (tab: 'courts' | 'requests') => void;
  showMetrics: boolean;
  setShowMetrics: (show: boolean) => void;
}

export const useAppUIStore = create<AppUIState>((set) => ({
  activeOwnerTab: 'courts',
  setActiveOwnerTab: (tab) => set({ activeOwnerTab: tab }),
  showMetrics: false,
  setShowMetrics: (show) => set({ showMetrics: show })
}));
