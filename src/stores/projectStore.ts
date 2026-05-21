import { create } from 'zustand';
import type { Project } from '@/types/project';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface ProjectState {
  currentProject: Project | null;
  activeChapterPath: string | null;
  activeChapterContent: string;
  saveStatus: SaveStatus;
  setCurrentProject: (project: Project | null) => void;
  closeProject: () => void;
  setActiveChapter: (path: string, content: string) => void;
  updateContent: (content: string) => void;
  setSaveStatus: (status: SaveStatus) => void;
}

export const useProjectStore = create<ProjectState>((set) => ({
  currentProject: null,
  activeChapterPath: null,
  activeChapterContent: '',
  saveStatus: 'idle',

  setCurrentProject: (project: Project | null) => set({ currentProject: project }),

  closeProject: () =>
    set({
      currentProject: null,
      activeChapterPath: null,
      activeChapterContent: '',
      saveStatus: 'idle',
    }),

  setActiveChapter: (path: string, content: string) =>
    set({ activeChapterPath: path, activeChapterContent: content, saveStatus: 'idle' }),

  updateContent: (content: string) => set({ activeChapterContent: content }),

  setSaveStatus: (status: SaveStatus) => set({ saveStatus: status }),
}));
