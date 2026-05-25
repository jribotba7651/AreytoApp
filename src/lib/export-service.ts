import { invoke } from '@tauri-apps/api/core';
import { readTitulo, readCopyright, readDedicatoria, readMetadata } from '@/lib/frontmatter-fs';
import { readAgradecimientos } from '@/lib/backmatter-fs';
import {
  buildPortadaSection,
  buildDedicatoriaSection,
  buildAgradecimientosSection,
  buildIndiceSection,
  buildPandocFrontmatterBlock,
  extractChapterTitle,
  slugify,
  SECTION_SEPARATOR,
} from '@/lib/export-composer';
import type { IndiceItem } from '@/lib/export-composer';

export type ExportScope = 'terminados' | 'en-progreso' | 'ambos';

export interface ExportOptions {
  scope: ExportScope;
}

export interface ExportAdditions {
  pandocFrontmatterBlock: string | null;
  prependContent: string | null;
  appendContent: string | null;
  indiceContent: string | null;
  chapterSlugs: Record<string, string>;
}

interface RawDirEntry {
  name: string;
  is_file: boolean;
  is_dir: boolean;
}

async function listSortedMdFilenames(dirPath: string): Promise<string[]> {
  try {
    const entries = await invoke<RawDirEntry[]>('list_dir', { path: dirPath });
    return entries
      .filter((e) => e.is_file && e.name.endsWith('.md'))
      .map((e) => e.name)
      .sort();
  } catch {
    return [];
  }
}

async function readFileContent(filePath: string): Promise<string | null> {
  try {
    return await invoke<string>('read_text_file', { path: filePath });
  } catch {
    return null;
  }
}

export async function buildExportAdditions(
  projectPath: string,
  opts: ExportOptions
): Promise<ExportAdditions> {
  const [titulo, copyright, dedicatoria, agradecimientos, metadata] = await Promise.all([
    readTitulo(projectPath),
    readCopyright(projectPath),
    readDedicatoria(projectPath),
    readAgradecimientos(projectPath),
    readMetadata(projectPath),
  ]);

  const chapterDirs: string[] = [];
  if (opts.scope === 'terminados' || opts.scope === 'ambos') {
    chapterDirs.push(`${projectPath}/capitulos-terminados`);
  }
  if (opts.scope === 'en-progreso' || opts.scope === 'ambos') {
    chapterDirs.push(`${projectPath}/capitulos`);
  }

  const indiceItems: IndiceItem[] = [];
  const chapterSlugs: Record<string, string> = {};

  for (const dir of chapterDirs) {
    const filenames = await listSortedMdFilenames(dir);
    for (const filename of filenames) {
      const content = await readFileContent(`${dir}/${filename}`);
      const title = extractChapterTitle(content ?? '', filename);
      const slug = slugify(filename.replace(/\.md$/, ''));
      indiceItems.push({ title, slug });
      chapterSlugs[filename] = slug;
    }
  }

  const portada = buildPortadaSection(titulo, copyright);
  const dedicatoriaSection = buildDedicatoriaSection(dedicatoria?.contenido);
  const agradecimientosSection = buildAgradecimientosSection(agradecimientos?.contenido);
  const indiceContent = buildIndiceSection(indiceItems);
  const pandocFrontmatterBlock = buildPandocFrontmatterBlock(titulo, copyright, metadata);

  const prependParts = [portada, dedicatoriaSection].filter((s): s is string => s !== null);
  const prependContent = prependParts.length > 0 ? prependParts.join(SECTION_SEPARATOR) : null;

  return { pandocFrontmatterBlock, prependContent, appendContent: agradecimientosSection, indiceContent, chapterSlugs };
}

export async function exportBookMarkdown(
  projectPath: string,
  opts: ExportOptions,
  outputPath: string
): Promise<void> {
  const includeTerminados = opts.scope === 'terminados' || opts.scope === 'ambos';
  const includeEnProgreso = opts.scope === 'en-progreso' || opts.scope === 'ambos';
  const { pandocFrontmatterBlock, prependContent, appendContent, indiceContent, chapterSlugs } =
    await buildExportAdditions(projectPath, opts);

  await invoke('export_book_markdown', {
    projectPath,
    includeTerminados,
    includeEnProgreso,
    outputPath,
    pandocFrontmatterBlock,
    prependContent,
    appendContent,
    indiceContent,
    chapterSlugs,
  });
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
