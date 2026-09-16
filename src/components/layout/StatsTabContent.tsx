import { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Info, CheckCircle2 } from 'lucide-react';
import { useProjectStore } from '@/stores/projectStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { listChapters, readChapter } from '@/lib/project-fs';
import { readTitulo, readMetadata } from '@/lib/frontmatter-fs';
import { computeWordFrequencies, type WordFrequency } from '@/lib/word-frequency';
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

type HealthIssue =
  | { kind: 'empty'; title: string }
  | { kind: 'short'; title: string; wordCount: number }
  | { kind: 'missingTitle' }
  | { kind: 'missingAuthor' }
  | { kind: 'missingDescription' }
  | { kind: 'missingGenre' };

const WORDS_PER_PAGE = 250;
const MIN_CHAPTER_WORDS = 100;
const WORDS_PER_MINUTE = 200;

function countWords(text: string): number {
  const stripped = text.replace(/^#+\s.*/gm, '').replace(/[*_~`>#\-\[\]()!]/g, '');
  const words = stripped.match(/\S+/g);
  return words ? words.length : 0;
}

function extractTitle(content: string, filename: string): string {
  const match = /^#\s+(.+)$/m.exec(content);
  return match?.[1]?.trim() ?? filename.replace(/\.md$/, '');
}

function computeStreaks(writingDays: string[]): { current: number; max: number } {
  if (writingDays.length === 0) return { current: 0, max: 0 };
  const sorted = [...new Set(writingDays)].sort();
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  let maxStreak = 1;
  let currentRun = 1;

  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1] + 'T12:00:00');
    const curr = new Date(sorted[i] + 'T12:00:00');
    const diffDays = Math.round((curr.getTime() - prev.getTime()) / 86400000);
    if (diffDays === 1) {
      currentRun++;
    } else {
      currentRun = 1;
    }
    if (currentRun > maxStreak) maxStreak = currentRun;
  }

  // Current streak: count backwards from today (or yesterday if today not yet recorded)
  const last = sorted[sorted.length - 1];
  if (last !== today && last !== yesterday) return { current: 0, max: maxStreak };

  let currentStreak = 1;
  for (let i = sorted.length - 2; i >= 0; i--) {
    const curr = new Date(sorted[i + 1] + 'T12:00:00');
    const prev = new Date(sorted[i] + 'T12:00:00');
    const diffDays = Math.round((curr.getTime() - prev.getTime()) / 86400000);
    if (diffDays === 1) {
      currentStreak++;
    } else {
      break;
    }
  }

  return { current: currentStreak, max: maxStreak };
}

