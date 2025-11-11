// Servicios del módulo de eficacia

import { supabase } from "../../nucleo/lib/supabaseClient";
import type { VistaMaestraTotalRow, EfficacyTestData, MontageData, MontajeBasico } from "../tipos/index";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType } from "docx";
import { saveAs } from "file-saver";

/**
 * Obtiene las pruebas disponibles para montajes de eficacia
 * Filtra por estado_proceso = "Montaje" o "Repetición" y tipo_prueba = "Eficacia"
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
    
    // 2. Obtener todas las pruebas de eficacia en montaje o repetición
    const { data, error } = await supabase
      .from("vistamaestratotal")
      .select("*")
      .in("prueba_estado_proceso", ["Montaje", "Repetición"])
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
): Promise<{ success: boolean; montajeId?: number; error?: string; nombreGenerado?: string }> => {
  try {
    // 1. Generar nombre automático basado en las pruebas seleccionadas
    if (montajeBasico.pruebasSeleccionadas.length === 0) {
      return { success: false, error: "Debe seleccionar al menos una prueba" };
    }

    // Verificar si todas las pruebas tienen el mismo OT
    const primerOT = montajeBasico.pruebasSeleccionadas[0].ot;
    const todosIgualOT = montajeBasico.pruebasSeleccionadas.every(prueba => prueba.ot === primerOT);
    
    let nombreGenerado;
    if (todosIgualOT) {
      // Si todas las pruebas tienen el mismo OT, usar el formato solicitado
      const cantidadExistentes = await contarMontajesPorOT(primerOT);
      const secuencia = cantidadExistentes + 1;
      nombreGenerado = `OT ${primerOT} M${secuencia}`;
    } else {
      // Si hay múltiples OTs, usar el formato solicitado para múltiples OTs
      // Obtener OTs únicas y crear una lista
      const otsUnicas = [...new Set(montajeBasico.pruebasSeleccionadas.map(prueba => prueba.ot))];
      const listaOTs = otsUnicas.join("-");
      const cantidadExistentes = await contarMontajesPorOT(primerOT);
      const secuencia = cantidadExistentes + 1;
      
      nombreGenerado = `OT ${listaOTs} M${secuencia}`;

    }

    // 2. Crear el montaje básico en la tabla montajes_de_laboratorio
    const { data: montajeCreado, error: montajeError } = await supabase
      .from("montajes_de_laboratorio")
      .insert({
        nombre: nombreGenerado, // Usar el nombre generado automáticamente
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

    // 3. Crear las relaciones en pruebas_en_montajes
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
      nombre: nombreGenerado,
      pruebasAsociadas: montajeBasico.pruebasSeleccionadas.length
    });

    return { success: true, montajeId, nombreGenerado };

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
        tipo_evaluacion: montageData.tipoEvaluacion,
        duracion_prueba: montageData.duracionPrueba,
        tipo_insumo: montageData.tipoInsumo,
        nombre_cientifico: montageData.nombreCientifico
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
      nombresLecturas: montageData.nombresLecturas,
      tipoEvaluacion: montageData.tipoEvaluacion,
      duracionPrueba: montageData.duracionPrueba,
      tipoInsumo: montageData.tipoInsumo,
      nombreCientifico: montageData.nombreCientifico
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
        tipo_evaluacion: montageData.tipoEvaluacion,
        duracion_prueba: montageData.duracionPrueba,
        tipo_insumo: montageData.tipoInsumo,
        nombre_cientifico: montageData.nombreCientifico,
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
      nombresLecturas: montageData.nombresLecturas,
      tipoEvaluacion: montageData.tipoEvaluacion,
      duracionPrueba: montageData.duracionPrueba,
      tipoInsumo: montageData.tipoInsumo
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

        // Verificar si existen resultados de eficacia guardados
        const { data: efficacyResults } = await supabase
          .from("eficacia_de_pruebas")
          .select("id")
          .eq("montaje_id", montaje.id)
          .limit(1);

        // Determinar estado basado en lecturas completadas y resultados de eficacia
        const totalLecturas = montaje.cantidad_lecturas || 1;
        const tieneEficaciaGuardada = efficacyResults && efficacyResults.length > 0;
        
        let estado: string;
        if (tieneEficaciaGuardada) {
          estado = "Eficacia guardada";
        } else if (lecturasCompletadas >= totalLecturas) {
          estado = "Listo para Cálculo";
        } else {
          estado = "En Proceso";
        }

        // Obtener información de todas las OTs únicas
        const otsUnicas = [...new Set(pruebasRelaciones?.map(rel => 
          rel.pruebas_ordenes_trabajo?.prueba_orden_id?.toString()
        ).filter(Boolean))];
        const ot = otsUnicas.length > 0 ? otsUnicas.join(", ") : "Sin OT";
        
        // Obtener información del primer OT para contexto
        const primeraPrueba = pruebasRelaciones?.[0]?.pruebas_ordenes_trabajo;
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
          asignado_a: string | null;
        };

        // Determinar si el montaje está configurado
        const configurado = !!(montaje.cantidad_lecturas && montaje.cantidad_repeticiones && montajeConTiposCompletos.condiciones_iniciales);

        // Crear mapeo de prueba a OT para el modal de resultados
        const pruebaToOT: Record<string, string> = {};
        pruebasRelaciones?.forEach(rel => {
          if (rel.pruebas_ordenes_trabajo?.prueba_id && rel.pruebas_ordenes_trabajo?.prueba_orden_id) {
            pruebaToOT[rel.pruebas_ordenes_trabajo.prueba_id.toString()] = rel.pruebas_ordenes_trabajo.prueba_orden_id.toString();
          }
        });

        return {
          id: montaje.id.toString(),
          nombreMontaje: montaje.nombre || "Sin nombre",
          ot,
          objetivo,
          finca,
          especie,
          variedad: (montajeConTiposCompletos as any).variedad || null, // Incluir campo variedad
          nombreCientifico: (montaje as any).nombre_cientifico || null, // Incluir campo nombre científico
          fechaCreacion: montaje.fecha_creacion ? new Date(montaje.fecha_creacion).toLocaleDateString() : "Sin fecha",
          numeroLecturas: montaje.cantidad_lecturas || 0,
          nombresLecturas: montajeConTiposCompletos.nombres_lecturas || [],
          lecturasCompletadas,
          numeroRepeticiones: montaje.cantidad_repeticiones || 0,
          condicionesIniciales: configurado ? montajeConTiposCompletos.condiciones_iniciales : null,
          pruebas,
          productos,
          pruebaToOT, // Nuevo campo para mapear prueba a OT
          estado: configurado ? (estado as "En Proceso" | "Listo para Cálculo") : "Sin Configurar" as any,
          ultimaActualizacion: montaje.fecha_creacion ? new Date(montaje.fecha_creacion).toLocaleDateString() : "Sin fecha",
          ultimaLectura: ultimaLectura ? new Date(ultimaLectura).toLocaleDateString() : "Sin fecha",
          configurado,
          asignadoA: montajeConTiposCompletos.asignado_a // Leer asignación de la base de datos
        };
      })
    );

    // Filtrar montajes que fallaron al cargar y excluir los que tienen eficacia guardada
    return montajesConPruebas.filter(montaje => 
      montaje !== null && montaje.estado !== "Eficacia guardada"
    );

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
    // Obtener total de pruebas de eficacia en montaje o repetición
    const { data: todasPruebas, error: totalError } = await supabase
      .from("vistamaestratotal")
      .select("prueba_id", { count: "exact" })
      .in("prueba_estado_proceso", ["Montaje", "Repetición"])
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

    console.log("Datos obtenidos de la base de datos:", resultados);

    const testigoResults: Record<string, number[]> = {};
    const pruebaResults: Record<string, number[]> = {};

    (resultados || []).forEach(resultado => {
      console.log("Procesando resultado:", resultado);
      
      if (resultado.es_testigo) {
        // Es testigo
        const testigoKey = `Testigo-${resultado.nombre_lectura}`;
        console.log("Creando clave de testigo:", testigoKey);
        
        if (!testigoResults[testigoKey]) {
          testigoResults[testigoKey] = [];
        }
        testigoResults[testigoKey][resultado.replica_numero - 1] = resultado.valor_resultado || 0;
      } else if (resultado.prueba_id) {
        // Es prueba
        const pruebaKey = `${resultado.prueba_id}-${resultado.nombre_lectura}`;
        console.log("Creando clave de prueba:", pruebaKey);
        
        if (!pruebaResults[pruebaKey]) {
          pruebaResults[pruebaKey] = [];
        }
        pruebaResults[pruebaKey][resultado.replica_numero - 1] = resultado.valor_resultado || 0;
      }
    });

    console.log("Resultados finales de testigo:", testigoResults);
    console.log("Resultados finales de pruebas:", pruebaResults);

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
 * Obtiene el número de repeticiones recomendado para un objetivo desde catalogo_eficacia_v2
 * Si no encuentra, retorna 4 por defecto
 */
