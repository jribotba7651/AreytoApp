import { useTranslation } from 'react-i18next';
import { useProjectStore } from '@/stores/projectStore';
import { DEFAULT_BOOK_SETTINGS, type BookSettings as BookSettingsType } from '@/types/project';

function BookSettings() {
  const { t } = useTranslation();
  const currentProject = useProjectStore((s) => s.currentProject);
  const updateProjectMeta = useProjectStore((s) => s.updateProjectMeta);

  const settings = currentProject?.bookSettings ?? DEFAULT_BOOK_SETTINGS;

  function update(key: keyof BookSettingsType, value: number) {
    if (isNaN(value) || value <= 0) return;
    void updateProjectMeta({
      bookSettings: { ...settings, [key]: value },
    });
  }

  const INPUT_CLASS =
    'mt-0.5 w-full px-2 py-1 text-xs bg-bg-tertiary border border-border-default rounded focus:border-accent outline-none';

  return (
    <div className="px-4 py-3 space-y-3 border-t border-border-subtle">
      <h3 className="text-xs font-medium text-text-secondary">
        {t('book.bookSettings.title')}
      </h3>

      <div>
        <span className="text-xs text-text-tertiary">{t('book.bookSettings.trimSize')}</span>
        <div className="grid grid-cols-2 gap-2 mt-1">
          <label className="block">
            <span className="text-xs text-text-secondary">{t('book.bookSettings.trimWidth')}</span>
            <input
              type="number"
              min={3}
              max={12}
              step={0.25}
              value={settings.trimWidth}
              onChange={(e) => update('trimWidth', Number(e.target.value))}
              className={INPUT_CLASS}
            />
          </label>
          <label className="block">
            <span className="text-xs text-text-secondary">{t('book.bookSettings.trimHeight')}</span>
            <input
              type="number"
              min={4}
              max={14}
              step={0.25}
              value={settings.trimHeight}
              onChange={(e) => update('trimHeight', Number(e.target.value))}
              className={INPUT_CLASS}
            />
          </label>
        </div>
      </div>

      <div>
        <span className="text-xs text-text-tertiary">{t('book.bookSettings.margins')}</span>
        <div className="grid grid-cols-2 gap-2 mt-1">
          <label className="block">
            <span className="text-xs text-text-secondary">{t('book.bookSettings.marginTop')}</span>
            <input
              type="number"
              min={0.25}
              max={3}
              step={0.125}
              value={settings.marginTop}
              onChange={(e) => update('marginTop', Number(e.target.value))}
              className={INPUT_CLASS}
            />
          </label>
          <label className="block">
            <span className="text-xs text-text-secondary">{t('book.bookSettings.marginBottom')}</span>
            <input
              type="number"
              min={0.25}
              max={3}
              step={0.125}
              value={settings.marginBottom}
              onChange={(e) => update('marginBottom', Number(e.target.value))}
              className={INPUT_CLASS}
            />
          </label>
          <label className="block">
            <span className="text-xs text-text-secondary">{t('book.bookSettings.marginInner')}</span>
            <input
              type="number"
              min={0.25}
              max={3}
              step={0.125}
              value={settings.marginInner}
              onChange={(e) => update('marginInner', Number(e.target.value))}
              className={INPUT_CLASS}
            />
          </label>
          <label className="block">
            <span className="text-xs text-text-secondary">{t('book.bookSettings.marginOuter')}</span>
            <input
              type="number"
              min={0.25}
              max={3}
              step={0.125}
              value={settings.marginOuter}
              onChange={(e) => update('marginOuter', Number(e.target.value))}
              className={INPUT_CLASS}
            />
          </label>
        </div>
      </div>
    </div>
  );
}

export default BookSettings;
