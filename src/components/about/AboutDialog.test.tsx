import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('@tauri-apps/api/app', () => ({
  getVersion: vi.fn().mockResolvedValue('0.1.0'),
}));

import { getVersion } from '@tauri-apps/api/app';
import AboutDialog from './AboutDialog';

const mockGetVersion = vi.mocked(getVersion);

beforeEach(() => {
  vi.clearAllMocks();
  mockGetVersion.mockResolvedValue('0.1.0');
});

describe('AboutDialog - contenido', () => {
  it('renderiza el nombre Areyto', () => {
    render(<AboutDialog onClose={() => {}} />);
    expect(screen.getByText('Areyto')).toBeDefined();
  });

  it('renderiza la atribución Jíbaro en la Luna LLC', () => {
    render(<AboutDialog onClose={() => {}} />);
    expect(screen.getByText('Jíbaro en la Luna LLC')).toBeDefined();
  });

  it('renderiza la línea descriptiva', () => {
    render(<AboutDialog onClose={() => {}} />);
    expect(screen.getByText('Un IDE para escritores serios.')).toBeDefined();
  });

  it('muestra la versión obtenida desde getVersion()', async () => {
    render(<AboutDialog onClose={() => {}} />);
    const versionEl = await screen.findByText('Versión 0.1.0');
    expect(versionEl).toBeDefined();
  });

  it('no muestra versión mientras getVersion no ha resuelto', () => {
    mockGetVersion.mockReturnValue(new Promise(() => {}));
    render(<AboutDialog onClose={() => {}} />);
    expect(screen.queryByText(/Versión/)).toBeNull();
  });
});

describe('AboutDialog - cierre', () => {
  it('llama onClose al hacer click en el botón X', () => {
    const onClose = vi.fn();
    render(<AboutDialog onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar' }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('llama onClose al presionar Escape', () => {
    const onClose = vi.fn();
    render(<AboutDialog onClose={onClose} />);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('no llama onClose al presionar otra tecla', () => {
    const onClose = vi.fn();
    render(<AboutDialog onClose={onClose} />);
    fireEvent.keyDown(window, { key: 'Enter' });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('llama onClose al hacer click en el backdrop', () => {
    const onClose = vi.fn();
    render(<AboutDialog onClose={onClose} />);
    const backdrop = screen.getByTestId('about-backdrop');
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('NO llama onClose al hacer click dentro del panel', () => {
    const onClose = vi.fn();
    render(<AboutDialog onClose={onClose} />);
    fireEvent.click(screen.getByText('Areyto'));
    expect(onClose).not.toHaveBeenCalled();
  });
});
