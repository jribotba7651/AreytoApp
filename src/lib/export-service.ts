import { invoke } from '@tauri-apps/api/core';
import { readTitulo, readCopyright, readDedicatoria, readMetadata } from '@/lib/frontmatter-fs';
import { readAgradecimientos, readSobreElAutor, readOtrosLibros } from '@/lib/backmatter-fs';
import { resolveTheme, themeToEpubCss } from '@/lib/theme';
import {
  buildPortadaSection,
  buildDedicatoriaSection,
  buildAgradecimientosSection,
  buildSobreElAutorSection,
  buildOtrosLibrosSection,
  buildIndiceSection,
  buildPandocFrontmatterBlock,
  deriveExportChapterInfo,
  slugify,
  SECTION_SEPARATOR,
} from '@/lib/export-composer';
import type { IndiceItem } from '@/lib/export-composer';

export type ExportScope = 'terminados' | 'en-progreso' | 'ambos';
export type ExportFormat = 'md' | 'docx' | 'epub';

export interface ExportOptions {
  scope: ExportScope;
  format?: ExportFormat;
}

export interface ExportAdditions {
  pandocFrontmatterBlock: string | null;
  prependContent: string | null;
  appendContent: string | null;
  indiceContent: string | null;
  chapterSlugs: Record<string, string>;
  chapterHeadings: Record<string, string>;
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
  opts: ExportOptions,
  projectName?: string,
): Promise<ExportAdditions> {
  const [titulo, copyright, dedicatoria, agradecimientos, sobreElAutor, otrosLibros, metadata] = await Promise.all([
    readTitulo(projectPath),
    readCopyright(projectPath),
    readDedicatoria(projectPath),
    readAgradecimientos(projectPath),
    readSobreElAutor(projectPath),
    readOtrosLibros(projectPath),
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
  const chapterHeadings: Record<string, string> = {};

  for (const dir of chapterDirs) {
    const filenames = await listSortedMdFilenames(dir);
    for (const filename of filenames) {
      const content = await readFileContent(`${dir}/${filename}`);
      const info = deriveExportChapterInfo(content ?? '', filename);
      const slug = slugify(filename.replace(/\.md$/, ''));
      indiceItems.push({ title: info.title, slug });
      chapterSlugs[filename] = slug;
      if (info.headingToInject) {
        chapterHeadings[filename] = info.headingToInject;
      }
    }
  }

  const portada = buildPortadaSection(titulo, copyright);
  const dedicatoriaSection = buildDedicatoriaSection(dedicatoria?.contenido);
  const agradecimientosSection = buildAgradecimientosSection(agradecimientos?.contenido);
  const sobreElAutorSection = buildSobreElAutorSection(sobreElAutor?.contenido);
  const otrosLibrosSection = buildOtrosLibrosSection(otrosLibros?.contenido);

  // EPUB uses pandoc --toc for navigation; don't inject manual ToC
  const indiceContent = opts.format === 'epub' ? null : buildIndiceSection(indiceItems);

  const pandocFrontmatterBlock = buildPandocFrontmatterBlock(titulo, copyright, metadata, projectName);

  const prependParts = [portada, dedicatoriaSection].filter((s): s is string => s !== null);
  const prependContent = prependParts.length > 0 ? prependParts.join(SECTION_SEPARATOR) : null;

  const appendParts = [agradecimientosSection, sobreElAutorSection, otrosLibrosSection].filter((s): s is string => s !== null);
  const appendContent = appendParts.length > 0 ? appendParts.join(SECTION_SEPARATOR) : null;

  // Anchors only serve the manual ToC (docx/md); epub uses pandoc --toc, so anchors
  // would create an empty section before the first chapter.
  const finalSlugs = opts.format === 'epub' ? {} : chapterSlugs;

  return { pandocFrontmatterBlock, prependContent, appendContent, indiceContent, chapterSlugs: finalSlugs, chapterHeadings };
}

export async function exportBookMarkdown(
  projectPath: string,
  opts: ExportOptions,
  outputPath: string,
  projectName?: string,
): Promise<void> {
  const includeTerminados = opts.scope === 'terminados' || opts.scope === 'ambos';
  const includeEnProgreso = opts.scope === 'en-progreso' || opts.scope === 'ambos';
  const { pandocFrontmatterBlock, prependContent, appendContent, indiceContent, chapterSlugs, chapterHeadings } =
    await buildExportAdditions(projectPath, { ...opts, format: 'md' }, projectName);

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
    chapterHeadings,
  });
}

export async function exportBookDocx(
  projectPath: string,
  opts: ExportOptions,
  outputPath: string,
  projectName?: string,
): Promise<void> {
  const includeTerminados = opts.scope === 'terminados' || opts.scope === 'ambos';
  const includeEnProgreso = opts.scope === 'en-progreso' || opts.scope === 'ambos';
  const { pandocFrontmatterBlock, prependContent, appendContent, indiceContent, chapterSlugs, chapterHeadings } =
    await buildExportAdditions(projectPath, { ...opts, format: 'docx' }, projectName);

  await invoke('export_book_docx', {
    projectPath,
    includeTerminados,
    includeEnProgreso,
    outputPath,
    pandocFrontmatterBlock,
    prependContent,
    appendContent,
    indiceContent,
    chapterSlugs,
    chapterHeadings,
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

export const COVER_FILENAMES = [
  'portada.png', 'portada.jpg', 'portada.jpeg',
  'cover.png', 'cover.jpg', 'cover.jpeg',
];

export async function detectCoverImage(projectPath: string): Promise<string | null> {
  for (const name of COVER_FILENAMES) {
    const path = `${projectPath}/${name}`;
    const exists = await invoke<boolean>('path_exists', { path });
    if (exists) return path;
  }
  return null;
}

export async function exportBookEpub(
  projectPath: string,
  opts: ExportOptions,
  outputPath: string,
  tema?: string | null,
  temaOverrides?: Record<string, unknown> | null,
  projectName?: string,
): Promise<void> {
  const includeTerminados = opts.scope === 'terminados' || opts.scope === 'ambos';
  const includeEnProgreso = opts.scope === 'en-progreso' || opts.scope === 'ambos';
  const { pandocFrontmatterBlock, prependContent, appendContent, indiceContent, chapterSlugs, chapterHeadings } =
    await buildExportAdditions(projectPath, { ...opts, format: 'epub' }, projectName);

  const theme = resolveTheme(tema, temaOverrides);
  const epubCss = themeToEpubCss(theme);
  const coverPath = await detectCoverImage(projectPath);

  await invoke('export_book_epub', {
    projectPath,
    includeTerminados,
    includeEnProgreso,
    outputPath,
    pandocFrontmatterBlock,
    prependContent,
    appendContent,
    indiceContent,
    chapterSlugs,
    chapterHeadings,
    epubCss: epubCss,
    coverPath,
  });
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
