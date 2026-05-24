import FrontmatterItem from './FrontmatterItem';

function BackmatterSection() {
  return (
    <div className="shrink-0">
      <div className="px-3 pt-4 pb-2">
        <p className="text-xs text-text-tertiary uppercase tracking-wider font-sans">
          Backmatter
        </p>
      </div>
      <div>
        <FrontmatterItem view="backmatter-agradecimientos" label="Agradecimientos" />
      </div>
    </div>
  );
}

export default BackmatterSection;
