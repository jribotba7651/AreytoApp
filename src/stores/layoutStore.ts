import { create } from 'zustand';
import type { Tab, PanelSizes, LayoutState, EditorViewMode, BookViewMode, DeviceFrame } from '@/types/layout';

interface LayoutActions {
  setActiveTab: (tab: Tab) => void;
  setSizes: (partial: Partial<PanelSizes>) => void;
  toggleVersionsPanel: () => void;
  setShowCloseChapterModal: (show: boolean) => void;
  setEditorViewMode: (mode: EditorViewMode) => void;
  toggleEditorViewMode: () => void;
  setShowExportDialog: (show: boolean) => void;
  setBookViewMode: (mode: BookViewMode) => void;
  setDeviceFrame: (frame: DeviceFrame) => void;
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
  showCloseChapterModal: false,
  editorViewMode: 'edit',
  showExportDialog: false,
  bookViewMode: 'write',
  deviceFrame: 'none',

  setActiveTab: (tab: Tab) => set({ activeTab: tab }),

  setSizes: (partial: Partial<PanelSizes>) =>
    set((state) => ({ sizes: { ...state.sizes, ...partial } })),

  toggleVersionsPanel: () =>
    set((state) => ({ isVersionsCollapsed: !state.isVersionsCollapsed })),

  setShowCloseChapterModal: (show: boolean) => set({ showCloseChapterModal: show }),

  setEditorViewMode: (mode: EditorViewMode) => set({ editorViewMode: mode }),

  toggleEditorViewMode: () =>
    set((state) => ({
      editorViewMode: state.editorViewMode === 'edit' ? 'preview' : 'edit',
    })),

  setShowExportDialog: (show: boolean) => set({ showExportDialog: show }),

  setBookViewMode: (mode: BookViewMode) => set({ bookViewMode: mode }),

  setDeviceFrame: (frame: DeviceFrame) => set({ deviceFrame: frame }),
}));
