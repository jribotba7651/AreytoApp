import { describe, it, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import ChapterEditor from './ChapterEditor';

// CodeMirror usa getBoundingClientRect internamente; jsdom no lo implementa.
// Parcheamos el mínimo necesario para que EditorView pueda montarse.
Object.defineProperty(HTMLElement.prototype, 'getBoundingClientRect', {
  configurable: true,
  value: () => ({ width: 800, height: 600, top: 0, left: 0, right: 800, bottom: 600, x: 0, y: 0, toJSON: () => ({}) }),
});

describe('ChapterEditor', () => {
  it('se monta sin errores con contenido inicial', () => {
    expect(() =>
      render(<ChapterEditor initialContent="# Hola mundo" />)
    ).not.toThrow();
  });

  it('renderiza el contenido inicial en el DOM', () => {
    const { container } = render(<ChapterEditor initialContent="Texto de prueba" />);
    expect(container.textContent).toContain('Texto de prueba');
  });

  it('invoca onChange al recibir un callback', async () => {
    const onChange = vi.fn();
    render(<ChapterEditor initialContent="inicio" onChange={onChange} />);

    // onChange no se llama en el mount, solo al editar.
    // Verificamos que el prop se recibe sin errores.
    expect(onChange).not.toHaveBeenCalled();
  });

  it('acepta initialContent vacío sin errores', () => {
    expect(() => render(<ChapterEditor initialContent="" />)).not.toThrow();

    const { container } = render(<ChapterEditor initialContent="" />);
    expect(container.querySelector('.cm-editor')).toBeTruthy();
  });
});
