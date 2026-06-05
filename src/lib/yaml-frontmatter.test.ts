import { describe, it, expect, vi } from 'vitest';

vi.mock('@/i18n/i18n', () => ({ default: { t: (key: string) => key } }));
import {
  parseTitulo,
  parseCopyright,
  serializeTitulo,
  serializeCopyright,
  defaultTitulo,
  defaultCopyright,
  parseMetadata,
  serializeMetadata,
  defaultMetadata,
} from './yaml-frontmatter';

describe('parseTitulo', () => {
  it('extrae titulo y autor', () => {
    const raw = '---\ntitulo: Mi libro\nautor: Juan\n---\n';
    const result = parseTitulo(raw);
    expect(result.titulo).toBe('Mi libro');
    expect(result.autor).toBe('Juan');
    expect(result.subtitulo).toBeUndefined();
  });

  it('extrae subtitulo cuando está presente', () => {
    const raw = '---\ntitulo: Mi libro\nsubtitulo: Un subtítulo\nautor: Juan\n---\n';
    const result = parseTitulo(raw);
    expect(result.subtitulo).toBe('Un subtítulo');
  });

  it('retorna defaults si no hay frontmatter válido', () => {
    const result = parseTitulo('sin frontmatter');
    expect(result.titulo).toBe('');
    expect(result.autor).toBe('');
  });

  it('retorna defaults si el frontmatter está vacío', () => {
    const result = parseTitulo('---\n---\n');
    expect(result.titulo).toBe('');
    expect(result.autor).toBe('');
  });
});

describe('parseCopyright', () => {
  it('extrae todos los campos', () => {
    const raw = '---\nano: 2024\ntitular: Juan Autor\nlicencia: CC BY 4.0\nnotas: Nota\n---\n';
    const result = parseCopyright(raw);
    expect(result.ano).toBe(2024);
    expect(result.titular).toBe('Juan Autor');
    expect(result.licencia).toBe('CC BY 4.0');
    expect(result.notas).toBe('Nota');
  });

  it('ano null si no está definido', () => {
    const raw = '---\ntitular: Alguien\nlicencia: MIT\n---\n';
    const result = parseCopyright(raw);
    expect(result.ano).toBeNull();
  });

  it('retorna defaults si no hay frontmatter válido', () => {
    const result = parseCopyright('');
    expect(result.titular).toBe('');
    expect(result.licencia).toBe('');
    expect(result.ano).toBeNull();
  });
});

describe('serializeTitulo', () => {
  it('produce YAML con delimitadores', () => {
    const data = { titulo: 'El libro', autor: 'Autor' };
    const out = serializeTitulo(data);
    expect(out).toMatch(/^---\n/);
    expect(out).toMatch(/\n---\n$/);
    expect(out).toContain('titulo: El libro');
    expect(out).toContain('autor: Autor');
  });

  it('omite subtitulo si está vacío', () => {
    const data = { titulo: 'El libro', autor: 'Autor', subtitulo: '' };
    const out = serializeTitulo(data);
    expect(out).not.toContain('subtitulo');
  });

  it('incluye subtitulo si está presente', () => {
    const data = { titulo: 'El libro', subtitulo: 'Un sub', autor: 'Autor' };
    const out = serializeTitulo(data);
    expect(out).toContain('subtitulo: Un sub');
  });
});

describe('serializeCopyright', () => {
  it('produce YAML con delimitadores', () => {
    const data = { ano: 2024, titular: 'Yo', licencia: 'MIT' };
    const out = serializeCopyright(data);
    expect(out).toMatch(/^---\n/);
    expect(out).toContain('ano: 2024');
    expect(out).toContain('titular: Yo');
    expect(out).toContain('licencia: MIT');
  });

  it('ano null se serializa como null', () => {
    const data = { ano: null, titular: 'Yo', licencia: 'MIT' };
    const out = serializeCopyright(data);
    expect(out).toContain('ano: null');
  });

  it('omite notas si están vacías', () => {
    const data = { ano: 2024, titular: 'Yo', licencia: 'MIT', notas: '' };
    const out = serializeCopyright(data);
    expect(out).not.toContain('notas');
  });
});

