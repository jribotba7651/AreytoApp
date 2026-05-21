import { useEffect } from 'react';
import ChapterEditor from '@/components/editor/ChapterEditor';
import { useProjectStore } from '@/stores/projectStore';
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

  const { flush, syncSaved } = useAutosave({
    content: activeChapterContent,
    chapterPath: activeChapterPath,
    projectPath: currentProject?.rootPath ?? null,
    onStatusChange: setSaveStatus,
    delay: 500,
  });

  // Register flush and syncSaved in store so restore flow can access them
  useEffect(() => {
    setFlushAutosave(flush);
    setSyncAutosaveSaved(syncSaved);
    return () => {
      setFlushAutosave(null);
      setSyncAutosaveSaved(null);
    };
  }, [flush, syncSaved, setFlushAutosave, setSyncAutosaveSaved]);

  // Auto-reset 'saved' → 'idle' después de 2s
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

  return (
    <div className="h-full bg-bg-editor">
      <ChapterEditor
        key={`${activeChapterPath}:${editorVersion}`}
        initialContent={activeChapterContent}
        onChange={updateContent}
      />
    </div>
  );
}

export default EditorPanel;
