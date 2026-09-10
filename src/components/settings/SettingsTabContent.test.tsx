import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('@/stores/settingsStore', () => ({
  useSettingsStore: vi.fn(),
  AUTOSAVE_DELAY_MS: 500,
}));

vi.mock('@tauri-apps/plugin-dialog', () => ({
  open: vi.fn().mockResolvedValue(null),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => ({
      'settings.title': 'Ajustes',
      'settings.moreComingSoon': 'Más ajustes próximamente.',
      'settings.uiLocale.sectionTitle': 'Interfaz',
      'settings.uiLocale.label': 'Idioma de la interfaz',
      'settings.uiLocale.description': 'Cambia el idioma de la interfaz de Areyto.',
      'settings.versioning.sectionTitle': 'Versionado',
      'settings.versioning.autoCommit.label': 'Commit automático en cada guardado',
      'settings.versioning.autoCommit.description': 'Cuando está activo, Areyto crea un commit de Git automáticamente.',
      'settings.editor.sectionTitle': 'Editor',
      'settings.editor.autosave.label': 'Intervalo de guardado automático',
      'settings.editor.autosave.description': 'Tiempo de espera tras el último cambio antes de guardar automáticamente.',
      'settings.editor.fontFamily.label': 'Fuente del editor',
      'settings.editor.fontFamily.description': 'Familia tipográfica del área de escritura.',
      'settings.editor.fontSize.label': 'Tamaño de fuente',
      'settings.editor.fontSize.description': 'Tamaño del texto en el área de escritura.',
      'settings.appearance.sectionTitle': 'Apariencia',
      'settings.appearance.theme.label': 'Tema de la interfaz',
      'settings.appearance.theme.description': 'Claro u oscuro fijos, o auto para seguir la configuración del sistema.',
      'settings.projects.sectionTitle': 'Proyectos',
      'settings.projects.defaultLanguage.label': 'Idioma por defecto',
      'settings.projects.defaultLanguage.description': 'Idioma que se asigna a nuevos proyectos en el campo idioma del archivo metadata.yaml.',
      'settings.book.sectionTitle': 'Libro',
      'settings.book.fontFamily.label': 'Fuente del lector',
      'settings.book.fontFamily.description': 'Familia tipográfica del tab Libro.',
      'settings.book.fontSize.label': 'Tamaño de fuente',
      'settings.book.fontSize.description': 'Tamaño del texto en el tab Libro.',
      'settings.export.sectionTitle': 'Export',
      'settings.export.folder.label': 'Carpeta de destino',
      'settings.export.folder.description': 'Carpeta donde se abre el Save As al exportar.',
      'settings.export.folder.default': 'Carpeta del proyecto (por defecto)',
      'settings.export.browse': 'Examinar…',
      'settings.export.reset': 'Restablecer',
      'theme.light': 'Claro',
      'theme.dark': 'Oscuro',
      'theme.auto': 'Auto (sistema)',
      'font.serif': 'Serif (Iowan / Georgia)',
      'font.inter': 'Inter',
      'font.sans': 'Sans-serif del sistema',
      'font.mono': 'Monoespaciada',
    } as Record<string, string>)[key] ?? key,
  }),
}));

import { useSettingsStore } from '@/stores/settingsStore';
import SettingsTabContent from './SettingsTabContent';

const mockUseSettingsStore = vi.mocked(useSettingsStore);

function makeState(overrides: Record<string, unknown> = {}) {
  return {
    autoCommit: true,
    autosaveIntervalMs: 2000,
    themeMode: 'light',
    editorFontFamily: 'serif',
    editorFontSize: 16,
    defaultProjectLanguage: 'en',
    bookFontFamily: 'serif',
    bookFontSize: 18,
    exportFolder: '',
    loaded: true,
    setAutoCommit: vi.fn(),
    setAutosaveIntervalMs: vi.fn().mockResolvedValue(undefined),
    setThemeMode: vi.fn().mockResolvedValue(undefined),
    setEditorFontFamily: vi.fn().mockResolvedValue(undefined),
    setEditorFontSize: vi.fn().mockResolvedValue(undefined),
    setDefaultProjectLanguage: vi.fn().mockResolvedValue(undefined),
    setBookFontFamily: vi.fn().mockResolvedValue(undefined),
    setBookFontSize: vi.fn().mockResolvedValue(undefined),
    setExportFolder: vi.fn().mockResolvedValue(undefined),
    uiLocale: 'en',
    setUiLocale: vi.fn().mockResolvedValue(undefined),
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
    const select = screen.getAllByRole('combobox')[0]! as HTMLSelectElement;
    expect(select).toBeDefined();
  });

  it('el dropdown lista exactamente los presets 2s/5s/15s/30s', () => {
    render(<SettingsTabContent />);
    const select = screen.getAllByRole('combobox')[0]! as HTMLSelectElement;
    const options = Array.from(select.options).map((o) => Number(o.value));
    expect(options).toEqual([2000, 5000, 15000, 30000]);
  });

  it('el dropdown no expone 500ms', () => {
    render(<SettingsTabContent />);
    const select = screen.getAllByRole('combobox')[0]! as HTMLSelectElement;
    const options = Array.from(select.options).map((o) => Number(o.value));
    expect(options).not.toContain(500);
  });

  it('valor legacy 500ms en el store muestra 2s seleccionado', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseSettingsStore.mockImplementation((selector: any) =>
      selector(makeState({ autosaveIntervalMs: 500 }))
    );
    render(<SettingsTabContent />);
    const select = screen.getAllByRole('combobox')[0]! as HTMLSelectElement;
    expect(select.value).toBe('2000');
  });

  it('el valor seleccionado refleja autosaveIntervalMs del store', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseSettingsStore.mockImplementation((selector: any) =>
      selector(makeState({ autosaveIntervalMs: 5000 }))
    );
    render(<SettingsTabContent />);
    const select = screen.getAllByRole('combobox')[0]! as HTMLSelectElement;
    expect(select.value).toBe('5000');
  });

  it('onChange invoca setAutosaveIntervalMs con el nuevo valor en ms', () => {
    const setAutosaveIntervalMs = vi.fn().mockResolvedValue(undefined);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseSettingsStore.mockImplementation((selector: any) =>
      selector(makeState({ setAutosaveIntervalMs }))
    );
    render(<SettingsTabContent />);
    const select = screen.getAllByRole('combobox')[0]!;
    fireEvent.change(select, { target: { value: '15000' } });
    expect(setAutosaveIntervalMs).toHaveBeenCalledWith(15000);
  });
});
