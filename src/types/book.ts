import type { Chapter } from './project';
import type { TituloData, CopyrightData, DedicatoriaData } from './frontmatter';
import type { AgradecimientosData } from './backmatter';

export type BookSection =
  | { kind: 'chapter'; chapter: Chapter; content: string }
  | { kind: 'chapter-error'; chapter: Chapter; reason: string };

export interface BookFrontmatter {
  titulo: TituloData | null;
  copyright: CopyrightData | null;
  dedicatoria: DedicatoriaData | null;
}

export interface BookBackmatter {
  agradecimientos: AgradecimientosData | null;
}

export interface BookData {
  projectName: string;
  frontmatter: BookFrontmatter;
  backmatter: BookBackmatter;
  sections: BookSection[];
}
