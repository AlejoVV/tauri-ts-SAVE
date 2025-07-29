// Servicios del módulo de eficacia

import { supabase } from "../../nucleo/lib/supabaseClient";
import type { VistaMaestraTotalRow, EfficacyTestData, MontageData, MontajeBasico } from "../tipos/index";

/**
 * Obtiene las pruebas disponibles para montajes de eficacia
 * Filtra por estado_proceso = "Montaje" y tipo_prueba = "Eficacia"
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
    
    // 2. Obtener todas las pruebas de eficacia en montaje
    const { data, error } = await supabase
      .from("vistamaestratotal")
      .select("*")
      .eq("prueba_estado_proceso", "Montaje")
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
      estado: row.prueba_estado_proceso || "Desconocido",
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
    estado: data.prueba_estado_proceso || "Desconocido",
    dosis: data.dosis_producto || "Sin dosis",
    unidades: data.producto_unid || "Sin unidades",
    contacto: data.contacto || "Sin contacto",
  };
}; 

/**
 * Crea un nuevo montaje básico sin configuración del setup
 */
export const createMontajeBasico = async (
  montajeBasico: MontajeBasico
): Promise<{ success: boolean; montajeId?: number; error?: string }> => {
  try {
    // 1. Crear el montaje básico en la tabla montajes_de_laboratorio
    const { data: montajeCreado, error: montajeError } = await supabase
      .from("montajes_de_laboratorio")
      .insert({
        nombre: montajeBasico.nombreMontaje,
        fecha_creacion: new Date().toISOString(),
        // Los campos de configuración se dejan como null/default
        cantidad_lecturas: null,
        cantidad_repeticiones: null,
        condiciones_iniciales: null,
        nombres_lecturas: null
      })
      .select()
      .single();

    if (montajeError) {
      console.error("Error al crear montaje básico:", montajeError);
      return { success: false, error: montajeError.message };
    }

    if (!montajeCreado) {
      return { success: false, error: "No se pudo crear el montaje básico" };
    }

    const montajeId = montajeCreado.id;

    // 2. Crear las relaciones en pruebas_en_montajes
    const pruebasEnMontajes = montajeBasico.pruebasSeleccionadas.map((test: EfficacyTestData) => ({
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

    console.log("Montaje básico creado exitosamente:", {
      montajeId,
      nombre: montajeBasico.nombreMontaje,
      pruebasAsociadas: montajeBasico.pruebasSeleccionadas.length
    });

    return { success: true, montajeId };

  } catch (error) {
    console.error("Error inesperado al crear montaje básico:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Error desconocido" 
    };
  }
};

/**
 * Actualiza un montaje existente con la configuración del setup
 */
export const updateMontajeSetup = async (
  montajeId: number, 
  montageData: MontageData
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Actualizar el montaje con los datos de configuración
    const { error: updateError } = await supabase
      .from("montajes_de_laboratorio")
      .update({
        nombre: montageData.nombreMontaje,
        cantidad_lecturas: montageData.numeroLecturas,
        cantidad_repeticiones: montageData.numeroRepeticiones,
        condiciones_iniciales: montageData.condicionesIniciales as any,
        nombres_lecturas: montageData.nombresLecturas as any,
        updated_at: new Date().toISOString()
      })
      .eq("id", montajeId);

    if (updateError) {
      console.error("Error al actualizar montaje con setup:", updateError);
      return { success: false, error: updateError.message };
    }

    console.log("Montaje actualizado exitosamente con configuración:", {
      montajeId,
      nombre: montageData.nombreMontaje,
      condicionesIniciales: montageData.condicionesIniciales,
      nombresLecturas: montageData.nombresLecturas
    });

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
          .from("resultados_lecturas")
          .select("id,es_testigo", { count: "exact" })
          .eq("montaje_id", montaje.id);

        const totalReps = montaje.cantidad_repeticiones || 1;
        const lecturasCompletadas = lecturasError ? 0 : Math.floor((lecturasCount?.filter(l => l.es_testigo)?.length || 0) / totalReps);

        // Obtener la fecha de la última lectura
        const { data: ultimaLecturaData, error: ultimaLecturaError } = await supabase
          .from("resultados_lecturas")
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
          nombres_lecturas: any | null;
        };

        // Determinar si el montaje está configurado
        const configurado = !!(montaje.cantidad_lecturas && montaje.cantidad_repeticiones && montajeConTiposCompletos.condiciones_iniciales);

        return {
          id: montaje.id.toString(),
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
          condicionesIniciales: configurado ? montajeConTiposCompletos.condiciones_iniciales : null,
          pruebas,
          productos,
          estado: configurado ? (estado as "En Proceso" | "Listo para Cálculo") : "Sin Configurar" as any,
          ultimaActualizacion: montaje.fecha_creacion ? new Date(montaje.fecha_creacion).toLocaleDateString() : "Sin fecha",
          ultimaLectura: ultimaLectura ? new Date(ultimaLectura).toLocaleDateString() : "Sin fecha",
          configurado
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
      .from("resultados_lecturas")
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
    // Obtener total de pruebas de eficacia en montaje
    const { data: todasPruebas, error: totalError } = await supabase
      .from("vistamaestratotal")
      .select("prueba_id", { count: "exact" })
      .eq("prueba_estado_proceso", "Montaje")
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

/**
 * Guarda los resultados de una lectura en la base de datos
 */
export const saveLecturaResultados = async (
  montajeId: number,
  nombreLectura: string,
  testigoResults: Record<string, number[]>,
  pruebaResults: Record<string, number[]>,
  numeroRepeticiones: number
): Promise<{ success: boolean; error?: string }> => {
  try {
    const resultadosData: any[] = [];
    const fechaRegistro = new Date().toISOString();

    // Eliminar resultados existentes para esta lectura específica
    const { error: deleteError } = await supabase
      .from("resultados_lecturas")
      .delete()
      .eq("montaje_id", montajeId)
      .eq("nombre_lectura", nombreLectura);

    if (deleteError) {
      console.error("Error al eliminar resultados existentes:", deleteError);
      return { success: false, error: deleteError.message };
    }

    // Preparar datos del testigo
    const testigoKey = `Testigo-${nombreLectura}`;
    const testigoValues = testigoResults[testigoKey] || [];
    for (let i = 0; i < numeroRepeticiones; i++) {
      resultadosData.push({
        montaje_id: montajeId,
        nombre_lectura: nombreLectura,
        prueba_id: null,
        es_testigo: true,
        replica_numero: i + 1,
        valor_resultado: testigoValues[i] || 0,
        fecha_registro: fechaRegistro,
        fecha_lectura: fechaRegistro
      });
    }

    // Preparar datos de las pruebas
    Object.entries(pruebaResults).forEach(([key, values]) => {
      if (key.endsWith(`-${nombreLectura}`)) {
        const pruebaId = parseInt(key.replace(`-${nombreLectura}`, ''));
        for (let i = 0; i < numeroRepeticiones; i++) {
          resultadosData.push({
            montaje_id: montajeId,
            nombre_lectura: nombreLectura,
            prueba_id: pruebaId,
            es_testigo: false,
            replica_numero: i + 1,
            valor_resultado: values[i] || 0,
            fecha_registro: fechaRegistro,
            fecha_lectura: fechaRegistro
          });
        }
      }
    });

    // Insertar nuevos resultados
    const { error: insertError } = await supabase
      .from("resultados_lecturas")
      .insert(resultadosData);

    if (insertError) {
      console.error("Error al guardar resultados:", insertError);
      return { success: false, error: insertError.message };
    }

    console.log("Lectura guardada exitosamente:", {
      montajeId,
      nombreLectura,
      registros: resultadosData.length
    });

    return { success: true };

  } catch (error) {
    console.error("Error inesperado al guardar lectura:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Error desconocido" 
    };
  }
};

/**
 * Recupera los resultados de lecturas guardados para un montaje
 */
export const getLecturaResultados = async (
  montajeId: number
): Promise<{
  testigoResults: Record<string, number[]>;
  pruebaResults: Record<string, number[]>;
  success: boolean;
  error?: string;
}> => {
  try {
    const { data: resultados, error } = await supabase
      .from("resultados_lecturas")
      .select("*")
      .eq("montaje_id", montajeId)
      .order("nombre_lectura")
      .order("replica_numero");

    if (error) {
      console.error("Error al obtener resultados:", error);
      return { 
        testigoResults: {}, 
        pruebaResults: {}, 
        success: false, 
        error: error.message 
      };
    }

    const testigoResults: Record<string, number[]> = {};
    const pruebaResults: Record<string, number[]> = {};

    (resultados || []).forEach(resultado => {
      if (resultado.es_testigo) {
        // Es testigo
        const testigoKey = `Testigo-${resultado.nombre_lectura}`;
        if (!testigoResults[testigoKey]) {
          testigoResults[testigoKey] = [];
        }
        testigoResults[testigoKey][resultado.replica_numero - 1] = resultado.valor_resultado || 0;
      } else if (resultado.prueba_id) {
        // Es prueba
        const pruebaKey = `${resultado.prueba_id}-${resultado.nombre_lectura}`;
        if (!pruebaResults[pruebaKey]) {
          pruebaResults[pruebaKey] = [];
        }
        pruebaResults[pruebaKey][resultado.replica_numero - 1] = resultado.valor_resultado || 0;
      }
    });

    return {
      testigoResults,
      pruebaResults,
      success: true
    };

  } catch (error) {
    console.error("Error inesperado al obtener resultados:", error);
    return {
      testigoResults: {},
      pruebaResults: {},
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido"
    };
  }
}; 

/**
 * Obtiene el número de repeticiones recomendado para un objetivo desde catalogo_eficacia
 * Si no encuentra, retorna 4 por defecto
 */
export const getNumeroRepeticionesPorObjetivo = async (objetivo: string): Promise<number> => {
  try {
    const { data, error } = await supabase
      .from("catalogo_eficacia")
      .select("numero_de_repeticiones")
      .eq("objetivo_eficacia", objetivo)
      .limit(1)
      .single();

    if (error || !data || typeof data.numero_de_repeticiones !== 'string') {
      return 4;
    }

    // Extraer el número entre paréntesis
    const match = data.numero_de_repeticiones.match(/\((\d+)\)/);
    if (match && match[1]) {
      return parseInt(match[1], 10);
    }
    return 4;
  } catch (e) {
    return 4;
  }
}; 

/**
 * Obtiene el método de cálculo de eficacia recomendado para un objetivo desde catalogo_eficacia
 * Si no encuentra, retorna 'Fórmula de Abbott' por defecto
 */
export const getMetodoCalculoPorObjetivo = async (objetivo: string): Promise<string> => {
  try {
    const { data, error } = await supabase
      .from("catalogo_eficacia")
      .select("calculo_de_eficacia")
      .eq("objetivo_eficacia", objetivo)
      .limit(1)
      .single();
    if (error || !data || typeof data.calculo_de_eficacia !== 'string') {
      return 'Fórmula de Abbott';
    }
    return data.calculo_de_eficacia;
  } catch (e) {
    return 'Fórmula de Abbott';
  }
}; 

/**
 * Obtiene las unidades por repetición para una lista de objetivos desde catalogo_eficacia
 * Devuelve un objeto { objetivo: unidades_por_repetición }
 */
export const getUnidadesPorRepeticionPorObjetivo = async (objetivos: string[]): Promise<Record<string, string | null>> => {
  if (!objetivos.length) return {};
  const result: Record<string, string | null> = {};
  try {
    const { data, error } = await supabase
      .from("catalogo_eficacia")
      .select("objetivo_eficacia, unidades_por_repetición")
      .in("objetivo_eficacia", objetivos);
    if (error) {
      console.error("Error al obtener unidades_por_repetición:", error);
      objetivos.forEach(obj => result[obj] = null);
      return result;
    }
    objetivos.forEach(obj => {
      const found = data?.find((row: any) => row.objetivo_eficacia === obj);
      result[obj] = found ? (found as any)["unidades_por_repetición"] : null;
    });
    return result;
  } catch (e) {
    objetivos.forEach(obj => result[obj] = null);
    return result;
  }
}; 

/**
 * Cuenta cuántos montajes existen para una OT específica
 * Usado para generar el número secuencial del montaje
 */
export const contarMontajesPorOT = async (numeroOT: number): Promise<number> => {
  try {
    // Obtener todos los montajes que tienen pruebas de esta OT
    const { data: montajes, error } = await supabase
      .from("montajes_de_laboratorio")
      .select(`
        id,
        pruebas_en_montajes (
          prueba_id,
          pruebas_ordenes_trabajo (
            prueba_orden_id
          )
        )
      `);

    if (error) {
      console.error("Error al contar montajes por OT:", error);
      return 0;
    }

    // Filtrar montajes que tienen pruebas de esta OT
    const montajesDeEstaOT = (montajes || []).filter(montaje => 
      montaje.pruebas_en_montajes?.some(relacion => 
        relacion.pruebas_ordenes_trabajo?.prueba_orden_id === numeroOT
      )
    );

    return montajesDeEstaOT.length;

  } catch (error) {
    console.error("Error inesperado al contar montajes:", error);
    return 0;
  }
}; 