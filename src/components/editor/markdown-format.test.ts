import { describe, it, expect } from 'vitest';
import { EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { markdownFormatKeymap } from './markdown-format';

function makeView(doc: string, from: number, to: number): EditorView {
  const state = EditorState.create({
    doc,
    selection: { anchor: from, head: to },
  });
  return new EditorView({ state });
}

function getDoc(view: EditorView): string {
  return view.state.doc.toString();
}

describe('markdown-format toggleWrap bold', () => {
  const bold = markdownFormatKeymap.find((k) => k.key === 'Mod-b')!;

  it('wraps selected text with **', () => {
    const view = makeView('hello world', 6, 11);
    bold.run!(view);
    expect(getDoc(view)).toBe('hello **world**');
  });

  it('unwraps already bold text', () => {
    const view = makeView('hello **world**', 6, 15);
    bold.run!(view);
    expect(getDoc(view)).toBe('hello world');
  });

  it('inserts ** at cursor when no selection', () => {
    const view = makeView('hello', 5, 5);
    bold.run!(view);
    expect(getDoc(view)).toBe('hello****');
    expect(view.state.selection.main.head).toBe(7);
  });
});

describe('markdown-format toggleWrap italic', () => {
  const italic = markdownFormatKeymap.find((k) => k.key === 'Mod-i')!;

  it('wraps selected text with *', () => {
    const view = makeView('hello world', 6, 11);
    italic.run!(view);
    expect(getDoc(view)).toBe('hello *world*');
  });

  it('unwraps already italic text', () => {
    const view = makeView('hello *world*', 6, 13);
    italic.run!(view);
    expect(getDoc(view)).toBe('hello world');
  });
});

describe('markdown-format insertLink', () => {
  const link = markdownFormatKeymap.find((k) => k.key === 'Mod-k')!;

  it('wraps selected text as link', () => {
    const view = makeView('click here', 6, 10);
    link.run!(view);
    expect(getDoc(view)).toBe('click [here](url)');
  });

  it('inserts link template at cursor', () => {
    const view = makeView('hello', 5, 5);
    link.run!(view);
    expect(getDoc(view)).toBe('hello[texto](url)');
  });
});
