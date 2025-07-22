// Servicios del módulo de eficacia

import { supabase } from "../../nucleo/lib/supabaseClient";
import type { VistaMaestraTotalRow, EfficacyTestData, MontageData } from "../tipos/index";

/**
 * Obtiene las pruebas disponibles para montajes de eficacia
 * Filtra por estado_lab = "En Curso" y tipo_prueba = "Eficacia"
 * Excluye pruebas que ya están asignadas a montajes existentes
 */
export const getEfficacyTestsForMontage = async (): Promise<EfficacyTestData[]> => {
  try {
    // 1. Primero obtener todas las pruebas que ya están en montajes
    const { data: pruebasEnMontajes, error: montajesError } = await supabase
      .from("pruebas_en_montajes")
      .select("prueba_id");

    if (montajesError) {
      console.error("Error al obtener pruebas en montajes:", montajesError);
      // Continuar sin filtrar si hay error
    }

    // Extraer los IDs de las pruebas que ya están en montajes
    const pruebasAsignadas = pruebasEnMontajes?.map(item => item.prueba_id).filter(id => id !== null) || [];
    
    // 2. Obtener todas las pruebas de eficacia en curso
    const { data, error } = await supabase
      .from("vistamaestratotal")
      .select("*")
      .eq("prueba_estado_lab", "En Curso")
      .eq("tipo_prueba", "Eficacia")
      .order("prueba_id", { ascending: false });

    if (error) {
      console.error("Error al obtener pruebas de eficacia:", error);
      throw error;
    }

    // 3. Filtrar las pruebas que no están en montajes y mapear los datos
    const pruebasDisponibles = (data || []).filter(row => 
      row.prueba_id && !pruebasAsignadas.includes(row.prueba_id)
    );

    const mappedData: EfficacyTestData[] = pruebasDisponibles.map((row: VistaMaestraTotalRow) => ({
      id: row.prueba_id || 0,
      ot: row.prueba_orden_id || 0,
      prueba: row.prueba_id || 0,
      finca: row.finca_nombre || "Sin finca",
      objetivo: row.objetivo_nombre || "Sin objetivo",
      producto: row.producto_nombre || "Sin producto",
      especieVegetal: row.especie_nombre || "Sin especie",
      fechaIngreso: row.prueba_fecha_creacion || "",
      estado: row.prueba_estado_lab || "Desconocido",
      dosis: row.dosis_producto || "Sin dosis",
      unidades: row.producto_unid || "Sin unidades",
      contacto: row.contacto || "Sin contacto",
    }));

    console.log(`Pruebas disponibles: ${mappedData.length}, Pruebas en montajes: ${pruebasAsignadas.length}`);
    
    return mappedData;

  } catch (error) {
    console.error("Error al obtener pruebas disponibles:", error);
    throw error;
  }
};

/**
 * Obtiene una prueba específica por ID
 */
export const getEfficacyTestById = async (pruebaId: number): Promise<EfficacyTestData | null> => {
  const { data, error } = await supabase
    .from("vistamaestratotal")
    .select("*")
    .eq("prueba_id", pruebaId)
    .single();

  if (error) {
    console.error("Error al obtener prueba de eficacia por ID:", error);
    return null;
  }

  if (!data) return null;

  return {
    id: data.prueba_id || 0,
    ot: data.prueba_orden_id || 0,
    prueba: data.prueba_id || 0,
    finca: data.finca_nombre || "Sin finca",
    objetivo: data.objetivo_nombre || "Sin objetivo",
    producto: data.producto_nombre || "Sin producto",
    especieVegetal: data.especie_nombre || "Sin especie",
    fechaIngreso: data.prueba_fecha_creacion || "",
    estado: data.prueba_estado_lab || "Desconocido",
    dosis: data.dosis_producto || "Sin dosis",
    unidades: data.producto_unid || "Sin unidades",
    contacto: data.contacto || "Sin contacto",
  };
}; 

/**
 * Crea un nuevo montaje de eficacia en la base de datos
 */
