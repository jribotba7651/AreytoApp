import { useState } from 'react';
import { RefreshCw, Check, Copy } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getRandomPrompt, type WritingPrompt } from '@/lib/writing-prompts';

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

function WritingPromptsPanel() {
  const { t, i18n } = useTranslation();
  const isSpanish = i18n.language.startsWith('es');
  const [prompt, setPrompt] = useState<WritingPrompt>(() => getRandomPrompt());
  const [copied, setCopied] = useState(false);

  function handleNewPrompt() {
    setCopied(false);
    setPrompt(getRandomPrompt());
  }

  async function handleCopy() {
    const ok = await copyText(isSpanish ? prompt.es : prompt.en);
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="p-3 flex flex-col h-full">
      <h4 className="text-xs font-medium text-text-secondary uppercase tracking-wide">
        {t('writingToolbar.prompts')}
      </h4>

      <button
        onClick={() => void handleCopy()}
        title={t('writingToolbar.promptsCopyHint')}
        className="mt-3 flex-1 min-h-0 w-full text-left px-3 py-4 rounded border border-border-subtle bg-bg-tertiary hover:border-accent transition-colors duration-150 group"
      >
        <p className="font-serif text-sm text-text-primary leading-relaxed break-words">
          {isSpanish ? prompt.es : prompt.en}
        </p>
        <span className="mt-3 inline-flex items-center gap-1 text-[10px] text-text-tertiary group-hover:text-accent">
          {copied ? <Check size={11} /> : <Copy size={11} />}
          {copied ? t('writingToolbar.promptsCopied') : t('writingToolbar.promptsCopyHint')}
        </span>
      </button>

      <button
        onClick={handleNewPrompt}
        className="mt-2 w-full flex items-center justify-center gap-1.5 px-2 py-1.5 text-[11px] text-text-primary bg-accent-muted rounded hover:bg-accent transition-colors duration-150"
      >
        <RefreshCw size={12} />
        {t('writingToolbar.promptsNew')}
      </button>
    </div>
  );
}

export default WritingPromptsPanel;
