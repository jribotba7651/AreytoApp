import { create } from 'zustand';
import type { Project } from '@/types/project';

interface ProjectState {
  currentProject: Project | null;
  setCurrentProject: (project: Project | null) => void;
  closeProject: () => void;
}

export const useProjectStore = create<ProjectState>((set) => ({
  currentProject: null,
  setCurrentProject: (project: Project | null) => set({ currentProject: project }),
  closeProject: () => set({ currentProject: null }),
}));
