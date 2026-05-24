import type { TituloData } from '@/types/frontmatter';

interface Props {
  titulo: TituloData;
}

function BookFrontmatterTitle({ titulo }: Props) {
  if (!titulo.titulo && !titulo.autor) return null;

  return (
    <div className="max-w-[700px] mx-auto px-8 pt-16 pb-12 text-center">
      {titulo.titulo && (
        <h1 className="font-serif text-[32px] font-semibold text-text-primary leading-tight">
          {titulo.titulo}
        </h1>
      )}
      {titulo.subtitulo && (
        <p className="font-serif text-xl text-text-secondary mt-3 leading-snug">
          {titulo.subtitulo}
        </p>
      )}
      {titulo.autor && (
        <p className="font-serif text-base text-text-secondary mt-6">{titulo.autor}</p>
      )}
      <div className="w-16 border-b border-border-subtle mx-auto mt-10" />
    </div>
  );
}

export default BookFrontmatterTitle;
