import { describe, it, expect } from 'vitest';
import { createBookmark } from './bookmarks';

describe('createBookmark', () => {
  it('creates bookmark with auto-generated name', () => {
    const bm = createBookmark([], 0);
    expect(bm.name).toBe('Marca 1');
    expect(bm.pos).toBe(0);
    expect(bm.createdAt).toBeTruthy();
  });

  it('increments name based on existing bookmarks', () => {
    const existing = [createBookmark([], 0)];
    const bm = createBookmark(existing, 10);
    expect(bm.name).toBe('Marca 2');
    expect(bm.pos).toBe(10);
  });

  it('uses custom name if provided after creation', () => {
    const bm = createBookmark([], 5);
    bm.name = 'Mi marcador';
    expect(bm.name).toBe('Mi marcador');
  });
});
