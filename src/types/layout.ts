export type Tab = 'capitulo' | 'libro' | 'terminados' | 'ajustes' | 'stats';
export type EditorViewMode = 'edit' | 'preview';

export interface PanelSizes {
  sidebar: number;
  editor: number;
  terminal: number;
  versions: number;
}

export type BookViewMode = 'write' | 'format';
export type DeviceFrame = 'none' | 'kindle' | 'print' | 'tablet';
export type PreviewMode = 'print' | 'draft' | 'proof';

export interface SplitViewState {
  active: boolean;
  chapterPath: string | null;
}

export interface LayoutState {
  activeTab: Tab;
  sizes: PanelSizes;
  isVersionsCollapsed: boolean;
  showCloseChapterModal: boolean;
  editorViewMode: EditorViewMode;
  showExportDialog: boolean;
  showShortcutsModal: boolean;
  bookViewMode: BookViewMode;
  deviceFrame: DeviceFrame;
  previewMode: PreviewMode;
  focusMode: boolean;
  showCommandPalette: boolean;
  splitView: SplitViewState;
}
