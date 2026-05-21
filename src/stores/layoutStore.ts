import { create } from 'zustand';
import type { Tab, PanelSizes, LayoutState } from '@/types/layout';

interface LayoutActions {
  setActiveTab: (tab: Tab) => void;
  setSizes: (partial: Partial<PanelSizes>) => void;
  toggleVersionsPanel: () => void;
}

type LayoutStore = LayoutState & LayoutActions;

const DEFAULT_SIZES: PanelSizes = {
  sidebar: 15,
  editor: 65,
  terminal: 35,
  versions: 22,
};

export const useLayoutStore = create<LayoutStore>((set) => ({
  activeTab: 'capitulo',
  sizes: DEFAULT_SIZES,
  isVersionsCollapsed: false,

  setActiveTab: (tab: Tab) => set({ activeTab: tab }),

  setSizes: (partial: Partial<PanelSizes>) =>
    set((state) => ({ sizes: { ...state.sizes, ...partial } })),

  toggleVersionsPanel: () =>
    set((state) => ({ isVersionsCollapsed: !state.isVersionsCollapsed })),
}));
