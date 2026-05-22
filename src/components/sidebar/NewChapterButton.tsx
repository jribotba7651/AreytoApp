import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useProjectStore } from '@/stores/projectStore';
import { createChapter, updateProjectMeta, readChapter } from '@/lib/project-fs';
import ShortcutHint from '@/components/shared/ShortcutHint';

function NewChapterButton() {
  const currentProject = useProjectStore((s) => s.currentProject);
  const addChapter = useProjectStore((s) => s.addChapter);
  const setActiveChapter = useProjectStore((s) => s.setActiveChapter);
  const [loading, setLoading] = useState(false);

  async function handleCreate() {
    if (!currentProject || loading) return;
    setLoading(true);

    const result = await createChapter(currentProject);
    if (!result.ok) {
      console.error('Error al crear capítulo:', result.error);
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
    <button
      onClick={handleCreate}
      disabled={loading || !currentProject}
      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-tertiary hover:text-text-primary hover:bg-bg-tertiary disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150"
    >
      <Plus size={14} />
      <span>Nuevo capítulo</span>
      <ShortcutHint text="⌘N" className="ml-auto" />
    </button>
  );
}

export default NewChapterButton;
