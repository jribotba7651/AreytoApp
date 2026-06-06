import { useTranslation } from 'react-i18next';

function BookEmptyState() {
  const { t } = useTranslation();
  return (
    <div className="h-full flex flex-col items-center justify-center min-h-[60vh] px-4 gap-4">
      <p className="font-serif text-2xl text-text-secondary text-center max-w-sm">
        {t('book.emptyTitle')}
      </p>
      <p className="font-sans text-sm text-text-tertiary text-center max-w-sm">
        {t('book.emptyBody')}
      </p>
    </div>
  );
}

export default BookEmptyState;
