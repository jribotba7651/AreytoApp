import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  extractChapterTitle,
  generateNextChapterFilename,
  openProject,
  createProject,
  listChapters,
  readChapter,
  writeChapter,
  createChapter,
  markChapterFinished,
} from './project-fs';
import type { Chapter, Project } from '@/types/project';

// Mockeamos el módulo de invoke de Tauri
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

vi.mock('@/i18n/i18n', () => ({ default: { t: (key: string) => key } }));

import { invoke } from '@tauri-apps/api/core';
const mockInvoke = vi.mocked(invoke);

const PROJECT: Project = {
  rootPath: '/tmp/mi-libro',
  nombre: 'Mi Libro',
  creado: '2026-05-21T00:00:00.000Z',
  capituloActivo: null,
};

const PROYECTO_JSON = JSON.stringify({
  nombre: 'Mi Libro',
  creado: '2026-05-21T00:00:00.000Z',
  capituloActivo: null,
});

beforeEach(() => {
  vi.clearAllMocks();
});

// --- Helpers puros ---

describe('extractChapterTitle', () => {
  it('extrae el título del primer h1 del markdown', () => {
    const content = '# La ciudad que no duerme\n\nPrimer párrafo.';
    expect(extractChapterTitle(content, 'cap-01.md')).toBe('La ciudad que no duerme');
  });

  it('cae al filename sin extensión cuando no hay h1', () => {
    const content = 'Sin heading aquí.';
    expect(extractChapterTitle(content, 'cap-01.md')).toBe('cap-01');
  });

  it('ignora h2 y h3, solo extrae h1', () => {
    const content = '## Subtítulo\n\n### Otra cosa';
    expect(extractChapterTitle(content, 'cap-02.md')).toBe('cap-02');
  });
});

describe('generateNextChapterFilename', () => {
  it('genera cap-01 cuando no hay capítulos', () => {
    expect(generateNextChapterFilename([])).toBe('cap-01.md');
  });

  it('genera cap-02 después de cap-01', () => {
    const chapters: Chapter[] = [
      { filename: 'cap-01.md', path: '', title: '', status: 'in-progress' },
    ];
    expect(generateNextChapterFilename(chapters)).toBe('cap-02.md');
  });

  it('genera el siguiente número correcto con huecos en la secuencia', () => {
    const chapters: Chapter[] = [
      { filename: 'cap-01.md', path: '', title: '', status: 'in-progress' },
      { filename: 'cap-03.md', path: '', title: '', status: 'finished' },
    ];
    expect(generateNextChapterFilename(chapters)).toBe('cap-04.md');
  });
});

// --- Funciones con invoke mockeado ---

describe('openProject', () => {
  it('abre un proyecto válido con proyecto.json', async () => {
    mockInvoke
      .mockResolvedValueOnce(true)        // path_exists
      .mockResolvedValueOnce(PROYECTO_JSON); // read_text_file

    const result = await openProject('/tmp/mi-libro');

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.nombre).toBe('Mi Libro');
      expect(result.value.rootPath).toBe('/tmp/mi-libro');
    }
  });

  it('falla con NotAProject cuando no hay proyecto.json', async () => {
    mockInvoke.mockResolvedValueOnce(false); // path_exists

    const result = await openProject('/tmp/no-es-proyecto');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe('NotAProject');
    }
  });
});

describe('createProject', () => {
  it('crea un proyecto nuevo con la estructura de carpetas esperada', async () => {
    mockInvoke
      .mockResolvedValueOnce(false)   // path_exists (no existe todavía)
      .mockResolvedValue(undefined);  // ensure_dir x4 + write_text_file

    const result = await createProject('/tmp/nuevo-libro', 'Nuevo Libro');

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.nombre).toBe('Nuevo Libro');
    }

    // Verifica que se crearon las 4 subcarpetas
    const invokedPaths = mockInvoke.mock.calls
      .filter(([cmd]) => cmd === 'ensure_dir')
      .map(([, args]) => (args as { path: string }).path);

    expect(invokedPaths).toContain('/tmp/nuevo-libro/frontmatter');
    expect(invokedPaths).toContain('/tmp/nuevo-libro/capitulos');
    expect(invokedPaths).toContain('/tmp/nuevo-libro/capitulos-terminados');
    expect(invokedPaths).toContain('/tmp/nuevo-libro/backmatter');
  });
});

