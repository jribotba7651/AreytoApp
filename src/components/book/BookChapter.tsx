import BookMarkdown from './BookMarkdown';
import type { BookSettings } from '@/types/project';

interface BookChapterProps {
  content: string;
  isLast: boolean;
  slug?: string;
  themeId?: string | null;
  themeOverrides?: Record<string, unknown> | null;
  bookSettings?: BookSettings;
  projectRootPath?: string;
}

function BookChapter({ content, isLast, slug, themeId, themeOverrides, bookSettings, projectRootPath }: BookChapterProps) {
  return (
    <div id={slug} className={!isLast ? 'border-b border-border-subtle' : ''}>
      <BookMarkdown content={content} themeId={themeId} themeOverrides={themeOverrides} bookSettings={bookSettings} projectRootPath={projectRootPath} />
    </div>
  );
}

export default BookChapter;
