import { useEffect, useRef, useState } from 'react';
import { save, message } from '@tauri-apps/plugin-dialog';
import { invoke } from '@tauri-apps/api/core';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useProjectStore } from '@/stores/projectStore';
import { useLayoutStore } from '@/stores/layoutStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { loadBook } from '@/lib/book-loader';
import { exportBookMarkdown, exportBookDocx, exportBookEpub } from '@/lib/export-service';
import { slugify } from '@/lib/export-composer';
import BookChapter from '@/components/book/BookChapter';
import BookChapterError from '@/components/book/BookChapterError';
import BookEmptyState from '@/components/book/BookEmptyState';
import PreExportCheckModal from '@/components/book/PreExportCheckModal';
import ExportBookDialog from '@/components/book/ExportBookDialog';
import ExportBookDocxDialog from '@/components/book/ExportBookDocxDialog';
import ExportBookEpubDialog from '@/components/book/ExportBookEpubDialog';
import ThemeGallery from '@/components/book/ThemeGallery';
import ThemeControls from '@/components/book/ThemeControls';
import BookSettings from '@/components/book/BookSettings';
import BookCoverSection from '@/components/book/BookCoverSection';
import { DEFAULT_THEME_ID } from '@/lib/theme';
import type { BookData } from '@/types/book';
type ExportTarget = 'md' | 'docx' | 'epub';

const WORDS_PER_MINUTE = 200;