export const getNumeroRepeticionesPorObjetivo = async (objetivo: string): Promise<number> => {
  try {
    const { data, error } = await supabase
      .from("catalogo_eficacia_v2")
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
 * Obtiene el método de cálculo de eficacia recomendado para un objetivo desde catalogo_eficacia_v2
 * Si no encuentra, retorna 'Fórmula de Abbott' por defecto
 */
export const getMetodoCalculoPorObjetivo = async (objetivo: string): Promise<string> => {
  try {
    const { data, error } = await supabase
      .from("catalogo_eficacia_v2")
      .select("metodo_calculo_de_eficacia")
      .eq("objetivo_eficacia", objetivo)
      .limit(1)
      .single();
    if (error || !data || typeof data.metodo_calculo_de_eficacia !== 'string') {
      return 'Fórmula de Abbott';
    }
    return data.metodo_calculo_de_eficacia;
  } catch (e) {
    return 'Fórmula de Abbott';
  }
};

/**
 * Obtiene información completa del catálogo de eficacia para un objetivo específico
 */
export const getCatalogoEficaciaPorObjetivo = async (objetivo: string): Promise<{
  metodo_calculo_de_eficacia: string | null;
  registro_de_datos: string | null;
  aplicacion_de_tratamiento: string | null;
  condiciones_ambientales: string | null;
  tipo_de_evaluacion: string | null;
  numero_de_aplicaciones: string | null;
  condicion_de_inoculacion: string | null;
  plaga_enfermedad: string | null;
  nombre_cientifico: string | null;
} | null> => {
  try {
    const { data, error } = await supabase
      .from("catalogo_eficacia_v2")
      .select(`
        metodo_calculo_de_eficacia,
        registro_de_datos,
        aplicacion_de_tratamiento,
        condiciones_ambientales,
        tipo_de_evaluacion,
        numero_de_aplicaciones,
        condicion_de_inoculacion,
        plaga_enfermedad,
        nombre_cientifico
      `)
      .eq("objetivo_eficacia", objetivo)
      .limit(1);
    
    if (error || !data || data.length === 0) {
      console.error("Error al obtener catálogo de eficacia:", error);
      return null;
    }
    
    // Retornar el primer registro encontrado
    return data[0];
  } catch (e) {
    console.error("Error inesperado al obtener catálogo de eficacia:", e);
    return null;
  }
}; 

/**
 * Obtiene las unidades por repetición para una lista de objetivos desde catalogo_eficacia_v2
 * Devuelve un objeto { objetivo: unidades_por_repeticion }
 */
export const getUnidadesPorRepeticionPorObjetivo = async (objetivos: string[]): Promise<Record<string, string | null>> => {
  if (!objetivos.length) return {};
  const result: Record<string, string | null> = {};
  try {
    const { data, error } = await supabase
      .from("catalogo_eficacia_v2")
      .select("objetivo_eficacia, unidades_por_repeticion")
      .in("objetivo_eficacia", objetivos);
    if (error) {
      console.error("Error al obtener unidades_por_repeticion:", error);
      objetivos.forEach(obj => result[obj] = null);
      return result;
    }
    objetivos.forEach(obj => {
      const found = data?.find((row: any) => row.objetivo_eficacia === obj);
      result[obj] = found ? (found as any)["unidades_por_repeticion"] : null;
    });
    return result;
  } catch (e) {
    objetivos.forEach(obj => result[obj] = null);
    return result;
  }
}; 

/**
 * Obtiene los tipos de evaluación únicos para una lista de objetivos desde catalogo_eficacia_v2
 * Devuelve un array de strings únicos con los tipos de evaluación disponibles
 */
export const getTiposEvaluacionPorObjetivos = async (objetivos: string[]): Promise<string[]> => {
  if (!objetivos.length) return [];
  
  try {
    const { data, error } = await supabase
      .from("catalogo_eficacia_v2")
      .select("tipo_de_evaluacion")
      .in("objetivo_eficacia", objetivos)
      .not("tipo_de_evaluacion", "is", null);

    if (error) {
      console.error("Error al obtener tipos de evaluación:", error);
      return [];
    }

    if (data) {
      // Extraer valores únicos y filtrar nulls/undefined
      const tiposUnicos = [...new Set(
        data
          .map(item => item.tipo_de_evaluacion)
          .filter(tipo => tipo && tipo.trim() !== "")
      )];
      
      return tiposUnicos.sort(); // Ordenar alfabéticamente
    }

    return [];
  } catch (error) {
    console.error("Error al obtener tipos de evaluación:", error);
    return [];
  }
}; 

/**
 * Obtiene los valores de duración únicos para una lista de objetivos desde catalogo_eficacia_v2
 * Devuelve un array de strings únicos con las duraciones disponibles (excluyendo "N/A")
 */
export const getDuracionesPorObjetivos = async (objetivos: string[]): Promise<string[]> => {
  if (!objetivos.length) return [];
  
  try {
    const { data, error } = await supabase
      .from("catalogo_eficacia_v2")
      .select("duracion")
      .in("objetivo_eficacia", objetivos)
      .not("duracion", "is", null)
      .neq("duracion", "N/A");

    if (error) {
      console.error("Error al obtener duraciones:", error);
      return [];
    }

    if (data) {
      // Extraer valores únicos y filtrar nulls/undefined/N/A
      const duracionesUnicas = [...new Set(
        data
          .map(item => item.duracion)
          .filter(duracion => duracion && duracion.trim() !== "" && duracion.trim() !== "N/A")
      )];
      
      return duracionesUnicas.sort(); // Ordenar alfabéticamente
    }

    return [];
  } catch (error) {
    console.error("Error al obtener duraciones:", error);
    return [];
  }
}; 

/**
 * Obtiene los valores de tipo_insumo únicos para una lista de objetivos desde catalogo_eficacia_v2
 * Devuelve un array de strings únicos con los tipos de insumo disponibles (excluyendo "N/A")
 */
export const getTiposInsumoPorObjetivos = async (objetivos: string[]): Promise<string[]> => {
  if (!objetivos.length) return [];
  
  try {
    const { data, error } = await supabase
      .from("catalogo_eficacia_v2")
      .select("tipo_insumo")
      .in("objetivo_eficacia", objetivos)
      .not("tipo_insumo", "is", null)
      .neq("tipo_insumo", "N/A");

    if (error) {
      console.error("Error al obtener tipos de insumo:", error);
      return [];
    }

    if (data) {
      // Extraer valores únicos y filtrar nulls/undefined/N/A
      const tiposInsumoUnicos = [...new Set(
        data
          .map(item => item.tipo_insumo)
          .filter(tipo => tipo && tipo.trim() !== "" && tipo.trim() !== "N/A")
      )];
      
      return tiposInsumoUnicos.sort(); // Ordenar alfabéticamente
    }

    return [];
  } catch (error) {
    console.error("Error al obtener tipos de insumo:", error);
    return [];
  }
};

/**
 * Obtiene los nombres científicos únicos para una lista de objetivos desde catalogo_eficacia_v2
 * Divide los nombres separados por '/' y devuelve un array de strings únicos
 */
export const getNombresCientificosPorObjetivos = async (objetivos: string[]): Promise<string[]> => {
  if (!objetivos.length) return [];
  
  try {
    const { data, error } = await supabase
      .from("catalogo_eficacia_v2")
      .select("nombre_cientifico")
      .in("objetivo_eficacia", objetivos)
      .not("nombre_cientifico", "is", null);

    if (error) {
      console.error("Error al obtener nombres científicos:", error);
      return [];
    }

    if (data) {
      // Extraer y dividir nombres científicos separados por '/'
      const nombresUnicos = new Set<string>();
      
      data.forEach(item => {
        if (item.nombre_cientifico && item.nombre_cientifico.trim() !== "") {
          // Dividir por '/' y agregar cada nombre al Set
          const nombres = item.nombre_cientifico.split('/');
          nombres.forEach(nombre => {
            const nombreLimpio = nombre.trim();
            if (nombreLimpio !== "" && nombreLimpio !== "N/A") {
              nombresUnicos.add(nombreLimpio);
            }
          });
        }
      });
      
      return Array.from(nombresUnicos).sort(); // Convertir a array y ordenar alfabéticamente
    }

    return [];
  } catch (error) {
    console.error("Error al obtener nombres científicos:", error);
    return [];
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

/**
 * Guarda los resultados de eficacia calculados para un montaje
 */
export const saveEfficacyResults = async (
  montajeId: number,
  efficacyResults: { [pruebaId: string]: number },
  pruebasParaRepetir: string[] = []
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Primero eliminar los resultados existentes para este montaje
    const { error: deleteError } = await supabase
      .from("eficacia_de_pruebas")
      .delete()
      .eq("montaje_id", montajeId);

    if (deleteError) {
      console.error("Error al eliminar resultados existentes:", deleteError);
      return { success: false, error: deleteError.message };
    }

    // Preparar los datos para insertar con validación
    const dataToInsert = Object.entries(efficacyResults)
      .filter(([pruebaId, eficacia]) => {
        // Validar que la eficacia sea un número válido
        return !isNaN(Number(eficacia)) && Number.isFinite(Number(eficacia));
      })
      .map(([pruebaId, eficacia]) => ({
        montaje_id: montajeId,
        prueba_id: parseInt(pruebaId),
        eficacia: Number(Number(eficacia).toFixed(2)), // Redondear a 2 decimales
        fecha_calculo: new Date().toISOString()
      }));

    // Insertar los nuevos resultados
    const { error: insertError } = await supabase
      .from("eficacia_de_pruebas")
      .insert(dataToInsert);

    if (insertError) {
      console.error("Error al insertar resultados de eficacia:", insertError);
      return { success: false, error: insertError.message };
    }

    // Obtener los IDs de las pruebas asociadas al montaje
    const { data: pruebasEnMontaje, error: pruebasError } = await supabase
      .from("pruebas_en_montajes")
      .select("prueba_id")
      .eq("montaje_id", montajeId);

    if (pruebasError) {
      console.error("Error al obtener pruebas del montaje:", pruebasError);
      // No fallar completamente, solo registrar el error
      console.warn("No se pudo actualizar el estado de las pruebas, pero los resultados de eficacia se guardaron correctamente");
    } else if (pruebasEnMontaje && pruebasEnMontaje.length > 0) {
      // Actualizar el estado de proceso de todas las pruebas del montaje
      const pruebaIds = pruebasEnMontaje
        .map(relacion => relacion.prueba_id)
        .filter(id => id !== null);

      if (pruebaIds.length > 0) {
        // Separar las pruebas que van para repetición de las que van a completado
        const pruebasCompletadas = pruebaIds.filter(id => !pruebasParaRepetir.includes(id.toString()));
        const pruebasRepeticion = pruebaIds.filter(id => pruebasParaRepetir.includes(id.toString()));

        // Actualizar pruebas completadas
        if (pruebasCompletadas.length > 0) {
          const { error: updateCompletadoError } = await supabase
            .from("pruebas_ordenes_trabajo")
            .update({ prueba_estado_proceso: "Completado" })
            .in("prueba_id", pruebasCompletadas);

          if (updateCompletadoError) {
            console.error("Error al actualizar estado de las pruebas completadas:", updateCompletadoError);
          } else {
            console.log(`Estado actualizado a 'Completado' para ${pruebasCompletadas.length} pruebas del montaje ${montajeId}`);
          }
        }

        // Las pruebas para repetición ya fueron actualizadas previamente por marcarPruebasParaRepeticion
        if (pruebasRepeticion.length > 0) {
          console.log(`${pruebasRepeticion.length} pruebas mantienen estado 'Repetición' del montaje ${montajeId}`);
        }
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Error inesperado al guardar eficacia:", error);
    return { success: false, error: "Error inesperado al guardar los resultados" };
  }
};

/**
 * Obtiene los resultados de eficacia guardados para un montaje
 */
export const getEfficacyResults = async (
  montajeId: number
): Promise<{ [pruebaId: string]: number }> => {
  try {
    const { data, error } = await supabase
      .from("eficacia_de_pruebas")
      .select("prueba_id, eficacia")
      .eq("montaje_id", montajeId);

    if (error) {
      console.error("Error al obtener resultados de eficacia:", error);
      return {};
    }

    // Convertir a formato { pruebaId: eficacia }
    const results: { [pruebaId: string]: number } = {};
    (data || []).forEach(row => {
      if (row.prueba_id && row.eficacia !== null) {
        results[row.prueba_id.toString()] = row.eficacia;
      }
    });

    return results;
  } catch (error) {
    console.error("Error inesperado al obtener eficacia:", error);
    return {};
  }
};

/**
 * Obtiene todas las pruebas individuales de montajes completados (con estado "Eficacia guardada")
 */
export const getPruebasCompletadas = async () => {
  try {
    // Obtener todos los resultados de eficacia guardados con información completa
    const { data: eficaciaResultados, error: eficaciaError } = await supabase
      .from("eficacia_de_pruebas")
      .select(`
        *,
        montajes_de_laboratorio (
          id,
          nombre,
          fecha_creacion,
          cantidad_lecturas,
          cantidad_repeticiones
        ),
        pruebas_ordenes_trabajo (
          prueba_id,
          prueba_orden_id,
          prueba_dosis_producto,
          prueba_producto_unid,
          prueba_compania,
          prueba_contacto,
          productos (producto_nombre),
          objetivos (objetivo_nombre),
          especie_vegetal (especie_nombre),
          fincas (finca_nombre)
        )
      `)
      .order("fecha_calculo", { ascending: false });

    if (eficaciaError) {
      console.error("Error al obtener pruebas completadas:", eficaciaError);
      throw eficaciaError;
    }

    if (!eficaciaResultados || eficaciaResultados.length === 0) {
      return [];
    }

    // Transformar los datos para el formato requerido
    const pruebasCompletadas = eficaciaResultados.map((resultado) => {
      const montaje = resultado.montajes_de_laboratorio;
      const pruebaInfo = resultado.pruebas_ordenes_trabajo;

      return {
        id: `${resultado.prueba_id}-${resultado.montaje_id}`, // ID único combinando prueba y montaje
        pruebaId: resultado.prueba_id?.toString() || "Sin ID",
        montajeId: resultado.montaje_id?.toString() || "Sin montaje",
        nombreMontaje: montaje?.nombre || "Sin nombre",
        ot: pruebaInfo?.prueba_orden_id?.toString() || "Sin OT",
        objetivo: pruebaInfo?.objetivos?.objetivo_nombre || "Sin objetivo",
        finca: pruebaInfo?.fincas?.finca_nombre || "Sin finca",
        especie: pruebaInfo?.especie_vegetal?.especie_nombre || "Sin especie",
        producto: pruebaInfo?.productos?.producto_nombre || "Sin producto",
        dosis: pruebaInfo?.prueba_dosis_producto || "Sin dosis",
        unidades: pruebaInfo?.prueba_producto_unid || "",
        compania: pruebaInfo?.prueba_compania || "Sin compañía",
        contacto: pruebaInfo?.prueba_contacto || "Sin contacto",
        fechaCreacionMontaje: montaje?.fecha_creacion ? new Date(montaje.fecha_creacion).toLocaleDateString() : "Sin fecha",
        fechaCompletado: new Date(resultado.fecha_calculo || '').toLocaleDateString(),
        numeroLecturas: montaje?.cantidad_lecturas || 0,
        numeroRepeticiones: montaje?.cantidad_repeticiones || 0,
        eficacia: resultado.eficacia || 0,
        estado: "Eficacia guardada" as const
      };
    });

    return pruebasCompletadas;

  } catch (error) {
    console.error("Error al obtener pruebas completadas:", error);
    throw error;
  }
};

/**
 * Obtiene todos los montajes completados (con estado "Eficacia guardada")
 */
export const getMontajesCompletados = async () => {
  try {
    // Primero obtener todos los montajes que tienen resultados de eficacia guardados
    const { data: montajesConEficacia, error: eficaciaError } = await supabase
      .from("eficacia_de_pruebas")
      .select("montaje_id")
      .order("fecha_calculo", { ascending: false });

    if (eficaciaError) {
      console.error("Error al obtener montajes con eficacia:", eficaciaError);
      throw eficaciaError;
    }

    // Obtener IDs únicos de montajes con eficacia
    const montajeIds = [...new Set(montajesConEficacia?.map(e => e.montaje_id).filter(id => id !== null) || [])] as number[];

    if (montajeIds.length === 0) {
      return [];
    }

    // Obtener detalles de los montajes
    const { data: montajes, error: montajesError } = await supabase
      .from("montajes_de_laboratorio")
      .select("*")
      .in("id", montajeIds)
      .order("fecha_creacion", { ascending: false });

    if (montajesError) {
      console.error("Error al obtener montajes completados:", montajesError);
      throw montajesError;
    }

    // Para cada montaje, obtener información completa incluyendo eficacia
    const montajesCompletosConInfo = await Promise.all(
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

        // Obtener resultados de eficacia
        const { data: eficaciaResultados, error: eficaciaError } = await supabase
          .from("eficacia_de_pruebas")
          .select("*")
          .eq("montaje_id", montaje.id);

        if (eficaciaError) {
          console.error("Error al obtener eficacia del montaje:", eficaciaError);
          return null;
        }

        // Calcular eficacia promedio
        const eficaciaPromedio = eficaciaResultados && eficaciaResultados.length > 0
          ? eficaciaResultados.reduce((sum, r) => sum + (r.eficacia || 0), 0) / eficaciaResultados.length
          : 0;

        // Extraer información para el formato requerido
        const pruebas = pruebasRelaciones?.map(rel => (rel.prueba_id || 0).toString()) || [];
        const productos = pruebasRelaciones?.map(rel => 
          rel.pruebas_ordenes_trabajo?.productos?.producto_nombre || "Sin producto"
        ) || [];

        // Obtener información de OTs únicas
        const otsUnicas = [...new Set(pruebasRelaciones?.map(rel => 
          rel.pruebas_ordenes_trabajo?.prueba_orden_id?.toString()
        ).filter(Boolean))];
        const ot = otsUnicas.length > 0 ? otsUnicas.join(", ") : "Sin OT";
        
        // Obtener información del primer OT para contexto
        const primeraPrueba = pruebasRelaciones?.[0]?.pruebas_ordenes_trabajo;
        const objetivo = primeraPrueba?.objetivos?.objetivo_nombre || "Sin objetivo";
        const finca = primeraPrueba?.fincas?.finca_nombre || "Sin finca";
        const especie = primeraPrueba?.especie_vegetal?.especie_nombre || "Sin especie";

        // Fecha de completado (última fecha de cálculo)
        const fechaCompletado = eficaciaResultados && eficaciaResultados.length > 0
          ? Math.max(...eficaciaResultados.map(r => new Date(r.fecha_calculo || '').getTime()).filter(t => !isNaN(t)))
          : null;

        return {
          id: montaje.id.toString(),
          nombreMontaje: montaje.nombre || "Sin nombre",
          ot,
          objetivo,
          finca,
          especie,
          fechaCreacion: montaje.fecha_creacion ? new Date(montaje.fecha_creacion).toLocaleDateString() : "Sin fecha",
          fechaCompletado: fechaCompletado ? new Date(fechaCompletado).toLocaleDateString() : "Sin fecha",
          numeroLecturas: montaje.cantidad_lecturas || 0,
          lecturasCompletadas: montaje.cantidad_lecturas || 0, // Si tiene eficacia guardada, todas las lecturas están completas
          numeroRepeticiones: montaje.cantidad_repeticiones || 0,
          pruebas,
          productos,
          eficaciaPromedio,
          eficaciaResultados: eficaciaResultados || [],
          estado: "Eficacia guardada" as const
        };
      })
    );

    // Filtrar montajes que fallaron al cargar
    return montajesCompletosConInfo.filter(montaje => montaje !== null);

  } catch (error) {
    console.error("Error al obtener montajes completados:", error);
    throw error;
  }
};

/**
 * Actualiza la asignación de un montaje a una persona específica
 */
export const updateMontajeAssignment = async (
  montajeId: number,
  asignadoA: string | null
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from("montajes_de_laboratorio")
      .update({ asignado_a: asignadoA })
      .eq("id", montajeId);

    if (error) {
      console.error("Error al actualizar asignación del montaje:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Error al actualizar asignación del montaje:", error);
    return { success: false, error: "Error inesperado al actualizar la asignación" };
  }
};

/**
 * Genera y descarga un informe DOCX con las pruebas completadas seleccionadas
 */
export const generatePruebasCompletadasReport = async (pruebasCompletadas: any[]) => {
  try {
    // Agrupar pruebas por montaje para organizar mejor el informe
    const pruebasPorMontaje = pruebasCompletadas.reduce((acc, prueba) => {
      const montajeId = prueba.montajeId;
      if (!acc[montajeId]) {
        acc[montajeId] = {
          nombreMontaje: prueba.nombreMontaje,
          fechaCreacionMontaje: prueba.fechaCreacionMontaje,
          numeroLecturas: prueba.numeroLecturas,
          numeroRepeticiones: prueba.numeroRepeticiones,
          pruebas: []
        };
      }
      acc[montajeId].pruebas.push(prueba);
      return acc;
    }, {} as any);

    // Crear el documento
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            // Título principal
            new Paragraph({
              text: "INFORME DE PRUEBAS COMPLETADAS",
              heading: HeadingLevel.TITLE,
              alignment: "center",
              spacing: {
                after: 400,
              },
            }),

            // Información general
            new Paragraph({
              children: [
                new TextRun({
                  text: "Fecha de generación: ",
                  bold: true,
                }),
                new TextRun({
                  text: new Date().toLocaleDateString("es-ES", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  }),
                }),
              ],
              spacing: {
                after: 200,
              },
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: "Total de pruebas incluidas: ",
                  bold: true,
                }),
                new TextRun({
                  text: pruebasCompletadas.length.toString(),
                }),
              ],
              spacing: {
                after: 200,
              },
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: "Pruebas con eficacia revisada: ",
                  bold: true,
                }),
                new TextRun({
                  text: pruebasCompletadas.filter((p: any) => p.eficaciaModificada).length.toString(),
                  color: pruebasCompletadas.filter((p: any) => p.eficaciaModificada).length > 0 ? "0066CC" : "000000",
                }),
              ],
              spacing: {
                after: 200,
              },
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: "Montajes involucrados: ",
                  bold: true,
                }),
                new TextRun({
                  text: Object.keys(pruebasPorMontaje).length.toString(),
                }),
              ],
              spacing: {
                after: 400,
              },
            }),

            // Tabla resumen de pruebas
            new Table({
              width: {
                size: 100,
                type: WidthType.PERCENTAGE,
              },
              rows: [
                // Encabezado
                new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: "Prueba ID", bold: true })] })],
                      width: { size: 8, type: WidthType.PERCENTAGE },
                    }),
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: "Montaje", bold: true })] })],
                      width: { size: 14, type: WidthType.PERCENTAGE },
                    }),
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: "OT", bold: true })] })],
                      width: { size: 7, type: WidthType.PERCENTAGE },
                    }),
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: "Producto", bold: true })] })],
                      width: { size: 13, type: WidthType.PERCENTAGE },
                    }),
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: "Dosis", bold: true })] })],
                      width: { size: 10, type: WidthType.PERCENTAGE },
                    }),
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: "Finca", bold: true })] })],
                      width: { size: 10, type: WidthType.PERCENTAGE },
                    }),
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: "Especie", bold: true })] })],
                      width: { size: 8, type: WidthType.PERCENTAGE },
                    }),
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: "Compañía", bold: true })] })],
                      width: { size: 10, type: WidthType.PERCENTAGE },
                    }),
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: "Contacto", bold: true })] })],
                      width: { size: 10, type: WidthType.PERCENTAGE },
                    }),
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: "Fecha Completado", bold: true })] })],
                      width: { size: 8, type: WidthType.PERCENTAGE },
                    }),
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: "Eficacia (%)", bold: true })] })],
                      width: { size: 10, type: WidthType.PERCENTAGE },
                    }),
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: "Estado", bold: true })] })],
                      width: { size: 8, type: WidthType.PERCENTAGE },
                    }),
                  ],
                }),
                // Filas de datos
                ...pruebasCompletadas.map(
                  (prueba) =>
                    new TableRow({
                      children: [
                        new TableCell({
                          children: [new Paragraph({ text: prueba.pruebaId || "Sin ID" })],
                        }),
                        new TableCell({
                          children: [new Paragraph({ text: prueba.nombreMontaje || "Sin montaje" })],
                        }),
                        new TableCell({
                          children: [new Paragraph({ text: prueba.ot || "Sin OT" })],
                        }),
                        new TableCell({
                          children: [new Paragraph({ text: prueba.producto || "Sin producto" })],
                        }),
                        new TableCell({
                          children: [new Paragraph({ text: `${prueba.dosis || "Sin dosis"} ${prueba.unidades || ""}`.trim() })],
                        }),
                        new TableCell({
                          children: [new Paragraph({ text: prueba.finca || "Sin finca" })],
                        }),
                        new TableCell({
                          children: [new Paragraph({ text: prueba.especie || "Sin especie" })],
                        }),
                        new TableCell({
                          children: [new Paragraph({ text: prueba.compania || "Sin compañía" })],
                        }),
                        new TableCell({
                          children: [new Paragraph({ text: prueba.contacto || "Sin contacto" })],
                        }),
                        new TableCell({
                          children: [new Paragraph({ text: prueba.fechaCompletado || "Sin fecha" })],
                        }),
                        new TableCell({
                          children: [new Paragraph({ 
                            children: [
                              new TextRun({ 
                                text: `${(prueba.eficacia || 0).toFixed(1)}%`,
                                color: (prueba.eficacia || 0) >= 80 ? "00B050" : (prueba.eficacia || 0) >= 60 ? "FF9900" : "FF0000",
                                bold: true 
                              }),
                              ...(prueba.eficaciaModificada && prueba.eficaciaOriginal !== undefined 
                                ? [new TextRun({ text: ` (Original: ${prueba.eficaciaOriginal.toFixed(1)}%)`, size: 16 })]
                                : []
                              )
                            ]
                          })],
                        }),
                        new TableCell({
                          children: [new Paragraph({ 
                            children: [new TextRun({ 
                              text: prueba.eficaciaModificada ? "Revisada" : "Original",
                              color: prueba.eficaciaModificada ? "0066CC" : "000000",
                              bold: prueba.eficaciaModificada 
                            })] 
                          })],
                        }),
                      ],
                    })
                ),
              ],
            }),

            // Detalles por montaje
            new Paragraph({
              text: "DETALLES POR MONTAJE",
              heading: HeadingLevel.HEADING_1,
              spacing: {
                before: 600,
                after: 300,
              },
            }),

            // Generar detalles para cada montaje
            ...Object.entries(pruebasPorMontaje).flatMap(([montajeId, montajeInfo]: [string, any], index) => [
              new Paragraph({
                text: `${index + 1}. ${montajeInfo.nombreMontaje}`,
                heading: HeadingLevel.HEADING_2,
                spacing: {
                  before: 400,
                  after: 200,
                },
              }),

              new Paragraph({
                children: [
                  new TextRun({ text: "ID del Montaje: ", bold: true }),
                  new TextRun({ text: montajeId }),
                ],
              }),

              new Paragraph({
                children: [
                  new TextRun({ text: "Fecha de creación: ", bold: true }),
                  new TextRun({ text: montajeInfo.fechaCreacionMontaje || "Sin fecha" }),
                ],
              }),

              new Paragraph({
                children: [
                  new TextRun({ text: "Número de lecturas: ", bold: true }),
                  new TextRun({ text: montajeInfo.numeroLecturas?.toString() || "0" }),
                ],
              }),

              new Paragraph({
                children: [
                  new TextRun({ text: "Número de repeticiones: ", bold: true }),
                  new TextRun({ text: montajeInfo.numeroRepeticiones?.toString() || "0" }),
                ],
              }),

              new Paragraph({
                children: [
                  new TextRun({ text: "Pruebas incluidas: ", bold: true }),
                  new TextRun({ text: montajeInfo.pruebas.length.toString() }),
                ],
              }),

              new Paragraph({
                children: [
                  new TextRun({ text: "Eficacia promedio del montaje: ", bold: true }),
                  new TextRun({
                    text: `${(montajeInfo.pruebas.reduce((sum: number, p: any) => sum + (p.eficacia || 0), 0) / montajeInfo.pruebas.length).toFixed(1)}%`,
                    color: (montajeInfo.pruebas.reduce((sum: number, p: any) => sum + (p.eficacia || 0), 0) / montajeInfo.pruebas.length) >= 80 ? "00B050" : 
                           (montajeInfo.pruebas.reduce((sum: number, p: any) => sum + (p.eficacia || 0), 0) / montajeInfo.pruebas.length) >= 60 ? "FF9900" : "FF0000",
                    bold: true,
                  }),
                ],
              }),

              // Tabla de pruebas de este montaje
              new Paragraph({
                children: [new TextRun({ text: "Detalle de pruebas:", bold: true })],
                spacing: { before: 200, after: 100 },
              }),
              new Table({
                width: { size: 90, type: WidthType.PERCENTAGE },
                rows: [
                  new TableRow({
                    children: [
                      new TableCell({
                        children: [new Paragraph({ children: [new TextRun({ text: "Prueba ID", bold: true })] })],
                      }),
                      new TableCell({
                        children: [new Paragraph({ children: [new TextRun({ text: "OT", bold: true })] })],
                      }),
                      new TableCell({
                        children: [new Paragraph({ children: [new TextRun({ text: "Producto", bold: true })] })],
                      }),
                      new TableCell({
                        children: [new Paragraph({ children: [new TextRun({ text: "Objetivo", bold: true })] })],
                      }),
                      new TableCell({
                        children: [new Paragraph({ children: [new TextRun({ text: "Eficacia (%)", bold: true })] })],
                      }),
                    ],
                  }),
                  ...montajeInfo.pruebas.map(
                    (prueba: any) =>
                      new TableRow({
                        children: [
                          new TableCell({
                            children: [new Paragraph({ text: prueba.pruebaId || "N/A" })],
                          }),
                          new TableCell({
                            children: [new Paragraph({ text: prueba.ot || "N/A" })],
                          }),
                          new TableCell({
                            children: [new Paragraph({ text: prueba.producto || "N/A" })],
                          }),
                          new TableCell({
                            children: [new Paragraph({ text: prueba.objetivo || "N/A" })],
                          }),
                          new TableCell({
                            children: [new Paragraph({ text: `${(prueba.eficacia || 0).toFixed(1)}%` })],
                          }),
                        ],
                      })
                  ),
                ],
              }),

              new Paragraph({ text: "" }), // Línea en blanco
            ]),

            // Pie de página con estadísticas
            new Paragraph({
              text: "RESUMEN ESTADÍSTICO",
              heading: HeadingLevel.HEADING_1,
              spacing: {
                before: 600,
                after: 300,
              },
            }),

            new Paragraph({
              children: [
                new TextRun({ text: "Eficacia promedio general: ", bold: true }),
                new TextRun({
                  text: `${(
                    pruebasCompletadas.reduce((sum, p) => sum + (p.eficacia || 0), 0) /
                    pruebasCompletadas.length
                  ).toFixed(1)}%`,
                  bold: true,
                }),
              ],
            }),

            new Paragraph({
              children: [
                new TextRun({ text: "Pruebas con eficacia alta (≥80%): ", bold: true }),
                new TextRun({
                  text: pruebasCompletadas.filter((p) => (p.eficacia || 0) >= 80).length.toString(),
                }),
              ],
            }),

            new Paragraph({
              children: [
                new TextRun({ text: "Pruebas con eficacia media (60-79%): ", bold: true }),
                new TextRun({
                  text: pruebasCompletadas.filter((p) => (p.eficacia || 0) >= 60 && (p.eficacia || 0) < 80).length.toString(),
                }),
              ],
            }),

            new Paragraph({
              children: [
                new TextRun({ text: "Pruebas con eficacia baja (<60%): ", bold: true }),
                new TextRun({
                  text: pruebasCompletadas.filter((p) => (p.eficacia || 0) < 60).length.toString(),
                }),
              ],
            }),
          ],
        },
      ],
    });

    // Generar el blob y descargar el archivo
    const blob = await Packer.toBlob(doc);
    const fecha = new Date().toISOString().split("T")[0];
    const tieneRevisadas = pruebasCompletadas.some((p: any) => p.eficaciaModificada);
    const nombreArchivo = tieneRevisadas 
      ? `Informe_Pruebas_Revisadas_${fecha}.docx`
      : `Informe_Pruebas_Completadas_${fecha}.docx`;
    
    saveAs(blob, nombreArchivo);
    
    return { success: true, fileName: nombreArchivo };
  } catch (error) {
    console.error("Error al generar informe DOCX:", error);
    return { success: false, error: "Error al generar el informe" };
  }
};

