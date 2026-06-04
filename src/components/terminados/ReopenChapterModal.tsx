import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ClosedChapter, Project } from '@/types/project';
import { formatRelativeTime } from '@/lib/format-relative-time';
import { performReopenChapter } from '@/lib/reopen-chapter-flow';

interface ReopenChapterModalProps {
  chapter: ClosedChapter;
  project: Project;
  onClose: () => void;
}

function ReopenChapterModal({ chapter, project, onClose }: ReopenChapterModalProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleConfirm() {
    setLoading(true);
    setError('');

    const result = await performReopenChapter(project, chapter);

    if (!result.ok) {
      const errorKeyMap: Record<string, string> = {
        WriteFailed: 'modal.reopenChapter.errorWriteFailed',
        PathNotFound:'modal.reopenChapter.errorPathNotFound',
        ReadFailed:  'modal.reopenChapter.errorReadFailed',
      };
      setError(t(errorKeyMap[result.error.kind] ?? 'modal.reopenChapter.errorGeneric'));
      setLoading(false);
      return;
    }

    setLoading(false);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 bg-black/60"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-bg-tertiary border border-border-default rounded-lg p-6 w-full max-w-md mx-4">
        <h2 className="font-serif text-lg font-semibold text-text-primary mb-2">
          {t('modal.reopenChapter.title')}
        </h2>
        <p className="text-sm text-text-secondary mb-4">
          {t('modal.reopenChapter.bodyPart1')}
          <strong className="text-text-primary">{chapter.filename}</strong>
          {t('modal.reopenChapter.bodyPart2')}
          <code className="text-xs text-text-tertiary">capitulos/</code>
          {t('modal.reopenChapter.bodyPart3')}
          <code className="text-xs text-text-tertiary">{chapter.tagName}</code>
          {t('modal.reopenChapter.bodyPart4')}
        </p>

        <div className="bg-bg-secondary border border-border-subtle rounded p-3 mb-4 text-xs font-mono text-text-tertiary space-y-1">
          <p>{chapter.filename}</p>
          <p>{chapter.tagName} · {formatRelativeTime(chapter.closedAt)}</p>
        </div>

        {error && <p className="text-xs text-error mb-4">{error}</p>}

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary disabled:opacity-40 transition-colors duration-150"
          >
            {t('modal.reopenChapter.cancel')}
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="px-4 py-2 text-sm bg-accent-muted text-text-primary rounded hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150"
          >
            {loading ? t('modal.reopenChapter.reopening') : t('modal.reopenChapter.reopen')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ReopenChapterModal;
