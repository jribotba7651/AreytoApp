export interface Theme {
  id: string;
  name: string;
  schemaVersion: 1;
  typography: {
    bodyFont: string;
    headingFont: string;
    monoFont: string;
    baseSizePt: number;
    baseSizePx: number;
    lineHeight: number;
    headingScale: { h1: number; h2: number; h3: number; h4: number; h5: number; h6: number };
    paragraph: { indentEm: number; spacingEm: number; justify: boolean };
  };
  chapterHeading: {
    align: 'left' | 'center';
    numberStyle: 'none' | 'numeric' | 'word';
    showTitle: boolean;
    ornament: string | null;
  };
  sectionBreak: { ornament: string | null };
  dropCaps: boolean;
  measure: { maxWidthCh: number };
}

export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

const JELA_SERIF: Theme = {
  id: 'jela-serif',
  name: 'JELA Serif',
  schemaVersion: 1,
  typography: {
    bodyFont: '"Iowan Old Style", Charter, Georgia, serif',
    headingFont: '"Iowan Old Style", Charter, Georgia, serif',
    monoFont: '"JetBrains Mono", monospace',
    baseSizePt: 11,
    baseSizePx: 18,
    lineHeight: 1.65,
    headingScale: { h1: 1.8, h2: 1.4, h3: 1.2, h4: 1.1, h5: 1.0, h6: 1.0 },
    paragraph: { indentEm: 1.5, spacingEm: 0, justify: true },
  },
  chapterHeading: {
    align: 'center',
    numberStyle: 'none',
    showTitle: true,
    ornament: null,
  },
  sectionBreak: { ornament: '* * *' },
  dropCaps: false,
  measure: { maxWidthCh: 68 },
};

const BUILT_IN_THEMES: Record<string, Theme> = {
  'jela-serif': JELA_SERIF,
};

export const DEFAULT_THEME_ID = 'jela-serif';

function deepMerge(base: Record<string, unknown>, overrides: Record<string, unknown>): Record<string, unknown> {
  const result = { ...base };
  for (const key of Object.keys(overrides)) {
    const baseVal = base[key];
    const overVal = overrides[key];
    if (overVal !== undefined && overVal !== null && typeof overVal === 'object' && !Array.isArray(overVal)
        && baseVal !== null && typeof baseVal === 'object' && !Array.isArray(baseVal)) {
      result[key] = deepMerge(baseVal as Record<string, unknown>, overVal as Record<string, unknown>);
    } else if (overVal !== undefined) {
      result[key] = overVal;
    }
  }
  return result;
}

export function resolveTheme(
  themeId?: string | null,
  overrides?: Record<string, unknown> | null,
): Theme {
  const base = BUILT_IN_THEMES[themeId ?? DEFAULT_THEME_ID] ?? BUILT_IN_THEMES[DEFAULT_THEME_ID]!;
  if (!overrides) return base;
  return deepMerge(base as unknown as Record<string, unknown>, overrides as Record<string, unknown>) as unknown as Theme;
}

export function themeToCssVars(theme: Theme): Record<string, string> {
  const s = theme.typography;
  const hs = s.headingScale;
  const p = s.paragraph;
  return {
    '--book-body-font': s.bodyFont,
    '--book-heading-font': s.headingFont,
    '--book-mono-font': s.monoFont,
    '--book-body-size': `${s.baseSizePx}px`,
    '--book-line-height': String(s.lineHeight),
    '--book-h1-size': `${s.baseSizePx * hs.h1}px`,
    '--book-h2-size': `${s.baseSizePx * hs.h2}px`,
    '--book-h3-size': `${s.baseSizePx * hs.h3}px`,
    '--book-h4-size': `${s.baseSizePx * hs.h4}px`,
    '--book-h5-size': `${s.baseSizePx * hs.h5}px`,
    '--book-h6-size': `${s.baseSizePx * hs.h6}px`,
    '--book-indent': `${p.indentEm}em`,
    '--book-para-space': `${p.spacingEm}em`,
    '--book-justify': p.justify ? 'justify' : 'start',
    '--book-measure': `${theme.measure.maxWidthCh}ch`,
  };
}

export function themeToEpubCss(theme: Theme): string {
  const t = theme.typography;
  const hs = t.headingScale;
  const p = t.paragraph;
  const ch = theme.chapterHeading;

  const lines: string[] = [];

  lines.push('body {');
  lines.push(`  font-family: ${t.bodyFont};`);
  lines.push('  font-size: 100%;');
  lines.push(`  line-height: ${t.lineHeight};`);
  lines.push('}');

  lines.push('p {');
  if (p.indentEm > 0) lines.push(`  text-indent: ${p.indentEm}em;`);
  if (p.spacingEm > 0) lines.push(`  margin-bottom: ${p.spacingEm}em;`);
  else lines.push('  margin-bottom: 0;');
  lines.push('  margin-top: 0;');
  if (p.justify) lines.push('  text-align: justify;');
  lines.push('}');

  const headingEntries: [string, number][] = [
    ['h1', hs.h1], ['h2', hs.h2], ['h3', hs.h3],
    ['h4', hs.h4], ['h5', hs.h5], ['h6', hs.h6],
  ];
  for (const [tag, scale] of headingEntries) {
    lines.push(`${tag} {`);
    lines.push(`  font-family: ${t.headingFont};`);
    lines.push(`  font-size: ${scale}em;`);
    if (tag === 'h1') lines.push(`  text-align: ${ch.align};`);
    lines.push('}');
  }

  lines.push('code, pre {');
  lines.push(`  font-family: ${t.monoFont};`);
  lines.push('}');

  lines.push('blockquote {');
  lines.push('  font-style: italic;');
  lines.push('  margin-left: 1em;');
  lines.push('  margin-right: 1em;');
  lines.push('}');

  if (theme.sectionBreak.ornament) {
    lines.push('hr {');
    lines.push('  border: none;');
    lines.push('  text-align: center;');
    lines.push('}');
    lines.push('hr::after {');
    lines.push(`  content: "${theme.sectionBreak.ornament}";`);
    lines.push('  letter-spacing: 0.5em;');
    lines.push('}');
  }

  if (theme.dropCaps) {
    lines.push('p:first-of-type::first-letter {');
    lines.push('  font-size: 3em;');
    lines.push('  float: left;');
    lines.push('  line-height: 1;');
    lines.push('  margin-right: 0.1em;');
    lines.push('}');
  }

  return lines.join('\n');
}

export function getBuiltInTheme(id: string): Theme | undefined {
  return BUILT_IN_THEMES[id];
}

export function listBuiltInThemes(): Theme[] {
  return Object.values(BUILT_IN_THEMES);
}
