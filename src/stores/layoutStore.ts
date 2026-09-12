import { create } from 'zustand';
import type { Tab, PanelSizes, LayoutState, EditorViewMode, BookViewMode, DeviceFrame, PreviewMode } from '@/types/layout';

interface LayoutActions {
  setActiveTab: (tab: Tab) => void;
  setSizes: (partial: Partial<PanelSizes>) => void;
  toggleVersionsPanel: () => void;
  setShowCloseChapterModal: (show: boolean) => void;
  setEditorViewMode: (mode: EditorViewMode) => void;
  toggleEditorViewMode: () => void;
  setShowExportDialog: (show: boolean) => void;
  setShowShortcutsModal: (show: boolean) => void;
  setBookViewMode: (mode: BookViewMode) => void;
  setDeviceFrame: (frame: DeviceFrame) => void;
  setPreviewMode: (mode: PreviewMode) => void;
  toggleFocusMode: () => void;
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
  showShortcutsModal: false,
  bookViewMode: 'write',
  deviceFrame: 'none',
  previewMode: 'print' as PreviewMode,
  focusMode: false,

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

  setShowShortcutsModal: (show: boolean) => set({ showShortcutsModal: show }),

  setBookViewMode: (mode: BookViewMode) => set({ bookViewMode: mode }),

  setDeviceFrame: (frame: DeviceFrame) => set({ deviceFrame: frame }),

  setPreviewMode: (mode: PreviewMode) => set({ previewMode: mode }),

  toggleFocusMode: () =>
    set((state) => {
      if (state.focusMode) return { focusMode: false };
      return { focusMode: true, activeTab: 'capitulo' as Tab };
    }),
}));
