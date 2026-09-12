import { useTranslation } from 'react-i18next';
import FrontmatterItem from './FrontmatterItem';
import CollapsibleSection from './CollapsibleSection';

function BackmatterSection() {
  const { t } = useTranslation();

  return (
    <CollapsibleSection title={t('sidebar.backmatter')}>
      <FrontmatterItem view="backmatter-agradecimientos" label={t('sidebar.items.agradecimientos')} />
      <FrontmatterItem view="backmatter-sobre-el-autor" label={t('sidebar.items.sobreElAutor')} />
      <FrontmatterItem view="backmatter-otros-libros" label={t('sidebar.items.otrosLibros')} />
    </CollapsibleSection>
  );
}

export default BackmatterSection;
