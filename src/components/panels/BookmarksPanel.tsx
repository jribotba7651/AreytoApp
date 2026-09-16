import { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useProjectStore } from '@/stores/projectStore';
import { useLayoutStore } from '@/stores/layoutStore';
import { readChapter, updateProjectMeta } from '@/lib/project-fs';
import { loadCommitsForActiveChapter } from '@/lib/git-service';
import { readBookmarks, writeBookmarks, createBookmarkId, type Bookmark } from '@/lib/bookmarks';

function BookmarksPanel() {
  const { t } = useTranslation();
  const currentProject = useProjectStore((s) => s.currentProject);
  const chapters = useProjectStore((s) => s.chapters);
  const activeChapterPath = useProjectStore((s) => s.activeChapterPath);
  const setActiveChapter = useProjectStore((s) => s.setActiveChapter);
  const setCommits = useProjectStore((s) => s.setCommits);
  const setActiveTab = useLayoutStore((s) => s.setActiveTab);

  const activeChapter = chapters.find((c) => c.path === activeChapterPath) ?? null;

  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [title, setTitle] = useState('');
  const [chapterFilename, setChapterFilename] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!currentProject) {
      setBookmarks([]);
      return;
    }
    let cancelled = false;
    readBookmarks(currentProject.rootPath).then((bms) => {
      if (!cancelled) setBookmarks(bms);
    });
    return () => {
      cancelled = true;
    };
  }, [currentProject]);

  useEffect(() => {
    if (activeChapter?.filename && !chapterFilename) {
      setChapterFilename(activeChapter.filename);
    }
  }, [activeChapter]);

  if (!currentProject) {
    return (
      <div className="p-3">
        <h4 className="text-xs font-medium text-text-secondary uppercase tracking-wide">
          {t('writingToolbar.bookmarks')}
        </h4>
        <p className="text-[11px] text-text-tertiary mt-2">{t('common.noProjectOpen')}</p>
      </div>
    );
  }

  async function handleAdd() {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    const newBookmark: Bookmark = {
      id: createBookmarkId(),
      title: trimmedTitle,
      chapterFilename: chapterFilename || null,
      note: note.trim(),
      createdAt: new Date().toISOString().slice(0, 10),
    };

    const next = [...bookmarks, newBookmark];
    setBookmarks(next);
    setTitle('');
    setNote('');
    await writeBookmarks(currentProject!.rootPath, next);
  }

  async function handleRemove(id: string) {
    const next = bookmarks.filter((b) => b.id !== id);
    setBookmarks(next);
    await writeBookmarks(currentProject!.rootPath, next);
  }

  async function handleNavigate(filename: string | null) {
    if (!filename || !currentProject) return;
    const target = chapters.find((c) => c.filename === filename);
    if (!target) return;

    await useProjectStore.getState().flushAutosave?.();
    const read = await readChapter(target.path);
    if (!read.ok) {
      console.error('Failed to read chapter for bookmark navigation:', read.error);
      return;
    }

    setActiveChapter(target.path, read.value);
    await updateProjectMeta(currentProject, { capituloActivo: target.filename });
    setActiveTab('capitulo');
    const commitsResult = await loadCommitsForActiveChapter(currentProject.rootPath, target.path);
    if (commitsResult.ok) setCommits(commitsResult.value);
  }

  function chapterTitle(filename: string | null): string | null {
    if (!filename) return null;
    const chapter = chapters.find((c) => c.filename === filename);
    return chapter ? chapter.title : null;
  }

  return (
    <div className="p-3 flex flex-col h-full">
      <h4 className="text-xs font-medium text-text-secondary uppercase tracking-wide">
        {t('writingToolbar.bookmarks')}
      </h4>

      <div className="mt-2 space-y-1.5">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t('writingToolbar.bookmarksTitlePlaceholder')}
          className="w-full px-2 py-1.5 text-xs bg-bg-tertiary border border-border-subtle rounded focus:border-accent outline-none placeholder:text-text-tertiary"
        />
        <select
          value={chapterFilename}
          onChange={(e) => setChapterFilename(e.target.value)}
          className="w-full px-2 py-1.5 text-xs bg-bg-tertiary border border-border-subtle rounded focus:border-accent outline-none"
        >
          <option value="">{t('writingToolbar.bookmarksNoChapter')}</option>
          {chapters.map((c) => (
            <option key={c.path} value={c.filename}>
              {c.title}
            </option>
          ))}
        </select>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={t('writingToolbar.bookmarksNotePlaceholder')}
          className="w-full px-2 py-1.5 text-xs bg-bg-tertiary border border-border-subtle rounded focus:border-accent outline-none placeholder:text-text-tertiary resize-none min-h-[44px]"
        />
        <button
          onClick={() => void handleAdd()}
          disabled={!title.trim()}
          className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 text-[11px] text-text-primary bg-accent-muted rounded hover:bg-accent transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Plus size={12} />
          {t('writingToolbar.bookmarksAdd')}
        </button>
      </div>

      <div className="mt-3 flex-1 min-h-0 overflow-y-auto space-y-1.5">
        {bookmarks.length === 0 ? (
          <p className="text-[11px] text-text-tertiary">{t('writingToolbar.bookmarksEmpty')}</p>
        ) : (
          bookmarks.map((bm) => {
            const resolvedChapterTitle = chapterTitle(bm.chapterFilename);
            const canNavigate = Boolean(bm.chapterFilename && resolvedChapterTitle);
            return (
              <div
                key={bm.id}
                className={`group border border-border-subtle rounded p-2 transition-colors duration-150 ${
                  canNavigate ? 'hover:border-accent-muted cursor-pointer' : ''
                }`}
                onClick={() => {
                  if (canNavigate) void handleNavigate(bm.chapterFilename);
                }}
              >
                <div className="flex items-start justify-between gap-1">
                  <p className="text-[11px] font-medium text-text-primary leading-snug break-words">
                    {bm.title}
                  </p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      void handleRemove(bm.id);
                    }}
                    title={t('writingToolbar.bookmarksDelete')}
                    className="text-text-tertiary hover:text-error transition-colors duration-150 shrink-0 mt-0.5"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
                {resolvedChapterTitle && (
                  <p className="text-[10px] text-accent truncate mt-0.5">
                    {resolvedChapterTitle}
                  </p>
                )}
                {bm.note && (
                  <p className="text-[11px] text-text-secondary line-clamp-2 break-words mt-0.5">
                    {bm.note}
                  </p>
                )}
                {bm.createdAt && (
                  <p className="text-[9px] text-text-tertiary mt-1">
                    {bm.createdAt}
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default BookmarksPanel;
