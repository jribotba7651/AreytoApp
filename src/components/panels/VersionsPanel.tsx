import { ChevronRight } from 'lucide-react';
import { useLayoutStore } from '@/stores/layoutStore';

function VersionsPanel() {
  const toggleVersionsPanel = useLayoutStore((s) => s.toggleVersionsPanel);

  return (
    <div className="h-full bg-bg-secondary border-l border-border-subtle flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle shrink-0">
        <span className="text-xs text-text-secondary uppercase tracking-wider">Versiones</span>
        <button
          onClick={toggleVersionsPanel}
          aria-label="Colapsar panel de versiones"
          className="flex items-center justify-center w-6 h-6 rounded text-text-tertiary hover:text-text-primary transition-colors duration-150"
        >
          <ChevronRight size={14} />
        </button>
      </div>
      <div className="flex-1 flex items-center justify-center">
        <p className="text-sm text-text-tertiary">Historial</p>
      </div>
    </div>
  );
}

export default VersionsPanel;
