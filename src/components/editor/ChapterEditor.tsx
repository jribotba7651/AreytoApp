import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap, highlightActiveLine } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { markdown } from '@codemirror/lang-markdown';
import { createEditorTheme } from './editor-theme';
import { markdownFormatKeymap } from './markdown-format';
import { typewriterMode, sentenceHighlight } from './editor-extensions';
import { useSettingsStore } from '@/stores/settingsStore';

interface ChapterEditorProps {
  initialContent: string;
  onChange?: (content: string) => void;
}

export interface ChapterEditorHandle {
  getView: () => EditorView | null;
}

const ChapterEditor = forwardRef<ChapterEditorHandle, ChapterEditorProps>(function ChapterEditor({ initialContent, onChange }, ref) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  const typewriterEnabled = useSettingsStore((s) => s.typewriterMode);
  const sentenceHighlightEnabled = useSettingsStore((s) => s.sentenceHighlight);

  useImperativeHandle(ref, () => ({
    getView: () => viewRef.current,
  }));

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

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
      ],
    });

    const view = new EditorView({ state, parent: containerRef.current });
    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, [typewriterEnabled, sentenceHighlightEnabled]);  // eslint-disable-line react-hooks/exhaustive-deps

  return <div ref={containerRef} className="h-full w-full overflow-auto" />;
});

export default ChapterEditor;
