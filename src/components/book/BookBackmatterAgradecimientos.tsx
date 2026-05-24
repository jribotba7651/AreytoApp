import type { AgradecimientosData } from '@/types/backmatter';
import BookMarkdown from './BookMarkdown';

interface Props {
  agradecimientos: AgradecimientosData;
}

function BookBackmatterAgradecimientos({ agradecimientos }: Props) {
  if (!agradecimientos.contenido.trim()) return null;

  return (
    <div className="max-w-[700px] mx-auto px-8 pt-12 pb-16 border-t border-border-subtle">
      <h2 className="font-serif text-lg font-semibold text-text-primary mb-6">
        Agradecimientos
      </h2>
      <BookMarkdown content={agradecimientos.contenido} maxWidth={700} />
    </div>
  );
}

export default BookBackmatterAgradecimientos;
