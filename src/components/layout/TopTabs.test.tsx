import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('@/stores/layoutStore', () => ({ useLayoutStore: vi.fn() }));
vi.mock('@/stores/projectStore', () => ({ useProjectStore: vi.fn() }));
vi.mock('@tauri-apps/api/app', () => ({
  getVersion: vi.fn().mockResolvedValue('0.1.0'),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => ({
      'tabs.capitulo': 'Capítulo Activo',
      'tabs.libro': 'Libro',
      'tabs.terminados': 'Terminados',
      'tabs.ajustes': 'Ajustes',
      'topbar.saving': 'Guardando…',
      'topbar.saved': 'Guardado',
      'topbar.saveError': 'Error al guardar',
      'topbar.closeProject': 'Cerrar proyecto',
      'topbar.about': 'Acerca de',
    } as Record<string, string>)[key] ?? key,
  }),
}));

import { useLayoutStore } from '@/stores/layoutStore';
import { useProjectStore } from '@/stores/projectStore';
import TopTabs from './TopTabs';

const mockUseLayoutStore = vi.mocked(useLayoutStore);
const mockUseProjectStore = vi.mocked(useProjectStore);

function makeLayoutState(overrides: Record<string, unknown> = {}) {
  return {
    activeTab: 'capitulo',
    setActiveTab: vi.fn(),
    ...overrides,
  };
}

function makeProjectState(overrides: Record<string, unknown> = {}) {
  return {
    currentProject: null,
    closeProject: vi.fn(),
    saveStatus: 'idle',
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mockUseLayoutStore.mockImplementation((selector: any) => selector(makeLayoutState()));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mockUseProjectStore.mockImplementation((selector: any) => selector(makeProjectState()));
});

describe('TopTabs - botón Acerca de', () => {
  it('renderiza el botón con aria-label "Acerca de"', () => {
    render(<TopTabs />);
    expect(screen.getByRole('button', { name: 'Acerca de' })).toBeDefined();
  });

  it('abre el AboutDialog al hacer click en el botón', () => {
    render(<TopTabs />);
    fireEvent.click(screen.getByRole('button', { name: 'Acerca de' }));
    expect(screen.getByTestId('about-backdrop')).toBeDefined();
  });

  it('cierra el AboutDialog al hacer click en el botón X del modal', () => {
    render(<TopTabs />);
    fireEvent.click(screen.getByRole('button', { name: 'Acerca de' }));
    expect(screen.getByTestId('about-backdrop')).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar' }));
    expect(screen.queryByTestId('about-backdrop')).toBeNull();
  });

  it('el modal no está visible antes de hacer click en el botón', () => {
    render(<TopTabs />);
    expect(screen.queryByTestId('about-backdrop')).toBeNull();
  });
});

describe('TopTabs - tabs de navegación', () => {
  it('renderiza los 4 tabs', () => {
    render(<TopTabs />);
    expect(screen.getByText('Capítulo Activo')).toBeDefined();
    expect(screen.getByText('Libro')).toBeDefined();
    expect(screen.getByText('Terminados')).toBeDefined();
    expect(screen.getByText('Ajustes')).toBeDefined();
  });

  it('el tab activo llama a setActiveTab al hacer click', () => {
    const setActiveTab = vi.fn();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseLayoutStore.mockImplementation((selector: any) =>
      selector(makeLayoutState({ setActiveTab }))
    );
    render(<TopTabs />);
    fireEvent.click(screen.getByText('Libro'));
    expect(setActiveTab).toHaveBeenCalledWith('libro');
  });
});
