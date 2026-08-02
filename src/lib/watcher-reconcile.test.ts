import { describe, it, expect } from 'vitest';
import { decideReload, isSameChapterFile } from './watcher-reconcile';

describe('decideReload', () => {
  it('ignora cuando disco === lastSaved === editor (eco del propio autosave)', () => {
    expect(decideReload({
      diskContent: 'hola',
      editorContent: 'hola',
      lastSavedContent: 'hola',
    })).toBe('ignore');
  });

  it('ignora cuando disco === lastSaved pero editor difiere (autosave eco, usuario ya editó)', () => {
    expect(decideReload({
      diskContent: 'guardado',
      editorContent: 'editando',
      lastSavedContent: 'guardado',
    })).toBe('ignore');
  });

  it('recarga cuando cambio externo sin ediciones locales pendientes', () => {
    expect(decideReload({
      diskContent: 'externo',
      editorContent: 'original',
      lastSavedContent: 'original',
    })).toBe('reload');
  });

  it('prompt cuando cambio externo con ediciones locales pendientes', () => {
    expect(decideReload({
      diskContent: 'externo',
      editorContent: 'mis cambios',
      lastSavedContent: 'original',
    })).toBe('prompt');
  });
});

describe('isSameChapterFile', () => {
  it('matchea mismo archivo con prefijos distintos (iCloud vs local)', () => {
    expect(isSameChapterFile(
      '/Users/juan/Library/Mobile Documents/com~apple~CloudDocs/mi-libro/capitulos/cap-01.md',
      '/Users/juan/dev/mi-libro/capitulos/cap-01.md',
    )).toBe(true);
  });

  it('no matchea archivos distintos', () => {
    expect(isSameChapterFile(
      '/tmp/mi-libro/capitulos/cap-02.md',
      '/tmp/mi-libro/capitulos/cap-01.md',
    )).toBe(false);
  });

  it('no matchea mismo filename en capitulos vs capitulos-terminados', () => {
    expect(isSameChapterFile(
      '/tmp/mi-libro/capitulos-terminados/cap-01.md',
      '/tmp/mi-libro/capitulos/cap-01.md',
    )).toBe(false);
  });
});
