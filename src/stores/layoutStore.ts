import { create } from 'zustand';
import type { Tab, PanelSizes, LayoutState, EditorViewMode, BookViewMode, DeviceFrame, PreviewMode, SplitViewState } from '@/types/layout';

interface LayoutActions {
  setActiveTab: (tab: Tab) => void;
  setSizes: (partial: Partial<PanelSizes>) => void;
  toggleVersionsPanel: () => void;
  setShowCloseChapterModal: (show: boolean) => void;
  setEditorViewMode: (mode: EditorViewMode) => void;
  toggleEditorViewMode: () => void;
  setShowExportDialog: (show: boolean) => void;
  setShowExportAllDialog: (show: boolean) => void;
  setShowShortcutsModal: (show: boolean) => void;
  setBookViewMode: (mode: BookViewMode) => void;
  setDeviceFrame: (frame: DeviceFrame) => void;
  setPreviewMode: (mode: PreviewMode) => void;
  toggleFocusMode: () => void;
  setShowCommandPalette: (show: boolean) => void;
  setShowGlobalSearch: (show: boolean) => void;
  setSplitView: (splitView: Partial<SplitViewState>) => void;
  toggleSplitView: () => void;
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
  showExportAllDialog: false,
  showShortcutsModal: false,
  bookViewMode: 'write',
  deviceFrame: 'none',
  previewMode: 'print' as PreviewMode,
  focusMode: false,
  showCommandPalette: false,
  showGlobalSearch: false,
  splitView: { active: false, chapterPath: null },

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

  setShowExportAllDialog: (show: boolean) => set({ showExportAllDialog: show }),

  setShowShortcutsModal: (show: boolean) => set({ showShortcutsModal: show }),

  setBookViewMode: (mode: BookViewMode) => set({ bookViewMode: mode }),

  setDeviceFrame: (frame: DeviceFrame) => set({ deviceFrame: frame }),

  setPreviewMode: (mode: PreviewMode) => set({ previewMode: mode }),

  toggleFocusMode: () =>
    set((state) => {
      if (state.focusMode) return { focusMode: false };
      return { focusMode: true, activeTab: 'capitulo' as Tab };
    }),

  setShowCommandPalette: (show: boolean) => set({ showCommandPalette: show }),

  setShowGlobalSearch: (show: boolean) => set({ showGlobalSearch: show }),

  setSplitView: (partial: Partial<SplitViewState>) =>
    set((state) => ({ splitView: { ...state.splitView, ...partial } })),

  toggleSplitView: () =>
    set((state) => ({
      splitView: state.splitView.active
        ? { active: false, chapterPath: null }
        : { active: true, chapterPath: null },
    })),
}));
