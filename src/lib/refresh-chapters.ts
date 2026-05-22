import type { Project } from '@/types/project';
import { listChapters } from './project-fs';
import { useProjectStore } from '@/stores/projectStore';

export async function refreshChapters(project: Project): Promise<{ ok: boolean; error?: string }> {
  const result = await listChapters(project);
  if (!result.ok) {
    return { ok: false, error: 'Failed to list chapters' };
  }

  const inProgress = result.value.filter((c) => c.status === 'in-progress');
  useProjectStore.getState().setChapters(inProgress);

  return { ok: true };
}
