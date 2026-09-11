import { EditorView, KeyBinding } from '@codemirror/view';

function toggleWrap(view: EditorView, marker: string): boolean {
  const { state } = view;
  const { from, to } = state.selection.main;
  const selected = state.sliceDoc(from, to);
  const len = marker.length;

  // If selection is already wrapped, unwrap
  if (selected.startsWith(marker) && selected.endsWith(marker) && selected.length >= len * 2) {
    view.dispatch({
      changes: { from, to, insert: selected.slice(len, -len) },
      selection: { anchor: from, head: to - len * 2 },
    });
    return true;
  }

  // Check if surrounding text contains the markers (selection inside markers)
  const before = state.sliceDoc(Math.max(0, from - len), from);
  const after = state.sliceDoc(to, Math.min(state.doc.length, to + len));
  if (before === marker && after === marker) {
    view.dispatch({
      changes: [
        { from: from - len, to: from, insert: '' },
        { from: to, to: to + len, insert: '' },
      ],
      selection: { anchor: from - len, head: to - len },
    });
    return true;
  }

  // Wrap selection (or insert markers at cursor)
  const wrapped = marker + selected + marker;
  view.dispatch({
    changes: { from, to, insert: wrapped },
    selection: selected.length > 0
      ? { anchor: from, head: from + wrapped.length }
      : { anchor: from + len },
  });
  return true;
}

function insertLink(view: EditorView): boolean {
  const { state } = view;
  const { from, to } = state.selection.main;
  const selected = state.sliceDoc(from, to);

  if (selected.length > 0) {
    const insert = `[${selected}](url)`;
    view.dispatch({
      changes: { from, to, insert },
      // Select "url" so user can type the URL
      selection: { anchor: from + selected.length + 2, head: from + selected.length + 5 },
    });
  } else {
    const insert = '[texto](url)';
    view.dispatch({
      changes: { from, to, insert },
      selection: { anchor: from + 1, head: from + 6 },
    });
  }
  return true;
}

export const markdownFormatKeymap: KeyBinding[] = [
  { key: 'Mod-b', run: (view) => toggleWrap(view, '**') },
  { key: 'Mod-i', run: (view) => toggleWrap(view, '*') },
  { key: 'Mod-k', run: (view) => insertLink(view) },
];
