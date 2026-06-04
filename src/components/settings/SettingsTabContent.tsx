import { open } from '@tauri-apps/plugin-dialog';
import { useTranslation } from 'react-i18next';
import { useSettingsStore, type ThemeMode, type EditorFontFamily, type BookFontFamily } from '@/stores/settingsStore';

const THEME_OPTIONS: { value: ThemeMode; label: string }[] = [
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Oscuro' },
  { value: 'auto', label: 'Auto (sistema)' },
];

const EDITOR_FONT_FAMILY_OPTIONS: { value: EditorFontFamily; label: string }[] = [
  { value: 'serif', label: 'Serif (Iowan / Georgia)' },
  { value: 'inter', label: 'Inter' },
  { value: 'sans', label: 'Sans-serif del sistema' },
  { value: 'mono', label: 'Monoespaciada' },
];

const EDITOR_FONT_SIZE_OPTIONS: { value: number; label: string }[] = [
  { value: 14, label: '14 px' },
  { value: 16, label: '16 px' },
  { value: 18, label: '18 px' },
  { value: 20, label: '20 px' },
];

const BOOK_FONT_FAMILY_OPTIONS: { value: BookFontFamily; label: string }[] = [
  { value: 'serif', label: 'Serif (Iowan / Georgia)' },
  { value: 'inter', label: 'Inter' },
  { value: 'sans', label: 'Sans-serif del sistema' },
  { value: 'mono', label: 'Monoespaciada' },
];

const BOOK_FONT_SIZE_OPTIONS: { value: number; label: string }[] = [
  { value: 16, label: '16 px' },
  { value: 18, label: '18 px' },
  { value: 20, label: '20 px' },
  { value: 22, label: '22 px' },
];

const UI_LOCALE_OPTIONS: { value: string; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español' },
];

const LANGUAGE_OPTIONS: { value: string; label: string }[] = [
  { value: 'es', label: 'Español (es)' },
  { value: 'en', label: 'Inglés (en)' },
  { value: 'pt', label: 'Portugués (pt)' },
  { value: 'fr', label: 'Francés (fr)' },
  { value: 'de', label: 'Alemán (de)' },
  { value: 'it', label: 'Italiano (it)' },
  { value: 'ca', label: 'Catalán (ca)' },
  { value: 'gl', label: 'Gallego (gl)' },
  { value: 'eu', label: 'Euskera (eu)' },
  { value: 'zh', label: 'Chino (zh)' },
  { value: 'ja', label: 'Japonés (ja)' },
  { value: 'ar', label: 'Árabe (ar)' },
];

const AUTOSAVE_PRESETS: { ms: number; label: string }[] = [
  { ms: 2000, label: '2 s' },
  { ms: 5000, label: '5 s' },
  { ms: 15000, label: '15 s' },
  { ms: 30000, label: '30 s' },
];

const PRESET_VALUES = AUTOSAVE_PRESETS.map((p) => p.ms);

