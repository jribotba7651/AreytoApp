import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';
import { convertFileSrc } from '@tauri-apps/api/core';
import { resolveTheme, themeToCssVars } from '@/lib/theme';
import { DEFAULT_BOOK_SETTINGS, type BookSettings, type Chapter } from '@/types/project';
import { readChapter, updateProjectMeta } from '@/lib/project-fs';
import { slugify } from '@/lib/export-composer';
import { useProjectStore } from '@/stores/projectStore';
import { useLayoutStore } from '@/stores/layoutStore';
import { Info, AlertTriangle, Quote } from 'lucide-react';

type CalloutType = 'nota' | 'aviso' | 'cita';

const CALLOUT_RE = /^\[!(NOTA|AVISO|CITA)\]\s*/i;

const CALLOUT_CONFIG: Record<CalloutType, {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  borderColor: string;
  bgColor: string;
  textColor: string;
}> = {
  nota: {
    icon: Info,
    label: 'Nota',
    borderColor: 'border-info',
    bgColor: 'bg-info/5',
    textColor: 'text-info',
  },
  aviso: {
    icon: AlertTriangle,
    label: 'Aviso',
    borderColor: 'border-warning',
    bgColor: 'bg-warning/5',
    textColor: 'text-warning',
  },
  cita: {
    icon: Quote,
    label: 'Cita',
    borderColor: 'border-accent-muted',
    bgColor: 'bg-accent-muted/5',
    textColor: 'text-accent-muted',
  },
};

function extractTextFromNode(node: React.ReactNode): string {
  if (typeof node === 'string') return node;
  if (typeof node === 'number') return String(node);
  if (!React.isValidElement(node)) return '';
  const el = node as React.ReactElement<{ children?: React.ReactNode }>;
  if (!el.props.children) return '';
  if (typeof el.props.children === 'string') return el.props.children;
  if (Array.isArray(el.props.children)) {
    return el.props.children.map(extractTextFromNode).join('');
  }
  return extractTextFromNode(el.props.children);
}

function stripCalloutTag(
  children: React.ReactNode,
): React.ReactNode {
  const arr = React.Children.toArray(children);
  if (arr.length === 0) return children;
  const first = arr[0];
  if (!React.isValidElement(first)) return children;
  const el = first as React.ReactElement<{ children?: React.ReactNode }>;
  const innerChildren = el.props.children;
  if (typeof innerChildren === 'string') {
    const stripped = innerChildren.replace(CALLOUT_RE, '');
    const newFirst = React.cloneElement(el, {}, stripped);
    return [newFirst, ...arr.slice(1)];
  }
  if (Array.isArray(innerChildren)) {
    const firstInner = innerChildren[0];
    if (typeof firstInner === 'string') {
      const stripped = firstInner.replace(CALLOUT_RE, '');
      const newInner = [stripped, ...innerChildren.slice(1)];
      const newFirst = React.cloneElement(el, {}, ...newInner);
      return [newFirst, ...arr.slice(1)];
    }
  }
  return children;
}

function BookCallout({ children }: { children?: React.ReactNode }) {
  const arr = React.Children.toArray(children);
  const firstText = arr.length > 0 ? extractTextFromNode(arr[0]) : '';
  const match = firstText.match(CALLOUT_RE);

  if (!match) {
    // Cita generica (fallback)
    return (
      <blockquote className="border-l-[3px] border-accent-muted pl-4 italic text-text-secondary my-6">
        {children}
      </blockquote>
    );
  }

  const type = match[1]!.toLowerCase() as CalloutType;
  const config = CALLOUT_CONFIG[type];
  const Icon = config.icon;
  const strippedChildren = stripCalloutTag(children);

  return (
    <blockquote
      className={`border-l-[3px] ${config.borderColor} ${config.bgColor} pl-4 pr-4 py-3 my-6 rounded-r`}
    >
      <div className="flex items-center gap-2 mb-2">
        <Icon size={16} className={config.textColor} />
        <span className={`text-sm font-semibold ${config.textColor}`}>
          {config.label}
        </span>
      </div>
      <div className="text-text-editor not-italic">
        {strippedChildren}
      </div>
    </blockquote>
  );
}

interface BookMarkdownProps {
  content: string;
  themeId?: string | null;
  themeOverrides?: Record<string, unknown> | null;
  bookSettings?: BookSettings;
  projectRootPath?: string;
  enableChapterLinks?: boolean;
}

const CHAPTER_LINK_RE = /\[\[([^\]]+)\]\]/g;

function resolveChapterByLink(chapters: Chapter[], name: string): Chapter | null {
  const target = name.trim();
  if (!target) return null;
  const targetLower = target.toLowerCase();
  const targetSlug = slugify(target);

  const byTitle = chapters.find((c) => c.title.toLowerCase() === targetLower);
  if (byTitle) return byTitle;
  const byTitleSlug = chapters.find((c) => slugify(c.title) === targetSlug);
  if (byTitleSlug) return byTitleSlug;
  const byFilename = chapters.find(
    (c) => c.filename.replace(/\.md$/, '').toLowerCase() === targetLower.replace(/\.md$/, ''),
  );
  if (byFilename) return byFilename;
  const byFilenameSlug = chapters.find(
    (c) => slugify(c.filename.replace(/\.md$/, '')) === targetSlug,
  );
  return byFilenameSlug ?? null;
}

