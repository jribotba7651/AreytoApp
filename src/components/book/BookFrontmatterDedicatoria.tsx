import type { DedicatoriaData } from '@/types/frontmatter';
import BookMarkdown from './BookMarkdown';

interface Props {
  dedicatoria: DedicatoriaData;
}

function BookFrontmatterDedicatoria({ dedicatoria }: Props) {
  if (!dedicatoria.contenido.trim()) return null;

  return (
    <div className="max-w-[700px] mx-auto px-8 py-12 text-center border-t border-border-subtle">
      <div className="italic">
        <BookMarkdown content={dedicatoria.contenido} maxWidth={700} />
      </div>
    </div>
  );
}

export default BookFrontmatterDedicatoria;
