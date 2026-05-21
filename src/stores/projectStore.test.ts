import { describe, it, expect, beforeEach } from 'vitest';
import { useProjectStore } from './projectStore';
import type { Project } from '@/types/project';

const PROYECTO: Project = {
  rootPath: '/tmp/mi-libro',
  nombre: 'Mi Libro',
  creado: '2026-05-21T00:00:00.000Z',
  capituloActivo: null,
};

beforeEach(() => {
  useProjectStore.setState({
    currentProject: null,
    activeChapterPath: null,
    activeChapterContent: '',
    saveStatus: 'idle',
  });
});

describe('projectStore', () => {
  it('inicializa con currentProject null', () => {
    expect(useProjectStore.getState().currentProject).toBeNull();
  });

  it('setea el proyecto activo', () => {
    useProjectStore.getState().setCurrentProject(PROYECTO);
    expect(useProjectStore.getState().currentProject).toEqual(PROYECTO);
  });

  it('cierra el proyecto y resetea todo a estado inicial', () => {
    useProjectStore.getState().setCurrentProject(PROYECTO);
    useProjectStore.getState().setActiveChapter('/tmp/cap-01.md', '# Hola');
    useProjectStore.getState().closeProject();

    const state = useProjectStore.getState();
    expect(state.currentProject).toBeNull();
    expect(state.activeChapterPath).toBeNull();
    expect(state.activeChapterContent).toBe('');
    expect(state.saveStatus).toBe('idle');
  });

  it('setea el capítulo activo con path y contenido', () => {
    useProjectStore.getState().setActiveChapter('/tmp/cap-01.md', '# Capítulo 1');
    const state = useProjectStore.getState();
    expect(state.activeChapterPath).toBe('/tmp/cap-01.md');
    expect(state.activeChapterContent).toBe('# Capítulo 1');
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
});
