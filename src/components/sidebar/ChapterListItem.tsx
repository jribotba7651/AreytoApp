import type { Chapter } from '@/types/project';

interface ChapterListItemProps {
  chapter: Chapter;
  isActive: boolean;
  onClick: () => void;
}

function ChapterListItem({ chapter, isActive, onClick }: ChapterListItemProps) {
  return (
    <button
      onClick={onClick}
      className={[
        'w-full text-left px-3 py-2 text-sm font-sans truncate cursor-pointer',
        'border-l-2 transition-colors duration-150',
        isActive
          ? 'text-text-primary bg-bg-tertiary border-accent'
          : 'text-text-secondary border-transparent hover:text-text-primary hover:bg-bg-tertiary',
      ].join(' ')}
      title={chapter.title}
    >
      {chapter.title}
    </button>
  );
}

export default ChapterListItem;
