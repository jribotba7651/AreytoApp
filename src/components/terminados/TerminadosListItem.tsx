import type { ClosedChapter } from '@/types/project';
import { formatRelativeTime } from '@/lib/format-relative-time';

interface TerminadosListItemProps {
  chapter: ClosedChapter;
}

function TerminadosListItem({ chapter }: TerminadosListItemProps) {
  return (
    <div className="border border-border-default rounded p-4 mb-3">
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
