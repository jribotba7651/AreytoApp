import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import BookMarkdown from '@/components/book/BookMarkdown';
import { useProjectStore } from '@/stores/projectStore';
import { useLayoutStore } from '@/stores/layoutStore';
import { readChapter } from '@/lib/project-fs';

function SplitReadPanel() {
  const { t } = useTranslation();
  const chapters = useProjectStore((s) => s.chapters);
  const activeChapterPath = useProjectStore((s) => s.activeChapterPath);
  const currentProject = useProjectStore((s) => s.currentProject);

  const splitView = useLayoutStore((s) => s.splitView);
  const setSplitView = useLayoutStore((s) => s.setSplitView);
  const toggleSplitView = useLayoutStore((s) => s.toggleSplitView);

  const [content, setContent] = useState('');

  const otherChapters = chapters.filter((c) => c.path !== activeChapterPath);

  useEffect(() => {
    if (!splitView.chapterPath) {
      setContent('');
      return;
    }
    let cancelled = false;
    readChapter(splitView.chapterPath).then((result) => {
      if (!cancelled && result.ok) setContent(result.value);
    });
    return () => { cancelled = true; };
  }, [splitView.chapterPath]);

  return (
    <div className="h-full flex flex-col bg-bg-editor border-l border-border-subtle">
      <div className="flex items-center justify-between px-3 py-1 border-b border-border-subtle shrink-0">
        <select
          value={splitView.chapterPath ?? ''}
          onChange={(e) => setSplitView({ chapterPath: e.target.value || null })}
          className="text-xs text-text-secondary bg-transparent border border-border-default rounded px-1.5 py-0.5 outline-none focus:border-border-strong max-w-[200px] truncate"
        >
          <option value="">{t('editor.splitSelectChapter')}</option>
          {otherChapters.map((ch) => (
            <option key={ch.path} value={ch.path}>
              {ch.title}
            </option>
          ))}
        </select>
        <button
          onClick={toggleSplitView}
          className="p-1 text-text-secondary hover:text-text-primary rounded hover:bg-bg-tertiary transition-colors duration-150"
          title={t('editor.closeSplit')}
        >
          <X size={14} />
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        {content ? (
          <BookMarkdown
            content={content}
            themeId={currentProject?.tema}
            themeOverrides={currentProject?.temaOverrides}
            projectRootPath={currentProject?.rootPath}
          />
        ) : (
          <div className="h-full flex items-center justify-center">
            <p className="text-sm text-text-tertiary">
              {t('editor.splitEmpty')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default SplitReadPanel;
