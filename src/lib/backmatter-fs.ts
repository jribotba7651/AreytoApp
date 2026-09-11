import { invoke } from '@tauri-apps/api/core';
import type { AgradecimientosData, SobreElAutorData, OtrosLibrosData } from '@/types/backmatter';

function agradecimientosPath(rootPath: string): string {
  return `${rootPath}/backmatter/agradecimientos.md`;
}

function sobreElAutorPath(rootPath: string): string {
  return `${rootPath}/backmatter/sobre-el-autor.md`;
}

function otrosLibrosPath(rootPath: string): string {
  return `${rootPath}/backmatter/otros-libros.md`;
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

export async function readSobreElAutor(rootPath: string): Promise<SobreElAutorData | null> {
  const raw = await readFile(sobreElAutorPath(rootPath));
  if (raw === null) return null;
  return { contenido: raw };
}

export async function writeSobreElAutor(
  rootPath: string,
  data: SobreElAutorData
): Promise<void> {
  await writeFile(sobreElAutorPath(rootPath), data.contenido);
}

export async function readOtrosLibros(rootPath: string): Promise<OtrosLibrosData | null> {
  const raw = await readFile(otrosLibrosPath(rootPath));
  if (raw === null) return null;
  return { contenido: raw };
}

export async function writeOtrosLibros(
  rootPath: string,
  data: OtrosLibrosData
): Promise<void> {
  await writeFile(otrosLibrosPath(rootPath), data.contenido);
}

export async function ensureBackmatterFiles(rootPath: string): Promise<void> {
  await ensureDir(`${rootPath}/backmatter`);

  const paths = [
    agradecimientosPath(rootPath),
    sobreElAutorPath(rootPath),
    otrosLibrosPath(rootPath),
  ];

  for (const path of paths) {
    const exists = await invoke<boolean>('path_exists', { path });
    if (!exists) {
      await writeFile(path, '');
    }
  }
}
