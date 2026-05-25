import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import { save, message } from '@tauri-apps/plugin-dialog';
import { useProjectStore } from '@/stores/projectStore';
import { useLayoutStore } from '@/stores/layoutStore';
import { loadBook } from '@/lib/book-loader';
import { exportBookMarkdown } from '@/lib/export-service';
import BookHeader from '@/components/book/BookHeader';
import BookChapter from '@/components/book/BookChapter';
import BookChapterError from '@/components/book/BookChapterError';
import BookEmptyState from '@/components/book/BookEmptyState';
import BookFrontmatterTitle from '@/components/book/BookFrontmatterTitle';
import BookFrontmatterCopyright from '@/components/book/BookFrontmatterCopyright';
import BookFrontmatterDedicatoria from '@/components/book/BookFrontmatterDedicatoria';
import BookBackmatterAgradecimientos from '@/components/book/BookBackmatterAgradecimientos';
import ExportBookDialog from '@/components/book/ExportBookDialog';
import type { BookData } from '@/types/book';
import type { ExportScope } from '@/lib/export-service';

function BookTabContent() {
  const currentProject = useProjectStore((s) => s.currentProject);
  const activeTab = useLayoutStore((s) => s.activeTab);
  const [bookData, setBookData] = useState<BookData | null>(null);
  const [loading, setLoading] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

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
      const defaultPath = `${currentProject.rootPath}/${currentProject.nombre}-${today}.md`;

      const outputPath = await save({
        defaultPath,
        filters: [{ name: 'Markdown', extensions: ['md'] }],
      });

      if (!outputPath) {
        setExportLoading(false);
        return;
      }

      await exportBookMarkdown(currentProject.rootPath, { scope }, outputPath);

      setShowExportDialog(false);
      setExportLoading(false);

      await message(`Libro exportado en:\n${outputPath}`, {
        title: 'Exportación completada',
        kind: 'info',
      });
    } catch (err) {
      setExportLoading(false);
      await message(`Error al exportar: ${String(err)}`, {
        title: 'Error de exportación',
        kind: 'error',
      });
    }
  }

  if (!currentProject) {
    return (
      <div className="h-full flex items-center justify-center bg-bg-primary">
        <p className="font-serif text-text-tertiary">Sin proyecto abierto</p>
      </div>
    );
  }

  function renderContent() {
    if (loading) {
      return (
        <div className="h-full flex items-center justify-center">
          <p className="font-sans text-sm text-text-tertiary">Cargando libro…</p>
        </div>
      );
    }

    if (!bookData || bookData.sections.length === 0) {
      return <BookEmptyState />;
    }

    const validCount = bookData.sections.filter((s) => s.kind === 'chapter').length;
    const { titulo, copyright, dedicatoria } = bookData.frontmatter;
    const { agradecimientos } = bookData.backmatter;

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
        <div className="pb-24">
          {bookData.sections.map((section, idx) => {
            const isLast = idx === bookData.sections.length - 1;
            if (section.kind === 'chapter') {
              return (
                <BookChapter
                  key={section.chapter.path}
                  content={section.content}
                  isLast={isLast}
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
      </>
    );
  }

  return (
    <div className="h-full flex flex-col bg-bg-primary">
      <div className="flex items-center justify-end px-4 py-2 border-b border-border-subtle shrink-0">
        <button
          onClick={() => setShowExportDialog(true)}
          disabled={exportLoading}
          className="flex items-center gap-1.5 px-2 py-1 text-xs text-text-secondary hover:text-text-primary disabled:opacity-40 rounded hover:bg-bg-tertiary transition-colors duration-150"
          title="Exportar libro a markdown"
        >
          <Download size={14} />
          <span>Exportar</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {renderContent()}
      </div>

      {showExportDialog && (
        <ExportBookDialog
          onClose={() => { if (!exportLoading) setShowExportDialog(false); }}
          onExport={handleExport}
          loading={exportLoading}
        />
      )}
    </div>
  );
}

export default BookTabContent;
