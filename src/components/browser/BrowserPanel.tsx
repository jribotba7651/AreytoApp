import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshCw, ExternalLink, CornerDownLeft } from 'lucide-react';
import { WebviewWindow } from '@tauri-apps/api/webviewWindow';

const DEFAULT_URL = 'https://claude.ai';

function normalizeUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return DEFAULT_URL;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function BrowserPanel() {
  const { t } = useTranslation();
  const [input, setInput] = useState(DEFAULT_URL);
  const [url, setUrl] = useState(DEFAULT_URL);
  const [frameKey, setFrameKey] = useState(0);

  const navigate = () => {
    const target = normalizeUrl(input);
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