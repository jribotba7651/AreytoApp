import type { ClosedChapter } from '@/types/project';

interface TerminadosListItemProps {
  chapter: ClosedChapter;
}

function formatRelativeDate(isoTimestamp: string): string {
  const diff = Date.now() - new Date(isoTimestamp).getTime();
  const min = Math.floor(diff / 60000);
  const hour = Math.floor(min / 60);
  const day = Math.floor(hour / 24);

  if (min < 1) return 'hace unos segundos';
  if (min < 60) return `hace ${min} minuto${min !== 1 ? 's' : ''}`;
  if (hour < 24) return `hace ${hour} hora${hour !== 1 ? 's' : ''}`;
  if (day < 7) return `hace ${day} día${day !== 1 ? 's' : ''}`;

  return new Date(isoTimestamp).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
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
        <span>{formatRelativeDate(chapter.closedAt)}</span>
      </p>
    </div>
  );
}

export default TerminadosListItem;
