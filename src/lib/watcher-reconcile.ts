export function isSameChapterFile(changedPath: string, activeChapterPath: string): boolean {
  const tail = (p: string) => p.split('/').filter(Boolean).slice(-2);
  const a = tail(changedPath);
  const b = tail(activeChapterPath);
  return a.length === 2 && b.length === 2 && a[0] === b[0] && a[1] === b[1];
}

export type ReloadDecision = 'ignore' | 'reload' | 'prompt';

interface DecideReloadInput {
  diskContent: string;
  editorContent: string;
  lastSavedContent: string;
}

export function decideReload({ diskContent, editorContent, lastSavedContent }: DecideReloadInput): ReloadDecision {
  if (diskContent === lastSavedContent) {
    return 'ignore';
  }
  if (editorContent === lastSavedContent) {
    return 'reload';
  }
  return 'prompt';
}
