import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link,
  Image,
} from 'lucide-react';
import type { ChapterEditorHandle } from './ChapterEditor';
import { toggleWrap, insertLink, insertImage, setAlignment } from './markdown-format';

interface FormatToolbarProps {
  editorRef: React.RefObject<ChapterEditorHandle | null>;
}

interface ToolbarButton {
  icon: React.ElementType;
  label: string;
  shortcut?: string;
  action: (editorRef: React.RefObject<ChapterEditorHandle | null>) => void;
  separator?: false;
}

interface ToolbarSeparator {
  separator: true;
}

type ToolbarItem = ToolbarButton | ToolbarSeparator;

function runOnView(
  editorRef: React.RefObject<ChapterEditorHandle | null>,
  fn: (view: import('@codemirror/view').EditorView) => boolean,
) {
  const view = editorRef.current?.getView();
  if (!view) return;
  fn(view);
  view.focus();
}

const ITEMS: ToolbarItem[] = [
  {
    icon: Bold,
    label: 'Bold',
    shortcut: 'Cmd+B',
    action: (ref) => runOnView(ref, (v) => toggleWrap(v, '**')),
  },
  {
    icon: Italic,
    label: 'Italic',
    shortcut: 'Cmd+I',
    action: (ref) => runOnView(ref, (v) => toggleWrap(v, '*')),
  },
  {
    icon: Underline,
    label: 'Underline',
    shortcut: 'Cmd+U',
    action: (ref) => runOnView(ref, (v) => toggleWrap(v, '<u>', '</u>')),
  },
  { separator: true },
  {
    icon: AlignLeft,
    label: 'Align Left',
    action: (ref) => runOnView(ref, (v) => setAlignment(v, 'left')),
  },
  {
    icon: AlignCenter,
    label: 'Align Center',
    action: (ref) => runOnView(ref, (v) => setAlignment(v, 'center')),
  },
  {
    icon: AlignRight,
    label: 'Align Right',
    action: (ref) => runOnView(ref, (v) => setAlignment(v, 'right')),
  },
  { separator: true },
  {
    icon: Link,
    label: 'Insert Link',
    shortcut: 'Cmd+K',
    action: (ref) => runOnView(ref, insertLink),
  },
  {
    icon: Image,
    label: 'Insert Image',
    action: (ref) => runOnView(ref, insertImage),
  },
];

function FormatToolbar({ editorRef }: FormatToolbarProps) {
  return (
    <div className="flex items-center gap-0.5">
      {ITEMS.map((item, i) => {
        if (item.separator) {
          return (
            <div
              key={`sep-${i}`}
              className="w-px h-4 bg-border-subtle mx-1"
            />
          );
        }

        const { icon: Icon, label, shortcut, action } = item;
        return (
          <button
            key={label}
            onClick={() => action(editorRef)}
            title={shortcut ? `${label} (${shortcut})` : label}
            className="flex items-center justify-center w-7 h-7 rounded text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-colors duration-150"
          >
            <Icon size={15} />
          </button>
        );
      })}
    </div>
  );
}

export default FormatToolbar;
