export interface Commit {
  hash: string;
  shortHash: string;
  message: string;
  timestamp: string;
}

export interface TagInfo {
  name: string;
  timestamp: string;
  commitSubject: string;
}

export type GitError =
  | { kind: 'NotARepo'; path: string }
  | { kind: 'InitFailed'; reason: string }
  | { kind: 'CommitFailed'; reason: string }
  | { kind: 'LogFailed'; reason: string }
  | { kind: 'TagFailed'; reason: string }
  | { kind: 'GitNotInstalled' };

export type GitResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: GitError };
