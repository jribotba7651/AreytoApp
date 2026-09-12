import { useTranslation } from 'react-i18next';
import FrontmatterItem from './FrontmatterItem';
import CollapsibleSection from './CollapsibleSection';

function FrontmatterSection() {
  const { t } = useTranslation();

  return (
    <CollapsibleSection title={t('sidebar.frontmatter')}>
      <FrontmatterItem view="frontmatter-titulo" label={t('sidebar.items.titulo')} />
      <FrontmatterItem view="frontmatter-copyright" label={t('sidebar.items.copyright')} />
      <FrontmatterItem view="frontmatter-dedicatoria" label={t('sidebar.items.dedicatoria')} />
      <FrontmatterItem view="frontmatter-metadata" label={t('sidebar.items.metadata')} />
    </CollapsibleSection>
  );
}

export default FrontmatterSection;
