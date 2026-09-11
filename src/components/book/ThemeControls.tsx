import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Save } from 'lucide-react';
import { resolveTheme, type Theme, type DeepPartial } from '@/lib/theme';
import { useProjectStore } from '@/stores/projectStore';
import { useSettingsStore } from '@/stores/settingsStore';

const FONT_OPTIONS = [
  { value: '"Iowan Old Style", Charter, Georgia, serif', label: 'Iowan Old Style (Serif)' },
  { value: 'Charter, Georgia, serif', label: 'Charter (Serif)' },
  { value: 'Inter, system-ui, sans-serif', label: 'Inter (Sans)' },
  { value: 'system-ui, sans-serif', label: 'System Sans' },
  { value: '"JetBrains Mono", monospace', label: 'JetBrains Mono' },
];

interface ThemeControlsProps {
  themeId?: string | null;
  themeOverrides?: Record<string, unknown> | null;
}

function ThemeControls({ themeId, themeOverrides }: ThemeControlsProps) {
  const { t } = useTranslation();
  const updateProjectMeta = useProjectStore((s) => s.updateProjectMeta);
  const addCustomTheme = useSettingsStore((s) => s.addCustomTheme);

  const resolved = resolveTheme(themeId, themeOverrides);

  const [showPresetDialog, setShowPresetDialog] = useState(false);
  const [presetName, setPresetName] = useState('');

  function buildOverrides(patch: DeepPartial<Theme>): Record<string, unknown> {
    const merged = { ...(themeOverrides ?? {}), ...patch };
    return merged as Record<string, unknown>;
  }

  function updateTypography(key: string, value: unknown) {
    const typo = (themeOverrides as Record<string, unknown> | null)?.typography as Record<string, unknown> | undefined;
    void updateProjectMeta({
      temaOverrides: buildOverrides({
        typography: { ...typo, [key]: value } as DeepPartial<Theme['typography']>,
      }),
    });
  }

  function updateParagraph(key: string, value: unknown) {
    const typo = (themeOverrides as Record<string, unknown> | null)?.typography as Record<string, unknown> | undefined;
    const para = (typo?.paragraph ?? {}) as Record<string, unknown>;
    void updateProjectMeta({
      temaOverrides: buildOverrides({
        typography: {
          ...typo,
          paragraph: { ...para, [key]: value },
        } as DeepPartial<Theme['typography']>,
      }),
    });
  }

  function updateSectionBreak(ornament: string | null) {
    void updateProjectMeta({
      temaOverrides: buildOverrides({
        sectionBreak: { ornament },
      }),
    });
  }

  function updateDropCaps(value: boolean) {
    void updateProjectMeta({
      temaOverrides: buildOverrides({ dropCaps: value }),
    });
  }

  async function handleSavePreset() {
    const name = presetName.trim();
    if (!name) return;
    await addCustomTheme({ ...resolved, id: `custom-${Date.now()}`, name });
    setShowPresetDialog(false);
    setPresetName('');
  }

  return (
    <div className="px-4 py-3 space-y-3">
      <h3 className="text-xs font-medium text-text-secondary">
        {t('book.themeControls.title')}
      </h3>

      {/* Font family */}
      <label className="block">
        <span className="text-xs text-text-secondary">{t('book.themeControls.fontFamily')}</span>
        <select
          value={resolved.typography.bodyFont}
          onChange={(e) => updateTypography('bodyFont', e.target.value)}
          className="mt-0.5 w-full px-2 py-1 text-xs bg-bg-tertiary border border-border-default rounded focus:border-accent outline-none"
        >
          {FONT_OPTIONS.map((f) => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>
      </label>

      {/* Font size */}
      <label className="block">
        <span className="text-xs text-text-secondary">{t('book.themeControls.fontSize')}</span>
        <input
          type="number"
          min={10}
          max={32}
          value={resolved.typography.baseSizePx}
          onChange={(e) => updateTypography('baseSizePx', Number(e.target.value))}
          className="mt-0.5 w-full px-2 py-1 text-xs bg-bg-tertiary border border-border-default rounded focus:border-accent outline-none"
        />
      </label>

      {/* Line height */}
      <label className="block">
        <span className="text-xs text-text-secondary">{t('book.themeControls.lineHeight')}</span>
        <input
          type="number"
          min={1}
          max={3}
          step={0.05}
          value={resolved.typography.lineHeight}
          onChange={(e) => updateTypography('lineHeight', Number(e.target.value))}
          className="mt-0.5 w-full px-2 py-1 text-xs bg-bg-tertiary border border-border-default rounded focus:border-accent outline-none"
        />
      </label>

      {/* Text indent */}
      <label className="block">
        <span className="text-xs text-text-secondary">{t('book.themeControls.textIndent')}</span>
        <input
          type="number"
          min={0}
          max={5}
          step={0.5}
          value={resolved.typography.paragraph.indentEm}
          onChange={(e) => updateParagraph('indentEm', Number(e.target.value))}
          className="mt-0.5 w-full px-2 py-1 text-xs bg-bg-tertiary border border-border-default rounded focus:border-accent outline-none"
        />
      </label>

      {/* Paragraph spacing */}
      <label className="block">
        <span className="text-xs text-text-secondary">{t('book.themeControls.paragraphSpacing')}</span>
        <input
          type="number"
          min={0}
          max={3}
          step={0.25}
          value={resolved.typography.paragraph.spacingEm}
          onChange={(e) => updateParagraph('spacingEm', Number(e.target.value))}
          className="mt-0.5 w-full px-2 py-1 text-xs bg-bg-tertiary border border-border-default rounded focus:border-accent outline-none"
        />
      </label>

      {/* Justify */}
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={resolved.typography.paragraph.justify}
          onChange={(e) => updateParagraph('justify', e.target.checked)}
          className="rounded border-border-default"
        />
        <span className="text-xs text-text-secondary">{t('book.themeControls.justify')}</span>
      </label>

      {/* Section break ornament */}
      <label className="block">
        <span className="text-xs text-text-secondary">{t('book.themeControls.sectionBreakOrnament')}</span>
        <input
          type="text"
          value={resolved.sectionBreak.ornament ?? ''}
          onChange={(e) => updateSectionBreak(e.target.value || null)}
          placeholder={t('book.themeControls.sectionBreakPlaceholder')}
          className="mt-0.5 w-full px-2 py-1 text-xs bg-bg-tertiary border border-border-default rounded focus:border-accent outline-none"
        />
      </label>

      {/* Drop caps */}
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={resolved.dropCaps}
          onChange={(e) => updateDropCaps(e.target.checked)}
          className="rounded border-border-default"
        />
        <span className="text-xs text-text-secondary">{t('book.themeControls.dropCaps')}</span>
      </label>

      {/* Save as preset */}
      {!showPresetDialog ? (
        <button
          onClick={() => setShowPresetDialog(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-text-secondary border border-border-subtle rounded hover:border-border-default hover:text-text-primary transition-colors duration-150"
        >
          <Save size={12} />
          {t('book.themeControls.savePreset')}
        </button>
      ) : (
        <div className="flex flex-col gap-1.5 p-2 border border-border-default rounded bg-bg-tertiary">
          <input
            type="text"
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
            placeholder={t('book.themeControls.presetNamePlaceholder')}
            className="w-full px-2 py-1 text-xs bg-bg-secondary border border-border-default rounded focus:border-accent outline-none"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') void handleSavePreset();
              if (e.key === 'Escape') setShowPresetDialog(false);
            }}
          />
          <div className="flex gap-1.5">
            <button
              onClick={() => void handleSavePreset()}
              disabled={!presetName.trim()}
              className="flex-1 px-2 py-1 text-xs bg-accent-muted text-text-primary rounded hover:bg-accent hover:text-white transition-colors duration-150 disabled:opacity-50"
            >
              {t('book.themeControls.save')}
            </button>
            <button
              onClick={() => setShowPresetDialog(false)}
              className="px-2 py-1 text-xs text-text-secondary hover:text-text-primary transition-colors duration-150"
            >
              {t('book.themeControls.cancel')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ThemeControls;
