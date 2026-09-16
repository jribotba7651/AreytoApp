import type { Bookmark } from '@/types/project';

export function createBookmark(bookmarks: Bookmark[] = [], pos: number): Bookmark {
  const count = bookmarks.length;
  return {
    name: `Marca ${count + 1}`,
    pos,
    createdAt: new Date().toISOString(),
  };
}
