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
  chapterTags?: string[];
  onTagsChange: (tags: string[]) => void;
  onWordGoalChange: (goal: number | undefined) => void;
  chapterColor?: ChapterColor;
  onColorChange: (color: ChapterColor | null) => void;
  lastExportTimestamp?: string;
  isLocked?: boolean;
  showOutline?: boolean;
  outline?: { level: number; text: string }[];
}

function ChapterListItem({ chapter, index, isActive, onClick, onRename, onDragStart, onDragOver, onDrop, onDragEnd, isDragOver, draggable, wordCount, wordGoal, chapterTags, onTagsChange, onWordGoalChange, chapterColor, onColorChange, lastExportTimestamp, isLocked, showOutline, outline }: ChapterListItemProps) {
  const { t } = useTranslation();

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(chapter.title);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [tagDraft, setTagDraft] = useState('');
  const [goalDraft, setGoalDraft] = useState(wordGoal.toString());
  const project = useProjectStore((s) => s.currentProject);
  const [lastCommitDate, setLastCommitDate] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!project) return;
    listCommitsForFile(project.rootPath, chapter.path, 1).then((res) => {
      if (res.ok && res.value && res.value.length > 0 && res.value[0]?.timestamp) {
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
    if (!showContextMenu) return;
    function handleClickOutside(e: MouseEvent) {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setShowContextMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showContextMenu]);

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
    setShowContextMenu(true);
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
            {showOutline && outline && outline.length > 0 ? (
                <div className="flex flex-col w-full text-left truncate">
                    <span className="truncate text-text-primary font-bold">{outline[0]?.text}</span>
                    {outline.slice(1).map((item, i) => {
                        if (!item) return null;
                        return (
                            <span key={i} className={`truncate text-text-secondary text-[10px] ${item.level === 2 ? 'pl-2' : ''}`}>
                                {item.text}
                            </span>
                        );
                    })}
                </div>
            ) : (
                <span className="truncate">{chapter.title}</span>
            )}
            {isRecentlyExported && (
              <UploadCloud size={12} className="ml-auto text-text-tertiary shrink-0" />
            )}
          </div>
          {chapterTags && chapterTags.length > 0 && (
            <div className="flex flex-wrap gap-1 ml-6">
              {chapterTags.map(tag => (
                <span key={tag} className="text-[9px] bg-bg-tertiary text-text-secondary px-1 rounded-sm">
                  {tag}
                </span>
              ))}
            </div>
          )}
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

      {showContextMenu && (
        <div
          ref={contextMenuRef}
          className="absolute left-8 top-0 z-40 bg-bg-tertiary border border-border-default rounded-lg p-3 shadow-lg min-w-[200px]"
        >
          <p className="text-[10px] text-text-tertiary mb-2 font-bold uppercase">{t('sidebar.chapterSettings')}</p>
          
          <div className="mb-3">
            <p className="text-[10px] text-text-tertiary mb-1">{t('sidebar.chapterColor')}</p>
            <div className="flex items-center gap-1.5">
              {CHAPTER_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => onColorChange(chapterColor === color ? null : color)}
                  className={[
                    'w-5 h-5 rounded-full border-2 transition-transform duration-150 hover:scale-110',
                    chapterColor === color ? 'border-text-primary' : 'border-transparent',
                  ].join(' ')}
                  style={{ backgroundColor: CHAPTER_COLOR_MAP[color] }}
                />
              ))}
            </div>
          </div>

          <div className="mb-3">
            <p className="text-[10px] text-text-tertiary mb-1">Etiquetas (separadas por comas)</p>
            <input 
              value={tagDraft}
              onChange={(e) => setTagDraft(e.target.value)}
              onBlur={() => onTagsChange(tagDraft.split(',').map(t => t.trim()).filter(t => t !== ''))}
              className="w-full text-xs p-1 bg-bg-editor rounded border border-border-default"
              placeholder="accion, drama..."
            />
          </div>

          <div>
            <p className="text-[10px] text-text-tertiary mb-1">Objetivo de palabras</p>
            <input 
              type="number"
              value={goalDraft}
              onChange={(e) => setGoalDraft(e.target.value)}
              onBlur={() => onWordGoalChange(parseInt(goalDraft) || undefined)}
              className="w-full text-xs p-1 bg-bg-editor rounded border border-border-default"
              placeholder="0"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default ChapterListItem;