function ChapterLink({ name }: { name: string }) {
  const chapters = useProjectStore((s) => s.chapters);
  const currentProject = useProjectStore((s) => s.currentProject);

  const target = resolveChapterByLink(chapters, name);

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!target || !currentProject) return;
    await useProjectStore.getState().flushAutosave?.();
    const read = await readChapter(target.path);
    if (!read.ok) return;
    useProjectStore.getState().setActiveChapter(target.path, read.value);
    await updateProjectMeta(currentProject, { capituloActivo: target.filename });
    useLayoutStore.getState().setActiveTab('capitulo');
  }

  return (
    <button
      type="button"
      onClick={(e) => void handleClick(e)}
      className="text-accent hover:underline font-medium text-inherit"
      title={target ? target.title : name}
    >
      {name}
    </button>
  );
}

function splitChapterLinks(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  for (const match of text.matchAll(CHAPTER_LINK_RE)) {
    const idx = match.index ?? 0;
    if (idx > lastIndex) parts.push(text.slice(lastIndex, idx));
    parts.push(<ChapterLink key={`chapter-link-${idx}`} name={match[1] ?? ''} />);
    lastIndex = idx + match[0].length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts;
}

function applyChapterLinks(children: React.ReactNode): React.ReactNode {
  return React.Children.map(children, (child) => {
    if (typeof child === 'string') return splitChapterLinks(child);
    if (React.isValidElement(child)) {
      const el = child as React.ReactElement<{ children?: React.ReactNode }>;
      return el.props.children != null
        ? React.cloneElement(el, {}, applyChapterLinks(el.props.children))
        : child;
    }
    return child;
  });
}

function buildComponents(
  renderInline: (children: React.ReactNode) => React.ReactNode,
  projectRootPath?: string,
): Components {
  return {
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
      {renderInline(children)}
    </p>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-text-primary">{children}</strong>
  ),
  em: ({ children }) => <em className="italic">{children}</em>,
  blockquote: ({ children }) => {
    return <BookCallout>{children}</BookCallout>;
  },
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
      {renderInline(children)}
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
  img: (({ src, alt }: { src?: string; alt?: string }) => {
    if (!src) return null;
    const resolved = resolveImageSrc(src, projectRootPath);
    return (
      <figure className="my-6 flex flex-col items-center">
        <img
          src={resolved}
          alt={alt ?? ''}
          style={{ maxWidth: '100%', height: 'auto' }}
          className="rounded"
        />
        {alt && (
          <figcaption className="text-sm text-text-secondary mt-2 text-center italic">
            {alt}
          </figcaption>
        )}
      </figure>
    );
  }) as Components['img'],
  };
}

const DROP_CAPS_CSS = `
.book-md-dropcaps > p:first-of-type::first-letter {
  font-size: 3em;
  float: left;
  line-height: 1;
  margin-right: 0.1em;
}`;

function bookSettingsToStyle(bs: BookSettings): React.CSSProperties {
  const SCALE_PX = 96;
  const contentWidth = bs.trimWidth - bs.marginInner - bs.marginOuter;
  return {
    maxWidth: `${Math.round(contentWidth * SCALE_PX)}px`,
    paddingTop: `${Math.round(bs.marginTop * SCALE_PX * 0.5)}px`,
    paddingBottom: `${Math.round(bs.marginBottom * SCALE_PX * 0.5)}px`,
    paddingLeft: `${Math.round(bs.marginInner * SCALE_PX * 0.5)}px`,
    paddingRight: `${Math.round(bs.marginOuter * SCALE_PX * 0.5)}px`,
  };
}

function resolveImageSrc(src: string, projectRootPath?: string): string {
  if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:')) {
    return src;
  }
  if (projectRootPath) {
    const absolutePath = src.startsWith('/') ? src : `${projectRootPath}/${src}`;
    return convertFileSrc(absolutePath);
  }
  return src;
}

function BookMarkdown({ content, themeId, themeOverrides, bookSettings, projectRootPath, enableChapterLinks }: BookMarkdownProps) {
  const theme = resolveTheme(themeId, themeOverrides);
  const cssVars = themeToCssVars(theme);
  const bs = bookSettings ?? DEFAULT_BOOK_SETTINGS;
  const trimStyle = bookSettingsToStyle(bs);

  const components = useMemo<Components>(() => {
    const renderInline = (children: React.ReactNode) =>
      enableChapterLinks ? applyChapterLinks(children) : children;
    return buildComponents(renderInline, projectRootPath);
  }, [projectRootPath, enableChapterLinks]);

  return (
    <div
      style={{ ...trimStyle, ...cssVars } as React.CSSProperties}
      className={`mx-auto${theme.dropCaps ? ' book-md-dropcaps' : ''}`}
    >
      {theme.dropCaps && <style>{DROP_CAPS_CSS}</style>}
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}

export default BookMarkdown;
