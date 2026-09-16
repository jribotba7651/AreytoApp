import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { UploadCloud, Lock } from 'lucide-react';
import type { Chapter, ChapterColor } from '@/types/project';
import { CHAPTER_COLORS, CHAPTER_COLOR_MAP } from '@/types/project';
import { listCommitsForFile } from '@/lib/versioning';
import { useProjectStore } from '@/stores/projectStore';
import { formatDate } from '@/lib/date-utils';

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
  chapterColor?: ChapterColor;
  onColorChange: (color: ChapterColor | null) => void;
  lastExportTimestamp?: string;
  isLocked?: boolean;
}

function ChapterListItem({ chapter, index, isActive, onClick, onRename, onDragStart, onDragOver, onDrop, onDragEnd, isDragOver, draggable, wordCount, wordGoal, chapterColor, onColorChange, lastExportTimestamp, isLocked }: ChapterListItemProps) {
  const { t } = useTranslation();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(chapter.title);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const project = useProjectStore((s) => s.currentProject);
  const [lastCommitDate, setLastCommitDate] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const colorPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!project) return;
    listCommitsForFile(project.rootPath, chapter.path, 1).then((res) => {
      if (res.ok && res.value.length > 0) {
        setLastCommitDate(formatDate(res.value[0].timestamp));
      }
    });
  }, [chapter.path, project]);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  useEffect(() => {
    if (!showColorPicker) return;
    function handleClickOutside(e: MouseEvent) {
      if (colorPickerRef.current && !colorPickerRef.current.contains(e.target as Node)) {
        setShowColorPicker(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showColorPicker]);

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

  function handleContextMenu(e: React.MouseEvent) {
    e.preventDefault();
    setShowColorPicker(true);
  }

  const chapterNum = index + 1;
  const isFinished = chapter.status === 'finished';
  const progress = wordGoal > 0 ? Math.min(100, Math.round((wordCount / wordGoal) * 100)) : 0;
  
  const isRecentlyExported = lastExportTimestamp 
    ? new Date(lastExportTimestamp).getTime() > Date.now() - 24 * 60 * 60 * 1000 
    : false;

  return (
    <div className="relative">
      <button
        onClick={onClick}
        onDoubleClick={handleDoubleClick}
        onContextMenu={handleContextMenu}
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
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-text-tertiary font-medium w-4 text-right shrink-0">
              {chapterNum}
            </span>
            <span className={`w-2 h-2 rounded-full shrink-0 ${chapter.status === 'finished' ? 'bg-success' : 'bg-info'}`} />
            {chapterColor && (
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: CHAPTER_COLOR_MAP[chapterColor] }}
              />
            )}
            {isLocked && (
              <Lock size={12} className="text-text-tertiary shrink-0" />
            )}
            <span className="truncate">{chapter.title}</span>
            {isRecentlyExported && (
              <UploadCloud size={12} className="ml-auto text-text-tertiary shrink-0" />
            )}
          </div>
          {lastCommitDate && (
            <div className="text-[10px] text-text-tertiary ml-6">
              {lastCommitDate}
            </div>
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

      {showColorPicker && (
        <div
          ref={colorPickerRef}
          className="absolute left-8 top-0 z-40 bg-bg-tertiary border border-border-default rounded-lg p-2 shadow-sm"
        >
          <p className="text-[10px] text-text-tertiary mb-1.5 px-0.5">{t('sidebar.chapterColor')}</p>
          <div className="flex items-center gap-1.5">
            {CHAPTER_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => {
                  onColorChange(chapterColor === color ? null : color);
                  setShowColorPicker(false);
                }}
                className={[
                  'w-5 h-5 rounded-full border-2 transition-transform duration-150 hover:scale-110',
                  chapterColor === color ? 'border-text-primary' : 'border-transparent',
                ].join(' ')}
                style={{ backgroundColor: CHAPTER_COLOR_MAP[color] }}
                title={t(`sidebar.colors.${color}`)}
              />
            ))}
            {chapterColor && (
              <button
                onClick={() => {
                  onColorChange(null);
                  setShowColorPicker(false);
                }}
                className="w-5 h-5 rounded-full border border-border-default bg-bg-editor flex items-center justify-center text-text-tertiary hover:text-text-primary transition-colors duration-150"
                title={t('sidebar.colorNone')}
              >
                <span className="text-[10px]">&times;</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ChapterListItem;
