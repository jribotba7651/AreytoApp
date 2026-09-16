import { invoke } from '@tauri-apps/api/core';
import type { ChapterColor } from '@/types/project';

export interface Character {
  id: string;
  name: string;
  description: string;
  color: ChapterColor;
}

function charactersPath(rootPath: string): string {
  return `${rootPath}/.notes/characters.json`;
}

export function createCharacterId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function readCharacters(rootPath: string): Promise<Character[]> {
  const path = charactersPath(rootPath);
  const exists = await invoke<boolean>('path_exists', { path });
  if (!exists) return [];
  try {
    const raw = await invoke<string>('read_text_file', { path });
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as Character[];
  } catch (e) {
    console.error('Failed to read characters:', e);
    return [];
  }
}

export async function writeCharacters(rootPath: string, characters: Character[]): Promise<void> {
  const dir = `${rootPath}/.notes`;
  await invoke('ensure_dir', { path: dir });
  await invoke('write_text_file', {
    path: charactersPath(rootPath),
    contents: JSON.stringify(characters, null, 2),
  });
}
