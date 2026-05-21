import { useProjectStore } from '@/stores/projectStore';
import CommitListItem from './CommitListItem';

function CommitList() {
  const commits = useProjectStore((s) => s.commits);
  const activeChapterPath = useProjectStore((s) => s.activeChapterPath);

  if (!activeChapterPath) {
    return (
      <div className="flex-1 flex items-center justify-center px-3">
        <p className="text-xs text-text-tertiary text-center">Sin capítulo activo</p>
      </div>
    );
  }

  if (commits.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center px-3">
        <p className="text-xs text-text-tertiary text-center">Sin historial todavía</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {commits.map((commit) => (
        <CommitListItem key={commit.hash} commit={commit} />
      ))}
    </div>
  );
}

export default CommitList;
