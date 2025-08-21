// Tipos del módulo de eficacia

import type { Tables } from "../../nucleo/lib/supabase";

// Tipo base de la vista maestra total
export type VistaMaestraTotalRow = Tables<"vistamaestratotal">;

// Tipo específico para las pruebas de eficacia disponibles para montaje
export interface EfficacyTestData {
  id: number;
  ot: number;
  prueba: number;
  finca: string;
  objetivo: string;
  producto: string;
  especieVegetal: string;
  fechaIngreso: string;
  estado: string;
  dosis: string;
  unidades: string;
  contacto: string;
}

// Tipo para las condiciones iniciales (número de individuos por réplica)
export interface CondicionesIniciales {
  testigo: (number | null)[];  // Array con número de individuos por réplica [12, 10, 11, 12] o null para campos vacíos
  pruebas: { 
    [pruebaId: string]: {
      numeroIndividuos: (number | null)[];  // Array con número de individuos por réplica [9, 8, 9, 9] o null para campos vacíos
      producto: string;
      dosis: string;
      unidades: string;
    }
  };
}

// Tipo para los datos del montaje básico (sin configuración de setup)
export interface MontajeBasico {
  pruebasSeleccionadas: EfficacyTestData[]; // Solo necesitamos las pruebas, el nombre se genera automáticamente
}

// Tipo para los datos del montaje completo (con configuración de setup)
export interface MontageData {
  nombreMontaje: string;
  variedad: string;
  numeroLecturas: number;
  nombresLecturas: string[];
  numeroRepeticiones: number;
  condicionesIniciales: CondicionesIniciales;
}

// Tipo para montajes en progreso  
export interface MontageInProgress {
  id: string;
  nombreMontaje: string;
  ot: string;
  objetivo: string;
  finca: string;
  especie: string;
  variedad: string | null; // Campo para la variedad
  fechaCreacion: string;
  numeroLecturas: number;
  nombresLecturas: string[];
  lecturasCompletadas: number;
  numeroRepeticiones: number;
  condicionesIniciales: CondicionesIniciales | null; // Puede ser null si no está configurado
  pruebas: string[];
  productos: string[];
  pruebaToOT: Record<string, string>; // Mapeo de prueba ID a OT
  ultimaLectura: string | null; // Nueva campo para la fecha de la última lectura
  estado: "En Proceso" | "Listo para Cálculo" | "Sin Configurar" | "Eficacia guardada";
  ultimaActualizacion: string;
  configurado: boolean; // Nuevo campo para indicar si el montaje está configurado
  asignadoA: string | null; // Campo para asignar el montaje a una persona
}

// Tipo para pruebas completadas individuales
export interface CompletedTest {
  id: string;
  pruebaId: string;
  montajeId: string;
  nombreMontaje: string;
  ot: string;
  objetivo: string;
  finca: string;
  especie: string;
  producto: string;
  dosis: string;
  unidades: string;
  compania: string;
  contacto: string;
  fechaCreacionMontaje: string;
  fechaCompletado: string;
  numeroLecturas: number;
  numeroRepeticiones: number;
  eficacia: number;
  estado: "Eficacia guardada";
} 

export interface ResultadoLectura {
  id: number;
  montaje_id: number;
  nombre_lectura: string;
  prueba_id: number | null;
  es_testigo: boolean;
  replica_numero: number;
  valor_resultado: number;
  fecha_registro: string;
  fecha_lectura: string | null;
  observaciones: string | null;
}