describe('listChapters', () => {
  it('lista capítulos de capitulos/ y capitulos-terminados/ con status correcto', async () => {
    mockInvoke
      .mockResolvedValueOnce([{ name: 'cap-01.md', is_file: true, is_dir: false }]) // list_dir capitulos
      .mockResolvedValueOnce('# Capítulo uno\n\nContenido.')                         // read_text_file cap-01
      .mockResolvedValueOnce([{ name: 'cap-02.md', is_file: true, is_dir: false }]) // list_dir capitulos-terminados
      .mockResolvedValueOnce('# Capítulo dos\n\nContenido.');                        // read_text_file cap-02

    const result = await listChapters(PROJECT);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toHaveLength(2);
      expect(result.value[0]?.status).toBe('in-progress');
      expect(result.value[1]?.status).toBe('finished');
      expect(result.value[0]?.title).toBe('Capítulo uno');
    }
  });
});

describe('readChapter', () => {
  it('lee el contenido de un capítulo', async () => {
    const content = '# Hola\n\nMundo.';
    mockInvoke.mockResolvedValueOnce(content);

    const result = await readChapter('/tmp/mi-libro/capitulos/cap-01.md');

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toBe(content);
  });
});

describe('writeChapter', () => {
  it('escribe el contenido de un capítulo', async () => {
    mockInvoke.mockResolvedValueOnce(undefined);

    const result = await writeChapter('/tmp/mi-libro/capitulos/cap-01.md', '# Hola');

    expect(result.ok).toBe(true);
    expect(mockInvoke).toHaveBeenCalledWith('write_text_file', {
      path: '/tmp/mi-libro/capitulos/cap-01.md',
      contents: '# Hola',
    });
  });
});

describe('createChapter', () => {
  it('genera archivo con contenido placeholder "# Capítulo N"', async () => {
    // list_dir capitulos (vacío), list_dir capitulos-terminados (vacío), write_text_file
    mockInvoke
      .mockResolvedValueOnce([])        // list_dir capitulos
      .mockResolvedValueOnce([])        // list_dir capitulos-terminados (for read content)
      .mockResolvedValueOnce(undefined); // write_text_file

    const result = await createChapter(PROJECT);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.filename).toBe('cap-01.md');
      expect(result.value.title).toBe('common.defaultChapterTitle');
    }

    const writeCall = mockInvoke.mock.calls.find(([cmd]) => cmd === 'write_text_file');
    expect(writeCall).toBeDefined();
    expect((writeCall?.[1] as { contents: string }).contents).toBe('# common.defaultChapterTitle\n\n');
  });

  it('usa "Capítulo N" como título por default derivado del filename', async () => {
    mockInvoke
      .mockResolvedValueOnce([{ name: 'cap-01.md', is_file: true, is_dir: false }]) // list_dir capitulos
      .mockResolvedValueOnce('# Hola')   // read_text_file para título del existente
      .mockResolvedValueOnce([])          // list_dir capitulos-terminados
      .mockResolvedValueOnce(undefined);  // write_text_file

    const result = await createChapter(PROJECT);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.filename).toBe('cap-02.md');
      expect(result.value.title).toBe('common.defaultChapterTitle');
    }
  });

  it('respeta título explícito cuando se pasa', async () => {
    mockInvoke
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce(undefined);

    const result = await createChapter(PROJECT, 'Mi título');

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.title).toBe('Mi título');

    const writeCall = mockInvoke.mock.calls.find(([cmd]) => cmd === 'write_text_file');
    expect((writeCall?.[1] as { contents: string }).contents).toBe('# Mi título\n\n');
  });
});

describe('markChapterFinished', () => {
  it('marca un capítulo como terminado moviéndolo de carpeta', async () => {
    mockInvoke
      .mockResolvedValueOnce(true)             // path_exists
      .mockResolvedValueOnce(undefined)         // rename_path
      .mockResolvedValueOnce('# El fin\n\n');  // read_text_file (para leer el título)

    const result = await markChapterFinished(PROJECT, 'cap-01.md');

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.status).toBe('finished');
      expect(result.value.filename).toBe('cap-01.md');
      expect(result.value.path).toBe('/tmp/mi-libro/capitulos-terminados/cap-01.md');
    }
  });
});
