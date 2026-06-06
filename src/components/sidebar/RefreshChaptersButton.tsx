import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useProjectStore } from '@/stores/projectStore';
import { refreshChapters } from '@/lib/refresh-chapters';

function RefreshChaptersButton() {
  const { t } = useTranslation();
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
      title={`${t('sidebar.refreshList')} (⌘R)`}
      aria-label={t('sidebar.refreshListAria')}
      className="text-text-tertiary hover:text-text-secondary disabled:opacity-50 p-1 cursor-pointer"
    >
      <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
    </button>
  );
}

export default RefreshChaptersButton;
