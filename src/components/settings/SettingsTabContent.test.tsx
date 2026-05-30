import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('@/stores/settingsStore', () => ({
  useSettingsStore: vi.fn(),
  AUTOSAVE_DELAY_MS: 500,
}));

import { useSettingsStore } from '@/stores/settingsStore';
import SettingsTabContent from './SettingsTabContent';

const mockUseSettingsStore = vi.mocked(useSettingsStore);

function makeState(overrides: Record<string, unknown> = {}) {
  return {
    autoCommit: true,
    autosaveIntervalMs: 2000,
    loaded: true,
    setAutoCommit: vi.fn(),
    setAutosaveIntervalMs: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mockUseSettingsStore.mockImplementation((selector: any) => selector(makeState()));
});

describe('SettingsTabContent - sección Editor', () => {
  it('renderiza el dropdown de intervalo de autosave', () => {
    render(<SettingsTabContent />);
    expect(screen.getByText('Intervalo de guardado automático')).toBeDefined();
    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select).toBeDefined();
  });

  it('el dropdown lista exactamente los presets 2s/5s/15s/30s', () => {
    render(<SettingsTabContent />);
    const select = screen.getByRole('combobox') as HTMLSelectElement;
    const options = Array.from(select.options).map((o) => Number(o.value));
    expect(options).toEqual([2000, 5000, 15000, 30000]);
  });

  it('el dropdown no expone 500ms', () => {
    render(<SettingsTabContent />);
    const select = screen.getByRole('combobox') as HTMLSelectElement;
    const options = Array.from(select.options).map((o) => Number(o.value));
    expect(options).not.toContain(500);
  });

  it('valor legacy 500ms en el store muestra 2s seleccionado', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseSettingsStore.mockImplementation((selector: any) =>
      selector(makeState({ autosaveIntervalMs: 500 }))
    );
    render(<SettingsTabContent />);
    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select.value).toBe('2000');
  });

  it('el valor seleccionado refleja autosaveIntervalMs del store', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseSettingsStore.mockImplementation((selector: any) =>
      selector(makeState({ autosaveIntervalMs: 5000 }))
    );
    render(<SettingsTabContent />);
    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select.value).toBe('5000');
  });

  it('onChange invoca setAutosaveIntervalMs con el nuevo valor en ms', () => {
    const setAutosaveIntervalMs = vi.fn().mockResolvedValue(undefined);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseSettingsStore.mockImplementation((selector: any) =>
      selector(makeState({ setAutosaveIntervalMs }))
    );
    render(<SettingsTabContent />);
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: '15000' } });
    expect(setAutosaveIntervalMs).toHaveBeenCalledWith(15000);
  });
});
