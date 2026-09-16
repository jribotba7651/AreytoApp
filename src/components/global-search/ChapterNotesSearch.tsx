import { useState, useEffect, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, FileText } from 'lucide-react';
import { useLayoutStore } from '@/stores/layoutStore';
import { useProjectStore } from '@/stores/projectStore';
import { listChapters, listNotes, readNote, readChapter, updateProjectMeta } from '@/lib/project-fs';
import type { Chapter } from '@/types/project';

interface NoteContent {
  chapter: Chapter;
  lines: string[];
}

interface SearchResult {
  chapter: Chapter;
  lineNumber: number;
  text: string;
  matchStart: number;
  matchEnd: number;
}

const MAX_RESULTS = 200;

function ChapterNotesSearch() {
  const { t } = useTranslation();
  const setShowChapterNotesSearch = useLayoutStore((s) => s.setShowChapterNotesSearch);
  const currentProject = useProjectStore((s) => s.currentProject);

  const [query, setQuery] = useState('');
  const [contents, setContents] = useState<NoteContent[]>([]);
  const [loading, setLoading] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!currentProject) return;
    setLoading(true);
    setContents([]);

    async function load() {
      const chaptersResult = await listChapters(currentProject!);
      const notesResult = await listNotes(currentProject!);
      
      if (!chaptersResult.ok || !notesResult.ok) {
        setLoading(false);
        return;
      }

      const loaded: NoteContent[] = [];
      for (const notePath of notesResult.value) {
        const noteFilename = notePath.split('/').pop()!;
        const chapterFilename = noteFilename.replace(/\.md$/, '');
        const chapter = chaptersResult.value.find(c => c.filename === chapterFilename);
        
        if (chapter) {
          const read = await readNote(notePath);
          if (read.ok) {
            loaded.push({ chapter, lines: read.value.split('\n') });
          }
        }
      }
      setContents(loaded);
      setLoading(false);
    }

    void load();
  }, [currentProject]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const found: SearchResult[] = [];
    for (const content of contents) {
      for (let i = 0; i < content.lines.length; i++) {
        const line = content.lines[i];
        if (line === undefined) continue;
        const trimmed = line.trim();
        const idx = trimmed.toLowerCase().indexOf(q);
        if (idx === -1) continue;
        found.push({
          chapter: content.chapter,
          lineNumber: i + 1,
          text: trimmed,
          matchStart: idx,
          matchEnd: idx + q.length,
        });
        if (found.length >= MAX_RESULTS) return found;
      }
    }
    return found;
  }, [query, contents]);

  function close() {
    setShowChapterNotesSearch(false);
  }

  async function openChapter(ch: Chapter) {
    if (!currentProject) return;
    const read = await readChapter(ch.path);
    if (!read.ok) return;
    useProjectStore.getState().setActiveChapter(ch.path, read.value);
    await updateProjectMeta(currentProject, { capituloActivo: ch.filename });
    useLayoutStore.getState().setActiveTab('capitulo');
    close();
  }

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setShowChapterNotesSearch]);

  function renderResult(result: SearchResult, lastChapter: string) {
    const showHeader = lastChapter !== result.chapter.path;
    return (
      <div key={`${result.chapter.path}:${result.lineNumber}`}>
        {showHeader && (
          <button
            onClick={() => void openChapter(result.chapter)}
            className="w-full flex items-center gap-1.5 px-3 pt-2 pb-1 text-left text-[11px] font-medium text-text-secondary hover:text-text-primary"
          >
            <FileText size={12} className="shrink-0" />
            <span className="truncate">{result.chapter.title}</span>
          </button>
        )}
        <button
          onClick={() => void openChapter(result.chapter)}
          className="w-full flex items-start gap-3 px-3 py-1.5 text-left text-sm hover:bg-bg-tertiary transition-colors duration-100"
        >
          <span className="text-[11px] text-text-tertiary shrink-0 font-mono pt-px select-none">
            {result.lineNumber}
          </span>
          <span className="text-text-primary break-all">
            {result.text.slice(0, result.matchStart)}
            <mark className="bg-accent-muted/60 text-inherit rounded-sm px-0">
              {result.text.slice(result.matchStart, result.matchEnd)}
            </mark>
            {result.text.slice(result.matchEnd)}
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh]">
      <div className="fixed inset-0 bg-black/40" onClick={close} />
      <div
        className="relative w-full max-w-xl rounded-lg border border-border-default bg-bg-primary shadow-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 px-3 py-2 border-b border-border-subtle">
          <Search size={16} className="text-text-tertiary shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('chapterNotesSearch.placeholder')}
            className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-tertiary outline-none"
          />
          <kbd className="text-[10px] text-text-tertiary bg-bg-tertiary border border-border-subtle rounded px-1.5 py-0.5 font-mono">
            ESC
          </kbd>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {loading && (
            <p className="px-3 py-6 text-sm text-text-tertiary text-center">
              {t('common.loading')}
            </p>
          )}

          {!loading && !query.trim() && (
            <p className="px-3 py-6 text-sm text-text-tertiary text-center">
              {t('chapterNotesSearch.hint')}
            </p>
          )}

          {!loading && query.trim() && results.length === 0 && (
            <p className="px-3 py-6 text-sm text-text-tertiary text-center">
              {t('chapterNotesSearch.noResults')}
            </p>
          )}

          {!loading && results.length > 0 && (
            <div className="pb-2">
              <div className="px-3 pt-2 pb-1 text-[10px] font-medium uppercase tracking-wider text-text-tertiary">
                {t('chapterNotesSearch.resultCount', { count: results.length })}
              </div>
              {results.map((result, idx) => {
                const prev = results[idx - 1];
                const lastChapter = prev ? prev.chapter.path : '';
                return renderResult(result, lastChapter);
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ChapterNotesSearch;
