import { useState, useEffect, useRef } from 'react';
import { Type, Search, BookOpen, MessageSquare, Bookmark } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { invoke } from '@tauri-apps/api/core';
import { useProjectStore } from '@/stores/projectStore';

type ToolPanel = 'editor-settings' | 'find-replace' | 'notes' | null;

function EditorSettingsPanel() {
  const { t } = useTranslation();
  const [fontFamily, setFontFamily] = useState('serif');
  const [fontSize, setFontSize] = useState(16);
  const [lineHeight, setLineHeight] = useState(1.7);
  const [paragraphMode, setParagraphMode] = useState<'indent' | 'spaced'>('indent');
  const [justified, setJustified] = useState(false);

  return (
    <div className="p-3 space-y-4">
      <h4 className="text-xs font-medium text-text-secondary uppercase tracking-wide">
        {t('writingToolbar.editorSettings.title')}
      </h4>

      <div className="space-y-1">
        <label className="text-[11px] text-text-tertiary">{t('writingToolbar.editorSettings.fontFamily')}</label>
        <select
          value={fontFamily}
          onChange={(e) => setFontFamily(e.target.value)}
          className="w-full px-2 py-1 text-xs bg-bg-tertiary border border-border-subtle rounded focus:border-accent outline-none"
        >
          <option value="serif">Iowan Old Style / Charter</option>
          <option value="sans">Inter / System</option>
          <option value="mono">JetBrains Mono</option>
          <option value="georgia">Georgia</option>
          <option value="palatino">Palatino</option>
        </select>
      </div>

      <div className="space-y-1">
        <label className="text-[11px] text-text-tertiary">
          {t('writingToolbar.editorSettings.fontSize')} - {fontSize}px
        </label>
        <input
          type="range"
          min={12}
          max={24}
          step={1}
          value={fontSize}
          onChange={(e) => setFontSize(Number(e.target.value))}
          className="w-full accent-accent"
        />
      </div>

      <div className="space-y-1">
        <label className="text-[11px] text-text-tertiary">
          {t('writingToolbar.editorSettings.lineHeight')} - {lineHeight.toFixed(2)}
        </label>
        <input
          type="range"
          min={1.2}
          max={2.4}
          step={0.05}
          value={lineHeight}
          onChange={(e) => setLineHeight(Number(e.target.value))}
          className="w-full accent-accent"
        />
      </div>

      <div className="space-y-2">
        <label className="text-[11px] text-text-tertiary">{t('writingToolbar.editorSettings.paragraphStyle')}</label>
        <div className="flex gap-2">
          <button
            onClick={() => setParagraphMode('indent')}
            className={`px-2 py-1 text-[11px] rounded border transition-colors duration-150 ${
              paragraphMode === 'indent'
                ? 'border-accent bg-bg-tertiary text-text-primary'
                : 'border-border-subtle text-text-tertiary hover:text-text-secondary'
            }`}
          >
            {t('writingToolbar.editorSettings.indent')}
          </button>
          <button
            onClick={() => setParagraphMode('spaced')}
            className={`px-2 py-1 text-[11px] rounded border transition-colors duration-150 ${
              paragraphMode === 'spaced'
                ? 'border-accent bg-bg-tertiary text-text-primary'
                : 'border-border-subtle text-text-tertiary hover:text-text-secondary'
            }`}
          >
            {t('writingToolbar.editorSettings.spaced')}
          </button>
        </div>
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={justified}
          onChange={(e) => setJustified(e.target.checked)}
          className="accent-accent"
        />
        <span className="text-[11px] text-text-secondary">{t('writingToolbar.editorSettings.justified')}</span>
      </label>
    </div>
  );
}