function SettingsTabContent() {
  const { t } = useTranslation();
  const autoCommit = useSettingsStore((s) => s.autoCommit);
  const setAutoCommit = useSettingsStore((s) => s.setAutoCommit);
  const autosaveIntervalMs = useSettingsStore((s) => s.autosaveIntervalMs);
  const setAutosaveIntervalMs = useSettingsStore((s) => s.setAutosaveIntervalMs);
  const themeMode = useSettingsStore((s) => s.themeMode);
  const setThemeMode = useSettingsStore((s) => s.setThemeMode);
  const editorFontFamily = useSettingsStore((s) => s.editorFontFamily);
  const setEditorFontFamily = useSettingsStore((s) => s.setEditorFontFamily);
  const editorFontSize = useSettingsStore((s) => s.editorFontSize);
  const setEditorFontSize = useSettingsStore((s) => s.setEditorFontSize);
  const defaultProjectLanguage = useSettingsStore((s) => s.defaultProjectLanguage);
  const setDefaultProjectLanguage = useSettingsStore((s) => s.setDefaultProjectLanguage);
  const bookFontFamily = useSettingsStore((s) => s.bookFontFamily);
  const setBookFontFamily = useSettingsStore((s) => s.setBookFontFamily);
  const bookFontSize = useSettingsStore((s) => s.bookFontSize);
  const setBookFontSize = useSettingsStore((s) => s.setBookFontSize);
  const exportFolder = useSettingsStore((s) => s.exportFolder);
  const setExportFolder = useSettingsStore((s) => s.setExportFolder);
  const uiLocale = useSettingsStore((s) => s.uiLocale);
  const setUiLocale = useSettingsStore((s) => s.setUiLocale);

  const displayMs = PRESET_VALUES.includes(autosaveIntervalMs) ? autosaveIntervalMs : 2000;

  return (
    <div className="h-full overflow-y-auto bg-bg-primary">
      <div className="max-w-2xl mx-auto px-8 py-10">
        <h1 className="text-2xl font-semibold text-text-primary mb-8">Ajustes</h1>

        <section className="mb-10">
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4">
            Versionado
          </h2>

          <div className="bg-bg-secondary border border-border-subtle rounded-lg p-5">
            <label className="flex items-start justify-between gap-6 cursor-pointer">
              <div className="flex-1">
                <span className="block text-sm text-text-primary font-medium mb-1">
                  Commit automático en cada guardado
                </span>
                <span className="block text-xs text-text-tertiary leading-relaxed">
                  Cuando está activo, Areyto crea un commit de Git automáticamente cada vez
                  que se guarda un capítulo. Apaga esto si prefieres controlar los commits
                  manualmente.
                </span>
              </div>
              <button
                role="switch"
                aria-checked={autoCommit}
                onClick={() => void setAutoCommit(!autoCommit)}
                className={[
                  'relative inline-flex shrink-0 h-6 w-11 rounded-full border-2 border-transparent',
                  'transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent',
                  autoCommit ? 'bg-accent' : 'bg-bg-tertiary border border-border-default',
                ].join(' ')}
              >
                <span
                  className={[
                    'inline-block h-5 w-5 rounded-full bg-text-primary shadow transition-transform duration-150',
                    autoCommit ? 'translate-x-5' : 'translate-x-0',
                  ].join(' ')}
                />
              </button>
            </label>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4">
            Editor
          </h2>

          <div className="bg-bg-secondary border border-border-subtle rounded-lg p-5">
            <div className="flex items-start justify-between gap-6">
              <div className="flex-1">
                <span className="block text-sm text-text-primary font-medium mb-1">
                  Intervalo de guardado automático
                </span>
                <span className="block text-xs text-text-tertiary leading-relaxed">
                  Tiempo de espera tras el último cambio antes de guardar automáticamente.
                </span>
              </div>
              <select
                value={displayMs}
                onChange={(e) => void setAutosaveIntervalMs(Number(e.target.value))}
                className="shrink-0 bg-bg-tertiary border border-border-default text-text-primary text-sm rounded px-2 py-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                {AUTOSAVE_PRESETS.map((p) => (
                  <option key={p.ms} value={p.ms}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-bg-secondary border border-border-subtle rounded-lg p-5 mt-3">
            <div className="flex items-start justify-between gap-6 mb-4">
              <div className="flex-1">
                <span className="block text-sm text-text-primary font-medium mb-1">
                  Fuente del editor
                </span>
                <span className="block text-xs text-text-tertiary leading-relaxed">
                  Familia tipográfica del área de escritura.
                </span>
              </div>
              <select
                value={editorFontFamily}
                onChange={(e) => void setEditorFontFamily(e.target.value as EditorFontFamily)}
                className="shrink-0 bg-bg-tertiary border border-border-default text-text-primary text-sm rounded px-2 py-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                {EDITOR_FONT_FAMILY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-start justify-between gap-6 pt-4 border-t border-border-subtle">
              <div className="flex-1">
                <span className="block text-sm text-text-primary font-medium mb-1">
                  Tamaño de fuente
                </span>
                <span className="block text-xs text-text-tertiary leading-relaxed">
                  Tamaño del texto en el área de escritura.
                </span>
              </div>
              <select
                value={editorFontSize}
                onChange={(e) => void setEditorFontSize(Number(e.target.value))}
                className="shrink-0 bg-bg-tertiary border border-border-default text-text-primary text-sm rounded px-2 py-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                {EDITOR_FONT_SIZE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4">
            Apariencia
          </h2>

          <div className="bg-bg-secondary border border-border-subtle rounded-lg p-5">
            <div className="flex items-start justify-between gap-6">
              <div className="flex-1">
                <span className="block text-sm text-text-primary font-medium mb-1">
                  Tema de la interfaz
                </span>
                <span className="block text-xs text-text-tertiary leading-relaxed">
                  Claro u oscuro fijos, o auto para seguir la configuración del sistema.
                </span>
              </div>
              <select
                value={themeMode}
                onChange={(e) => void setThemeMode(e.target.value as ThemeMode)}
                className="shrink-0 bg-bg-tertiary border border-border-default text-text-primary text-sm rounded px-2 py-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                {THEME_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4">
            {t('settings.uiLocale.sectionTitle')}
          </h2>

          <div className="bg-bg-secondary border border-border-subtle rounded-lg p-5">
            <div className="flex items-start justify-between gap-6">
              <div className="flex-1">
                <span className="block text-sm text-text-primary font-medium mb-1">
                  {t('settings.uiLocale.label')}
                </span>
                <span className="block text-xs text-text-tertiary leading-relaxed">
                  {t('settings.uiLocale.description')}
                </span>
              </div>
              <select
                key={uiLocale}
                value={uiLocale}
                onChange={(e) => void setUiLocale(e.target.value)}
                className="shrink-0 bg-bg-tertiary border border-border-default text-text-primary text-sm rounded px-2 py-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                {UI_LOCALE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4">
            Proyectos
          </h2>

          <div className="bg-bg-secondary border border-border-subtle rounded-lg p-5">
            <div className="flex items-start justify-between gap-6">
              <div className="flex-1">
                <span className="block text-sm text-text-primary font-medium mb-1">
                  Idioma por defecto
                </span>
                <span className="block text-xs text-text-tertiary leading-relaxed">
                  Idioma que se asigna a nuevos proyectos en el campo idioma del archivo metadata.yaml.
                </span>
              </div>
              <select
                key={defaultProjectLanguage}
                value={defaultProjectLanguage}
                onChange={(e) => void setDefaultProjectLanguage(e.target.value)}
                className="shrink-0 bg-bg-tertiary border border-border-default text-text-primary text-sm rounded px-2 py-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                {LANGUAGE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4">
            Libro
          </h2>

          <div className="bg-bg-secondary border border-border-subtle rounded-lg p-5">
            <div className="flex items-start justify-between gap-6 mb-4">
              <div className="flex-1">
                <span className="block text-sm text-text-primary font-medium mb-1">
                  Fuente del lector
                </span>
                <span className="block text-xs text-text-tertiary leading-relaxed">
                  Familia tipográfica del tab Libro.
                </span>
              </div>
              <select
                value={bookFontFamily}
                onChange={(e) => void setBookFontFamily(e.target.value as BookFontFamily)}
                className="shrink-0 bg-bg-tertiary border border-border-default text-text-primary text-sm rounded px-2 py-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                {BOOK_FONT_FAMILY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-start justify-between gap-6 pt-4 border-t border-border-subtle">
              <div className="flex-1">
                <span className="block text-sm text-text-primary font-medium mb-1">
                  Tamaño de fuente
                </span>
                <span className="block text-xs text-text-tertiary leading-relaxed">
                  Tamaño del texto en el tab Libro.
                </span>
              </div>
              <select
                value={bookFontSize}
                onChange={(e) => void setBookFontSize(Number(e.target.value))}
                className="shrink-0 bg-bg-tertiary border border-border-default text-text-primary text-sm rounded px-2 py-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                {BOOK_FONT_SIZE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4">
            Export
          </h2>

          <div className="bg-bg-secondary border border-border-subtle rounded-lg p-5">
            <div className="flex items-start justify-between gap-6">
              <div className="flex-1">
                <span className="block text-sm text-text-primary font-medium mb-1">
                  Carpeta de destino
                </span>
                <span className="block text-xs text-text-tertiary leading-relaxed mb-2">
                  Carpeta donde se abre el Save As al exportar. Se actualiza automáticamente con la última carpeta usada.
                </span>
                <span className="block text-xs text-text-secondary font-mono truncate">
                  {exportFolder || 'Carpeta del proyecto (por defecto)'}
                </span>
              </div>
              <div className="flex flex-col gap-2 shrink-0">
                <button
                  onClick={() => void open({ directory: true, multiple: false }).then((dir) => { if (typeof dir === 'string') void setExportFolder(dir); })}
                  className="px-3 py-1 text-sm bg-bg-tertiary border border-border-default text-text-primary rounded hover:bg-bg-primary transition-colors duration-150"
                >
                  Examinar…
                </button>
                {exportFolder && (
                  <button
                    onClick={() => void setExportFolder('')}
                    className="px-3 py-1 text-sm text-text-tertiary hover:text-text-primary transition-colors duration-150 text-center"
                  >
                    Restablecer
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        <p className="text-xs text-text-tertiary">Más ajustes próximamente.</p>
      </div>
    </div>
  );
}

export default SettingsTabContent;
