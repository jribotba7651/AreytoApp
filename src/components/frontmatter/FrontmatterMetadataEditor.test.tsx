import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';

vi.mock('@/lib/frontmatter-fs', () => ({
  readMetadata: vi.fn(),
  writeMetadata: vi.fn(),
}));

vi.mock('@/stores/projectStore', () => ({
  useProjectStore: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => ({
      'frontmatter.metadata.sectionTitle': 'Detalles del libro',
      'frontmatter.metadata.idioma.label': 'Idioma',
      'frontmatter.metadata.descripcion.label': 'Descripción',
      'frontmatter.metadata.descripcion.placeholder': 'Sinopsis del libro',
      'frontmatter.metadata.editorial.label': 'Editorial',
      'frontmatter.metadata.editorial.placeholder': 'Nombre de la editorial',
      'frontmatter.metadata.genero.label': 'Género',
      'frontmatter.metadata.genero.placeholder': 'Novela, ensayo, poesía…',
      'frontmatter.metadata.fechaPublicacion.label': 'Fecha de publicación',
      'common.saving': 'Guardando…',
      'common.saved': 'Guardado',
    } as Record<string, string>)[key] ?? key,
  }),
}));

import { readMetadata, writeMetadata } from '@/lib/frontmatter-fs';
import { useProjectStore } from '@/stores/projectStore';
import FrontmatterMetadataEditor from './FrontmatterMetadataEditor';

const mockReadMetadata = vi.mocked(readMetadata);
const mockWriteMetadata = vi.mocked(writeMetadata);
const mockUseProjectStore = vi.mocked(useProjectStore);

beforeEach(() => {
  vi.clearAllMocks();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mockUseProjectStore.mockImplementation((selector: any) =>
    selector({ currentProject: { rootPath: '/proyecto', nombre: 'Test' } })
  );
  mockReadMetadata.mockResolvedValue({
    idioma: 'en',
    descripcion: '',
    editorial: '',
    isbn: '',
    genero: '',
    fechaPublicacion: '',
  });
  mockWriteMetadata.mockResolvedValue(undefined);
});

describe('FrontmatterMetadataEditor', () => {
  it('renderiza el formulario con los 6 campos', async () => {
    await act(async () => {
      render(<FrontmatterMetadataEditor />);
    });
    expect(screen.getByText('Detalles del libro')).toBeDefined();
    expect(screen.getByPlaceholderText('en')).toBeDefined();
    expect(screen.getByPlaceholderText('Sinopsis del libro')).toBeDefined();
    expect(screen.getByPlaceholderText('Nombre de la editorial')).toBeDefined();
    expect(screen.getByPlaceholderText('978-0-000-00000-0')).toBeDefined();
    expect(screen.getByPlaceholderText('Novela, ensayo, poesía…')).toBeDefined();
    expect(screen.getByPlaceholderText('2025')).toBeDefined();
  });

  it('carga los datos iniciales desde readMetadata al montar', async () => {
    mockReadMetadata.mockResolvedValue({
      idioma: 'es',
      descripcion: 'Una sinopsis',
      editorial: 'Planeta',
      isbn: '978-0-0',
      genero: 'Novela',
      fechaPublicacion: '2025',
    });

    await act(async () => {
      render(<FrontmatterMetadataEditor />);
    });

    expect(mockReadMetadata).toHaveBeenCalledWith('/proyecto');
    const idiomaInput = screen.getByPlaceholderText('en') as HTMLInputElement;
    expect(idiomaInput.value).toBe('es');
  });

  it('llama a writeMetadata con debounce cuando el usuario cambia un campo', async () => {
    vi.useFakeTimers();

    await act(async () => {
      render(<FrontmatterMetadataEditor />);
    });

    const editorialInput = screen.getByPlaceholderText('Nombre de la editorial') as HTMLInputElement;
    fireEvent.change(editorialInput, { target: { value: 'Editorial X' } });

    await act(async () => {
      vi.advanceTimersByTime(600);
    });

    expect(mockWriteMetadata).toHaveBeenCalledWith(
      '/proyecto',
      expect.objectContaining({ editorial: 'Editorial X' })
    );

    vi.useRealTimers();
  });
});
