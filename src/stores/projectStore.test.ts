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
  useProjectStore.setState({ currentProject: null });
});

describe('projectStore', () => {
  it('inicializa con currentProject null', () => {
    expect(useProjectStore.getState().currentProject).toBeNull();
  });

  it('setea el proyecto activo', () => {
    useProjectStore.getState().setCurrentProject(PROYECTO);
    expect(useProjectStore.getState().currentProject).toEqual(PROYECTO);
  });

  it('cierra el proyecto y vuelve a null', () => {
    useProjectStore.getState().setCurrentProject(PROYECTO);
    useProjectStore.getState().closeProject();
    expect(useProjectStore.getState().currentProject).toBeNull();
  });
});
