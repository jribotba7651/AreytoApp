import { useProjectStore } from '@/stores/projectStore';
import ChapterList from '@/components/sidebar/ChapterList';
import NewChapterButton from '@/components/sidebar/NewChapterButton';
import CloseChapterButton from '@/components/sidebar/CloseChapterButton';
import RefreshChaptersButton from '@/components/sidebar/RefreshChaptersButton';
import FrontmatterSection from '@/components/sidebar/FrontmatterSection';
import BackmatterSection from '@/components/sidebar/BackmatterSection';

function SidebarPanel() {
  const currentProject = useProjectStore((s) => s.currentProject);

  if (!currentProject) {
    return (
      <div className="h-full bg-bg-secondary border-r border-border-subtle flex items-center justify-center">
        <p className="text-xs text-text-tertiary">Sin proyecto</p>
      </div>
    );
  }

  return (
    <div className="h-full bg-bg-secondary border-r border-border-subtle flex flex-col">
      <FrontmatterSection />

      <div className="px-3 pt-4 pb-2 shrink-0 flex items-center justify-between border-t border-border-subtle">
        <p className="text-xs text-text-tertiary uppercase tracking-wider font-sans">
          Capítulos
        </p>
        <RefreshChaptersButton />
      </div>

      <div className="flex-1 overflow-y-auto">
        <ChapterList />
      </div>

      <div className="shrink-0 border-t border-border-subtle">
        <BackmatterSection />
      </div>

      <div className="shrink-0 border-t border-border-subtle">
        <NewChapterButton />
        <CloseChapterButton />
      </div>
    </div>
  );
}

export default SidebarPanel;
