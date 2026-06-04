import { useTranslation } from 'react-i18next';
import FrontmatterItem from './FrontmatterItem';

function BackmatterSection() {
  const { t } = useTranslation();

  return (
    <div className="shrink-0">
      <div className="px-3 pt-4 pb-2">
        <p className="text-xs text-text-tertiary uppercase tracking-wider font-sans">
          {t('sidebar.backmatter')}
        </p>
      </div>
      <div>
        <FrontmatterItem view="backmatter-agradecimientos" label={t('sidebar.items.agradecimientos')} />
      </div>
    </div>
  );
}

export default BackmatterSection;
