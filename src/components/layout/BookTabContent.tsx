import { useEffect, useState } from 'react';
import { useProjectStore } from '@/stores/projectStore';
import { useLayoutStore } from '@/stores/layoutStore';
import { loadBook } from '@/lib/book-loader';
import BookHeader from '@/components/book/BookHeader';
import BookChapter from '@/components/book/BookChapter';
import BookChapterError from '@/components/book/BookChapterError';
import BookEmptyState from '@/components/book/BookEmptyState';
import type { BookData } from '@/types/book';

function BookTabContent() {
  const currentProject = useProjectStore((s) => s.currentProject);
  const activeTab = useLayoutStore((s) => s.activeTab);
  const [bookData, setBookData] = useState<BookData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeTab !== 'libro' || !currentProject) {
      setBookData(null);
      return;
    }
    setLoading(true);
    loadBook(currentProject).then((data) => {
      setBookData(data);
      setLoading(false);
    });
  }, [activeTab, currentProject]);

  if (!currentProject) {
    return (
      <div className="h-full flex items-center justify-center bg-bg-primary">
        <p className="font-serif text-text-tertiary">Sin proyecto abierto</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-bg-primary">
        <p className="font-sans text-sm text-text-tertiary">Cargando libro…</p>
      </div>
    );
  }

  if (!bookData || bookData.sections.length === 0) {
    return (
      <div className="h-full bg-bg-primary">
        <BookEmptyState />
      </div>
    );
  }

  const validCount = bookData.sections.filter((s) => s.kind === 'chapter').length;

  return (
    <div className="h-full overflow-y-auto bg-bg-primary">
      <BookHeader projectName={bookData.projectName} chapterCount={validCount} />
      <div className="pb-24">
        {bookData.sections.map((section, idx) => {
          const isLast = idx === bookData.sections.length - 1;
          if (section.kind === 'chapter') {
            return (
              <BookChapter
                key={section.chapter.path}
                content={section.content}
                isLast={isLast}
              />
            );
          }
          return (
            <BookChapterError
              key={section.chapter.path}
              chapterFilename={section.chapter.filename}
              reason={section.reason}
            />
          );
        })}
      </div>
    </div>
  );
}

export default BookTabContent;
