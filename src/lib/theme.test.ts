import { describe, it, expect } from 'vitest';
import { resolveTheme, themeToCssVars, themeToEpubCss, DEFAULT_THEME_ID } from './theme';

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

describe('themeToEpubCss', () => {
  it('emits reader-friendly body (100% font-size, no px)', () => {
    const css = themeToEpubCss(resolveTheme());
    expect(css).toContain('font-size: 100%');
    expect(css).not.toMatch(/font-size:\s*\d+px/);
  });

  it('uses em for heading sizes', () => {
    const css = themeToEpubCss(resolveTheme());
    expect(css).toContain('font-size: 1.8em');
    expect(css).toContain('font-size: 1.4em');
    expect(css).toContain('font-size: 1.2em');
  });

  it('includes font-family for body and headings', () => {
    const css = themeToEpubCss(resolveTheme());
    expect(css).toContain('Iowan Old Style');
    expect(css).toContain('JetBrains Mono');
  });

  it('includes paragraph indent and justify for JELA', () => {
    const css = themeToEpubCss(resolveTheme());
    expect(css).toContain('text-indent: 1.5em');
    expect(css).toContain('text-align: justify');
  });

  it('includes chapter heading align', () => {
    const css = themeToEpubCss(resolveTheme());
    expect(css).toMatch(/h1\s*\{[^}]*text-align:\s*center/);
  });

  it('includes section break ornament styling', () => {
    const css = themeToEpubCss(resolveTheme());
    expect(css).toContain('content: "* * *"');
  });

  it('omits drop caps by default', () => {
    const css = themeToEpubCss(resolveTheme());
    expect(css).not.toContain('first-letter');
  });

  it('includes drop caps when enabled', () => {
    const theme = resolveTheme('jela-serif', { dropCaps: true });
    const css = themeToEpubCss(theme);
    expect(css).toContain('first-letter');
    expect(css).toContain('font-size: 3em');
  });

  it('reflects overrides (no justify, no indent)', () => {
    const theme = resolveTheme('jela-serif', {
      typography: { paragraph: { justify: false, indentEm: 0 } },
    });
    const css = themeToEpubCss(theme);
    expect(css).not.toContain('text-align: justify');
    expect(css).not.toContain('text-indent');
  });
});
