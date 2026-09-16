import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useProjectStore } from '@/stores/projectStore';
import { useCharacterStore } from '@/stores/characterStore';
import { CHAPTER_COLORS, CHAPTER_COLOR_MAP, type ChapterColor } from '@/types/project';

function CharacterTrackerPanel() {
  const { t } = useTranslation();
  const currentProject = useProjectStore((s) => s.currentProject);
  const characters = useCharacterStore((s) => s.characters);
  const addCharacter = useCharacterStore((s) => s.addCharacter);
  const removeCharacter = useCharacterStore((s) => s.removeCharacter);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState<ChapterColor>('blue');

  if (!currentProject) {
    return (
      <div className="p-3">
        <h4 className="text-xs font-medium text-text-secondary uppercase tracking-wide">
          {t('writingToolbar.characters')}
        </h4>
        <p className="text-[11px] text-text-tertiary mt-2">{t('common.noProjectOpen')}</p>
      </div>
    );
  }

  async function handleAdd() {
    const trimmed = name.trim();
    if (!trimmed) return;
    await addCharacter(trimmed, description.trim(), color);
    setName('');
    setDescription('');
  }

  return (
    <div className="p-3 flex flex-col h-full">
      <h4 className="text-xs font-medium text-text-secondary uppercase tracking-wide">
        {t('writingToolbar.characters')}
      </h4>

      <div className="mt-2 space-y-1.5">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('writingToolbar.charactersNamePlaceholder')}
          className="w-full px-2 py-1.5 text-xs bg-bg-tertiary border border-border-subtle rounded focus:border-accent outline-none placeholder:text-text-tertiary"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t('writingToolbar.charactersDescriptionPlaceholder')}
          className="w-full px-2 py-1.5 text-xs bg-bg-tertiary border border-border-subtle rounded focus:border-accent outline-none placeholder:text-text-tertiary resize-none min-h-[44px]"
        />
        <div className="flex items-center gap-1.5">
          {CHAPTER_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={[
                'w-5 h-5 rounded-full border-2 transition-transform duration-150 hover:scale-110',
                color === c ? 'border-text-primary' : 'border-transparent',
              ].join(' ')}
              style={{ backgroundColor: CHAPTER_COLOR_MAP[c] }}
              title={t(`sidebar.colors.${c}`)}
            />
          ))}
        </div>
        <button
          onClick={() => void handleAdd()}
          disabled={!name.trim()}
          className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 text-[11px] text-text-primary bg-accent-muted rounded hover:bg-accent transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Plus size={12} />
          {t('writingToolbar.charactersAdd')}
        </button>
      </div>

      <div className="mt-3 flex-1 min-h-0 overflow-y-auto space-y-1.5">
        {characters.length === 0 ? (
          <p className="text-[11px] text-text-tertiary">{t('writingToolbar.charactersEmpty')}</p>
        ) : (
          characters.map((character) => (
            <div
              key={character.id}
              className="flex items-start gap-2 border border-border-subtle rounded p-2"
            >
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0 mt-1"
                style={{ backgroundColor: CHAPTER_COLOR_MAP[character.color] }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-medium text-text-primary truncate">{character.name}</p>
                {character.description && (
                  <p className="text-[11px] text-text-secondary line-clamp-2 break-words">
                    {character.description}
                  </p>
                )}
              </div>
              <button
                onClick={() => void removeCharacter(character.id)}
                title={t('writingToolbar.charactersDelete')}
                className="text-text-tertiary hover:text-error transition-colors duration-150 shrink-0"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default CharacterTrackerPanel;
