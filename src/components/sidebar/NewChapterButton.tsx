import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, FileText, MessageSquare, Film } from 'lucide-react';
import { useProjectStore } from '@/stores/projectStore';
import { createChapter, updateProjectMeta, readChapter } from '@/lib/project-fs';
import ShortcutHint from '@/components/shared/ShortcutHint';

type ChapterTemplate = 'blank' | 'scene' | 'dialogue';

const TEMPLATE_CONTENT: Record<ChapterTemplate, string> = {
  blank: '# {{title}}\n\n',
  scene: [
    '# {{title}}',
    '',
    '## Escena 1',
    '',
    '*Lugar: *',
    '*Hora: *',
    '',
    '',
    '',
    '---',
    '',
    '## Escena 2',
    '',
    '*Lugar: *',
    '*Hora: *',
    '',
    '',
    '',
  ].join('\n'),
  dialogue: [
    '# {{title}}',
    '',
    '',
    '',
    '---',
    '',
    '**Personaje A:** ',
    '',
    '**Personaje B:** ',
    '',
    '**Personaje A:** ',
    '',
    '',
    '',
  ].join('\n'),
};

function NewChapterButton() {
  const { t } = useTranslation();
  const currentProject = useProjectStore((s) => s.currentProject);
  const addChapter = useProjectStore((s) => s.addChapter);
  const setActiveChapter = useProjectStore((s) => s.setActiveChapter);
  const [loading, setLoading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showMenu) return;
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  async function handleCreate(template: ChapterTemplate) {
    if (!currentProject || loading) return;
    setShowMenu(false);
    setLoading(true);

    const result = await createChapter(currentProject, undefined, TEMPLATE_CONTENT[template]);
    if (!result.ok) {
      console.error('Error al crear capitulo:', result.error);
      setLoading(false);
      return;
    }

    addChapter(result.value);
    await updateProjectMeta(currentProject, { capituloActivo: result.value.filename });

    const read = await readChapter(result.value.path);
    const content = read.ok ? read.value : `# ${result.value.title}\n\n`;
    setActiveChapter(result.value.path, content);

    setLoading(false);
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setShowMenu((prev) => !prev)}
        disabled={loading || !currentProject}
        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-tertiary hover:text-text-primary hover:bg-bg-tertiary disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150"
      >
        <Plus size={14} />
        <span>{t('sidebar.newChapter')}</span>
        <ShortcutHint text="⌘N" className="ml-auto" />
      </button>

      {showMenu && (
        <div className="absolute left-2 right-2 top-full z-50 mt-1 rounded bg-bg-tertiary border border-border-default shadow-sm">
          <button
            onClick={() => handleCreate('blank')}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-primary hover:bg-bg-secondary transition-colors duration-150 rounded-t"
          >
            <FileText size={14} className="text-text-tertiary" />
            {t('sidebar.templateBlank')}
          </button>
          <button
            onClick={() => handleCreate('scene')}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-primary hover:bg-bg-secondary transition-colors duration-150"
          >
            <Film size={14} className="text-text-tertiary" />
            {t('sidebar.templateScene')}
          </button>
          <button
            onClick={() => handleCreate('dialogue')}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-primary hover:bg-bg-secondary transition-colors duration-150 rounded-b"
          >
            <MessageSquare size={14} className="text-text-tertiary" />
            {t('sidebar.templateDialogue')}
          </button>
        </div>
      )}
    </div>
  );
}

export default NewChapterButton;
