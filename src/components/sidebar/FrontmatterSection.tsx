import FrontmatterItem from './FrontmatterItem';

function FrontmatterSection() {
  return (
    <div className="shrink-0">
      <div className="px-3 pt-4 pb-2">
        <p className="text-xs text-text-tertiary uppercase tracking-wider font-sans">
          Frontmatter
        </p>
      </div>
      <div>
        <FrontmatterItem view="frontmatter-titulo" label="Título y autor" />
        <FrontmatterItem view="frontmatter-copyright" label="Copyright" />
        <FrontmatterItem view="frontmatter-dedicatoria" label="Dedicatoria" />
      </div>
    </div>
  );
}

export default FrontmatterSection;
