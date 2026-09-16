import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshCw, ExternalLink, CornerDownLeft, Copy, Check } from 'lucide-react';
import { WebviewWindow } from '@tauri-apps/api/webviewWindow';
import { useProjectStore } from '@/stores/projectStore';

const DEFAULT_URL = 'https://claude.ai';

const QUICK_LINKS = [
  { label: 'Claude', url: 'https://claude.ai' },
  { label: 'Spiral', url: 'https://spiralwriting.com' },
  { label: 'ChatGPT', url: 'https://chatgpt.com' },
  { label: 'Perplexity', url: 'https://perplexity.ai' },
];

function normalizeUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return DEFAULT_URL;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    let copied = false;
    try {
      copied = document.execCommand('copy');
    } catch {
      copied = false;
    }
    document.body.removeChild(textarea);
    return copied;
  }
}

function BrowserPanel() {
  const { t } = useTranslation();
  const [input, setInput] = useState(DEFAULT_URL);
  const [url, setUrl] = useState(DEFAULT_URL);
  const [frameKey, setFrameKey] = useState(0);
  const [copied, setCopied] = useState(false);

  const navigate = () => {
    const target = normalizeUrl(input);
    setInput(target);
    setUrl(target);
    setFrameKey((key) => key + 1);
  };

  const goTo = (target: string) => {
    setInput(target);
    setUrl(target);
    setFrameKey((key) => key + 1);
  };

  const reload = () => {
    setFrameKey((key) => key + 1);
  };

  const openInWindow = () => {
    const target = normalizeUrl(input);
    const label = `browser-${Date.now()}`;
    new WebviewWindow(label, {
      url: target,
      title: t('browser.title'),
      width: 1200,
      height: 800,
    });
  };

  const copyChapter = async () => {
    const content = useProjectStore.getState().activeChapterContent;
    if (!content) return;
    const ok = await copyText(content);
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="h-full flex flex-col bg-bg-terminal">
      <div className="flex items-center gap-1 px-2 h-9 shrink-0 border-b border-black/40">
        <button
          onClick={reload}
          aria-label={t('browser.reload')}
          title={t('browser.reload')}
          className="flex items-center justify-center w-6 h-6 rounded text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-colors duration-150"
        >
          <RefreshCw size={14} />
        </button>
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') navigate();
          }}
          placeholder="https://claude.ai"
          spellCheck={false}
          className="flex-1 min-w-0 h-6 px-2 rounded bg-stone-800 text-stone-200 text-xs font-mono border border-transparent focus:border-accent outline-none"
        />
        <button
          onClick={navigate}
          aria-label={t('browser.go')}
          title={t('browser.go')}
          className="flex items-center justify-center w-6 h-6 rounded text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-colors duration-150"
        >
          <CornerDownLeft size={14} />
        </button>
        <button
          onClick={openInWindow}
          aria-label={t('browser.openInWindow')}
          title={t('browser.openInWindow')}
          className="flex items-center justify-center w-6 h-6 rounded text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-colors duration-150"
        >
          <ExternalLink size={14} />
        </button>
      </div>
      <div className="flex items-center gap-1 px-2 h-8 shrink-0 border-b border-black/40">
        {QUICK_LINKS.map((link) => (
          <button
            key={link.url}
            onClick={() => goTo(link.url)}
            title={link.url}
            className="px-2 h-5 rounded-full bg-stone-800 text-stone-300 text-xs hover:bg-stone-700 hover:text-stone-100 transition-colors duration-150"
          >
            {link.label}
          </button>
        ))}
        <div className="flex-1" />
        <button
          onClick={copyChapter}
          title={t('browser.copyChapter')}
          className="flex items-center gap-1 px-2 h-5 rounded-full bg-stone-800 text-stone-300 text-xs hover:bg-stone-700 hover:text-stone-100 transition-colors duration-150"
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? t('browser.copied') : t('browser.copyChapter')}
        </button>
      </div>
      <iframe
        key={frameKey}
        src={url}
        title={t('browser.title')}
        className="flex-1 w-full border-0 bg-bg-editor"
        allow="fullscreen; autoplay; clipboard-read; clipboard-write; encrypted-media; picture-in-picture"
        referrerPolicy="no-referrer"
      />
    </div>
  );
}

export default BrowserPanel;
