import { useTranslation } from 'react-i18next';
import type { OtrosLibrosData } from '@/types/backmatter';
import BookMarkdown from './BookMarkdown';

interface Props {
  otrosLibros: OtrosLibrosData;
}

function BookBackmatterOtrosLibros({ otrosLibros }: Props) {
  const { t } = useTranslation();

  if (!otrosLibros.contenido.trim()) return null;

  return (
    <div className="max-w-[700px] mx-auto px-8 pt-12 pb-16 border-t border-border-subtle">
      <h2 className="font-serif text-lg font-semibold text-text-primary mb-6">
        {t('backmatter.otrosLibros.heading')}
      </h2>
      <BookMarkdown content={otrosLibros.contenido} />
    </div>
  );
}

export default BookBackmatterOtrosLibros;
