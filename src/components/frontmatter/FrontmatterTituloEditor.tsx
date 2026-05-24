import { useEffect, useRef, useState } from 'react';
import { useProjectStore } from '@/stores/projectStore';
import { readTitulo, writeTitulo } from '@/lib/frontmatter-fs';
import type { TituloData } from '@/types/frontmatter';

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs text-text-tertiary font-sans uppercase tracking-wider">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="bg-bg-tertiary border border-border-subtle rounded px-2 py-1.5 text-sm font-serif text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-accent"
      />
    </label>
  );
}

function FrontmatterTituloEditor() {
  const currentProject = useProjectStore((s) => s.currentProject);
  const [data, setData] = useState<TituloData>({ titulo: '', autor: '' });
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef<string>('');

  useEffect(() => {
    if (!currentProject) return;
    readTitulo(currentProject.rootPath).then((loaded) => {
      if (loaded) {
        setData(loaded);
        lastSavedRef.current = JSON.stringify(loaded);
      }
    });
  }, [currentProject]);

  function handleChange(field: keyof TituloData, value: string) {
    const next = { ...data, [field]: value };
    setData(next);

    if (timerRef.current !== null) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(async () => {
      if (!currentProject) return;
      const serialized = JSON.stringify(next);
      if (serialized === lastSavedRef.current) return;
      setSaveStatus('saving');
      await writeTitulo(currentProject.rootPath, next);
      lastSavedRef.current = serialized;
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 1500);
    }, 500);
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-xl mx-auto flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-sans font-medium text-text-secondary uppercase tracking-wider">
            Título y autor
          </h2>
          {saveStatus === 'saving' && (
            <span className="text-xs text-text-tertiary">Guardando…</span>
          )}
          {saveStatus === 'saved' && (
            <span className="text-xs text-accent">Guardado</span>
          )}
        </div>

        <Field
          label="Título"
          value={data.titulo}
          onChange={(v) => handleChange('titulo', v)}
          placeholder="El título del libro"
        />
        <Field
          label="Subtítulo (opcional)"
          value={data.subtitulo ?? ''}
          onChange={(v) => handleChange('subtitulo', v)}
          placeholder="Un subtítulo descriptivo"
        />
        <Field
          label="Autor"
          value={data.autor}
          onChange={(v) => handleChange('autor', v)}
          placeholder="Nombre del autor"
        />
      </div>
    </div>
  );
}

export default FrontmatterTituloEditor;
