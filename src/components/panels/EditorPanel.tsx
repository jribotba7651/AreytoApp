import { useEffect, useRef, useState, useMemo } from 'react';
import { Eye, Pencil, Languages, Columns2, Clock, Bookmark, Lock, BookOpen } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import ChapterEditor from '@/components/editor/ChapterEditor';
import type { ChapterEditorHandle } from '@/components/editor/ChapterEditor';
import FormatToolbar from '@/components/editor/FormatToolbar';
import BookMarkdown from '@/components/book/BookMarkdown';
import ShortcutHint from '@/components/shared/ShortcutHint';
import FrontmatterTituloEditor from '@/components/frontmatter/FrontmatterTituloEditor';
import FrontmatterCopyrightEditor from '@/components/frontmatter/FrontmatterCopyrightEditor';
import FrontmatterDedicatoriaEditor from '@/components/frontmatter/FrontmatterDedicatoriaEditor';
import FrontmatterMetadataEditor from '@/components/frontmatter/FrontmatterMetadataEditor';
import BackmatterAgradecimientosEditor from '@/components/backmatter/BackmatterAgradecimientosEditor';
import BackmatterSobreElAutorEditor from '@/components/backmatter/BackmatterSobreElAutorEditor';
import BackmatterOtrosLibrosEditor from '@/components/backmatter/BackmatterOtrosLibrosEditor';
import { useProjectStore } from '@/stores/projectStore';
import { useLayoutStore } from '@/stores/layoutStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useAutosave } from '@/hooks/useAutosave';
import { readChapter } from '@/lib/project-fs';
import { readMetadata, writeMetadata } from '@/lib/frontmatter-fs';
import ExternalChangeBanner from '@/components/editor/ExternalChangeBanner';
import SplitReadPanel from '@/components/editor/SplitReadPanel';
import AmbientSoundButton from '@/components/editor/AmbientSoundButton';
import PomodoroButton from '@/components/editor/PomodoroButton';
import { useSessionTimer } from '@/hooks/useSessionTimer';
import { createBookmark } from '@/lib/bookmarks';

function countSentences(text: string): number {
  const cleanedText = text.replace(/—/g, '');
  const sentences = cleanedText.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  return sentences.length;
}

