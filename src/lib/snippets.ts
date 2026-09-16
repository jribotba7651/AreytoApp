import { invoke } from '@tauri-apps/api/core';

export interface Snippet {
  id: string;
  label: string;
  text: string;
}

function snippetsPath(rootPath: string): string {
  return `${rootPath}/.notes/snippets.json`;
}

export function createSnippetId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function readSnippets(rootPath: string): Promise<Snippet[]> {
  const path = snippetsPath(rootPath);
  const exists = await invoke<boolean>('path_exists', { path });
  if (!exists) return [];
  try {
    const raw = await invoke<string>('read_text_file', { path });
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as Snippet[];
  } catch (e) {
    console.error('Failed to read snippets:', e);
    return [];
  }
}

export async function writeSnippets(rootPath: string, snippets: Snippet[]): Promise<void> {
  const dir = `${rootPath}/.notes`;
  await invoke('ensure_dir', { path: dir });
  await invoke('write_text_file', {
    path: snippetsPath(rootPath),
    contents: JSON.stringify(snippets, null, 2),
  });
}
