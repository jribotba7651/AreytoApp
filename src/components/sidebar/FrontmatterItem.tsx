import { useProjectStore } from '@/stores/projectStore';
import type { ActiveView } from '@/stores/projectStore';

interface Props {
  view: NonNullable<ActiveView>;
  label: string;
}

function FrontmatterItem({ view, label }: Props) {
  const activeView = useProjectStore((s) => s.activeView);
  const setActiveView = useProjectStore((s) => s.setActiveView);
  const isActive = activeView === view;

  return (
    <button
      onClick={() => setActiveView(view)}
      className={[
        'w-full text-left px-3 py-1.5 text-xs font-sans border-l-2 transition-colors duration-100',
        isActive
          ? 'text-text-primary bg-bg-tertiary border-accent'
          : 'text-text-secondary border-transparent hover:text-text-primary hover:bg-bg-tertiary',
      ].join(' ')}
    >
      {label}
    </button>
  );
}

export default FrontmatterItem;
