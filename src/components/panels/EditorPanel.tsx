import { useEffect, useRef } from 'react';
import { Eye, Pencil } from 'lucide-react';
import ChapterEditor from '@/components/editor/ChapterEditor';
import BookMarkdown from '@/components/book/BookMarkdown';
import ShortcutHint from '@/components/shared/ShortcutHint';
import { useProjectStore } from '@/stores/projectStore';
import { useLayoutStore } from '@/stores/layoutStore';
import { useAutosave } from '@/hooks/useAutosave';

function EditorPanel() {
  const activeChapterPath = useProjectStore((s) => s.activeChapterPath);
  const activeChapterContent = useProjectStore((s) => s.activeChapterContent);
  const currentProject = useProjectStore((s) => s.currentProject);
  const editorVersion = useProjectStore((s) => s.editorVersion);
  const updateContent = useProjectStore((s) => s.updateContent);
  const setSaveStatus = useProjectStore((s) => s.setSaveStatus);
  const saveStatus = useProjectStore((s) => s.saveStatus);
  const setFlushAutosave = useProjectStore((s) => s.setFlushAutosave);
  const setSyncAutosaveSaved = useProjectStore((s) => s.setSyncAutosaveSaved);

  const editorViewMode = useLayoutStore((s) => s.editorViewMode);
  const toggleEditorViewMode = useLayoutStore((s) => s.toggleEditorViewMode);
  const flushAutosave = useProjectStore((s) => s.flushAutosave);

  const previewScrollRef = useRef<HTMLDivElement>(null);

  const { flush, syncSaved } = useAutosave({
    content: activeChapterContent,
    chapterPath: activeChapterPath,
    projectPath: currentProject?.rootPath ?? null,
    onStatusChange: setSaveStatus,
    delay: 500,
  });

  useEffect(() => {
    setFlushAutosave(flush);
    setSyncAutosaveSaved(syncSaved);
    return () => {
      setFlushAutosave(null);
      setSyncAutosaveSaved(null);
    };
  }, [flush, syncSaved, setFlushAutosave, setSyncAutosaveSaved]);

  useEffect(() => {
    if (saveStatus !== 'saved') return;
    const timer = setTimeout(() => setSaveStatus('idle'), 2000);
    return () => clearTimeout(timer);
  }, [saveStatus, setSaveStatus]);

  if (!activeChapterPath) {
    return (
      <div className="h-full bg-bg-editor flex items-center justify-center">
        <p className="font-serif text-base text-text-tertiary">No hay capítulo activo</p>
      </div>
    );
  }

  async function handleToggle() {
    await flushAutosave?.();
    toggleEditorViewMode();
  }

  const isPreview = editorViewMode === 'preview';

  return (
    <div className="h-full flex flex-col bg-bg-editor">
      <div className="flex items-center justify-end px-3 py-1.5 border-b border-border-subtle shrink-0">
        <div className="relative flex items-center">
          <button
            onClick={handleToggle}
            className="flex items-center gap-1.5 px-2 py-1 text-xs text-text-secondary hover:text-text-primary rounded hover:bg-bg-tertiary transition-colors duration-150"
            title={isPreview ? 'Editar (⌘E)' : 'Vista previa (⌘E)'}
          >
            {isPreview ? (
              <Pencil size={14} />
            ) : (
              <Eye size={14} />
            )}
            <span>{isPreview ? 'Editar' : 'Previsualizar'}</span>
          </button>
          <div className="pl-1.5">
            <ShortcutHint text="⌘E" />
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 relative">
        <div className={isPreview ? 'absolute inset-0 invisible pointer-events-none' : 'h-full'}>
          <ChapterEditor
            key={`${activeChapterPath}:${editorVersion}`}
            initialContent={activeChapterContent}
            onChange={updateContent}
          />
        </div>

        <div
          ref={previewScrollRef}
          className={[
            'absolute inset-0 overflow-y-auto',
            isPreview ? '' : 'invisible pointer-events-none',
          ].join(' ')}
        >
          <BookMarkdown content={activeChapterContent} maxWidth={900} />
        </div>
      </div>
    </div>
  );
}

export default EditorPanel;
