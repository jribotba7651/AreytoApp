import { useTranslation } from 'react-i18next';
import FrontmatterItem from './FrontmatterItem';

function FrontmatterSection() {
  const { t } = useTranslation();

  return (
    <div className="shrink-0">
      <div className="px-3 pt-4 pb-2">
        <p className="text-xs text-text-tertiary uppercase tracking-wider font-sans">
          {t('sidebar.frontmatter')}
        </p>
      </div>
      <div>
        <FrontmatterItem view="frontmatter-titulo" label={t('sidebar.items.titulo')} />
        <FrontmatterItem view="frontmatter-copyright" label={t('sidebar.items.copyright')} />
        <FrontmatterItem view="frontmatter-dedicatoria" label={t('sidebar.items.dedicatoria')} />
        <FrontmatterItem view="frontmatter-metadata" label={t('sidebar.items.metadata')} />
      </div>
    </div>
  );
}

export default FrontmatterSection;
