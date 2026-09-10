import { useTranslation } from 'react-i18next';

function TerminadosEmptyState() {
  const { t } = useTranslation();
  return (
    <div className="h-full flex flex-col items-center justify-center px-4 gap-4">
      <p className="font-serif text-2xl text-text-secondary text-center">
        {t('finished.emptyTitle')}
      </p>
      <p className="font-sans text-sm text-text-tertiary text-center max-w-xs">
        {t('finished.emptyBody')}
      </p>
    </div>
  );
}

export default TerminadosEmptyState;
