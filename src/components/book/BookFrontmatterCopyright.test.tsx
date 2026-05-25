import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import BookFrontmatterCopyright from './BookFrontmatterCopyright';
import type { CopyrightData } from '@/types/frontmatter';

describe('BookFrontmatterCopyright', () => {
  it('copyright fantasma (solo licencia default, sin año ni titular) → no renderiza nada', () => {
    const copyright: CopyrightData = {
      ano: null,
      titular: '',
      licencia: 'Todos los derechos reservados',
    };
    const { container } = render(<BookFrontmatterCopyright copyright={copyright} />);
    expect(container.firstChild).toBeNull();
  });

  it('copyright real (año + titular) → renderiza el bloque con el contenido', () => {
    const copyright: CopyrightData = {
      ano: 2024,
      titular: 'Juan García',
      licencia: 'Todos los derechos reservados',
    };
    const { container } = render(<BookFrontmatterCopyright copyright={copyright} />);
    expect(container.firstChild).not.toBeNull();
    expect(container.textContent).toContain('2024');
    expect(container.textContent).toContain('Juan García');
  });
});
