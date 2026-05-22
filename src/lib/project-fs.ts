import { invoke } from '@tauri-apps/api/core';
import type { Chapter, Project, ProjectFsError, ProjectResult } from '@/types/project';

interface ProyectoJson {
  nombre: string;
  creado: string;
  capituloActivo: string | null;
}

interface RawDirEntry {
  name: string;
  is_dir: boolean;
  is_file: boolean;
}

// --- Helpers internos ---

export function extractChapterTitle(content: string, fallbackFilename: string): string {
  const match = /^#\s+(.+)$/m.exec(content);
  return match?.[1]?.trim() ?? fallbackFilename.replace(/\.md$/, '');
}

export function generateNextChapterFilename(existing: Chapter[]): string {
  const nums = existing
    .map((c) => {
      const m = /^cap-(\d+)\.md$/.exec(c.filename);
      return m?.[1] !== undefined ? parseInt(m[1], 10) : 0;
    })
    .filter((n) => n > 0);

  const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
  return `cap-${String(next).padStart(2, '0')}.md`;
}

function ok<T>(value: T): ProjectResult<T> {
  return { ok: true, value };
}

function fail<T>(error: ProjectFsError): ProjectResult<T> {
  return { ok: false, error };
}

async function readFile(path: string): Promise<ProjectResult<string>> {
  try {
    const content = await invoke<string>('read_text_file', { path });
    return ok(content);
  } catch (e) {
    return fail({ kind: 'ReadFailed', path, reason: String(e) });
  }
}

async function writeFile(path: string, contents: string): Promise<ProjectResult<void>> {
  try {
    await invoke('write_text_file', { path, contents });
    return ok(undefined);
  } catch (e) {
    return fail({ kind: 'WriteFailed', path, reason: String(e) });
  }
}

async function ensureDir(path: string): Promise<ProjectResult<void>> {
  try {
    await invoke('ensure_dir', { path });
    return ok(undefined);
  } catch (e) {
    return fail({ kind: 'WriteFailed', path, reason: String(e) });
  }
}

async function listDirEntries(path: string): Promise<ProjectResult<RawDirEntry[]>> {
  try {
    const entries = await invoke<RawDirEntry[]>('list_dir', { path });
    return ok(entries);
  } catch (e) {
    return fail({ kind: 'ReadFailed', path, reason: String(e) });
  }
}

function parseProyectoJson(raw: string, path: string): ProjectResult<ProyectoJson> {
  try {
    const parsed = JSON.parse(raw) as ProyectoJson;
    return ok(parsed);
  } catch (e) {
    return fail({ kind: 'InvalidJson', path, reason: String(e) });
  }
}

// --- API pública ---

export async function openProject(rootPath: string): Promise<ProjectResult<Project>> {
  const jsonPath = `${rootPath}/proyecto.json`;

  const exists = await invoke<boolean>('path_exists', { path: jsonPath });
  if (!exists) return fail({ kind: 'NotAProject', path: rootPath });

  const read = await readFile(jsonPath);
  if (!read.ok) return read;

  const parsed = parseProyectoJson(read.value, jsonPath);
  if (!parsed.ok) return parsed;

  return ok({ rootPath, ...parsed.value });
}

export async function createProject(
  rootPath: string,
  nombre: string
): Promise<ProjectResult<Project>> {
  const jsonPath = `${rootPath}/proyecto.json`;

  const exists = await invoke<boolean>('path_exists', { path: jsonPath });
  if (exists) return fail({ kind: 'AlreadyExists', path: rootPath });

  const subdirs = ['frontmatter', 'capitulos', 'capitulos-terminados', 'backmatter'];
  for (const dir of subdirs) {
    const result = await ensureDir(`${rootPath}/${dir}`);
    if (!result.ok) return result;
  }

  const meta: ProyectoJson = {
    nombre,
    creado: new Date().toISOString(),
    capituloActivo: null,
  };

  const write = await writeFile(jsonPath, JSON.stringify(meta, null, 2));
  if (!write.ok) return write;

  return ok({ rootPath, ...meta });
}

