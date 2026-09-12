import { useEffect, useState } from 'react';
import { open, message } from '@tauri-apps/plugin-dialog';
import { convertFileSrc } from '@tauri-apps/api/core';
import { invoke } from '@tauri-apps/api/core';
import { useTranslation } from 'react-i18next';
import { useProjectStore } from '@/stores/projectStore';
import { detectCoverImage } from '@/lib/export-service';
import { Upload } from 'lucide-react';

function BookCoverSection() {
  const { t } = useTranslation();
  const currentProject = useProjectStore((s) => s.currentProject);
  const [coverPath, setCoverPath] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!currentProject) {
      setCoverPath(null);
      return;
    }
    detectCoverImage(currentProject.rootPath).then(setCoverPath);
  }, [currentProject?.rootPath]);

  async function refresh() {
    if (!currentProject) return;
    const path = await detectCoverImage(currentProject.rootPath);
    setCoverPath(path);
  }

  async function handleSelectCover() {
    if (!currentProject) return;
    setLoading(true);
    try {
      const selected = await open({
        multiple: false,
        filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg'] }],
      });
      if (typeof selected !== 'string') {
        setLoading(false);
        return;
      }
      const dest = `${currentProject.rootPath}/portada.jpg`;
      await invoke('copy_file', { from: selected, to: dest });
      await refresh();
      await message(t('book.cover.copySuccess'), { kind: 'info' });
    } catch (err) {
      await message(`${t('book.cover.copyError')}: ${String(err)}`, { kind: 'error' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="px-4 py-3 space-y-2 border-t border-border-subtle">
      <h3 className="text-xs font-medium text-text-secondary">
        {t('book.cover.title')}
      </h3>

      {coverPath ? (
        <div className="flex items-start gap-3">
          <img
            src={convertFileSrc(coverPath)}
            alt="Portada"
            className="w-16 h-auto rounded border border-border-default object-cover"
          />
          <div className="flex flex-col gap-1">
            <span className="text-xs text-text-secondary">{t('book.cover.detected')}</span>
            <button
              onClick={() => void handleSelectCover()}
              disabled={loading}
              className="text-xs text-accent hover:text-accent-hover transition-colors duration-150 text-left"
            >
              {loading ? '...' : t('book.cover.selectImage')}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          <p className="text-xs text-text-tertiary">{t('book.cover.nocoverHint')}</p>
          <button
            onClick={() => void handleSelectCover()}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-bg-tertiary border border-border-default rounded hover:border-border-strong transition-colors duration-150 text-text-primary w-fit"
          >
            <Upload size={14} />
            {loading ? '...' : t('book.cover.selectImage')}
          </button>
        </div>
      )}
    </div>
  );
}

export default BookCoverSection;
