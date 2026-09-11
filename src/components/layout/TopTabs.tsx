import { useState } from 'react';
import { X, Info, Upload, Keyboard } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLayoutStore } from '@/stores/layoutStore';
import { useProjectStore } from '@/stores/projectStore';
import type { Tab } from '@/types/layout';
import type { SaveStatus } from '@/stores/projectStore';
import AboutDialog from '@/components/about/AboutDialog';
import ShortcutsDialog from '@/components/shortcuts/ShortcutsDialog';

interface TabDef {
  id: Tab;
  shortcutHint: string;
}

const TABS: TabDef[] = [
  { id: 'capitulo', shortcutHint: '⌘1' },
  { id: 'libro', shortcutHint: '⌘2' },
  { id: 'terminados', shortcutHint: '⌘3' },
  { id: 'ajustes', shortcutHint: '⌘4' },
];

function TopTabs() {
  const { t } = useTranslation();
  const activeTab = useLayoutStore((s) => s.activeTab);
  const setActiveTab = useLayoutStore((s) => s.setActiveTab);
  const currentProject = useProjectStore((s) => s.currentProject);
  const closeProject = useProjectStore((s) => s.closeProject);
  const saveStatus = useProjectStore((s) => s.saveStatus);
  const setShowExportDialog = useLayoutStore((s) => s.setShowExportDialog);
  const showShortcutsModal = useLayoutStore((s) => s.showShortcutsModal);
  const setShowShortcutsModal = useLayoutStore((s) => s.setShowShortcutsModal);
  const [showAbout, setShowAbout] = useState(false);

  const statusLabels: Record<SaveStatus, string> = {
    idle: '',
    saving: t('common.saving'),
    saved: t('common.saved'),
    error: t('common.saveError'),
  };
  const statusLabel = statusLabels[saveStatus];

  return (
    <div className="flex items-center bg-bg-secondary border-b border-border-subtle shrink-0">
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            title={`${t('tabs.' + tab.id)} (${tab.shortcutHint})`}
            className={[
              'px-4 py-2 text-sm transition-colors duration-150 border-b-2 -mb-px',
              isActive
                ? 'text-text-primary border-accent'
                : 'text-text-secondary border-transparent hover:text-text-primary',
            ].join(' ')}
          >
            {t('tabs.' + tab.id)}
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
              onClick={() => {
                setActiveTab('libro');
                setShowExportDialog(true);
              }}
              aria-label={t('topbar.export')}
              title={t('topbar.export')}
              className="flex items-center gap-1.5 px-2 py-1 text-xs text-text-secondary hover:text-text-primary rounded hover:bg-bg-tertiary transition-colors duration-150"
            >
              <Upload size={14} />
              <span>{t('topbar.export')}</span>
            </button>
            <button
              onClick={closeProject}
              aria-label={t('topbar.closeProject')}
              title={`${t('topbar.closeProject')} (⌘⇧W)`}
              className="flex items-center justify-center w-6 h-6 rounded text-text-tertiary hover:text-text-primary transition-colors duration-150"
            >
              <X size={14} />
            </button>
          </>
        )}

        <button
          onClick={() => setShowShortcutsModal(true)}
          aria-label={t('topbar.shortcuts')}
          title={`${t('topbar.shortcuts')} (⌘⇧/)`}
          className="flex items-center justify-center w-6 h-6 rounded text-text-tertiary hover:text-text-primary transition-colors duration-150"
        >
          <Keyboard size={14} />
        </button>

        <button
          onClick={() => setShowAbout(true)}
          aria-label={t('topbar.about')}
          title={t('topbar.about')}
          className="flex items-center justify-center w-6 h-6 rounded text-text-tertiary hover:text-text-primary transition-colors duration-150"
        >
          <Info size={14} />
        </button>
      </div>

      {showShortcutsModal && <ShortcutsDialog onClose={() => setShowShortcutsModal(false)} />}
      {showAbout && <AboutDialog onClose={() => setShowAbout(false)} />}
    </div>
  );
}

export default TopTabs;
