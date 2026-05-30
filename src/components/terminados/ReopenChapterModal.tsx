import { useState } from 'react';
import type { ClosedChapter, Project } from '@/types/project';
import { formatRelativeTime } from '@/lib/format-relative-time';
import { performReopenChapter } from '@/lib/reopen-chapter-flow';

interface ReopenChapterModalProps {
  chapter: ClosedChapter;
  project: Project;
  onClose: () => void;
}

function ReopenChapterModal({ chapter, project, onClose }: ReopenChapterModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleConfirm() {
    setLoading(true);
    setError('');

    const result = await performReopenChapter(project, chapter);

    if (!result.ok) {
      setError(result.error);
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
          Reabrir capítulo
        </h2>
        <p className="text-sm text-text-secondary mb-4">
          Vas a reabrir <strong className="text-text-primary">{chapter.filename}</strong>.
          El archivo volverá a <code className="text-xs text-text-tertiary">capitulos/</code> y
          se activará automáticamente en el editor.
          El tag git <code className="text-xs text-text-tertiary">{chapter.tagName}</code> se
          mantiene como marca histórica.
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
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="px-4 py-2 text-sm bg-accent-muted text-text-primary rounded hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150"
          >
            {loading ? 'Reabriendo…' : 'Reabrir capítulo'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ReopenChapterModal;
