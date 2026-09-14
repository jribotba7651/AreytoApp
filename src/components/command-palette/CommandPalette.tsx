import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Search,
  FilePlus,
  Download,
  Settings,
  Sun,
  Moon,
  Maximize2,
  BookOpen,
  PenLine,
  CheckCircle2,
  BarChart3,
  FileText,
} from 'lucide-react';
import { useLayoutStore } from '@/stores/layoutStore';
import { useProjectStore } from '@/stores/projectStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { createChapter, updateProjectMeta, readChapter } from '@/lib/project-fs';
import type { Tab } from '@/types/layout';

interface PaletteItem {
  id: string;
  label: string;
  category: 'chapter' | 'action';
  icon: React.ReactNode;
  action: () => void | Promise<void>;
}

function CommandPalette() {
  const { t } = useTranslation();
  const setShowCommandPalette = useLayoutStore((s) => s.setShowCommandPalette);
  const chapters = useProjectStore((s) => s.chapters);
  const currentProject = useProjectStore((s) => s.currentProject);
  const themeMode = useSettingsStore((s) => s.themeMode);

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => {
    setShowCommandPalette(false);
  }, [setShowCommandPalette]);

  const actions: PaletteItem[] = useMemo(() => {
    const items: PaletteItem[] = [];

    // Chapter items
    for (const ch of chapters) {
      items.push({
        id: `ch-${ch.path}`,
        label: ch.title,
        category: 'chapter',
        icon: <FileText size={14} />,
        action: async () => {
          if (!currentProject) return;
          const read = await readChapter(ch.path);
          if (!read.ok) return;
          useProjectStore.getState().setActiveChapter(ch.path, read.value);
          await updateProjectMeta(currentProject, { capituloActivo: ch.filename });
          useLayoutStore.getState().setActiveTab('capitulo');
          close();
        },
      });
    }

    // Action items
    items.push({
      id: 'action-new-chapter',
      label: t('commandPalette.actionNewChapter'),
      category: 'action',
      icon: <FilePlus size={14} />,
      action: async () => {
        if (!currentProject) return;
        const result = await createChapter(currentProject);
        if (!result.ok) return;
        useProjectStore.getState().addChapter(result.value);
        await updateProjectMeta(currentProject, { capituloActivo: result.value.filename });
        const read = await readChapter(result.value.path);
        const content = read.ok ? read.value : `# ${result.value.title}\n\n`;
        useProjectStore.getState().setActiveChapter(result.value.path, content);
        useLayoutStore.getState().setActiveTab('capitulo');
        close();
      },
    });

    items.push({
      id: 'action-export',
      label: t('commandPalette.actionExport'),
      category: 'action',
      icon: <Download size={14} />,
      action: () => {
        useLayoutStore.getState().setShowExportDialog(true);
        close();
      },
    });

    items.push({
      id: 'action-settings',
      label: t('commandPalette.actionSettings'),
      category: 'action',
      icon: <Settings size={14} />,
      action: () => {
        useLayoutStore.getState().setActiveTab('ajustes');
        close();
      },
    });

    items.push({
      id: 'action-toggle-theme',
      label: t('commandPalette.actionToggleTheme'),
      category: 'action',
      icon: themeMode === 'dark' ? <Sun size={14} /> : <Moon size={14} />,
      action: () => {
        const next = themeMode === 'dark' ? 'light' : 'dark';
        void useSettingsStore.getState().setThemeMode(next);
        close();
      },
    });

    items.push({
      id: 'action-focus-mode',
      label: t('commandPalette.actionFocusMode'),
      category: 'action',
      icon: <Maximize2 size={14} />,
      action: () => {
        useLayoutStore.getState().toggleFocusMode();
        close();
      },
    });

    const tabActions: Array<{ id: string; label: string; tab: Tab; icon: React.ReactNode }> = [
      { id: 'action-tab-book', label: t('commandPalette.actionTabBook'), tab: 'libro', icon: <BookOpen size={14} /> },
      { id: 'action-tab-chapter', label: t('commandPalette.actionTabChapter'), tab: 'capitulo', icon: <PenLine size={14} /> },
      { id: 'action-tab-finished', label: t('commandPalette.actionTabFinished'), tab: 'terminados', icon: <CheckCircle2 size={14} /> },
      { id: 'action-tab-stats', label: t('commandPalette.actionTabStats'), tab: 'stats', icon: <BarChart3 size={14} /> },
    ];

    for (const ta of tabActions) {
      items.push({
        id: ta.id,
        label: ta.label,
        category: 'action',
        icon: ta.icon,
        action: () => {
          useLayoutStore.getState().setActiveTab(ta.tab);
          close();
        },
      });
    }

    return items;
  }, [chapters, currentProject, themeMode, t, close]);

  const filtered = useMemo(() => {
    if (!query.trim()) return actions;
    const q = query.toLowerCase();
    return actions.filter((item) => item.label.toLowerCase().includes(q));
  }, [actions, query]);

  const chapterResults = filtered.filter((i) => i.category === 'chapter');
  const actionResults = filtered.filter((i) => i.category === 'action');

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, filtered.length - 1));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        const item = filtered[selectedIndex];
        if (item) void item.action();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filtered, selectedIndex, close]);

  // Scroll selected item into view
  useEffect(() => {
    const container = listRef.current;
    if (!container) return;
    const selected = container.querySelector('[data-selected="true"]');
    if (selected) {
      selected.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  let flatIndex = -1;

  function renderItem(item: PaletteItem) {
    flatIndex++;
    const idx = flatIndex;
    const isSelected = idx === selectedIndex;
    return (
      <button
        key={item.id}
        data-selected={isSelected}
        className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm transition-colors duration-100 ${
          isSelected ? 'bg-accent-muted/40 text-text-primary' : 'text-text-secondary hover:bg-bg-tertiary'
        }`}
        onClick={() => void item.action()}
        onMouseEnter={() => setSelectedIndex(idx)}
      >
        <span className="text-text-tertiary shrink-0">{item.icon}</span>
        <span className="truncate">{item.label}</span>
      </button>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]"
      onClick={close}
    >
      <div className="fixed inset-0 bg-black/40" />
      <div
        className="relative w-full max-w-md rounded-lg border border-border-default bg-bg-primary shadow-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 px-3 py-2 border-b border-border-subtle">
          <Search size={16} className="text-text-tertiary shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('commandPalette.placeholder')}
            className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-tertiary outline-none"
          />
          <kbd className="text-[10px] text-text-tertiary bg-bg-tertiary border border-border-subtle rounded px-1.5 py-0.5 font-mono">
            ESC
          </kbd>
        </div>

        <div ref={listRef} className="max-h-72 overflow-y-auto">
          {filtered.length === 0 && (
            <p className="px-3 py-6 text-sm text-text-tertiary text-center">
              {t('commandPalette.noResults')}
            </p>
          )}

          {chapterResults.length > 0 && (
            <div>
              <div className="px-3 pt-2 pb-1 text-[10px] font-medium uppercase tracking-wider text-text-tertiary">
                {t('commandPalette.chapters')}
              </div>
              {chapterResults.map(renderItem)}
            </div>
          )}

          {actionResults.length > 0 && (
            <div>
              <div className="px-3 pt-2 pb-1 text-[10px] font-medium uppercase tracking-wider text-text-tertiary">
                {t('commandPalette.actions')}
              </div>
              {actionResults.map(renderItem)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CommandPalette;
