import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useProjectStore } from '@/stores/projectStore';
import { restoreFile } from '@/lib/versioning';
import CommitListItem from './CommitListItem';
import CommitDiffView from './CommitDiffView';
import RestoreConfirmModal from './RestoreConfirmModal';
import type { Commit } from '@/types/git';

function CommitList() {
  const { t } = useTranslation();
  const commits = useProjectStore((s) => s.commits);
  const activeChapterPath = useProjectStore((s) => s.activeChapterPath);
  const currentProject = useProjectStore((s) => s.currentProject);
  const [diffCommit, setDiffCommit] = useState<Commit | null>(null);
  const [modalCommit, setModalCommit] = useState<Commit | null>(null);
  const [restoring, setRestoring] = useState(false);

  async function handleRestore() {
    if (!modalCommit || !currentProject || !activeChapterPath) return;
    setRestoring(true);

    const store = useProjectStore.getState();

    await store.flushAutosave?.();

    const result = await restoreFile(currentProject.rootPath, activeChapterPath, modalCommit.hash);

    if (!result.ok) {
      console.error('Restore failed:', result.error);
      setRestoring(false);
      setModalCommit(null);
      return;
    }

    const { commit: newCommit, content: restoredContent } = result.value;

    store.updateContent(restoredContent);
    store.syncAutosaveSaved?.(restoredContent);
    store.prependCommit(newCommit);
    store.incrementEditorVersion();

    setRestoring(false);
    setModalCommit(null);
    setDiffCommit(null);
  }

  if (!activeChapterPath) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-4 gap-4">
        <svg width="56" height="56" viewBox="0 0 56 56" fill="none" className="text-border-default" aria-hidden="true">
          {/* Document outline */}
          <rect x="12" y="6" width="32" height="44" rx="3" stroke="currentColor" strokeWidth="1.5" fill="none" />
          <line x1="18" y1="16" x2="38" y2="16" stroke="currentColor" strokeWidth="1" opacity="0.3" />
          <line x1="18" y1="22" x2="34" y2="22" stroke="currentColor" strokeWidth="1" opacity="0.3" />
          <line x1="18" y1="28" x2="36" y2="28" stroke="currentColor" strokeWidth="1" opacity="0.3" />
          {/* Cursor arrow */}
          <path d="M26 36 L30 40 L28 40 L28 46 L24 46 L24 40 L22 40 Z" stroke="currentColor" strokeWidth="1.2" fill="none" opacity="0.5" />
        </svg>
        <div className="flex flex-col items-center gap-1">
          <p className="text-xs text-text-secondary text-center font-medium">{t('versions.noActiveChapter')}</p>
          <p className="text-[11px] text-text-tertiary text-center leading-relaxed max-w-[180px]">{t('versions.noActiveChapterHint')}</p>
        </div>
      </div>
    );
  }

  if (commits.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-4 gap-4">
        <svg width="56" height="56" viewBox="0 0 56 56" fill="none" className="text-border-default" aria-hidden="true">
          {/* Git timeline */}
          <line x1="28" y1="8" x2="28" y2="48" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.4" />
          <circle cx="28" cy="16" r="4" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.3" />
          <circle cx="28" cy="28" r="4" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.3" />
          <circle cx="28" cy="40" r="4" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.3" />
        </svg>
        <div className="flex flex-col items-center gap-1">
          <p className="text-xs text-text-secondary text-center font-medium">{t('versions.noHistory')}</p>
          <p className="text-[11px] text-text-tertiary text-center leading-relaxed max-w-[180px]">{t('versions.noHistoryHint')}</p>
        </div>
      </div>
    );
  }

  if (diffCommit) {
    return (
      <>
        <CommitDiffView
          commit={diffCommit}
          onClose={() => setDiffCommit(null)}
          onRestore={() => { setModalCommit(diffCommit); }}
        />
        {modalCommit && (
          <RestoreConfirmModal
            commit={modalCommit}
            loading={restoring}
            onConfirm={handleRestore}
            onClose={() => setModalCommit(null)}
          />
        )}
      </>
    );
  }

  return (
    <>
      <div className="flex-1 overflow-y-auto">
        {commits.map((commit, i) => (
          <CommitListItem
            key={commit.hash}
            commit={commit}
            isCurrent={i === 0}
            onClick={() => setDiffCommit(commit)}
          />
        ))}
      </div>

      {modalCommit && (
        <RestoreConfirmModal
          commit={modalCommit}
          loading={restoring}
          onConfirm={handleRestore}
          onClose={() => setModalCommit(null)}
        />
      )}
    </>
  );
}

export default CommitList;
