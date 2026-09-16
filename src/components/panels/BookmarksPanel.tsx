import { useState } from 'react';
import { Trash2, Bookmark as BookmarkIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useProjectStore } from '@/stores/projectStore';
import { createBookmark } from '@/lib/bookmarks';
import type { Bookmark } from '@/types/project';

function BookmarksPanel() {
  const { t } = useTranslation();
  const currentProject = useProjectStore((s) => s.currentProject);
  const updateProjectMeta = useProjectStore((s) => s.updateProjectMeta);

  const bookmarks: Bookmark[] = currentProject?.bookmarks ?? [];
  const [newName, setNewName] = useState('');

  function handleAdd() {
    if (!currentProject) return;
    const bookmark = createBookmark(bookmarks, 0);
    if (newName.trim()) bookmark.name = newName.trim();
    updateProjectMeta({ bookmarks: [...bookmarks, bookmark] });
    setNewName('');
  }

  function handleDelete(idx: number) {
    if (!currentProject) return;
    updateProjectMeta({ bookmarks: bookmarks.filter((_, i) => i !== idx) });
  }

  if (!currentProject) {
    return (
      <div className="p-4 text-text-tertiary text-xs text-center">
        {t('common.noProjectOpen')}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-border-subtle">
        <p className="text-xs font-medium text-text-secondary mb-2 uppercase tracking-wide">
          {t('writingToolbar.bookmarks', 'Marcadores')}
        </p>
        <div className="flex gap-1.5">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder={t('writingToolbar.bookmarksTitlePlaceholder', 'Nombre...')}
            className="flex-1 text-xs px-2 py-1 rounded border border-border-subtle bg-bg-editor text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent"
            onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
          />
          <button
            onClick={handleAdd}
            className="px-2 py-1 text-xs rounded bg-accent-muted hover:bg-accent text-text-primary transition-colors"
          >
            +
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {bookmarks.length === 0 ? (
          <div className="p-4 text-center">
            <BookmarkIcon size={24} className="mx-auto text-text-tertiary mb-2" />
            <p className="text-xs text-text-tertiary">
              {t('writingToolbar.bookmarksEmpty', 'Sin marcadores.')}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border-subtle">
            {bookmarks.map((bm, idx) => (
              <li key={idx} className="flex items-center gap-2 px-3 py-2 hover:bg-bg-secondary group">
                <BookmarkIcon size={12} className="text-accent shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-text-primary truncate">{bm.name}</p>
                  <p className="text-[10px] text-text-tertiary">
                    {new Date(bm.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(idx)}
                  className="opacity-0 group-hover:opacity-100 text-text-tertiary hover:text-error transition-opacity"
                >
                  <Trash2 size={12} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default BookmarksPanel;
