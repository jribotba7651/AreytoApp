import { describe, it, expect } from 'vitest';
import { decideReload } from './watcher-reconcile';

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
