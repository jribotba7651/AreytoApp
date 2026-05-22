import type { ClosedChapter } from '@/types/project';
import { formatRelativeTime } from '@/lib/format-relative-time';

interface TerminadosListItemProps {
  chapter: ClosedChapter;
  onClick: (chapter: ClosedChapter) => void;
}

function TerminadosListItem({ chapter, onClick }: TerminadosListItemProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onClick(chapter)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick(chapter); }}
      className="border border-border-default rounded p-4 mb-3 cursor-pointer hover:bg-bg-tertiary transition-colors duration-150"
    >
      <p className="font-serif text-base text-text-primary">
        {chapter.filename.replace(/\.md$/, '')}
      </p>
      <p className="font-mono text-xs text-text-tertiary mt-1">
        <span>{chapter.tagName}</span>
        <span className="mx-2 text-border-default">·</span>
        <span>{formatRelativeTime(chapter.closedAt)}</span>
      </p>
    </div>
  );
}

export default TerminadosListItem;
