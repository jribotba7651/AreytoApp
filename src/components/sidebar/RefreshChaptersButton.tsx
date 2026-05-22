import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { useProjectStore } from '@/stores/projectStore';
import { refreshChapters } from '@/lib/refresh-chapters';

function RefreshChaptersButton() {
  const currentProject = useProjectStore((s) => s.currentProject);
  const [refreshing, setRefreshing] = useState(false);

  if (!currentProject) return null;

  const handleClick = async () => {
    if (refreshing) return;
    setRefreshing(true);
    await refreshChapters(currentProject);
    setTimeout(() => setRefreshing(false), 400);
  };

  return (
    <button
      onClick={handleClick}
      disabled={refreshing}
      title="Recargar lista"
      aria-label="Recargar lista de capítulos"
      className="text-text-tertiary hover:text-text-secondary disabled:opacity-50 p-1 cursor-pointer"
    >
      <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
    </button>
  );
}

export default RefreshChaptersButton;
