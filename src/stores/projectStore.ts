import { create } from 'zustand';
import type { Chapter, ClosedChapter, Project } from '@/types/project';
import type { Commit } from '@/types/git';
import { updateProjectMeta as updateMeta } from '@/lib/project-fs';
import { useCharacterStore } from '@/stores/characterStore';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';
export type ActiveView =
  | 'chapter'
  | 'frontmatter-titulo'
  | 'frontmatter-copyright'
  | 'frontmatter-dedicatoria'
  | 'frontmatter-metadata'
  | 'backmatter-agradecimientos'
  | 'backmatter-sobre-el-autor'
  | 'backmatter-otros-libros'
  | null;

interface ProjectState {
  currentProject: Project | null;
  activeChapterPath: string | null;
  activeChapterContent: string;
  activeView: ActiveView;
  saveStatus: SaveStatus;
  chapters: Chapter[];
  commits: Commit[];
  closedChapters: ClosedChapter[];
  lastSavedContent: string;
  externalChangePending: { path: string; diskContent: string } | null;
  editorVersion: number;
  sectionVersion: number;
  flushAutosave: (() => Promise<void>) | null;
  syncAutosaveSaved: ((content: string) => void) | null;
  insertTextAtCursor: ((text: string) => void) | null;
  triggerOpenProject: (() => void) | null;
  triggerNewProject: (() => void) | null;
  pendingMenuAction: 'open' | 'new' | null;
  setCurrentProject: (project: Project | null) => void;
  closeProject: () => void;
  setActiveChapter: (path: string, content: string) => void;
  setActiveView: (view: ActiveView) => void;
  updateContent: (content: string) => void;
  setSaveStatus: (status: SaveStatus) => void;
  setChapters: (chapters: Chapter[]) => void;
  addChapter: (chapter: Chapter) => void;
  setCommits: (commits: Commit[]) => void;
  prependCommit: (commit: Commit) => void;
  setClosedChapters: (chapters: ClosedChapter[]) => void;
  clearActiveChapter: () => void;
  incrementEditorVersion: () => void;
  incrementSectionVersion: () => void;
  setFlushAutosave: (fn: (() => Promise<void>) | null) => void;
  setSyncAutosaveSaved: (fn: ((content: string) => void) | null) => void;
  setInsertTextAtCursor: (fn: ((text: string) => void) | null) => void;
  setLastSavedContent: (content: string) => void;
  setExternalChangePending: (pending: { path: string; diskContent: string } | null) => void;
  setTriggerOpenProject: (fn: (() => void) | null) => void;
  setTriggerNewProject: (fn: (() => void) | null) => void;
  setPendingMenuAction: (action: 'open' | 'new' | null) => void;
  updateProjectMeta: (updates: Partial<Pick<Project, 'capituloActivo' | 'tema' | 'temaOverrides' | 'bookSettings' | 'excludedFromExport' | 'chapterColors'>>) => Promise<void>;
}

export const useProjectStore = create<ProjectState>((set) => ({
  currentProject: null,
  activeChapterPath: null,
  activeChapterContent: '',
  activeView: null,
  saveStatus: 'idle',
  chapters: [],
  commits: [],
  closedChapters: [],
  lastSavedContent: '',
  externalChangePending: null,
  editorVersion: 0,
  sectionVersion: 0,
  flushAutosave: null,
  syncAutosaveSaved: null,
  insertTextAtCursor: null,
  triggerOpenProject: null,
  triggerNewProject: null,
  pendingMenuAction: null,

  setCurrentProject: (project: Project | null) => set({ currentProject: project }),

  closeProject: () => {
    useCharacterStore.getState().reset();
    set({
      currentProject: null,
      activeChapterPath: null,
      activeChapterContent: '',
      activeView: null,
      saveStatus: 'idle',
      chapters: [],
      commits: [],
      closedChapters: [],
      lastSavedContent: '',
      externalChangePending: null,
      editorVersion: 0,
      sectionVersion: 0,
      insertTextAtCursor: null,
    });
  },
  setActiveChapter: (path: string, content: string) =>
    set({ activeChapterPath: path, activeChapterContent: content, lastSavedContent: content, externalChangePending: null, activeView: 'chapter', saveStatus: 'idle', commits: [] }),

  setActiveView: (view: ActiveView) => set({ activeView: view }),

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

  incrementSectionVersion: () =>
    set((state) => ({ sectionVersion: state.sectionVersion + 1 })),

  setFlushAutosave: (fn: (() => Promise<void>) | null) => set({ flushAutosave: fn }),

  setSyncAutosaveSaved: (fn: ((content: string) => void) | null) =>
    set({ syncAutosaveSaved: fn }),

  setInsertTextAtCursor: (fn: ((text: string) => void) | null) =>
    set({ insertTextAtCursor: fn }),

  setLastSavedContent: (content: string) => set({ lastSavedContent: content }),

  setExternalChangePending: (pending: { path: string; diskContent: string } | null) =>
    set({ externalChangePending: pending }),

  setTriggerOpenProject: (fn: (() => void) | null) => set({ triggerOpenProject: fn }),

  setTriggerNewProject: (fn: (() => void) | null) => set({ triggerNewProject: fn }),

  setPendingMenuAction: (action: 'open' | 'new' | null) => set({ pendingMenuAction: action }),

  updateProjectMeta: async (updates) => {
    const { currentProject } = useProjectStore.getState();
    if (!currentProject) return;
    const result = await updateMeta(currentProject, updates);
    if (result.ok) {
      set({ currentProject: result.value });
    }
  },
}));
