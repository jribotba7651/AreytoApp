import { create } from 'zustand';
import type { Chapter, ClosedChapter, Project } from '@/types/project';
import type { Commit } from '@/types/git';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface ProjectState {
  currentProject: Project | null;
  activeChapterPath: string | null;
  activeChapterContent: string;
  saveStatus: SaveStatus;
  chapters: Chapter[];
  commits: Commit[];
  closedChapters: ClosedChapter[];
  editorVersion: number;
  flushAutosave: (() => Promise<void>) | null;
  syncAutosaveSaved: ((content: string) => void) | null;
  setCurrentProject: (project: Project | null) => void;
  closeProject: () => void;
  setActiveChapter: (path: string, content: string) => void;
  updateContent: (content: string) => void;
  setSaveStatus: (status: SaveStatus) => void;
  setChapters: (chapters: Chapter[]) => void;
  addChapter: (chapter: Chapter) => void;
  setCommits: (commits: Commit[]) => void;
  prependCommit: (commit: Commit) => void;
  setClosedChapters: (chapters: ClosedChapter[]) => void;
  clearActiveChapter: () => void;
  incrementEditorVersion: () => void;
  setFlushAutosave: (fn: (() => Promise<void>) | null) => void;
  setSyncAutosaveSaved: (fn: ((content: string) => void) | null) => void;
}

export const useProjectStore = create<ProjectState>((set) => ({
  currentProject: null,
  activeChapterPath: null,
  activeChapterContent: '',
  saveStatus: 'idle',
  chapters: [],
  commits: [],
  closedChapters: [],
  editorVersion: 0,
  flushAutosave: null,
  syncAutosaveSaved: null,

  setCurrentProject: (project: Project | null) => set({ currentProject: project }),

  closeProject: () =>
    set({
      currentProject: null,
      activeChapterPath: null,
      activeChapterContent: '',
      saveStatus: 'idle',
      chapters: [],
      commits: [],
      closedChapters: [],
      editorVersion: 0,
    }),

  setActiveChapter: (path: string, content: string) =>
    set({ activeChapterPath: path, activeChapterContent: content, saveStatus: 'idle', commits: [] }),

  updateContent: (content: string) => set({ activeChapterContent: content }),

  setSaveStatus: (status: SaveStatus) => set({ saveStatus: status }),

  setChapters: (chapters: Chapter[]) =>
    set({ chapters: [...chapters].sort((a, b) => a.filename.localeCompare(b.filename)) }),

  addChapter: (chapter: Chapter) =>
    set((state) => ({
      chapters: [...state.chapters, chapter].sort((a, b) =>
        a.filename.localeCompare(b.filename)
      ),
    })),

  setCommits: (commits: Commit[]) => set({ commits }),

  prependCommit: (commit: Commit) =>
    set((state) => ({ commits: [commit, ...state.commits] })),

  setClosedChapters: (chapters: ClosedChapter[]) => set({ closedChapters: chapters }),

  clearActiveChapter: () =>
    set({ activeChapterPath: null, activeChapterContent: '', saveStatus: 'idle', commits: [] }),

  incrementEditorVersion: () =>
    set((state) => ({ editorVersion: state.editorVersion + 1 })),

  setFlushAutosave: (fn: (() => Promise<void>) | null) => set({ flushAutosave: fn }),

  setSyncAutosaveSaved: (fn: ((content: string) => void) | null) =>
    set({ syncAutosaveSaved: fn }),
}));
