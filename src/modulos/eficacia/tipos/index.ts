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

// Tipo para los datos del montaje básico (sin configuración de setup)
export interface MontajeBasico {
  nombreMontaje: string;
  pruebasSeleccionadas: EfficacyTestData[];
}

// Tipo para los datos del montaje completo (con configuración de setup)
export interface MontageData {
  nombreMontaje: string;
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
  fechaCreacion: string;
  numeroLecturas: number;
  nombresLecturas: string[];
  lecturasCompletadas: number;
  numeroRepeticiones: number;
  condicionesIniciales: CondicionesIniciales | null; // Puede ser null si no está configurado
  pruebas: string[];
  productos: string[];
  ultimaLectura: string | null; // Nueva campo para la fecha de la última lectura
  estado: "En Proceso" | "Listo para Cálculo" | "Sin Configurar";
  ultimaActualizacion: string;
  configurado: boolean; // Nuevo campo para indicar si el montaje está configurado
}

// Tipo para pruebas completadas
export interface CompletedTest {
  id: string;
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