/**
 * Genera y descarga un informe DOCX con los montajes completados seleccionados
 * @deprecated Usar generatePruebasCompletadasReport en su lugar
 */
/**
 * Actualiza los detalles editables de un montaje (nombre, variedad, nombres de lecturas)
 */
export const updateMontajeDetails = async (
  montajeId: number,
  details: {
    nombre?: string;
    variedad?: string;
    nombres_lecturas?: string[];
  }
): Promise<{ success: boolean; error?: string }> => {
  try {
    const updates: any = {};
    
    if (details.nombre !== undefined) {
      updates.nombre = details.nombre;
    }
    
    if (details.variedad !== undefined) {
      updates.variedad = details.variedad;
    }
    
    if (details.nombres_lecturas !== undefined) {
      // Obtener los nombres de lecturas actuales para saber qué actualizar
      const { data: montajeActual, error: montajeError } = await supabase
        .from("montajes_de_laboratorio")
        .select("nombres_lecturas")
        .eq("id", montajeId)
        .single();

      if (montajeError) {
        console.error("Error al obtener montaje actual:", montajeError);
        return { success: false, error: montajeError.message };
      }

      const nombresAnteriores: string[] = Array.isArray(montajeActual?.nombres_lecturas) 
        ? montajeActual.nombres_lecturas as string[]
        : [];
      const nuevosNombres = details.nombres_lecturas;

      // Actualizar nombres en resultados_lecturas si hay cambios
      if (nombresAnteriores.length > 0) {
        for (let i = 0; i < Math.min(nombresAnteriores.length, nuevosNombres.length); i++) {
          const nombreAnterior = nombresAnteriores[i];
          const nuevoNombre = nuevosNombres[i];
          
          if (nombreAnterior && nuevoNombre && nombreAnterior !== nuevoNombre) {
            // Actualizar resultados_lecturas con el nuevo nombre
            const { error: updateResultsError } = await supabase
              .from("resultados_lecturas")
              .update({ nombre_lectura: nuevoNombre })
              .eq("montaje_id", montajeId)
              .eq("nombre_lectura", nombreAnterior);

            if (updateResultsError) {
              console.error("Error al actualizar nombres en resultados_lecturas:", updateResultsError);
              // Continuar con otras actualizaciones aunque esta falle
            } else {
              console.log(`Nombre de lectura actualizado: "${nombreAnterior}" → "${nuevoNombre}"`);
            }
          }
        }
      }

      updates.nombres_lecturas = details.nombres_lecturas;
      // CRÍTICO: Actualizar también cantidad_lecturas para mantener sincronización
      updates.cantidad_lecturas = details.nombres_lecturas.length;
    }

    const { error } = await supabase
      .from("montajes_de_laboratorio")
      .update(updates)
      .eq("id", montajeId);

    if (error) {
      console.error("Error al actualizar detalles del montaje:", error);
      return { success: false, error: error.message };
    }

    console.log("Detalles del montaje actualizados exitosamente:", {
      montajeId,
      updates
    });

    return { success: true };

  } catch (error) {
    console.error("Error inesperado al actualizar detalles del montaje:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Error desconocido" 
    };
  }
};