function countWordsSimple(text: string): number {
  const stripped = text.replace(/^#+\s.*/gm, '').replace(/[*_~`>#\-\[\]()!]/g, '');
  const words = stripped.match(/\S+/g);
  return words ? words.length : 0;
}
import type { ExportScope } from '@/lib/export-service';
import type { BookViewMode, PreviewMode } from '@/types/layout';

function BookTabContent() {
  const { t } = useTranslation();
  const currentProject = useProjectStore((s) => s.currentProject);
  const updateProjectMeta = useProjectStore((s) => s.updateProjectMeta);
  const activeTab = useLayoutStore((s) => s.activeTab);
  const exportFolder = useSettingsStore((s) => s.exportFolder);
  const customThemes = useSettingsStore((s) => s.customThemes);
  const setExportFolder = useSettingsStore((s) => s.setExportFolder);
  const [bookData, setBookData] = useState<BookData | null>(null);
  const [loading, setLoading] = useState(false);
  const showExportDialog = useLayoutStore((s) => s.showExportDialog);
  const setShowExportDialog = useLayoutStore((s) => s.setShowExportDialog);
  const bookViewMode = useLayoutStore((s) => s.bookViewMode);
  const setBookViewMode = useLayoutStore((s) => s.setBookViewMode);
  const previewMode = useLayoutStore((s) => s.previewMode);
  const setPreviewMode = useLayoutStore((s) => s.setPreviewMode);
  const [exportLoading, setExportLoading] = useState(false);
  const [showDocxDialog, setShowDocxDialog] = useState(false);
  const [docxLoading, setDocxLoading] = useState(false);
  const [showEpubDialog, setShowEpubDialog] = useState(false);
  const [epubLoading, setEpubLoading] = useState(false);
  const [preExportProblems, setPreExportProblems] = useState<string[]>([]);
  const [pendingExportTarget, setPendingExportTarget] = useState<ExportTarget | null>(null);
  const skipPreCheck = useRef(false);
  const sectionVersion = useProjectStore((s) => s.sectionVersion);
  const activeChapterContent = useProjectStore((s) => s.activeChapterContent);
  const [previewChapterIdx, setPreviewChapterIdx] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

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

  function exportBaseName(ext: string): string {
    const title = bookData?.frontmatter.titulo?.titulo?.trim();
    const base = title
      ? title.replace(/[/\\?%*:|"<>]/g, '').replace(/\s+/g, '-')
      : currentProject!.nombre;
    const today = new Date().toISOString().slice(0, 10);
    return `${base}-${today}.${ext}`;
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

      await exportBookMarkdown(currentProject.rootPath, { scope, excludedFilenames: currentProject.excludedFromExport }, outputPath, currentProject.nombre);
      void backupExportedFile(outputPath);

      const chosenDir = outputPath.slice(0, outputPath.lastIndexOf('/'));
      if (chosenDir) void setExportFolder(chosenDir);

      setShowExportDialog(false);
      setExportLoading(false);

      await message(t('book.export.successBody', { path: outputPath }), {
        title: t('book.export.successTitle'),
        kind: 'info',
      });
    } catch (err) {
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

      await exportBookDocx(currentProject.rootPath, { scope, excludedFilenames: currentProject.excludedFromExport }, outputPath, currentProject.nombre);
      void backupExportedFile(outputPath);

      const chosenDir = outputPath.slice(0, outputPath.lastIndexOf('/'));
      if (chosenDir) void setExportFolder(chosenDir);

      setShowDocxDialog(false);
      setDocxLoading(false);

      await message(t('book.export.successBody', { path: outputPath }), {
        title: t('book.export.successTitle'),
        kind: 'info',
      });
    } catch (err) {
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

      await exportBookEpub(
        currentProject.rootPath,
        { scope, excludedFilenames: currentProject.excludedFromExport },
        outputPath,
        currentProject.tema,
        currentProject.temaOverrides,
        currentProject.nombre,
      );
      void backupExportedFile(outputPath);

      const chosenDir = outputPath.slice(0, outputPath.lastIndexOf('/'));
      if (chosenDir) void setExportFolder(chosenDir);

      setShowEpubDialog(false);
      setEpubLoading(false);

      await message(t('book.export.successBody', { path: outputPath }), {
        title: t('book.export.successTitle'),
        kind: 'info',
      });
    } catch (err) {
      setEpubLoading(false);
      await message(t('book.export.errorBody', { error: String(err) }), {
        title: t('book.export.errorTitle'),
        kind: 'error',
      });
    }
  }

  if (!currentProject) {
    return (
      <div className="h-full flex items-center justify-center bg-bg-primary">
        <p className="font-serif text-text-tertiary">{t('common.noProjectOpen')}</p>
      </div>
    );
  }

  const VIEW_MODES: { id: BookViewMode; labelKey: string }[] = [
    { id: 'write', labelKey: 'book.writeMode' },
    { id: 'format', labelKey: 'book.formatMode' },
  ];

  const PREVIEW_MODES: { id: PreviewMode; labelKey: string }[] = [
    { id: 'print', labelKey: 'book.previewMode.print' },
    { id: 'draft', labelKey: 'book.previewMode.draft' },
    { id: 'proof', labelKey: 'book.previewMode.proof' },
  ];

  const chapterSections = bookData?.sections ?? [];
  const totalChapters = chapterSections.length;
  const clampedIdx = Math.min(previewChapterIdx, Math.max(0, totalChapters - 1));

  function goToChapter(idx: number) {
    setPreviewChapterIdx(idx);
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function renderChapterPreview() {
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

    const section = chapterSections[clampedIdx];
    if (!section) return <BookEmptyState />;

    if (section.kind === 'chapter-error') {
      return <BookChapterError chapterFilename={section.chapter.filename} reason={section.reason} />;
    }

    const slug = slugify(section.chapter.filename.replace(/\.md$/, ''));
    return (
      <BookChapter
        content={section.content}
        isLast={false}
        slug={slug}
        themeId={currentProject?.tema}
        themeOverrides={currentProject?.temaOverrides}
        bookSettings={currentProject?.bookSettings}
        projectRootPath={currentProject?.rootPath}
      />
    );
  }

  const isDraft = previewMode === 'draft';
  const isProof = previewMode === 'proof';

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
          </>
        )}
      </div>

      <div className="flex-1 overflow-y-auto" ref={scrollRef}>
        {bookViewMode === 'format' ? (
          <>
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
          </>
        ) : (
          <div className="flex justify-center py-8 px-4">
            {isDraft ? (
              <div className="w-full max-w-3xl">
                {renderChapterPreview()}
              </div>
            ) : (
              <div
                style={{
                  width: '580px',
                  minHeight: '780px',
                  padding: '48px 56px',
                  backgroundColor: isProof ? '#f0f0f0' : 'var(--bg-editor)',
                  boxShadow: isProof
                    ? 'inset 0 0 0 1px #d0d0d0'
                    : '0 1px 3px rgba(0,0,0,0.08), 0 8px 24px rgba(0,0,0,0.12)',
                  borderRadius: '2px',
                  border: isProof ? '12px solid #e0e0e0' : undefined,
                }}
              >
                {renderChapterPreview()}
              </div>
            )}
          </div>
        )}
      </div>

      {bookViewMode === 'write' && totalChapters > 0 && (
        <div className="flex items-center justify-between px-4 py-2 border-t border-border-subtle shrink-0 bg-bg-secondary">
          <button
            onClick={() => goToChapter(clampedIdx - 1)}
            disabled={clampedIdx <= 0}
            className="flex items-center gap-1 px-2 py-1 text-xs text-text-secondary hover:text-text-primary disabled:opacity-30 disabled:cursor-default rounded hover:bg-bg-tertiary transition-colors duration-150"
          >
            <ChevronLeft size={14} />
            <span>{t('book.previewNav.prevChapter')}</span>
          </button>
          <div className="flex flex-col items-center">
            <span className="text-xs text-text-tertiary">
              {t('book.previewNav.chapterOf', { current: clampedIdx + 1, total: totalChapters })}
            </span>
            {chapterSections[clampedIdx]?.kind === 'chapter' && (
              <span className="text-[10px] text-text-tertiary">
                {t('book.readingTime', {
                  minutes: Math.max(1, Math.ceil(countWordsSimple(chapterSections[clampedIdx].content) / WORDS_PER_MINUTE)),
                })}
              </span>
            )}
          </div>
          <button
            onClick={() => goToChapter(clampedIdx + 1)}
            disabled={clampedIdx >= totalChapters - 1}
            className="flex items-center gap-1 px-2 py-1 text-xs text-text-secondary hover:text-text-primary disabled:opacity-30 disabled:cursor-default rounded hover:bg-bg-tertiary transition-colors duration-150"
          >
            <span>{t('book.previewNav.nextChapter')}</span>
            <ChevronRight size={14} />
          </button>
        </div>
      )}

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
    </div>
  );
}

export default BookTabContent;
