import { EditorView, KeyBinding } from '@codemirror/view';

function toggleWrap(view: EditorView, openMarker: string, closeMarker?: string): boolean {
  const { state } = view;
  const { from, to } = state.selection.main;
  const selected = state.sliceDoc(from, to);
  const close = closeMarker ?? openMarker;
  const openLen = openMarker.length;
  const closeLen = close.length;

  // If selection is already wrapped, unwrap
  if (selected.startsWith(openMarker) && selected.endsWith(close) && selected.length >= openLen + closeLen) {
    view.dispatch({
      changes: { from, to, insert: selected.slice(openLen, -closeLen) },
      selection: { anchor: from, head: to - openLen - closeLen },
    });
    return true;
  }

  // Check if surrounding text contains the markers (selection inside markers)
  const before = state.sliceDoc(Math.max(0, from - openLen), from);
  const after = state.sliceDoc(to, Math.min(state.doc.length, to + closeLen));
  if (before === openMarker && after === close) {
    view.dispatch({
      changes: [
        { from: from - openLen, to: from, insert: '' },
        { from: to, to: to + closeLen, insert: '' },
      ],
      selection: { anchor: from - openLen, head: to - openLen },
    });
    return true;
  }

  // Wrap selection (or insert markers at cursor)
  const wrapped = openMarker + selected + close;
  view.dispatch({
    changes: { from, to, insert: wrapped },
    selection: selected.length > 0
      ? { anchor: from, head: from + wrapped.length }
      : { anchor: from + openLen },
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

function insertImage(view: EditorView): boolean {
  const { state } = view;
  const { from, to } = state.selection.main;
  const selected = state.sliceDoc(from, to);

  if (selected.length > 0) {
    const insert = `![${selected}](url)`;
    view.dispatch({
      changes: { from, to, insert },
      selection: { anchor: from + selected.length + 3, head: from + selected.length + 6 },
    });
  } else {
    const insert = '![alt](url)';
    view.dispatch({
      changes: { from, to, insert },
      selection: { anchor: from + 2, head: from + 5 },
    });
  }
  return true;
}

function setAlignment(view: EditorView, align: 'left' | 'center' | 'right'): boolean {
  const { state } = view;
  const { from, to } = state.selection.main;
  const line = state.doc.lineAt(from);
  const endLine = state.doc.lineAt(to);
  const fullFrom = line.from;
  const fullTo = endLine.to;
  const text = state.sliceDoc(fullFrom, fullTo);

  // Remove existing alignment wrappers
  const stripped = text
    .replace(/^<div style="text-align:\s*(left|center|right)">\n?/gm, '')
    .replace(/\n?<\/div>$/gm, '');

  if (align === 'left') {
    // Left is default, just remove wrappers
    view.dispatch({
      changes: { from: fullFrom, to: fullTo, insert: stripped },
    });
  } else {
    const wrapped = `<div style="text-align: ${align}">\n${stripped}\n</div>`;
    view.dispatch({
      changes: { from: fullFrom, to: fullTo, insert: wrapped },
    });
  }
  return true;
}

export { toggleWrap, insertLink, insertImage, setAlignment };

export const markdownFormatKeymap: KeyBinding[] = [
  { key: 'Mod-b', run: (view) => toggleWrap(view, '**') },
  { key: 'Mod-i', run: (view) => toggleWrap(view, '*') },
  { key: 'Mod-u', run: (view) => toggleWrap(view, '<u>', '</u>') },
  { key: 'Mod-k', run: (view) => insertLink(view) },
];