describe('round-trip', () => {
  it('titulo: parse(serialize(data)) === data', () => {
    const data = { titulo: 'Hola', subtitulo: 'Mundo', autor: 'Autor' };
    const parsed = parseTitulo(serializeTitulo(data));
    expect(parsed).toEqual(data);
  });

  it('copyright: parse(serialize(data)) === data (sin notas)', () => {
    const data = { ano: 2025, titular: 'Yo', licencia: 'MIT' };
    const parsed = parseCopyright(serializeCopyright(data));
    expect(parsed.ano).toBe(data.ano);
    expect(parsed.titular).toBe(data.titular);
    expect(parsed.licencia).toBe(data.licencia);
    expect(parsed.notas).toBeUndefined();
  });
});

describe('defaults', () => {
  it('defaultTitulo tiene strings vacíos', () => {
    const d = defaultTitulo();
    expect(d.titulo).toBe('');
    expect(d.autor).toBe('');
  });

  it('defaultCopyright tiene licencia predefinida', () => {
    const d = defaultCopyright();
    expect(d.licencia).toBe('common.defaultCopyrightLicense');
    expect(d.ano).toBeNull();
  });
});

describe('parseMetadata', () => {
  it('extrae todos los campos cuando están presentes', () => {
    const raw = 'idioma: es\ndescripcion: Una historia\neditorial: Planeta\nisbn: 978-0-000-00000-0\ngenero: Novela\nfechaPublicacion: "2025"';
    const result = parseMetadata(raw);
    expect(result.idioma).toBe('es');
    expect(result.descripcion).toBe('Una historia');
    expect(result.editorial).toBe('Planeta');
    expect(result.isbn).toBe('978-0-000-00000-0');
    expect(result.genero).toBe('Novela');
    expect(result.fechaPublicacion).toBe('2025');
  });

  it('retorna idioma "en" por default si no hay campo idioma', () => {
    const result = parseMetadata('editorial: Planeta');
    expect(result.idioma).toBe('en');
  });

  it('retorna strings vacíos para campos ausentes', () => {
    const result = parseMetadata('idioma: es');
    expect(result.descripcion).toBe('');
    expect(result.editorial).toBe('');
    expect(result.isbn).toBe('');
    expect(result.genero).toBe('');
    expect(result.fechaPublicacion).toBe('');
  });

  it('retorna defaults si el YAML es inválido', () => {
    const result = parseMetadata('{{invalid: yaml: :');
    expect(result.idioma).toBe('en');
    expect(result.descripcion).toBe('');
  });

  it('retorna defaults si el raw está vacío', () => {
    const result = parseMetadata('');
    expect(result.idioma).toBe('en');
    expect(result.editorial).toBe('');
  });

  it('retorna defaults si el YAML no es un objeto', () => {
    const result = parseMetadata('- elemento1\n- elemento2');
    expect(result.idioma).toBe('en');
  });
});

describe('serializeMetadata', () => {
  it('YAML puro sin delimitadores ---', () => {
    const data = defaultMetadata();
    const out = serializeMetadata(data);
    expect(out).not.toMatch(/^---/);
    expect(out).not.toMatch(/---\n?$/);
    expect(out).toContain('idioma: en');
  });

  it('siempre incluye idioma aunque el resto esté vacío', () => {
    const out = serializeMetadata(defaultMetadata());
    expect(out).toContain('idioma:');
    expect(out).not.toContain('descripcion:');
    expect(out).not.toContain('editorial:');
  });

  it('omite campos vacíos pero incluye los rellenos', () => {
    const data = { ...defaultMetadata(), genero: 'Novela', isbn: '978-0-0' };
    const out = serializeMetadata(data);
    expect(out).toContain('genero: Novela');
    expect(out).toContain('isbn:');
    expect(out).not.toContain('editorial:');
  });

  it('descripcion multilínea se serializa correctamente', () => {
    const data = { ...defaultMetadata(), descripcion: 'Primera línea\nSegunda línea' };
    const out = serializeMetadata(data);
    expect(out).toContain('descripcion:');
    expect(out).toMatch(/Primera línea|Primera l/);
  });
});

describe('parseMetadata round-trip', () => {
  it('todos los campos llenos: parse(serialize(data)) === data', () => {
    const data = {
      idioma: 'es',
      descripcion: 'Una sinopsis',
      editorial: 'Editorial X',
      isbn: '978-0-000-00000-0',
      genero: 'Novela',
      fechaPublicacion: '2025',
    };
    const parsed = parseMetadata(serializeMetadata(data));
    expect(parsed).toEqual(data);
  });

  it('solo idioma no-default: round-trip preserva idioma', () => {
    const data = { ...defaultMetadata(), idioma: 'fr' };
    const parsed = parseMetadata(serializeMetadata(data));
    expect(parsed.idioma).toBe('fr');
    expect(parsed.editorial).toBe('');
  });
});
