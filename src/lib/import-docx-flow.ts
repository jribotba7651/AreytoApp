import { invoke } from '@tauri-apps/api/core';
import { createProject, writeChapter, updateProjectMeta } from './project-fs';
import { setupProjectInStores } from './open-project-flow';
import { splitIntoChapters } from './split-import';

interface ImportDocxOptions {
  docxPath: string;
  parentDir: string;
  projectName: string;
}

export type ImportResult = { ok: true } | { ok: false; error: string };

export async function importDocxToNewProject({
  docxPath,
  parentDir,
  projectName,
}: ImportDocxOptions): Promise<ImportResult> {
  // 1. Convert docx to markdown via pandoc sidecar
  let markdown: string;
  try {
    markdown = await invoke<string>('import_docx', { inputPath: docxPath });
  } catch (e) {
    return { ok: false, error: `Error al convertir el archivo: ${String(e)}` };
  }

  // 2. Split into chapters
  const chapters = splitIntoChapters(markdown);
  if (chapters.length === 0) {
    return { ok: false, error: 'El documento no tiene contenido importable.' };
  }

  // 3. Create project
  const rootPath = `${parentDir}/${projectName}`;
  const projectResult = await createProject(rootPath, projectName);
  if (!projectResult.ok) {
    if (projectResult.error.kind === 'AlreadyExists') {
      return { ok: false, error: 'Ya existe un proyecto en esa carpeta con ese nombre.' };
    }
    return { ok: false, error: `No se pudo crear el proyecto: ${projectResult.error.kind}` };
  }

  // 4. Write each chapter
  for (let i = 0; i < chapters.length; i++) {
    const nn = String(i + 1).padStart(2, '0');
    const filename = `cap-${nn}.md`;
    const chapterPath = `${rootPath}/capitulos/${filename}`;
    const content = chapters[i] ?? '';
    const writeResult = await writeChapter(chapterPath, content);
    if (!writeResult.ok) {
      return { ok: false, error: `No se pudo escribir ${filename}: ${writeResult.error.kind}` };
    }
  }

  // 5. Set active chapter
  const project = projectResult.value;
  await updateProjectMeta(project, { capituloActivo: 'cap-01.md' });

  // 6. Open the project
  try {
    await setupProjectInStores(project);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: `Proyecto creado pero no se pudo abrir: ${String(e)}` };
  }
}
