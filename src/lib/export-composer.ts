import * as yaml from 'js-yaml';
import type { TituloData, CopyrightData, MetadataData } from '@/types/frontmatter';
import { extractChapterTitle as _extractChapterTitle } from '@/lib/project-fs';

export const SECTION_SEPARATOR = '\n\n---\n\n';

// D-145: re-export from project-fs — single source of truth, discoverable from export-composer.
export { _extractChapterTitle as extractChapterTitle };

// D-151: slug determinista basado en el input (filename sin extensión en la práctica).
export function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export interface IndiceItem {
  title: string;
  slug: string;
}

// D-150: retorna null si no hay items (no header huérfano).
export function buildIndiceSection(items: IndiceItem[]): string | null {
  if (items.length === 0) return null;
  const lines = items.map((item) => `- [${item.title}](#${item.slug})`);
  return `## Índice\n\n${lines.join('\n')}`;
}

// D-141, D-143: notas son metadato auxiliar, no cuentan como afirmación de copyright.
export function hasRealCopyright(copyright: CopyrightData | null): boolean {
  if (!copyright) return false;
  return (
    copyright.ano !== null ||
    copyright.titular !== '' ||
    (copyright.licencia !== '' && copyright.licencia !== 'Todos los derechos reservados')
  );
}

function buildCopyrightLine(copyright: CopyrightData): string | null {
  if (!hasRealCopyright(copyright)) return null;

  const parts: string[] = [];

  const hasOwner = copyright.ano !== null || copyright.titular !== '';
  if (hasOwner) {
    const creditParts = ['©'];
    if (copyright.ano !== null) creditParts.push(String(copyright.ano));
    if (copyright.titular) creditParts.push(copyright.titular);
    parts.push(creditParts.join(' '));
  }

  if (copyright.licencia) parts.push(copyright.licencia);

  const text = parts.join('. ');
  return text ? `_${text}._` : null;
}

export function buildPortadaSection(
  titulo: TituloData | null,
  copyright: CopyrightData | null
): string | null {
  if (!titulo || !titulo.titulo.trim()) return null;

  const parts: string[] = [`# ${titulo.titulo}`];

  if (titulo.subtitulo?.trim()) {
    parts.push(`## ${titulo.subtitulo.trim()}`);
  }

  if (titulo.autor?.trim()) {
    parts.push(`**${titulo.autor.trim()}**`);
  }

  if (copyright) {
    const copyrightLine = buildCopyrightLine(copyright);
    if (copyrightLine) parts.push(copyrightLine);

    if (copyright.notas?.trim()) {
      parts.push(`_${copyright.notas.trim()}_`);
    }
  }

  return parts.join('\n\n');
}

export function buildDedicatoriaSection(contenido: string | null | undefined): string | null {
  if (!contenido?.trim()) return null;
  return `## Dedicatoria\n\n${contenido.trim()}`;
}

export function buildAgradecimientosSection(contenido: string | null | undefined): string | null {
  if (!contenido?.trim()) return null;
  return `## Agradecimientos\n\n${contenido.trim()}`;
}

// D-157, D-158, D-159: bloque YAML pandoc-ready al inicio del export.
// Combina campos de titulo+copyright+metadata con nombres pandoc estándar.
// Retorna null si no hay contenido real (solo idioma default no califica).
export function buildPandocFrontmatterBlock(
  titulo: TituloData | null,
  copyright: CopyrightData | null,
  metadata: MetadataData | null
): string | null {
  const obj: Record<string, unknown> = {};

  if (titulo?.titulo?.trim()) obj.title = titulo.titulo.trim();
  if (titulo?.subtitulo?.trim()) obj.subtitle = titulo.subtitulo.trim();
  if (titulo?.autor?.trim()) obj.author = titulo.autor.trim();

  if (metadata?.fechaPublicacion?.trim()) {
    obj.date = metadata.fechaPublicacion.trim();
  } else if (copyright?.ano !== null && copyright?.ano !== undefined) {
    obj.date = String(copyright.ano);
  }

  const lang = metadata?.idioma?.trim() || 'en';
  obj.lang = lang;

  if (metadata?.editorial?.trim()) obj.publisher = metadata.editorial.trim();
  if (metadata?.isbn?.trim()) obj.identifier = metadata.isbn.trim();
  if (metadata?.descripcion?.trim()) obj.description = metadata.descripcion.trim();
  if (metadata?.genero?.trim()) obj.subject = metadata.genero.trim();

  if (hasRealCopyright(copyright)) {
    const parts: string[] = [];
    const hasOwner = copyright!.ano !== null || copyright!.titular !== '';
    if (hasOwner) {
      const ownerParts = ['©'];
      if (copyright!.ano !== null) ownerParts.push(String(copyright!.ano));
      if (copyright!.titular) ownerParts.push(copyright!.titular);
      parts.push(ownerParts.join(' '));
    }
    if (copyright!.licencia) parts.push(copyright!.licencia);
    const rights = parts.join('. ');
    if (rights) obj.rights = rights;
  }

  // D-159: idioma default solo no califica como contenido significativo
  const hasSignificantContent =
    'title' in obj ||
    'subtitle' in obj ||
    'author' in obj ||
    'date' in obj ||
    'publisher' in obj ||
    'identifier' in obj ||
    'description' in obj ||
    'subject' in obj ||
    'rights' in obj ||
    lang !== 'en';

  if (!hasSignificantContent) return null;

  const yamlContent = yaml.dump(obj, { lineWidth: -1 }).trimEnd();
  return `---\n${yamlContent}\n---`;
}
