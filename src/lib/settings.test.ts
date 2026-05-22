import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

import { invoke } from '@tauri-apps/api/core';
import { readGlobalSettings, writeGlobalSettings, readProjectState } from './settings';

const mockInvoke = vi.mocked(invoke);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('readGlobalSettings', () => {
  it('retorna los settings del invoke', async () => {
    const settings = { lastProjectPath: '/tmp/libro', panels: { sidebar: 15 }, version: 1 };
    mockInvoke.mockResolvedValueOnce(settings);

    const result = await readGlobalSettings();

    expect(result).toEqual(settings);
    expect(mockInvoke).toHaveBeenCalledWith('read_global_settings');
  });

  it('retorna defaults si no hay archivo (simulado con objeto vacío)', async () => {
    const defaults = { panels: {}, version: 1 };
    mockInvoke.mockResolvedValueOnce(defaults);

    const result = await readGlobalSettings();

    expect(result.version).toBe(1);
    expect(result.lastProjectPath).toBeUndefined();
  });
});

describe('writeGlobalSettings', () => {
  it('llama invoke con los settings correctos', async () => {
    mockInvoke.mockResolvedValueOnce(undefined);
    const settings = { panels: { sidebar: 20 }, version: 1 };

    await writeGlobalSettings(settings);

    expect(mockInvoke).toHaveBeenCalledWith('write_global_settings', { settings });
  });
});

describe('readProjectState', () => {
  it('retorna el estado del invoke', async () => {
    const state = { lastActiveChapterPath: 'capitulos/cap-03.md', version: 1 };
    mockInvoke.mockResolvedValueOnce(state);

    const result = await readProjectState('/tmp/libro');

    expect(result.lastActiveChapterPath).toBe('capitulos/cap-03.md');
    expect(mockInvoke).toHaveBeenCalledWith('read_project_state', { projectPath: '/tmp/libro' });
  });

  it('retorna defaults si no hay estado previo', async () => {
    const defaults = { version: 1 };
    mockInvoke.mockResolvedValueOnce(defaults);

    const result = await readProjectState('/tmp/libro');

    expect(result.lastActiveChapterPath).toBeUndefined();
  });
});
