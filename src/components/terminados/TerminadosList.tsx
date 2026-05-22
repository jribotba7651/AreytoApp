import type { ClosedChapter } from '@/types/project';
import TerminadosListItem from './TerminadosListItem';

interface TerminadosListProps {
  chapters: ClosedChapter[];
}

function TerminadosList({ chapters }: TerminadosListProps) {
  return (
    <div>
      {chapters.map((chapter) => (
        <TerminadosListItem key={chapter.filename} chapter={chapter} />
      ))}
    </div>
  );
}

export default TerminadosList;
