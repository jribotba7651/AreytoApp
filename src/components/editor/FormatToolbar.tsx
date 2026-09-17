import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link,
  Image,
  List,
  ListOrdered,
  Quote,
  Eraser,
  Heading1,
  Heading2,
  Heading3,
} from 'lucide-react';
import type { ChapterEditorHandle } from './ChapterEditor';
import {
  toggleWrap,
  insertLink,
  insertImage,
  setAlignment,
  toggleHeading,
  toggleList,
  toggleBlockquote,
  clearFormatting,
} from './markdown-format';
import { useState } from 'react';

interface FormatToolbarProps {
  editorRef: React.RefObject<ChapterEditorHandle | null>;
}

interface ToolbarButton {
  type: 'button';
  icon: React.ElementType;
  label: string;
  shortcut?: string;
  action: (editorRef: React.RefObject<ChapterEditorHandle | null>) => void;
}

interface ToolbarDropdown {
  type: 'dropdown';
  label: string;
  items: { label: string; action: () => void }[];
}

interface ToolbarSeparator {
  type: 'separator';
}

type ToolbarItem = ToolbarButton | ToolbarDropdown | ToolbarSeparator;

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
    type: 'dropdown',
    label: 'Heading',
    items: [
      { label: 'Normal', action: () => {} }, // Need a way to pass editorRef here...
      { label: 'H1', action: () => {} },
      { label: 'H2', action: () => {} },
      { label: 'H3', action: () => {} },
    ],
  },
  { type: 'separator' },
  {
    type: 'button',
    icon: Bold,
    label: 'Bold',
    shortcut: 'Cmd+B',
    action: (ref) => runOnView(ref, (v) => toggleWrap(v, '**')),
  },
  {
    type: 'button',
    icon: Italic,
    label: 'Italic',
    shortcut: 'Cmd+I',
    action: (ref) => runOnView(ref, (v) => toggleWrap(v, '*')),
  },
  {
    type: 'button',
    icon: Underline,
    label: 'Underline',
    shortcut: 'Cmd+U',
    action: (ref) => runOnView(ref, (v) => toggleWrap(v, '<u>', '</u>')),
  },
  { type: 'separator' },
  {
    type: 'button',
    icon: List,
    label: 'Bullet List',
    action: (ref) => runOnView(ref, (v) => toggleList(v, 'bullet')),
  },
  {
    type: 'button',
    icon: ListOrdered,
    label: 'Numbered List',
    action: (ref) => runOnView(ref, (v) => toggleList(v, 'numbered')),
  },
  {
    type: 'button',
    icon: Quote,
    label: 'Blockquote',
    action: (ref) => runOnView(ref, toggleBlockquote),
  },
  { type: 'separator' },
  {
    type: 'button',
    icon: Eraser,
    label: 'Clear Formatting',
    action: (ref) => runOnView(ref, clearFormatting),
  },
  { type: 'separator' },
  {
    type: 'button',
    icon: AlignLeft,
    label: 'Align Left',
    action: (ref) => runOnView(ref, (v) => setAlignment(v, 'left')),
  },
  {
    type: 'button',
    icon: AlignCenter,
    label: 'Align Center',
    action: (ref) => runOnView(ref, (v) => setAlignment(v, 'center')),
  },
  {
    type: 'button',
    icon: AlignRight,
    label: 'Align Right',
    action: (ref) => runOnView(ref, (v) => setAlignment(v, 'right')),
  },
  { type: 'separator' },
  {
    type: 'button',
    icon: Link,
    label: 'Insert Link',
    shortcut: 'Cmd+K',
    action: (ref) => runOnView(ref, insertLink),
  },
  {
    type: 'button',
    icon: Image,
    label: 'Insert Image',
    action: (ref) => runOnView(ref, insertImage),
  },
];

function FormatToolbar({ editorRef }: FormatToolbarProps) {
  const [isHeadingOpen, setIsHeadingOpen] = useState(false);

  return (
    <div className="flex items-center gap-1 p-1">
      {ITEMS.map((item, i) => {
        if (item.type === 'separator') {
          return (
            <div
              key={`sep-${i}`}
              className="w-px h-6 bg-border-default mx-1"
            />
          );
        }

        if (item.type === 'dropdown') {
          return (
            <div key={item.label} className="relative">
              <button
                onClick={() => setIsHeadingOpen(!isHeadingOpen)}
                className="flex items-center gap-1 px-2 h-8 rounded hover:bg-bg-tertiary text-text-primary"
              >
                {item.label}
              </button>
              {isHeadingOpen && (
                <div className="absolute top-full left-0 mt-1 w-32 bg-bg-secondary border border-border-default rounded shadow-sm z-50">
                  {item.items.map((subItem) => {
                    const iconMap: Record<string, React.ElementType> = {
                      'H1': Heading1,
                      'H2': Heading2,
                      'H3': Heading3,
                    };
                    const Icon = iconMap[subItem.label];

                    return (
                      <button
                        key={subItem.label}
                        onClick={() => {
                          setIsHeadingOpen(false);
                          const levelChar = subItem.label[1];
                          const level = levelChar ? (parseInt(levelChar) as 1 | 2 | 3) : null;
                          runOnView(editorRef, (v) => toggleHeading(v, level));
                        }}
                        className="flex items-center gap-2 w-full text-left px-3 py-2 hover:bg-bg-tertiary"
                      >
                        {Icon && <Icon size={16} />}
                        {subItem.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        }

        const { icon: Icon, label, shortcut, action } = item;
        return (
          <button
            key={label}
            onClick={() => action(editorRef)}
            title={shortcut ? `${label} (${shortcut})` : label}
            className="flex items-center justify-center w-8 h-8 rounded text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-colors duration-150"
          >
            <Icon size={20} />
          </button>
        );
      })}
    </div>
  );
}

export default FormatToolbar;
