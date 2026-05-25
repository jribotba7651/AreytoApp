import { describe, it, expect } from 'vitest';
import {
  buildPortadaSection,
  buildDedicatoriaSection,
  buildAgradecimientosSection,
  hasRealCopyright,
  SECTION_SEPARATOR,
  extractChapterTitle,
  slugify,
  buildIndiceSection,
  buildPandocFrontmatterBlock,
} from './export-composer';
import type { TituloData, CopyrightData, MetadataData } from '@/types/frontmatter';

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

describe('hasRealCopyright', () => {
  it('null → false', () => {
    expect(hasRealCopyright(null)).toBe(false);
  });

  it('todos los campos vacíos o default → false', () => {
    expect(hasRealCopyright({ ano: null, titular: '', licencia: '', notas: undefined })).toBe(false);
  });

  it('licencia default sin ano ni titular → false (copyright fantasma)', () => {
    expect(hasRealCopyright({ ano: null, titular: '', licencia: 'Todos los derechos reservados' })).toBe(false);
  });

  it('solo ano lleno → true', () => {
    expect(hasRealCopyright({ ano: 2024, titular: '', licencia: '' })).toBe(true);
  });

  it('solo titular lleno → true', () => {
    expect(hasRealCopyright({ ano: null, titular: 'Juan García', licencia: '' })).toBe(true);
  });

  it('licencia custom (no default) → true', () => {
    expect(hasRealCopyright({ ano: null, titular: '', licencia: 'Creative Commons BY-SA 4.0' })).toBe(true);
  });

  it('ano + titular + licencia default → true (ano y titular son suficientes)', () => {
    expect(hasRealCopyright({ ano: 2024, titular: 'Juan', licencia: 'Todos los derechos reservados' })).toBe(true);
  });

  it('solo notas presente, resto vacío/default → false (D-143: notas no cuentan como copyright real)', () => {
    expect(hasRealCopyright({ ano: null, titular: '', licencia: 'Todos los derechos reservados', notas: 'Primera edición' })).toBe(false);
  });
});

describe('SECTION_SEPARATOR', () => {
  it('es el separador F23 \\n\\n---\\n\\n', () => {
    expect(SECTION_SEPARATOR).toBe('\n\n---\n\n');
  });
});

describe('extractChapterTitle', () => {
  it('H1 presente → retorna el texto del H1', () => {
    expect(extractChapterTitle('# El comienzo\n\nTexto.', 'cap01.md')).toBe('El comienzo');
  });

  it('H1 con espacios extras → trimmed', () => {
    expect(extractChapterTitle('#   Capítulo con espacios   \n\nTexto.', 'cap01.md')).toBe('Capítulo con espacios');
  });

  it('sin H1 → fallback al filename sin extensión', () => {
    expect(extractChapterTitle('## Solo H2\n\nTexto.', 'cap-dos.md')).toBe('cap-dos');
  });

  it('contenido vacío → fallback al filename sin extensión', () => {
    expect(extractChapterTitle('', 'capitulo-tres.md')).toBe('capitulo-tres');
  });

  it('solo whitespace → fallback al filename sin extensión', () => {
    expect(extractChapterTitle('   \n\n   ', 'intro.md')).toBe('intro');
  });
});

describe('slugify', () => {
  it('título con tildes → letras sin diacríticos', () => {
    expect(slugify('Capítulo 1')).toBe('capitulo-1');
  });

  it('título con ñ y acentos múltiples → ASCII limpio', () => {
    expect(slugify('Mañana será otro día')).toBe('manana-sera-otro-dia');
  });

  it('espacios múltiples → guión simple', () => {
    expect(slugify('El   gran   capítulo')).toBe('el-gran-capitulo');
  });

  it('caracteres especiales (!@#$) → eliminados', () => {
    expect(slugify('¡Hola! ¿Mundo?')).toBe('hola-mundo');
  });

  it('string vacío → string vacío', () => {
    expect(slugify('')).toBe('');
  });

  it('slug ya limpio → sin cambios excepto lowercase', () => {
    expect(slugify('capitulo-uno')).toBe('capitulo-uno');
  });

  it('guiones múltiples → guión simple', () => {
    expect(slugify('cap--uno---dos')).toBe('cap-uno-dos');
  });
});

describe('buildIndiceSection', () => {
  it('lista vacía → null (no sección huérfana)', () => {
    expect(buildIndiceSection([])).toBeNull();
  });

  it('un item → sección con header y un enlace', () => {
    const result = buildIndiceSection([{ title: 'El comienzo', slug: 'el-comienzo' }]);
    expect(result).toBe('## Índice\n\n- [El comienzo](#el-comienzo)');
  });

  it('múltiples items → todos los enlaces en orden', () => {
    const items = [
      { title: 'Capítulo 1', slug: 'capitulo-1' },
      { title: 'Capítulo 2', slug: 'capitulo-2' },
      { title: 'Epílogo', slug: 'epilogo' },
    ];
    const result = buildIndiceSection(items);
    expect(result).toContain('## Índice');
    expect(result).toContain('- [Capítulo 1](#capitulo-1)');
    expect(result).toContain('- [Capítulo 2](#capitulo-2)');
    expect(result).toContain('- [Epílogo](#epilogo)');
    const i1 = result!.indexOf('capitulo-1');
    const i2 = result!.indexOf('capitulo-2');
    const i3 = result!.indexOf('epilogo');
    expect(i1).toBeLessThan(i2);
    expect(i2).toBeLessThan(i3);
  });

  it('título con caracteres especiales → preservado en el texto del enlace', () => {
    const result = buildIndiceSection([{ title: '¡Introducción!', slug: 'introduccion' }]);
    expect(result).toContain('[¡Introducción!](#introduccion)');
  });

  it('header siempre es ## Índice', () => {
    const result = buildIndiceSection([{ title: 'X', slug: 'x' }]);
    expect(result!.startsWith('## Índice\n\n')).toBe(true);
  });
});