export const generateMontajesCompletadosReport = async (montajesCompletados: any[]) => {
  try {
    // Crear el documento
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            // Título principal
            new Paragraph({
              text: "INFORME DE MONTAJES COMPLETADOS",
              heading: HeadingLevel.TITLE,
              alignment: "center",
              spacing: {
                after: 400,
              },
            }),

            // Información general
            new Paragraph({
              children: [
                new TextRun({
                  text: "Fecha de generación: ",
                  bold: true,
                }),
                new TextRun({
                  text: new Date().toLocaleDateString("es-ES", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  }),
                }),
              ],
              spacing: {
                after: 200,
              },
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: "Total de montajes incluidos: ",
                  bold: true,
                }),
                new TextRun({
                  text: montajesCompletados.length.toString(),
                }),
              ],
              spacing: {
                after: 400,
              },
            }),

            // Tabla resumen
            new Table({
              width: {
                size: 100,
                type: WidthType.PERCENTAGE,
              },
              rows: [
                // Encabezado
                new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: "Montaje", bold: true })] })],
                      width: { size: 20, type: WidthType.PERCENTAGE },
                    }),
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: "OT", bold: true })] })],
                      width: { size: 10, type: WidthType.PERCENTAGE },
                    }),
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: "Objetivo", bold: true })] })],
                      width: { size: 15, type: WidthType.PERCENTAGE },
                    }),
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: "Finca", bold: true })] })],
                      width: { size: 15, type: WidthType.PERCENTAGE },
                    }),
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: "Especie", bold: true })] })],
                      width: { size: 15, type: WidthType.PERCENTAGE },
                    }),
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: "Fecha Completado", bold: true })] })],
                      width: { size: 15, type: WidthType.PERCENTAGE },
                    }),
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: "Eficacia (%)", bold: true })] })],
                      width: { size: 10, type: WidthType.PERCENTAGE },
                    }),
                  ],
                }),
                // Filas de datos
                ...montajesCompletados.map(
                  (montaje) =>
                    new TableRow({
                      children: [
                        new TableCell({
                          children: [new Paragraph({ text: montaje.nombreMontaje || "Sin nombre" })],
                        }),
                        new TableCell({
                          children: [new Paragraph({ text: montaje.ot || "Sin OT" })],
                        }),
                        new TableCell({
                          children: [new Paragraph({ text: montaje.objetivo || "Sin objetivo" })],
                        }),
                        new TableCell({
                          children: [new Paragraph({ text: montaje.finca || "Sin finca" })],
                        }),
                        new TableCell({
                          children: [new Paragraph({ text: montaje.especie || "Sin especie" })],
                        }),
                        new TableCell({
                          children: [new Paragraph({ text: montaje.fechaCompletado || "Sin fecha" })],
                        }),
                        new TableCell({
                          children: [new Paragraph({ text: `${(montaje.eficaciaPromedio || 0).toFixed(1)}%` })],
                        }),
                      ],
                    })
                ),
              ],
            }),

            // Detalles por montaje
            new Paragraph({
              text: "DETALLES POR MONTAJE",
              heading: HeadingLevel.HEADING_1,
              spacing: {
                before: 600,
                after: 300,
              },
            }),

            // Generar detalles para cada montaje
            ...montajesCompletados.flatMap((montaje, index) => [
              new Paragraph({
                text: `${index + 1}. ${montaje.nombreMontaje || "Sin nombre"}`,
                heading: HeadingLevel.HEADING_2,
                spacing: {
                  before: 400,
                  after: 200,
                },
              }),

              new Paragraph({
                children: [
                  new TextRun({ text: "Orden de Trabajo: ", bold: true }),
                  new TextRun({ text: montaje.ot || "Sin OT" }),
                ],
              }),

              new Paragraph({
                children: [
                  new TextRun({ text: "Objetivo: ", bold: true }),
                  new TextRun({ text: montaje.objetivo || "Sin objetivo" }),
                ],
              }),

              new Paragraph({
                children: [
                  new TextRun({ text: "Finca: ", bold: true }),
                  new TextRun({ text: montaje.finca || "Sin finca" }),
                ],
              }),

              new Paragraph({
                children: [
                  new TextRun({ text: "Especie: ", bold: true }),
                  new TextRun({ text: montaje.especie || "Sin especie" }),
                ],
              }),

              new Paragraph({
                children: [
                  new TextRun({ text: "Productos utilizados: ", bold: true }),
                  new TextRun({ text: (montaje.productos || []).join(", ") || "Sin productos" }),
                ],
              }),

              new Paragraph({
                children: [
                  new TextRun({ text: "Compañías involucradas: ", bold: true }),
                  new TextRun({ text: [...new Set(montaje.pruebas.map((p: any) => p.compania).filter(Boolean))].join(", ") || "Sin compañías" }),
                ],
              }),

              new Paragraph({
                children: [
                  new TextRun({ text: "Contactos: ", bold: true }),
                  new TextRun({ text: [...new Set(montaje.pruebas.map((p: any) => p.contacto).filter(Boolean))].join(", ") || "Sin contactos" }),
                ],
              }),

              new Paragraph({
                children: [
                  new TextRun({ text: "Número de lecturas: ", bold: true }),
                  new TextRun({ text: (montaje.numeroLecturas || 0).toString() }),
                ],
              }),

              new Paragraph({
                children: [
                  new TextRun({ text: "Número de repeticiones: ", bold: true }),
                  new TextRun({ text: (montaje.numeroRepeticiones || 0).toString() }),
                ],
              }),

              new Paragraph({
                children: [
                  new TextRun({ text: "Fecha de creación: ", bold: true }),
                  new TextRun({ text: montaje.fechaCreacion || "Sin fecha" }),
                ],
              }),

              new Paragraph({
                children: [
                  new TextRun({ text: "Fecha de completado: ", bold: true }),
                  new TextRun({ text: montaje.fechaCompletado || "Sin fecha" }),
                ],
              }),

              new Paragraph({
                children: [
                  new TextRun({ text: "Eficacia promedio: ", bold: true }),
                  new TextRun({
                    text: `${(montaje.eficaciaPromedio || 0).toFixed(1)}%`,
                    color: montaje.eficaciaPromedio >= 80 ? "00B050" : montaje.eficaciaPromedio >= 60 ? "FF9900" : "FF0000",
                    bold: true,
                  }),
                ],
              }),

              // Tabla de resultados de eficacia por prueba (si está disponible)
              ...(montaje.eficaciaResultados && montaje.eficaciaResultados.length > 0
                ? [
                    new Paragraph({
                      children: [new TextRun({ text: "Resultados por prueba:", bold: true })],
                      spacing: { before: 200, after: 100 },
                    }),
                    new Table({
                      width: { size: 80, type: WidthType.PERCENTAGE },
                      rows: [
                        new TableRow({
                          children: [
                            new TableCell({
                              children: [new Paragraph({ children: [new TextRun({ text: "Prueba ID", bold: true })] })],
                            }),
                            new TableCell({
                              children: [new Paragraph({ children: [new TextRun({ text: "Eficacia (%)", bold: true })] })],
                            }),
                          ],
                        }),
                        ...montaje.eficaciaResultados.map(
                          (resultado: any) =>
                            new TableRow({
                              children: [
                                new TableCell({
                                  children: [new Paragraph({ text: resultado.prueba_id?.toString() || "N/A" })],
                                }),
                                new TableCell({
                                  children: [new Paragraph({ text: `${(resultado.eficacia || 0).toFixed(1)}%` })],
                                }),
                              ],
                            })
                        ),
                      ],
                    }),
                  ]
                : []),

              new Paragraph({ text: "" }), // Línea en blanco
            ]),

            // Pie de página con estadísticas
            new Paragraph({
              text: "RESUMEN ESTADÍSTICO",
              heading: HeadingLevel.HEADING_1,
              spacing: {
                before: 600,
                after: 300,
              },
            }),

            new Paragraph({
              children: [
                new TextRun({ text: "Eficacia promedio general: ", bold: true }),
                new TextRun({
                  text: `${(
                    montajesCompletados.reduce((sum, m) => sum + (m.eficaciaPromedio || 0), 0) /
                    montajesCompletados.length
                  ).toFixed(1)}%`,
                  bold: true,
                }),
              ],
            }),

            new Paragraph({
              children: [
                new TextRun({ text: "Montajes con eficacia alta (≥80%): ", bold: true }),
                new TextRun({
                  text: montajesCompletados.filter((m) => (m.eficaciaPromedio || 0) >= 80).length.toString(),
                }),
              ],
            }),

            new Paragraph({
              children: [
                new TextRun({ text: "Montajes con eficacia media (60-79%): ", bold: true }),
                new TextRun({
                  text: montajesCompletados.filter((m) => (m.eficaciaPromedio || 0) >= 60 && (m.eficaciaPromedio || 0) < 80).length.toString(),
                }),
              ],
            }),

            new Paragraph({
              children: [
                new TextRun({ text: "Montajes con eficacia baja (<60%): ", bold: true }),
                new TextRun({
                  text: montajesCompletados.filter((m) => (m.eficaciaPromedio || 0) < 60).length.toString(),
                }),
              ],
            }),
          ],
        },
      ],
    });

    // Generar el blob y descargar el archivo
    const blob = await Packer.toBlob(doc);
    const fecha = new Date().toISOString().split("T")[0];
    const nombreArchivo = `Informe_Montajes_Completados_${fecha}.docx`;
    
    saveAs(blob, nombreArchivo);
    
    return { success: true, fileName: nombreArchivo };
  } catch (error) {
    console.error("Error al generar informe DOCX:", error);
    return { success: false, error: "Error al generar el informe" };
  }
};

