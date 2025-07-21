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
  testigo: number[];  // Array con número de individuos por réplica [12, 10, 11, 12]
  pruebas: { 
    [pruebaId: string]: {
      numeroIndividuos: number[];  // Array con número de individuos por réplica [9, 8, 9, 9]
      producto: string;
      dosis: string;
      unidades: string;
    }
  };
}

// Tipo para los datos del montaje
export interface MontageData {
  numeroMontaje: string;
  nombreMontaje: string;
  numeroLecturas: number;
  nombresLecturas: string[];
  numeroRepeticiones: number;
  condicionesIniciales: CondicionesIniciales;
}

// Tipo para montajes en progreso  
export interface MontageInProgress {
  id: string;
  numeroMontaje: string;
  nombreMontaje: string;
  ot: string;
  objetivo: string;
  fechaCreacion: string;
  numeroLecturas: number;
  lecturasCompletadas: number;
  numeroRepeticiones: number;
  condicionesIniciales: CondicionesIniciales;
  pruebas: string[];
  productos: string[];
  ultimaLectura: string | null; // Nueva campo para la fecha de la última lectura
  estado: "En Proceso" | "Listo para Cálculo";
  ultimaActualizacion: string;
}

// Tipo para pruebas completadas
export interface CompletedTest {
  id: string;
  numeroMontaje: string;
  nombreMontaje: string;
  ot: string;
  objetivo: string;
  fechaCreacion: string;
  numeroLecturas: number;
  lecturasCompletadas: number;
  eficaciaPromedio: number;
  estado: "Completado" | "En Proceso";
  pruebas: string[];
} 