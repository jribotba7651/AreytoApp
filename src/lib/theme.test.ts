import { describe, it, expect } from 'vitest';
import { resolveTheme, themeToCssVars, themeToEpubCss, DEFAULT_THEME_ID, listBuiltInThemes, getBuiltInTheme } from './theme';

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

  it('resuelve modern-sans por id', () => {
    const theme = resolveTheme('modern-sans');
    expect(theme.id).toBe('modern-sans');
    expect(theme.typography.bodyFont).toContain('Inter');
    expect(theme.typography.paragraph.justify).toBe(false);
    expect(theme.typography.paragraph.indentEm).toBe(0);
  });

  it('resuelve classic-literary por id', () => {
    const theme = resolveTheme('classic-literary');
    expect(theme.id).toBe('classic-literary');
    expect(theme.dropCaps).toBe(true);
    expect(theme.chapterHeading.align).toBe('center');
    expect(theme.typography.paragraph.indentEm).toBe(2);
  });

  it('aplica overrides sobre un tema no-default', () => {
    const theme = resolveTheme('modern-sans', {
      typography: { paragraph: { spacingEm: 0.5 } },
    });
    expect(theme.typography.paragraph.spacingEm).toBe(0.5);
    expect(theme.typography.paragraph.indentEm).toBe(0);
    expect(theme.typography.bodyFont).toContain('Inter');
  });

  it('no muta el tema base al aplicar overrides', () => {
    const before = resolveTheme('jela-serif');
    resolveTheme('jela-serif', { dropCaps: true });
    const after = resolveTheme('jela-serif');
    expect(after.dropCaps).toBe(before.dropCaps);
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

  it('emite --book-chapter-align con el valor del tema', () => {
    const jelaVars = themeToCssVars(resolveTheme('jela-serif'));
    expect(jelaVars['--book-chapter-align']).toBe('center');

    const modernVars = themeToCssVars(resolveTheme('modern-sans'));
    expect(modernVars['--book-chapter-align']).toBe('left');
  });

  it('emite --book-drop-caps como flag 0/1', () => {
    const jelaVars = themeToCssVars(resolveTheme('jela-serif'));
    expect(jelaVars['--book-drop-caps']).toBe('0');

    const classicVars = themeToCssVars(resolveTheme('classic-literary'));
    expect(classicVars['--book-drop-caps']).toBe('1');
  });

  it('vars de modern-sans reflejan sans-serif, sin indent, con spacing', () => {
    const vars = themeToCssVars(resolveTheme('modern-sans'));
    expect(vars['--book-body-font']).toContain('Inter');
    expect(vars['--book-indent']).toBe('0em');
    expect(vars['--book-para-space']).toBe('1em');
    expect(vars['--book-justify']).toBe('start');
    expect(vars['--book-measure']).toBe('72ch');
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

  it('emite margin-bottom con spacingEm > 0 para modern-sans', () => {
    const css = themeToEpubCss(resolveTheme('modern-sans'));
    expect(css).toContain('margin-bottom: 1em');
    expect(css).not.toContain('text-indent');
    expect(css).not.toContain('text-align: justify');
  });

  it('h1 align left para modern-sans', () => {
    const css = themeToEpubCss(resolveTheme('modern-sans'));
    expect(css).toMatch(/h1\s*\{[^}]*text-align:\s*left/);
  });

  it('omite ornament de section break si es null', () => {
    const css = themeToEpubCss(resolveTheme('modern-sans'));
    expect(css).not.toContain('hr::after');
    expect(css).not.toContain('content:');
  });

  it('classic-literary incluye drop caps y ornament', () => {
    const css = themeToEpubCss(resolveTheme('classic-literary'));
    expect(css).toContain('first-letter');
    expect(css).toContain('font-size: 3em');
    expect(css).toContain('content: "***"');
    expect(css).toContain('text-indent: 2em');
  });

  it('incluye blockquote y code styling', () => {
    const css = themeToEpubCss(resolveTheme());
    expect(css).toContain('font-style: italic');
    expect(css).toContain('margin-left: 1em');
  });
});

describe('listBuiltInThemes', () => {
  it('retorna todos los temas registrados', () => {
    const themes = listBuiltInThemes();
    expect(themes.length).toBeGreaterThanOrEqual(3);
    const ids = themes.map((t) => t.id);
    expect(ids).toContain('jela-serif');
    expect(ids).toContain('modern-sans');
    expect(ids).toContain('classic-literary');
  });
});

describe('getBuiltInTheme', () => {
  it('retorna el tema por id', () => {
    const theme = getBuiltInTheme('jela-serif');
    expect(theme).toBeDefined();
    expect(theme!.id).toBe('jela-serif');
  });

  it('retorna undefined para id inexistente', () => {
    expect(getBuiltInTheme('no-existe')).toBeUndefined();
  });
});
