import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';

interface BookMarkdownProps {
  content: string;
  maxWidth?: number;
}

const MD_COMPONENTS: Components = {
  h1: ({ children }) => (
    <h1 className="font-serif text-[32px] font-semibold text-text-primary mt-12 mb-6 leading-tight">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="font-serif text-[25px] font-semibold text-text-primary mt-9 mb-5 leading-tight">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="font-serif text-[20px] font-semibold text-text-primary mt-7 mb-4">
      {children}
    </h3>
  ),
  p: ({ children }) => (
    <p className="font-serif text-[18px] text-text-editor leading-[1.8] mb-4">{children}</p>
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
        <code className="font-mono text-sm text-text-editor">{children}</code>
      );
    }
    return (
      <code className="font-mono text-sm bg-bg-tertiary text-text-primary px-1.5 py-0.5 rounded">
        {children}
      </code>
    );
  },
  pre: ({ children }) => (
    <pre className="bg-bg-tertiary rounded p-4 overflow-x-auto my-4 text-sm font-mono text-text-editor">
      {children}
    </pre>
  ),
  ul: ({ children }) => <ul className="list-disc pl-6 mb-4 space-y-1">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal pl-6 mb-4 space-y-1">{children}</ol>,
  li: ({ children }) => (
    <li className="font-serif text-[18px] text-text-editor leading-[1.8]">{children}</li>
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

function BookMarkdown({ content, maxWidth = 700 }: BookMarkdownProps) {
  return (
    <div style={{ maxWidth }} className="mx-auto px-8 py-8">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={MD_COMPONENTS}>
        {content}
      </ReactMarkdown>
    </div>
  );
}

export default BookMarkdown;
