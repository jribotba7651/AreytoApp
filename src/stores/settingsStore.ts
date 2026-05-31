import { create } from 'zustand';
import { readGlobalSettings, writeGlobalSettings } from '@/lib/settings';

export const AUTOSAVE_DELAY_MS = 500;
export const THEME_STORAGE_KEY = 'areyto-theme-mode';

export type ThemeMode = 'light' | 'dark' | 'auto';
export type EditorFontFamily = 'serif' | 'sans' | 'mono' | 'inter';

const EDITOR_FONT_STACKS: Record<EditorFontFamily, string> = {
  serif: '"Iowan Old Style", Charter, Georgia, serif',
  sans: 'system-ui, sans-serif',
  mono: '"JetBrains Mono", "Fira Code", monospace',
  inter: 'Inter, system-ui, sans-serif',
};

export function applyTheme(mode: ThemeMode): void {
  const dark =
    mode === 'dark' ||
    (mode === 'auto' && typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  try {
    localStorage.setItem(THEME_STORAGE_KEY, mode);
  } catch (_) {}
}

export function applyEditorFont(family: EditorFontFamily, size: number): void {
  document.documentElement.style.setProperty('--font-editor', EDITOR_FONT_STACKS[family]);
  document.documentElement.style.setProperty('--font-size-editor', `${size}px`);
}

interface SettingsState {
  autoCommit: boolean;
  autosaveIntervalMs: number;
  themeMode: ThemeMode;
  editorFontFamily: EditorFontFamily;
  editorFontSize: number;
  defaultProjectLanguage: string;
  loaded: boolean;
  load: () => Promise<void>;
  setAutoCommit: (value: boolean) => Promise<void>;
  setAutosaveIntervalMs: (ms: number) => Promise<void>;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  setEditorFontFamily: (family: EditorFontFamily) => Promise<void>;
  setEditorFontSize: (size: number) => Promise<void>;
  setDefaultProjectLanguage: (lang: string) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  autoCommit: true,
  autosaveIntervalMs: AUTOSAVE_DELAY_MS,
  themeMode: 'light',
  editorFontFamily: 'serif',
  editorFontSize: 16,
  defaultProjectLanguage: 'en',
  loaded: false,

  load: async () => {
    try {
      const settings = await readGlobalSettings();
      const themeMode = (settings.themeMode ?? 'light') as ThemeMode;
      const editorFontFamily = (settings.editorFontFamily ?? 'serif') as EditorFontFamily;
      const editorFontSize = settings.editorFontSize ?? 16;
      set({
        autoCommit: settings.autoCommit ?? true,
        autosaveIntervalMs: settings.autosaveIntervalMs ?? AUTOSAVE_DELAY_MS,
        themeMode,
        editorFontFamily,
        editorFontSize,
        defaultProjectLanguage: settings.defaultProjectLanguage ?? 'en',
        loaded: true,
      });
      applyTheme(themeMode);
      applyEditorFont(editorFontFamily, editorFontSize);
    } catch {
      set({ loaded: true });
    }
  },

  setAutoCommit: async (value: boolean) => {
    set({ autoCommit: value });
    try {
      const current = await readGlobalSettings();
      await writeGlobalSettings({ ...current, autoCommit: value });
    } catch (err) {
      console.warn('[areyto] Failed to persist autoCommit:', err);
    }
  },

  setAutosaveIntervalMs: async (ms: number) => {
    set({ autosaveIntervalMs: ms });
    try {
      const current = await readGlobalSettings();
      await writeGlobalSettings({ ...current, autosaveIntervalMs: ms });
    } catch (err) {
      console.warn('[areyto] Failed to persist autosaveIntervalMs:', err);
    }
  },

  setThemeMode: async (mode: ThemeMode) => {
    set({ themeMode: mode });
    applyTheme(mode);
    try {
      const current = await readGlobalSettings();
      await writeGlobalSettings({ ...current, themeMode: mode });
    } catch (err) {
      console.warn('[areyto] Failed to persist themeMode:', err);
    }
  },

  setEditorFontFamily: async (family: EditorFontFamily) => {
    set({ editorFontFamily: family });
    const size = useSettingsStore.getState().editorFontSize;
    applyEditorFont(family, size);
    try {
      const current = await readGlobalSettings();
      await writeGlobalSettings({ ...current, editorFontFamily: family });
    } catch (err) {
      console.warn('[areyto] Failed to persist editorFontFamily:', err);
    }
  },

  setEditorFontSize: async (size: number) => {
    set({ editorFontSize: size });
    const family = useSettingsStore.getState().editorFontFamily;
    applyEditorFont(family, size);
    try {
      const current = await readGlobalSettings();
      await writeGlobalSettings({ ...current, editorFontSize: size });
    } catch (err) {
      console.warn('[areyto] Failed to persist editorFontSize:', err);
    }
  },

  setDefaultProjectLanguage: async (lang: string) => {
    set({ defaultProjectLanguage: lang });
    try {
      const current = await readGlobalSettings();
      await writeGlobalSettings({ ...current, defaultProjectLanguage: lang });
    } catch (err) {
      console.warn('[areyto] Failed to persist defaultProjectLanguage:', err);
    }
  },
}));
