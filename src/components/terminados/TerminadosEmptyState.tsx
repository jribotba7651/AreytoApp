import { useTranslation } from 'react-i18next';

function TerminadosEmptyState() {
  const { t } = useTranslation();
  return (
    <div className="h-full flex flex-col items-center justify-center px-4 gap-5">
      <svg
        width="80"
        height="80"
        viewBox="0 0 80 80"
        fill="none"
        className="text-border-default"
        aria-hidden="true"
      >
        {/* Stack of finished pages */}
        <rect x="16" y="12" width="40" height="52" rx="3" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <rect x="20" y="8" width="40" height="52" rx="3" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.5" />
        <rect x="24" y="4" width="40" height="52" rx="3" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.25" />
        {/* Lines on front page */}
        <line x1="22" y1="22" x2="50" y2="22" stroke="currentColor" strokeWidth="1" opacity="0.4" />
        <line x1="22" y1="28" x2="46" y2="28" stroke="currentColor" strokeWidth="1" opacity="0.4" />
        <line x1="22" y1="34" x2="48" y2="34" stroke="currentColor" strokeWidth="1" opacity="0.4" />
        <line x1="22" y1="40" x2="42" y2="40" stroke="currentColor" strokeWidth="1" opacity="0.4" />
        {/* Checkmark circle */}
        <circle cx="56" cy="56" r="12" className="fill-bg-secondary" stroke="currentColor" strokeWidth="1.5" />
        <polyline points="50,56 54,60 62,52" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-success" />
      </svg>

      <div className="flex flex-col items-center gap-2 max-w-sm">
        <p className="font-serif text-xl text-text-secondary text-center">
          {t('finished.emptyTitle')}
        </p>
        <p className="font-sans text-sm text-text-tertiary text-center leading-relaxed">
          {t('finished.emptyBody')}
        </p>
        <p className="font-sans text-xs text-text-tertiary text-center mt-1 opacity-70">
          {t('finished.emptyHint')}
        </p>
      </div>
    </div>
  );
}

export default TerminadosEmptyState;