function FindReplacePanel() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'chapter' | 'find'>('chapter');
  const [searchTerm, setSearchTerm] = useState('');
  const [replaceTerm, setReplaceTerm] = useState('');

  return (
    <div className="p-3 space-y-3">
      <div className="flex border-b border-border-subtle">
        {(['chapter', 'find'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 text-[11px] border-b-2 -mb-px transition-colors duration-150 ${
              activeTab === tab
                ? 'text-text-primary border-accent'
                : 'text-text-tertiary border-transparent hover:text-text-secondary'
            }`}
          >
            {t(`writingToolbar.findReplace.${tab}`)}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={t('writingToolbar.findReplace.searchPlaceholder')}
          className="w-full px-2 py-1.5 text-xs bg-bg-tertiary border border-border-subtle rounded focus:border-accent outline-none placeholder:text-text-tertiary"
        />
        <input
          type="text"
          value={replaceTerm}
          onChange={(e) => setReplaceTerm(e.target.value)}
          placeholder={t('writingToolbar.findReplace.replacePlaceholder')}
          className="w-full px-2 py-1.5 text-xs bg-bg-tertiary border border-border-subtle rounded focus:border-accent outline-none placeholder:text-text-tertiary"
        />
        <div className="flex gap-2">
          <button className="flex-1 px-2 py-1 text-[11px] text-text-secondary border border-border-subtle rounded hover:bg-bg-tertiary transition-colors duration-150">
            {t('writingToolbar.findReplace.findNext')}
          </button>
          <button className="flex-1 px-2 py-1 text-[11px] text-text-secondary border border-border-subtle rounded hover:bg-bg-tertiary transition-colors duration-150">
            {t('writingToolbar.findReplace.replaceOne')}
          </button>
        </div>
      </div>
    </div>
  );
}

function ChapterNoteField({
  filePath,
  dirPath,
  placeholder,
}: {
  filePath: string | null;
  dirPath: string | null;
  placeholder: string;
}) {
  const [content, setContent] = useState('');
  const [loaded, setLoaded] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!filePath) {
      setContent('');
      setLoaded(true);
      return;
    }
    setLoaded(false);
    invoke<string>('read_text_file', { path: filePath })
      .then((c) => {
        setContent(c);
        setLoaded(true);
      })
      .catch(() => {
        setContent('');
        setLoaded(true);
      });
  }, [filePath]);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  function handleChange(value: string) {
    setContent(value);
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      if (!filePath || !dirPath) return;
      invoke('ensure_dir', { path: dirPath })
        .then(() => invoke('write_text_file', { path: filePath, contents: value }))
        .catch((err) => console.error('Failed to save note:', err));
    }, 800);
  }

  if (!loaded) {
    return <div className="flex-1 w-full" />;
  }

  return (
    <textarea
      value={content}
      onChange={(e) => handleChange(e.target.value)}
      placeholder={placeholder}
      className="flex-1 w-full min-h-[120px] px-2 py-1.5 text-xs bg-bg-tertiary border border-border-subtle rounded focus:border-accent outline-none placeholder:text-text-tertiary resize-none font-sans"
    />
  );
}

function ChapterNotesPanel() {
  const { t } = useTranslation();
  const currentProject = useProjectStore((s) => s.currentProject);
  const activeChapterPath = useProjectStore((s) => s.activeChapterPath);
  const chapters = useProjectStore((s) => s.chapters);
  const activeChapter = chapters.find((c) => c.path === activeChapterPath) ?? null;
  const [activeTab, setActiveTab] = useState<'notes' | 'summary'>('notes');

  const baseName = activeChapter ? activeChapter.filename.replace(/\.md$/, '') : null;
  const notesDirPath = currentProject ? `${currentProject.rootPath}/.notes` : null;
  const notePath = currentProject && baseName ? `${notesDirPath}/${baseName}.md` : null;
  const summaryPath = currentProject && baseName ? `${notesDirPath}/${baseName}-summary.md` : null;

  if (!activeChapter) {
    return (
      <div className="p-3">
        <h4 className="text-xs font-medium text-text-secondary uppercase tracking-wide">
          {t('writingToolbar.notes')}
        </h4>
        <p className="text-[11px] text-text-tertiary mt-2">{t('writingToolbar.notesNoChapter')}</p>
      </div>
    );
  }

  return (
    <div className="p-3 flex flex-col h-full">
      <div className="flex border-b border-border-subtle">
        {(['notes', 'summary'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 text-[11px] border-b-2 -mb-px transition-colors duration-150 ${
              activeTab === tab
                ? 'text-text-primary border-accent'
                : 'text-text-tertiary border-transparent hover:text-text-secondary'
            }`}
          >
            {tab === 'notes' ? t('writingToolbar.notes') : t('writingToolbar.summary')}
          </button>
        ))}
      </div>
      <p className="text-[10px] text-text-tertiary mt-2 mb-2 truncate">{activeChapter.title}</p>
      <div className={activeTab === 'notes' ? 'flex-1 flex flex-col min-h-0' : 'hidden'}>
        <ChapterNoteField
          filePath={notePath}
          dirPath={notesDirPath}
          placeholder={t('writingToolbar.notesPlaceholder')}
        />
      </div>
      <div className={activeTab === 'summary' ? 'flex-1 flex flex-col min-h-0' : 'hidden'}>
        <ChapterNoteField
          filePath={summaryPath}
          dirPath={notesDirPath}
          placeholder={t('writingToolbar.summaryPlaceholder')}
        />
      </div>
    </div>
  );
}

const TOOL_ICONS = [
  { id: 'editor-settings' as const, Icon: Type, labelKey: 'writingToolbar.editorSettings.title' },
  { id: 'find-replace' as const, Icon: Search, labelKey: 'writingToolbar.findReplace.title' },
  { id: 'notes' as const, Icon: BookOpen, labelKey: 'writingToolbar.notes' },
  { id: 'stub-2' as const, Icon: MessageSquare, labelKey: 'writingToolbar.comments' },
  { id: 'stub-3' as const, Icon: Bookmark, labelKey: 'writingToolbar.bookmarks' },
] as const;

type ToolId = (typeof TOOL_ICONS)[number]['id'];

function WritingToolbar() {
  const { t } = useTranslation();
  const [activePanel, setActivePanel] = useState<ToolPanel>(null);

  function handleIconClick(id: ToolId) {
    if (id === 'editor-settings' || id === 'find-replace' || id === 'notes') {
      setActivePanel((prev) => (prev === id ? null : id));
    }
  }

  return (
    <div className="flex h-full">
      {activePanel && (
        <div className="w-56 border-l border-border-subtle bg-bg-secondary overflow-y-auto">
          {activePanel === 'editor-settings' && <EditorSettingsPanel />}
          {activePanel === 'find-replace' && <FindReplacePanel />}
          {activePanel === 'notes' && <ChapterNotesPanel />}
        </div>
      )}
      <div className="flex flex-col items-center gap-1 py-2 px-1 border-l border-border-subtle bg-bg-secondary">
        {TOOL_ICONS.map(({ id, Icon, labelKey }) => (
          <button
            key={id}
            onClick={() => handleIconClick(id)}
            title={t(labelKey)}
            className={`flex items-center justify-center w-8 h-8 rounded transition-colors duration-150 ${
              activePanel === id
                ? 'bg-bg-tertiary text-text-primary'
                : 'text-text-tertiary hover:text-text-primary hover:bg-bg-tertiary'
            }`}
          >
            <Icon size={16} />
          </button>
        ))}
      </div>
    </div>
  );
}

export default WritingToolbar;
