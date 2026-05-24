import { invoke } from '@tauri-apps/api/core';
import type { AgradecimientosData } from '@/types/backmatter';

function agradecimientosPath(rootPath: string): string {
  return `${rootPath}/backmatter/agradecimientos.md`;
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

export async function readAgradecimientos(rootPath: string): Promise<AgradecimientosData | null> {
  const raw = await readFile(agradecimientosPath(rootPath));
  if (raw === null) return null;
  return { contenido: raw };
}

export async function writeAgradecimientos(
  rootPath: string,
  data: AgradecimientosData
): Promise<void> {
  await writeFile(agradecimientosPath(rootPath), data.contenido);
}

export async function ensureBackmatterFiles(rootPath: string): Promise<void> {
  await ensureDir(`${rootPath}/backmatter`);

  const path = agradecimientosPath(rootPath);
  const exists = await invoke<boolean>('path_exists', { path });
  if (!exists) {
    await writeFile(path, '');
  }
}
