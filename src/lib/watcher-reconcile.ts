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
