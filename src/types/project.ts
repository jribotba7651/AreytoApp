export type ChapterStatus = 'in-progress' | 'finished';

export interface Chapter {
  path: string;
  filename: string;
  title: string;
  status: ChapterStatus;
}

export interface Project {
  rootPath: string;
  nombre: string;
  creado: string;
  capituloActivo: string | null;
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
}
