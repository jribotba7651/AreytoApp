import { useCallback, useState } from 'react';
import type { ClosedChapter, Project } from '@/types/project';
import { useProjectStore } from '@/stores/projectStore';
import TerminadosListItem from './TerminadosListItem';
import ReopenChapterModal from './ReopenChapterModal';

interface TerminadosListProps {
  chapters: ClosedChapter[];
  project: Project;
}

function TerminadosList({ chapters, project }: TerminadosListProps) {
  const [selected, setSelected] = useState<ClosedChapter | null>(null);
  const updateProjectMeta = useProjectStore((s) => s.updateProjectMeta);
  const excluded = project.excludedFromExport ?? [];

  const handleToggleExport = useCallback((filename: string) => {
    const current = project.excludedFromExport ?? [];
    const next = current.includes(filename)
      ? current.filter((f) => f !== filename)
      : [...current, filename];
    void updateProjectMeta({ excludedFromExport: next });
  }, [project.excludedFromExport, updateProjectMeta]);

  return (
    <>
      <div>
        {chapters.map((chapter) => (
          <TerminadosListItem
            key={chapter.filename}
            chapter={chapter}
            onClick={setSelected}
            includedInExport={!excluded.includes(chapter.filename)}
            onToggleExport={handleToggleExport}
          />
        ))}
      </div>

      {selected && (
        <ReopenChapterModal
          chapter={selected}
          project={project}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}

export default TerminadosList;
