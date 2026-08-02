import { describe, it, expect } from 'vitest';
import { splitIntoChapters } from './split-import';

describe('splitIntoChapters', () => {
  it('divide por H1 cuando hay 3 encabezados H1', () => {
    const md = '# Cap 1\n\nTexto 1\n\n# Cap 2\n\nTexto 2\n\n# Cap 3\n\nTexto 3';
    const result = splitIntoChapters(md);
    expect(result).toHaveLength(3);
    expect(result[0]).toMatch(/^# Cap 1/);
    expect(result[1]).toMatch(/^# Cap 2/);
    expect(result[2]).toMatch(/^# Cap 3/);
  });

  it('detecta L=2 con H1 título + 3 H2 capítulos, promueve H2 a H1', () => {
    const md = '# Mi Libro\n\nIntroducción\n\n## Capítulo 1\n\nTexto 1\n\n## Capítulo 2\n\nTexto 2\n\n## Capítulo 3\n\nTexto 3';
    const result = splitIntoChapters(md);
    expect(result).toHaveLength(4);
    expect(result[0]).toMatch(/^# Mi Libro/);
    expect(result[1]).toMatch(/^# Capítulo 1/);
    expect(result[2]).toMatch(/^# Capítulo 2/);
    expect(result[3]).toMatch(/^# Capítulo 3/);
  });

  it('sin encabezados repetidos devuelve 1 capítulo idéntico', () => {
    const md = '# Título\n\nContenido sin más encabezados.';
    const result = splitIntoChapters(md);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe(md);
  });

  it('conserva contenido antes del primer capítulo como primer segmento', () => {
    const md = 'Prólogo suelto\n\n# Cap 1\n\nTexto\n\n# Cap 2\n\nTexto';
    const result = splitIntoChapters(md);
    expect(result).toHaveLength(3);
    expect(result[0]).toBe('Prólogo suelto');
    expect(result[1]).toMatch(/^# Cap 1/);
  });

  it('doc vacío o solo whitespace devuelve array vacío', () => {
    expect(splitIntoChapters('')).toEqual([]);
    expect(splitIntoChapters('   \n  ')).toEqual([]);
  });
});