export const createMontaje = async (
  montageData: MontageData, 
  selectedTests: EfficacyTestData[]
): Promise<{ success: boolean; montajeId?: number; error?: string }> => {
  try {
    // 1. Crear el montaje en la tabla montajes_de_laboratorio con todos los campos
    const { data: montajeCreado, error: montajeError } = await supabase
      .from("montajes_de_laboratorio")
      .insert({
        nombre: montageData.nombreMontaje,
        numero_montaje: montageData.numeroMontaje,
        cantidad_lecturas: montageData.numeroLecturas,
        cantidad_repeticiones: montageData.numeroRepeticiones,
        condiciones_iniciales: montageData.condicionesIniciales as any,
        nombres_lecturas: montageData.nombresLecturas as any,
        fecha_creacion: new Date().toISOString()
      })
      .select()
      .single();

    if (montajeError) {
      console.error("Error al crear montaje:", montajeError);
      return { success: false, error: montajeError.message };
    }

    if (!montajeCreado) {
      return { success: false, error: "No se pudo crear el montaje" };
    }

    const montajeId = montajeCreado.id;

    // 2. Crear las relaciones en pruebas_en_montajes
    const pruebasEnMontajes = selectedTests.map(test => ({
      montaje_id: montajeId,
      prueba_id: test.id
    }));

    const { error: relacionesError } = await supabase
      .from("pruebas_en_montajes")
      .insert(pruebasEnMontajes);

    if (relacionesError) {
      console.error("Error al crear relaciones de pruebas:", relacionesError);
      // Si fallan las relaciones, eliminar el montaje creado
      await supabase
        .from("montajes_de_laboratorio")
        .delete()
        .eq("id", montajeId);
      
      return { success: false, error: relacionesError.message };
    }

    console.log("Montaje creado exitosamente:", {
      montajeId,
      nombre: montageData.nombreMontaje,
      numeroMontaje: montageData.numeroMontaje,
      pruebasAsociadas: selectedTests.length,
      condicionesIniciales: montageData.condicionesIniciales,
      nombresLecturas: montageData.nombresLecturas
    });

    return { success: true, montajeId };

  } catch (error) {
    console.error("Error inesperado al crear montaje:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Error desconocido" 
    };
  }
};

/**
 * Obtiene todos los montajes con sus pruebas relacionadas para la tabla de montajes en progreso
 */
