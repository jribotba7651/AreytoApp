import { useEffect } from 'react';
import { useProjectStore } from '@/stores/projectStore';
import { useLayoutStore } from '@/stores/layoutStore';
import { loadClosedChapters } from '@/lib/closed-chapters-loader';
import TerminadosList from '@/components/terminados/TerminadosList';
import TerminadosEmptyState from '@/components/terminados/TerminadosEmptyState';

function FinishedTabContent() {
  const currentProject = useProjectStore((s) => s.currentProject);
  const closedChapters = useProjectStore((s) => s.closedChapters);
  const setClosedChapters = useProjectStore((s) => s.setClosedChapters);
  const activeTab = useLayoutStore((s) => s.activeTab);

  useEffect(() => {
    if (activeTab !== 'terminados' || !currentProject) return;
    loadClosedChapters(currentProject).then((result) => {
      if (result.ok) setClosedChapters(result.value);
    });
  }, [activeTab, currentProject, setClosedChapters]);

  if (!currentProject) {
    return (
      <div className="h-full flex items-center justify-center bg-bg-primary">
        <p className="font-serif text-text-tertiary">Sin proyecto abierto</p>
      </div>
    );
  }

  if (closedChapters.length === 0) {
    return (
      <div className="h-full bg-bg-primary">
        <TerminadosEmptyState />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-bg-primary">
      <div className="max-w-[700px] mx-auto px-8 pt-12 pb-24">
        <h1 className="font-serif text-3xl font-semibold text-text-primary mb-2">
          Capítulos terminados
        </h1>
        <p className="text-sm text-text-tertiary font-sans mb-8">
          {closedChapters.length} {closedChapters.length === 1 ? 'capítulo' : 'capítulos'}
        </p>
        <TerminadosList chapters={closedChapters} />
      </div>
    </div>
  );
}

export default FinishedTabContent;
