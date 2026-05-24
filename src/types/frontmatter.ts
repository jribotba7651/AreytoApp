export type FrontmatterKind = 'titulo' | 'copyright' | 'dedicatoria';

export interface TituloData {
  titulo: string;
  subtitulo?: string;
  autor: string;
}

export interface CopyrightData {
  ano: number | null;
  titular: string;
  licencia: string;
  notas?: string;
}

export interface DedicatoriaData {
  contenido: string;
}

export type FrontmatterData =
  | { kind: 'titulo'; data: TituloData }
  | { kind: 'copyright'; data: CopyrightData }
  | { kind: 'dedicatoria'; data: DedicatoriaData };