function countWords(text: string): number {
  const stripped = text.replace(/^#+\s.*/gm, '').replace(/[*_~`>#\-\[\]()!]/g, '');
  const words = stripped.match(/\S+/g);
  return words ? words.length : 0;
}

function countParagraphs(text: string): number {
  if (!text.trim()) return 0;
  return text.split(/\n\s*\n/).filter((p) => p.trim().length > 0).length;
}

function countCharacters(text: string): number {
  return text.length;
}

function useBookWordCount(): number {
  const chapters = useProjectStore((s) => s.chapters);
  const activeChapterPath = useProjectStore((s) => s.activeChapterPath);
  const activeChapterContent = useProjectStore((s) => s.activeChapterContent);
  const currentProject = useProjectStore((s) => s.currentProject);
  const [otherChaptersWords, setOtherChaptersWords] = useState(0);

  const otherChapters = useMemo(
    () => chapters.filter((c) => c.path !== activeChapterPath),
    [chapters, activeChapterPath]
  );

  useEffect(() => {
    if (!currentProject || otherChapters.length === 0) {
      setOtherChaptersWords(0);
      return;
    }

    let cancelled = false;
    async function load() {
      let total = 0;
      for (const ch of otherChapters) {
        const result = await readChapter(ch.path);
        if (result.ok) total += countWords(result.value);
      }
      if (!cancelled) setOtherChaptersWords(total);
    }
    load();
    return () => { cancelled = true; };
  }, [currentProject, otherChapters]);

  return otherChaptersWords + countWords(activeChapterContent);
}

function ChapterView() {
  const { t } = useTranslation();
  const activeChapterPath = useProjectStore((s) => s.activeChapterPath);
  const activeChapterContent = useProjectStore((s) => s.activeChapterContent);
  const currentProject = useProjectStore((s) => s.currentProject);
  const editorVersion = useProjectStore((s) => s.editorVersion);
  const updateContent = useProjectStore((s) => s.updateContent);
  const setSaveStatus = useProjectStore((s) => s.setSaveStatus);
  const saveStatus = useProjectStore((s) => s.saveStatus);
  const setFlushAutosave = useProjectStore((s) => s.setFlushAutosave);
  const setSyncAutosaveSaved = useProjectStore((s) => s.setSyncAutosaveSaved);
  const setInsertTextAtCursor = useProjectStore((s) => s.setInsertTextAtCursor);

  const editorViewMode = useLayoutStore((s) => s.editorViewMode);
  const setEditorViewMode = useLayoutStore((s) => s.setEditorViewMode);
  const splitView = useLayoutStore((s) => s.splitView);
  const toggleSplitView = useLayoutStore((s) => s.toggleSplitView);
  const isReadingMode = useLayoutStore((s) => s.isReadingMode);
  const toggleReadingMode = useLayoutStore((s) => s.toggleReadingMode);
  const focusMode = useLayoutStore((s) => s.focusMode);
  const flushAutosave = useProjectStore((s) => s.flushAutosave);
  const autosaveIntervalMs = useSettingsStore((s) => s.autosaveIntervalMs);

  const editorRef = useRef<ChapterEditorHandle>(null);
  const previewScrollRef = useRef<HTMLDivElement>(null);
  const splitPreviewRef = useRef<HTMLDivElement>(null);
  const syncingScrollRef = useRef(false);

  const { flush, syncSaved } = useAutosave({
    content: activeChapterContent,
    chapterPath: activeChapterPath,
    projectPath: currentProject?.rootPath ?? null,
    onStatusChange: setSaveStatus,
    delay: autosaveIntervalMs,
  });

  useEffect(() => {
    setFlushAutosave(flush);
    setSyncAutosaveSaved(syncSaved);
    setInsertTextAtCursor((text) => editorRef.current?.insertText(text));
    return () => {
      setFlushAutosave(null);
      setSyncAutosaveSaved(null);
      setInsertTextAtCursor(null);
    };
  }, [flush, syncSaved, setFlushAutosave, setSyncAutosaveSaved, setInsertTextAtCursor]);

  useEffect(() => {
    if (saveStatus !== 'saved') return;
    const timer = setTimeout(() => setSaveStatus('idle'), 2000);
    return () => clearTimeout(timer);
  }, [saveStatus, setSaveStatus]);

  async function handleToggle() {
    await flushAutosave?.();
    const next =
      editorViewMode === 'edit' ? 'preview' : editorViewMode === 'preview' ? 'split' : 'edit';
    setEditorViewMode(next);
  }

  function handleEditorScroll(scrollTop: number, scrollHeight: number, clientHeight: number) {
    if (syncingScrollRef.current) return;
    const preview = splitPreviewRef.current;
    if (!preview) return;
    const editorMax = scrollHeight - clientHeight;
    const previewMax = preview.scrollHeight - preview.clientHeight;
    if (editorMax <= 0 || previewMax <= 0) return;
    const ratio = scrollTop / editorMax;
    syncingScrollRef.current = true;
    preview.scrollTop = ratio * previewMax;
    requestAnimationFrame(() => { syncingScrollRef.current = false; });
  }

  function handlePreviewScroll() {
    if (syncingScrollRef.current) return;
    const preview = splitPreviewRef.current;
    const view = editorRef.current?.getView();
    const dom = view?.scrollDOM;
    if (!preview || !dom) return;
    const previewMax = preview.scrollHeight - preview.clientHeight;
    const editorMax = dom.scrollHeight - dom.clientHeight;
    if (previewMax <= 0 || editorMax <= 0) return;
    const ratio = preview.scrollTop / previewMax;
    syncingScrollRef.current = true;
    dom.scrollTop = ratio * editorMax;
    requestAnimationFrame(() => { syncingScrollRef.current = false; });
  }

  const [projectLang, setProjectLang] = useState('en');

  useEffect(() => {
    if (!currentProject) return;
    let cancelled = false;
    readMetadata(currentProject.rootPath).then((meta) => {
      if (!cancelled && meta) setProjectLang(meta.idioma);
    });
    return () => { cancelled = true; };
  }, [currentProject?.rootPath]);

  async function handleLanguageChange(newLang: string) {
    if (!currentProject) return;
    setProjectLang(newLang);
    const meta = await readMetadata(currentProject.rootPath);
    if (meta) {
      await writeMetadata(currentProject.rootPath, { ...meta, idioma: newLang });
    }
  }

  const isPreview = editorViewMode === 'preview';
  const isSplit = editorViewMode === 'split';
  const viewModeNextLabel =
    editorViewMode === 'edit'
      ? t('editor.preview')
      : editorViewMode === 'preview'
        ? t('editor.split')
        : t('editor.edit');
  const viewModeNextIcon =
    editorViewMode === 'edit' ? (
      <Eye size={14} />
    ) : editorViewMode === 'preview' ? (
      <Columns2 size={14} />
    ) : (
      <Pencil size={14} />
    );
  const chapterWords = countWords(activeChapterContent);
  const chapterSentences = countSentences(activeChapterContent);
  const chapterParagraphs = countParagraphs(activeChapterContent);
  const chapterCharacters = countCharacters(activeChapterContent);
  const bookWords = useBookWordCount();
  const sessionTime = useSessionTimer(!!currentProject);
  const updateProjectMeta = useProjectStore((s) => s.updateProjectMeta);
  const bookmarks = currentProject?.bookmarks ?? [];
  const activeChapterFilename = activeChapterPath?.split('/').pop();
  const isLocked = currentProject?.lockedChapters?.includes(activeChapterFilename || '');

  async function handleAddBookmark() {
    const pos = editorRef.current?.getCursor() ?? 0;
    const newBookmark = createBookmark(bookmarks, pos);
    await updateProjectMeta({ bookmarks: [...bookmarks, newBookmark] });
  }

  return (
    <div className="relative h-full flex flex-col bg-bg-editor">
      {!focusMode && <ExternalChangeBanner />}
      {!focusMode && isLocked && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-bg-tertiary border-b border-border-default text-xs text-text-secondary">
          <Lock size={12} />
          <span className="flex-1">Este capítulo está bloqueado</span>
        </div>
      )}
      {!focusMode && (
        <div className="flex items-center justify-between px-3 py-1 border-b border-border-subtle shrink-0">
          {!isPreview ? (
            <FormatToolbar editorRef={editorRef} />
          ) : (
            <div />
          )}
          <div className="relative flex items-center gap-1">
            <button
              onClick={toggleReadingMode}
              className={[
                'flex items-center gap-1.5 px-2 py-1 text-xs rounded transition-colors duration-150',
                isReadingMode
                  ? 'text-text-primary bg-bg-tertiary'
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary',
              ].join(' ')}
              title={t('editor.readingMode')}
            >
              <BookOpen size={14} />
            </button>
            <button
              onClick={toggleSplitView}
              className={[
                'flex items-center gap-1.5 px-2 py-1 text-xs rounded transition-colors duration-150',
                splitView.active
                  ? 'text-text-primary bg-bg-tertiary'
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary',
              ].join(' ')}
              title={t('editor.splitView')}
            >
              <Columns2 size={14} />
            </button>
            <button
              onClick={handleToggle}
              className="flex items-center gap-1.5 px-2 py-1 text-xs text-text-secondary hover:text-text-primary rounded hover:bg-bg-tertiary transition-colors duration-150"
              title={viewModeNextLabel}
            >
              {viewModeNextIcon}
              <span>{viewModeNextLabel}</span>
            </button>
            <div className="pl-1.5">
              <ShortcutHint text="⌘E" />
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 min-h-0 flex">
        {isReadingMode ? (
          <div className="h-full w-full overflow-y-auto">
            <BookMarkdown
              content={activeChapterContent}
              themeId={currentProject?.tema}
              themeOverrides={currentProject?.temaOverrides}
              projectRootPath={currentProject?.rootPath}
              enableChapterLinks
            />
          </div>
        ) : isSplit ? (
          <>
            <div className="w-1/2 min-w-0 h-full border-r border-border-subtle">
                <ChapterEditor
                  ref={editorRef}
                  key={`${activeChapterPath}:${editorVersion}`}
                  initialContent={activeChapterContent}
                  onChange={updateContent}
                  onScroll={handleEditorScroll}
                  readOnly={isLocked}
                />
            </div>
            <div
              ref={splitPreviewRef}
              onScroll={handlePreviewScroll}
              className="w-1/2 min-w-0 h-full overflow-y-auto"
            >
              <BookMarkdown
                content={activeChapterContent}
                themeId={currentProject?.tema}
                themeOverrides={currentProject?.temaOverrides}
                projectRootPath={currentProject?.rootPath}
                enableChapterLinks
              />
            </div>
          </>
        ) : (
          <>
            <div className={splitView.active ? 'w-1/2 min-w-0 relative' : 'flex-1 min-w-0 relative'}>
              <div className={isPreview ? 'absolute inset-0 invisible pointer-events-none' : 'h-full'}>
                <ChapterEditor
                  ref={editorRef}
                  key={`${activeChapterPath}:${editorVersion}`}
                  initialContent={activeChapterContent}
                  onChange={updateContent}
                  readOnly={isLocked}
                />
              </div>

              <div
                ref={previewScrollRef}
                className={[
                  'absolute inset-0 overflow-y-auto',
                  isPreview ? '' : 'invisible pointer-events-none',
                ].join(' ')}
              >
                <BookMarkdown
                  content={activeChapterContent}
                  themeId={currentProject?.tema}
                  themeOverrides={currentProject?.temaOverrides}
                  projectRootPath={currentProject?.rootPath}
                  enableChapterLinks
                />
              </div>
            </div>

            {splitView.active && (
              <div className="w-1/2 min-w-0">
                <SplitReadPanel />
              </div>
            )}
          </>
        )}
      </div>

      {focusMode ? (
        <>
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[60px] focus-mode-fade-top" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[60px] focus-mode-fade-bottom" />
          <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2">
            <span className="text-[11px] text-text-tertiary">
              {t('editor.wordCount', { count: chapterWords })}
            </span>
          </div>
        </>
      ) : (
        <div className="flex items-center justify-between px-3 py-1 border-t border-border-subtle shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-text-tertiary">
              {t('editor.wordCount', { count: chapterWords })}
            </span>
            <span className="text-[11px] text-text-tertiary">
              {t('editor.sentenceCount', { count: chapterSentences })}
            </span>
            <span className="text-[11px] text-text-tertiary">
              {t('editor.paragraphCount', { count: chapterParagraphs })}
            </span>
            <span className="text-[11px] text-text-tertiary">
              {t('editor.characterCount', { count: chapterCharacters })}
            </span>
            <div className="flex items-center gap-1">
              <Languages size={12} className="text-text-tertiary" />
              <select
                value={projectLang}
                onChange={(e) => void handleLanguageChange(e.target.value)}
                title={t('editor.projectLanguage')}
                className="text-[11px] text-text-tertiary bg-transparent border-none outline-none cursor-pointer hover:text-text-primary transition-colors duration-150 py-0 px-0.5"
              >
                <option value="es">ES</option>
                <option value="en">EN</option>
                <option value="pt">PT</option>
                <option value="fr">FR</option>
                <option value="de">DE</option>
                <option value="it">IT</option>
              </select>
            </div>
            <div className="flex items-center gap-1">
              <Clock size={11} className="text-text-tertiary" />
              <span className="text-[11px] text-text-tertiary">{sessionTime}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <AmbientSoundButton />
            <PomodoroButton />
            <button
              onClick={handleAddBookmark}
              className="p-1 text-text-secondary hover:text-text-primary hover:bg-bg-tertiary rounded transition-colors duration-150"
              title={t('editor.addBookmark')}
            >
              <Bookmark size={14} />
            </button>
            <span className="text-[11px] text-text-tertiary">
              {t('editor.bookWordCount', { count: bookWords })}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function EditorPanel() {
  const { t } = useTranslation();
  const activeView = useProjectStore((s) => s.activeView);
  const activeChapterPath = useProjectStore((s) => s.activeChapterPath);

  if (activeView === 'frontmatter-titulo') {
    return <FrontmatterTituloEditor />;
  }

  if (activeView === 'frontmatter-copyright') {
    return <FrontmatterCopyrightEditor />;
  }

  if (activeView === 'frontmatter-dedicatoria') {
    return <FrontmatterDedicatoriaEditor />;
  }

  if (activeView === 'frontmatter-metadata') {
    return <FrontmatterMetadataEditor />;
  }

  if (activeView === 'backmatter-agradecimientos') {
    return <BackmatterAgradecimientosEditor />;
  }

  if (activeView === 'backmatter-sobre-el-autor') {
    return <BackmatterSobreElAutorEditor />;
  }

  if (activeView === 'backmatter-otros-libros') {
    return <BackmatterOtrosLibrosEditor />;
  }

  if (!activeChapterPath) {
    return (
      <div className="h-full bg-bg-editor flex items-center justify-center">
        <p className="font-serif text-base text-text-tertiary">{t('editor.noActiveChapter')}</p>
      </div>
    );
  }

  return <ChapterView />;
}

export default EditorPanel;
