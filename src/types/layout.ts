export type Tab = 'capitulo' | 'libro' | 'terminados' | 'ajustes';
export type EditorViewMode = 'edit' | 'preview';

export interface PanelSizes {
  sidebar: number;
  editor: number;
  terminal: number;
  versions: number;
}

export interface LayoutState {
  activeTab: Tab;
  sizes: PanelSizes;
  isVersionsCollapsed: boolean;
  showCloseChapterModal: boolean;
  editorViewMode: EditorViewMode;
}
