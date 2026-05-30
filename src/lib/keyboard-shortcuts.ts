export interface ShortcutDef {
  key: string;
  mod: boolean;
  shift?: boolean;
  alwaysOn?: boolean;
}

export const SHORTCUTS = {
  SAVE:          { key: 's', mod: true, alwaysOn: true },
  NEW_CHAPTER:   { key: 'n', mod: true },
  CLOSE_CHAPTER: { key: 't', mod: true, shift: true },
  REFRESH:       { key: 'r', mod: true },
  TAB_CHAPTER:   { key: '1', mod: true },
  TAB_BOOK:      { key: '2', mod: true },
  TAB_FINISHED:  { key: '3', mod: true },
  TAB_SETTINGS:  { key: '4', mod: true },
  OPEN_PROJECT:        { key: 'o', mod: true, shift: true },
  CLOSE_PROJECT:       { key: 'w', mod: true, shift: true },
  TOGGLE_EDITOR_VIEW:  { key: 'e', mod: true },
} as const satisfies Record<string, ShortcutDef>;

export type ShortcutId = keyof typeof SHORTCUTS;

export function formatShortcut(shortcut: ShortcutDef): string {
  let s = '⌘';
  if (shortcut.shift) s += '⇧';
  s += shortcut.key.toUpperCase();
  return s;
}

export function matchShortcut(e: KeyboardEvent, shortcut: ShortcutDef): boolean {
  const mod = e.metaKey || e.ctrlKey;
  if (mod !== shortcut.mod) return false;
  if ((shortcut.shift ?? false) !== e.shiftKey) return false;
  return e.key.toLowerCase() === shortcut.key.toLowerCase();
}
