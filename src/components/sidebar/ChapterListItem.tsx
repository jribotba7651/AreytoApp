import { useState, useRef, useEffect } from 'react';
import type { Chapter } from '@/types/project';

interface ChapterListItemProps {
  chapter: Chapter;
  isActive: boolean;
  onClick: () => void;
  onRename: (newTitle: string) => void;
}

function ChapterListItem({ chapter, isActive, onClick, onRename }: ChapterListItemProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(chapter.title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  function handleDoubleClick(e: React.MouseEvent) {
    e.preventDefault();
    setDraft(chapter.title);
    setEditing(true);
  }

  function commit() {
    setEditing(false);
    const trimmed = draft.trim();
    if (trimmed && trimmed !== chapter.title) {
      onRename(trimmed);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      commit();
    } else if (e.key === 'Escape') {
      setEditing(false);
      setDraft(chapter.title);
    }
  }

  if (editing) {
    return (
      <div className="px-3 py-1.5 border-l-2 border-accent">
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={handleKeyDown}
          className="w-full text-sm font-sans bg-bg-editor text-text-primary border border-border-default rounded px-1.5 py-0.5 outline-none focus:border-accent"
        />
      </div>
    );
  }

  return (
    <button
      onClick={onClick}
      onDoubleClick={handleDoubleClick}
      className={[
        'w-full text-left px-3 py-2 text-sm font-sans truncate cursor-pointer',
        'border-l-2 transition-colors duration-150',
        isActive
          ? 'text-text-primary bg-bg-tertiary border-accent'
          : 'text-text-secondary border-transparent hover:text-text-primary hover:bg-bg-tertiary',
      ].join(' ')}
      title={chapter.title}
    >
      {chapter.title}
    </button>
  );
}

export default ChapterListItem;
