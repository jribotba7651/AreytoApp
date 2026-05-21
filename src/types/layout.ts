export type Tab = 'capitulo' | 'libro' | 'terminados';

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
}
