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

  it('H1 partes + H2 capítulos -> un archivo por capítulo con marcador de parte', () => {
    const md = [
      '# PARTE I',
      '',
      '## Cap 1',
      '',
      'Texto 1',
      '',
      '## Cap 2',
      '',
      'Texto 2',
      '',
      '# PARTE II',
      '',
      '## Cap 3',
      '',
      'Texto 3',
    ].join('\n');
    const result = splitIntoChapters(md);
    expect(result).toHaveLength(3);
    expect(result[0]).toMatch(/^\*\*PARTE I\*\*/);
    expect(result[0]).toMatch(/# Cap 1/);
    expect(result[1]).toMatch(/^# Cap 2/);
    expect(result[2]).toMatch(/^\*\*PARTE II\*\*/);
    expect(result[2]).toMatch(/# Cap 3/);
  });

  it('mixto: hojas H1 + partes H1 con capítulos H2', () => {
    const md = [
      '# NOTA DEL AUTOR',
      '',
      'Texto nota.',
      '',
      '# PRÓLOGO',
      '',
      'Texto prólogo.',
      '',
      '# PARTE I',
      '',
      '## Cap 1',
      '',
      'Texto 1',
      '',
      '## Cap 2',
      '',
      'Texto 2',
    ].join('\n');
    const result = splitIntoChapters(md);
    expect(result).toHaveLength(4);
    expect(result[0]).toMatch(/^# NOTA DEL AUTOR/);
    expect(result[1]).toMatch(/^# PRÓLOGO/);
    expect(result[2]).toMatch(/^\*\*PARTE I\*\*/);
    expect(result[2]).toMatch(/# Cap 1/);
    expect(result[3]).toMatch(/^# Cap 2/);
  });

  it('prosa-intro entre encabezado de PARTE y primer capítulo aparece en el primer capítulo', () => {
    const md = [
      '# PARTE I',
      '',
      'Introducción de la parte.',
      '',
      '## Cap 1',
      '',
      'Texto 1',
      '',
      '# PARTE II',
      '',
      '## Cap 2',
      '',
      'Texto 2',
    ].join('\n');
    const result = splitIntoChapters(md);
    expect(result).toHaveLength(2);
    expect(result[0]).toMatch(/^\*\*PARTE I\*\*/);
    expect(result[0]).toContain('Introducción de la parte.');
    expect(result[0]).toMatch(/# Cap 1/);
    // PARTE II sin prosa-intro
    expect(result[1]).toMatch(/^\*\*PARTE II\*\*/);
    expect(result[1]).toMatch(/# Cap 2/);
  });

  it('solo H2 repetidos sin partes -> resultado idéntico al de un nivel', () => {
    const md = '## Sec 1\n\nTexto 1\n\n## Sec 2\n\nTexto 2\n\n## Sec 3\n\nTexto 3';
    const result = splitIntoChapters(md);
    expect(result).toHaveLength(3);
    expect(result[0]).toMatch(/^# Sec 1/);
    expect(result[1]).toMatch(/^# Sec 2/);
    expect(result[2]).toMatch(/^# Sec 3/);
  });
});
