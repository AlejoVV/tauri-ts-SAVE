export interface OrdenTrabajo {
  noPrueba: string;
  noMuestra: string;
  estadoEnLab: string;
  objetivo: string;
  producto: string;
  dosis: number;
  especieVegetal: string;
  observaciones: string;
  fincaDeLaCepa: string;
  fechaIngresoOt: string;
  estadoProceso: string;
  procedimiento: string;
}

export interface Contacto {
  id: string;
  nombre: string;
  email: string;
  telefono?: string;
  empresaId: string;
}

export interface Empresa {
  id: string;
  nombre: string;
  direccion?: string;
  telefono?: string;
}

export interface PruebaEnCurso extends OrdenTrabajo {
  finca: string;
  pruebaId: string;
  fechaMontaje: string;
  diasMontaje: number;
  semanaEntrega: number | null;
  ingredienteActivo: string;
  eficaciaVsTestigo: string;
}

export interface BusquedaOTResult {
  otValida: boolean;
  empresa?: Empresa;
  contacto?: Contacto;
  pruebasEnCurso: PruebaEnCurso[];
}

export interface InformesState {
  otBuscada: string;
  resultadoBusqueda: BusquedaOTResult | null;
  loading: boolean;
  error: string | null;
}

export interface CatalogoCampos {
  tipoDeEvaluacion: string | null;
  numeroDeAplicaciones: string | null;
  condicionDeInoculacion: string | null;
  aplicacionDeTratamiento: string | null;
  numeroDeRepeticiones: string | null;
  unidadesPorRepeticion: string | null;
  condicionesAmbientales: string | null;
  registroDeDatos: string | null;
  metodoCalculoDeEficacia: string | null;
  nombreCientifico: string | null;
}

export interface DatosPrueba {
  codPrueba: string;
  objetivo: string;
  producto: string;
  dosis: number;
  especie: string;
  finca: string;
  observaciones: string;
  tipoEvaluacion: string;
  variedad: string;
  unidades: string;
  numeroAplicaciones: string;
  condicionInoculacion: string;
  aplicacionTratamiento: string;
  numeroRepeticiones: string;
  unidadesRepeticion: string;
  condicionesAmbientales: string;
  registroDatos: string;
  metodoEficacia: string;
  duracionPrueba: string;
  tipoInsumo: string;
  nombreCientifico: string;
  ingredienteActivo: string;
  eficaciaVsTestigo: string;
}

export interface InfoContacto {
  contactoNombres: string;
  encabezado: string;
  contactoCargo: string;
}
