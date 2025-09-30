// Tipos para el módulo de Informes

export interface OrdenTrabajo {
  no_prueba: string;
  no_muestra: string;
  estado_en_lab: string;
  objetivo: string;
  producto: string;
  dosis: number;
  especie_vegetal: string;
  observaciones: string;
  finca_de_la_cepa: string;
  fecha_ingreso_ot: string;
  estado_proceso: string;
  procedimiento: string;
}

export interface Contacto {
  id: string;
  nombre: string;
  email: string;
  telefono?: string;
  empresa_id: string;
}

export interface Empresa {
  id: string;
  nombre: string;
  direccion?: string;
  telefono?: string;
}

export interface PruebaEnCurso {
  no_prueba: string;
  no_muestra: string;
  estado_en_lab: string;
  objetivo: string;
  producto: string;
  dosis: number;
  especie_vegetal: string;
  observaciones: string;
  finca_de_la_cepa: string;
  fecha_ingreso_ot: string;
  estado_proceso: string;
  procedimiento: string;
  // Nuevos campos requeridos
  finca: string;
  prueba_id: string;
  fecha_montaje: string;
  dias_montaje: number;
  semana_entrega: number | null;
}

export interface BusquedaOTResult {
  ot_valida: boolean;
  empresa?: Empresa;
  contacto?: Contacto;
  pruebas_en_curso: PruebaEnCurso[];
}

export interface InformesState {
  ot_buscada: string;
  resultado_busqueda: BusquedaOTResult | null;
  loading: boolean;
  error: string | null;
}