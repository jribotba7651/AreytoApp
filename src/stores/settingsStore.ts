import { create } from 'zustand';
import { readGlobalSettings, writeGlobalSettings } from '@/lib/settings';

interface SettingsState {
  autoCommit: boolean;
  loaded: boolean;
  load: () => Promise<void>;
  setAutoCommit: (value: boolean) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  autoCommit: true,
  loaded: false,

  load: async () => {
    try {
      const settings = await readGlobalSettings();
      set({ autoCommit: settings.autoCommit ?? true, loaded: true });
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
}));
