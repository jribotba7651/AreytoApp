import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react';
import { useProjectStore } from '@/stores/projectStore';
import { useLayoutStore } from '@/stores/layoutStore';
import { loadClosedChapters } from '@/lib/closed-chapters-loader';
import TerminadosList from '@/components/terminados/TerminadosList';
import TerminadosEmptyState from '@/components/terminados/TerminadosEmptyState';

function FinishedTabContent() {
  const { t } = useTranslation();
  const currentProject = useProjectStore((s) => s.currentProject);
  const closedChapters = useProjectStore((s) => s.closedChapters);
  const setClosedChapters = useProjectStore((s) => s.setClosedChapters);
  const activeTab = useLayoutStore((s) => s.activeTab);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (activeTab !== 'terminados' || !currentProject) return;
    loadClosedChapters(currentProject).then((result) => {
      if (result.ok) setClosedChapters(result.value);
    });
  }, [activeTab, currentProject, setClosedChapters]);

  const filteredChapters = useMemo(() => {
    if (!searchQuery.trim()) return closedChapters;
    const query = searchQuery.toLowerCase();
    return closedChapters.filter((ch) => ch.title.toLowerCase().includes(query));
  }, [closedChapters, searchQuery]);

  if (!currentProject) {
    return (
      <div className="h-full flex items-center justify-center bg-bg-primary">
        <p className="font-serif text-text-tertiary">{t('common.noProjectOpen')}</p>
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
          {t('finished.title')}
        </h1>
        <p className="text-sm text-text-tertiary font-sans mb-4">
          {t('common.chapterCount', { count: closedChapters.length })}
        </p>

        <div className="relative mb-8">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('finished.searchPlaceholder')}
            className="w-full bg-bg-tertiary border border-border-default rounded pl-9 pr-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:border-border-strong focus:outline-none"
          />
        </div>

        {filteredChapters.length === 0 ? (
          <p className="text-sm text-text-tertiary text-center py-8">
            {t('finished.noResults')}
          </p>
        ) : (
          <TerminadosList chapters={filteredChapters} project={currentProject} />
        )}
      </div>
    </div>
  );
}

export default FinishedTabContent;
