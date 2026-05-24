import * as yaml from 'js-yaml';
import type { TituloData, CopyrightData, FrontmatterKind } from '@/types/frontmatter';

const FRONTMATTER_RE = /^---\n([\s\S]*?)\n---\n?/;

function extractBody(raw: string): Record<string, unknown> {
  const match = FRONTMATTER_RE.exec(raw);
  if (!match || match[1] === undefined) return {};
  try {
    const parsed = yaml.load(match[1]);
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

export function parseTitulo(raw: string): TituloData {
  const body = extractBody(raw);
  return {
    titulo: typeof body.titulo === 'string' ? body.titulo : '',
    subtitulo: typeof body.subtitulo === 'string' ? body.subtitulo : undefined,
    autor: typeof body.autor === 'string' ? body.autor : '',
  };
}

export function parseCopyright(raw: string): CopyrightData {
  const body = extractBody(raw);
  const ano = body.ano;
  return {
    ano: typeof ano === 'number' ? ano : null,
    titular: typeof body.titular === 'string' ? body.titular : '',
    licencia: typeof body.licencia === 'string' ? body.licencia : '',
    notas: typeof body.notas === 'string' ? body.notas : undefined,
  };
}

export function serializeTitulo(data: TituloData): string {
  const obj: Record<string, unknown> = { titulo: data.titulo, autor: data.autor };
  if (data.subtitulo !== undefined && data.subtitulo !== '') {
    obj.subtitulo = data.subtitulo;
  }
  return `---\n${yaml.dump(obj, { lineWidth: -1 }).trimEnd()}\n---\n`;
}

export function serializeCopyright(data: CopyrightData): string {
  const obj: Record<string, unknown> = {
    ano: data.ano,
    titular: data.titular,
    licencia: data.licencia,
  };
  if (data.notas !== undefined && data.notas !== '') {
    obj.notas = data.notas;
  }
  return `---\n${yaml.dump(obj, { lineWidth: -1 }).trimEnd()}\n---\n`;
}

export function defaultTitulo(): TituloData {
  return { titulo: '', autor: '' };
}

export function defaultCopyright(): CopyrightData {
  return { ano: null, titular: '', licencia: 'Todos los derechos reservados' };
}

export function defaultContent(kind: FrontmatterKind): string {
  if (kind === 'titulo') return serializeTitulo(defaultTitulo());
  return serializeCopyright(defaultCopyright());
}
