import { invoke } from '@tauri-apps/api/core';

export interface Bookmark {
  id: string;
  title: string;
  chapterFilename: string | null;
  note: string;
  createdAt: string;
}

function bookmarksPath(rootPath: string): string {
  return `${rootPath}/.notes/bookmarks.json`;
}

export function createBookmarkId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function readBookmarks(rootPath: string): Promise<Bookmark[]> {
  const path = bookmarksPath(rootPath);
  const exists = await invoke<boolean>('path_exists', { path });
  if (!exists) return [];
  try {
    const raw = await invoke<string>('read_text_file', { path });
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as Bookmark[];
  } catch (e) {
    console.error('Failed to read bookmarks:', e);
    return [];
  }
}

export async function writeBookmarks(rootPath: string, bookmarks: Bookmark[]): Promise<void> {
  const dir = `${rootPath}/.notes`;
  await invoke('ensure_dir', { path: dir });
  await invoke('write_text_file', {
    path: bookmarksPath(rootPath),
    contents: JSON.stringify(bookmarks, null, 2),
  });
}
