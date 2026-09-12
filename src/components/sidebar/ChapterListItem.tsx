import { useState, useRef, useEffect } from 'react';
import type { Chapter } from '@/types/project';

interface ChapterListItemProps {
  chapter: Chapter;
  index: number;
  isActive: boolean;
  onClick: () => void;
  onRename: (newTitle: string) => void;
  onDragStart: (index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDrop: (index: number) => void;
  onDragEnd: () => void;
  isDragOver: boolean;
  draggable: boolean;
  wordCount: number;
  wordGoal: number;
}

function ChapterListItem({ chapter, index, isActive, onClick, onRename, onDragStart, onDragOver, onDrop, onDragEnd, isDragOver, draggable, wordCount, wordGoal }: ChapterListItemProps) {
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

  const chapterNum = index + 1;
  const isFinished = chapter.status === 'finished';
  const progress = wordGoal > 0 ? Math.min(100, Math.round((wordCount / wordGoal) * 100)) : 0;

  return (
    <button
      onClick={onClick}
      onDoubleClick={handleDoubleClick}
      draggable={draggable && !editing}
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'move';
        onDragStart(index);
      }}
      onDragOver={(e) => onDragOver(e, index)}
      onDrop={() => onDrop(index)}
      onDragEnd={onDragEnd}
      className={[
        'w-full text-left px-3 py-1.5 text-sm font-sans cursor-pointer',
        'border-l-2 transition-colors duration-150',
        isActive
          ? 'text-text-primary bg-bg-tertiary border-accent'
          : 'text-text-secondary border-transparent hover:text-text-primary hover:bg-bg-tertiary',
        isDragOver ? 'border-t-2 border-t-accent' : '',
      ].join(' ')}
      title={`${chapter.title} (${wordCount}/${wordGoal})`}
    >
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-text-tertiary font-medium w-4 text-right shrink-0">
          {chapterNum}
        </span>
        <span className="truncate">{chapter.title}</span>
        {isFinished && (
          <span className="ml-auto text-success shrink-0 text-[10px]">&#10003;</span>
        )}
      </div>
      {wordGoal > 0 && !isFinished && (
        <div className="mt-1 ml-6 h-1 rounded-full bg-border-subtle overflow-hidden">
          <div
            className="h-full rounded-full bg-accent transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </button>
  );
}

export default ChapterListItem;
