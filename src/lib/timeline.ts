import { invoke } from '@tauri-apps/api/core';

export interface TimelineEvent {
  id: string;
  title: string;
  chapterFilename: string | null;
  description: string;
}

function timelinePath(rootPath: string): string {
  return `${rootPath}/.notes/timeline.json`;
}

export function createTimelineEventId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function readTimeline(rootPath: string): Promise<TimelineEvent[]> {
  const path = timelinePath(rootPath);
  const exists = await invoke<boolean>('path_exists', { path });
  if (!exists) return [];
  try {
    const raw = await invoke<string>('read_text_file', { path });
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as TimelineEvent[];
  } catch (e) {
    console.error('Failed to read timeline:', e);
    return [];
  }
}

export async function writeTimeline(rootPath: string, events: TimelineEvent[]): Promise<void> {
  const dir = `${rootPath}/.notes`;
  await invoke('ensure_dir', { path: dir });
  await invoke('write_text_file', {
    path: timelinePath(rootPath),
    contents: JSON.stringify(events, null, 2),
  });
}
