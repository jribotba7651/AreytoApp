import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { save, message, open } from '@tauri-apps/plugin-dialog';
import { Printer, ArrowUp, Maximize2 } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { useTranslation } from 'react-i18next';
import { useProjectStore } from '@/stores/projectStore';
import { useLayoutStore } from '@/stores/layoutStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { loadBook } from '@/lib/book-loader';
import { exportBookMarkdown, exportBookDocx, exportBookEpub } from '@/lib/export-service';
import BookIndice from '@/components/book/BookIndice';
import BookEmptyState from '@/components/book/BookEmptyState';
import PreExportCheckModal from '@/components/book/PreExportCheckModal';
import ExportBookDialog from '@/components/book/ExportBookDialog';
import ExportBookDocxDialog from '@/components/book/ExportBookDocxDialog';
import ExportBookEpubDialog from '@/components/book/ExportBookEpubDialog';
import ExportBookKindleDialog from '@/components/book/ExportBookKindleDialog';
import ExportAllDialog from '@/components/book/ExportAllDialog';
import ThemeGallery from '@/components/book/ThemeGallery';
import ThemeControls from '@/components/book/ThemeControls';
import BookSettings from '@/components/book/BookSettings';
import BookCoverSection from '@/components/book/BookCoverSection';
import BookPrintView from '@/components/book/BookPrintView';
import { DEFAULT_THEME_ID } from '@/lib/theme';
import ExportProgressBar from '@/components/book/ExportProgressBar';
import type { ExportStep } from '@/components/book/ExportProgressBar';
import type { BookData, BookSection } from '@/types/book';
import type { ExportScope } from '@/lib/export-service';
import type { BookViewMode, PreviewMode } from '@/types/layout';

type ExportTarget = 'md' | 'docx' | 'epub';

