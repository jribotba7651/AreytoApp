import BookMarkdown from './BookMarkdown';
import type { BookSettings } from '@/types/project';

interface BookChapterProps {
  content: string;
  isLast: boolean;
  slug?: string;
  themeId?: string | null;
  themeOverrides?: Record<string, unknown> | null;
  bookSettings?: BookSettings;
}

function BookChapter({ content, isLast, slug, themeId, themeOverrides, bookSettings }: BookChapterProps) {
  return (
    <div id={slug} className={!isLast ? 'border-b border-border-subtle' : ''}>
      <BookMarkdown content={content} themeId={themeId} themeOverrides={themeOverrides} bookSettings={bookSettings} />
    </div>
  );
}

export default BookChapter;
