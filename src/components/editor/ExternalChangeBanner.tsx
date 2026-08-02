import { X, RefreshCw } from 'lucide-react';
import { useProjectStore } from '@/stores/projectStore';

function ExternalChangeBanner() {
  const externalChangePending = useProjectStore((s) => s.externalChangePending);
  const activeChapterPath = useProjectStore((s) => s.activeChapterPath);
  const setExternalChangePending = useProjectStore((s) => s.setExternalChangePending);

  if (!externalChangePending || externalChangePending.path !== activeChapterPath) {
    return null;
  }

  function handleReload() {
    const pending = useProjectStore.getState().externalChangePending;
    if (!pending) return;
    const store = useProjectStore.getState();
    store.updateContent(pending.diskContent);
    store.syncAutosaveSaved?.(pending.diskContent);
    store.incrementEditorVersion();
    store.setExternalChangePending(null);
  }

  function handleDismiss() {
    setExternalChangePending(null);
  }

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-bg-tertiary border-b border-border-default text-xs text-text-secondary">
      <span className="flex-1">Este capítulo cambió en disco</span>
      <button
        onClick={handleReload}
        className="flex items-center gap-1 px-2 py-0.5 rounded bg-accent-muted text-text-primary hover:bg-accent transition-colors duration-150"
      >
        <RefreshCw size={12} />
        Recargar
      </button>
      <button
        onClick={handleDismiss}
        className="p-0.5 rounded hover:bg-bg-secondary transition-colors duration-150"
        title="Descartar"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export default ExternalChangeBanner;
