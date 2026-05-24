import { useEffect, useRef, useState } from 'react';
import { useProjectStore } from '@/stores/projectStore';
import { readAgradecimientos, writeAgradecimientos } from '@/lib/backmatter-fs';
import { commitChanges } from '@/lib/versioning';
import ChapterEditor from '@/components/editor/ChapterEditor';

function BackmatterAgradecimientosEditor() {
  const currentProject = useProjectStore((s) => s.currentProject);
  const [initialContent, setInitialContent] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  useEffect(() => {
    if (!currentProject) return;
    readAgradecimientos(currentProject.rootPath).then((data) => {
      const content = data?.contenido ?? '';
      setInitialContent(content);
      lastSavedRef.current = content;
    });
  }, [currentProject]);

  function handleChange(content: string) {
    if (timerRef.current !== null) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(async () => {
      if (!currentProject) return;
      if (content === lastSavedRef.current) return;

      setSaveStatus('saving');
      const filePath = `${currentProject.rootPath}/backmatter/agradecimientos.md`;
      await writeAgradecimientos(currentProject.rootPath, { contenido: content });
      lastSavedRef.current = content;

      await commitChanges(currentProject.rootPath, filePath);

      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 1500);
    }, 500);
  }

  if (initialContent === null) {
    return (
      <div className="h-full bg-bg-editor flex items-center justify-center">
        <p className="text-xs text-text-tertiary">Cargando…</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-bg-editor">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border-subtle shrink-0">
        <span className="text-xs text-text-tertiary font-sans uppercase tracking-wider">
          Agradecimientos
        </span>
        {saveStatus === 'saving' && (
          <span className="text-xs text-text-tertiary">Guardando…</span>
        )}
        {saveStatus === 'saved' && (
          <span className="text-xs text-accent">Guardado</span>
        )}
      </div>
      <div className="flex-1 min-h-0">
        <ChapterEditor
          key="agradecimientos"
          initialContent={initialContent}
          onChange={handleChange}
        />
      </div>
    </div>
  );
}

export default BackmatterAgradecimientosEditor;
