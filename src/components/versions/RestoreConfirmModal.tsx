import { useTranslation } from 'react-i18next';
import type { Commit } from '@/types/git';

interface RestoreConfirmModalProps {
  commit: Commit;
  loading: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

function formatDate(isoTimestamp: string, locale: string): string {
  return new Date(isoTimestamp).toLocaleString(locale, {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function RestoreConfirmModal({ commit, loading, onConfirm, onClose }: RestoreConfirmModalProps) {
  const { t, i18n } = useTranslation();

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 bg-black/60"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-bg-tertiary border border-border-default rounded-lg p-6 w-full max-w-md mx-4">
        <h2 className="text-base font-medium text-text-primary mb-1">
          {t('modal.restoreVersion.title')}
        </h2>
        <p className="text-sm text-text-secondary mb-4">
          {t('modal.restoreVersion.description')}
        </p>

        <div className="bg-bg-secondary rounded border border-border-subtle p-3 mb-4">
          <p className="text-sm text-text-primary truncate">{commit.message}</p>
          <p className="text-xs text-text-tertiary font-mono mt-1">
            {commit.shortHash} · {formatDate(commit.timestamp, i18n.language)}
          </p>
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary disabled:opacity-40 transition-colors duration-150"
          >
            {t('modal.restoreVersion.cancel')}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 text-sm bg-accent-muted text-text-primary rounded hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150"
          >
            {loading ? t('modal.restoreVersion.restoring') : t('modal.restoreVersion.restore')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default RestoreConfirmModal;
