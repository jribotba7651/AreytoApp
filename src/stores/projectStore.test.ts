import { describe, it, expect, beforeEach } from 'vitest';
import { useProjectStore } from './projectStore';
import type { Chapter, Project } from '@/types/project';

const PROYECTO: Project = {
  rootPath: '/tmp/mi-libro',
  nombre: 'Mi Libro',
  creado: '2026-05-21T00:00:00.000Z',
  capituloActivo: null,
};

const makeChapter = (filename: string): Chapter => ({
  filename,
  path: `/tmp/mi-libro/capitulos/${filename}`,
  title: filename.replace('.md', ''),
  status: 'in-progress',
});

beforeEach(() => {
  useProjectStore.setState({
    currentProject: null,
    activeChapterPath: null,
    activeChapterContent: '',
    activeView: null,
    saveStatus: 'idle',
    chapters: [],
  });
});

describe('projectStore', () => {
  it('inicializa con currentProject null y chapters vacío', () => {
    const state = useProjectStore.getState();
    expect(state.currentProject).toBeNull();
    expect(state.chapters).toEqual([]);
  });

  it('setea el proyecto activo', () => {
    useProjectStore.getState().setCurrentProject(PROYECTO);
    expect(useProjectStore.getState().currentProject).toEqual(PROYECTO);
  });

  it('cierra el proyecto y resetea todo a estado inicial', () => {
    useProjectStore.getState().setCurrentProject(PROYECTO);
    useProjectStore.getState().setActiveChapter('/tmp/cap-01.md', '# Hola');
    useProjectStore.getState().setChapters([makeChapter('cap-01.md')]);
    useProjectStore.getState().closeProject();

    const state = useProjectStore.getState();
    expect(state.currentProject).toBeNull();
    expect(state.activeChapterPath).toBeNull();
    expect(state.activeChapterContent).toBe('');
    expect(state.saveStatus).toBe('idle');
    expect(state.chapters).toEqual([]);
  });

  it('setea el capítulo activo con path y contenido y activa la vista chapter', () => {
    useProjectStore.getState().setActiveChapter('/tmp/cap-01.md', '# Capítulo 1');
    const state = useProjectStore.getState();
    expect(state.activeChapterPath).toBe('/tmp/cap-01.md');
    expect(state.activeChapterContent).toBe('# Capítulo 1');
    expect(state.activeView).toBe('chapter');
  });

  it('setActiveView cambia la vista activa', () => {
    useProjectStore.getState().setActiveView('frontmatter-titulo');
    expect(useProjectStore.getState().activeView).toBe('frontmatter-titulo');
    useProjectStore.getState().setActiveView('frontmatter-copyright');
    expect(useProjectStore.getState().activeView).toBe('frontmatter-copyright');
  });

  it('closeProject resetea activeView a null', () => {
    useProjectStore.getState().setActiveView('frontmatter-titulo');
    useProjectStore.getState().closeProject();
    expect(useProjectStore.getState().activeView).toBeNull();
  });

  it('actualiza solo el contenido sin tocar el path', () => {
    useProjectStore.getState().setActiveChapter('/tmp/cap-01.md', 'inicio');
    useProjectStore.getState().updateContent('nuevo contenido');
    const state = useProjectStore.getState();
    expect(state.activeChapterPath).toBe('/tmp/cap-01.md');
    expect(state.activeChapterContent).toBe('nuevo contenido');
  });

  it('actualiza el saveStatus', () => {
    useProjectStore.getState().setSaveStatus('saving');
    expect(useProjectStore.getState().saveStatus).toBe('saving');
  });

  it('setChapters guarda los capítulos ordenados por filename', () => {
    const caps = [makeChapter('cap-03.md'), makeChapter('cap-01.md'), makeChapter('cap-02.md')];
    useProjectStore.getState().setChapters(caps);
    const { chapters } = useProjectStore.getState();
    expect(chapters[0]?.filename).toBe('cap-01.md');
    expect(chapters[1]?.filename).toBe('cap-02.md');
    expect(chapters[2]?.filename).toBe('cap-03.md');
  });

  it('addChapter agrega y mantiene orden por filename', () => {
    useProjectStore.getState().setChapters([makeChapter('cap-01.md'), makeChapter('cap-03.md')]);
    useProjectStore.getState().addChapter(makeChapter('cap-02.md'));
    const { chapters } = useProjectStore.getState();
    expect(chapters).toHaveLength(3);
    expect(chapters[1]?.filename).toBe('cap-02.md');
  });
});
