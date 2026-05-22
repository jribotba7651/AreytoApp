import { CheckSquare } from 'lucide-react';
import { useProjectStore } from '@/stores/projectStore';
import { useLayoutStore } from '@/stores/layoutStore';
import CloseChapterModal from './CloseChapterModal';
import ShortcutHint from '@/components/shared/ShortcutHint';

function CloseChapterButton() {
  const activeChapterPath = useProjectStore((s) => s.activeChapterPath);
  const chapters = useProjectStore((s) => s.chapters);
  const currentProject = useProjectStore((s) => s.currentProject);
  const showModal = useLayoutStore((s) => s.showCloseChapterModal);
  const setShowModal = useLayoutStore((s) => s.setShowCloseChapterModal);

  const activeChapter = chapters.find((c) => c.path === activeChapterPath);

  if (!activeChapter || !currentProject) return null;

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-tertiary hover:text-text-primary hover:bg-bg-tertiary transition-colors duration-150"
      >
        <CheckSquare size={14} />
        <span>Cerrar capítulo activo</span>
        <ShortcutHint text="⌘⇧T" className="ml-auto" />
      </button>

      {showModal && (
        <CloseChapterModal
          chapter={activeChapter}
          project={currentProject}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}

export default CloseChapterButton;
