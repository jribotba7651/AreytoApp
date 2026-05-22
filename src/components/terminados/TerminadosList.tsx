import { useState } from 'react';
import type { ClosedChapter, Project } from '@/types/project';
import TerminadosListItem from './TerminadosListItem';
import ReopenChapterModal from './ReopenChapterModal';

interface TerminadosListProps {
  chapters: ClosedChapter[];
  project: Project;
}

function TerminadosList({ chapters, project }: TerminadosListProps) {
  const [selected, setSelected] = useState<ClosedChapter | null>(null);

  return (
    <>
      <div>
        {chapters.map((chapter) => (
          <TerminadosListItem
            key={chapter.filename}
            chapter={chapter}
            onClick={setSelected}
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
