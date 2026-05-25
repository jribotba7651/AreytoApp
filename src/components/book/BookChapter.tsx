import BookMarkdown from './BookMarkdown';

interface BookChapterProps {
  content: string;
  isLast: boolean;
  slug?: string;
}

function BookChapter({ content, isLast, slug }: BookChapterProps) {
  return (
    <div id={slug} className={!isLast ? 'border-b border-border-subtle' : ''}>
      <BookMarkdown content={content} maxWidth={700} />
    </div>
  );
}

export default BookChapter;
