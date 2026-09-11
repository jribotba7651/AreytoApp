import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react';
import { listBuiltInThemes, type Theme } from '@/lib/theme';

interface ThemeGalleryProps {
  activeThemeId: string;
  onSelectTheme?: (themeId: string) => void;
  customThemes?: Theme[];
}

function ThemeThumbnail({ theme, isActive, onClick }: { theme: Theme; isActive: boolean; onClick?: () => void }) {
  const { t } = useTranslation();
  const p = theme.typography.paragraph;
  const isSerif = theme.typography.bodyFont.toLowerCase().includes('serif')
    && !theme.typography.bodyFont.toLowerCase().includes('sans');

  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); } : undefined}
      className={`relative flex flex-col rounded border p-3 transition-colors duration-150 ${
        onClick ? 'cursor-pointer' : ''
      } ${
        isActive
          ? 'border-accent bg-bg-tertiary'
          : 'border-border-subtle bg-bg-secondary hover:border-border-default'
      }`}
    >
      {isActive && (
        <div className="absolute top-1.5 right-1.5 flex items-center gap-1 rounded bg-accent px-1.5 py-0.5 text-[10px] text-white">
          <Check size={10} />
          <span>{t('book.themeGallery.activeLabel')}</span>
        </div>
      )}

      {/* Mini preview */}
      <div className="mb-2 rounded border border-border-subtle bg-white px-3 py-2 select-none">
        <div
          className="mb-1 text-text-primary"
          style={{
            fontFamily: theme.typography.headingFont,
            fontSize: '11px',
            fontWeight: 600,
            textAlign: theme.chapterHeading.align,
          }}
        >
          Chapter Title
        </div>
        <div className="space-y-px">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="text-text-editor"
              style={{
                fontFamily: isSerif
                  ? 'Charter, Georgia, serif'
                  : 'Inter, system-ui, sans-serif',
                fontSize: '8px',
                lineHeight: '1.4',
                textAlign: p.justify ? 'justify' : 'left',
                textIndent: i > 1 ? `${p.indentEm * 0.5}em` : undefined,
              }}
            >
              {i === 1 && theme.dropCaps ? (
                <>
                  <span style={{ fontSize: '16px', float: 'left', lineHeight: 1, marginRight: '1px' }}>L</span>
                  orem ipsum dolor sit amet consectetur adipiscing.
                </>
              ) : (
                'Lorem ipsum dolor sit amet consectetur adipiscing.'
              )}
            </div>
          ))}
        </div>
      </div>

      <span className="text-xs font-medium text-text-primary">{theme.name}</span>
      <span className="text-[10px] text-text-tertiary">
        {isSerif ? 'Serif' : 'Sans-serif'}
        {p.justify ? ', justified' : ''}
        {theme.dropCaps ? ', drop caps' : ''}
      </span>
    </div>
  );
}

function ThemeGallery({ activeThemeId, onSelectTheme, customThemes = [] }: ThemeGalleryProps) {
  const { t } = useTranslation();
  const allThemes = [...listBuiltInThemes(), ...customThemes];

  return (
    <div className="px-4 py-3 border-b border-border-subtle">
      <h3 className="text-xs font-medium text-text-secondary mb-2">
        {t('book.themeGallery.title')}
      </h3>
      <div className="grid grid-cols-3 gap-2">
        {allThemes.map((theme) => (
          <ThemeThumbnail
            key={theme.id}
            theme={theme}
            isActive={theme.id === activeThemeId}
            onClick={onSelectTheme ? () => onSelectTheme(theme.id) : undefined}
          />
        ))}
      </div>
    </div>
  );
}

export default ThemeGallery;
