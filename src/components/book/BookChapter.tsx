import BookMarkdown from './BookMarkdown';

interface BookChapterProps {
  content: string;
  isLast: boolean;
}

function BookChapter({ content, isLast }: BookChapterProps) {
  return (
    <div className={!isLast ? 'border-b border-border-subtle' : ''}>
      <BookMarkdown content={content} maxWidth={700} />
    </div>
  );
}

export default BookChapter;
