import BookMarkdown from './BookMarkdown';
import type { BookData, BookSection } from '@/types/book';

interface BookPrintViewProps {
  bookData: BookData;
  themeId?: string;
  themeOverrides?: Record<string, unknown> | null;
}

type ChapterSection = Extract<BookSection, { kind: 'chapter' }>;

function BookPrintView({ bookData, themeId, themeOverrides }: BookPrintViewProps) {
  const titulo = bookData.frontmatter.titulo;
  const chapters = bookData.sections.filter(
    (s): s is ChapterSection => s.kind === 'chapter',
  );

  return (
    <div id="print-book">
      {titulo?.titulo?.trim() && <h1 className="print-book-title">{titulo.titulo.trim()}</h1>}
      {titulo?.autor?.trim() && <p className="print-book-author">{titulo.autor.trim()}</p>}
      {chapters.map((section) => (
        <div key={section.chapter.filename} className="print-book-chapter">
          <BookMarkdown
            content={section.content}
            themeId={themeId}
            themeOverrides={themeOverrides}
          />
        </div>
      ))}
    </div>
  );
}

export default BookPrintView;