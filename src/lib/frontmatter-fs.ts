import { invoke } from '@tauri-apps/api/core';
import type { FrontmatterKind, TituloData, CopyrightData, DedicatoriaData } from '@/types/frontmatter';
import {
  parseTitulo,
  parseCopyright,
  serializeTitulo,
  serializeCopyright,
  defaultContent,
} from './yaml-frontmatter';

function frontmatterPath(rootPath: string, kind: FrontmatterKind): string {
  return `${rootPath}/frontmatter/${kind}.md`;
}

async function readFile(path: string): Promise<string | null> {
  try {
    return await invoke<string>('read_text_file', { path });
  } catch {
    return null;
  }
}

async function writeFile(path: string, contents: string): Promise<void> {
  await invoke('write_text_file', { path, contents });
}

async function ensureDir(path: string): Promise<void> {
  await invoke('ensure_dir', { path });
}

export async function readTitulo(rootPath: string): Promise<TituloData | null> {
  const raw = await readFile(frontmatterPath(rootPath, 'titulo'));
  if (raw === null) return null;
  return parseTitulo(raw);
}

export async function readCopyright(rootPath: string): Promise<CopyrightData | null> {
  const raw = await readFile(frontmatterPath(rootPath, 'copyright'));
  if (raw === null) return null;
  return parseCopyright(raw);
}

export async function writeTitulo(rootPath: string, data: TituloData): Promise<void> {
  await writeFile(frontmatterPath(rootPath, 'titulo'), serializeTitulo(data));
}

export async function writeCopyright(rootPath: string, data: CopyrightData): Promise<void> {
  await writeFile(frontmatterPath(rootPath, 'copyright'), serializeCopyright(data));
}

export async function readDedicatoria(rootPath: string): Promise<DedicatoriaData | null> {
  const raw = await readFile(frontmatterPath(rootPath, 'dedicatoria'));
  if (raw === null) return null;
  return { contenido: raw };
}

export async function writeDedicatoria(rootPath: string, data: DedicatoriaData): Promise<void> {
  await writeFile(frontmatterPath(rootPath, 'dedicatoria'), data.contenido);
}

export async function ensureFrontmatterFiles(rootPath: string): Promise<void> {
  const dir = `${rootPath}/frontmatter`;
  await ensureDir(dir);

  for (const kind of ['titulo', 'copyright'] as FrontmatterKind[]) {
    const path = frontmatterPath(rootPath, kind);
    const exists = await invoke<boolean>('path_exists', { path });
    if (!exists) {
      await writeFile(path, defaultContent(kind));
    }
  }

  const dedicatoriaPath = frontmatterPath(rootPath, 'dedicatoria');
  const dedicatoriaExists = await invoke<boolean>('path_exists', { path: dedicatoriaPath });
  if (!dedicatoriaExists) {
    await writeFile(dedicatoriaPath, '');
  }
}
