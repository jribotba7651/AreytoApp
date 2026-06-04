import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useProjectStore } from '@/stores/projectStore';
import { readCopyright, writeCopyright } from '@/lib/frontmatter-fs';
import type { CopyrightData } from '@/types/frontmatter';

function TextField({
  label,
  value,
  onChange,
  placeholder,
  multiline,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
}) {
  const baseClass =
    'bg-bg-tertiary border border-border-subtle rounded px-2 py-1.5 text-sm font-serif text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-accent';
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs text-text-tertiary font-sans uppercase tracking-wider">{label}</span>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className={`${baseClass} resize-none`}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={baseClass}
        />
      )}
    </label>
  );
}

function FrontmatterCopyrightEditor() {
  const { t } = useTranslation();
  const currentProject = useProjectStore((s) => s.currentProject);
  const [data, setData] = useState<CopyrightData>({
    ano: null,
    titular: '',
    licencia: 'Todos los derechos reservados',
  });
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef<string>('');
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    if (!currentProject) return;
    readCopyright(currentProject.rootPath).then((loaded) => {
      if (loaded) {
        setData(loaded);
        lastSavedRef.current = JSON.stringify(loaded);
      }
    });
  }, [currentProject]);

  function scheduleWrite(next: CopyrightData) {
    if (timerRef.current !== null) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      if (!currentProject) return;
      const serialized = JSON.stringify(next);
      if (serialized === lastSavedRef.current) return;
      setSaveStatus('saving');
      await writeCopyright(currentProject.rootPath, next);
      lastSavedRef.current = serialized;
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 1500);
    }, 500);
  }

  function handleStringField(field: 'titular' | 'licencia' | 'notas', value: string) {
    const next = { ...data, [field]: value };
    setData(next);
    scheduleWrite(next);
  }

  function handleAno(value: string) {
    const parsed = parseInt(value, 10);
    const ano = value === '' || isNaN(parsed) ? null : parsed;
    const next = { ...data, ano };
    setData(next);
    scheduleWrite(next);
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-xl mx-auto flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-sans font-medium text-text-secondary uppercase tracking-wider">
            {t('frontmatter.copyright.sectionTitle')}
          </h2>
          {saveStatus === 'saving' && (
            <span className="text-xs text-text-tertiary">{t('common.saving')}</span>
          )}
          {saveStatus === 'saved' && (
            <span className="text-xs text-accent">{t('common.saved')}</span>
          )}
        </div>

        <label className="flex flex-col gap-1">
          <span className="text-xs text-text-tertiary font-sans uppercase tracking-wider">{t('frontmatter.copyright.ano.label')}</span>
          <select
            value={data.ano ?? ''}
            onChange={(e) => handleAno(e.target.value)}
            className="bg-bg-tertiary border border-border-default rounded px-2 py-1.5 text-sm font-serif text-text-primary focus:outline-none focus:ring-1 focus:ring-accent w-28"
          >
            <option value="" />
            {Array.from({ length: 51 }, (_, i) => currentYear - i).map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </label>

        <TextField
          label={t('frontmatter.copyright.titular.label')}
          value={data.titular}
          onChange={(v) => handleStringField('titular', v)}
          placeholder={t('frontmatter.copyright.titular.placeholder')}
        />
        <TextField
          label={t('frontmatter.copyright.licencia.label')}
          value={data.licencia}
          onChange={(v) => handleStringField('licencia', v)}
          placeholder={t('frontmatter.copyright.licencia.placeholder')}
        />
        <TextField
          label={t('frontmatter.copyright.notas.label')}
          value={data.notas ?? ''}
          onChange={(v) => handleStringField('notas', v)}
          placeholder={t('frontmatter.copyright.notas.placeholder')}
          multiline
        />
      </div>
    </div>
  );
}

export default FrontmatterCopyrightEditor;
