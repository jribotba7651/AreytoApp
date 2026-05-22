import { useState } from 'react';
import { CheckSquare } from 'lucide-react';
import { useProjectStore } from '@/stores/projectStore';
import CloseChapterModal from './CloseChapterModal';

function CloseChapterButton() {
  const activeChapterPath = useProjectStore((s) => s.activeChapterPath);
  const chapters = useProjectStore((s) => s.chapters);
  const currentProject = useProjectStore((s) => s.currentProject);
  const [modalOpen, setModalOpen] = useState(false);

  const activeChapter = chapters.find((c) => c.path === activeChapterPath);

  if (!activeChapter || !currentProject) return null;

  return (
    <>
      <button
        onClick={() => setModalOpen(true)}
        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-tertiary hover:text-text-primary hover:bg-bg-tertiary transition-colors duration-150"
      >
        <CheckSquare size={14} />
        <span>Cerrar capítulo activo</span>
      </button>

      {modalOpen && (
        <CloseChapterModal
          chapter={activeChapter}
          project={currentProject}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
}

export default CloseChapterButton;
