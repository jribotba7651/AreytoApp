import type { Commit } from '@/types/git';

interface CommitListItemProps {
  commit: Commit;
}

function formatRelativeTime(isoTimestamp: string): string {
  const diff = Date.now() - new Date(isoTimestamp).getTime();
  const sec = Math.floor(diff / 1000);
  const min = Math.floor(sec / 60);
  const hour = Math.floor(min / 60);
  const day = Math.floor(hour / 24);

  if (sec < 60) return 'hace unos segundos';
  if (min < 60) return `hace ${min} minuto${min !== 1 ? 's' : ''}`;
  if (hour < 24) return `hace ${hour} hora${hour !== 1 ? 's' : ''}`;
  if (day < 7) return `hace ${day} día${day !== 1 ? 's' : ''}`;

  return new Date(isoTimestamp).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
  });
}

function CommitListItem({ commit }: CommitListItemProps) {
  return (
    <div className="px-3 py-2 border-b border-border-subtle last:border-b-0 hover:bg-bg-tertiary cursor-pointer transition-colors duration-150">
      <p className="text-xs text-text-secondary truncate leading-snug">{commit.message}</p>
      <p className="text-xs text-text-tertiary font-mono mt-0.5">
        <span>{commit.shortHash}</span>
        <span className="mx-1 text-border-default">·</span>
        <span>{formatRelativeTime(commit.timestamp)}</span>
      </p>
    </div>
  );
}

export default CommitListItem;
