import { create } from 'zustand';
import { readGlobalSettings, writeGlobalSettings } from '@/lib/settings';

export const AUTOSAVE_DELAY_MS = 500;

interface SettingsState {
  autoCommit: boolean;
  autosaveIntervalMs: number;
  loaded: boolean;
  load: () => Promise<void>;
  setAutoCommit: (value: boolean) => Promise<void>;
  setAutosaveIntervalMs: (ms: number) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  autoCommit: true,
  autosaveIntervalMs: AUTOSAVE_DELAY_MS,
  loaded: false,

  load: async () => {
    try {
      const settings = await readGlobalSettings();
      set({
        autoCommit: settings.autoCommit ?? true,
        autosaveIntervalMs: settings.autosaveIntervalMs ?? AUTOSAVE_DELAY_MS,
        loaded: true,
      });
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
}));
