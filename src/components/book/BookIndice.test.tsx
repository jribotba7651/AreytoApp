import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

import BookIndice from './BookIndice';
import type { IndiceItem } from '@/lib/export-composer';

describe('BookIndice', () => {
  it('lista vacía → no renderiza nada', () => {
    const { container } = render(<BookIndice items={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('múltiples items → renderiza un link por item con href correcto', () => {
    const items: IndiceItem[] = [
      { title: 'Capítulo 1', slug: 'cap-01' },
      { title: 'Capítulo 2', slug: 'cap-02' },
    ];
    const { container } = render(<BookIndice items={items} />);
    const links = container.querySelectorAll('a');
    expect(links).toHaveLength(2);
    expect(links[0]!.getAttribute('href')).toBe('#cap-01');
    expect(links[0]!.textContent).toBe('Capítulo 1');
    expect(links[1]!.getAttribute('href')).toBe('#cap-02');
    expect(links[1]!.textContent).toBe('Capítulo 2');
  });

  it('un solo item → renderiza un único link', () => {
    const items: IndiceItem[] = [{ title: 'Introducción', slug: 'introduccion' }];
    const { container } = render(<BookIndice items={items} />);
    const links = container.querySelectorAll('a');
    expect(links).toHaveLength(1);
    expect(links[0]!.getAttribute('href')).toBe('#introduccion');
    expect(links[0]!.textContent).toBe('Introducción');
  });
});
