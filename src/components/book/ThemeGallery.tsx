import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, Heart } from 'lucide-react';
import { listBuiltInThemes, type Theme } from '@/lib/theme';

interface ThemeGalleryProps {
  activeThemeId: string;
  onSelectTheme?: (themeId: string) => void;
  customThemes?: Theme[];
  sampleText?: string;
}

function stripMarkdown(md: string): string {
  return md
    .replace(/^#{1,6}\s+.*$/gm, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/\[(.+?)\]\(.*?\)/g, '$1')
    .replace(/^[-*>]\s+/gm, '')
    .replace(/\n{2,}/g, ' ')
    .trim();
}

function ThemeThumbnail({
  theme,
  isActive,
  onClick,
  sampleText,
  isFavorite,
  onToggleFavorite,
}: {
  theme: Theme;
  isActive: boolean;
  onClick?: () => void;
  sampleText: string;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}) {
  const { t } = useTranslation();
  const p = theme.typography.paragraph;
  const isSerif = theme.typography.bodyFont.toLowerCase().includes('serif')
    && !theme.typography.bodyFont.toLowerCase().includes('sans');

  const displayText = sampleText.slice(0, 200);
  const firstLetter = displayText.charAt(0);
  const restText = displayText.slice(1);

  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); } : undefined}
      className={`group relative flex flex-col rounded border-2 p-3 transition-colors duration-150 ${
        onClick ? 'cursor-pointer' : ''
      } ${
        isActive
          ? 'border-accent bg-bg-tertiary'
          : 'border-transparent bg-bg-secondary hover:border-border-default'
      }`}
    >
      {isActive && (
        <div className="absolute top-1.5 right-1.5 flex items-center gap-1 rounded bg-accent px-1.5 py-0.5 text-[10px] text-white">
          <Check size={10} />
          <span>{t('book.themeGallery.activeLabel')}</span>
        </div>
      )}

      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
        className={`absolute top-1.5 left-1.5 flex items-center justify-center w-5 h-5 rounded-full transition-colors duration-150 ${
          isFavorite
            ? 'text-error'
            : 'text-text-tertiary hover:text-error opacity-0 group-hover:opacity-100'
        }`}
        style={{ opacity: isFavorite ? 1 : undefined }}
        aria-label="Favorite"
      >
        <Heart size={12} fill={isFavorite ? 'currentColor' : 'none'} />
      </button>

        {/* Mini preview with real book text */}
        <div className="mb-2 rounded border border-border-default bg-bg-editor px-3 py-2 select-none overflow-hidden shadow-sm" style={{ height: '72px' }}>
          <div
            className="text-text-editor leading-snug"
            style={{
              fontFamily: isSerif
                ? 'Charter, Georgia, serif'
                : 'Inter, system-ui, sans-serif',
              fontSize: '7.5px',
              lineHeight: '1.45',
              textAlign: p.justify ? 'justify' : 'left',
              textIndent: p.indentEm > 0 ? `${p.indentEm * 0.4}em` : undefined,
              display: '-webkit-box',
              WebkitLineClamp: 6,
              WebkitBoxOrient: 'vertical' as const,
              overflow: 'hidden',
            }}
          >
            {theme.dropCaps && firstLetter ? (
              <>
                <span style={{ fontSize: '18px', float: 'left', lineHeight: 0.8, marginRight: '1px', fontWeight: 600, color: 'var(--accent)' }}>
                  {firstLetter}
                </span>
                {restText}
              </>
            ) : (
              displayText
            )}
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

function ThemeGallery({ activeThemeId, onSelectTheme, customThemes = [], sampleText = '' }: ThemeGalleryProps) {
  const { t } = useTranslation();
  const allThemes = [...listBuiltInThemes(), ...customThemes];
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const cleanText = sampleText ? stripMarkdown(sampleText) : '';
  const fallbackText = 'The morning light filtered through the curtains casting long shadows across the room. She picked up the letter and read it once more, her hands trembling slightly.';
  const displaySample = cleanText.length > 20 ? cleanText : fallbackText;

  function toggleFavorite(themeId: string) {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(themeId)) next.delete(themeId);
      else next.add(themeId);
      return next;
    });
  }

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
            sampleText={displaySample}
            isFavorite={favorites.has(theme.id)}
            onToggleFavorite={() => toggleFavorite(theme.id)}
          />
        ))}
      </div>
    </div>
  );
}

export default ThemeGallery;
