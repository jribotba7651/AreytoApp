import { useEffect } from 'react';
import ChapterEditor from '@/components/editor/ChapterEditor';
import { useProjectStore } from '@/stores/projectStore';
import { useAutosave } from '@/hooks/useAutosave';

function EditorPanel() {
  const activeChapterPath = useProjectStore((s) => s.activeChapterPath);
  const activeChapterContent = useProjectStore((s) => s.activeChapterContent);
  const updateContent = useProjectStore((s) => s.updateContent);
  const setSaveStatus = useProjectStore((s) => s.setSaveStatus);
  const saveStatus = useProjectStore((s) => s.saveStatus);

  useAutosave({
    content: activeChapterContent,
    chapterPath: activeChapterPath,
    onStatusChange: setSaveStatus,
    delay: 500,
  });

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
        key={activeChapterPath}
        initialContent={activeChapterContent}
        onChange={updateContent}
      />
    </div>
  );
}

export default EditorPanel;