/**
 * Busca protocolos específicos en catalogo_eficacia_v2 basándose en los campos del montaje
 * Utiliza duracion, tipo_de_evaluacion, tipo_insumo para encontrar protocolos exactos
 */
export const buscarProtocolosPorMontaje = async (
  montajeId: number
): Promise<{
  success: boolean;
  protocolos?: any[];
  montajeInfo?: any;
  error?: string;
}> => {
  try {
    // 1. Obtener información del montaje incluyendo los nuevos campos
    const { data: montajeData, error: montajeError } = await supabase
      .from("montajes_de_laboratorio")
      .select(`
        id,
        nombre,
        tipo_evaluacion,
        duracion_prueba,
        tipo_insumo,
        fecha_creacion,
        cantidad_lecturas,
        cantidad_repeticiones
      `)
      .eq("id", montajeId)
      .single();

    if (montajeError || !montajeData) {
      console.error("Error al obtener datos del montaje:", montajeError);
      return { success: false, error: "No se pudo obtener la información del montaje" };
    }

    // 2. Verificar que el montaje tenga los campos necesarios
    if (!montajeData.tipo_evaluacion || !montajeData.duracion_prueba || !montajeData.tipo_insumo) {
      return { 
        success: false, 
        error: "El montaje no tiene configurados los campos necesarios (tipo_evaluacion, duracion_prueba, tipo_insumo)" 
      };
    }

    // 3. Buscar protocolos en catalogo_eficacia_v2 que coincidan con los criterios
    const { data: protocolos, error: protocolosError } = await supabase
      .from("catalogo_eficacia_v2")
      .select("*")
      .eq("tipo_de_evaluacion", montajeData.tipo_evaluacion)
      .eq("duracion", montajeData.duracion_prueba)
      .eq("tipo_insumo", montajeData.tipo_insumo);

    if (protocolosError) {
      console.error("Error al buscar protocolos:", protocolosError);
      return { success: false, error: "Error al buscar protocolos en el catálogo" };
    }

    console.log("Protocolos encontrados:", {
      montajeId,
      criterios: {
        tipo_evaluacion: montajeData.tipo_evaluacion,
        duracion: montajeData.duracion_prueba,
        tipo_insumo: montajeData.tipo_insumo
      },
      protocolosEncontrados: protocolos?.length || 0
    });

    return {
      success: true,
      protocolos: protocolos || [],
      montajeInfo: montajeData
    };

  } catch (error) {
    console.error("Error inesperado al buscar protocolos:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Error desconocido" 
    };
  }
};

