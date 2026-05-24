import { invoke } from '@tauri-apps/api/core';

export type ExportScope = 'terminados' | 'en-progreso' | 'ambos';

export interface ExportOptions {
  scope: ExportScope;
}

export async function exportBookMarkdown(
  projectPath: string,
  opts: ExportOptions,
  outputPath: string
): Promise<void> {
  const includeTerminados = opts.scope === 'terminados' || opts.scope === 'ambos';
  const includeEnProgreso = opts.scope === 'en-progreso' || opts.scope === 'ambos';

  await invoke('export_book_markdown', {
    projectPath,
    includeTerminados,
    includeEnProgreso,
    outputPath,
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
