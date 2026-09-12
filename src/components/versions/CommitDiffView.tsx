import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, RotateCcw } from 'lucide-react';
import { useProjectStore } from '@/stores/projectStore';
import { readFileAtCommit } from '@/lib/versioning';
import { computeLineDiff } from '@/lib/line-diff';
import type { DiffLine } from '@/lib/line-diff';
import type { Commit } from '@/types/git';

interface CommitDiffViewProps {
  commit: Commit;
  onClose: () => void;
  onRestore: () => void;
}

function CommitDiffView({ commit, onClose, onRestore }: CommitDiffViewProps) {
  const { t } = useTranslation();
  const currentProject = useProjectStore((s) => s.currentProject);
  const activeChapterPath = useProjectStore((s) => s.activeChapterPath);
  const activeChapterContent = useProjectStore((s) => s.activeChapterContent);
  const [diff, setDiff] = useState<DiffLine[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!currentProject || !activeChapterPath) return;

    async function loadDiff() {
      const result = await readFileAtCommit(
        currentProject!.rootPath,
        activeChapterPath!,
        commit.hash
      );
      if (!result.ok) {
        setError(true);
        return;
      }
      const lines = computeLineDiff(activeChapterContent ?? '', result.value);
      setDiff(lines);
    }

    loadDiff();
  }, [commit.hash, currentProject, activeChapterPath, activeChapterContent]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border-subtle">
        <p className="text-xs text-text-secondary truncate flex-1">
          {commit.shortHash} · {commit.message}
        </p>
        <button
          onClick={onRestore}
          className="p-1 text-text-tertiary hover:text-text-primary transition-colors duration-150"
          title={t('modal.restoreVersion.restore')}
        >
          <RotateCcw size={14} />
        </button>
        <button
          onClick={onClose}
          className="p-1 text-text-tertiary hover:text-text-primary transition-colors duration-150"
        >
          <X size={14} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-1 font-mono text-xs leading-relaxed">
        {error && (
          <p className="text-error text-center py-4">{t('versions.diffError')}</p>
        )}
        {!error && !diff && (
          <p className="text-text-tertiary text-center py-4">{t('common.loading')}</p>
        )}
        {diff && diff.map((line, i) => (
          <div
            key={i}
            className={[
              'px-2 py-px whitespace-pre-wrap break-all',
              line.kind === 'added' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : '',
              line.kind === 'removed' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' : '',
              line.kind === 'same' ? 'text-text-tertiary' : '',
            ].join(' ')}
          >
            <span className="select-none mr-2 inline-block w-3 text-right">
              {line.kind === 'added' ? '+' : line.kind === 'removed' ? '-' : ' '}
            </span>
            {line.text || '\u00A0'}
          </div>
        ))}
      </div>
    </div>
  );
}

export default CommitDiffView;
