export interface AgradecimientosData {
  contenido: string;
}

export interface SobreElAutorData {
  contenido: string;
}

export interface OtrosLibrosData {
  contenido: string;
}

export interface BackmatterData {
  agradecimientos: AgradecimientosData | null;
  sobreElAutor: SobreElAutorData | null;
  otrosLibros: OtrosLibrosData | null;
}