/**
 * Genera un informe de protocolos encontrados para un montaje específico
 */
export const generateProtocolosReport = async (montajeId: number) => {
  try {
    // Buscar protocolos para el montaje
    const resultado = await buscarProtocolosPorMontaje(montajeId);
    
    if (!resultado.success) {
      return { success: false, error: resultado.error };
    }

    const { protocolos, montajeInfo } = resultado;

    if (!protocolos || protocolos.length === 0) {
      return { 
        success: false, 
        error: "No se encontraron protocolos que coincidan con los criterios del montaje" 
      };
    }

    // Crear el documento
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            // Título principal
            new Paragraph({
              text: "INFORME DE PROTOCOLOS ENCONTRADOS",
              heading: HeadingLevel.TITLE,
              alignment: "center",
              spacing: {
                after: 400,
              },
            }),

            // Información del montaje
            new Paragraph({
              text: "INFORMACIÓN DEL MONTAJE",
              heading: HeadingLevel.HEADING_1,
              spacing: {
                before: 300,
                after: 200,
              },
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: "Nombre del montaje: ",
                  bold: true,
                }),
                new TextRun({
                  text: montajeInfo.nombre || "Sin nombre",
                }),
              ],
              spacing: { after: 100 },
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: "ID del montaje: ",
                  bold: true,
                }),
                new TextRun({
                  text: montajeInfo.id.toString(),
                }),
              ],
              spacing: { after: 100 },
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: "Fecha de creación: ",
                  bold: true,
                }),
                new TextRun({
                  text: new Date(montajeInfo.fecha_creacion).toLocaleDateString("es-ES"),
                }),
              ],
              spacing: { after: 100 },
            }),

            // Criterios de búsqueda
            new Paragraph({
              text: "CRITERIOS DE BÚSQUEDA",
              heading: HeadingLevel.HEADING_2,
              spacing: {
                before: 300,
                after: 200,
              },
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: "Tipo de evaluación: ",
                  bold: true,
                }),
                new TextRun({
                  text: montajeInfo.tipo_evaluacion,
                  color: "0066CC",
                }),
              ],
              spacing: { after: 100 },
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: "Duración de prueba: ",
                  bold: true,
                }),
                new TextRun({
                  text: montajeInfo.duracion_prueba,
                  color: "0066CC",
                }),
              ],
              spacing: { after: 100 },
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: "Tipo de insumo: ",
                  bold: true,
                }),
                new TextRun({
                  text: montajeInfo.tipo_insumo,
                  color: "0066CC",
                }),
              ],
              spacing: { after: 200 },
            }),

            // Resultados
            new Paragraph({
              text: "PROTOCOLOS ENCONTRADOS",
              heading: HeadingLevel.HEADING_1,
              spacing: {
                before: 400,
                after: 200,
              },
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: "Total de protocolos encontrados: ",
                  bold: true,
                }),
                new TextRun({
                  text: protocolos.length.toString(),
                  color: protocolos.length > 0 ? "00B050" : "FF0000",
                  bold: true,
                }),
              ],
              spacing: { after: 300 },
            }),

            // Tabla de protocolos
            new Table({
              width: {
                size: 100,
                type: WidthType.PERCENTAGE,
              },
              rows: [
                // Encabezado
                new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: "Objetivo Eficacia", bold: true })] })],
                      width: { size: 20, type: WidthType.PERCENTAGE },
                    }),
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: "Método Cálculo", bold: true })] })],
                      width: { size: 15, type: WidthType.PERCENTAGE },
                    }),
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: "Registro Datos", bold: true })] })],
                      width: { size: 15, type: WidthType.PERCENTAGE },
                    }),
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: "Aplicación Tratamiento", bold: true })] })],
                      width: { size: 15, type: WidthType.PERCENTAGE },
                    }),
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: "Condiciones Ambientales", bold: true })] })],
                      width: { size: 15, type: WidthType.PERCENTAGE },
                    }),
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: "Plaga/Enfermedad", bold: true })] })],
                      width: { size: 20, type: WidthType.PERCENTAGE },
                    }),
                  ],
                }),
                // Filas de datos
                ...protocolos.map(
                  (protocolo) =>
                    new TableRow({
                      children: [
                        new TableCell({
                          children: [new Paragraph({ text: protocolo.objetivo_eficacia || "N/A" })],
                        }),
                        new TableCell({
                          children: [new Paragraph({ text: protocolo.metodo_calculo_de_eficacia || "N/A" })],
                        }),
                        new TableCell({
                          children: [new Paragraph({ text: protocolo.registro_de_datos || "N/A" })],
                        }),
                        new TableCell({
                          children: [new Paragraph({ text: protocolo.aplicacion_de_tratamiento || "N/A" })],
                        }),
                        new TableCell({
                          children: [new Paragraph({ text: protocolo.condiciones_ambientales || "N/A" })],
                        }),
                        new TableCell({
                          children: [new Paragraph({ text: protocolo.plaga_enfermedad || "N/A" })],
                        }),
                      ],
                    })
                ),
              ],
            }),

            // Detalles adicionales de cada protocolo
            new Paragraph({
              text: "DETALLES DE PROTOCOLOS",
              heading: HeadingLevel.HEADING_1,
              spacing: {
                before: 600,
                after: 300,
              },
            }),

            ...protocolos.flatMap((protocolo, index) => [
              new Paragraph({
                text: `${index + 1}. ${protocolo.objetivo_eficacia || "Protocolo sin objetivo"}`,
                heading: HeadingLevel.HEADING_2,
                spacing: {
                  before: 400,
                  after: 200,
                },
              }),

              new Paragraph({
                children: [
                  new TextRun({ text: "Número de repeticiones: ", bold: true }),
                  new TextRun({ text: protocolo.numero_de_repeticiones || "No especificado" }),
                ],
              }),

              new Paragraph({
                children: [
                  new TextRun({ text: "Número de aplicaciones: ", bold: true }),
                  new TextRun({ text: protocolo.numero_de_aplicaciones || "No especificado" }),
                ],
              }),

              new Paragraph({
                children: [
                  new TextRun({ text: "Condición de inoculación: ", bold: true }),
                  new TextRun({ text: protocolo.condicion_de_inoculacion || "No especificado" }),
                ],
              }),

              new Paragraph({
                children: [
                  new TextRun({ text: "Nombre científico: ", bold: true }),
                  new TextRun({ text: protocolo.nombre_cientifico || "No especificado" }),
                ],
              }),

              new Paragraph({
                children: [
                  new TextRun({ text: "Unidades por repetición: ", bold: true }),
                  new TextRun({ text: protocolo.unidades_por_repeticion || "No especificado" }),
                ],
              }),

              new Paragraph({ text: "" }), // Línea en blanco
            ]),

            // Pie de página
            new Paragraph({
              text: "INFORMACIÓN ADICIONAL",
              heading: HeadingLevel.HEADING_1,
              spacing: {
                before: 600,
                after: 300,
              },
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: "Fecha de generación del informe: ",
                  bold: true,
                }),
                new TextRun({
                  text: new Date().toLocaleDateString("es-ES", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  }),
                }),
              ],
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: "Este informe muestra los protocolos del catálogo de eficacia que coinciden exactamente con los criterios configurados en el montaje.",
                  italics: true,
                }),
              ],
              spacing: { before: 200 },
            }),
          ],
        },
      ],
    });

    // Generar el blob y descargar el archivo
    const blob = await Packer.toBlob(doc);
    const fecha = new Date().toISOString().split("T")[0];
    const nombreArchivo = `Protocolos_Montaje_${montajeInfo.id}_${fecha}.docx`;
    
    saveAs(blob, nombreArchivo);
    
    return { success: true, fileName: nombreArchivo, protocolosEncontrados: protocolos.length };
  } catch (error) {
    console.error("Error al generar informe de protocolos:", error);
    return { success: false, error: "Error al generar el informe de protocolos" };
  }
};