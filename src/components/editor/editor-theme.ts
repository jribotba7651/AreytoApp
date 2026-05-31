import { EditorView } from '@codemirror/view';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags } from '@lezer/highlight';
import { Extension } from '@codemirror/state';

const MONO = '"JetBrains Mono", "Fira Code", monospace';

const baseTheme = EditorView.theme({
  '&': {
    height: '100%',
    backgroundColor: 'var(--bg-editor)',
    color: 'var(--text-editor)',
    fontSize: 'var(--font-size-editor)',
    fontFamily: 'var(--font-editor)',
    lineHeight: '1.7',
  },
  '.cm-scroller': {
    fontFamily: 'var(--font-editor)',
    overflow: 'auto',
  },
  '.cm-content': {
    padding: '16px 24px',
    maxWidth: '720px',
    margin: '0 auto',
    caretColor: 'var(--text-primary)',
  },
  '.cm-cursor': {
    borderLeftColor: 'var(--text-primary)',
    borderLeftWidth: '2px',
  },
  '&.cm-focused .cm-cursor': {
    borderLeftColor: 'var(--text-primary)',
  },
  '.cm-selectionBackground': {
    backgroundColor: 'var(--accent-muted)',
    opacity: '0.5',
  },
  '&.cm-focused .cm-selectionBackground': {
    backgroundColor: 'var(--accent-muted)',
  },
  '.cm-gutters': {
    display: 'none',
  },
  '.cm-activeLine': {
    backgroundColor: 'transparent',
  },
  '.cm-activeLineGutter': {
    backgroundColor: 'transparent',
  },
  '&.cm-focused': {
    outline: 'none',
  },
  '.cm-line': {
    padding: '0',
  },
});

const markdownHighlight = HighlightStyle.define([
  {
    tag: tags.heading1,
    fontFamily: 'var(--font-editor)',
    fontWeight: '600',
    fontSize: '1.8em',
    color: 'var(--text-primary)',
    lineHeight: '1.3',
  },
  {
    tag: tags.heading2,
    fontFamily: 'var(--font-editor)',
    fontWeight: '600',
    fontSize: '1.4em',
    color: 'var(--text-primary)',
    lineHeight: '1.3',
  },
  {
    tag: tags.heading3,
    fontFamily: 'var(--font-editor)',
    fontWeight: '600',
    fontSize: '1.2em',
    color: 'var(--text-primary)',
  },
  {
    tag: tags.strong,
    fontWeight: '700',
    color: 'var(--text-primary)',
  },
  {
    tag: tags.emphasis,
    fontStyle: 'italic',
    color: 'var(--text-editor)',
  },
  {
    tag: tags.monospace,
    fontFamily: MONO,
    fontSize: '0.9em',
    backgroundColor: 'var(--bg-tertiary)',
    padding: '2px 6px',
    borderRadius: '4px',
    color: 'var(--text-primary)',
  },
  {
    tag: tags.quote,
    color: 'var(--text-secondary)',
    borderLeft: '3px solid var(--accent-muted)',
    paddingLeft: '12px',
  },
  {
    tag: tags.url,
    color: 'var(--accent)',
    textDecoration: 'underline',
  },
  {
    tag: tags.link,
    color: 'var(--accent)',
  },
  {
    tag: tags.list,
    color: 'var(--text-secondary)',
  },
  {
    tag: tags.meta,
    color: 'var(--text-tertiary)',
  },
  {
    tag: tags.processingInstruction,
    color: 'var(--text-tertiary)',
  },
  {
    tag: tags.comment,
    color: 'var(--text-tertiary)',
    fontStyle: 'italic',
  },
]);

export function createEditorTheme(): Extension {
  return [baseTheme, syntaxHighlighting(markdownHighlight)];
}
