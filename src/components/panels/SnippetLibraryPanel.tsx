import { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useProjectStore } from '@/stores/projectStore';
import { readSnippets, writeSnippets, createSnippetId, type Snippet } from '@/lib/snippets';

function SnippetLibraryPanel() {
  const { t } = useTranslation();
  const currentProject = useProjectStore((s) => s.currentProject);
  const insertTextAtCursor = useProjectStore((s) => s.insertTextAtCursor);
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [label, setLabel] = useState('');
  const [text, setText] = useState('');

  useEffect(() => {
    if (!currentProject) {
      setSnippets([]);
      return;
    }
    let cancelled = false;
    readSnippets(currentProject.rootPath).then((s) => {
      if (!cancelled) setSnippets(s);
    });
    return () => {
      cancelled = true;
    };
  }, [currentProject]);

  if (!currentProject) {
    return (
      <div className="p-3">
        <h4 className="text-xs font-medium text-text-secondary uppercase tracking-wide">
          {t('writingToolbar.snippets')}
        </h4>
        <p className="text-[11px] text-text-tertiary mt-2">{t('common.noProjectOpen')}</p>
      </div>
    );
  }

  async function handleAdd() {
    const trimmed = text.trim();
    if (!trimmed) return;
    const snippet: Snippet = { id: createSnippetId(), label: label.trim(), text: trimmed };
    const next = [...snippets, snippet];
    setSnippets(next);
    setLabel('');
    setText('');
    await writeSnippets(currentProject!.rootPath, next);
  }

  async function handleRemove(id: string) {
    const next = snippets.filter((s) => s.id !== id);
    setSnippets(next);
    await writeSnippets(currentProject!.rootPath, next);
  }

  function handleInsert(snippet: Snippet) {
    insertTextAtCursor?.(snippet.text);
  }

  return (
    <div className="p-3 flex flex-col h-full">
      <h4 className="text-xs font-medium text-text-secondary uppercase tracking-wide">
        {t('writingToolbar.snippets')}
      </h4>

      <div className="mt-2 space-y-1.5">
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder={t('writingToolbar.snippetsLabelPlaceholder')}
          className="w-full px-2 py-1.5 text-xs bg-bg-tertiary border border-border-subtle rounded focus:border-accent outline-none placeholder:text-text-tertiary"
        />
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t('writingToolbar.snippetsTextPlaceholder')}
          className="w-full px-2 py-1.5 text-xs bg-bg-tertiary border border-border-subtle rounded focus:border-accent outline-none placeholder:text-text-tertiary resize-none min-h-[56px]"
        />
        <button
          onClick={() => void handleAdd()}
          disabled={!text.trim()}
          className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 text-[11px] text-text-primary bg-accent-muted rounded hover:bg-accent transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Plus size={12} />
          {t('writingToolbar.snippetsAdd')}
        </button>
      </div>

      <div className="mt-3 flex-1 min-h-0 overflow-y-auto space-y-1.5">
        {snippets.length === 0 ? (
          <p className="text-[11px] text-text-tertiary">{t('writingToolbar.snippetsEmpty')}</p>
        ) : (
          snippets.map((snippet) => (
            <div
              key={snippet.id}
              className="group border border-border-subtle rounded p-2 hover:border-accent-muted transition-colors duration-150"
            >
              <button
                onClick={() => handleInsert(snippet)}
                className="w-full text-left"
                title={t('writingToolbar.snippetsInsertHint')}
              >
                {snippet.label && (
                  <p className="text-[11px] font-medium text-text-primary truncate">{snippet.label}</p>
                )}
                <p className="text-[11px] text-text-secondary line-clamp-2 break-words">
                  {snippet.text}
                </p>
              </button>
              <div className="flex justify-end mt-1">
                <button
                  onClick={() => void handleRemove(snippet.id)}
                  title={t('writingToolbar.snippetsDelete')}
                  className="text-text-tertiary hover:text-error transition-colors duration-150"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default SnippetLibraryPanel;
