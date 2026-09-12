import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useProjectStore } from '@/stores/projectStore';
import { listChapters, readChapter } from '@/lib/project-fs';
import type { Chapter } from '@/types/project';

interface ChapterStat {
  filename: string;
  title: string;
  wordCount: number;
}

interface DailyCount {
  label: string;
  count: number;
}

const WORDS_PER_PAGE = 250;

function countWords(text: string): number {
  const stripped = text.replace(/^#+\s.*/gm, '').replace(/[*_~`>#\-\[\]()!]/g, '');
  const words = stripped.match(/\S+/g);
  return words ? words.length : 0;
}

function extractTitle(content: string, filename: string): string {
  const match = /^#\s+(.+)$/m.exec(content);
  return match?.[1]?.trim() ?? filename.replace(/\.md$/, '');
}

function StatsTabContent() {
  const { t } = useTranslation();
  const currentProject = useProjectStore((s) => s.currentProject);
  const [chapterStats, setChapterStats] = useState<ChapterStat[]>([]);
  const [dailyCounts, setDailyCounts] = useState<DailyCount[]>([]);
  const [projectStartDate, setProjectStartDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentProject) return;

    async function loadStats() {
      setLoading(true);

      const chaptersResult = await listChapters(currentProject!);
      if (!chaptersResult.ok) {
        setLoading(false);
        return;
      }

      const allChapters: Chapter[] = chaptersResult.value;
      const stats: ChapterStat[] = [];

      for (const ch of allChapters) {
        const result = await readChapter(ch.path);
        if (result.ok) {
          stats.push({
            filename: ch.filename,
            title: extractTitle(result.value, ch.filename),
            wordCount: countWords(result.value),
          });
        }
      }

      setChapterStats(stats);
      setLoading(false);
    }

    loadStats();
  }, [currentProject]);

  useEffect(() => {
    if (!currentProject) return;

    async function loadGitStats() {
      try {
        const { invoke } = await import('@tauri-apps/api/core');

        // Daily file changes from git (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const sinceDate = sevenDaysAgo.toISOString().slice(0, 10);

        const gitLines = await invoke<string[]>('git_daily_file_changes', {
          repoPath: currentProject!.rootPath,
          since: sinceDate,
        }).catch(() => [] as string[]);

        const dayMap = new Map<string, number>();
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          dayMap.set(d.toISOString().slice(0, 10), 0);
        }

        let currentDate = '';
        for (const line of gitLines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          if (trimmed.match(/^\d{4}-\d{2}-\d{2}T/)) {
            currentDate = trimmed.slice(0, 10);
          } else if (trimmed.endsWith('.md') && currentDate && dayMap.has(currentDate)) {
            dayMap.set(currentDate, (dayMap.get(currentDate) ?? 0) + 1);
          }
        }

        const days: DailyCount[] = [];
        for (const [date, count] of dayMap) {
          const d = new Date(date + 'T12:00:00');
          const label = d.toLocaleDateString(undefined, { weekday: 'short' });
          days.push({ label, count });
        }
        setDailyCounts(days);

        // Project start date (first commit)
        const firstCommitDate = await invoke<string>('git_first_commit_date', {
          repoPath: currentProject!.rootPath,
        }).catch(() => '');

        if (firstCommitDate?.trim()) {
          const dateStr = firstCommitDate.trim().slice(0, 10);
          setProjectStartDate(dateStr);
        }
      } catch {
        // Git stats are best-effort
      }
    }

    loadGitStats();
  }, [currentProject]);

  if (!currentProject) {
    return (
      <div className="h-full flex items-center justify-center bg-bg-primary">
        <p className="font-serif text-text-tertiary">{t('common.noProjectOpen')}</p>
      </div>
    );
  }

  const totalWords = chapterStats.reduce((sum, c) => sum + c.wordCount, 0);
  const estimatedPages = Math.ceil(totalWords / WORDS_PER_PAGE);
  const longest = chapterStats.length > 0
    ? chapterStats.reduce((a, b) => (a.wordCount >= b.wordCount ? a : b))
    : null;
  const shortest = chapterStats.length > 0
    ? chapterStats.reduce((a, b) => (a.wordCount <= b.wordCount ? a : b))
    : null;

  const maxDaily = Math.max(...dailyCounts.map((d) => d.count), 1);

  return (
    <div className="h-full overflow-y-auto bg-bg-primary">
      <div className="max-w-2xl mx-auto py-8 px-6 space-y-8">
        <h2 className="text-lg font-medium text-text-primary">{t('stats.title')}</h2>

        {loading ? (
          <p className="text-sm text-text-tertiary">{t('common.loading')}</p>
        ) : (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-bg-secondary rounded border border-border-subtle">
                <p className="text-[11px] text-text-tertiary uppercase tracking-wide">{t('stats.totalWords')}</p>
                <p className="text-2xl font-medium text-text-primary mt-1">{totalWords.toLocaleString()}</p>
              </div>
              <div className="p-4 bg-bg-secondary rounded border border-border-subtle">
                <p className="text-[11px] text-text-tertiary uppercase tracking-wide">{t('stats.estimatedPages')}</p>
                <p className="text-2xl font-medium text-text-primary mt-1">{estimatedPages}</p>
              </div>
              <div className="p-4 bg-bg-secondary rounded border border-border-subtle">
                <p className="text-[11px] text-text-tertiary uppercase tracking-wide">{t('stats.longestChapter')}</p>
                {longest ? (
                  <>
                    <p className="text-sm font-medium text-text-primary mt-1 truncate">{longest.title}</p>
                    <p className="text-xs text-text-secondary">{longest.wordCount.toLocaleString()} {t('stats.words')}</p>
                  </>
                ) : (
                  <p className="text-sm text-text-tertiary mt-1">-</p>
                )}
              </div>
              <div className="p-4 bg-bg-secondary rounded border border-border-subtle">
                <p className="text-[11px] text-text-tertiary uppercase tracking-wide">{t('stats.shortestChapter')}</p>
                {shortest ? (
                  <>
                    <p className="text-sm font-medium text-text-primary mt-1 truncate">{shortest.title}</p>
                    <p className="text-xs text-text-secondary">{shortest.wordCount.toLocaleString()} {t('stats.words')}</p>
                  </>
                ) : (
                  <p className="text-sm text-text-tertiary mt-1">-</p>
                )}
              </div>
            </div>

            {/* Daily activity chart */}
            {dailyCounts.length > 0 && (
              <div className="p-4 bg-bg-secondary rounded border border-border-subtle">
                <p className="text-[11px] text-text-tertiary uppercase tracking-wide mb-4">{t('stats.last7Days')}</p>
                <div className="flex items-end gap-2 h-24">
                  {dailyCounts.map((day, i) => {
                    const height = maxDaily > 0 ? (day.count / maxDaily) * 100 : 0;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <span className="text-[10px] text-text-secondary">{day.count > 0 ? day.count : ''}</span>
                        <div className="w-full flex items-end" style={{ height: '64px' }}>
                          <div
                            className="w-full bg-accent-muted rounded-t transition-all duration-300"
                            style={{ height: `${Math.max(height, day.count > 0 ? 4 : 0)}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-text-tertiary">{day.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Project start date */}
            {projectStartDate && (
              <div className="p-4 bg-bg-secondary rounded border border-border-subtle">
                <p className="text-[11px] text-text-tertiary uppercase tracking-wide">{t('stats.projectStarted')}</p>
                <p className="text-sm font-medium text-text-primary mt-1">
                  {new Date(projectStartDate + 'T12:00:00').toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            )}

            {/* Chapter breakdown */}
            {chapterStats.length > 0 && (
              <div className="p-4 bg-bg-secondary rounded border border-border-subtle">
                <p className="text-[11px] text-text-tertiary uppercase tracking-wide mb-3">{t('stats.chapterBreakdown')}</p>
                <div className="space-y-2">
                  {chapterStats.map((ch) => {
                    const pct = totalWords > 0 ? (ch.wordCount / totalWords) * 100 : 0;
                    return (
                      <div key={ch.filename}>
                        <div className="flex items-center justify-between text-xs mb-0.5">
                          <span className="text-text-primary truncate max-w-[60%]">{ch.title}</span>
                          <span className="text-text-secondary">{ch.wordCount.toLocaleString()}</span>
                        </div>
                        <div className="h-1.5 bg-bg-tertiary rounded overflow-hidden">
                          <div
                            className="h-full bg-accent-muted rounded transition-all duration-300"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default StatsTabContent;
