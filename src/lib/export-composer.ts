import type { TituloData, CopyrightData } from '@/types/frontmatter';

export const SECTION_SEPARATOR = '\n\n---\n\n';

function hasCopyrightContent(copyright: CopyrightData): boolean {
  return (
    copyright.ano !== null ||
    copyright.titular !== '' ||
    (copyright.licencia !== '' && copyright.licencia !== 'Todos los derechos reservados')
  );
}

function buildCopyrightLine(copyright: CopyrightData): string | null {
  if (!hasCopyrightContent(copyright)) return null;

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
