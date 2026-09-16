export type ChapterStatus = 'in-progress' | 'finished';
export type ChapterColor = 'red' | 'orange' | 'green' | 'blue' | 'purple';

export const CHAPTER_COLORS: ChapterColor[] = ['red', 'orange', 'green', 'blue', 'purple'];

export const CHAPTER_COLOR_MAP: Record<ChapterColor, string> = {
  red: '#DC2626',
  orange: '#D97706',
  green: '#16A34A',
  blue: '#2563EB',
  purple: '#9333EA',
};

export interface Chapter {
  path: string;
  filename: string;
  title: string;
  status: ChapterStatus;
}

export interface BookSettings {
  trimWidth: number;
  trimHeight: number;
  marginTop: number;
  marginBottom: number;
  marginInner: number;
  marginOuter: number;
}

export const DEFAULT_BOOK_SETTINGS: BookSettings = {
  trimWidth: 6,
  trimHeight: 9,
  marginTop: 1,
  marginBottom: 1,
  marginInner: 1,
  marginOuter: 1,
};

export interface Bookmark {
  name: string;
  pos: number;
  createdAt: string;
}

export interface Project {
  rootPath: string;
  nombre: string;
  creado: string;
  capituloActivo: string | null;
  tema?: string;
  temaOverrides?: Record<string, unknown>;
  bookSettings?: BookSettings;
  excludedFromExport?: string[];
  chapterColors?: Record<string, ChapterColor>;
  bookmarks?: Bookmark[];
  lastExportTimestamps?: Record<string, string>;
  lockedChapters?: string[];
}

export type ProjectFsError =
  | { kind: 'NotAProject'; path: string }
  | { kind: 'PathNotFound'; path: string }
  | { kind: 'ReadFailed'; path: string; reason: string }
  | { kind: 'WriteFailed'; path: string; reason: string }
  | { kind: 'InvalidJson'; path: string; reason: string }
  | { kind: 'AlreadyExists'; path: string };

export type ProjectResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: ProjectFsError };

export interface ClosedChapter {
  filename: string;
  absolutePath: string;
  tagName: string;
  closedAt: string;
  title: string;
  wordCount: number;
}
