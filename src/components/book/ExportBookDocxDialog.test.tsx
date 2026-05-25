import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ExportBookDocxDialog from './ExportBookDocxDialog';

describe('ExportBookDocxDialog', () => {
  it('muestra los 3 radio buttons', () => {
    render(<ExportBookDocxDialog onClose={vi.fn()} onExport={vi.fn()} loading={false} />);
    const radios = screen.getAllByRole('radio');
    expect(radios).toHaveLength(3);
    expect(screen.getByText(/Ambos/)).toBeInTheDocument();
    expect(screen.getByText(/Solo terminados/)).toBeInTheDocument();
    expect(screen.getByText(/Solo en progreso/)).toBeInTheDocument();
  });

  it('default seleccionado es "ambos"', () => {
    render(<ExportBookDocxDialog onClose={vi.fn()} onExport={vi.fn()} loading={false} />);
    const radios = screen.getAllByRole('radio') as HTMLInputElement[];
    const amboRadio = radios.find((r) => r.value === 'ambos');
    expect(amboRadio?.checked).toBe(true);
  });

  it('click Exportar llama onExport con scope "ambos" por defecto', () => {
    const onExport = vi.fn();
    render(<ExportBookDocxDialog onClose={vi.fn()} onExport={onExport} loading={false} />);
    fireEvent.click(screen.getByRole('button', { name: 'Exportar' }));
    expect(onExport).toHaveBeenCalledWith('ambos');
  });

  it('click Exportar llama onExport con scope seleccionado', () => {
    const onExport = vi.fn();
    render(<ExportBookDocxDialog onClose={vi.fn()} onExport={onExport} loading={false} />);

    const terminadosRadio = screen.getAllByRole('radio').find(
      (r) => (r as HTMLInputElement).value === 'terminados'
    ) as HTMLInputElement;
    fireEvent.click(terminadosRadio);

    fireEvent.click(screen.getByRole('button', { name: 'Exportar' }));
    expect(onExport).toHaveBeenCalledWith('terminados');
  });

  it('click Cancelar llama onClose', () => {
    const onClose = vi.fn();
    render(<ExportBookDocxDialog onClose={onClose} onExport={vi.fn()} loading={false} />);
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('loading=true muestra "Exportando…" y deshabilita ambos botones', () => {
    render(<ExportBookDocxDialog onClose={vi.fn()} onExport={vi.fn()} loading={true} />);
    expect(screen.getByRole('button', { name: 'Exportando…' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled();
  });
});
