import { invoke } from '@tauri-apps/api/core';

export interface PanelSizes {
  sidebar?: number;
  editor?: number;
  terminal?: number;
  versions?: number;
}

export interface GlobalSettings {
  lastProjectPath?: string;
  panels: PanelSizes;
  editorViewMode?: 'edit' | 'preview';
  version: number;
  autoCommit?: boolean;
  autosaveIntervalMs?: number;
  themeMode?: 'light' | 'dark' | 'auto';
  editorFontFamily?: 'serif' | 'sans' | 'mono' | 'inter';
  editorFontSize?: number;
  defaultProjectLanguage?: string;
}

export interface ProjectState {
  lastActiveChapterPath?: string;
  version: number;
}

export async function readGlobalSettings(): Promise<GlobalSettings> {
  return invoke<GlobalSettings>('read_global_settings');
}

export async function writeGlobalSettings(settings: GlobalSettings): Promise<void> {
  await invoke('write_global_settings', { settings });
}

export async function readProjectState(projectPath: string): Promise<ProjectState> {
  return invoke<ProjectState>('read_project_state', { projectPath });
}

export async function writeProjectState(
  projectPath: string,
  state: ProjectState
): Promise<void> {
  await invoke('write_project_state', { projectPath, state });
}

export async function pathExists(path: string): Promise<boolean> {
  return invoke<boolean>('path_exists', { path });
}