function StatsTabContent() {
  const { t } = useTranslation();
  const currentProject = useProjectStore((s) => s.currentProject);
  const bookWordGoal = useSettingsStore((s) => s.bookWordGoal);
  const [chapterStats, setChapterStats] = useState<ChapterStat[]>([]);
  const [healthIssues, setHealthIssues] = useState<HealthIssue[]>([]);
  const [dailyCounts, setDailyCounts] = useState<DailyCount[]>([]);
  const [wordFrequencies, setWordFrequencies] = useState<WordFrequency[]>([]);
  const [projectStartDate, setProjectStartDate] = useState<string | null>(null);
  const writingDays = useSettingsStore((s) => s.writingDays);
  const readingGoalMinutes = useSettingsStore((s) => s.readingGoalMinutes);
  const readingSecondsByDay = useSettingsStore((s) => s.readingSecondsByDay);
  const exportHistory = useSettingsStore((s) => s.exportHistory);
  const [loading, setLoading] = useState(true);

  const streaks = useMemo(() => computeStreaks(writingDays), [writingDays]);

  const last30Days = useMemo(() => {
    const days: { date: string; active: boolean }[] = [];
    const daySet = new Set(writingDays);
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      days.push({ date: dateStr, active: daySet.has(dateStr) });
    }
    return days;
  }, [writingDays]);

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
      let combinedText = '';

      for (const ch of allChapters) {
        const result = await readChapter(ch.path);
        if (result.ok) {
          combinedText += `\n${result.value}`;
          stats.push({
            filename: ch.filename,
            title: extractTitle(result.value, ch.filename),
            wordCount: countWords(result.value),
          });
        }
      }

      setChapterStats(stats);
      setWordFrequencies(computeWordFrequencies(combinedText, 10));

      const [titulo, metadata] = await Promise.all([
        readTitulo(currentProject!.rootPath),
        readMetadata(currentProject!.rootPath),
      ]);

      const issues: HealthIssue[] = [];
      for (const st of stats) {
        if (st.wordCount === 0) {
          issues.push({ kind: 'empty', title: st.title });
        } else if (st.wordCount < MIN_CHAPTER_WORDS) {
          issues.push({ kind: 'short', title: st.title, wordCount: st.wordCount });
        }
      }
      if (!titulo?.titulo?.trim()) issues.push({ kind: 'missingTitle' });
      if (!titulo?.autor?.trim()) issues.push({ kind: 'missingAuthor' });
      if (!metadata?.descripcion?.trim()) issues.push({ kind: 'missingDescription' });
      if (!metadata?.genero?.trim()) issues.push({ kind: 'missingGenre' });

      setHealthIssues(issues);
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

  const todayKey = new Date().toISOString().slice(0, 10);
  const readingSecondsToday = readingSecondsByDay[todayKey] ?? 0;
  const readingMinutesToday = Math.floor(readingSecondsToday / 60);
  const wordsReadToday = Math.round((readingSecondsToday / 60) * WORDS_PER_MINUTE);

  function healthMessage(issue: HealthIssue): string {
    switch (issue.kind) {
      case 'empty':
        return t('stats.health.emptyChapter', { title: issue.title });
      case 'short':
        return t('stats.health.shortChapter', { title: issue.title, count: issue.wordCount });
      case 'missingTitle':
        return t('stats.health.missingTitle');
      case 'missingAuthor':
        return t('stats.health.missingAuthor');
      case 'missingDescription':
        return t('stats.health.missingDescription');
      case 'missingGenre':
        return t('stats.health.missingGenre');
    }
  }

  function healthMeta(kind: HealthIssue['kind']): { icon: React.ReactNode; colorClass: string } {
    switch (kind) {
      case 'empty':
        return { icon: <AlertTriangle size={14} />, colorClass: 'text-error' };
      case 'short':
        return { icon: <AlertTriangle size={14} />, colorClass: 'text-warning' };
      default:
        return { icon: <Info size={14} />, colorClass: 'text-info' };
    }
  }

  return (
    <div className="h-full overflow-y-auto bg-bg-primary">
      <div className="max-w-2xl mx-auto py-8 px-6 space-y-8">
        <h2 className="text-lg font-medium text-text-primary">{t('stats.title')}</h2>

        {loading ? (
          <p className="text-sm text-text-tertiary">{t('common.loading')}</p>
        ) : chapterStats.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-5">
            <svg
              width="80"
              height="80"
              viewBox="0 0 80 80"
              fill="none"
              className="text-border-default"
              aria-hidden="true"
            >
              {/* Bar chart */}
              <rect x="10" y="52" width="10" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.3" />
              <rect x="24" y="40" width="10" height="28" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.5" />
              <rect x="38" y="28" width="10" height="40" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.7" />
              <rect x="52" y="18" width="10" height="50" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
              {/* Baseline */}
              <line x1="6" y1="68" x2="66" y2="68" stroke="currentColor" strokeWidth="1" opacity="0.4" />
              {/* Question mark */}
              <text x="68" y="26" fontSize="18" className="fill-text-tertiary" fontWeight="300">?</text>
            </svg>

            <div className="flex flex-col items-center gap-2 max-w-sm">
              <p className="font-serif text-xl text-text-secondary text-center">
                {t('stats.emptyTitle')}
              </p>
              <p className="font-sans text-sm text-text-tertiary text-center leading-relaxed">
                {t('stats.emptyBody')}
              </p>
              <p className="font-sans text-xs text-text-tertiary text-center mt-1 opacity-70">
                {t('stats.emptyHint')}
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Health check */}
            {healthIssues.length > 0 ? (
              <div className="p-4 bg-bg-secondary rounded border border-border-subtle">
                <p className="text-[11px] text-text-tertiary uppercase tracking-wide mb-3">
                  {t('stats.health.title')}
                </p>
                <ul className="space-y-1.5">
                  {healthIssues.map((issue, idx) => {
                    const meta = healthMeta(issue.kind);
                    return (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <span className={`shrink-0 mt-px ${meta.colorClass}`}>{meta.icon}</span>
                        <span className="text-text-primary leading-snug">{healthMessage(issue)}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : (
              <div className="p-4 bg-bg-secondary rounded border border-border-subtle flex items-center gap-2">
                <CheckCircle2 size={14} className="text-success shrink-0" />
                <p className="text-sm text-text-secondary">{t('stats.health.allGood')}</p>
              </div>
            )}

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

            {/* Book progress toward goal */}
            {bookWordGoal > 0 && (
              <div className="p-4 bg-bg-secondary rounded border border-border-subtle">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[11px] text-text-tertiary uppercase tracking-wide">{t('stats.bookProgress')}</p>
                  <p className="text-xs text-text-secondary">
                    {totalWords.toLocaleString()} / {bookWordGoal.toLocaleString()} {t('stats.words')}
                  </p>
                </div>
                <div className="h-4 bg-bg-tertiary rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      totalWords >= bookWordGoal ? 'bg-success' : 'bg-accent-muted'
                    }`}
                    style={{ width: `${Math.min((totalWords / bookWordGoal) * 100, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-text-tertiary mt-2 text-right">
                  {Math.min(Math.round((totalWords / bookWordGoal) * 100), 100)}%
                </p>
              </div>
            )}

            {/* Writing streaks */}
            <div className="p-4 bg-bg-secondary rounded border border-border-subtle">
              <p className="text-[11px] text-text-tertiary uppercase tracking-wide mb-4">{t('stats.writingStreaks')}</p>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-2xl font-medium text-text-primary">{streaks.current}</p>
                  <p className="text-xs text-text-secondary">{t('stats.currentStreak')}</p>
                </div>
                <div>
                  <p className="text-2xl font-medium text-text-primary">{streaks.max}</p>
                  <p className="text-xs text-text-secondary">{t('stats.maxStreak')}</p>
                </div>
              </div>
              <p className="text-[10px] text-text-tertiary mb-2">{t('stats.last30Days')}</p>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(10, 1fr)',
                  gap: '4px',
                }}
              >
                {last30Days.map((day) => (
                  <div
                    key={day.date}
                    title={day.date}
                    style={{
                      width: '100%',
                      aspectRatio: '1',
                      borderRadius: '50%',
                    }}
                    className={day.active ? 'bg-accent-muted' : 'bg-bg-tertiary'}
                  />
                ))}
              </div>
              <p className="text-[10px] text-text-tertiary mt-2">{t('stats.streakHint')}</p>
            </div>

            {/* Daily reading progress */}
            {readingGoalMinutes > 0 && (
              <div className="p-4 bg-bg-secondary rounded border border-border-subtle">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[11px] text-text-tertiary uppercase tracking-wide">
                    {t('stats.reading.title')}
                  </p>
                  <p className="text-xs text-text-secondary">
                    {t('stats.reading.minutes', {
                      current: readingMinutesToday,
                      goal: readingGoalMinutes,
                    })}
                  </p>
                </div>
                <div className="h-4 bg-bg-tertiary rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      readingMinutesToday >= readingGoalMinutes ? 'bg-success' : 'bg-accent-muted'
                    }`}
                    style={{
                      width: `${Math.min((readingMinutesToday / readingGoalMinutes) * 100, 100)}%`,
                    }}
                  />
                </div>
                <p className="text-xs text-text-tertiary mt-2 text-right">
                  {t('stats.reading.wordsRead', { count: wordsReadToday.toLocaleString() })}
                </p>
              </div>
            )}

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

            {/* Word frequency */}
            {wordFrequencies.length > 0 && (
              <div className="p-4 bg-bg-secondary rounded border border-border-subtle">
                <p className="text-[11px] text-text-tertiary uppercase tracking-wide mb-3">{t('stats.wordFrequency')}</p>
                <div className="space-y-2">
                  {wordFrequencies.map((wf) => {
                    const maxCount = wordFrequencies[0]?.count ?? 1;
                    const pct = maxCount > 0 ? (wf.count / maxCount) * 100 : 0;
                    return (
                      <div key={wf.word}>
                        <div className="flex items-center justify-between text-xs mb-0.5">
                          <span className="text-text-primary">{wf.word}</span>
                          <span className="text-text-secondary">{wf.count.toLocaleString()}</span>
                        </div>
                        <div className="h-1.5 bg-bg-tertiary rounded overflow-hidden">
                          <div
                            className="h-full bg-accent rounded transition-all duration-300"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Export History */}
            {exportHistory.length > 0 && (
              <div className="p-4 bg-bg-secondary rounded border border-border-subtle">
                <p className="text-[11px] text-text-tertiary uppercase tracking-wide mb-3">{t('stats.exportHistory')}</p>
                <div className="space-y-2">
                  {exportHistory.map((entry, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <span className="text-text-primary truncate max-w-[50%]">{entry.filename}</span>
                      <div className="flex items-center gap-2 text-text-tertiary">
                        <span>{entry.format}</span>
                        <span>•</span>
                        <span>{new Date(entry.date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
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
