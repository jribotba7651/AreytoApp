import { invoke } from '@tauri-apps/api/core';
import { readTitulo, readCopyright, readDedicatoria } from '@/lib/frontmatter-fs';
import { readAgradecimientos } from '@/lib/backmatter-fs';
import {
  buildPortadaSection,
  buildDedicatoriaSection,
  buildAgradecimientosSection,
  SECTION_SEPARATOR,
} from '@/lib/export-composer';

export type ExportScope = 'terminados' | 'en-progreso' | 'ambos';

export interface ExportOptions {
  scope: ExportScope;
}

export interface ExportAdditions {
  prependContent: string | null;
  appendContent: string | null;
}

export async function buildExportAdditions(projectPath: string): Promise<ExportAdditions> {
  const [titulo, copyright, dedicatoria, agradecimientos] = await Promise.all([
    readTitulo(projectPath),
    readCopyright(projectPath),
    readDedicatoria(projectPath),
    readAgradecimientos(projectPath),
  ]);

  const portada = buildPortadaSection(titulo, copyright);
  const dedicatoriaSection = buildDedicatoriaSection(dedicatoria?.contenido);
  const agradecimientosSection = buildAgradecimientosSection(agradecimientos?.contenido);

  const prependParts = [portada, dedicatoriaSection].filter((s): s is string => s !== null);
  const prependContent = prependParts.length > 0 ? prependParts.join(SECTION_SEPARATOR) : null;

  return { prependContent, appendContent: agradecimientosSection };
}

export async function exportBookMarkdown(
  projectPath: string,
  opts: ExportOptions,
  outputPath: string
): Promise<void> {
  const includeTerminados = opts.scope === 'terminados' || opts.scope === 'ambos';
  const includeEnProgreso = opts.scope === 'en-progreso' || opts.scope === 'ambos';
  const { prependContent, appendContent } = await buildExportAdditions(projectPath);

  await invoke('export_book_markdown', {
    projectPath,
    includeTerminados,
    includeEnProgreso,
    outputPath,
    prependContent,
    appendContent,
  });
}

interface RawDirEntry {
  name: string;
  is_file: boolean;
  is_dir: boolean;
}

async function countMdInDir(dirPath: string): Promise<number> {
  try {
    const entries = await invoke<RawDirEntry[]>('list_dir', { path: dirPath });
    return entries.filter((e) => e.is_file && e.name.endsWith('.md')).length;
  } catch {
    return 0;
  }
}

export async function countExportableFiles(
  projectPath: string,
  opts: ExportOptions
): Promise<number> {
  let count = 0;
  if (opts.scope === 'terminados' || opts.scope === 'ambos') {
    count += await countMdInDir(`${projectPath}/capitulos-terminados`);
  }
  if (opts.scope === 'en-progreso' || opts.scope === 'ambos') {
    count += await countMdInDir(`${projectPath}/capitulos`);
  }
  return count;
}
