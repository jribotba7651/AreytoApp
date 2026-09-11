import BookMarkdown from './BookMarkdown';

interface BookChapterProps {
  content: string;
  isLast: boolean;
  slug?: string;
  themeId?: string | null;
  themeOverrides?: Record<string, unknown> | null;
}

function BookChapter({ content, isLast, slug, themeId, themeOverrides }: BookChapterProps) {
  return (
    <div id={slug} className={!isLast ? 'border-b border-border-subtle' : ''}>
      <BookMarkdown content={content} themeId={themeId} themeOverrides={themeOverrides} />
    </div>
  );
}

export default BookChapter;
