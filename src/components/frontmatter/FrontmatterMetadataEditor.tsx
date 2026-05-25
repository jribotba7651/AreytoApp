import { useEffect, useRef, useState } from 'react';
import { useProjectStore } from '@/stores/projectStore';
import { readMetadata, writeMetadata } from '@/lib/frontmatter-fs';
import { defaultMetadata } from '@/lib/yaml-frontmatter';
import type { MetadataData } from '@/types/frontmatter';

const IDIOMA_SUGGESTIONS = ['en', 'es', 'pt', 'fr', 'de', 'it'];

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

function IdiomaField({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs text-text-tertiary font-sans uppercase tracking-wider">Idioma</span>
      <input
        type="text"
        list="areyto-idioma-list"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="en"
        className="bg-bg-tertiary border border-border-subtle rounded px-2 py-1.5 text-sm font-serif text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-accent"
      />
      <datalist id="areyto-idioma-list">
        {IDIOMA_SUGGESTIONS.map((lang) => (
          <option key={lang} value={lang} />
        ))}
      </datalist>
    </label>
  );
}

function DescripcionField({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs text-text-tertiary font-sans uppercase tracking-wider">Descripción</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Sinopsis del libro"
        rows={4}
        className="bg-bg-tertiary border border-border-subtle rounded px-2 py-1.5 text-sm font-serif text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-accent resize-y"
      />
    </label>
  );
}

function FrontmatterMetadataEditor() {
  const currentProject = useProjectStore((s) => s.currentProject);
  const [data, setData] = useState<MetadataData>(defaultMetadata());
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef<string>('');

  useEffect(() => {
    if (!currentProject) return;
    readMetadata(currentProject.rootPath).then((loaded) => {
      if (loaded) {
        setData(loaded);
        lastSavedRef.current = JSON.stringify(loaded);
      }
    });
  }, [currentProject]);

  function handleChange(field: keyof MetadataData, value: string) {
    const next = { ...data, [field]: value };
    setData(next);

    if (timerRef.current !== null) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(async () => {
      if (!currentProject) return;
      const serialized = JSON.stringify(next);
      if (serialized === lastSavedRef.current) return;
      setSaveStatus('saving');
      await writeMetadata(currentProject.rootPath, next);
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
            Detalles del libro
          </h2>
          {saveStatus === 'saving' && (
            <span className="text-xs text-text-tertiary">Guardando…</span>
          )}
          {saveStatus === 'saved' && (
            <span className="text-xs text-accent">Guardado</span>
          )}
        </div>

        <IdiomaField value={data.idioma} onChange={(v) => handleChange('idioma', v)} />
        <DescripcionField value={data.descripcion} onChange={(v) => handleChange('descripcion', v)} />
        <Field
          label="Editorial"
          value={data.editorial}
          onChange={(v) => handleChange('editorial', v)}
          placeholder="Nombre de la editorial"
        />
        <Field
          label="ISBN"
          value={data.isbn}
          onChange={(v) => handleChange('isbn', v)}
          placeholder="978-0-000-00000-0"
        />
        <Field
          label="Género"
          value={data.genero}
          onChange={(v) => handleChange('genero', v)}
          placeholder="Novela, ensayo, poesía…"
        />
        <Field
          label="Fecha de publicación"
          value={data.fechaPublicacion}
          onChange={(v) => handleChange('fechaPublicacion', v)}
          placeholder="2025"
        />
      </div>
    </div>
  );
}

export default FrontmatterMetadataEditor;
