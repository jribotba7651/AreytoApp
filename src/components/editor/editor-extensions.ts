import { EditorView, ViewPlugin, ViewUpdate } from '@codemirror/view';
import { Extension, Facet, StateField, RangeSetBuilder } from '@codemirror/state';
import { Decoration, DecorationSet } from '@codemirror/view';

// --- Typewriter Mode ---
// Keeps the cursor line centered vertically in the editor viewport

const typewriterEnabled = Facet.define<boolean, boolean>({
  combine: (values) => values.some((v) => v),
});

const typewriterPlugin = ViewPlugin.fromClass(
  class {
    update(update: ViewUpdate) {
      if (!update.view.hasFocus) return;
      if (!update.state.facet(typewriterEnabled)) return;
      if (!update.selectionSet && !update.docChanged) return;

      const head = update.state.selection.main.head;
      const coords = update.view.coordsAtPos(head);
      if (!coords) return;

      const editorRect = update.view.dom.getBoundingClientRect();
      const midY = editorRect.top + editorRect.height / 2;
      const offset = coords.top - midY;

      if (Math.abs(offset) > 2) {
        update.view.scrollDOM.scrollBy({ top: offset, behavior: 'smooth' });
      }
    }
  },
);

export function typewriterMode(enabled: boolean): Extension {
  return [typewriterEnabled.of(enabled), typewriterPlugin];
}

// --- Sentence Highlight ---
// Highlights the current sentence with a soft background

const sentenceHighlightEnabled = Facet.define<boolean, boolean>({
  combine: (values) => values.some((v) => v),
});

const sentenceHighlightTheme = EditorView.baseTheme({
  '.cm-sentence-highlight': {
    backgroundColor: 'var(--bg-tertiary)',
    borderRadius: '2px',
  },
});

function findSentenceBounds(text: string, pos: number): { from: number; to: number } {
  const terminators = /[.!?]\s/g;

  let sentenceStart = 0;
  let match: RegExpExecArray | null;
  terminators.lastIndex = 0;
  while ((match = terminators.exec(text)) !== null) {
    const endOfTerminator = match.index + match[0].length;
    if (endOfTerminator <= pos) {
      sentenceStart = endOfTerminator;
    } else {
      break;
    }
  }

  let sentenceEnd = text.length;
  terminators.lastIndex = pos;
  match = terminators.exec(text);
  if (match) {
    sentenceEnd = match.index + 1;
  }

  return { from: sentenceStart, to: sentenceEnd };
}

const sentenceDeco = Decoration.mark({ class: 'cm-sentence-highlight' });

const sentenceHighlightField = StateField.define<DecorationSet>({
  create(state) {
    if (!state.facet(sentenceHighlightEnabled)) return Decoration.none;
    return buildSentenceDecorations(state.doc.toString(), state.selection.main.head);
  },
  update(decos, tr) {
    if (!tr.state.facet(sentenceHighlightEnabled)) return Decoration.none;
    if (!tr.docChanged && tr.startState.selection.main.head === tr.state.selection.main.head) return decos;
    return buildSentenceDecorations(tr.state.doc.toString(), tr.state.selection.main.head);
  },
  provide: (f) => EditorView.decorations.from(f),
});

function buildSentenceDecorations(doc: string, head: number): DecorationSet {
  const { from, to } = findSentenceBounds(doc, head);
  if (from >= to) return Decoration.none;
  const builder = new RangeSetBuilder<Decoration>();
  builder.add(from, to, sentenceDeco);
  return builder.finish();
}

export function sentenceHighlight(enabled: boolean): Extension {
  return [
    sentenceHighlightEnabled.of(enabled),
    sentenceHighlightField,
    sentenceHighlightTheme,
  ];
}