function BookTabContent() {
  const { t } = useTranslation();
  const currentProject = useProjectStore((s) => s.currentProject);
  const updateProjectMeta = useProjectStore((s) => s.updateProjectMeta);
  const activeTab = useLayoutStore((s) => s.activeTab);
  const exportFolder = useSettingsStore((s) => s.exportFolder);
  const customThemes = useSettingsStore((s) => s.customThemes);
  const setExportFolder = useSettingsStore((s) => s.setExportFolder);
  const addExportHistory = useSettingsStore((s) => s.addExportHistory);
  const [bookData, setBookData] = useState<BookData | null>(null);
  const [loading, setLoading] = useState(false);
  const showExportDialog = useLayoutStore((s) => s.showExportDialog);
  const setShowExportDialog = useLayoutStore((s) => s.setShowExportDialog);
  const showExportAllDialog = useLayoutStore((s) => s.showExportAllDialog);
  const setShowExportAllDialog = useLayoutStore((s) => s.setShowExportAllDialog);
  const showKindleDialog = useLayoutStore((s) => s.showExportKindleDialog);
  const setShowExportKindleDialog = useLayoutStore((s) => s.setShowExportKindleDialog);
  const bookViewMode = useLayoutStore((s) => s.bookViewMode);
  const setBookViewMode = useLayoutStore((s) => s.setBookViewMode);
  const previewMode = useLayoutStore((s) => s.previewMode);
  const setPreviewMode = useLayoutStore((s) => s.setPreviewMode);
  const [exportLoading, setExportLoading] = useState(false);
  const [showDocxDialog, setShowDocxDialog] = useState(false);
  const [docxLoading, setDocxLoading] = useState(false);
  const [showEpubDialog, setShowEpubDialog] = useState(false);
  const [epubLoading, setEpubLoading] = useState(false);
  const [exportAllLoading, setExportAllLoading] = useState(false);
  const [preExportProblems, setPreExportProblems] = useState<string[]>([]);
  const [pendingExportTarget, setPendingExportTarget] = useState<ExportTarget | null>(null);
  const [exportProgress, setExportProgress] = useState<ExportStep | null>(null);
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const skipPreCheck = useRef(false);
  const sectionVersion = useProjectStore((s) => s.sectionVersion);
  const activeChapterContent = useProjectStore((s) => s.activeChapterContent);
  const chapters = useProjectStore((s) => s.chapters);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handleScroll = () => {
      setShowScrollToTop(el.scrollTop > 300);
    };
    el.addEventListener('scroll', handleScroll);
    return () => el.removeEventListener('scroll', handleScroll);
  }, []);

  function getFilesToExport(scope: ExportScope): string[] {
    const excluded = currentProject?.excludedFromExport ?? [];
    return chapters.filter(ch => {
      if (scope === 'terminados' && ch.status !== 'finished') return false;
      if (scope === 'en-progreso' && ch.status !== 'in-progress') return false;
      if (excluded.includes(ch.filename)) return false;
      return true;
    }).map(ch => ch.filename);
  }

  function computePreExportProblems(): string[] {
    const problems: string[] = [];
    const titulo = bookData?.frontmatter.titulo;
    if (!titulo?.titulo?.trim()) problems.push(t('modal.preExportCheck.noTitle'));
    if (!titulo?.autor?.trim()) problems.push(t('modal.preExportCheck.noAuthor'));
    const hasChapterWithContent = bookData?.sections.some(
      (s) => s.kind === 'chapter' && s.content.trim().length > 0,
    ) ?? false;
    if (!hasChapterWithContent) problems.push(t('modal.preExportCheck.noChapters'));
    return problems;
  }

  useEffect(() => {
    if (!showExportDialog) return;
    if (skipPreCheck.current) {
      skipPreCheck.current = false;
      return;
    }
    const problems = computePreExportProblems();
    if (problems.length > 0) {
      setShowExportDialog(false);
      setPreExportProblems(problems);
      setPendingExportTarget('md');
    }
  }, [showExportDialog]);

  function handlePreExportContinue() {
    const target = pendingExportTarget;
    setPreExportProblems([]);
    setPendingExportTarget(null);
    skipPreCheck.current = true;
    if (target === 'md') setShowExportDialog(true);
    else if (target === 'docx') setShowDocxDialog(true);
    else if (target === 'epub') setShowEpubDialog(true);
  }

  function handlePreExportCancel() {
    setPreExportProblems([]);
    setPendingExportTarget(null);
  }

  function handlePrint() {
    window.print();
  }

  useEffect(() => {
    if (activeTab !== 'libro' || !currentProject) {
      setBookData(null);
      return;
    }
    setLoading(true);
    loadBook(currentProject).then((data) => {
      setBookData(data);
      setLoading(false);
    });
  }, [activeTab, currentProject, sectionVersion]);