export const getMontajes = async () => {
  try {
    const { data: montajes, error: montajesError } = await supabase
      .from("montajes_de_laboratorio")
      .select("*")
      .order("fecha_creacion", { ascending: false });

    if (montajesError) {
      console.error("Error al obtener montajes:", montajesError);
      throw montajesError;
    }

    // Para cada montaje, obtener las pruebas relacionadas y calcular progreso
    const montajesConPruebas = await Promise.all(
      (montajes || []).map(async (montaje) => {
        // Obtener las pruebas del montaje con información completa
        const { data: pruebasRelaciones, error: pruebasError } = await supabase
          .from("pruebas_en_montajes")
          .select(`
            prueba_id,
            pruebas_ordenes_trabajo (
              prueba_id,
              prueba_orden_id,
              prueba_dosis_producto,
              prueba_producto_unid,
              productos (producto_nombre),
              objetivos (objetivo_nombre),
              especie_vegetal (especie_nombre),
              fincas (finca_nombre)
            )
          `)
          .eq("montaje_id", montaje.id);

        if (pruebasError) {
          console.error("Error al obtener pruebas del montaje:", pruebasError);
          return null;
        }

        // Contar lecturas completadas (simulado por ahora)
        const { data: lecturasCount, error: lecturasError } = await supabase
          .from("lecturas_de_pruebas")
          .select("id", { count: "exact" })
          .eq("montaje_id", montaje.id);

        const lecturasCompletadas = lecturasError ? 0 : Math.floor((lecturasCount?.length || 0) / (pruebasRelaciones?.length || 1));

        // Obtener la fecha de la última lectura
        const { data: ultimaLecturaData, error: ultimaLecturaError } = await supabase
          .from("lecturas_de_pruebas")
          .select("fecha_lectura")
          .eq("montaje_id", montaje.id)
          .order("fecha_lectura", { ascending: false })
          .limit(1);

        const ultimaLectura = ultimaLecturaError || !ultimaLecturaData || ultimaLecturaData.length === 0 
          ? null 
          : ultimaLecturaData[0].fecha_lectura;

        // Extraer información de las pruebas
        const pruebas = pruebasRelaciones?.map(rel => (rel.prueba_id || 0).toString()) || [];
        const productos = pruebasRelaciones?.map(rel => 
          rel.pruebas_ordenes_trabajo?.productos?.producto_nombre || "Sin producto"
        ) || [];

        // Determinar estado basado en lecturas completadas
        const totalLecturas = montaje.cantidad_lecturas || 1;
        const estado = lecturasCompletadas >= totalLecturas ? "Listo para Cálculo" : "En Proceso";

        // Obtener información del primer OT para contexto
        const primeraPrueba = pruebasRelaciones?.[0]?.pruebas_ordenes_trabajo;
        const ot = primeraPrueba?.prueba_orden_id?.toString() || "Sin OT";
        const objetivo = primeraPrueba?.objetivos?.objetivo_nombre || "Sin objetivo";
        const finca = primeraPrueba?.fincas?.finca_nombre || "Sin finca";
        const especie = primeraPrueba?.especie_vegetal?.especie_nombre || "Sin especie";

        // Usar los tipos correctos de Supabase
        const montajeConTiposCompletos = montaje as {
          id: number;
          nombre: string | null;
          fecha_creacion: string | null;
          cantidad_repeticiones: number | null;
          cantidad_lecturas: number | null;
          condiciones_iniciales: any | null;
          numero_montaje: string | null;
          nombres_lecturas: any | null;
        };

        return {
          id: montaje.id.toString(),
          numeroMontaje: montajeConTiposCompletos.numero_montaje || "Sin número",
          nombreMontaje: montaje.nombre || "Sin nombre",
          ot,
          objetivo,
          finca,
          especie,
          fechaCreacion: montaje.fecha_creacion ? new Date(montaje.fecha_creacion).toLocaleDateString() : "Sin fecha",
          numeroLecturas: montaje.cantidad_lecturas || 0,
          nombresLecturas: montajeConTiposCompletos.nombres_lecturas || [],
          lecturasCompletadas,
          numeroRepeticiones: montaje.cantidad_repeticiones || 0,
          condicionesIniciales: montajeConTiposCompletos.condiciones_iniciales || { testigo: [], pruebas: {} },
          pruebas,
          productos,
          estado: estado as "En Proceso" | "Listo para Cálculo",
          ultimaActualizacion: montaje.fecha_creacion ? new Date(montaje.fecha_creacion).toLocaleDateString() : "Sin fecha",
          ultimaLectura: ultimaLectura ? new Date(ultimaLectura).toLocaleDateString() : "Sin fecha"
        };
      })
    );

    // Filtrar montajes que fallaron al cargar
    return montajesConPruebas.filter(montaje => montaje !== null);

  } catch (error) {
    console.error("Error al obtener montajes:", error);
    throw error;
  }
};

/**
 * Elimina un montaje y todas sus relaciones
 */
export const deleteMontaje = async (montajeId: number): Promise<{ success: boolean; error?: string }> => {
  try {
    // 1. Eliminar las relaciones en pruebas_en_montajes
    const { error: relacionesError } = await supabase
      .from("pruebas_en_montajes")
      .delete()
      .eq("montaje_id", montajeId);

    if (relacionesError) {
      console.error("Error al eliminar relaciones:", relacionesError);
      return { success: false, error: relacionesError.message };
    }

    // 2. Eliminar las lecturas del montaje
    const { error: lecturasError } = await supabase
      .from("lecturas_de_pruebas")
      .delete()
      .eq("montaje_id", montajeId);

    if (lecturasError) {
      console.error("Error al eliminar lecturas:", lecturasError);
      return { success: false, error: lecturasError.message };
    }

    // 3. Eliminar los cálculos de eficacia
    const { error: eficaciaError } = await supabase
      .from("eficacia_de_pruebas")
      .delete()
      .eq("montaje_id", montajeId);

    if (eficaciaError) {
      console.error("Error al eliminar cálculos de eficacia:", eficaciaError);
      return { success: false, error: eficaciaError.message };
    }

    // 4. Finalmente, eliminar el montaje
    const { error: montajeError } = await supabase
      .from("montajes_de_laboratorio")
      .delete()
      .eq("id", montajeId);

    if (montajeError) {
      console.error("Error al eliminar montaje:", montajeError);
      return { success: false, error: montajeError.message };
    }

    console.log("Montaje eliminado exitosamente:", montajeId);
    return { success: true };

  } catch (error) {
    console.error("Error inesperado al eliminar montaje:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Error desconocido" 
    };
  }
};

