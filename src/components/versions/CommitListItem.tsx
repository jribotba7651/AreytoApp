import type { Commit } from '@/types/git';
import { formatRelativeTime } from '@/lib/format-relative-time';

interface CommitListItemProps {
  commit: Commit;
  isCurrent: boolean;
  onClick: () => void;
}

function CommitListItem({ commit, isCurrent, onClick }: CommitListItemProps) {
  return (
    <div
      onClick={isCurrent ? undefined : onClick}
      className={[
        'px-3 py-2 border-b border-border-subtle last:border-b-0 transition-colors duration-150',
        isCurrent
          ? 'opacity-50 cursor-default'
          : 'cursor-pointer hover:bg-bg-tertiary',
      ].join(' ')}
    >
      <p className="text-xs text-text-secondary truncate leading-snug">{commit.message}</p>
      <p className="text-xs text-text-tertiary font-mono mt-0.5">
        <span>{commit.shortHash}</span>
        <span className="mx-1 text-border-default">·</span>
        <span>{formatRelativeTime(commit.timestamp)}</span>
        {isCurrent && <span className="ml-1 text-accent">(actual)</span>}
      </p>
    </div>
  );
}

export default CommitListItem;
