import { describe, it, expect } from 'vitest';
import { resolveTheme, themeToCssVars, DEFAULT_THEME_ID } from './theme';

describe('resolveTheme', () => {
  it('returns JELA when no args', () => {
    const theme = resolveTheme();
    expect(theme.id).toBe('jela-serif');
    expect(theme.typography.bodyFont).toContain('Iowan Old Style');
  });

  it('returns JELA for unknown id (fallback)', () => {
    const theme = resolveTheme('nonexistent-theme');
    expect(theme.id).toBe('jela-serif');
  });

  it('returns JELA for null/undefined id', () => {
    expect(resolveTheme(null).id).toBe('jela-serif');
    expect(resolveTheme(undefined).id).toBe('jela-serif');
  });

  it('merges overrides shallowly', () => {
    const theme = resolveTheme('jela-serif', { dropCaps: true });
    expect(theme.dropCaps).toBe(true);
    expect(theme.typography.bodyFont).toContain('Iowan Old Style');
  });

  it('deep-merges nested overrides without clobbering siblings', () => {
    const theme = resolveTheme('jela-serif', {
      typography: { paragraph: { justify: false } },
    });
    expect(theme.typography.paragraph.justify).toBe(false);
    expect(theme.typography.paragraph.indentEm).toBe(1.5);
    expect(theme.typography.bodyFont).toContain('Iowan Old Style');
  });

  it('returns base theme unchanged when overrides is null', () => {
    const theme = resolveTheme('jela-serif', null);
    expect(theme.id).toBe('jela-serif');
    expect(theme.typography.lineHeight).toBe(1.65);
  });

  it('backward compat: proyecto sin tema -> JELA', () => {
    const projectTema = undefined;
    const projectOverrides = undefined;
    const theme = resolveTheme(projectTema, projectOverrides);
    expect(theme.id).toBe(DEFAULT_THEME_ID);
    expect(theme.typography.baseSizePx).toBe(18);
  });
});

describe('themeToCssVars', () => {
  it('produces expected CSS custom properties for JELA', () => {
    const theme = resolveTheme();
    const vars = themeToCssVars(theme);

    expect(vars['--book-body-font']).toContain('Iowan Old Style');
    expect(vars['--book-heading-font']).toContain('Iowan Old Style');
    expect(vars['--book-mono-font']).toContain('JetBrains Mono');
    expect(vars['--book-body-size']).toBe('18px');
    expect(vars['--book-line-height']).toBe('1.65');
    expect(vars['--book-h1-size']).toBe(`${18 * 1.8}px`);
    expect(vars['--book-h2-size']).toBe(`${18 * 1.4}px`);
    expect(vars['--book-h3-size']).toBe(`${18 * 1.2}px`);
    expect(vars['--book-indent']).toBe('1.5em');
    expect(vars['--book-para-space']).toBe('0em');
    expect(vars['--book-justify']).toBe('justify');
    expect(vars['--book-measure']).toBe('68ch');
  });

  it('reflects overrides in the output vars', () => {
    const theme = resolveTheme('jela-serif', {
      typography: { baseSizePx: 20, paragraph: { justify: false } },
    });
    const vars = themeToCssVars(theme);

    expect(vars['--book-body-size']).toBe('20px');
    expect(vars['--book-h1-size']).toBe(`${20 * 1.8}px`);
    expect(vars['--book-justify']).toBe('start');
  });
});
