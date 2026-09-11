import { useEffect, useRef, useState } from 'react';
import { save, message } from '@tauri-apps/plugin-dialog';
import { useTranslation } from 'react-i18next';
import { useProjectStore } from '@/stores/projectStore';
import { useLayoutStore } from '@/stores/layoutStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { loadBook } from '@/lib/book-loader';
import { exportBookMarkdown, exportBookDocx, exportBookEpub } from '@/lib/export-service';
import { slugify } from '@/lib/export-composer';
import BookHeader from '@/components/book/BookHeader';
import BookChapter from '@/components/book/BookChapter';
import BookChapterError from '@/components/book/BookChapterError';
import BookEmptyState from '@/components/book/BookEmptyState';
import BookFrontmatterTitle from '@/components/book/BookFrontmatterTitle';
import BookFrontmatterCopyright from '@/components/book/BookFrontmatterCopyright';
import BookFrontmatterDedicatoria from '@/components/book/BookFrontmatterDedicatoria';
import BookIndice from '@/components/book/BookIndice';
import BookBackmatterAgradecimientos from '@/components/book/BookBackmatterAgradecimientos';
import BookBackmatterSobreElAutor from '@/components/book/BookBackmatterSobreElAutor';
import BookBackmatterOtrosLibros from '@/components/book/BookBackmatterOtrosLibros';
import PreExportCheckModal from '@/components/book/PreExportCheckModal';
import ExportBookDialog from '@/components/book/ExportBookDialog';
import ExportBookDocxDialog from '@/components/book/ExportBookDocxDialog';
import ExportBookEpubDialog from '@/components/book/ExportBookEpubDialog';
import ThemeGallery from '@/components/book/ThemeGallery';
import ThemeControls from '@/components/book/ThemeControls';
import BookSettings from '@/components/book/BookSettings';
import DeviceFrame from '@/components/book/DeviceFrame';
import { DEFAULT_THEME_ID } from '@/lib/theme';
import type { BookData } from '@/types/book';
type ExportTarget = 'md' | 'docx' | 'epub';
import type { ExportScope } from '@/lib/export-service';
import type { BookViewMode, DeviceFrame as DeviceFrameType } from '@/types/layout';

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
  const deviceFrame = useLayoutStore((s) => s.deviceFrame);
  const setDeviceFrame = useLayoutStore((s) => s.setDeviceFrame);
  const [exportLoading, setExportLoading] = useState(false);
  const [showDocxDialog, setShowDocxDialog] = useState(false);
  const [docxLoading, setDocxLoading] = useState(false);
  const [showEpubDialog, setShowEpubDialog] = useState(false);
  const [epubLoading, setEpubLoading] = useState(false);
  const [preExportProblems, setPreExportProblems] = useState<string[]>([]);
  const [pendingExportTarget, setPendingExportTarget] = useState<ExportTarget | null>(null);
  const skipPreCheck = useRef(false);

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
  }, [activeTab, currentProject]);

  async function handleExport(scope: ExportScope) {
    if (!currentProject) return;
    setExportLoading(true);

    try {
      const today = new Date().toISOString().slice(0, 10);
      const baseDir = exportFolder || currentProject.rootPath;
      const defaultPath = `${baseDir}/${currentProject.nombre}-${today}.md`;

      const outputPath = await save({
        defaultPath,
        filters: [{ name: 'Markdown', extensions: ['md'] }],
      });

      if (!outputPath) {
        setExportLoading(false);
        return;
      }

      await exportBookMarkdown(currentProject.rootPath, { scope }, outputPath, currentProject.nombre);

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
      const today = new Date().toISOString().slice(0, 10);
      const baseDir = exportFolder || currentProject.rootPath;
      const defaultPath = `${baseDir}/${currentProject.nombre}-${today}.docx`;

      const outputPath = await save({
        defaultPath,
        filters: [{ name: 'Word', extensions: ['docx'] }],
      });

      if (!outputPath) {
        setDocxLoading(false);
        return;
      }

      await exportBookDocx(currentProject.rootPath, { scope }, outputPath, currentProject.nombre);

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
      const today = new Date().toISOString().slice(0, 10);
      const defaultPath = `${currentProject.rootPath}/${currentProject.nombre}-${today}.epub`;

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
        { scope },
        outputPath,
        currentProject.tema,
        currentProject.temaOverrides,
        currentProject.nombre,
      );

      setShowEpubDialog(false);
      setEpubLoading(false);

      await message(`Libro exportado en:\n${outputPath}`, {
        title: 'Exportación completada',
        kind: 'info',
      });
    } catch (err) {
      setEpubLoading(false);
      await message(`Error al exportar: ${String(err)}`, {
        title: 'Error de exportación',
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

  function renderContent() {
    if (loading) {
      return (
        <div className="h-full flex items-center justify-center">
          <p className="font-sans text-sm text-text-tertiary">{t('book.loading')}</p>
        </div>
      );
    }

    if (!bookData || bookData.sections.length === 0) {
      return <BookEmptyState />;
    }

    const validCount = bookData.sections.filter((s) => s.kind === 'chapter').length;
    const { titulo, copyright, dedicatoria } = bookData.frontmatter;
    const { agradecimientos, sobreElAutor, otrosLibros } = bookData.backmatter;

    const tocItems = bookData.sections
      .filter((s) => s.kind === 'chapter')
      .map((s) => ({
        title: s.chapter.title,
        slug: slugify(s.chapter.filename.replace(/\.md$/, '')),
      }));

    return (
      <>
        {titulo && titulo.titulo ? (
          <BookFrontmatterTitle titulo={titulo} />
        ) : (
          <BookHeader projectName={bookData.projectName} chapterCount={validCount} />
        )}
        {copyright && (copyright.titular || copyright.licencia) && (
          <BookFrontmatterCopyright copyright={copyright} />
        )}
        {dedicatoria && <BookFrontmatterDedicatoria dedicatoria={dedicatoria} />}
        <BookIndice items={tocItems} />
        <div className="pb-24">
          {bookData.sections.map((section, idx) => {
            const isLast = idx === bookData.sections.length - 1;
            if (section.kind === 'chapter') {
              const slug = slugify(section.chapter.filename.replace(/\.md$/, ''));
              return (
                <BookChapter
                  key={section.chapter.path}
                  content={section.content}
                  isLast={isLast}
                  slug={slug}
                  themeId={currentProject?.tema}
                  themeOverrides={currentProject?.temaOverrides}
                  bookSettings={currentProject?.bookSettings}
                  projectRootPath={currentProject?.rootPath}
                />
              );
            }
            return (
              <BookChapterError
                key={section.chapter.path}
                chapterFilename={section.chapter.filename}
                reason={section.reason}
              />
            );
          })}
        </div>
        {agradecimientos && <BookBackmatterAgradecimientos agradecimientos={agradecimientos} />}
        {sobreElAutor && <BookBackmatterSobreElAutor sobreElAutor={sobreElAutor} />}
        {otrosLibros && <BookBackmatterOtrosLibros otrosLibros={otrosLibros} />}
      </>
    );
  }

  const VIEW_MODES: { id: BookViewMode; labelKey: string }[] = [
    { id: 'write', labelKey: 'book.writeMode' },
    { id: 'format', labelKey: 'book.formatMode' },
  ];

  const DEVICE_OPTIONS: { id: DeviceFrameType; labelKey: string }[] = [
    { id: 'none', labelKey: 'book.deviceFrame.none' },
    { id: 'kindle', labelKey: 'book.deviceFrame.kindle' },
    { id: 'print', labelKey: 'book.deviceFrame.print' },
    { id: 'tablet', labelKey: 'book.deviceFrame.tablet' },
  ];

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
            <select
              value={deviceFrame}
              onChange={(e) => setDeviceFrame(e.target.value as DeviceFrameType)}
              className="px-2 py-1 text-xs text-text-secondary bg-transparent border border-border-subtle rounded hover:border-border-default focus:border-accent outline-none transition-colors duration-150"
            >
              {DEVICE_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {t(opt.labelKey)}
                </option>
              ))}
            </select>
          </>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {bookViewMode === 'format' ? (
          <>
            <ThemeGallery
              activeThemeId={currentProject.tema ?? DEFAULT_THEME_ID}
              onSelectTheme={(id) => void updateProjectMeta({ tema: id, temaOverrides: undefined })}
              customThemes={customThemes}
            />
            <ThemeControls
              themeId={currentProject.tema}
              themeOverrides={currentProject.temaOverrides}
            />
            <BookSettings />
          </>
        ) : (
          <DeviceFrame device={deviceFrame}>
            {renderContent()}
          </DeviceFrame>
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
    </div>
  );
}

export default BookTabContent;
