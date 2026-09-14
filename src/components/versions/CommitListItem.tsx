import { useTranslation } from 'react-i18next';
import { GitCommitHorizontal, RotateCcw } from 'lucide-react';
import type { Commit } from '@/types/git';
import { formatRelativeTime } from '@/lib/format-relative-time';

interface CommitListItemProps {
  commit: Commit;
  isCurrent: boolean;
  onClick: () => void;
}

function CommitListItem({ commit, isCurrent, onClick }: CommitListItemProps) {
  const { t } = useTranslation();
  const isRestore = commit.message.startsWith('restore:');

  return (
    <div
      role={isCurrent ? undefined : 'button'}
      tabIndex={isCurrent ? undefined : 0}
      aria-label={isCurrent ? undefined : t('versions.viewDiff')}
      onClick={isCurrent ? undefined : onClick}
      onKeyDown={isCurrent ? undefined : (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }}
      className={[
        'px-3 py-2.5 border-b border-border-subtle last:border-b-0 transition-colors duration-150 flex items-start gap-2',
        isCurrent
          ? 'cursor-default'
          : 'cursor-pointer hover:bg-bg-tertiary',
      ].join(' ')}
    >
      <span className={`shrink-0 mt-0.5 ${isCurrent ? 'text-accent' : 'text-text-tertiary'}`}>
        {isRestore ? <RotateCcw size={12} /> : <GitCommitHorizontal size={12} />}
      </span>
      <div className="flex-1 min-w-0">
        <p className={`text-xs truncate leading-snug ${isCurrent ? 'text-text-primary font-medium' : 'text-text-secondary'}`}>
          {commit.message}
        </p>
        <p className="text-xs text-text-tertiary font-mono mt-0.5">
          <span>{commit.shortHash}</span>
          <span className="mx-1 text-border-default">·</span>
          <span>{formatRelativeTime(commit.timestamp)}</span>
          {isCurrent && (
            <span className="ml-1.5 text-[10px] bg-accent/10 text-accent px-1.5 py-px rounded-full">
              {t('versions.current')}
            </span>
          )}
        </p>
      </div>
    </div>
  );
}

export default CommitListItem;
