import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { getVersion } from '@tauri-apps/api/app';

interface AboutDialogProps {
  onClose: () => void;
}

function AboutDialog({ onClose }: AboutDialogProps) {
  const [version, setVersion] = useState('');

  useEffect(() => {
    getVersion().then(setVersion).catch(() => {});
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      data-testid="about-backdrop"
      className="fixed inset-0 flex items-center justify-center z-50 bg-black/60"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-bg-tertiary border border-border-default rounded-lg p-6 w-full max-w-sm mx-4">
        <div className="flex items-start justify-between mb-4">
          <h2 className="text-base font-semibold text-text-primary">Areyto</h2>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="flex items-center justify-center w-6 h-6 rounded text-text-tertiary hover:text-text-primary transition-colors duration-150"
          >
            <X size={14} />
          </button>
        </div>

        <p className="text-sm text-text-secondary mb-4">
          Un IDE para escritores serios.
        </p>

        <div className="text-xs text-text-tertiary space-y-1">
          <p>Jíbaro en la Luna LLC</p>
          {version && <p>Versión {version}</p>}
        </div>
      </div>
    </div>
  );
}

export default AboutDialog;