/**
 * Obtiene un montaje específico por ID con toda su información
 */
export const getMontajeById = async (montajeId: number) => {
  try {
    const { data: montaje, error: montajeError } = await supabase
      .from("montajes_de_laboratorio")
      .select("*")
      .eq("id", montajeId)
      .single();

    if (montajeError) {
      console.error("Error al obtener montaje:", montajeError);
      throw montajeError;
    }

    if (!montaje) {
      throw new Error("Montaje no encontrado");
    }

    // Obtener las pruebas del montaje
    const { data: pruebasRelaciones, error: pruebasError } = await supabase
      .from("pruebas_en_montajes")
      .select(`
        prueba_id,
        pruebas_ordenes_trabajo (
          prueba_id,
          prueba_orden_id,
          prueba_dosis_producto,
          prueba_producto_unid,
          productos (producto_nombre),
          objetivos (objetivo_nombre),
          especie_vegetal (especie_nombre),
          fincas (finca_nombre)
        )
      `)
      .eq("montaje_id", montajeId);

    if (pruebasError) {
      console.error("Error al obtener pruebas del montaje:", pruebasError);
      throw pruebasError;
    }

    return {
      montaje,
      pruebas: pruebasRelaciones || []
    };

  } catch (error) {
    console.error("Error al obtener montaje por ID:", error);
    throw error;
  }
};

/**
 * Actualiza el estado de un montaje
 */
export const updateMontajeStatus = async (
  montajeId: number, 
  updates: { nombre?: string; condiciones_iniciales?: any; nombres_lecturas?: any }
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from("montajes_de_laboratorio")
      .update(updates)
      .eq("id", montajeId);

    if (error) {
      console.error("Error al actualizar montaje:", error);
      return { success: false, error: error.message };
    }

    return { success: true };

  } catch (error) {
    console.error("Error inesperado al actualizar montaje:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Error desconocido" 
    };
  }
}; 

/**
 * Obtiene estadísticas sobre pruebas disponibles y asignadas
 */
export const getEfficacyTestsStats = async (): Promise<{
  totalPruebas: number;
  pruebasDisponibles: number;
  pruebasEnMontajes: number;
}> => {
  try {
    // Obtener total de pruebas de eficacia en curso
    const { data: todasPruebas, error: totalError } = await supabase
      .from("vistamaestratotal")
      .select("prueba_id", { count: "exact" })
      .eq("prueba_estado_lab", "En Curso")
      .eq("tipo_prueba", "Eficacia");

    if (totalError) {
      console.error("Error al obtener total de pruebas:", totalError);
      throw totalError;
    }

    // Obtener pruebas asignadas a montajes
    const { data: pruebasAsignadas, error: asignadasError } = await supabase
      .from("pruebas_en_montajes")
      .select("prueba_id", { count: "exact" });

    if (asignadasError) {
      console.error("Error al obtener pruebas asignadas:", asignadasError);
      throw asignadasError;
    }

    const totalPruebas = todasPruebas?.length || 0;
    const pruebasEnMontajes = pruebasAsignadas?.length || 0;
    const pruebasDisponibles = totalPruebas - pruebasEnMontajes;

    return {
      totalPruebas,
      pruebasDisponibles,
      pruebasEnMontajes
    };

  } catch (error) {
    console.error("Error al obtener estadísticas de pruebas:", error);
    return {
      totalPruebas: 0,
      pruebasDisponibles: 0,
      pruebasEnMontajes: 0
    };
  }
}; 