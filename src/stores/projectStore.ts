import { create } from 'zustand';
import type { Chapter, Project } from '@/types/project';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface ProjectState {
  currentProject: Project | null;
  activeChapterPath: string | null;
  activeChapterContent: string;
  saveStatus: SaveStatus;
  chapters: Chapter[];
  setCurrentProject: (project: Project | null) => void;
  closeProject: () => void;
  setActiveChapter: (path: string, content: string) => void;
  updateContent: (content: string) => void;
  setSaveStatus: (status: SaveStatus) => void;
  setChapters: (chapters: Chapter[]) => void;
  addChapter: (chapter: Chapter) => void;
}

export const useProjectStore = create<ProjectState>((set) => ({
  currentProject: null,
  activeChapterPath: null,
  activeChapterContent: '',
  saveStatus: 'idle',
  chapters: [],

  setCurrentProject: (project: Project | null) => set({ currentProject: project }),

  closeProject: () =>
    set({
      currentProject: null,
      activeChapterPath: null,
      activeChapterContent: '',
      saveStatus: 'idle',
      chapters: [],
    }),

  setActiveChapter: (path: string, content: string) =>
    set({ activeChapterPath: path, activeChapterContent: content, saveStatus: 'idle' }),

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
}));
