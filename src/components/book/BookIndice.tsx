import type { IndiceItem } from '@/lib/export-composer';

interface Props {
  items: IndiceItem[];
}

function BookIndice({ items }: Props) {
  if (items.length === 0) return null;

  return (
    <div className="max-w-[700px] mx-auto px-8 py-8 border-b border-border-subtle">
      <h2 className="font-serif text-lg font-semibold text-text-primary mb-4">Índice</h2>
      <nav>
        <ul className="space-y-1">
          {items.map((item) => (
            <li key={item.slug}>
              <a
                href={`#${item.slug}`}
                className="font-serif text-sm text-text-secondary hover:text-text-primary transition-colors duration-150"
              >
                {item.title}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

export default BookIndice;
