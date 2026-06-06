import { ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLayoutStore } from '@/stores/layoutStore';
import CommitList from '@/components/versions/CommitList';

function VersionsPanel() {
  const { t } = useTranslation();
  const toggleVersionsPanel = useLayoutStore((s) => s.toggleVersionsPanel);

  return (
    <div className="h-full bg-bg-secondary border-l border-border-subtle flex flex-col">
      <div className="px-3 pt-4 pb-2 shrink-0 flex items-center justify-between border-b border-border-subtle">
        <p className="text-xs text-text-tertiary uppercase tracking-wider font-sans">
          {t('versions.title')}
        </p>
        <button
          onClick={toggleVersionsPanel}
          aria-label={t('versions.collapsePanel')}
          className="flex items-center justify-center w-6 h-6 rounded text-text-tertiary hover:text-text-primary transition-colors duration-150"
        >
          <ChevronRight size={14} />
        </button>
      </div>

      <CommitList />
    </div>
  );
}

export default VersionsPanel;
