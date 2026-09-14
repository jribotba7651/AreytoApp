import { useTranslation } from 'react-i18next';
import { useProjectStore } from '@/stores/projectStore';
import { useSettingsStore } from '@/stores/settingsStore';
import ChapterList from '@/components/sidebar/ChapterList';
import NewChapterButton from '@/components/sidebar/NewChapterButton';
import CloseChapterButton from '@/components/sidebar/CloseChapterButton';
import RefreshChaptersButton from '@/components/sidebar/RefreshChaptersButton';
import FrontmatterSection from '@/components/sidebar/FrontmatterSection';
import BackmatterSection from '@/components/sidebar/BackmatterSection';
import CollapsibleSection from '@/components/sidebar/CollapsibleSection';
import OnboardingTour from '@/components/sidebar/OnboardingTour';

function SidebarPanel() {
  const { t } = useTranslation();
  const currentProject = useProjectStore((s) => s.currentProject);
  const chapters = useProjectStore((s) => s.chapters);
  const onboardingCompleted = useSettingsStore((s) => s.onboardingCompleted);

  if (!currentProject) {
    return (
      <div className="h-full bg-bg-secondary border-r border-border-subtle flex items-center justify-center">
        <p className="text-xs text-text-tertiary">{t('sidebar.noProject')}</p>
      </div>
    );
  }

  return (
    <div className="h-full bg-bg-secondary border-r border-border-subtle flex flex-col overflow-y-auto">
      <FrontmatterSection />

      <div className="border-t border-border-subtle">
        <CollapsibleSection
          title={t('sidebar.chapters')}
          actions={<RefreshChaptersButton />}
        >
          <ChapterList />
          <div className="px-2 pb-1">
            <NewChapterButton />
            <CloseChapterButton />
          </div>
        </CollapsibleSection>
      </div>

      {chapters.length === 0 && !onboardingCompleted && <OnboardingTour />}

      <div className="border-t border-border-subtle">
        <BackmatterSection />
      </div>
    </div>
  );
}

export default SidebarPanel;
