import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap, highlightActiveLine } from '@codemirror/view';
import { EditorSelection } from '@codemirror/state';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { markdown } from '@codemirror/lang-markdown';
import { createEditorTheme } from './editor-theme';
import { markdownFormatKeymap } from './markdown-format';
import { typewriterMode, sentenceHighlight } from './editor-extensions';
import { useSettingsStore } from '@/stores/settingsStore';
import { useLayoutStore } from '@/stores/layoutStore';

interface ChapterEditorProps {
  initialContent: string;
  onChange?: (content: string) => void;
  onScroll?: (scrollTop: number, scrollHeight: number, clientHeight: number) => void;
  readOnly?: boolean;
}

export interface ChapterEditorHandle {
  getView: () => EditorView | null;
  insertText: (text: string) => void;
  getCursor: () => number;
}

const ChapterEditor = forwardRef<ChapterEditorHandle, ChapterEditorProps>(function ChapterEditor({ initialContent, onChange, onScroll, readOnly }, ref) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  const onScrollRef = useRef(onScroll);
  const typewriterSetting = useSettingsStore((s) => s.typewriterMode);
  const sentenceHighlightEnabled = useSettingsStore((s) => s.sentenceHighlight);
  const focusMode = useLayoutStore((s) => s.focusMode);
  const typewriterEnabled = typewriterSetting || focusMode;

  useImperativeHandle(ref, () => ({
    getView: () => viewRef.current,
    insertText: (text: string) => {
      const view = viewRef.current;
      if (!view) return;
      const { head } = view.state.selection.main;
      view.dispatch({
        changes: { from: head, to: head, insert: text },
        selection: EditorSelection.cursor(head + text.length),
      });
      view.focus();
    },
    getCursor: () => viewRef.current?.state.selection.main.head ?? 0,
  }));

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    onScrollRef.current = onScroll;
  }, [onScroll]);

  useEffect(() => {
    if (!containerRef.current) return;

    const state = EditorState.create({
      doc: initialContent,
      extensions: [
        markdown(),
        EditorView.lineWrapping,
        createEditorTheme(),
        history(),
        highlightActiveLine(),
        keymap.of([...markdownFormatKeymap, ...defaultKeymap, ...historyKeymap]),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChangeRef.current?.(update.state.doc.toString());
          }
        }),
        typewriterMode(typewriterEnabled),
        sentenceHighlight(sentenceHighlightEnabled),
        EditorState.readOnly.of(readOnly ?? false),
      ],
    });

    const view = new EditorView({ state, parent: containerRef.current });
    viewRef.current = view;

    const scrollDom = view.scrollDOM;
    const handleScroll = () => {
      onScrollRef.current?.(scrollDom.scrollTop, scrollDom.scrollHeight, scrollDom.clientHeight);
    };
    scrollDom.addEventListener('scroll', handleScroll);

    return () => {
      scrollDom.removeEventListener('scroll', handleScroll);
      view.destroy();
      viewRef.current = null;
    };
  }, [typewriterEnabled, sentenceHighlightEnabled]);  // eslint-disable-line react-hooks/exhaustive-deps

  return <div ref={containerRef} className="h-full w-full overflow-auto" />;
});

export default ChapterEditor;
