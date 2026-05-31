import type { TituloData } from '@/types/frontmatter';

interface Props {
  titulo: TituloData;
}

function BookFrontmatterTitle({ titulo }: Props) {
  if (!titulo.titulo && !titulo.autor) return null;

  return (
    <div style={{ fontSize: 'var(--font-size-book)', fontFamily: 'var(--font-book)' }} className="max-w-[700px] mx-auto px-8 pt-16 pb-12 text-center">
      {titulo.titulo && (
        <h1 className="text-[1.78em] font-semibold text-text-primary leading-tight">
          {titulo.titulo}
        </h1>
      )}
      {titulo.subtitulo && (
        <p className="text-xl text-text-secondary mt-3 leading-snug">
          {titulo.subtitulo}
        </p>
      )}
      {titulo.autor && (
        <p className="text-base text-text-secondary mt-6">{titulo.autor}</p>
      )}
      <div className="w-16 border-b border-border-subtle mx-auto mt-10" />
    </div>
  );
}

export default BookFrontmatterTitle;
