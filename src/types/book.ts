import type { Chapter } from './project';

export type BookSection =
  | { kind: 'chapter'; chapter: Chapter; content: string }
  | { kind: 'chapter-error'; chapter: Chapter; reason: string };

export interface BookData {
  projectName: string;
  sections: BookSection[];
}
