import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { SHORTCUTS, formatShortcut } from '@/lib/keyboard-shortcuts';
import type { ShortcutDef } from '@/lib/keyboard-shortcuts';

interface ShortcutsDialogProps {
  onClose: () => void;
}

interface ShortcutRow {
  labelKey: string;
  shortcut: ShortcutDef;
}

const SHORTCUT_ROWS: ShortcutRow[] = [
  { labelKey: 'shortcuts.save', shortcut: SHORTCUTS.SAVE },
  { labelKey: 'shortcuts.newChapter', shortcut: SHORTCUTS.NEW_CHAPTER },
  { labelKey: 'shortcuts.closeChapter', shortcut: SHORTCUTS.CLOSE_CHAPTER },
  { labelKey: 'shortcuts.refresh', shortcut: SHORTCUTS.REFRESH },
  { labelKey: 'shortcuts.toggleEditor', shortcut: SHORTCUTS.TOGGLE_EDITOR_VIEW },
  { labelKey: 'shortcuts.tabChapter', shortcut: SHORTCUTS.TAB_CHAPTER },
  { labelKey: 'shortcuts.tabBook', shortcut: SHORTCUTS.TAB_BOOK },
  { labelKey: 'shortcuts.tabFinished', shortcut: SHORTCUTS.TAB_FINISHED },
  { labelKey: 'shortcuts.tabSettings', shortcut: SHORTCUTS.TAB_SETTINGS },
  { labelKey: 'shortcuts.openProject', shortcut: SHORTCUTS.OPEN_PROJECT },
  { labelKey: 'shortcuts.closeProject', shortcut: SHORTCUTS.CLOSE_PROJECT },
  { labelKey: 'shortcuts.showShortcuts', shortcut: SHORTCUTS.SHOW_SHORTCUTS },
];

function ShortcutsDialog({ onClose }: ShortcutsDialogProps) {
  const { t } = useTranslation();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 bg-black/60"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-bg-tertiary border border-border-default rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-start justify-between mb-4">
          <h2 className="text-base font-semibold text-text-primary">
            {t('shortcuts.title')}
          </h2>
          <button
            onClick={onClose}
            aria-label={t('about.close')}
            className="flex items-center justify-center w-6 h-6 rounded text-text-tertiary hover:text-text-primary transition-colors duration-150"
          >
            <X size={14} />
          </button>
        </div>

        <div className="space-y-1">
          {SHORTCUT_ROWS.map((row) => (
            <div
              key={row.labelKey}
              className="flex items-center justify-between py-1.5 text-sm"
            >
              <span className="text-text-secondary">{t(row.labelKey)}</span>
              <kbd className="px-2 py-0.5 rounded bg-bg-secondary border border-border-subtle text-xs font-mono text-text-primary">
                {formatShortcut(row.shortcut)}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ShortcutsDialog;
