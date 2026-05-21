import { useLayoutStore } from '@/stores/layoutStore';
import type { Tab } from '@/types/layout';

interface TabDef {
  id: Tab;
  label: string;
}

const TABS: TabDef[] = [
  { id: 'capitulo', label: 'Capítulo Activo' },
  { id: 'libro', label: 'Libro' },
  { id: 'terminados', label: 'Terminados' },
];

function TopTabs() {
  const activeTab = useLayoutStore((s) => s.activeTab);
  const setActiveTab = useLayoutStore((s) => s.setActiveTab);

  return (
    <div className="flex items-center bg-bg-secondary border-b border-border-subtle shrink-0">
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
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
    </div>
  );
}

export default TopTabs;
