import { create } from 'zustand';
import { readGlobalSettings, writeGlobalSettings } from '@/lib/settings';
import type { RecentProject } from '@/lib/settings';
import i18n from '@/i18n/i18n';
import type { Theme } from '@/lib/theme';

export const AUTOSAVE_DELAY_MS = 500;
export const THEME_STORAGE_KEY = 'areyto-theme-mode';

export type ThemeMode = 'light' | 'dark' | 'auto';
export type EditorFontFamily = 'serif' | 'sans' | 'mono' | 'inter';
export type BookFontFamily = 'serif' | 'sans' | 'mono' | 'inter';

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

export function applyEditorFont(family: EditorFontFamily, size: number, customFont?: string): void {
  const stack = customFont
    ? `"${customFont}", ${EDITOR_FONT_STACKS[family]}`
    : EDITOR_FONT_STACKS[family];
  document.documentElement.style.setProperty('--font-editor', stack);
  document.documentElement.style.setProperty('--font-size-editor', `${size}px`);
}

export function applyBookFont(family: BookFontFamily, size: number, customFont?: string): void {
  const stack = customFont
    ? `"${customFont}", ${EDITOR_FONT_STACKS[family]}`
    : EDITOR_FONT_STACKS[family];
  document.documentElement.style.setProperty('--font-book', stack);
  document.documentElement.style.setProperty('--font-size-book', `${size}px`);
}

interface SettingsState {
  autoCommit: boolean;
  autosaveIntervalMs: number;
  themeMode: ThemeMode;
  editorFontFamily: EditorFontFamily;
  editorFontSize: number;
  defaultProjectLanguage: string;
  bookFontFamily: BookFontFamily;
  bookFontSize: number;
  exportFolder: string;
  uiLocale: string;
  customThemes: Theme[];
  chapterWordGoal: number;
  bookWordGoal: number;
  recentProjects: RecentProject[];
  onboardingCompleted: boolean;
  typewriterMode: boolean;
  sentenceHighlight: boolean;
  writingDays: string[];
  customEditorFont: string;
  customBookFont: string;
  loaded: boolean;
  load: () => Promise<void>;
  addRecentProject: (project: RecentProject) => Promise<void>;
  setAutoCommit: (value: boolean) => Promise<void>;
  setAutosaveIntervalMs: (ms: number) => Promise<void>;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  setEditorFontFamily: (family: EditorFontFamily) => Promise<void>;
  setEditorFontSize: (size: number) => Promise<void>;
  setDefaultProjectLanguage: (lang: string) => Promise<void>;
  setBookFontFamily: (family: BookFontFamily) => Promise<void>;
  setBookFontSize: (size: number) => Promise<void>;
  setExportFolder: (folder: string) => Promise<void>;
  setUiLocale: (locale: string) => Promise<void>;
  addCustomTheme: (theme: Theme) => Promise<void>;
  setChapterWordGoal: (goal: number) => Promise<void>;
  setBookWordGoal: (goal: number) => Promise<void>;
  setOnboardingCompleted: () => Promise<void>;
  setTypewriterMode: (value: boolean) => Promise<void>;
  setSentenceHighlight: (value: boolean) => Promise<void>;
  recordWritingDay: (wordCount: number) => Promise<void>;
  setCustomEditorFont: (font: string) => Promise<void>;
  setCustomBookFont: (font: string) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  autoCommit: true,
  autosaveIntervalMs: AUTOSAVE_DELAY_MS,
  themeMode: 'light',
  editorFontFamily: 'serif',
  editorFontSize: 16,
  defaultProjectLanguage: 'en',
  bookFontFamily: 'serif',
  bookFontSize: 18,
  exportFolder: '',
  uiLocale: 'en',
  customThemes: [],
  chapterWordGoal: 1500,
  bookWordGoal: 0,
  recentProjects: [],
  onboardingCompleted: false,
  typewriterMode: false,
  sentenceHighlight: false,
  writingDays: [],
  customEditorFont: '',
  customBookFont: '',
  loaded: false,