function exportBaseNameNoExt(): string {
    const title = bookData?.frontmatter.titulo?.titulo?.trim();
    const base = title
      ? title.replace(/[/\\?%*:|"<>]/g, '').replace(/\s+/g, '-')
      : currentProject!.nombre;
    const today = new Date().toISOString().slice(0, 10);
    return `${base}-${today}`;
  }

  function exportBaseName(ext: string): string {
    return `${exportBaseNameNoExt()}.${ext}`;
  }

  async function backupExportedFile(exportedPath: string) {
    if (!currentProject) return;
    try {
      const backupsDir = `${currentProject.rootPath}/backups`;
      await invoke('ensure_dir', { path: backupsDir });
      const filename = exportedPath.slice(exportedPath.lastIndexOf('/') + 1);
      const ext = filename.slice(filename.lastIndexOf('.'));
      const base = filename.slice(0, filename.lastIndexOf('.'));
      const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const backupName = `${base}-${ts}${ext}`;
      await invoke('copy_file', { from: exportedPath, to: `${backupsDir}/${backupName}` });
    } catch (err) {
      console.error('Backup failed:', err);
    }
  }

  async function handleExport(scope: ExportScope) {
    if (!currentProject) return;
    setExportLoading(true);

    try {
      const baseDir = exportFolder || currentProject.rootPath;
      const defaultPath = `${baseDir}/${exportBaseName('md')}`;

      const outputPath = await save({
        defaultPath,
        filters: [{ name: 'Markdown', extensions: ['md'] }],
      });

      if (!outputPath) {
        setExportLoading(false);
        return;
      }

      setShowExportDialog(false);
      setExportProgress('assembling');

      setExportProgress('writing');
      await exportBookMarkdown(currentProject.rootPath, { scope, excludedFilenames: currentProject.excludedFromExport }, outputPath, currentProject.nombre);

      await addExportHistory({ date: new Date().toISOString(), format: 'markdown', filename: outputPath.split('/').pop()! });

      const now = new Date().toISOString();
      const newTimestamps = { ...(currentProject.lastExportTimestamps ?? {}) };
      getFilesToExport(scope).forEach(f => newTimestamps[f] = now);
      await updateProjectMeta({ lastExportTimestamps: newTimestamps });

      setExportProgress('backup');
      await backupExportedFile(outputPath);

      const chosenDir = outputPath.slice(0, outputPath.lastIndexOf('/'));
      if (chosenDir) void setExportFolder(chosenDir);

      setExportProgress('done');
      await new Promise((r) => setTimeout(r, 600));
      setExportProgress(null);
      setExportLoading(false);

      await message(t('book.export.successBody', { path: outputPath }), {
        title: t('book.export.successTitle'),
        kind: 'info',
      });
    } catch (err) {
      setExportProgress(null);
      setExportLoading(false);
      await message(t('book.export.errorBody', { error: String(err) }), {
        title: t('book.export.errorTitle'),
        kind: 'error',
      });
    }
  }

  async function handleExportDocx(scope: ExportScope) {
    if (!currentProject) return;
    setDocxLoading(true);

    try {
      const baseDir = exportFolder || currentProject.rootPath;
      const defaultPath = `${baseDir}/${exportBaseName('docx')}`;

      const outputPath = await save({
        defaultPath,
        filters: [{ name: 'Word', extensions: ['docx'] }],
      });

      if (!outputPath) {
        setDocxLoading(false);
        return;
      }

      setShowDocxDialog(false);
      setExportProgress('assembling');

      setExportProgress('writing');
      await exportBookDocx(currentProject.rootPath, { scope, excludedFilenames: currentProject.excludedFromExport }, outputPath, currentProject.nombre);

      await addExportHistory({ date: new Date().toISOString(), format: 'docx', filename: outputPath.split('/').pop()! });

      const now = new Date().toISOString();
      const newTimestamps = { ...(currentProject.lastExportTimestamps ?? {}) };
      getFilesToExport(scope).forEach(f => newTimestamps[f] = now);
      await updateProjectMeta({ lastExportTimestamps: newTimestamps });

      setExportProgress('backup');
      await backupExportedFile(outputPath);

      const chosenDir = outputPath.slice(0, outputPath.lastIndexOf('/'));
      if (chosenDir) void setExportFolder(chosenDir);

      setExportProgress('done');
      await new Promise((r) => setTimeout(r, 600));
      setExportProgress(null);
      setDocxLoading(false);

      await message(t('book.export.successBody', { path: outputPath }), {
        title: t('book.export.successTitle'),
        kind: 'info',
      });
    } catch (err) {
      setExportProgress(null);
      setDocxLoading(false);
      await message(t('book.export.errorBody', { error: String(err) }), {
        title: t('book.export.errorTitle'),
        kind: 'error',
      });
    }
  }

  async function handleExportEpub(scope: ExportScope) {
    if (!currentProject) return;
    setEpubLoading(true);

    try {
      const baseDir = exportFolder || currentProject.rootPath;
      const defaultPath = `${baseDir}/${exportBaseName('epub')}`;

      const outputPath = await save({
        defaultPath,
        filters: [{ name: 'EPUB', extensions: ['epub'] }],
      });

      if (!outputPath) {
        setEpubLoading(false);
        return;
      }

      setShowEpubDialog(false);
      setExportProgress('assembling');

      setExportProgress('writing');
      await exportBookEpub(
        currentProject.rootPath,
        { scope, excludedFilenames: currentProject.excludedFromExport },
        outputPath,
        currentProject.tema,
        currentProject.temaOverrides,
        currentProject.nombre,
      );

      await addExportHistory({ date: new Date().toISOString(), format: 'epub', filename: outputPath.split('/').pop()! });

      const now = new Date().toISOString();
      const newTimestamps = { ...(currentProject.lastExportTimestamps ?? {}) };
      getFilesToExport(scope).forEach(f => newTimestamps[f] = now);
      await updateProjectMeta({ lastExportTimestamps: newTimestamps });

      setExportProgress('backup');
      await backupExportedFile(outputPath);

      const chosenDir = outputPath.slice(0, outputPath.lastIndexOf('/'));
      if (chosenDir) void setExportFolder(chosenDir);

      setExportProgress('done');
      await new Promise((r) => setTimeout(r, 600));
      setExportProgress(null);
      setEpubLoading(false);

      await message(t('book.export.successBody', { path: outputPath }), {
        title: t('book.export.successTitle'),
        kind: 'info',
      });
    } catch (err) {
      setExportProgress(null);
      setEpubLoading(false);
      await message(t('book.export.errorBody', { error: String(err) }), {
        title: t('book.export.errorTitle'),
        kind: 'error',
      });
    }
  }

  async function handleExportKindle(scope: ExportScope) {
    if (!currentProject) return;
    setEpubLoading(true);

    try {
      const baseDir = exportFolder || currentProject.rootPath;
      const defaultPath = `${baseDir}/${exportBaseName('epub')}`;

      const outputPath = await save({
        defaultPath,
        filters: [{ name: 'EPUB', extensions: ['epub'] }],
      });

      if (!outputPath) {
        setEpubLoading(false);
        return;
      }

      setShowExportKindleDialog(false);
      setExportProgress('assembling');

      setExportProgress('writing');
      await exportBookEpub(
        currentProject.rootPath,
        { scope, excludedFilenames: currentProject.excludedFromExport },
        outputPath,
        currentProject.tema,
        currentProject.temaOverrides,
        currentProject.nombre,
      );

      await addExportHistory({ date: new Date().toISOString(), format: 'epub', filename: outputPath.split('/').pop()! });

      const now = new Date().toISOString();
      const newTimestamps = { ...(currentProject.lastExportTimestamps ?? {}) };
      getFilesToExport(scope).forEach(f => newTimestamps[f] = now);
      await updateProjectMeta({ lastExportTimestamps: newTimestamps });

      setExportProgress('backup');
      await backupExportedFile(outputPath);

      const chosenDir = outputPath.slice(0, outputPath.lastIndexOf('/'));
      if (chosenDir) void setExportFolder(chosenDir);

      setExportProgress('done');
      await new Promise((r) => setTimeout(r, 600));
      setExportProgress(null);
      setEpubLoading(false);

      await message(t('book.export.successBody', { path: outputPath }), {
        title: t('book.export.successTitle'),
        kind: 'info',
      });
    } catch (err) {
      setExportProgress(null);
      setEpubLoading(false);
      await message(t('book.export.errorBody', { error: String(err) }), {
        title: t('book.export.errorTitle'),
        kind: 'error',
      });
    }
  }

  async function handleExportAll(scope: ExportScope) {
    if (!currentProject) return;
    setExportAllLoading(true);

    try {
      const baseDir = exportFolder || currentProject.rootPath;

      const folder = await open({
        directory: true,
        defaultPath: baseDir,
        title: t('book.exportAll.folderTitle'),
      });

      if (typeof folder !== 'string') {
        setExportAllLoading(false);
        return;
      }

      setShowExportAllDialog(false);
      setExportProgress('assembling');

      const base = exportBaseNameNoExt();
      const opts = { scope, excludedFilenames: currentProject.excludedFromExport };

      setExportProgress('writing');
      const mdPath = `${folder}/${base}.md`;
      await exportBookMarkdown(currentProject.rootPath, opts, mdPath, currentProject.nombre);
      await addExportHistory({ date: new Date().toISOString(), format: 'markdown', filename: `${base}.md` });
      await backupExportedFile(mdPath);

      const docxPath = `${folder}/${base}.docx`;
      await exportBookDocx(currentProject.rootPath, opts, docxPath, currentProject.nombre);
      await addExportHistory({ date: new Date().toISOString(), format: 'docx', filename: `${base}.docx` });
      await backupExportedFile(docxPath);

      const epubPath = `${folder}/${base}.epub`;
      await exportBookEpub(
        currentProject.rootPath,
        opts,
        epubPath,
        currentProject.tema,
        currentProject.temaOverrides,
        currentProject.nombre,
      );
      await addExportHistory({ date: new Date().toISOString(), format: 'epub', filename: `${base}.epub` });
      await backupExportedFile(epubPath);

      const now = new Date().toISOString();
      const newTimestamps = { ...(currentProject.lastExportTimestamps ?? {}) };
      getFilesToExport(scope).forEach(f => newTimestamps[f] = now);
      await updateProjectMeta({ lastExportTimestamps: newTimestamps });

      void setExportFolder(folder);

      setExportProgress('done');
      await new Promise((r) => setTimeout(r, 600));
      setExportProgress(null);
      setExportAllLoading(false);

      await message(t('book.exportAll.successBody', { folder }), {
        title: t('book.exportAll.successTitle'),
        kind: 'info',
      });
    } catch (err) {
      setExportProgress(null);
      setExportAllLoading(false);
      await message(t('book.exportAll.errorBody', { error: String(err) }), {
        title: t('book.exportAll.errorTitle'),
        kind: 'error',
      });
    }
  }

  function renderBookPreview() {
    if (loading) {
      return (
        <div className="h-full flex items-center justify-center">
          <p className="font-sans text-sm text-text-tertiary">{t('book.loading')}</p>
        </div>
      );
    }
    if (!bookData || totalChapters === 0) {
      return <BookEmptyState />;
    }
    return (
      <div className="flex flex-col items-center gap-8 py-8 px-4">
        <BookIndice items={tocItems} />
        {chapterSections.map((section, idx) => {
          const key = section.kind === 'chapter' ? section.chapter.filename : `error-${idx}`;
          const isLast = idx === totalChapters - 1;
          if (isDraft) {
            return (
              <div key={key} className="w-full max-w-3xl">
                {renderChapterSection(section, isLast)}
              </div>
            );
          }
          return (
            <div key={key} style={sheetStyle}>
              {renderChapterSection(section, isLast)}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-bg-primary">
      <div className="flex items-center gap-1 px-4 py-1.5 border-b border-border-subtle shrink-0">
        {VIEW_MODES.map((mode) => (
          <button
            key={mode.id}
            onClick={() => setBookViewMode(mode.id)}
            className={[
              'px-3 py-1 text-xs rounded transition-colors duration-150',
              bookViewMode === mode.id
                ? 'bg-accent-muted text-text-primary'
                : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary',
            ].join(' ')}
          >
            {t(mode.labelKey)}
          </button>
        ))}

        {bookViewMode === 'write' && (
          <>
            <div className="w-px h-4 bg-border-subtle mx-2" />
            {PREVIEW_MODES.map((pm) => (
              <button
                key={pm.id}
                onClick={() => setPreviewMode(pm.id)}
                className={[
                  'px-2 py-0.5 text-[11px] rounded transition-colors duration-150',
                  previewMode === pm.id
                    ? 'bg-bg-tertiary text-text-primary border border-border-default'
                    : 'text-text-tertiary hover:text-text-secondary',
                ].join(' ')}
              >
                {t(pm.labelKey)}
              </button>
            ))}
            {bookData && totalChapters > 0 && (
              <>
                <button
                  onClick={async () => {
                    const win = getCurrentWindow();
                    const isFullscreen = await win.isFullscreen();
                    await win.setFullscreen(!isFullscreen);
                  }}
                  className="flex items-center gap-1.5 px-2 py-1 text-xs text-text-secondary hover:text-text-primary hover:bg-bg-tertiary rounded transition-colors duration-150"
                  title={t('book.fullScreen')}
                >
                  <Maximize2 size={14} />
                </button>
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 px-2 py-1 text-xs text-text-secondary hover:text-text-primary hover:bg-bg-tertiary rounded transition-colors duration-150"
                  title={t('book.print')}
                >
                  <Printer size={14} />
                  <span>{t('book.print')}</span>
                </button>
              </>
            )}
          </>
        )}
      </div>

      <div className="flex-1 overflow-y-auto scroll-smooth relative" ref={scrollRef}>
        {bookViewMode === 'format' ? (
          <div className="flex h-full">
            <div className="w-[250px] flex-shrink-0 border-r border-border-subtle overflow-y-auto bg-bg-secondary p-4 flex flex-col gap-4">
              <ThemeGallery
                activeThemeId={currentProject.tema ?? DEFAULT_THEME_ID}
                onSelectTheme={(id) => void updateProjectMeta({ tema: id, temaOverrides: undefined })}
                customThemes={customThemes}
                sampleText={
                  activeChapterContent ||
                  bookData?.sections.find((s) => s.kind === 'chapter')?.content ||
                  ''
                }
              />
              <ThemeControls
                themeId={currentProject.tema}
                themeOverrides={currentProject.temaOverrides}
              />
              <BookSettings />
              <BookCoverSection />
            </div>
            <div className="flex-grow min-w-0">
              {renderBookPreview()}
            </div>
          </div>
        ) : (
          renderBookPreview()
        )}
        {showScrollToTop && (
          <button
            onClick={() => scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
            className="absolute bottom-6 right-6 p-2 bg-bg-tertiary border border-border-default rounded-full shadow-sm text-text-secondary hover:text-text-primary transition-colors"
            title={t('book.scrollToTop')}
          >
            <ArrowUp size={16} />
          </button>
        )}
      </div>


      {preExportProblems.length > 0 && (
        <PreExportCheckModal
          problems={preExportProblems}
          onContinue={handlePreExportContinue}
          onCancel={handlePreExportCancel}
        />
      )}
      {showExportDialog && (
        <ExportBookDialog
          onClose={() => { if (!exportLoading) setShowExportDialog(false); }}
          onExport={handleExport}
          loading={exportLoading}
        />
      )}
      {showDocxDialog && (
        <ExportBookDocxDialog
          onClose={() => { if (!docxLoading) setShowDocxDialog(false); }}
          onExport={handleExportDocx}
          loading={docxLoading}
        />
      )}
      {showEpubDialog && (
        <ExportBookEpubDialog
          onClose={() => { if (!epubLoading) setShowEpubDialog(false); }}
          onExport={handleExportEpub}
          loading={epubLoading}
        />
      )}
      {showKindleDialog && (
        <ExportBookKindleDialog
          onClose={() => { if (!epubLoading) setShowExportKindleDialog(false); }}
          onExport={handleExportKindle}
          loading={epubLoading}
        />
      )}
      {showExportAllDialog && (
        <ExportAllDialog
          onClose={() => { if (!exportAllLoading) setShowExportAllDialog(false); }}
          onExport={handleExportAll}
          loading={exportAllLoading}
        />
      )}
      {exportProgress && <ExportProgressBar step={exportProgress} />}

      {bookData &&
        bookData.sections.some((s) => s.kind === 'chapter') &&
        createPortal(
          <BookPrintView
            bookData={bookData}
            themeId={currentProject.tema}
            themeOverrides={currentProject.temaOverrides}
          />,
          document.body,
        )}
    </div>
  );
}

export default BookTabContent;
