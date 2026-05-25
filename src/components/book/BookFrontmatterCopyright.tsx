import type { CopyrightData } from '@/types/frontmatter';
import { hasRealCopyright } from '@/lib/export-composer';

interface Props {
  copyright: CopyrightData;
}

function BookFrontmatterCopyright({ copyright }: Props) {
  if (!hasRealCopyright(copyright)) return null;

  const yearLine = copyright.ano ? `© ${copyright.ano}` : '©';
  const creditLine = copyright.titular ? `${yearLine} ${copyright.titular}` : yearLine;

  return (
    <div className="max-w-[700px] mx-auto px-8 py-8 text-center border-t border-border-subtle">
      <p className="font-serif text-xs text-text-tertiary leading-relaxed">
        {creditLine}
        {copyright.licencia && (
          <>
            <br />
            {copyright.licencia}
          </>
        )}
        {copyright.notas && (
          <>
            <br />
            <span className="mt-1 inline-block">{copyright.notas}</span>
          </>
        )}
      </p>
    </div>
  );
}

export default BookFrontmatterCopyright;
