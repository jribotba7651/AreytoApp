import { useState } from 'react';
import { X, Info, Upload, Download, Keyboard, Settings, Archive, Check, BarChart3, Sun, Moon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLayoutStore } from '@/stores/layoutStore';
import { useProjectStore } from '@/stores/projectStore';
import { useSettingsStore } from '@/stores/settingsStore';
import AboutDialog from '@/components/about/AboutDialog';
import ShortcutsDialog from '@/components/shortcuts/ShortcutsDialog';

function TopTabs() {
  const { t } = useTranslation();
  const activeTab = useLayoutStore((s) => s.activeTab);
  const setActiveTab = useLayoutStore((s) => s.setActiveTab);
  const currentProject = useProjectStore((s) => s.currentProject);
  const closeProject = useProjectStore((s) => s.closeProject);
  const saveStatus = useProjectStore((s) => s.saveStatus);
  const setShowExportDialog = useLayoutStore((s) => s.setShowExportDialog);
  const setShowExportAllDialog = useLayoutStore((s) => s.setShowExportAllDialog);
  const setShowExportKindleDialog = useLayoutStore((s) => s.setShowExportKindleDialog);
  const showShortcutsModal = useLayoutStore((s) => s.showShortcutsModal);
  const setShowShortcutsModal = useLayoutStore((s) => s.setShowShortcutsModal);
  const themeMode = useSettingsStore((s) => s.themeMode);
  const setThemeMode = useSettingsStore((s) => s.setThemeMode);
  const [showAbout, setShowAbout] = useState(false);

  const isWriting = activeTab === 'capitulo';
  const isFormatting = activeTab === 'libro';

  return (
    <div className="flex items-center h-10 bg-bg-secondary border-b border-border-subtle shrink-0 px-3">
      {/* Left: Book name */}
      <div className="flex items-center gap-2 min-w-0 flex-shrink-0">
        {currentProject ? (
          <span className="text-sm font-medium text-text-primary max-w-48 truncate" title={currentProject.nombre}>
            {currentProject.nombre}
          </span>
        ) : (
          <span className="text-sm text-text-tertiary">{t('common.noProjectOpen')}</span>
        )}
        {saveStatus === 'saving' && (
          <span className="flex items-center gap-1.5" title={t('common.saving')}>
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
          </span>
        )}
        {saveStatus === 'saved' && (
          <span className="flex items-center text-success transition-opacity duration-300" title={t('common.saved')}>
            <Check size={14} strokeWidth={2.5} />
          </span>
        )}
        {saveStatus === 'error' && (
          <span className="text-[11px] text-error">{t('common.saveError')}</span>
        )}
      </div>

      {/* Center: Writing / Formatting toggle */}
      <div className="flex-1 flex justify-center">
        <div className="flex items-center bg-bg-tertiary rounded-md p-0.5">
          <button
            onClick={() => setActiveTab('capitulo')}
            title={`${t('tabs.capitulo')} (⌘1)`}
            className={[
              'px-4 py-1 text-xs font-medium rounded transition-colors duration-150',
              isWriting
                ? 'bg-bg-editor text-text-primary shadow-sm'
                : 'text-text-secondary hover:text-text-primary',
            ].join(' ')}
          >
            {t('topbar.writing')}
          </button>
          <button
            onClick={() => setActiveTab('libro')}
            title={`${t('tabs.libro')} (⌘2)`}
            className={[
              'px-4 py-1 text-xs font-medium rounded transition-colors duration-150',
              isFormatting
                ? 'bg-bg-editor text-text-primary shadow-sm'
                : 'text-text-secondary hover:text-text-primary',
            ].join(' ')}
          >
            {t('topbar.formatting')}
          </button>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={() => setActiveTab('terminados')}
          title={`${t('tabs.terminados')} (⌘3)`}
          className={`flex items-center justify-center w-7 h-7 rounded transition-colors duration-150 ${
            activeTab === 'terminados' ? 'bg-bg-tertiary text-text-primary' : 'text-text-tertiary hover:text-text-primary hover:bg-bg-tertiary'
          }`}
        >
          <Archive size={15} />
        </button>
        <button
          onClick={() => setActiveTab('stats')}
          title={t('tabs.stats')}
          className={`flex items-center justify-center w-7 h-7 rounded transition-colors duration-150 ${
            activeTab === 'stats' ? 'bg-bg-tertiary text-text-primary' : 'text-text-tertiary hover:text-text-primary hover:bg-bg-tertiary'
          }`}
        >
          <BarChart3 size={15} />
        </button>
        <button
          onClick={() => setActiveTab('ajustes')}
          title={`${t('tabs.ajustes')} (⌘4)`}
          className={`flex items-center justify-center w-7 h-7 rounded transition-colors duration-150 ${
            activeTab === 'ajustes' ? 'bg-bg-tertiary text-text-primary' : 'text-text-tertiary hover:text-text-primary hover:bg-bg-tertiary'
          }`}
        >
          <Settings size={15} />
        </button>

        {currentProject && (
          <>
            <div className="w-px h-4 bg-border-subtle mx-1" />
            <button
              onClick={() => {
                setActiveTab('libro');
                setShowExportDialog(true);
              }}
              aria-label={t('topbar.export')}
              title={t('topbar.export')}
              className="flex items-center gap-1 px-2 py-1 text-xs text-text-secondary hover:text-text-primary rounded hover:bg-bg-tertiary transition-colors duration-150"
            >
              <Upload size={14} />
              <span>{t('topbar.export')}</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('libro');
                setShowExportAllDialog(true);
              }}
              aria-label={t('topbar.exportAll')}
              title={t('topbar.exportAll')}
              className="flex items-center gap-1 px-2 py-1 text-xs text-text-secondary hover:text-text-primary rounded hover:bg-bg-tertiary transition-colors duration-150"
            >
              <Download size={14} />
              <span>{t('topbar.exportAll')}</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('libro');
                setShowExportKindleDialog(true);
              }}
              aria-label={t('topbar.exportKindle')}
              title={t('topbar.exportKindle')}
              className="flex items-center gap-1 px-2 py-1 text-xs text-text-secondary hover:text-text-primary rounded hover:bg-bg-tertiary transition-colors duration-150"
            >
              <Archive size={14} />
              <span>Kindle</span>
            </button>
            <button
              onClick={closeProject}
              aria-label={t('topbar.closeProject')}
              title={`${t('topbar.closeProject')} (⌘⇧W)`}
              className="flex items-center justify-center w-7 h-7 rounded text-text-tertiary hover:text-text-primary transition-colors duration-150"
            >
              <X size={14} />
            </button>
          </>
        )}

        <button
          onClick={() => setShowShortcutsModal(true)}
          aria-label={t('topbar.shortcuts')}
          title={`${t('topbar.shortcuts')} (⌘⇧/)`}
          className="flex items-center justify-center w-7 h-7 rounded text-text-tertiary hover:text-text-primary transition-colors duration-150"
        >
          <Keyboard size={14} />
        </button>

        <button
          onClick={() => {
            const next = themeMode === 'dark' ? 'light' : 'dark';
            setThemeMode(next);
          }}
          aria-label={t('topbar.toggleTheme')}
          title={t('topbar.toggleTheme')}
          className="flex items-center justify-center w-7 h-7 rounded text-text-tertiary hover:text-text-primary transition-colors duration-150"
        >
          {themeMode === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
        </button>

        <button
          onClick={() => setShowAbout(true)}
          aria-label={t('topbar.about')}
          title={t('topbar.about')}
          className="flex items-center justify-center w-7 h-7 rounded text-text-tertiary hover:text-text-primary transition-colors duration-150"
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
