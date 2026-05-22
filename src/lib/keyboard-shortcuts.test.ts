import { describe, it, expect } from 'vitest';
import { SHORTCUTS, formatShortcut, matchShortcut } from './keyboard-shortcuts';

function makeEvent(overrides: Partial<KeyboardEvent>): KeyboardEvent {
  return {
    key: '',
    metaKey: false,
    ctrlKey: false,
    shiftKey: false,
    altKey: false,
    ...overrides,
  } as KeyboardEvent;
}

describe('formatShortcut', () => {
  it('produce string correcto para mod solo', () => {
    expect(formatShortcut(SHORTCUTS.SAVE)).toBe('⌘S');
    expect(formatShortcut(SHORTCUTS.NEW_CHAPTER)).toBe('⌘N');
    expect(formatShortcut(SHORTCUTS.TAB_CHAPTER)).toBe('⌘1');
  });

  it('produce string correcto para mod+shift', () => {
    expect(formatShortcut(SHORTCUTS.CLOSE_CHAPTER)).toBe('⌘⇧T');
    expect(formatShortcut(SHORTCUTS.OPEN_PROJECT)).toBe('⌘⇧O');
    expect(formatShortcut(SHORTCUTS.CLOSE_PROJECT)).toBe('⌘⇧W');
  });
});

describe('matchShortcut', () => {
  it('detecta correctamente Cmd+S', () => {
    const e = makeEvent({ key: 's', metaKey: true });
    expect(matchShortcut(e, SHORTCUTS.SAVE)).toBe(true);
  });

  it('detecta correctamente Cmd+Shift+T', () => {
    const e = makeEvent({ key: 't', metaKey: true, shiftKey: true });
    expect(matchShortcut(e, SHORTCUTS.CLOSE_CHAPTER)).toBe(true);
  });

  it('rechaza si falta el modifier correcto', () => {
    // Cmd+T without shift should NOT match Cmd+Shift+T
    const e = makeEvent({ key: 't', metaKey: true, shiftKey: false });
    expect(matchShortcut(e, SHORTCUTS.CLOSE_CHAPTER)).toBe(false);
  });

  it('rechaza si no hay metaKey ni ctrlKey', () => {
    const e = makeEvent({ key: 's', metaKey: false, ctrlKey: false });
    expect(matchShortcut(e, SHORTCUTS.SAVE)).toBe(false);
  });

  it('acepta ctrlKey como alternativa a metaKey', () => {
    const e = makeEvent({ key: 's', ctrlKey: true });
    expect(matchShortcut(e, SHORTCUTS.SAVE)).toBe(true);
  });

  it('es case-insensitive en la key', () => {
    const e = makeEvent({ key: 'S', metaKey: true });
    expect(matchShortcut(e, SHORTCUTS.SAVE)).toBe(true);
  });
});
