import { describe, it, expect, beforeEach } from 'vitest';
import { useLayoutStore } from './layoutStore';

describe('layoutStore', () => {
  beforeEach(() => {
    useLayoutStore.setState({
      activeTab: 'capitulo',
      sizes: { sidebar: 15, editor: 65, terminal: 35, versions: 22 },
      isVersionsCollapsed: false,
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
});
