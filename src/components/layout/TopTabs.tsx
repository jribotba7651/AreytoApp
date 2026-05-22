import { X } from 'lucide-react';
import { useLayoutStore } from '@/stores/layoutStore';
import { useProjectStore } from '@/stores/projectStore';
import type { Tab } from '@/types/layout';
import type { SaveStatus } from '@/stores/projectStore';

interface TabDef {
  id: Tab;
  label: string;
  shortcutHint: string;
}

const TABS: TabDef[] = [
  { id: 'capitulo', label: 'Capítulo Activo', shortcutHint: '⌘1' },
  { id: 'libro', label: 'Libro', shortcutHint: '⌘2' },
  { id: 'terminados', label: 'Terminados', shortcutHint: '⌘3' },
];

const STATUS_LABEL: Record<SaveStatus, string> = {
  idle: '',
  saving: 'Guardando…',
  saved: 'Guardado',
  error: 'Error al guardar',
};

function TopTabs() {
  const activeTab = useLayoutStore((s) => s.activeTab);
  const setActiveTab = useLayoutStore((s) => s.setActiveTab);
  const currentProject = useProjectStore((s) => s.currentProject);
  const closeProject = useProjectStore((s) => s.closeProject);
  const saveStatus = useProjectStore((s) => s.saveStatus);

  const statusLabel = STATUS_LABEL[saveStatus];

  return (
    <div className="flex items-center bg-bg-secondary border-b border-border-subtle shrink-0">
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            title={`${tab.label} (${tab.shortcutHint})`}
            className={[
              'px-4 py-2 text-sm transition-colors duration-150 border-b-2 -mb-px',
              isActive
                ? 'text-text-primary border-accent'
                : 'text-text-secondary border-transparent hover:text-text-primary',
            ].join(' ')}
          >
            {tab.label}
          </button>
        );
      })}

      <div className="ml-auto flex items-center gap-3 px-3">
        {statusLabel && (
          <span className={[
            'text-xs transition-colors duration-150',
            saveStatus === 'error' ? 'text-error' : 'text-text-tertiary',
          ].join(' ')}>
            {statusLabel}
          </span>
        )}

        {currentProject && (
          <>
            <span className="text-xs text-text-secondary max-w-48 truncate">
              {currentProject.nombre}
            </span>
            <button
              onClick={closeProject}
              aria-label="Cerrar proyecto"
              title="Cerrar proyecto (⌘⇧W)"
              className="flex items-center justify-center w-6 h-6 rounded text-text-tertiary hover:text-text-primary transition-colors duration-150"
            >
              <X size={14} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default TopTabs;
