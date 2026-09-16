import { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useProjectStore } from '@/stores/projectStore';
import { readTimeline, writeTimeline, createTimelineEventId, type TimelineEvent } from '@/lib/timeline';

function TimelinePanel() {
  const { t } = useTranslation();
  const currentProject = useProjectStore((s) => s.currentProject);
  const chapters = useProjectStore((s) => s.chapters);
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [title, setTitle] = useState('');
  const [chapterFilename, setChapterFilename] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (!currentProject) {
      setEvents([]);
      return;
    }
    let cancelled = false;
    readTimeline(currentProject.rootPath).then((evs) => {
      if (!cancelled) setEvents(evs);
    });
    return () => {
      cancelled = true;
    };
  }, [currentProject]);

  if (!currentProject) {
    return (
      <div className="p-3">
        <h4 className="text-xs font-medium text-text-secondary uppercase tracking-wide">
          {t('writingToolbar.timeline')}
        </h4>
        <p className="text-[11px] text-text-tertiary mt-2">{t('common.noProjectOpen')}</p>
      </div>
    );
  }

  async function handleAdd() {
    const trimmed = title.trim();
    if (!trimmed) return;
    const event: TimelineEvent = {
      id: createTimelineEventId(),
      title: trimmed,
      chapterFilename: chapterFilename || null,
      description: description.trim(),
    };
    const next = [...events, event];
    setEvents(next);
    setTitle('');
    setChapterFilename('');
    setDescription('');
    await writeTimeline(currentProject!.rootPath, next);
  }

  async function handleRemove(id: string) {
    const next = events.filter((e) => e.id !== id);
    setEvents(next);
    await writeTimeline(currentProject!.rootPath, next);
  }

  function chapterTitle(filename: string | null): string | null {
    if (!filename) return null;
    const chapter = chapters.find((c) => c.filename === filename);
    return chapter ? chapter.title : null;
  }

  return (
    <div className="p-3 flex flex-col h-full">
      <h4 className="text-xs font-medium text-text-secondary uppercase tracking-wide">
        {t('writingToolbar.timeline')}
      </h4>

      <div className="mt-2 space-y-1.5">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t('writingToolbar.timelineTitlePlaceholder')}
          className="w-full px-2 py-1.5 text-xs bg-bg-tertiary border border-border-subtle rounded focus:border-accent outline-none placeholder:text-text-tertiary"
        />
        <select
          value={chapterFilename}
          onChange={(e) => setChapterFilename(e.target.value)}
          className="w-full px-2 py-1.5 text-xs bg-bg-tertiary border border-border-subtle rounded focus:border-accent outline-none"
        >
          <option value="">{t('writingToolbar.timelineNoChapter')}</option>
          {chapters.map((c) => (
            <option key={c.path} value={c.filename}>
              {c.title}
            </option>
          ))}
        </select>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t('writingToolbar.timelineDescriptionPlaceholder')}
          className="w-full px-2 py-1.5 text-xs bg-bg-tertiary border border-border-subtle rounded focus:border-accent outline-none placeholder:text-text-tertiary resize-none min-h-[44px]"
        />
        <button
          onClick={() => void handleAdd()}
          disabled={!title.trim()}
          className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 text-[11px] text-text-primary bg-accent-muted rounded hover:bg-accent transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Plus size={12} />
          {t('writingToolbar.timelineAdd')}
        </button>
      </div>

      <div className="mt-3 flex-1 min-h-0 overflow-y-auto">
        {events.length === 0 ? (
          <p className="text-[11px] text-text-tertiary">{t('writingToolbar.timelineEmpty')}</p>
        ) : (
          <div className="relative">
            {events.map((event, index) => (
              <div key={event.id} className="relative pl-4 pb-4 last:pb-0">
                {index < events.length - 1 && (
                  <span className="absolute left-[3px] top-3 bottom-0 w-px bg-border-default" />
                )}
                <span className="absolute left-0 top-1.5 w-[7px] h-[7px] rounded-full bg-accent" />
                <div className="group">
                  <div className="flex items-start justify-between gap-1">
                    <p className="text-[11px] font-medium text-text-primary leading-snug break-words">
                      {event.title}
                    </p>
                    <button
                      onClick={() => void handleRemove(event.id)}
                      title={t('writingToolbar.timelineDelete')}
                      className="text-text-tertiary hover:text-error transition-colors duration-150 shrink-0 mt-0.5"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                  {chapterTitle(event.chapterFilename) && (
                    <p className="text-[10px] text-accent truncate mt-0.5">
                      {chapterTitle(event.chapterFilename)}
                    </p>
                  )}
                  {event.description && (
                    <p className="text-[11px] text-text-secondary line-clamp-2 break-words mt-0.5">
                      {event.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default TimelinePanel;
