import { describe, it, expect } from 'vitest';
import {
  parseTitulo,
  parseCopyright,
  serializeTitulo,
  serializeCopyright,
  defaultTitulo,
  defaultCopyright,
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
    expect(d.licencia).toBe('Todos los derechos reservados');
    expect(d.ano).toBeNull();
  });
});
