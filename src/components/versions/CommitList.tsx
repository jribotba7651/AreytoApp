import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useProjectStore } from '@/stores/projectStore';
import { restoreFile } from '@/lib/versioning';
import CommitListItem from './CommitListItem';
import RestoreConfirmModal from './RestoreConfirmModal';
import type { Commit } from '@/types/git';

function CommitList() {
  const { t } = useTranslation();
  const commits = useProjectStore((s) => s.commits);
  const activeChapterPath = useProjectStore((s) => s.activeChapterPath);
  const currentProject = useProjectStore((s) => s.currentProject);
  const [modalCommit, setModalCommit] = useState<Commit | null>(null);
  const [restoring, setRestoring] = useState(false);

  async function handleRestore() {
    if (!modalCommit || !currentProject || !activeChapterPath) return;
    setRestoring(true);

    const store = useProjectStore.getState();

    // 1. Flush pending autosave
    await store.flushAutosave?.();

    // 2. Restore file content at commit
    const result = await restoreFile(currentProject.rootPath, activeChapterPath, modalCommit.hash);

    if (!result.ok) {
      console.error('Restore failed:', result.error);
      setRestoring(false);
      setModalCommit(null);
      return;
    }

    const { commit: newCommit, content: restoredContent } = result.value;

    // 3. Update store: content + sync autosave ref + remount editor
    store.updateContent(restoredContent);
    store.syncAutosaveSaved?.(restoredContent);
    store.prependCommit(newCommit);
    store.incrementEditorVersion();

    setRestoring(false);
    setModalCommit(null);
  }

  if (!activeChapterPath) {
    return (
      <div className="flex-1 flex items-center justify-center px-3">
        <p className="text-xs text-text-tertiary text-center">{t('versions.noActiveChapter')}</p>
      </div>
    );
  }

  if (commits.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center px-3">
        <p className="text-xs text-text-tertiary text-center">{t('versions.noHistory')}</p>
      </div>
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
            onClick={() => setModalCommit(commit)}
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
