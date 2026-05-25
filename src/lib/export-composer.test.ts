import { describe, it, expect } from 'vitest';
import {
  buildPortadaSection,
  buildDedicatoriaSection,
  buildAgradecimientosSection,
  SECTION_SEPARATOR,
} from './export-composer';
import type { TituloData, CopyrightData } from '@/types/frontmatter';

const fullTitulo: TituloData = {
  titulo: 'Mi libro',
  subtitulo: 'Un subtítulo hermoso',
  autor: 'Juan García',
};

const fullCopyright: CopyrightData = {
  ano: 2024,
  titular: 'Juan García',
  licencia: 'Todos los derechos reservados',
  notas: 'Primera edición',
};

describe('buildPortadaSection', () => {
  it('todos los campos llenos → portada completa con todos los elementos', () => {
    const result = buildPortadaSection(fullTitulo, fullCopyright);
    expect(result).toContain('# Mi libro');
    expect(result).toContain('## Un subtítulo hermoso');
    expect(result).toContain('**Juan García**');
    expect(result).toContain('_© 2024 Juan García. Todos los derechos reservados._');
    expect(result).toContain('_Primera edición_');
    // orden: h1 antes que h2, h2 antes que autor, autor antes que copyright
    const h1 = result!.indexOf('# Mi libro');
    const h2 = result!.indexOf('## Un');
    const autor = result!.indexOf('**Juan');
    const copy = result!.indexOf('_©');
    const notas = result!.indexOf('_Primera');
    expect(h1).toBeLessThan(h2);
    expect(h2).toBeLessThan(autor);
    expect(autor).toBeLessThan(copy);
    expect(copy).toBeLessThan(notas);
  });

  it('solo titulo → portada con H1 únicamente', () => {
    const titulo: TituloData = { titulo: 'Solo título', autor: '' };
    const result = buildPortadaSection(titulo, null);
    expect(result).toBe('# Solo título');
  });

  it('titulo + autor sin subtitulo ni copyright real → H1 + bold autor sin línea copyright', () => {
    const titulo: TituloData = { titulo: 'Mi libro', autor: 'Autor X' };
    const defaultCopyright: CopyrightData = {
      ano: null,
      titular: '',
      licencia: 'Todos los derechos reservados',
    };
    const result = buildPortadaSection(titulo, defaultCopyright);
    expect(result).toContain('# Mi libro');
    expect(result).toContain('**Autor X**');
    expect(result).not.toContain('##');
    expect(result).not.toContain('_©');
    expect(result).not.toContain('Todos los derechos reservados');
  });

  it('titulo vacío → null (portada omitida completa)', () => {
    const titulo: TituloData = { titulo: '', autor: 'Autor' };
    expect(buildPortadaSection(titulo, fullCopyright)).toBeNull();
  });

  it('titulo solo whitespace → null', () => {
    const titulo: TituloData = { titulo: '   ', autor: '' };
    expect(buildPortadaSection(titulo, null)).toBeNull();
  });

  it('titulo null → null', () => {
    expect(buildPortadaSection(null, fullCopyright)).toBeNull();
  });

  it('copyright con solo licencia default sin ano ni titular → línea copyright omitida', () => {
    const titulo: TituloData = { titulo: 'Mi libro', autor: '' };
    const copyright: CopyrightData = {
      ano: null,
      titular: '',
      licencia: 'Todos los derechos reservados',
    };
    const result = buildPortadaSection(titulo, copyright);
    expect(result).not.toContain('_©');
    expect(result).not.toContain('Todos los derechos reservados');
  });

  it('copyright vacío completo → línea copyright omitida', () => {
    const titulo: TituloData = { titulo: 'Mi libro', autor: '' };
    const copyright: CopyrightData = { ano: null, titular: '', licencia: '' };
    const result = buildPortadaSection(titulo, copyright);
    expect(result).toBe('# Mi libro');
  });

  it('notas whitespace only → notas omitidas', () => {
    const titulo: TituloData = { titulo: 'Mi libro', autor: '' };
    const copyright: CopyrightData = { ...fullCopyright, notas: '   ' };
    const result = buildPortadaSection(titulo, copyright);
    expect(result).not.toContain('_   _');
    // la línea de copyright sí aparece (ano y titular están llenos)
    expect(result).toContain('_©');
  });

  it('titulo + subtitulo + sin copyright → portada sin copyright ni autor', () => {
    const titulo: TituloData = { titulo: 'Libro', subtitulo: 'Sub', autor: '' };
    const result = buildPortadaSection(titulo, null);
    expect(result).toBe('# Libro\n\n## Sub');
  });

  it('licencia no-default sin ano ni titular → línea copyright con solo licencia', () => {
    const titulo: TituloData = { titulo: 'Mi libro', autor: '' };
    const copyright: CopyrightData = {
      ano: null,
      titular: '',
      licencia: 'Creative Commons BY-SA 4.0',
    };
    const result = buildPortadaSection(titulo, copyright);
    expect(result).toContain('Creative Commons BY-SA 4.0');
  });
});

describe('buildDedicatoriaSection', () => {
  it('con contenido → sección con header ## Dedicatoria', () => {
    const result = buildDedicatoriaSection('Para ti, amor mío.');
    expect(result).toBe('## Dedicatoria\n\nPara ti, amor mío.');
  });

  it('null → null', () => {
    expect(buildDedicatoriaSection(null)).toBeNull();
  });

  it('undefined → null', () => {
    expect(buildDedicatoriaSection(undefined)).toBeNull();
  });

  it('string vacío → null', () => {
    expect(buildDedicatoriaSection('')).toBeNull();
  });

  it('solo whitespace → null', () => {
    expect(buildDedicatoriaSection('   \n  \t  ')).toBeNull();
  });

  it('contenido con espacios al inicio y al final → trimmed en el output', () => {
    const result = buildDedicatoriaSection('  Para ti.  ');
    expect(result).toBe('## Dedicatoria\n\nPara ti.');
  });
});

describe('buildAgradecimientosSection', () => {
  it('con contenido → sección con header ## Agradecimientos', () => {
    const result = buildAgradecimientosSection('Gracias a todos.');
    expect(result).toBe('## Agradecimientos\n\nGracias a todos.');
  });

  it('null → null', () => {
    expect(buildAgradecimientosSection(null)).toBeNull();
  });

  it('whitespace only → null', () => {
    expect(buildAgradecimientosSection('\n\n   \n')).toBeNull();
  });
});

describe('SECTION_SEPARATOR', () => {
  it('es el separador F23 \\n\\n---\\n\\n', () => {
    expect(SECTION_SEPARATOR).toBe('\n\n---\n\n');
  });
});
