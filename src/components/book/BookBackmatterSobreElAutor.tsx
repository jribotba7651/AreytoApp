import { useTranslation } from 'react-i18next';
import type { SobreElAutorData } from '@/types/backmatter';
import BookMarkdown from './BookMarkdown';

interface Props {
  sobreElAutor: SobreElAutorData;
}

function BookBackmatterSobreElAutor({ sobreElAutor }: Props) {
  const { t } = useTranslation();

  if (!sobreElAutor.contenido.trim()) return null;

  return (
    <div className="max-w-[700px] mx-auto px-8 pt-12 pb-16 border-t border-border-subtle">
      <h2 className="font-serif text-lg font-semibold text-text-primary mb-6">
        {t('backmatter.sobreElAutor.heading')}
      </h2>
      <BookMarkdown content={sobreElAutor.contenido} />
    </div>
  );
}

export default BookBackmatterSobreElAutor;