export async function listChapters(project: Project): Promise<ProjectResult<Chapter[]>> {
  const chapters: Chapter[] = [];

  const dirs: Array<{ path: string; status: Chapter['status'] }> = [
    { path: `${project.rootPath}/capitulos`, status: 'in-progress' },
    { path: `${project.rootPath}/capitulos-terminados`, status: 'finished' },
  ];

  for (const { path, status } of dirs) {
    const entries = await listDirEntries(path);
    if (!entries.ok) {
      if (entries.error.kind === 'ReadFailed') continue;
      return entries;
    }

    const mdFiles = entries.value.filter((e) => e.is_file && e.name.endsWith('.md'));

    for (const entry of mdFiles) {
      const chapterPath = `${path}/${entry.name}`;
      const read = await readFile(chapterPath);
      const title = read.ok
        ? extractChapterTitle(read.value, entry.name)
        : entry.name.replace(/\.md$/, '');

      chapters.push({ path: chapterPath, filename: entry.name, title, status });
    }
  }

  return ok(chapters);
}

export async function readChapter(chapterPath: string): Promise<ProjectResult<string>> {
  return readFile(chapterPath);
}

export async function writeChapter(
  chapterPath: string,
  contents: string
): Promise<ProjectResult<void>> {
  return writeFile(chapterPath, contents);
}

export async function createChapter(
  project: Project,
  title?: string
): Promise<ProjectResult<Chapter>> {
  const existing = await listChapters(project);
  if (!existing.ok) return existing;

  const filename = generateNextChapterFilename(existing.value);
  const chapterPath = `${project.rootPath}/capitulos/${filename}`;

  // Número humano sin padding: cap-02.md → 2
  const num = parseInt(filename.replace(/^cap-(\d+)\.md$/, '$1'), 10);
  const chapterTitle = title ?? `Capítulo ${num}`;
  const content = `# ${chapterTitle}\n\n`;

  const write = await writeFile(chapterPath, content);
  if (!write.ok) return write;

  return ok({ path: chapterPath, filename, title: chapterTitle, status: 'in-progress' });
}

export async function updateProjectMeta(
  project: Project,
  updates: Partial<Pick<Project, 'capituloActivo'>>
): Promise<ProjectResult<Project>> {
  const updated: Project = { ...project, ...updates };
  const meta: ProyectoJson = {
    nombre: updated.nombre,
    creado: updated.creado,
    capituloActivo: updated.capituloActivo,
  };

  const jsonPath = `${project.rootPath}/proyecto.json`;
  const write = await writeFile(jsonPath, JSON.stringify(meta, null, 2));
  if (!write.ok) return write;

  return ok(updated);
}

export async function markChapterFinished(
  project: Project,
  chapterFilename: string
): Promise<ProjectResult<Chapter>> {
  const from = `${project.rootPath}/capitulos/${chapterFilename}`;
  const to = `${project.rootPath}/capitulos-terminados/${chapterFilename}`;

  const exists = await invoke<boolean>('path_exists', { path: from });
  if (!exists) return fail({ kind: 'PathNotFound', path: from });

  try {
    await invoke('rename_path', { from, to });
  } catch (e) {
    return fail({ kind: 'WriteFailed', path: to, reason: String(e) });
  }

  const read = await readFile(to);
  const title = read.ok
    ? extractChapterTitle(read.value, chapterFilename)
    : chapterFilename.replace(/\.md$/, '');

  return ok({ path: to, filename: chapterFilename, title, status: 'finished' });
}

export async function closeChapter(
  _project: Project,
  chapter: Chapter
): Promise<ProjectResult<{ newPath: string }>> {
  if (!chapter.path.includes('/capitulos/')) {
    return fail({ kind: 'WriteFailed', path: chapter.path, reason: 'Chapter is not in capitulos/' });
  }
  const newPath = chapter.path.replace('/capitulos/', '/capitulos-terminados/');

  try {
    await invoke('rename_path', { from: chapter.path, to: newPath });
  } catch (e) {
    return fail({ kind: 'WriteFailed', path: newPath, reason: String(e) });
  }

  return ok({ newPath });
}
