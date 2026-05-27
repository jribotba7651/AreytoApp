import { useSettingsStore } from '@/stores/settingsStore';

function SettingsTabContent() {
  const autoCommit = useSettingsStore((s) => s.autoCommit);
  const setAutoCommit = useSettingsStore((s) => s.setAutoCommit);

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

        <p className="text-xs text-text-tertiary">Más ajustes próximamente.</p>
      </div>
    </div>
  );
}

export default SettingsTabContent;
