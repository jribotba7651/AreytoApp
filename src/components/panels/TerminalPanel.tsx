import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import TerminalView from '@/components/terminal/TerminalView';
import BrowserPanel from '@/components/browser/BrowserPanel';

type TerminalTab = 'terminal' | 'browser';

function TerminalPanel() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<TerminalTab>('terminal');

  const tabClass = (active: boolean) =>
    `h-full px-4 flex items-center text-xs font-medium transition-colors duration-150 border-b-2 ${
      active
        ? 'text-stone-100 border-accent'
        : 'text-stone-400 border-transparent hover:text-stone-200'
    }`;

  return (
    <div className="h-full flex flex-col bg-bg-terminal border-t border-border-subtle overflow-hidden">
      <div className="flex items-end h-9 shrink-0 border-b border-black/40">
        <button className={tabClass(tab === 'terminal')} onClick={() => setTab('terminal')}>
          {t('terminal.tab')}
        </button>
        <button className={tabClass(tab === 'browser')} onClick={() => setTab('browser')}>
          {t('terminal.browserTab')}
        </button>
      </div>
      <div className="flex-1 min-h-0">
        {tab === 'terminal' ? <TerminalView /> : <BrowserPanel />}
      </div>
    </div>
  );
}

export default TerminalPanel;