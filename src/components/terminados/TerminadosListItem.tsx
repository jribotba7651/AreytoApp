import { useTranslation } from 'react-i18next';
import { CheckCircle2 } from 'lucide-react';
import type { ClosedChapter } from '@/types/project';
import { formatRelativeTime } from '@/lib/format-relative-time';

interface TerminadosListItemProps {
  chapter: ClosedChapter;
  onClick: (chapter: ClosedChapter) => void;
}

function TerminadosListItem({ chapter, onClick }: TerminadosListItemProps) {
  const { t } = useTranslation();

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`${chapter.title} - ${t('finished.completed')}`}
      onClick={() => onClick(chapter)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(chapter); } }}
      className="border border-border-default rounded-lg p-4 mb-3 cursor-pointer hover:bg-bg-tertiary transition-colors duration-150 flex items-start gap-3"
    >
      <CheckCircle2 size={18} className="text-success shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="font-serif text-base text-text-primary truncate">
          {chapter.title}
        </p>
        <div className="flex items-center gap-2 mt-1 text-xs text-text-tertiary font-mono">
          <span>{chapter.tagName}</span>
          <span className="text-border-default">·</span>
          <span>{formatRelativeTime(chapter.closedAt)}</span>
          <span className="text-border-default">·</span>
          <span>{t('finished.wordCount', { count: chapter.wordCount })}</span>
        </div>
      </div>
    </div>
  );
}

export default TerminadosListItem;