  load: async () => {
    try {
      const settings = await readGlobalSettings();
      const themeMode = (settings.themeMode ?? 'light') as ThemeMode;
      const editorFontFamily = (settings.editorFontFamily ?? 'serif') as EditorFontFamily;
      const editorFontSize = settings.editorFontSize ?? 16;
      const bookFontFamily = (settings.bookFontFamily ?? 'serif') as BookFontFamily;
      const bookFontSize = settings.bookFontSize ?? 18;
      const uiLocale = settings.uiLocale ?? 'en';
      set({
        autoCommit: settings.autoCommit ?? true,
        autosaveIntervalMs: settings.autosaveIntervalMs ?? AUTOSAVE_DELAY_MS,
        themeMode,
        editorFontFamily,
        editorFontSize,
        defaultProjectLanguage: settings.defaultProjectLanguage ?? 'en',
        bookFontFamily,
        bookFontSize,
        exportFolder: settings.exportFolder ?? '',
        uiLocale,
        customThemes: (settings.customThemes ?? []) as unknown as Theme[],
        chapterWordGoal: settings.chapterWordGoal ?? 1500,
        bookWordGoal: settings.bookWordGoal ?? 0,
        recentProjects: (settings.recentProjects ?? []) as RecentProject[],
        onboardingCompleted: settings.onboardingCompleted ?? false,
        typewriterMode: settings.typewriterMode ?? false,
        sentenceHighlight: settings.sentenceHighlight ?? false,
        writingDays: settings.writingDays ?? [],
        customEditorFont: settings.customEditorFont ?? '',
        customBookFont: settings.customBookFont ?? '',
        loaded: true,
      });
      const customEditorFont = settings.customEditorFont ?? '';
      const customBookFont = settings.customBookFont ?? '';
      applyTheme(themeMode);
      applyEditorFont(editorFontFamily, editorFontSize, customEditorFont || undefined);
      applyBookFont(bookFontFamily, bookFontSize, customBookFont || undefined);
      void i18n.changeLanguage(uiLocale);
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
    const { editorFontSize: size, customEditorFont } = useSettingsStore.getState();
    applyEditorFont(family, size, customEditorFont || undefined);
    try {
      const current = await readGlobalSettings();
      await writeGlobalSettings({ ...current, editorFontFamily: family });
    } catch (err) {
      console.warn('[areyto] Failed to persist editorFontFamily:', err);
    }
  },

  setEditorFontSize: async (size: number) => {
    set({ editorFontSize: size });
    const { editorFontFamily: family, customEditorFont } = useSettingsStore.getState();
    applyEditorFont(family, size, customEditorFont || undefined);
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

  setBookFontFamily: async (family: BookFontFamily) => {
    set({ bookFontFamily: family });
    const { bookFontSize: size, customBookFont } = useSettingsStore.getState();
    applyBookFont(family, size, customBookFont || undefined);
    try {
      const current = await readGlobalSettings();
      await writeGlobalSettings({ ...current, bookFontFamily: family });
    } catch (err) {
      console.warn('[areyto] Failed to persist bookFontFamily:', err);
    }
  },

  setBookFontSize: async (size: number) => {
    set({ bookFontSize: size });
    const { bookFontFamily: family, customBookFont } = useSettingsStore.getState();
    applyBookFont(family, size, customBookFont || undefined);
    try {
      const current = await readGlobalSettings();
      await writeGlobalSettings({ ...current, bookFontSize: size });
    } catch (err) {
      console.warn('[areyto] Failed to persist bookFontSize:', err);
    }
  },

  setExportFolder: async (folder: string) => {
    set({ exportFolder: folder });
    try {
      const current = await readGlobalSettings();
      await writeGlobalSettings({ ...current, exportFolder: folder });
    } catch (err) {
      console.warn('[areyto] Failed to persist exportFolder:', err);
    }
  },

  setUiLocale: async (locale: string) => {
    set({ uiLocale: locale });
    void i18n.changeLanguage(locale);
    try {
      const current = await readGlobalSettings();
      await writeGlobalSettings({ ...current, uiLocale: locale });
    } catch (err) {
      console.warn('[areyto] Failed to persist uiLocale:', err);
    }
  },

  addCustomTheme: async (theme: Theme) => {
    const updated = [...useSettingsStore.getState().customThemes, theme];
    set({ customThemes: updated });
    try {
      const current = await readGlobalSettings();
      await writeGlobalSettings({
        ...current,
        customThemes: updated as unknown as Array<Record<string, unknown>>,
      });
    } catch (err) {
      console.warn('[areyto] Failed to persist customThemes:', err);
    }
  },

  setChapterWordGoal: async (goal: number) => {
    set({ chapterWordGoal: goal });
    try {
      const current = await readGlobalSettings();
      await writeGlobalSettings({ ...current, chapterWordGoal: goal });
    } catch (err) {
      console.warn('[areyto] Failed to persist chapterWordGoal:', err);
    }
  },

  setBookWordGoal: async (goal: number) => {
    set({ bookWordGoal: goal });
    try {
      const current = await readGlobalSettings();
      await writeGlobalSettings({ ...current, bookWordGoal: goal });
    } catch (err) {
      console.warn('[areyto] Failed to persist bookWordGoal:', err);
    }
  },

  setOnboardingCompleted: async () => {
    set({ onboardingCompleted: true });
    try {
      const current = await readGlobalSettings();
      await writeGlobalSettings({ ...current, onboardingCompleted: true });
    } catch (err) {
      console.warn('[areyto] Failed to persist onboardingCompleted:', err);
    }
  },

  setTypewriterMode: async (value: boolean) => {
    set({ typewriterMode: value });
    try {
      const current = await readGlobalSettings();
      await writeGlobalSettings({ ...current, typewriterMode: value });
    } catch (err) {
      console.warn('[areyto] Failed to persist typewriterMode:', err);
    }
  },

  setSentenceHighlight: async (value: boolean) => {
    set({ sentenceHighlight: value });
    try {
      const current = await readGlobalSettings();
      await writeGlobalSettings({ ...current, sentenceHighlight: value });
    } catch (err) {
      console.warn('[areyto] Failed to persist sentenceHighlight:', err);
    }
  },

  setCustomEditorFont: async (font: string) => {
    set({ customEditorFont: font });
    const { editorFontFamily, editorFontSize } = useSettingsStore.getState();
    applyEditorFont(editorFontFamily, editorFontSize, font || undefined);
    try {
      const current = await readGlobalSettings();
      await writeGlobalSettings({ ...current, customEditorFont: font });
    } catch (err) {
      console.warn('[areyto] Failed to persist customEditorFont:', err);
    }
  },

  setCustomBookFont: async (font: string) => {
    set({ customBookFont: font });
    const { bookFontFamily, bookFontSize } = useSettingsStore.getState();
    applyBookFont(bookFontFamily, bookFontSize, font || undefined);
    try {
      const current = await readGlobalSettings();
      await writeGlobalSettings({ ...current, customBookFont: font });
    } catch (err) {
      console.warn('[areyto] Failed to persist customBookFont:', err);
    }
  },

  recordWritingDay: async (wordCount: number) => {
    if (wordCount < 100) return;
    const today = new Date().toISOString().slice(0, 10);
    const prev = useSettingsStore.getState().writingDays;
    if (prev.includes(today)) return;
    const updated = [...prev, today];
    set({ writingDays: updated });
    try {
      const current = await readGlobalSettings();
      await writeGlobalSettings({ ...current, writingDays: updated });
    } catch (err) {
      console.warn('[areyto] Failed to persist writingDays:', err);
    }
  },

  addRecentProject: async (project: RecentProject) => {
    const MAX_RECENT = 5;
    const prev = useSettingsStore.getState().recentProjects;
    const filtered = prev.filter((p) => p.path !== project.path);
    const updated = [project, ...filtered].slice(0, MAX_RECENT);
    set({ recentProjects: updated });
    try {
      const current = await readGlobalSettings();
      await writeGlobalSettings({ ...current, recentProjects: updated });
    } catch (err) {
      console.warn('[areyto] Failed to persist recentProjects:', err);
    }
  },
}));
