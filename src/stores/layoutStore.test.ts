import { describe, it, expect, beforeEach } from 'vitest';
import { useLayoutStore } from './layoutStore';

describe('layoutStore', () => {
  beforeEach(() => {
    useLayoutStore.setState({
      activeTab: 'capitulo',
      sizes: { sidebar: 15, editor: 65, terminal: 35, versions: 22 },
      isVersionsCollapsed: false,
      editorViewMode: 'edit',
    });
  });

  it('cambia el tab activo', () => {
    useLayoutStore.getState().setActiveTab('libro');
    expect(useLayoutStore.getState().activeTab).toBe('libro');
  });

  it('alterna la visibilidad del panel de versiones', () => {
    useLayoutStore.getState().toggleVersionsPanel();
    expect(useLayoutStore.getState().isVersionsCollapsed).toBe(true);

    useLayoutStore.getState().toggleVersionsPanel();
    expect(useLayoutStore.getState().isVersionsCollapsed).toBe(false);
  });

  it('actualiza tamaños parcialmente sin sobreescribir otros campos', () => {
    useLayoutStore.getState().setSizes({ sidebar: 20 });

    const { sizes } = useLayoutStore.getState();
    expect(sizes.sidebar).toBe(20);
    expect(sizes.editor).toBe(65);
    expect(sizes.terminal).toBe(35);
    expect(sizes.versions).toBe(22);
  });

  it('el modo por defecto del editor es "edit"', () => {
    expect(useLayoutStore.getState().editorViewMode).toBe('edit');
  });

  it('setEditorViewMode establece el modo directamente', () => {
    useLayoutStore.getState().setEditorViewMode('preview');
    expect(useLayoutStore.getState().editorViewMode).toBe('preview');
  });

  it('toggleEditorViewMode alterna de edit a preview', () => {
    useLayoutStore.getState().toggleEditorViewMode();
    expect(useLayoutStore.getState().editorViewMode).toBe('preview');
  });

  it('toggleEditorViewMode alterna de preview a edit', () => {
    useLayoutStore.setState({ editorViewMode: 'preview' });
    useLayoutStore.getState().toggleEditorViewMode();
    expect(useLayoutStore.getState().editorViewMode).toBe('edit');
  });
});
