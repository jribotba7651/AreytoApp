import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';
import { resolveTheme, themeToCssVars } from '@/lib/theme';

interface BookMarkdownProps {
  content: string;
  themeId?: string | null;
  themeOverrides?: Record<string, unknown> | null;
}

const MD_COMPONENTS: Components = {
  h1: ({ children }) => (
    <h1
      className="font-semibold text-text-primary mt-12 mb-6 leading-tight"
      style={{
        fontFamily: 'var(--book-heading-font)',
        fontSize: 'var(--book-h1-size)',
        textAlign: 'var(--book-chapter-align)' as React.CSSProperties['textAlign'],
      }}
    >
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2
      className="font-semibold text-text-primary mt-9 mb-5 leading-tight"
      style={{ fontFamily: 'var(--book-heading-font)', fontSize: 'var(--book-h2-size)' }}
    >
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3
      className="font-semibold text-text-primary mt-7 mb-4"
      style={{ fontFamily: 'var(--book-heading-font)', fontSize: 'var(--book-h3-size)' }}
    >
      {children}
    </h3>
  ),
  p: ({ children }) => (
    <p
      className="text-text-editor"
      style={{
        fontFamily: 'var(--book-body-font)',
        fontSize: 'var(--book-body-size)',
        lineHeight: 'var(--book-line-height)',
        textIndent: 'var(--book-indent)',
        marginBottom: 'var(--book-para-space)',
        textAlign: 'var(--book-justify)' as React.CSSProperties['textAlign'],
      }}
    >
      {children}
    </p>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-text-primary">{children}</strong>
  ),
  em: ({ children }) => <em className="italic">{children}</em>,
  blockquote: ({ children }) => (
    <blockquote className="border-l-[3px] border-accent-muted pl-4 italic text-text-secondary my-6">
      {children}
    </blockquote>
  ),
  code: ({ children, className }) => {
    const isBlock = className?.includes('language-');
    if (isBlock) {
      return (
        <code
          className="text-sm text-text-editor"
          style={{ fontFamily: 'var(--book-mono-font)' }}
        >
          {children}
        </code>
      );
    }
    return (
      <code
        className="text-sm bg-bg-tertiary text-text-primary px-1.5 py-0.5 rounded"
        style={{ fontFamily: 'var(--book-mono-font)' }}
      >
        {children}
      </code>
    );
  },
  pre: ({ children }) => (
    <pre
      className="bg-bg-tertiary rounded p-4 overflow-x-auto my-4 text-sm text-text-editor"
      style={{ fontFamily: 'var(--book-mono-font)' }}
    >
      {children}
    </pre>
  ),
  ul: ({ children }) => <ul className="list-disc pl-6 mb-4 space-y-1">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal pl-6 mb-4 space-y-1">{children}</ol>,
  li: ({ children }) => (
    <li
      className="text-text-editor"
      style={{
        fontFamily: 'var(--book-body-font)',
        fontSize: 'var(--book-body-size)',
        lineHeight: 'var(--book-line-height)',
      }}
    >
      {children}
    </li>
  ),
  a: ({ children, href }) => (
    <a
      href={href}
      className="text-accent hover:underline"
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  ),
  hr: () => <hr className="border-border-subtle my-8 mx-auto w-16" />,
};

const DROP_CAPS_CSS = `
.book-md-dropcaps > p:first-of-type::first-letter {
  font-size: 3em;
  float: left;
  line-height: 1;
  margin-right: 0.1em;
}`;

function BookMarkdown({ content, themeId, themeOverrides }: BookMarkdownProps) {
  const theme = resolveTheme(themeId, themeOverrides);
  const cssVars = themeToCssVars(theme);

  return (
    <div
      style={{ maxWidth: 'var(--book-measure)', ...cssVars } as React.CSSProperties}
      className={`mx-auto px-8 py-8${theme.dropCaps ? ' book-md-dropcaps' : ''}`}
    >
      {theme.dropCaps && <style>{DROP_CAPS_CSS}</style>}
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={MD_COMPONENTS}>
        {content}
      </ReactMarkdown>
    </div>
  );
}

export default BookMarkdown;