const emptyMetadata: MetadataData = {
  idioma: 'en',
  descripcion: '',
  editorial: '',
  isbn: '',
  genero: '',
  fechaPublicacion: '',
};

const fullMetadata: MetadataData = {
  idioma: 'es',
  descripcion: 'Una sinopsis',
  editorial: 'Editorial X',
  isbn: '978-0-000-00000-0',
  genero: 'Novela',
  fechaPublicacion: '2025',
};

describe('buildPandocFrontmatterBlock', () => {
  it('todos null → null', () => {
    expect(buildPandocFrontmatterBlock(null, null, null)).toBeNull();
  });

  it('solo metadata con idioma default y resto vacío → null (D-159)', () => {
    expect(buildPandocFrontmatterBlock(null, null, emptyMetadata)).toBeNull();
  });

  it('titulo con título lleno → bloque mínimo con title + lang default', () => {
    const titulo: TituloData = { titulo: 'Mi novela', autor: '' };
    const result = buildPandocFrontmatterBlock(titulo, null, null);
    expect(result).not.toBeNull();
    expect(result).toMatch(/^---\n/);
    expect(result).toMatch(/\n---$/);
    expect(result).toContain('title:');
    expect(result).toContain('Mi novela');
    expect(result).toContain('lang: en');
  });

  it('todos los campos llenos → bloque completo con nombres pandoc estándar', () => {
    const result = buildPandocFrontmatterBlock(fullTitulo, fullCopyright, fullMetadata);
    expect(result).not.toBeNull();
    expect(result).toContain('title:');
    expect(result).toContain('subtitle:');
    expect(result).toContain('author:');
    expect(result).toContain('lang: es');
    expect(result).toContain('publisher:');
    expect(result).toContain('identifier:');
    expect(result).toContain('description:');
    expect(result).toContain('subject:');
    expect(result).toContain('rights:');
    expect(result).toContain('date:');
    // nombres en español NO deben aparecer en el bloque pandoc
    expect(result).not.toContain('titulo:');
    expect(result).not.toContain('editorial:');
    expect(result).not.toContain('isbn:');
    expect(result).not.toContain('genero:');
  });

  it('solo metadata sin titulo ni copyright → bloque con lang + campos de metadata', () => {
    const result = buildPandocFrontmatterBlock(null, null, fullMetadata);
    expect(result).not.toBeNull();
    expect(result).toContain('lang: es');
    expect(result).toContain('publisher:');
    expect(result).toContain('description:');
    expect(result).toContain('subject:');
    expect(result).not.toContain('title:');
    expect(result).not.toContain('rights:');
  });

  it('idioma no-default (es) sin otros campos → bloque con solo lang', () => {
    const result = buildPandocFrontmatterBlock(null, null, { ...emptyMetadata, idioma: 'es' });
    expect(result).not.toBeNull();
    expect(result).toContain('lang: es');
  });

  it('fechaPublicacion tiene prioridad sobre copyright.ano para date', () => {
    const titulo: TituloData = { titulo: 'El libro', autor: '' };
    const copyright: CopyrightData = { ano: 2020, titular: 'Autor', licencia: 'MIT' };
    const meta: MetadataData = { ...emptyMetadata, fechaPublicacion: '2025' };
    const result = buildPandocFrontmatterBlock(titulo, copyright, meta);
    expect(result).not.toBeNull();
    // date debe ser '2025' (fechaPublicacion), no '2020' (copyright.ano)
    expect(result).toMatch(/date: '?2025'?/);
    expect(result).not.toMatch(/^date: '?2020'?/m);
    // 2020 puede aparecer en rights (correcto)
    expect(result).toContain('rights:');
  });

  it('descripcion multilínea → YAML válido con descripcion presente', () => {
    const titulo: TituloData = { titulo: 'El libro', autor: '' };
    const meta: MetadataData = { ...emptyMetadata, descripcion: 'Primera línea\nSegunda línea' };
    const result = buildPandocFrontmatterBlock(titulo, null, meta);
    expect(result).not.toBeNull();
    expect(result).toContain('description:');
    // el bloque completo debe ser parseable como YAML pandoc (starts and ends with ---)
    expect(result).toMatch(/^---\n/);
    expect(result).toMatch(/\n---$/);
  });
});
